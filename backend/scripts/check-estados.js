import { pool } from "../db.js";
import "dotenv/config.js";

async function checkEstados() {
  try {
    const [rows] = await pool.query(
      "SELECT id, nombre, estado FROM herramientas WHERE nombre IN ('aaaaa', 'Esmeril Angular')"
    );

    console.log("📋 Estados actuales en BD:");
    rows.forEach(r => {
      console.log(`  - ${r.nombre}: "${r.estado}"`);
    });

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

checkEstados();
