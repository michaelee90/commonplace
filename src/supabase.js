import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://ekfzeaqbcvsdhrsnvpmg.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVrZnplYXFiY3ZzZGhyc252cG1nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk0NDA3NTQsImV4cCI6MjA5NTAxNjc1NH0.UGf9XaclC-vcgUkTEedGr40NIy3Ebg5ACO-IpupZ0n8'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)