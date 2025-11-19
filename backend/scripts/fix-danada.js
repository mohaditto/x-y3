import { pool } from '../db.js';

async function fixAllDanada() {
  try {
    // Actualizar todos los estados que contengan DANADA (sin importar cómo esté escrito)
    const [result] = await pool.query(
      "UPDATE herramientas SET estado = 'DAÑADA' WHERE estado LIKE '%DANADA%' OR UPPER(estado) = 'DANADA'"
    );
    console.log('Registros actualizados:', result.affectedRows);
    
    // Verificar el resultado
    const [check] = await pool.query(
      "SELECT id, nombre, estado FROM herramientas WHERE estado IN ('DAÑADA', 'DANADA')"
    );
    console.log('\nHerramientas después de actualizar:');
    check.forEach(h => {
      console.log(`- ${h.nombre}: ${h.estado}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

fixAllDanada();
