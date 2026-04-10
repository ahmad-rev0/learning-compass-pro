import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function exaSearch(query: string, exaApiKey: string): Promise<{ title: string; url: string; snippet: string }> {
  try {
    const res = await fetch("https://api.exa.ai/search", {
      method: "POST",
      headers: { "x-api-key": exaApiKey, "Content-Type": "application/json" },
      body: JSON.stringify({ query, num_results: 1, use_autoprompt: true, type: "auto", contents: { text: { max_characters: 200 } } }),
    });
    if (!res.ok) return { title: "", url: "", snippet: "" };
    const d = await res.json();
    const r = d.results?.[0];
    return r ? { title: r.title || "", url: r.url || "", snippet: r.text || "" } : { title: "", url: "", snippet: "" };
  } catch { return { title: "", url: "", snippet: "" }; }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { user_id } = await req.json();
    if (!user_id) return new Response(JSON.stringify({ error: "user_id required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const lovableKey = Deno.env.get("LOVABLE_API_KEY")!;
    const exaApiKey = Deno.env.get("EXA_API_KEY") || "";

    // Gather student data
    const [subsRes, progRes, questsRes] = await Promise.all([
      supabase.from("submissions").select("score, ai_feedback, assignments(title, type, max_score)").eq("student_id", user_id).eq("status", "graded").order("graded_at", { ascending: false }).limit(20),
      supabase.from("gamification_progress").select("*").eq("user_id", user_id).single(),
      supabase.from("quests").select("title, type, status").eq("user_id", user_id).limit(50),
    ]);

    const subs = subsRes.data || [];
    const progress = progRes.data;
    const quests = questsRes.data || [];

    if (subs.length === 0) {
      return new Response(JSON.stringify({ success: true, plan: null, message: "Need submissions first" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Build profile
    const scores = subs.map((s: any) => ((s.score || 0) / (s.assignments?.max_score || 100)) * 100);
    const avgScore = scores.reduce((a: number, b: number) => a + b, 0) / scores.length;
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    for (const s of subs) {
      const fb = s.ai_feedback as any;
      if (fb?.strengths) strengths.push(...fb.strengths);
      if (fb?.improvements) weaknesses.push(...fb.improvements);
    }
    const types = [...new Set(subs.map((s: any) => s.assignments?.type))];
    const completedQuests = quests.filter((q: any) => q.status === "completed").length;

    const profile = `Student: Level ${progress?.level || 1}, ${progress?.xp || 0} XP, Momentum ${progress?.momentum_score || 50}%, Streak ${progress?.streak_days || 0} days.
${subs.length} submissions, avg ${avgScore.toFixed(0)}%. Types: ${types.join(", ")}.
Completed ${completedQuests}/${quests.length} quests.
Strengths: ${[...new Set(strengths)].slice(0, 5).join("; ") || "none yet"}
Weaknesses: ${[...new Set(weaknesses)].slice(0, 5).join("; ") || "none yet"}`;

    // AI generates study plan
    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${lovableKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: `You are an agentic study plan generator for Atlas. Create a personalized weekly study plan that:
1. Prioritizes the student's specific weaknesses
2. Builds on their strengths  
3. Adapts difficulty to their level
4. Includes specific topics and milestones
Explain your reasoning for why this plan was chosen.` },
          { role: "user", content: `Generate a weekly study plan:\n${profile}` },
        ],
        tools: [{
          type: "function",
          function: {
            name: "create_study_plan",
            description: "Create a personalized weekly study plan",
            parameters: {
              type: "object",
              properties: {
                title: { type: "string", description: "Motivating plan title" },
                difficulty_level: { type: "string", enum: ["beginner", "intermediate", "advanced"] },
                reasoning: { type: "string", description: "Why this plan was designed this way for this student" },
                topics: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      day: { type: "string", description: "Day of week" },
                      topic: { type: "string", description: "What to study" },
                      focus: { type: "string", enum: ["weakness", "strength", "exploration"] },
                      duration_min: { type: "number" },
                      search_query: { type: "string", description: "Web search for best resource" },
                    },
                    required: ["day", "topic", "focus", "duration_min", "search_query"],
                    additionalProperties: false,
                  },
                },
                milestones: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      title: { type: "string" },
                      description: { type: "string" },
                      xp_bonus: { type: "number" },
                    },
                    required: ["title", "description", "xp_bonus"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["title", "difficulty_level", "reasoning", "topics", "milestones"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "create_study_plan" } },
      }),
    });

    if (!aiRes.ok) {
      if (aiRes.status === 429) return new Response(JSON.stringify({ error: "Rate limited" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (aiRes.status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error(`AI error: ${aiRes.status}`);
    }

    const aiData = await aiRes.json();
    const tc = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!tc) throw new Error("No plan from AI");
    const plan = JSON.parse(tc.function.arguments);

    // Exa search for resources per topic
    if (exaApiKey) {
      for (const topic of plan.topics) {
        const exa = await exaSearch(topic.search_query, exaApiKey);
        topic.resource_url = exa.url;
        topic.resource_title = exa.title;
      }
    }

    // Get current Monday
    const now = new Date();
    const monday = new Date(now);
    monday.setDate(now.getDate() - now.getDay() + 1);

    const { error } = await supabase.from("study_plans").insert({
      user_id,
      week_start: monday.toISOString().split("T")[0],
      title: plan.title,
      topics: plan.topics,
      milestones: plan.milestones,
      difficulty_level: plan.difficulty_level,
      agent_reasoning: plan.reasoning,
    });
    if (error) throw error;

    // Log agent decision
    await supabase.from("agent_logs").insert({
      user_id,
      detected_state: avgScore < 50 ? "momentum_dip" : "normal",
      confidence: 0.85,
      patterns_found: [...new Set(weaknesses)].slice(0, 3),
      action_taken: `Generated study plan: ${plan.title}`,
      reasoning: plan.reasoning,
      metrics_snapshot: { avgScore, level: progress?.level, momentum: progress?.momentum_score, streak: progress?.streak_days },
      trigger_source: "study_plan",
    });

    return new Response(JSON.stringify({ success: true, plan }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("generate-study-plan error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
