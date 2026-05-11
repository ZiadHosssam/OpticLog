import CONFIG from './config.js';

const SUPABASE_URL = CONFIG.SUPABASE_URL;
const SUPABASE_ANON_KEY = CONFIG.SUPABASE_ANON_KEY;

const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);