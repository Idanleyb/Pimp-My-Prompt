// Shared between the frontend (labels/options) and the serverless API
// routes (system-prompt construction, cost math). Keep this dependency-free.

export const CRITERIA = [
  { key: 'deliverable_clarity', label: 'Deliverable Clarity', weight: 0.20,
    hint: 'Exact output format, length/duration, medium' },
  { key: 'context_density', label: 'Context Density', weight: 0.20,
    hint: 'Audience, brand voice, use case, channel' },
  { key: 'output_structure', label: 'Output Structure', weight: 0.15,
    hint: 'Defined shape for the result' },
  { key: 'examples_references', label: 'Examples & References', weight: 0.15,
    hint: 'Few-shot examples or style anchors' },
  { key: 'constraints_guardrails', label: 'Constraints & Guardrails', weight: 0.15,
    hint: "Explicit do's/don'ts, negative constraints" },
  { key: 'iteration_signal', label: 'Iteration Signal', weight: 0.15,
    hint: 'Evidence of refinement vs. a cold one-shot' },
];

export const GOAL_OPTIONS = [
  { value: 'content', label: 'Content / Copy' },
  { value: 'image', label: 'Image / Creative' },
  { value: 'video', label: 'Video' },
  { value: 'app', label: 'App / Code Build' },
  { value: 'automation', label: 'Automation / Workflow' },
  { value: 'other', label: 'Other' },
];

export const GOAL_GUIDANCE = {
  content: "Chat-based LLMs (Claude, ChatGPT, Gemini) are well-suited; fit depends mostly on prompt quality, not tool choice.",
  image: "Purpose-built image generators (Midjourney, Ideogram, DALL-E, Stable Diffusion) outperform generic chat tools for finished visual assets.",
  video: "Dedicated video models (Runway, Sora, Veo, Pika) are generally required; text-only chat tools cannot produce video output directly.",
  app: "Agentic coding/app-builder tools (Claude Code, Lovable, Bolt, v0, Cursor) fit better than plain chat for a working prototype.",
  automation: "Orchestration tools (Zapier AI, Make, n8n, agent frameworks) fit better than one-off chat prompts for a repeatable workflow.",
  other: "Judge fit case-by-case based on the stated goal and the tool's actual capabilities.",
};

// $ per million tokens. Reference rate only — check the Anthropic Console
// for current pricing before relying on this for real billing.
export const RATE = { input: 2.00, output: 10.00, cacheRead: 0.20, cacheWrite: 2.50 };

export function scoreLabel(overall) {
  if (overall <= 40) return 'Needs Work';
  if (overall <= 70) return 'Functional';
  return 'Optimized';
}

export function buildSystemPrompt(goal) {
  const guidance = GOAL_GUIDANCE[goal] || GOAL_GUIDANCE.other;
  return `You are an AI-usage auditor for marketers. Score the submission using this rubric. Respond with ONLY valid JSON, no markdown fences, no preamble, matching exactly this shape:
{"prompt_quality":{"deliverable_clarity":{"score":0,"tip":""},"context_density":{"score":0,"tip":""},"output_structure":{"score":0,"tip":""},"examples_references":{"score":0,"tip":""},"constraints_guardrails":{"score":0,"tip":""},"iteration_signal":{"score":0,"tip":""}},"tool_fit":{"score":0,"assessment":"","recommended_alternative":null,"reason":""}}

Rubric criteria, score 0-10 each:
- deliverable_clarity: states exact output format, length/duration, medium
- context_density: audience, brand voice, use case, channel included
- output_structure: defined shape for the result (sections, aspect ratio, shot list, schema)
- examples_references: few-shot examples or reference style/material anchors
- constraints_guardrails: explicit do's/don'ts, negative constraints, tone limits
- iteration_signal: evidence of refinement from a prior output vs. a cold one-shot ask

Tool-fit guidance for this goal category: ${guidance}
Score how well the stated tool fits the stated goal, 0-100. If a materially better-fit tool exists, name exactly ONE in recommended_alternative with a one-sentence reason in "reason". Otherwise set recommended_alternative to null and reason to "".

Keep every tip and the assessment to one concise sentence, 30 words maximum. Be concrete and specific to what was actually submitted, never generic filler.`;
}

export function computeCost(usage = {}) {
  const input = usage.input_tokens || 0;
  const output = usage.output_tokens || 0;
  const cacheRead = usage.cache_read_input_tokens || 0;
  const cacheWrite = usage.cache_creation_input_tokens || 0;
  return (input / 1e6) * RATE.input + (output / 1e6) * RATE.output +
         (cacheRead / 1e6) * RATE.cacheRead + (cacheWrite / 1e6) * RATE.cacheWrite;
}
