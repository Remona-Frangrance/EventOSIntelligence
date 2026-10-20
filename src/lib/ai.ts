// Rule-based "AI engine" for Event Intelligence OS — deterministic, explainable,
// runs without external keys. Powers judge matching, fair-score alerts,
// feedback summaries and personalised recommendations.

export type JudgeMatchInput = {
  judgeExpertise: string[];
  projectCategory: string;
  projectTech: string[];
};

export function judgeMatchScore(input: JudgeMatchInput): { score: number; reasons: string[] } {
  const reasons: string[] = [];
  let score = 40;
  const exp = input.judgeExpertise.map((e) => e.toLowerCase());
  const cat = input.projectCategory.toLowerCase();
  if (exp.some((e) => cat.includes(e) || e.includes(cat.split("/")[0].toLowerCase()))) {
    score += 30;
    reasons.push(`Domain overlap: ${input.projectCategory} matches judge expertise`);
  }
  const techHits = input.projectTech.filter((t) =>
    exp.some((e) => t.toLowerCase().includes(e) || e.includes(t.toLowerCase()))
  );
  if (techHits.length) {
    score += Math.min(25, techHits.length * 9);
    reasons.push(`Tech affinity: ${techHits.slice(0, 3).join(", ")}`);
  }
  if (exp.length >= 3) {
    score += 5;
    reasons.push("Broad evaluator profile — good for cross-domain projects");
  }
  if (!reasons.length) reasons.push("Generalist coverage — usable as secondary evaluator");
  return { score: Math.min(99, score), reasons };
}

export function fairScoreCheck(allTotals: number[], thisTotal: number) {
  if (allTotals.length < 3) return { flagged: false, reason: "", z: 0 };
  const mean = allTotals.reduce((a, b) => a + b, 0) / allTotals.length;
  const sd = Math.sqrt(allTotals.reduce((a, b) => a + (b - mean) ** 2, 0) / allTotals.length) || 1;
  const z = (thisTotal - mean) / sd;
  if (Math.abs(z) >= 1.8) {
    return {
      flagged: true,
      z: Math.round(z * 100) / 100,
      reason:
        z > 0
          ? `Score ${thisTotal} is ${Math.abs(z).toFixed(1)}σ above mean (${mean.toFixed(1)}) — possible generosity bias`
          : `Score ${thisTotal} is ${Math.abs(z).toFixed(1)}σ below mean (${mean.toFixed(1)}) — possible harshness bias`,
    };
  }
  return { flagged: false, reason: "", z: Math.round(z * 100) / 100 };
}

const POS = ["great", "amazing", "excellent", "love", "awesome", "impressive", "brilliant", "fantastic", "good", "innovative", "smooth", "best"];
const NEG = ["bad", "poor", "slow", "boring", "confusing", "disappoint", "worst", "issue", "problem", "crowd", "delay", "long"];
const STOP = new Set("the,a,an,and,or,to,of,in,on,for,with,was,were,is,it,this,that,very,really,so,at,our,my,we,i,you".split(","));

export function analyzeSentiment(text: string): "positive" | "neutral" | "negative" {
  const l = text.toLowerCase();
  const p = POS.filter((w) => l.includes(w)).length;
  const n = NEG.filter((w) => l.includes(w)).length;
  if (p > n) return "positive";
  if (n > p) return "negative";
  return "neutral";
}

export function summarizeFeedback(messages: string[]) {
  const freq = new Map<string, number>();
  messages.join(" ").toLowerCase().replace(/[^a-z\s]/g, "").split(/\s+/).forEach((w) => {
    if (w.length > 3 && !STOP.has(w)) freq.set(w, (freq.get(w) ?? 0) + 1);
  });
  const keywords = [...freq.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([w, c]) => ({ word: w, count: c }));
  const sentiments = messages.map(analyzeSentiment);
  const pos = sentiments.filter((s) => s === "positive").length;
  const neg = sentiments.filter((s) => s === "negative").length;
  const score = messages.length ? Math.round((pos / messages.length) * 100) : 0;
  let headline = "Feedback is mixed — dig into comments for specifics.";
  if (score >= 75) headline = "Visitors love this event — energy, projects and organisation are resonating.";
  else if (score >= 55) headline = " broadly positive with a few friction points to fix.";
  else if (messages.length && score < 40) headline = "Warning signals detected — queues, clarity or pacing need attention.";
  return { keywords, positive: pos, negative: neg, neutral: sentiments.length - pos - neg, score, headline };
}

export function recommendProjects(interests: string[], projects: { id: string; title: string; category: string; techStack: string[] }[]) {
  const li = interests.map((i) => i.toLowerCase());
  return projects
    .map((p) => {
      let s = 0;
      const reasons: string[] = [];
      if (li.some((i) => p.category.toLowerCase().includes(i) || i.includes(p.category.toLowerCase().split("/")[0]))) {
        s += 50;
        reasons.push(`Matches your interest in ${p.category}`);
      }
      const hits = p.techStack.filter((t) => li.some((i) => t.toLowerCase().includes(i) || i.includes(t.toLowerCase())));
      if (hits.length) {
        s += hits.length * 15;
        reasons.push(`Uses ${hits.slice(0, 2).join(", ")}`);
      }
      s += Math.min(10, p.title.length % 11);
      return { ...p, score: s, reasons: reasons.length ? reasons : ["Trending at this event"] };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
}
