import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://cwinqkphtonxbeypstds.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdWxhYmFzZSIsInJlZiI6ImN3aW5xa3BodG9ueGJleXBzdGRzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ1NDI4NjIsImV4cCI6MjA2MDExODg2Mn0.uD-w-q5FAGRrYt0sunTg1-huXlpA8IPGRm3fh64Gvq';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
