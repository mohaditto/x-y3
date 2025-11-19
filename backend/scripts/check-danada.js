import { pool } from '../db.js';

async function checkDanada() {
  try {
    const [rows] = await pool.query(
      "SELECT id, nombre, estado FROM herramientas WHERE estado = 'DAÑADA' OR estado = 'DANADA'"
    );
    console.log('Herramientas con estado dañado:');
    rows.forEach(h => {
      console.log(`- ${h.nombre}: ${h.estado}`);
    });
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkDanada();
