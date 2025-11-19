import { pool } from '../db.js';

async function fixWithHex() {
  try {
    // DAÑADA en UTF-8 es: 44 41 C3 91 41 44 41
    // DANADA en ASCII es: 44 41 4E 41 44 41
    
    const [result] = await pool.query(
      "UPDATE herramientas SET estado = UNHEX('44 41 C3 91 41 44 41') WHERE nombre IN ('Destornillador', 'Casco Seguridad')"
    );
    
    console.log('Registros actualizados:', result.affectedRows);
    
    // Verificar
    const [verify] = await pool.query(
      "SELECT id, nombre, estado, HEX(estado) as hex FROM herramientas WHERE nombre IN ('Destornillador', 'Casco Seguridad')"
    );
    console.log('\nVerificación final:');
    verify.forEach(h => {
      console.log(`- ${h.nombre}: "${h.estado}" (HEX: ${h.hex})`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

fixWithHex();
