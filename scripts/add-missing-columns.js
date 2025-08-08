#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Required environment variables not set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function addMissingColumns() {
  console.log('🔧 Adding missing columns to challenges table...');
  
  try {
    // Add the missing columns one by one
    const columns = [
      'ADD COLUMN IF NOT EXISTS home_lat FLOAT',
      'ADD COLUMN IF NOT EXISTS home_lng FLOAT', 
      'ADD COLUMN IF NOT EXISTS target_lat FLOAT',
      'ADD COLUMN IF NOT EXISTS target_lng FLOAT',
      'ADD COLUMN IF NOT EXISTS target_time TIMESTAMP WITH TIME ZONE',
      'ADD COLUMN IF NOT EXISTS completion_lat FLOAT',
      'ADD COLUMN IF NOT EXISTS completion_lng FLOAT',
      'ADD COLUMN IF NOT EXISTS completion_address TEXT',
      'ADD COLUMN IF NOT EXISTS distance_to_target FLOAT',
      'ADD COLUMN IF NOT EXISTS wake_up_location_address TEXT',
      'ADD COLUMN IF NOT EXISTS wake_up_location_lat FLOAT',
      'ADD COLUMN IF NOT EXISTS wake_up_location_lng FLOAT',
      'ADD COLUMN IF NOT EXISTS started_at TIMESTAMP WITH TIME ZONE',
      'ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE(\'utc\'::text, NOW()) NOT NULL'
    ];

    // Execute ALTER TABLE with all columns at once
    const alterSql = `ALTER TABLE challenges ${columns.join(', ')};`;
    
    const { data, error } = await supabase
      .from('challenges')
      .select('count')
      .limit(1)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    // We can't use SQL directly, so let's try a different approach
    // Let's check what columns exist by trying to select them
    console.log('✅ Checking current table structure...');
    
    const { data: testData, error: testError } = await supabase
      .from('challenges')
      .select('id, user_id, home_latitude')
      .limit(1);
    
    if (testError) {
      console.log('ℹ️ home_latitude column not found, need to add lat/lng columns');
    } else {
      console.log('✅ Table already has some coordinate columns');
    }
    
    console.log('⚠️ Direct SQL execution is not available through the REST API.');
    console.log('Please run the following SQL in Supabase dashboard:');
    console.log('');
    console.log(alterSql);
    console.log('');
    console.log('Or apply the setup-supabase-migration.sql file manually.');
    
    return { success: true, message: 'SQL provided for manual execution' };
    
  } catch (error) {
    console.error('❌ Error:', error);
    return { success: false, error };
  }
}

if (require.main === module) {
  addMissingColumns()
    .then(result => {
      if (result.success) {
        console.log('✅', result.message);
      } else {
        console.error('❌ Failed:', result.error.message);
        process.exit(1);
      }
    })
    .catch(console.error);
}

module.exports = { addMissingColumns };