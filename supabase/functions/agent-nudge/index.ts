import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type PerformanceSignal = {
  source: "submission" | "self_study";
  scorePct: number;
  timestamp: string;
  improvements: string[];
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { user_id } = await req.json();
    if (!user_id) {
      return new Response(JSON.stringify({ error: "user_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const lovableKey = Deno.env.get("LOVABLE_API_KEY")!;

    const [progRes, subsRes, selfStudyRes, questsRes] = await Promise.all([
      supabase.from("gamification_progress").select("*").eq("user_id", user_id).single(),
      supabase
        .from("submissions")
        .select("score, ai_feedback, graded_at, assignments(title, max_score)")
        .eq("student_id", user_id)
        .eq("status", "graded")
        .order("graded_at", { ascending: false })
        .limit(10),
      supabase
        .from("self_study_assignments")
        .select("score, subject, topic, difficulty, updated_at")
        .eq("user_id", user_id)
        .in("status", ["completed", "graded"])
        .not("score", "is", null)
        .order("updated_at", { ascending: false })
        .limit(10),
      supabase.from("quests").select("*").eq("user_id", user_id).eq("status", "active").limit(10),
    ]);

    const progress = progRes.data;
    const subs = subsRes.data || [];
    const selfStudy = selfStudyRes.data || [];
    const activeQuests = questsRes.data || [];

    if (!progress) {
      return new Response(JSON.stringify({ success: true, nudge: null }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const submissionSignals: PerformanceSignal[] = subs.map((s: any) => ({
      source: "submission",
      scorePct: ((s.score || 0) / (s.assignments?.max_score || 100)) * 100,
      timestamp: s.graded_at || new Date().toISOString(),
      improvements: Array.isArray(s.ai_feedback?.improvements) ? s.ai_feedback.improvements : [],
    }));

    const selfStudySignals: PerformanceSignal[] = selfStudy.map((s: any) => ({
      source: "self_study",
      scorePct: Number(s.score || 0),
      timestamp: s.updated_at || new Date().toISOString(),
      improvements:
        Number(s.score || 0) < 70
          ? [
              `${s.topic} fundamentals`,
              `${s.subject} ${s.difficulty} practice`,
            ]
          : [],
    }));

    const signals = [...submissionSignals, ...selfStudySignals]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10);

    const momentum = Number(progress.momentum_score);
    const scores = signals.map((s) => s.scorePct);
    const recentAvg = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 50;
    const lowScoreCount = scores.filter((score) => score < 50).length;
    const lastActivity = progress.last_activity_at ? new Date(progress.last_activity_at) : null;
    const hoursSinceActivity = lastActivity ? (Date.now() - lastActivity.getTime()) / 3600000 : 999;
    const staleQuests = activeQuests.length;

    let interventionNeeded = false;
    let interventionType = "encouragement";

    if (momentum < 25) {
      interventionNeeded = true;
      interventionType = "emergency_recovery";
    } else if (hoursSinceActivity > 48) {
      interventionNeeded = true;
      interventionType = "re_engagement";
    } else if (lowScoreCount >= 2) {
      interventionNeeded = true;
      interventionType = "skill_support";
    } else if (recentAvg <= 40) {
      interventionNeeded = true;
      interventionType = "skill_support";
    } else if (momentum < 50 && staleQuests > 3) {
      interventionNeeded = true;
      interventionType = "quest_focus";
    } else if (scores.length >= 3 && scores[0] > scores[1] && scores[1] > scores[2]) {
      interventionNeeded = true;
      interventionType = "momentum_boost";
    }

    const weaknesses = [...new Set(signals.flatMap((s) => s.improvements).filter(Boolean))].slice(0, 5);

    if (!interventionNeeded) {
      await supabase.from("agent_logs").insert({
        user_id,
        detected_state: "normal",
        confidence: 0.9,
        patterns_found: weaknesses,
        action_taken: "No intervention needed",
        reasoning: `Momentum ${momentum}%, avg score ${recentAvg.toFixed(0)}%, ${hoursSinceActivity.toFixed(0)}h since last activity. All within healthy range.`,
        metrics_snapshot: {
          momentum,
          recentAvg,
          lowScoreCount,
          hoursSinceActivity,
          staleQuests,
          signalCount: signals.length,
          selfStudyCount: selfStudySignals.length,
        },
        trigger_source: "proactive_check",
      });
      return new Response(JSON.stringify({ success: true, nudge: null, state: "healthy" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const context = `Student state:
- Momentum: ${momentum}%
- Recent avg score: ${recentAvg.toFixed(0)}%
- Low scores under 50%: ${lowScoreCount}
- Hours since last activity: ${hoursSinceActivity.toFixed(0)}
- Active quests: ${staleQuests}
- Streak: ${progress.streak_days} days
- Level: ${progress.level}
- Intervention type: ${interventionType}
- Signals considered: ${signals.length}
- Known weaknesses: ${weaknesses.slice(0, 3).join("; ") || "none"}`;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          {
            role: "system",
            content: "You are Atlas's proactive learning agent. Generate a motivating, personalized nudge for a student who needs intervention. Be specific, concise, and actionable.",
          },
          { role: "user", content: `Generate a nudge:\n${context}` },
        ],
        tools: [{
          type: "function",
          function: {
            name: "create_nudge",
            description: "Create a proactive intervention nudge",
            parameters: {
              type: "object",
              properties: {
                message: { type: "string", description: "Short motivational message (max 100 chars)" },
                action_suggestion: { type: "string", description: "Specific action the student should take" },
                quest_title: { type: "string", description: "Optional quest to generate for the student" },
                quest_description: { type: "string", description: "Quest details" },
                xp_bonus: { type: "number", description: "Bonus XP for acting on this nudge (10-50)" },
                urgency: { type: "string", enum: ["low", "medium", "high"], description: "How urgent is this intervention" },
              },
              required: ["message", "action_suggestion", "quest_title", "quest_description", "xp_bonus", "urgency"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "create_nudge" } },
      }),
    });

    if (!aiRes.ok) throw new Error(`AI error: ${aiRes.status}`);
    const aiData = await aiRes.json();
    const tc = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!tc) throw new Error("No nudge from AI");
    const nudge = JSON.parse(tc.function.arguments);

    if (nudge.quest_title) {
      await supabase.from("quests").insert({
        user_id,
        title: `🔔 ${nudge.quest_title}`,
        description: nudge.quest_description,
        type: interventionType === "emergency_recovery" || interventionType === "skill_support" ? "recovery" : "growth",
        xp_reward: nudge.xp_bonus,
        error_pattern: weaknesses[0] || null,
      });
    }

    const confidence = interventionType === "emergency_recovery"
      ? 0.95
      : interventionType === "re_engagement"
        ? 0.9
        : interventionType === "skill_support"
          ? 0.88
          : 0.7;

    await supabase.from("agent_logs").insert({
      user_id,
      detected_state: interventionType,
      confidence,
      patterns_found: weaknesses.slice(0, 3),
      action_taken: `Proactive nudge: ${nudge.message}`,
      reasoning: `Triggered ${interventionType} intervention. ${nudge.action_suggestion}`,
      metrics_snapshot: {
        momentum,
        recentAvg,
        lowScoreCount,
        hoursSinceActivity,
        staleQuests,
        streak: progress.streak_days,
        signalCount: signals.length,
        selfStudyCount: selfStudySignals.length,
      },
      trigger_source: "proactive_check",
    });

    return new Response(JSON.stringify({ success: true, nudge, intervention_type: interventionType }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("agent-nudge error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
