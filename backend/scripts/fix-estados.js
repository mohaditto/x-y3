import { pool } from "../db.js";
import "dotenv/config.js";

async function fixEstados() {
  try {
    console.log("🔧 Iniciando corrección de estados en la BD...");

    // Reemplazar DANADA por DAÑADA
    const [result] = await pool.query(
      "UPDATE herramientas SET estado = 'DAÑADA' WHERE estado = 'DANADA'"
    );

    console.log(`✅ Se actualizaron ${result.affectedRows} registros`);
    console.log("✅ Estados corregidos correctamente");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

fixEstados();
