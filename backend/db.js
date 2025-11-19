import mysql from "mysql2/promise";

export const pool = mysql.createPool({
  host: process.env.MYSQLHOST || "localhost",
  user: process.env.MYSQLUSER || "root",
  port: Number(process.env.MYSQLPORT || 3306),
  password: process.env.MYSQLPASSWORD || "",
  database: process.env.MYSQLDATABASE || "x&y",
  connectionLimit: 10,
});
