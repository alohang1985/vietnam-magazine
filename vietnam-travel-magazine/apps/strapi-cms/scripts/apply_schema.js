/**
 * apply_schema.js
 * Simple migration helper: verifies schema.json exists and touches a marker file to signal rebuild.
 * Usage: node scripts/apply_schema.js
 * Note: Strapi requires a rebuild to pickup new content-types. This script assists by validating presence.
 */
const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, '../src/api/post/content-types/post/schema.json');
const marker = path.join(__dirname, '../.schema_applied');

if (!fs.existsSync(schemaPath)) {
  console.error('Schema file not found:', schemaPath);
  process.exit(1);
}

fs.writeFileSync(marker, `applied at ${new Date().toISOString()}\n`);
console.log('Schema marker written. Please run `npm run build` and restart Strapi (npm run develop) to apply.');
