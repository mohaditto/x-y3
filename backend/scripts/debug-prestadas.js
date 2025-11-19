import { pool } from '../db.js';

async function debug() {
  try {
    console.log('=== prestamos activos ===');
    const [prows] = await pool.query("SELECT id, capataz_id, trabajador_id, fecha_entrada, fecha_salida, estado FROM prestamos ORDER BY fecha_entrada DESC LIMIT 50");
    console.log(JSON.stringify(prows, null, 2));

    console.log('=== prestamo_items pendientes (hora_entrada IS NULL) ===');
    const [pirows] = await pool.query("SELECT prestamo_id, herramienta_id, hora_salida, hora_entrada, estado_devolucion FROM prestamo_items WHERE hora_entrada IS NULL LIMIT 200");
    console.log(JSON.stringify(pirows, null, 2));

    console.log('=== JOIN (query usada por /prestadas) ===');
    const [rows] = await pool.query(`
      SELECT 
        p.id AS prestamo_id,
        h.id AS herramienta_id,
        h.nombre AS herramienta,
        u.nombre AS trabajador,
        p.estado
      FROM prestamos p
      JOIN usuarios u ON u.id = p.trabajador_id
      JOIN prestamo_items pi ON pi.prestamo_id = p.id
      JOIN herramientas h ON h.id = pi.herramienta_id
      WHERE p.estado = 'ACTIVO' AND pi.hora_entrada IS NULL
    `);
    console.log(JSON.stringify(rows, null, 2));

    process.exit(0);
  } catch (err) {
    console.error('Error en debug-prestadas', err);
    process.exit(1);
  }
}

debug();
