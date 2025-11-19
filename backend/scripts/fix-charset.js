import { pool } from '../db.js';

(async () => {
  try {
    // Verificar charset de la tabla
    const [info] = await pool.query(
      "SHOW CREATE TABLE herramientas"
    );
    console.log('Estructura de tabla:');
    console.log(info[0]['Create Table']);
    
    // Convertir a UTF-8
    await pool.query("ALTER TABLE herramientas CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
    console.log('\nTabla convertida a utf8mb4');
    
    // Actualizar los valores
    const [result] = await pool.query(
      "UPDATE herramientas SET estado = ? WHERE nombre IN (?, ?)",
      ['DAÑADA', 'Destornillador', 'Casco Seguridad']
    );
    console.log('Registros actualizados:', result.affectedRows);
    
    // Verificar
    const [verify] = await pool.query(
      "SELECT nombre, estado FROM herramientas WHERE nombre IN (?, ?)",
      ['Destornillador', 'Casco Seguridad']
    );
    console.log('\nResultado final:');
    verify.forEach(h => console.log(`- ${h.nombre}: ${h.estado}`));
    process.exit(0);
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
})();
