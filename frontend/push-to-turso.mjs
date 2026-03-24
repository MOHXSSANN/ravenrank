// Push local SQLite database to Turso
// Usage: node push-to-turso.mjs

import { createClient } from "@libsql/client";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const localDb = createClient({
  url: `file:${path.join(__dirname, "..", "scraper", "data", "ravenrank.db")}`,
  intMode: "string",
});

const remoteDb = createClient({
  url: "libsql://ravenrank-mohxssann.aws-us-east-1.turso.io",
  authToken: "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NzQzMzc1MDEsImlkIjoiMDE5ZDFlYzEtNTIwMS03NTEwLTk4N2MtMzAwZjZhYzE5YzBhIiwicmlkIjoiMThhYzE1OWItMjFkOS00NWJmLWI1ZmMtM2Q3ZGIzOGNmMjI4In0.ajDB9bzpCGS8cXiikY86jnDC-Gj4dlHxbalTxFcK_RJOhYI8Ejcdn9Yni2G7Kd3Y9xKNs5ejRRhnQkI-wfBxBA",
});

// Order: parent tables first (foreign keys)
const TABLE_ORDER = [
  "subjects",
  "professors",
  "rmp_reviews",
  "courses",
  "course_sections",
  "course_section_professors",
  "course_section_grades",
];

async function getTableSchema(tableName) {
  const result = await localDb.execute(
    "SELECT sql FROM sqlite_master WHERE type='table' AND name=?",
    [tableName]
  );
  return result.rows[0]?.sql;
}

function coerceValue(val) {
  if (val === null || val === undefined) return null;
  // intMode: "string" returns integers as strings like "123"
  // We need to convert numeric strings back to numbers for Turso
  if (typeof val === "string" && /^-?\d+$/.test(val)) {
    const n = Number(val);
    if (Number.isSafeInteger(n)) return n;
    // For huge integers, keep as string (Turso handles it)
    return val;
  }
  if (typeof val === "bigint") return Number(val);
  return val;
}

async function pushTable(tableName) {
  const createSql = await getTableSchema(tableName);
  if (!createSql) {
    console.log(`  Skipping ${tableName}: not found in local DB`);
    return;
  }

  await remoteDb.execute(createSql);
  console.log(`  Created table: ${tableName}`);

  const countResult = await localDb.execute(`SELECT COUNT(*) as cnt FROM "${tableName}"`);
  const totalRows = Number(countResult.rows[0].cnt);
  if (totalRows === 0) {
    console.log(`  ${tableName}: 0 rows (empty)`);
    return;
  }

  // Read all rows
  const data = await localDb.execute(`SELECT * FROM "${tableName}"`);
  const columns = data.columns;
  const placeholders = columns.map(() => "?").join(", ");
  const insertSql = `INSERT INTO "${tableName}" (${columns.map(c => `"${c}"`).join(", ")}) VALUES (${placeholders})`;

  // Insert in batches of 50
  const batchSize = 50;
  let inserted = 0;

  for (let i = 0; i < data.rows.length; i += batchSize) {
    const batch = data.rows.slice(i, i + batchSize);
    const statements = batch.map(row => ({
      sql: insertSql,
      args: columns.map(col => coerceValue(row[col])),
    }));
    await remoteDb.batch(statements);
    inserted += batch.length;
    if (inserted % 500 === 0 || inserted === data.rows.length) {
      process.stdout.write(`\r  ${tableName}: ${inserted}/${totalRows} rows`);
    }
  }

  console.log(`\r  ${tableName}: ${inserted} rows inserted        `);
}

async function main() {
  console.log("Pushing local SQLite to Turso...\n");

  // Drop all tables in reverse order first (clean slate)
  console.log("Dropping existing tables...");
  for (const tableName of [...TABLE_ORDER].reverse()) {
    await remoteDb.execute(`DROP TABLE IF EXISTS "${tableName}"`).catch(() => {});
  }
  console.log("Done dropping.\n");

  for (const tableName of TABLE_ORDER) {
    try {
      await pushTable(tableName);
    } catch (err) {
      console.error(`\n  Error on ${tableName}: ${err.message}`);
    }
  }

  console.log("\nDone!");
}

main().catch(console.error);
