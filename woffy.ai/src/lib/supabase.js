import { createClient } from '@supabase/supabase-js'

// Supabase configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

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
        signUp: () => Promise.resolve({ data: null, error: { message: 'Missing Supabase credentials' } }),
        signIn: () => Promise.resolve({ data: null, error: { message: 'Missing Supabase credentials' } }),
        signOut: () => Promise.resolve({ error: null }),
        getSession: () => Promise.resolve({ data: { session: null }, error: null }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } })
      }
    };
  } else {
    supabaseClient = createClient(supabaseUrl, supabaseKey);
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
      signUp: () => Promise.resolve({ data: null, error: { message: 'Supabase initialization failed' } }),
      signIn: () => Promise.resolve({ data: null, error: { message: 'Supabase initialization failed' } }),
      signOut: () => Promise.resolve({ error: null }),
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } })
    }
  };
}

// Authentication helper functions
export const signUp = async (email, password) => {
  const { data, error } = await supabaseClient.auth.signUp({
    email,
    password
  });
  return { data, error };
};

export const signIn = async (email, password) => {
  const { data, error } = await supabaseClient.auth.signInWithPassword({
    email,
    password
  });
  return { data, error };
};

export const signOut = async () => {
  const { error } = await supabaseClient.auth.signOut();
  return { error };
};

export const getCurrentSession = async () => {
  const { data, error } = await supabaseClient.auth.getSession();
  return { session: data.session, error };
};

export const supabase = supabaseClient;
