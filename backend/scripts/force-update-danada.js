import { pool } from '../db.js';

async function forceUpdate() {
  try {
    // Obtener primero todos los IDs que necesitan ser actualizados
    const [ids] = await pool.query(
      "SELECT id FROM herramientas WHERE estado NOT IN ('DISPONIBLE', 'NO_DISPONIBLE', 'MANTENCION', 'DAÑADA', 'BAJA')"
    );
    
    console.log('IDs encontrados con estados inválidos:', ids.map(i => i.id));
    
    // Actualizar cada uno individualmente
    for (const {id} of ids) {
      const [result] = await pool.query(
        "UPDATE herramientas SET estado = 'DAÑADA' WHERE id = ?",
        [id]
      );
      console.log(`Actualizado ID ${id}: ${result.affectedRows > 0 ? 'OK' : 'FAIL'}`);
    }
    
    // Verificar final
    const [check] = await pool.query(
      "SELECT id, nombre, estado FROM herramientas WHERE id IN (SELECT id FROM herramientas)"
    );
    console.log('\nEstado final de herramientas dañadas:');
    check.filter(h => h.estado === 'DAÑADA' || h.nombre.includes('Destornillador') || h.nombre.includes('Casco')).forEach(h => {
      console.log(`- ${h.nombre}: "${h.estado}"`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

forceUpdate();
