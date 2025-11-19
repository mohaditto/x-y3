import { pool } from "../db.js";
import "dotenv/config.js";

async function checkAll() {
  try {
    const [rows] = await pool.query(
      "SELECT id, nombre, estado FROM herramientas LIMIT 20"
    );

    console.log("📋 TODOS los estados en BD:");
    rows.forEach(r => {
      console.log(`  ID ${r.id}: ${r.nombre} = "${r.estado}"`);
    });

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

checkAll();
