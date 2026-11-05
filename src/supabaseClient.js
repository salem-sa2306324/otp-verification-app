import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

// True only when both env variables are present. App.jsx shows a setup
// screen instead of crashing when this is false.
export const isConfigured = Boolean(url && key);

export const supabase = isConfigured ? createClient(url, key) : null;
