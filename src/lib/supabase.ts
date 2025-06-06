import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://bjliwrqjjznwouqquwfz.supabase.co"!;
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJqbGl3cnFqanpud291cXF1d2Z6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg1ODMwMDEsImV4cCI6MjA2NDE1OTAwMX0.ai02BCwBtQOerOVH0BwdIGG7Y1bYdwaxhWz7JC_PPSw"!; // Service key for server-side use

export const supabase = createClient(supabaseUrl, supabaseKey);
