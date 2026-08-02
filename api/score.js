import { createClient } from '@supabase/supabase-js';
import { buildSystemPrompt, CRITERIA, computeCost, scoreLabel } from '../lib/rubric.js';

const supabaseAdmin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const supabaseAuth = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
const MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-5';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const token = (req.headers.authorization || '').replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Missing auth token' });

  const { data: userData, error: userErr } = await supabaseAuth.auth.getUser(token);
  if (userErr || !userData?.user) return res.status(401).json({ error: 'Invalid session' });
  const user = userData.user;

  const { goal, goalDetail, context, tool, prompt } = req.body || {};
  if (!tool || !prompt) return res.status(400).json({ error: 'Tool and prompt are required' });

  try {
    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1000,
        system: buildSystemPrompt(goal),
        messages: [
          { role: 'user', content: JSON.stringify({ goal, goal_detail: goalDetail, context, tool, prompt }) },
        ],
      }),
    });

    const data = await anthropicRes.json();
    if (!anthropicRes.ok) {
      console.error('Anthropic error', data);
      return res.status(502).json({ error: 'Scoring provider error' });
    }

    const textBlock = (data.content || []).find(b => b.type === 'text');
    if (!textBlock) return res.status(502).json({ error: 'Malformed scoring response' });

    const clean = textBlock.text.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(clean);

    const pqOverall = Math.round(
      CRITERIA.reduce((sum, c) => sum + parsed.prompt_quality[c.key].score * c.weight, 0) * 10
    );
    const overall = Math.round(0.7 * pqOverall + 0.3 * parsed.tool_fit.score);
    const label = scoreLabel(overall);

    const { data: inserted, error: insertErr } = await supabaseAdmin
      .from('results')
      .insert({
        user_id: user.id,
        email: user.email,
        goal,
        goal_detail: goalDetail,
        context,
        tool,
        prompt_snippet: prompt.slice(0, 140),
        prompt_quality: parsed.prompt_quality,
        tool_fit: parsed.tool_fit,
        overall,
        label,
      })
      .select()
      .single();
    if (insertErr) throw insertErr;

    const usage = data.usage || {};
    const cost = computeCost(usage);

    const { data: usageResult, error: usageErr } = await supabaseAdmin.rpc('increment_usage', {
      p_user_id: user.id,
      p_email: user.email,
      p_input: usage.input_tokens || 0,
      p_output: usage.output_tokens || 0,
      p_cost: cost,
    });
    if (usageErr) console.error('usage rpc error', usageErr);

    const alert = Array.isArray(usageResult) ? usageResult[0] : usageResult;

    // Optional: ping a Slack/webhook the moment total spend crosses the threshold.
    if (alert?.crossed_now && process.env.ALERT_WEBHOOK_URL) {
      fetch(process.env.ALERT_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: `Pimp My Prompt: total AI spend crossed $${alert.threshold} (now $${Number(alert.new_total).toFixed(4)}).`,
        }),
      }).catch(err => console.error('alert webhook failed', err));
    }

    return res.status(200).json({ result: inserted, alert });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Scoring failed' });
  }
}
