import { pool } from "../db.js";
import "dotenv/config.js";

async function fixEstados() {
  try {
    console.log("🔧 Intentando corregir con COLLATE utf8mb4_unicode_ci...");

    // Actualización con collate explícito
    const [result] = await pool.query(
      "UPDATE herramientas SET estado = COLLATE utf8mb4_unicode_ci 'DAÑADA' WHERE estado = 'DANADA' COLLATE utf8mb4_unicode_ci"
    );

    console.log(`✅ Registros actualizados: ${result.affectedRows}`);

    // Verificar
    const [check] = await pool.query(
      "SELECT id, nombre, estado, HEX(estado) as hex FROM herramientas WHERE id IN (2, 17)"
    );

    console.log("📋 Verificación:");
    check.forEach(r => {
      console.log(`   ${r.nombre}: "${r.estado}" (HEX: ${r.hex})`);
    });

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

fixEstados();
