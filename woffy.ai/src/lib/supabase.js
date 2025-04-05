import { createClient } from '@supabase/supabase-js'

// Supabase configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Default Supabase client options
const supabaseOptions = {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
}

// Create a single supabase client for interacting with your database
// Add validation to handle missing env variables during development
let supabaseClient;

try {
  if (!supabaseUrl || !supabaseKey) {
    console.warn('Supabase URL or Key is missing. Check your .env file.');
    // Create a mock client for development that will gracefully fail
    supabaseClient = {
      from: () => ({
        select: () => Promise.resolve({ data: [], error: null }),
        insert: () => Promise.resolve({ data: null, error: null }),
        delete: () => ({ neq: () => Promise.resolve({ error: null }) })
      }),
      auth: {
        signInWithPassword: () => Promise.resolve({ data: null, error: new Error('Supabase URL or Key is missing') }),
        signInWithOAuth: () => Promise.resolve({ data: null, error: new Error('Supabase URL or Key is missing') }),
        signUp: () => Promise.resolve({ data: null, error: new Error('Supabase URL or Key is missing') }),
        signOut: () => Promise.resolve({ error: null }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
        getSession: () => Promise.resolve({ data: { session: null }, error: null }),
        resetPasswordForEmail: () => Promise.resolve({ data: null, error: null })
      }
    };
  } else {
    supabaseClient = createClient(supabaseUrl, supabaseKey, supabaseOptions);
  }
} catch (error) {
  console.error('Error initializing Supabase client:', error);
  // Fallback to mock client
  supabaseClient = {
    from: () => ({
      select: () => Promise.resolve({ data: [], error: null }),
      insert: () => Promise.resolve({ data: null, error: null }),
      delete: () => ({ neq: () => Promise.resolve({ error: null }) })
    }),
    auth: {
      signInWithPassword: () => Promise.resolve({ data: null, error: new Error('Supabase client initialization failed') }),
      signInWithOAuth: () => Promise.resolve({ data: null, error: new Error('Supabase client initialization failed') }),
      signUp: () => Promise.resolve({ data: null, error: new Error('Supabase client initialization failed') }),
      signOut: () => Promise.resolve({ error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      resetPasswordForEmail: () => Promise.resolve({ data: null, error: null })
    }
  };
}

export const supabase = supabaseClient;
