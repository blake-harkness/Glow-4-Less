// Add console.log for debugging
console.log('Environment variables:', {
    supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
    hasSupabaseKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY,
    hasOpenAiKey: !!import.meta.env.VITE_OPENAI_API_KEY
  })
  
  export const config = {
    openAiApiKey: import.meta.env.VITE_OPENAI_API_KEY as string,
    supabase: {
      url: import.meta.env.VITE_SUPABASE_URL as string,
      anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY as string,
    }
  }
  
  // Validate required environment variables
  const requiredEnvVars = [
    'VITE_OPENAI_API_KEY',
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY'
  ]
  
  requiredEnvVars.forEach(envVar => {
    if (!import.meta.env[envVar]) {
      console.error(`Missing environment variable: ${envVar}`)
      throw new Error(`Missing required environment variable: ${envVar}`)
    }
  }) 