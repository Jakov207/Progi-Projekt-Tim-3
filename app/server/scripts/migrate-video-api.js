/**
 * Migration Script for Video API Features
 * Run this script to apply database changes.
 * 
 * Usage: node scripts/migrate-video-api.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const pool = require('../config/db');
const fs = require('fs');
const path = require('path');

async function migrate() {
    console.log("🔄 Starting Video API Migration...");

    try {
        const migrationFile = path.join(__dirname, '..', 'baze', 'migration_video_api.sql');
        const migrationSql = fs.readFileSync(migrationFile, 'utf8');

        console.log("📂 Reading migration file:", migrationFile);
        console.log("📜 Executing SQL...");

        await pool.query(migrationSql);

        console.log("✅ Migration applied successfully!");
        console.log("   - Added meeting_url/password columns");
        console.log("   - Created session_records table");
        console.log("   - Created email_reminders_sent table");

    } catch (err) {
        console.error("❌ Migration failed:", err.message);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

migrate();
