// src/lib/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

// Récupère ces infos dans ton Dashboard Supabase > Project Settings > API
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);