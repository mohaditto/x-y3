import { pool } from "../db.js";
import "dotenv/config.js";

async function checkCharset() {
  try {
    console.log("🔧 Verificando charset y collation...");

    const [db_info] = await pool.query(
      "SELECT @@character_set_database, @@collation_database"
    );
    console.log("BD Charset:", db_info[0]);

    const [table_info] = await pool.query(
      "SHOW CREATE TABLE herramientas"
    );
    console.log("\n📋 Creación de tabla:");
    console.log(table_info[0]["Create Table"]);

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

checkCharset();
