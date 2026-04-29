/**
 * Update allowed emails in Supabase from e-mail 주소.txt
 * Run: node scripts/update-allowed-emails.js
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Use service role key for admin access

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateAllowedEmails() {
  try {
    // Read emails from text file
    const filePath = path.resolve(process.cwd(), '..', 'e-mail 주소.txt');
    const fileContent = fs.readFileSync(filePath, 'utf-8');

    // Parse emails: split by newline, trim, filter empty lines
    const emails = fileContent
      .split('\n')
      .map(line => line.trim())
      .filter(line => line && line.includes('@')); // Valid email check

    if (emails.length === 0) {
      console.warn('⚠️  No valid emails found in file');
      return;
    }

    console.log(`📧 Found ${emails.length} email(s) to process`);

    // Get current emails from database
    const { data: currentEmails, error: fetchError } = await supabase
      .from('allowed_emails')
      .select('email');

    if (fetchError) {
      throw new Error(`Fetch error: ${fetchError.message}`);
    }

    const currentEmailSet = new Set(currentEmails.map(e => e.email));
    const newEmails = emails.filter(email => !currentEmailSet.has(email));
    const toDelete = currentEmails.filter(e => !emails.includes(e.email));

    // Delete emails no longer in file
    if (toDelete.length > 0) {
      console.log(`🗑️  Deleting ${toDelete.length} email(s) no longer in file`);
      const deleteIds = toDelete.map(e => e.id);
      const { error: deleteError } = await supabase
        .from('allowed_emails')
        .delete()
        .in('id', deleteIds);
      if (deleteError) throw new Error(`Delete error: ${deleteError.message}`);
    }

    // Insert new emails
    if (newEmails.length > 0) {
      console.log(`➕ Adding ${newEmails.length} new email(s)`);
      const { error: insertError } = await supabase
        .from('allowed_emails')
        .insert(newEmails.map(email => ({ email })));
      if (insertError) throw new Error(`Insert error: ${insertError.message}`);
    }

    console.log(`✅ Successfully updated allowed emails`);
    console.log(`   Current total: ${emails.length} email(s)`);
    console.log(`   Added: ${newEmails.length}, Removed: ${toDelete.length}`);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

updateAllowedEmails();
