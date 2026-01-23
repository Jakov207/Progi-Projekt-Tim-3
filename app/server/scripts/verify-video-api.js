/**
 * Verification Script for Video API Features
 * Run this script to verify the database schema and configuration.
 * 
 * Usage: node scripts/verify-video-api.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const pool = require('../config/db');

async function verify() {
    console.log("🔍 Verifying Video API Implementation...");
    let errors = 0;

    // 1. Check Database Schema columns
    try {
        const slotsCols = await pool.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'professor_slots'
        `);
        const cols = slotsCols.rows.map(r => r.column_name);

        if (cols.includes('meeting_url')) console.log("✅ Column 'meeting_url' exists in professor_slots");
        else { console.error("❌ Missing 'meeting_url' in professor_slots"); errors++; }

        if (cols.includes('meeting_password')) console.log("✅ Column 'meeting_password' exists in professor_slots");
        else { console.error("❌ Missing 'meeting_password' in professor_slots"); errors++; }

    } catch (err) {
        console.error("❌ Error checking schema:", err.message);
        errors++;
    }

    // 2. Check Database Tables
    try {
        const tables = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        `);
        const tableNames = tables.rows.map(r => r.table_name);

        if (tableNames.includes('session_records')) console.log("✅ Table 'session_records' exists");
        else { console.error("❌ Missing table 'session_records'"); errors++; }

        if (tableNames.includes('email_reminders_sent')) console.log("✅ Table 'email_reminders_sent' exists");
        else { console.error("❌ Missing table 'email_reminders_sent'"); errors++; }

    } catch (err) {
        console.error("❌ Error checking tables:", err.message);
        errors++;
    }

    // 3. Check for Email Template
    const fs = require('fs');
    const path = require('path');
    const templatePath = path.join(__dirname, '..', 'templates', 'session_reminder.html');
    if (fs.existsSync(templatePath)) {
        console.log("✅ Email template 'session_reminder.html' exists");
    } else {
        console.error("❌ Missing email template 'session_reminder.html'");
        errors++;
    }

    console.log("\n------------------------------------------");
    if (errors === 0) {
        console.log("🎉 SUCCESS: All Verification Checks Passed!");
        console.log("To test functionality:");
        console.log("1. Start server: npm start");
        console.log("2. Create an ONLINE booking");
        console.log("3. Check database for meeting_url/password");
        console.log("4. Run reminder script (if booking is soon): node scripts/send-reminders.js");
    } else {
        console.log(`⚠️ FOUND ${errors} ERRORS. Please fix before deploying.`);
    }

    process.exit(errors > 0 ? 1 : 0);
}

verify();
