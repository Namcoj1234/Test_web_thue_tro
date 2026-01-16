
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jdgxvyveidpobhkeggtb.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpkZ3h2eXZlaWRwb2Joa2VnZ3RiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0OTcyNzAsImV4cCI6MjA4NDA3MzI3MH0.3qmiwAVt767-IBPpOsRDIRqMnXdhP92wgXhLoC-9J0o';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
