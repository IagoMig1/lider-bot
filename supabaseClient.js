const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://hamrgadowxmlisrcafzt.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhbXJnYWRvd3htbGlzcmNhZnp0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ4MjIwODksImV4cCI6MjA2MDM5ODA4OX0.hLGY9B8k_doaw_LBa0U6D6ogOhcWNG1_TOB1cVw4zVg'
);

module.exports = supabase;
