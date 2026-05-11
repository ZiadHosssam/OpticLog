// Configuration Template - Prefer using a local `.env` with Vite
// Copy `.env.example` to `.env` and set your keys there.
const CONFIG = {
    SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co',
    SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key-here'
};

export default CONFIG;
