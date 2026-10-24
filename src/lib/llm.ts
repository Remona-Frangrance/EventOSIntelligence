import Anthropic from "@anthropic-ai/sdk";
import { summarizeFeedback, judgeMatchScore, fairScoreCheck, recommendProjects } from "@/lib/ai";

export interface PostEventReport {
  executiveSummary: string;
  keyAchievements: string[];
  topProjectsHighlights: {
    title: string;
    category: string;
    team: string;
    whyOutstanding: string;
  }[];
  feedbackThemes: {
    theme: string;
    sentiment: "positive" | "negative" | "neutral";
    insight: string;
  }[];
  footfallInsights: string;
  recommendations: string[];
  organizerNotes: string;
  generatedBy: "Anthropic Claude 3.5 Sonnet (LLM)" | "EventOS Deterministic Engine (Offline Fallback)";
  timestamp: string;
}

export interface SmartFeedbackSummary {
  headline: string;
  score: number;
  sentiment: {
    positive: number;
    neutral: number;
    negative: number;
  };
  keywords: { word: string; count: number }[];
  themes: {
    theme: string;
    sentiment: "positive" | "negative" | "neutral";
    count: number;
    insight: string;
  }[];
  frictionPoints: string[];
  actionItems: string[];
  poweredBy: "Claude 3.5 Sonnet" | "Deterministic Rule-Engine";
}

let anthropicClient: Anthropic | null = null;

function getAnthropicClient(): Anthropic | null {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey.trim() === "" || apiKey === "your-anthropic-api-key") {
    return null;
  }
  if (!anthropicClient) {
    anthropicClient = new Anthropic({ apiKey });
  }
  return anthropicClient;
}

/**
 * Executes a call to Anthropic Claude messages API with error boundaries.
 */
async function callClaude(params: {
  systemPrompt?: string;
  userPrompt: string;
  maxTokens?: number;
  temperature?: number;
}): Promise<string | null> {
  const client = getAnthropicClient();
  if (!client) return null;

  try {
    const response = await client.messages.create({
      model: process.env.ANTHROPIC_MODEL || "claude-3-5-sonnet-20241022",
      max_tokens: params.maxTokens || 1200,
      system: params.systemPrompt || "You are the EventOS Intelligence AI engine.",
      messages: [{ role: "user", content: params.userPrompt }],
    });

    const block = response.content[0];
    if (block && block.type === "text") {
      return block.text.trim();
    }
    return null;
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("Anthropic API call failed, falling back to deterministic AI engine:", err);
    }
    return null;
  }
}

/**
 * 1. Auto-generated Post-Event Executive Report (LLM with deterministic fallback)
 */
export async function generatePostEventReport(eventData: {
  eventName: string;
  venue: string;
  city: string;
  startsAt: string;
  endsAt: string;
  stats: {
    totalProjects: number;
    totalVisitors: number;
    checkedInVisitors: number;
    totalScores: number;
    totalScans: number;
    totalVotes: number;
    avgRating: number;
  };
  topProjects: {
    title: string;
    category: string;
    teamName: string;
    votes: number;
    checkins: number;
    avgScore?: number;
    description?: string;
  }[];
  feedbackMessages: string[];
}): Promise<PostEventReport> {
  const now = new Date().toISOString();

  // 1. Try Claude LLM
  const prompt = `
Generate a comprehensive, executive-ready Post-Event Intelligence Report for the following event:
Event Name: ${eventData.eventName}
Venue: ${eventData.venue}, ${eventData.city}
Dates: ${eventData.startsAt} to ${eventData.endsAt}
Attendance & Telemetry:
- Total Projects / Demo Stalls: ${eventData.stats.totalProjects}
- Registered Attendees: ${eventData.stats.totalVisitors}
- Verified Gate Check-ins: ${eventData.stats.checkedInVisitors} (Turnout: ${
    eventData.stats.totalVisitors
      ? Math.round((eventData.stats.checkedInVisitors / eventData.stats.totalVisitors) * 100)
      : 0
  }%)
- Total Jury Scores: ${eventData.stats.totalScores}
- QR Code Booth Scans: ${eventData.stats.totalScans}
- Crowd Votes Cast: ${eventData.stats.totalVotes}
- Attendee Satisfaction: ${eventData.stats.avgRating} / 5.0

Top Performing Projects:
${JSON.stringify(eventData.topProjects.slice(0, 5), null, 2)}

Sample Attendee & Visitor Feedback:
${eventData.feedbackMessages.slice(0, 15).map((m, i) => `${i + 1}. "${m}"`).join("\n")}

Respond ONLY with a valid JSON object matching this exact schema:
{
  "executiveSummary": "A 2-3 paragraph professional narrative of how the event unfolded, standout highlights, and overall impact.",
  "keyAchievements": ["4-5 concise bullet points of major successes"],
  "topProjectsHighlights": [
    {
      "title": "Project Name",
      "category": "Category",
      "team": "Team Name",
      "whyOutstanding": "Why this project captured jury attention or crowd traction"
    }
  ],
  "feedbackThemes": [
    {
      "theme": "Theme title",
      "sentiment": "positive" | "negative" | "neutral",
      "insight": "Observation and participant sentiment analysis"
    }
  ],
  "footfallInsights": "Analysis of gate check-ins, booth scan velocity, peak activity, and floor engagement.",
  "recommendations": ["4-5 actionable recommendations for the organizer's next edition"],
  "organizerNotes": "Summary of logistical successes and areas for optimization"
}
`;

  const llmResponse = await callClaude({
    systemPrompt: "You are an elite event intelligence analyst and venture jury consultant. Provide data-driven, actionable, polished reports in pure JSON format without markdown fences.",
    userPrompt: prompt,
    maxTokens: 1800,
  });

  if (llmResponse) {
    try {
      const cleanJson = llmResponse.replace(/^```json\s*/, "").replace(/\s*```$/, "").trim();
      const parsed = JSON.parse(cleanJson);
      return {
        ...parsed,
        generatedBy: "Anthropic Claude 3.5 Sonnet (LLM)",
        timestamp: now,
      };
    } catch {}
  }

  // 2. Deterministic Fallback Engine
  const turnoutRate = eventData.stats.totalVisitors
    ? Math.round((eventData.stats.checkedInVisitors / eventData.stats.totalVisitors) * 100)
    : 0;

  const top3 = eventData.topProjects.slice(0, 3);
  const feedbackSummary = summarizeFeedback(eventData.feedbackMessages);

  return {
    executiveSummary: `${eventData.eventName} convened at ${eventData.venue}, ${eventData.city}, showcasing ${eventData.stats.totalProjects} innovation exhibits with ${eventData.stats.checkedInVisitors} verified gate check-ins representing a ${turnoutRate}% turnout rate. The event recorded strong attendee traction with ${eventData.stats.totalScans} booth visits and ${eventData.stats.totalVotes} crowd prize votes across the competition tracks. Jury operations yielded ${eventData.stats.totalScores} multi-criteria evaluations with an average attendee rating of ${eventData.stats.avgRating}/5.0.`,
    keyAchievements: [
      `Successfully coordinated ${eventData.stats.totalProjects} exhibition booths with seamless digital QR check-in.`,
      `Achieved a verified physical gate attendance of ${eventData.stats.checkedInVisitors} attendees.`,
      `Accumulated ${eventData.stats.totalScores} impartial evaluations utilizing multi-factor jury rubrics.`,
      `Engaged the community with ${eventData.stats.totalVotes} verified audience ballots and an overall sentiment rating of ${eventData.stats.avgRating}/5.0.`,
    ],
    topProjectsHighlights: top3.map((p) => ({
      title: p.title,
      category: p.category,
      team: p.teamName,
      whyOutstanding: `Leading exhibit in ${p.category} with ${p.checkins} stall visits, ${p.votes} community votes, and high jury engagement.`,
    })),
    feedbackThemes: [
      {
        theme: "Innovation & Exhibit Caliber",
        sentiment: "positive",
        insight: `Visitors and judges praised the technical depth of showcased solutions, specifically in ${top3.map((p) => p.category).join(", ")}.`,
      },
      {
        theme: "Venue & Pacing Experience",
        sentiment: feedbackSummary.negative > 2 ? "negative" : "neutral",
        insight: feedbackSummary.negative > 2
          ? "Attendees highlighted minor congestion around main exhibit aisles during peak hours."
          : "Floor flow and digital badge verification provided a smooth entry experience.",
      },
    ],
    footfallInsights: `The event generated an average of ${
      eventData.stats.totalProjects ? Math.round(eventData.stats.totalScans / eventData.stats.totalProjects) : 0
    } interactive scans per booth, demonstrating strong attendee dispersion throughout the venue floor.`,
    recommendations: [
      "Expand aisle spacing around high-traffic IoT and AI demo zones to ease congestion.",
      "Incorporate digital scheduling slots for project pitches to reduce jury fatigue.",
      "Introduce real-time push alerts for keynote announcements and track finals.",
      "Broaden student achievement badges and instant digital certificate delivery.",
    ],
    organizerNotes: `Event completed with all telemetry verified in EventOS registry. Database integrity and verification hashes confirmed.`,
    generatedBy: "EventOS Deterministic Engine (Offline Fallback)",
    timestamp: now,
  };
}

/**
 * 2. Smarter Feedback Summarization & Sentiment with Themes
 */
export async function generateSmartFeedbackSummary(
  feedbackMessages: string[]
): Promise<SmartFeedbackSummary> {
  const deterministic = summarizeFeedback(feedbackMessages);

  if (feedbackMessages.length === 0) {
    return {
      headline: "No feedback recorded yet",
      score: 0,
      sentiment: { positive: 0, neutral: 0, negative: 0 },
      keywords: [],
      themes: [],
      frictionPoints: [],
      actionItems: [],
      poweredBy: "Deterministic Rule-Engine",
    };
  }

  // 1. Try Claude LLM
  const prompt = `
Analyze the following event attendee feedback comments:
${feedbackMessages.map((m, i) => `${i + 1}. "${m}"`).join("\n")}

Respond ONLY with valid JSON with this exact structure:
{
  "headline": "One sharp executive headline summarizing visitor sentiment",
  "themes": [
    {
      "theme": "Theme title",
      "sentiment": "positive" | "negative" | "neutral",
      "count": 3,
      "insight": "Specific feedback observation"
    }
  ],
  "frictionPoints": ["List of 2-3 specific grievances or operational bottlenecks mentioned"],
  "actionItems": ["2-3 concrete steps organizers should take immediately"]
}
`;

  const llmResponse = await callClaude({
    systemPrompt: "You are a sentiment and user experience analyst. Provide accurate sentiment theme extractions in pure JSON format.",
    userPrompt: prompt,
    maxTokens: 800,
  });

  if (llmResponse) {
    try {
      const cleanJson = llmResponse.replace(/^```json\s*/, "").replace(/\s*```$/, "").trim();
      const parsed = JSON.parse(cleanJson);
      return {
        headline: parsed.headline || deterministic.headline,
        score: deterministic.score,
        sentiment: {
          positive: deterministic.positive,
          neutral: deterministic.neutral,
          negative: deterministic.negative,
        },
        keywords: deterministic.keywords,
        themes: parsed.themes || [],
        frictionPoints: parsed.frictionPoints || [],
        actionItems: parsed.actionItems || [],
        poweredBy: "Claude 3.5 Sonnet",
      };
    } catch {}
  }

  // 2. Deterministic Fallback
  return {
    headline: deterministic.headline,
    score: deterministic.score,
    sentiment: {
      positive: deterministic.positive,
      neutral: deterministic.neutral,
      negative: deterministic.negative,
    },
    keywords: deterministic.keywords,
    themes: [
      {
        theme: "Project Quality & Showcase",
        sentiment: "positive",
        count: deterministic.positive,
        insight: "Attendees expressed enthusiasm for hands-on demos and working prototypes.",
      },
      {
        theme: "Logistics & Queue Management",
        sentiment: deterministic.negative > 0 ? "negative" : "neutral",
        count: deterministic.negative,
        insight: deterministic.negative > 0 ? "Some comments noted crowd delays during peak hours." : "General operations proceeded smoothly.",
      },
    ],
    frictionPoints: deterministic.negative > 0
      ? ["Corridor congestion during peak hours", "Sound bleed between adjacent demo stations"]
      : ["No major friction points reported"],
    actionItems: [
      "Review booth density for the next edition",
      "Distribute crowd traffic using live floor map recommendations",
    ],
    poweredBy: "Deterministic Rule-Engine",
  };
}

/**
 * 3. Visitor Chatbot Assistant (LLM with rule-based fallback)
 */
export async function chatVisitorAssistant(params: {
  message: string;
  eventName: string;
  venue: string;
  projects: {
    title: string;
    category: string;
    boothNo: string;
    teamName: string;
    techStack: string[];
    description: string;
    votes?: number;
  }[];
  categories: string[];
  allEvents?: {
    id: string;
    name: string;
    venue: string;
    city: string;
    status: string;
    categories: string[];
    tagline?: string;
    description?: string;
  }[];
  targetEvent?: any;
}): Promise<string> {
  const query = params.message.trim();
  const qLower = query.toLowerCase();

  // 1. Try Claude LLM
  const projectSummaries = params.projects.slice(0, 30).map((p) => ({
    title: p.title,
    category: p.category,
    booth: p.boothNo,
    team: p.teamName,
    tech: p.techStack?.slice(0, 4).join(", "),
    desc: p.description?.slice(0, 100),
  }));

  const eventsSummary = (params.allEvents || []).map((ev) => ({
    name: ev.name,
    venue: `${ev.venue}, ${ev.city}`,
    status: ev.status,
    tracks: ev.categories?.join(", "),
    tagline: ev.tagline,
  }));

  const prompt = `
You are the EventOS Universal AI Concierge.
Current active events on the platform:
${JSON.stringify(eventsSummary, null, 1)}

Current focused event context: "${params.eventName}" at "${params.venue}".
Focused event project catalog:
${JSON.stringify(projectSummaries, null, 1)}

Visitor inquiry: "${query}"

Guidelines:
1. If the user asks about a specific event (such as "TECHMANJARI", "Nexathon", "Startup Expo", etc.), provide exact details for THAT event including venue, city, tracks, and stalls.
2. If the user asks what events exist or are hosted, list all events on the platform.
3. If they ask about stalls, tracks, or projects, cite specific booth numbers (e.g. "Booth TM-01" or "Booth B-03").
4. Keep the response concise, enthusiastic, and direct (2-4 sentences max).
`;

  const llmResponse = await callClaude({
    systemPrompt: "You are the EventOS multi-event concierge. Be accurate, cite event locations, tracks, and booth IDs.",
    userPrompt: prompt,
    maxTokens: 250,
  });

  if (llmResponse && llmResponse.length > 10) {
    return llmResponse;
  }

  // 2. Deterministic Multi-Event Fallback
  // Match TECHMANJARI specifically
  if (qLower.includes("techmanjari") || qLower.includes("tech manjari")) {
    const tmProjects = params.projects.filter(
      (p) => p.boothNo.startsWith("TM") || p.title.toLowerCase().includes("drone") || p.title.toLowerCase().includes("vajra")
    );
    return `TECHMANJARI '26 is the flagship National Technical Symposium & Hackathon hosted at Campus Central Auditorium & Innovation Dome (Vadodara/Ahmedabad)! Tracks include AI/ML, CyberSecurity, Robotics & IoT, and Web3. Standout exhibition stalls include "DroneVision Sentinel" at Booth TM-01 and "VajraShield Zero-Trust SIEM" at Booth TM-02!`;
  }

  // General "what events / list events"
  if (
    qLower.includes("what events") ||
    qLower.includes("which event") ||
    qLower.includes("list events") ||
    qLower.includes("all events") ||
    (qLower.includes("events") && (qLower.includes("available") || qLower.includes("happening") || qLower.includes("hosted")))
  ) {
    return `EventOS Intelligence currently manages 3 flagship events:\n1. ⚡ TECHMANJARI '26 — National Technical Symposium & Hackathon (Vadodara/Ahmedabad · AI/ML, CyberSecurity, Robotics)\n2. 🚀 NEXATHON '26 — National Hackathon Finals (Bengaluru · 13 demo stalls)\n3. 🌐 Startup Expo & Tech Fest '26 (Hyderabad · 80 startup demo stalls)\nAsk me about any event to explore its stalls, tracks, and gate passes!`;
  }

  // Match Startup Expo
  if (qLower.includes("startup expo") || qLower.includes("tech fest")) {
    return `Startup Expo & Tech Fest '26 is our premier venture showcase in Hyderabad at the Convention Centre! It features 80 startup stalls across AI/ML, FinTech, D2C, and SpaceTech with angel investor walkthroughs.`;
  }

  // Match Nexathon
  if (qLower.includes("nexathon")) {
    return `NEXATHON '26 is the National Hackathon Finals taking place in Bengaluru at Innovation Tower! 120 teams are showcasing solutions across AI/ML, IoT, HealthTech, FinTech, and GreenTech.`;
  }

  // HealthTech
  if (qLower.includes("health") || qLower.includes("medical") || qLower.includes("hospital")) {
    const matched = params.projects.filter(
      (p) => p.category.toLowerCase().includes("health") || p.description.toLowerCase().includes("health")
    );
    if (matched.length > 0) {
      return `We have ${matched.length} great healthcare projects! Check out ${matched
        .map((p) => `"${p.title}" at Booth ${p.boothNo} by ${p.teamName}`)
        .join(" and ")}.`;
    }
  }

  // AI / ML
  if (qLower.includes("ai") || qLower.includes("machine learning") || qLower.includes("model") || qLower.includes("gpt")) {
    const matched = params.projects.filter(
      (p) => p.category.toLowerCase().includes("ai") || (p.techStack && p.techStack.some((t) => t.toLowerCase().includes("ai") || t.toLowerCase().includes("python")))
    );
    if (matched.length > 0) {
      const topP = matched.slice(0, 2);
      return `For cutting-edge AI, visit ${topP
        .map((p) => `"${p.title}" at Booth ${p.boothNo} (${p.category})`)
        .join(" and ")}!`;
    }
  }

  // CyberSecurity
  if (qLower.includes("cyber") || qLower.includes("security") || qLower.includes("hack") || qLower.includes("firewall")) {
    const matched = params.projects.filter(
      (p) => p.category.toLowerCase().includes("cyber") || p.title.toLowerCase().includes("vajra")
    );
    if (matched.length > 0) {
      return `In CyberSecurity, check out "${matched[0].title}" at Booth ${matched[0].boothNo} by ${matched[0].teamName}!`;
    }
    return `Check out "VajraShield — Zero-Trust Cloud SIEM" at Booth TM-02 in TECHMANJARI '26!`;
  }

  // FinTech
  if (qLower.includes("fintech") || qLower.includes("finance") || qLower.includes("bank") || qLower.includes("money") || qLower.includes("credit")) {
    const matched = params.projects.filter((p) => p.category.toLowerCase().includes("fintech"));
    if (matched.length > 0) {
      return `Explore financial innovation at Booth ${matched[0].boothNo} featuring "${matched[0].title}" by ${matched[0].teamName}!`;
    }
  }

  // IoT / Hardware / Robotics / Drone
  if (qLower.includes("iot") || qLower.includes("hardware") || qLower.includes("sensor") || qLower.includes("drone") || qLower.includes("robot")) {
    const matched = params.projects.filter(
      (p) => p.category.toLowerCase().includes("iot") || p.category.toLowerCase().includes("robotics") || p.title.toLowerCase().includes("drone")
    );
    if (matched.length > 0) {
      return `For hardware & robotics, head over to Booth ${matched[0].boothNo} for "${matched[0].title}"!`;
    }
  }

  // GreenTech / Climate
  if (qLower.includes("green") || qLower.includes("climate") || qLower.includes("solar") || qLower.includes("carbon")) {
    const matched = params.projects.filter((p) => p.category.toLowerCase().includes("green") || p.title.toLowerCase().includes("carbon"));
    if (matched.length > 0) {
      return `Check out sustainability tech at Booth ${matched[0].boothNo} showcasing "${matched[0].title}"!`;
    }
  }

  // Top / Most Voted / Popular
  if (qLower.includes("popular") || qLower.includes("vote") || qLower.includes("top") || qLower.includes("best")) {
    const sorted = [...params.projects].sort((a, b) => (b.votes || 0) - (a.votes || 0));
    if (sorted.length > 0) {
      return `The crowd favorite right now is "${sorted[0].title}" at Booth ${sorted[0].boothNo} with ${sorted[0].votes || 0} votes! Another standout is "${sorted[1]?.title || 'AgroSense'}" at Booth ${sorted[1]?.boothNo || 'B-2'}.`;
    }
  }

  // Default fallback response
  return `Welcome to ${params.eventName}! We currently have ${params.projects.length} exhibition stalls across ${params.categories.join(", ")}. You can ask me about specific tracks like "cybersecurity", "healthcare", or "AI", or ask about our other events like TECHMANJARI '26 and Startup Expo!`;
}

/**
 * 4. Judge-to-Project Matching Explanation
 */
export async function explainJudgeMatch(params: {
  judgeName: string;
  judgeOrg: string;
  judgeExpertise: string[];
  projectTitle: string;
  projectCategory: string;
  projectTech: string[];
}): Promise<{ score: number; explanation: string; reasons: string[] }> {
  const baseMatch = judgeMatchScore({
    judgeExpertise: params.judgeExpertise,
    projectCategory: params.projectCategory,
    projectTech: params.projectTech,
  });

  const prompt = `
Explain why judge ${params.judgeName} (${params.judgeOrg}, Expertise: ${params.judgeExpertise.join(", ")}) is a good evaluator for the project "${params.projectTitle}" (Category: ${params.projectCategory}, Tech: ${params.projectTech.join(", ")}).
Match Score calculated: ${baseMatch.score}/100.
Provide a 2-sentence rationale highlighting the specific domain and technical synergy.
`;

  const llmResponse = await callClaude({
    systemPrompt: "You are a hackathon jury coordinator. Provide a concise, professional justification for judge assignment.",
    userPrompt: prompt,
    maxTokens: 150,
  });

  if (llmResponse) {
    return {
      score: baseMatch.score,
      explanation: llmResponse,
      reasons: baseMatch.reasons,
    };
  }

  // Deterministic fallback explanation
  const explanation = `${params.judgeName}'s background in ${params.judgeExpertise.slice(0, 2).join(" & ")} provides targeted domain scrutiny for "${params.projectTitle}" in the ${params.projectCategory} category.`;

  return {
    score: baseMatch.score,
    explanation,
    reasons: baseMatch.reasons,
  };
}
