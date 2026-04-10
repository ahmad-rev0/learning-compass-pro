import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// ── State Machine: mirrors Python agent/state_machine.py ──
const MICRO_STUCK_THRESHOLD = 3;
const QUIZ_THRESHOLD = 60;
const SCORE_DROP_THRESHOLD = 15;

interface StudentState {
  state: "normal" | "micro_stuck" | "momentum_dip" | "double_trouble";
  metrics: {
    recentScoreAvg: number;
    scoreTrend: number;
    lowScoreCount: number;
    repeatedErrors: string[];
    submissionCount: number;
  };
}

async function detectStudentState(
  supabase: ReturnType<typeof createClient>,
  studentId: string,
  currentScore: number,
  maxScore: number
): Promise<StudentState> {
  // Fetch last 10 graded submissions for pattern analysis
  const { data: recentSubs } = await supabase
    .from("submissions")
    .select("score, ai_feedback, assignments(max_score, title, type)")
    .eq("student_id", studentId)
    .eq("status", "graded")
    .order("graded_at", { ascending: false })
    .limit(10);

  const subs = recentSubs || [];
  const scorePercent = (currentScore / (maxScore || 100)) * 100;

  // Calculate metrics
  const scores = subs.map((s: any) => {
    const ms = s.assignments?.max_score || 100;
    return ((s.score || 0) / ms) * 100;
  });
  const recentScoreAvg = scores.length > 0
    ? scores.reduce((a: number, b: number) => a + b, 0) / scores.length
    : scorePercent;

  // Score trend: compare last 3 vs previous 3
  const last3 = scores.slice(0, 3);
  const prev3 = scores.slice(3, 6);
  const scoreTrend = last3.length > 0 && prev3.length > 0
    ? (last3.reduce((a: number, b: number) => a + b, 0) / last3.length) -
      (prev3.reduce((a: number, b: number) => a + b, 0) / prev3.length)
    : 0;

  // Count low scores (below 50%)
  const lowScoreCount = scores.filter((s: number) => s < 50).length;

  // Detect repeated error patterns from AI feedback
  const repeatedErrors: string[] = [];
  const errorMap: Record<string, number> = {};
  for (const sub of subs) {
    const feedback = sub.ai_feedback as any;
    if (feedback?.improvements) {
      for (const imp of feedback.improvements) {
        const key = imp.toLowerCase().slice(0, 50);
        errorMap[key] = (errorMap[key] || 0) + 1;
        if (errorMap[key] >= 2 && !repeatedErrors.includes(imp)) {
          repeatedErrors.push(imp);
        }
      }
    }
  }

  // State machine logic
  const microStuck = lowScoreCount >= MICRO_STUCK_THRESHOLD || repeatedErrors.length >= 2;
  const momentumDip = recentScoreAvg < QUIZ_THRESHOLD || scoreTrend <= -SCORE_DROP_THRESHOLD;

  let state: StudentState["state"] = "normal";
  if (microStuck && momentumDip) state = "double_trouble";
  else if (microStuck) state = "micro_stuck";
  else if (momentumDip) state = "momentum_dip";

  return {
    state,
    metrics: { recentScoreAvg, scoreTrend, lowScoreCount, repeatedErrors, submissionCount: subs.length },
  };
}

// ── Exa Search: mirrors Python exa/exa_client.py ──
async function exaSearch(
  query: string,
  exaApiKey: string,
  numResults = 3
): Promise<Array<{ title: string; url: string; snippet: string }>> {
  try {
    const response = await fetch("https://api.exa.ai/search", {
      method: "POST",
      headers: {
        "x-api-key": exaApiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query,
        num_results: numResults,
        use_autoprompt: true,
        type: "auto",
        contents: { text: { max_characters: 300 } },
      }),
    });

    if (!response.ok) {
      console.warn(`Exa search failed: ${response.status}`);
      return [];
    }

    const data = await response.json();
    return (data.results || []).map((r: any) => ({
      title: r.title || "",
      url: r.url || "",
      snippet: r.text || r.highlights?.[0] || "",
    }));
  } catch (e) {
    console.warn("Exa search error:", e);
    return [];
  }
}

// ── Quest Generation: mirrors Python gamification/quest_engine.py ──
interface QuestDef {
  title: string;
  description: string;
  type: string;
  xp_reward: number;
  resource_url: string;
  error_pattern: string;
}

async function generateAgenticQuests(
  state: StudentState,
  improvements: string[],
  assignmentTitle: string,
  momentumImpact: string,
  exaApiKey: string
): Promise<QuestDef[]> {
  const quests: QuestDef[] = [];
  const { metrics } = state;

  // Generate quests for EACH improvement, not just the first
  for (const improvement of improvements.slice(0, 4)) {
    // Build search query based on state
    let searchQuery: string;
    if (state.state === "micro_stuck") {
      searchQuery = `fix common mistake: ${improvement} tutorial`;
    } else if (state.state === "momentum_dip") {
      searchQuery = `beginner tutorial: ${improvement} step by step`;
    } else if (state.state === "double_trouble") {
      searchQuery = `recover from learning block: ${improvement} guide`;
    } else {
      searchQuery = `improve skill: ${improvement} practice`;
    }

    // Exa search for targeted resources
    const exaResults = await exaSearch(searchQuery, exaApiKey, 1);
    const topResult = exaResults[0] || { title: "", url: "", snippet: "" };

    // Quest type and XP scale with severity
    const questType = state.state === "double_trouble" || state.state === "micro_stuck"
      ? "recovery" : "growth";
    const baseXp = state.state === "double_trouble" ? 50
      : state.state === "micro_stuck" ? 40
      : state.state === "momentum_dip" ? 35 : 25;

    // Title mirrors the Python quest template style
    let title: string;
    if (state.state === "micro_stuck") {
      title = `🔧 Fix: ${improvement.slice(0, 60)}`;
    } else if (state.state === "momentum_dip") {
      title = `📚 Rediscover: ${improvement.slice(0, 55)}`;
    } else if (state.state === "double_trouble") {
      title = `🚀 Recovery: ${improvement.slice(0, 55)}`;
    } else {
      title = `✨ Improve: ${improvement.slice(0, 58)}`;
    }

    const description = topResult.snippet
      ? `Based on "${assignmentTitle}": ${improvement}. 📖 Resource: ${topResult.snippet.slice(0, 150)}`
      : `Based on "${assignmentTitle}": ${improvement}`;

    quests.push({
      title,
      description,
      type: questType,
      xp_reward: baseXp,
      resource_url: topResult.url,
      error_pattern: improvement.slice(0, 200),
    });
  }

  // Add a special quest for repeated errors across submissions
  if (metrics.repeatedErrors.length > 0) {
    const repeatedError = metrics.repeatedErrors[0];
    const exaResults = await exaSearch(
      `common recurring mistake: ${repeatedError} how to fix permanently`,
      exaApiKey, 1
    );
    const topResult = exaResults[0] || { title: "", url: "", snippet: "" };

    quests.push({
      title: `⚠️ Pattern Alert: ${repeatedError.slice(0, 50)}`,
      description: `You've made this same mistake across ${metrics.repeatedErrors.length}+ submissions. Time to master this concept! ${topResult.snippet ? `📖 ${topResult.snippet.slice(0, 120)}` : ""}`,
      type: "recovery",
      xp_reward: 60,
      resource_url: topResult.url,
      error_pattern: `RECURRING: ${repeatedError.slice(0, 180)}`,
    });
  }

  return quests;
}

// ── Main Handler ──
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
    const exaApiKey = Deno.env.get("EXA_API_KEY") || "";
    const supabase = createClient(supabaseUrl, serviceKey);

    // ── 1. Fetch submission + assignment ──
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

    // ── 2. AI Grading ──
    const systemPrompt = `You are an AI grading assistant for "Atlas", an agentic educational platform.
You evaluate student submissions fairly and provide detailed, actionable feedback.
Identify SPECIFIC weaknesses so the agent can generate targeted recovery quests.
Always return your evaluation using the grade_submission tool.`;

    const userPrompt = `Grade this submission:

**Assignment:** ${assignment.title}
**Type:** ${assignment.type}
**Description:** ${assignment.description || "No description"}
**Max Score:** ${assignment.max_score || 100}
${assignment.answer_key ? `**Answer Key:** ${JSON.stringify(assignment.answer_key)}` : ""}

**Student's Submission:**
${studentContent}

Evaluate quality, correctness, and completeness. Be specific about what needs improvement — each improvement should be a concrete, actionable skill gap (e.g. "variable scoping in loops" not "needs more practice").`;

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
                    score: { type: "number", description: `Score out of ${assignment.max_score || 100}` },
                    feedback: { type: "string", description: "Detailed feedback for the student" },
                    strengths: { type: "array", items: { type: "string" }, description: "List of strengths" },
                    improvements: {
                      type: "array",
                      items: { type: "string" },
                      description: "Specific, actionable skill gaps — each one should be a concrete topic the student needs to practice",
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
          tool_choice: { type: "function", function: { name: "grade_submission" } },
        }),
      }
    );

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, try again later" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error: ${status}`);
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No grading result from AI");
    const gradeResult = JSON.parse(toolCall.function.arguments);

    // ── 3. Update submission ──
    const finalScore = Math.min(gradeResult.score, assignment.max_score || 100);
    const { error: updateErr } = await supabase
      .from("submissions")
      .update({
        score: finalScore,
        ai_feedback: gradeResult,
        status: "graded",
        graded_at: new Date().toISOString(),
      })
      .eq("id", submission_id);
    if (updateErr) throw updateErr;

    // ── 4. State Detection (agentic) ──
    const studentState = await detectStudentState(
      supabase, submission.student_id, finalScore, assignment.max_score || 100
    );
    console.log(`Agent state: ${studentState.state}`, JSON.stringify(studentState.metrics));

    // ── 5. XP & Gamification ──
    const scorePercent = finalScore / (assignment.max_score || 100);
    const xpEarned = Math.round(scorePercent * 50) + 10;

    const { data: progress } = await supabase
      .from("gamification_progress")
      .select("*")
      .eq("user_id", submission.student_id)
      .single();

    if (progress) {
      const newXp = progress.xp + xpEarned;
      const newLevel = Math.floor(newXp / 100) + 1;

      // Momentum adjusts based on agent state, not just this submission
      let newMomentum = Number(progress.momentum_score);
      if (studentState.state === "double_trouble") {
        newMomentum = Math.max(0, newMomentum - 15);
      } else if (studentState.state === "micro_stuck") {
        newMomentum = Math.max(0, newMomentum - 8);
      } else if (studentState.state === "momentum_dip") {
        newMomentum = Math.max(0, newMomentum - 5);
      } else if (gradeResult.momentum_impact === "boost") {
        newMomentum = Math.min(100, newMomentum + 8);
      } else {
        newMomentum = Math.min(100, newMomentum + 2);
      }

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

      // Badge unlocks
      const badges: string[] = [];
      const { count: subCount } = await supabase
        .from("submissions")
        .select("*", { count: "exact", head: true })
        .eq("student_id", submission.student_id)
        .eq("status", "graded");

      if (subCount === 1) badges.push("first_submit");
      if ((subCount || 0) >= 20) badges.push("scholar");
      if (finalScore >= (assignment.max_score || 100)) badges.push("perfect");
      if (progress.streak_days + 1 >= 3) badges.push("streak_3");
      if (progress.streak_days + 1 >= 7) badges.push("streak_7");
      if (gradeResult.momentum_impact === "boost" && Number(progress.momentum_score) < 30) {
        badges.push("comeback");
      }

      for (const badgeId of badges) {
        await supabase
          .from("badge_unlocks")
          .upsert({ user_id: submission.student_id, badge_id: badgeId }, { onConflict: "user_id,badge_id" });
      }
    }

    // ── 6. Agentic Quest Generation with Exa Search ──
    let generatedQuests: QuestDef[] = [];
    if (gradeResult.improvements.length > 0 && exaApiKey) {
      generatedQuests = await generateAgenticQuests(
        studentState,
        gradeResult.improvements,
        assignment.title,
        gradeResult.momentum_impact,
        exaApiKey
      );

      for (const quest of generatedQuests) {
        await supabase.from("quests").insert({
          user_id: submission.student_id,
          title: quest.title,
          description: quest.description,
          type: quest.type,
          xp_reward: quest.xp_reward,
          resource_url: quest.resource_url,
          error_pattern: quest.error_pattern,
          generated_from: submission_id,
        });
      }

      console.log(`Agent generated ${generatedQuests.length} quests (state: ${studentState.state})`);
    } else if (gradeResult.improvements.length > 0) {
      // Fallback without Exa — still generate quests but without resource URLs
      const questTitle = `Improve: ${gradeResult.improvements[0].slice(0, 60)}`;
      await supabase.from("quests").insert({
        user_id: submission.student_id,
        title: questTitle,
        description: `Based on "${assignment.title}": ${gradeResult.improvements.join(". ")}`,
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
        agent_state: studentState.state,
        agent_metrics: studentState.metrics,
        quests_generated: generatedQuests.length,
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
