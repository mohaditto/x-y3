import { pool } from '../db.js';

async function fixDirecto() {
  try {
    // Obtener primero qué valor exacto tiene
    const [rows] = await pool.query(
      "SELECT id, nombre, CAST(estado AS BINARY) as estado_bytes, LENGTH(estado) as len FROM herramientas WHERE nombre IN ('Destornillador', 'Casco Seguridad')"
    );
    
    console.log('Estados actuales:');
    rows.forEach(r => {
      console.log(`- ${r.nombre}: "${r.estado_bytes}" (length: ${r.len})`);
    });
    
    // Hacer UPDATE directo de esos IDs específicos
    const ids = rows.map(r => r.id);
    if (ids.length > 0) {
      const query = `UPDATE herramientas SET estado = CONVERT('DAÑADA' USING utf8mb4) WHERE id IN (${ids.join(',')})`;
      const [result] = await pool.query(query);
      console.log('\nRegistros actualizados:', result.affectedRows);
    }
    
    // Verificar
    const [verify] = await pool.query(
      "SELECT id, nombre, estado FROM herramientas WHERE id IN (SELECT id FROM herramientas WHERE nombre IN ('Destornillador', 'Casco Seguridad'))"
    );
    console.log('\nVerificación final:');
    verify.forEach(h => {
      console.log(`- ${h.nombre}: "${h.estado}"`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

fixDirecto();
