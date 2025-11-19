import { pool } from "../db.js";
import "dotenv/config.js";

async function fixEnum() {
  try {
    console.log("🔧 Alterando tabla herramientas para cambiar ENUM...");

    const [result] = await pool.query(
      `ALTER TABLE herramientas 
       MODIFY COLUMN estado ENUM('DISPONIBLE','NO_DISPONIBLE','MANTENCION','DAÑADA','BAJA') 
       NOT NULL DEFAULT 'DISPONIBLE'`
    );

    console.log("✅ Tabla alterada correctamente");

    // Ahora actualizar los registros
    console.log("🔧 Actualizando registros DANADA a DAÑADA...");
    const [update_result] = await pool.query(
      "UPDATE herramientas SET estado = 'DAÑADA' WHERE estado = 'DANADA'"
    );

    console.log(`✅ Se actualizaron ${update_result.affectedRows} registros`);

    // Verificar
    const [check] = await pool.query(
      "SELECT id, nombre, estado FROM herramientas WHERE id IN (2, 17)"
    );

    console.log("\n✅ Verificación final:");
    check.forEach(r => {
      console.log(`   ID ${r.id}: ${r.nombre} = "${r.estado}"`);
    });

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

fixEnum();
