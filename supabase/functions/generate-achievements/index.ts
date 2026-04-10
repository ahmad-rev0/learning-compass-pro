import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// ── Exa search for achievement resources ──
async function exaSearch(
  query: string,
  exaApiKey: string
): Promise<{ title: string; url: string; snippet: string }> {
  try {
    const response = await fetch("https://api.exa.ai/search", {
      method: "POST",
      headers: { "x-api-key": exaApiKey, "Content-Type": "application/json" },
      body: JSON.stringify({
        query,
        num_results: 1,
        use_autoprompt: true,
        type: "auto",
        contents: { text: { max_characters: 200 } },
      }),
    });
    if (!response.ok) return { title: "", url: "", snippet: "" };
    const data = await response.json();
    const r = data.results?.[0];
    return r ? { title: r.title || "", url: r.url || "", snippet: r.text || "" } : { title: "", url: "", snippet: "" };
  } catch {
    return { title: "", url: "", snippet: "" };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { user_id } = await req.json();
    if (!user_id) {
      return new Response(JSON.stringify({ error: "user_id required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const lovableKey = Deno.env.get("LOVABLE_API_KEY")!;
    const exaApiKey = Deno.env.get("EXA_API_KEY") || "";

    // ── 1. Gather student data for analysis ──
    const [subsResult, progressResult, questsResult, existingResult] = await Promise.all([
      supabase
        .from("submissions")
        .select("score, ai_feedback, assignments(title, type, max_score)")
        .eq("student_id", user_id)
        .eq("status", "graded")
        .order("graded_at", { ascending: false })
        .limit(20),
      supabase
        .from("gamification_progress")
        .select("*")
        .eq("user_id", user_id)
        .single(),
      supabase
        .from("quests")
        .select("title, type, status")
        .eq("user_id", user_id)
        .limit(50),
      supabase
        .from("generated_achievements")
        .select("title")
        .eq("user_id", user_id),
    ]);

    const submissions = subsResult.data || [];
    const progress = progressResult.data;
    const quests = questsResult.data || [];
    const existingAchievements = new Set((existingResult.data || []).map((a: any) => a.title));

    if (submissions.length === 0) {
      return new Response(
        JSON.stringify({ success: true, achievements: [], message: "No submissions to analyze yet" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── 2. Build student profile summary for AI ──
    const scores = submissions.map((s: any) => {
      const ms = s.assignments?.max_score || 100;
      return { pct: ((s.score || 0) / ms) * 100, type: s.assignments?.type, title: s.assignments?.title };
    });
    const avgScore = scores.reduce((a: number, b: any) => a + b.pct, 0) / scores.length;

    const strengths: string[] = [];
    const weaknesses: string[] = [];
    for (const sub of submissions) {
      const fb = sub.ai_feedback as any;
      if (fb?.strengths) strengths.push(...fb.strengths);
      if (fb?.improvements) weaknesses.push(...fb.improvements);
    }

    // Deduplicate
    const topStrengths = [...new Set(strengths)].slice(0, 5);
    const topWeaknesses = [...new Set(weaknesses)].slice(0, 5);
    const completedQuests = quests.filter((q: any) => q.status === "completed").length;
    const assignmentTypes = [...new Set(scores.map((s: any) => s.type))];

    const studentProfile = `
Student Profile:
- ${submissions.length} graded submissions, avg score: ${avgScore.toFixed(1)}%
- Level: ${progress?.level || 1}, XP: ${progress?.xp || 0}, Momentum: ${progress?.momentum_score || 50}
- Streak: ${progress?.streak_days || 0} days
- Completed ${completedQuests}/${quests.length} quests
- Assignment types attempted: ${assignmentTypes.join(", ")}
- Key strengths: ${topStrengths.join("; ") || "none identified yet"}
- Key weaknesses: ${topWeaknesses.join("; ") || "none identified yet"}
- Already earned achievements: ${[...existingAchievements].join(", ") || "none"}
`;

    // ── 3. AI generates personalized achievements ──
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${lovableKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `You are an agentic achievement generator for "Atlas", a gamified educational platform.
Analyze the student's profile and generate personalized achievements that:
1. Target their SPECIFIC weaknesses as skill-building challenges
2. Celebrate their unique strengths with mastery badges
3. Encourage growth in areas they haven't explored yet
4. Scale difficulty based on their current level and performance

Each achievement should feel personal — NOT generic. Reference actual topics and skills from their data.
Use the generate_achievements tool to return exactly 3-5 achievements.`,
          },
          { role: "user", content: `Generate personalized achievements for this student:\n${studentProfile}` },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "generate_achievements",
              description: "Generate personalized achievements tailored to this student",
              parameters: {
                type: "object",
                properties: {
                  achievements: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string", description: "Short catchy achievement name (max 40 chars)" },
                        description: { type: "string", description: "What the student needs to do to earn this, specific to their weaknesses/strengths" },
                        emoji: { type: "string", description: "Single emoji that represents this achievement" },
                        category: { type: "string", enum: ["weakness_buster", "strength_mastery", "exploration", "consistency", "comeback"], description: "What type of growth this targets" },
                        difficulty: { type: "string", enum: ["bronze", "silver", "gold", "diamond"], description: "Based on student's current level" },
                        search_query: { type: "string", description: "A web search query to find the best learning resource for this achievement" },
                        xp_reward: { type: "number", description: "XP reward, 20-100 scaled by difficulty" },
                      },
                      required: ["title", "description", "emoji", "category", "difficulty", "search_query", "xp_reward"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["achievements"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "generate_achievements" } },
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      if (status === 429) return new Response(JSON.stringify({ error: "Rate limited" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error(`AI gateway error: ${status}`);
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No achievements from AI");
    const result = JSON.parse(toolCall.function.arguments);

    // ── 4. Exa search for each achievement resource ──
    const achievements = [];
    for (const ach of result.achievements) {
      // Skip duplicates
      if (existingAchievements.has(ach.title)) continue;

      let resourceUrl = "";
      if (exaApiKey) {
        const exa = await exaSearch(ach.search_query, exaApiKey);
        resourceUrl = exa.url;
      }

      const row = {
        user_id,
        title: ach.title,
        description: ach.description,
        emoji: ach.emoji,
        category: ach.category,
        difficulty: ach.difficulty,
        xp_reward: ach.xp_reward,
        resource_url: resourceUrl,
        criteria_met: ach.search_query,
      };

      const { error } = await supabase.from("generated_achievements").insert(row);
      if (!error) achievements.push(row);
    }

    console.log(`Agent generated ${achievements.length} personalized achievements for ${user_id}`);

    return new Response(
      JSON.stringify({ success: true, achievements, count: achievements.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("generate-achievements error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
