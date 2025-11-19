// backend/middleware/auth.js
import jwt from "jsonwebtoken";

// ✅ Middleware para verificar si el usuario está autenticado
export function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;

    if (!token) {
      return res.status(401).json({ error: "Token requerido" });
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET || "dev");
    req.user = payload; // { id, nombre, email, rol }
    next();
  } catch (error) {
    console.error("❌ Error en requireAuth:", error);
    return res.status(401).json({ error: "Token inválido o expirado" });
  }
}

// ✅ Middleware para restringir acceso solo a administradores
export function requireAdmin(req, res, next) {
  try {
    if (req.user?.rol === "admin") {
      return next();
    } else {
      return res.status(403).json({ error: "Solo administradores" });
    }
  } catch (error) {
    console.error("❌ Error en requireAdmin:", error);
    return res.status(500).json({ error: "Error interno en autorización" });
  }
}
