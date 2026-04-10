import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  try {
    const { submission_id } = await req.json();
    if (!submission_id) {
      return new Response(JSON.stringify({ error: "submission_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableKey = Deno.env.get("LOVABLE_API_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Fetch submission + assignment
    const { data: submission, error: subErr } = await supabase
      .from("submissions")
      .select("*, assignments(title, description, type, max_score, answer_key)")
      .eq("id", submission_id)
      .single();

    if (subErr || !submission) {
      return new Response(
        JSON.stringify({ error: "Submission not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const assignment = submission.assignments;
    const studentContent = submission.content || "(file upload - no text content)";

    const systemPrompt = `You are an AI grading assistant for an educational platform called "Atlas". 
You evaluate student submissions fairly and provide constructive feedback.
Always return your evaluation using the grade_submission tool.`;

    const userPrompt = `Grade this submission:

**Assignment:** ${assignment.title}
**Type:** ${assignment.type}
**Description:** ${assignment.description || "No description"}
**Max Score:** ${assignment.max_score || 100}
${assignment.answer_key ? `**Answer Key:** ${JSON.stringify(assignment.answer_key)}` : ""}

**Student's Submission:**
${studentContent}

Evaluate the quality, correctness, and completeness. Be encouraging but honest.`;

    const aiResponse = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${lovableKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "grade_submission",
                description: "Provide a grade and feedback for the student submission",
                parameters: {
                  type: "object",
                  properties: {
                    score: {
                      type: "number",
                      description: `Score out of ${assignment.max_score || 100}`,
                    },
                    feedback: {
                      type: "string",
                      description: "Detailed feedback for the student",
                    },
                    strengths: {
                      type: "array",
                      items: { type: "string" },
                      description: "List of strengths in the submission",
                    },
                    improvements: {
                      type: "array",
                      items: { type: "string" },
                      description: "Suggested improvements",
                    },
                    momentum_impact: {
                      type: "string",
                      enum: ["boost", "maintain", "concern"],
                      description: "How this affects student momentum",
                    },
                  },
                  required: ["score", "feedback", "strengths", "improvements", "momentum_impact"],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: {
            type: "function",
            function: { name: "grade_submission" },
          },
        }),
      }
    );

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, try again later" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error: ${status}`);
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No grading result from AI");

    const gradeResult = JSON.parse(toolCall.function.arguments);

    // Update submission with AI feedback
    const { error: updateErr } = await supabase
      .from("submissions")
      .update({
        score: Math.min(gradeResult.score, assignment.max_score || 100),
        ai_feedback: gradeResult,
        status: "graded",
        graded_at: new Date().toISOString(),
      })
      .eq("id", submission_id);

    if (updateErr) throw updateErr;

    // Award XP based on score percentage
    const scorePercent = gradeResult.score / (assignment.max_score || 100);
    const xpEarned = Math.round(scorePercent * 50) + 10; // 10-60 XP per submission

    const { data: progress } = await supabase
      .from("gamification_progress")
      .select("*")
      .eq("user_id", submission.student_id)
      .single();

    if (progress) {
      const newXp = progress.xp + xpEarned;
      const newLevel = Math.floor(newXp / 100) + 1;
      const newMomentum = gradeResult.momentum_impact === "boost"
        ? Math.min(100, Number(progress.momentum_score) + 5)
        : gradeResult.momentum_impact === "concern"
          ? Math.max(0, Number(progress.momentum_score) - 10)
          : Number(progress.momentum_score);

      await supabase
        .from("gamification_progress")
        .update({
          xp: newXp,
          level: newLevel,
          momentum_score: newMomentum,
          last_activity_at: new Date().toISOString(),
          streak_days: progress.streak_days + 1,
        })
        .eq("user_id", submission.student_id);

      // Check badge unlocks
      const badges: string[] = [];

      // First submission badge
      const { count: subCount } = await supabase
        .from("submissions")
        .select("*", { count: "exact", head: true })
        .eq("student_id", submission.student_id)
        .eq("status", "graded");

      if (subCount === 1) badges.push("first_submit");
      if ((subCount || 0) >= 20) badges.push("scholar");
      if (gradeResult.score >= (assignment.max_score || 100)) badges.push("perfect");
      if (progress.streak_days + 1 >= 3) badges.push("streak_3");
      if (progress.streak_days + 1 >= 7) badges.push("streak_7");
      if (gradeResult.momentum_impact === "boost" && Number(progress.momentum_score) < 30) {
        badges.push("comeback");
      }

      // Insert badge unlocks (ignore duplicates)
      for (const badgeId of badges) {
        await supabase
          .from("badge_unlocks")
          .upsert({ user_id: submission.student_id, badge_id: badgeId }, { onConflict: "user_id,badge_id" });
      }
    }

    // Generate a quest based on AI feedback
    if (gradeResult.improvements.length > 0) {
      const questTitle = `Improve: ${gradeResult.improvements[0].slice(0, 60)}`;
      await supabase.from("quests").insert({
        user_id: submission.student_id,
        title: questTitle,
        description: `Based on your submission for "${assignment.title}": ${gradeResult.improvements.join(". ")}`,
        type: gradeResult.momentum_impact === "concern" ? "recovery" : "growth",
        xp_reward: gradeResult.momentum_impact === "concern" ? 40 : 25,
        generated_from: submission_id,
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        grade: gradeResult,
        xp_earned: xpEarned,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("grade-submission error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
