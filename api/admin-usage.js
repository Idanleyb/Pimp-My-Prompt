import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const supabaseAuth = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

export default async function handler(req, res) {
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Missing auth token' });

  const { data: userData, error } = await supabaseAuth.auth.getUser(token);
  if (error || !userData?.user) return res.status(401).json({ error: 'Invalid session' });

  const adminEmails = (process.env.ADMIN_EMAILS || '')
    .split(',').map(e => e.trim().toLowerCase()).filter(Boolean);

  if (!adminEmails.includes(userData.user.email.toLowerCase())) {
    return res.status(403).json({ error: "You don't have access to usage analytics." });
  }

  const { data: global } = await supabaseAdmin.from('global_usage').select('*').eq('id', 1).single();
  const { data: users } = await supabaseAdmin.from('usage_totals').select('*').order('cost', { ascending: false });

  return res.status(200).json({ global, users: users || [] });
}
