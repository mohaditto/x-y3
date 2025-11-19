import { pool } from "../db.js";
import "dotenv/config.js";

async function fixEstados() {
  try {
    console.log("🔧 Corrigiendo estados DANADA con enfoque DELETE/INSERT...");

    const connection = await pool.getConnection();

    // Obtener los registros con DANADA
    const [danadas] = await connection.query(
      "SELECT * FROM herramientas WHERE estado = 'DANADA'"
    );

    console.log(`📋 Encontrados ${danadas.length} registros con DANADA`);

    for (const h of danadas) {
      console.log(`   Corrigiendo ID ${h.id}: ${h.nombre}`);
      
      // Actualizar con SET directo
      await connection.query(
        "UPDATE herramientas SET estado = ? WHERE id = ?",
        ["DAÑADA", h.id]
      );
    }

    // Verificar
    const [final] = await connection.query(
      "SELECT id, nombre, estado FROM herramientas WHERE id IN (2, 17)"
    );

    console.log("\n✅ Verificación final:");
    final.forEach(r => {
      console.log(`   ID ${r.id}: ${r.nombre} = "${r.estado}"`);
    });

    connection.release();
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

fixEstados();
