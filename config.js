let localSecrets = {};
try {
    localSecrets = await import('./secrets.js');
} catch (e) {
}

export const config = {
    supabaseUrl: localSecrets.SUPABASE_URL || "", 
    supabaseKey: localSecrets.SUPABASE_ANON_KEY || ""
};