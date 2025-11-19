import { pool } from "../db.js";
import "dotenv/config.js";

async function fixEstados() {
  try {
    console.log("🔧 Corrigiendo DANADA -> DAÑADA en la BD...");

    // Actualización directa
    const [result] = await pool.query(
      "UPDATE herramientas SET estado = 'DAÑADA' WHERE estado = 'DANADA'"
    );

    console.log(`✅ Se actualizaron ${result.affectedRows} registros`);

    // Verificar después
    const [check] = await pool.query(
      "SELECT COUNT(*) as total FROM herramientas WHERE estado = 'DANADA'"
    );
    console.log(`✅ Registros con DANADA restantes: ${check[0].total}`);

    const [final] = await pool.query(
      "SELECT id, nombre, estado FROM herramientas WHERE estado = 'DAÑADA'"
    );
    console.log("✅ Registros corregidos a DAÑADA:");
    final.forEach(r => {
      console.log(`   - ${r.nombre}: ${r.estado}`);
    });

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

fixEstados();
