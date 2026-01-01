// Debug helper to check Supabase connection
export function checkSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY

  return {
    url: url ? `${url.substring(0, 20)}...` : 'MISSING',
    key: key ? `${key.substring(0, 20)}...` : 'MISSING',
    hasUrl: !!url,
    hasKey: !!key,
  }
}

