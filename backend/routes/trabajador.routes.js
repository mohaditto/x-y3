import express from "express";
import { pool } from "../db.js";
const router = express.Router();

//Registrar ENTRADA
router.post("/asistencia", async (req, res) => {
  try {
    const { fecha, hora_entrada, usuario_id } = req.body;
    console.log("Datos recibidos:", req.body);

    // Validar datos
    if (!fecha || !hora_entrada || !usuario_id) {
      return res.status(400).json({ message: "Faltan datos obligatorios" });
    }

    const horaSolo = hora_entrada.split("T")[1]?.slice(0, 8);
    const fechaSQL = fecha;

    // Verificar si ya existe asistencia hoy
    const [existe] = await pool.query(
      "SELECT id FROM asistencias WHERE usuario_id = ? AND fecha = ?",
      [usuario_id, fechaSQL]
    );
    if (existe.length > 0) {
      return res
        .status(400)
        .json({ message: "Ya existe asistencia registrada para hoy" });
    }

    // Insertar registro
    const [result] = await pool.query(
      "INSERT INTO asistencias (usuario_id, fecha, hora_entrada, estado, turno_id) VALUES (?, ?, ?, 'PRESENTE', 1)",
      [usuario_id, fechaSQL, horaSolo]
    );

    res.json({
      id: result.insertId,
      fecha: fechaSQL,
      hora_entrada: horaSolo.slice(0, 5),
    });
  } catch (error) {
    console.error(" Error en registrar entrada:", error);
    res.status(500).json({ message: "Error al registrar asistencia" });
  }
});

// Registrar SALIDA }
router.put("/asistencia/salida/:usuario_id", async (req, res) => {
  try {
    const { usuario_id } = req.params;
    const hoy = new Date().toISOString().slice(0, 10);
    const horaSalida = new Date().toTimeString().slice(0, 8);

    const [asistencia] = await pool.query(
      "SELECT id FROM asistencias WHERE usuario_id = ? AND fecha = ?",
      [usuario_id, hoy]
    );

    if (asistencia.length === 0) {
      return res
        .status(404)
        .json({ message: "No se encontró asistencia del día para registrar salida." });
    }

    const id = asistencia[0].id;
    await pool.query(
      "UPDATE asistencias SET hora_salida = ?, estado = 'PRESENTE' WHERE id = ?",
      [horaSalida, id]
    );

    res.json({
      message: "Salida registrada correctamente",
      hora_salida: horaSalida.slice(0, 5),
    });
  } catch (error) {
    console.error("Error al registrar salida:", error);
    res.status(500).json({ message: "Error al registrar salida" });
  }
});


// Obtener todas las asistencias del trabajador
router.get("/asistencias/:usuario_id", async (req, res) => {
  try {
    const { usuario_id } = req.params;

    const [rows] = await pool.query(
      "SELECT id, fecha, hora_entrada, hora_salida FROM asistencias WHERE usuario_id = ? ORDER BY fecha DESC, hora_entrada ASC",
      [usuario_id]
    );

    console.log(" Asistencias enviadas:", rows);
    res.json(rows);
  } catch (error) {
    console.error(" Error al obtener asistencias:", error);
    res.status(500).json({ message: "Error al obtener asistencias" });
  }
});


export default router;
