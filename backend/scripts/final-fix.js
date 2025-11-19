import { pool } from '../db.js';

(async () => {
  try {
    const [result] = await pool.query(
      "UPDATE herramientas SET estado = ? WHERE nombre IN ('Destornillador', 'Casco Seguridad')",
      ['DAÑADA']
    );
    console.log('Registros actualizados:', result.affectedRows);
    
    const [verify] = await pool.query(
      "SELECT nombre, estado FROM herramientas WHERE nombre IN ('Destornillador', 'Casco Seguridad')"
    );
    console.log('Resultado:');
    verify.forEach(h => console.log(`- ${h.nombre}: ${h.estado}`));
    process.exit(0);
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
})();
