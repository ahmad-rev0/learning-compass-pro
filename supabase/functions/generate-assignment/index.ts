import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) throw new Error("Unauthorized");

    const body = await req.json();
    const { mode, subject, topic, type, difficulty } = body;

    let assignmentSubject = subject || "";
    let assignmentTopic = topic || "";
    let assignmentType = type || "mcq";
    let assignmentDifficulty = difficulty || "intermediate";

    // For one-click mode, analyze student weaknesses
    if (mode === "one_click") {
      const { data: recentSubs } = await supabase
        .from("submissions")
        .select("score, ai_feedback, assignments(title, type, max_score)")
        .eq("student_id", user.id)
        .eq("status", "graded")
        .order("graded_at", { ascending: false })
        .limit(10);

      const { data: recentQuests } = await supabase
        .from("quests")
        .select("title, type, error_pattern, status")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5);

      const { data: gamification } = await supabase
        .from("gamification_progress")
        .select("level, momentum_score, xp")
        .eq("user_id", user.id)
        .single();

      // Build context for AI to decide what to generate
      const weaknessContext = JSON.stringify({
        recentSubmissions: recentSubs || [],
        recentQuests: recentQuests || [],
        gamification: gamification || { level: 1, momentum_score: 50 },
      });

      // Ask AI to decide subject/topic/type/difficulty
      const decisionRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            {
              role: "system",
              content: `You are an AI teaching agent that analyzes student performance data to identify areas needing improvement.
Based on the student data, decide what kind of assignment to generate.
You MUST respond with a JSON object with these exact keys:
- subject: the academic subject area
- topic: the specific topic to practice  
- type: one of "mcq", "free_text", or "code"
- difficulty: one of "beginner", "intermediate", or "advanced"
- reasoning: a brief explanation of why you chose this

Respond ONLY with valid JSON, no markdown.`,
            },
            {
              role: "user",
              content: `Here is the student's recent performance data:\n${weaknessContext}`,
            },
          ],
          tools: [{
            type: "function",
            function: {
              name: "decide_assignment",
              description: "Decide what assignment to generate based on student data",
              parameters: {
                type: "object",
                properties: {
                  subject: { type: "string" },
                  topic: { type: "string" },
                  type: { type: "string", enum: ["mcq", "free_text", "code"] },
                  difficulty: { type: "string", enum: ["beginner", "intermediate", "advanced"] },
                  reasoning: { type: "string" },
                },
                required: ["subject", "topic", "type", "difficulty", "reasoning"],
              },
            },
          }],
          tool_choice: { type: "function", function: { name: "decide_assignment" } },
        }),
      });

      if (!decisionRes.ok) {
        const errText = await decisionRes.text();
        console.error("AI decision error:", decisionRes.status, errText);
        // Fallback defaults
        assignmentSubject = "General Knowledge";
        assignmentTopic = "Mixed Review";
        assignmentType = "mcq";
        assignmentDifficulty = "intermediate";
      } else {
        const decisionData = await decisionRes.json();
        try {
          const toolCall = decisionData.choices?.[0]?.message?.tool_calls?.[0];
          const decision = JSON.parse(toolCall?.function?.arguments || "{}");
          assignmentSubject = decision.subject || "General Knowledge";
          assignmentTopic = decision.topic || "Mixed Review";
          assignmentType = decision.type || "mcq";
          assignmentDifficulty = decision.difficulty || "intermediate";
        } catch {
          assignmentSubject = "General Knowledge";
          assignmentTopic = "Mixed Review";
        }
      }
    }

    // Generate the actual assignment content
    const typeInstructions: Record<string, string> = {
      mcq: `Generate a multiple-choice quiz with 5 questions. Each question should have 4 options (A, B, C, D) and one correct answer.
Return JSON: { "title": "...", "questions": [{ "question": "...", "options": ["A. ...", "B. ...", "C. ...", "D. ..."], "correct": "A", "explanation": "..." }] }`,
      free_text: `Generate 3 open-ended questions that test deep understanding. Each should require a paragraph-length response.
Return JSON: { "title": "...", "questions": [{ "question": "...", "rubric": "...", "sample_answer": "..." }] }`,
      code: `Generate 2 coding challenges appropriate for the difficulty level. Include test cases.
Return JSON: { "title": "...", "challenges": [{ "problem": "...", "language": "python", "starter_code": "...", "test_cases": [{ "input": "...", "expected_output": "..." }], "hint": "..." }] }`,
    };

    const contentRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `You are an expert AI teacher creating a ${assignmentDifficulty}-level ${assignmentType} assignment on ${assignmentSubject}: ${assignmentTopic}.
${typeInstructions[assignmentType] || typeInstructions.mcq}
Respond ONLY with the JSON object, no markdown code blocks.`,
          },
          {
            role: "user",
            content: `Create a ${assignmentDifficulty} ${assignmentType} assignment about "${assignmentTopic}" in ${assignmentSubject}.`,
          },
        ],
      }),
    });

    if (!contentRes.ok) {
      if (contentRes.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (contentRes.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI content generation failed: ${contentRes.status}`);
    }

    const contentData = await contentRes.json();
    let contentText = contentData.choices?.[0]?.message?.content || "{}";
    
    // Strip markdown code blocks if present
    contentText = contentText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    
    let assignmentContent;
    try {
      assignmentContent = JSON.parse(contentText);
    } catch {
      assignmentContent = { title: `${assignmentTopic} Practice`, raw: contentText };
    }

    const assignmentTitle = assignmentContent.title || `${assignmentTopic} - ${assignmentType.toUpperCase()}`;

    // Calculate XP based on difficulty
    const xpMap: Record<string, number> = { beginner: 15, intermediate: 25, advanced: 40 };
    const xpReward = xpMap[assignmentDifficulty] || 25;

    // Save to database
    const { data: saved, error: saveError } = await supabase
      .from("self_study_assignments")
      .insert({
        user_id: user.id,
        subject: assignmentSubject,
        topic: assignmentTopic,
        type: assignmentType,
        difficulty: assignmentDifficulty,
        content: assignmentContent,
        status: "pending",
        generated_by: mode === "one_click" ? "one_click" : "request_form",
        xp_reward: xpReward,
      })
      .select()
      .single();

    if (saveError) {
      console.error("Save error:", saveError);
      throw new Error("Failed to save assignment");
    }

    return new Response(
      JSON.stringify({
        success: true,
        assignment: saved,
        title: assignmentTitle,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("generate-assignment error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
