const express = require("express");
const { Pool } = require("pg");
const cors = require("cors");
const bodyParser = require("body-parser");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// PostgreSQL connection
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

// Check connection
pool.connect()
  .then(() => console.log("✅ Connected to PostgreSQL database"))
  .catch((err) => console.error("❌ Database connection failed:", err));

// ✅ POST /api/submit: รับข้อมูลจาก React Native แล้วบันทึกลงฐานข้อมูล
app.post("/api/submit", async (req, res) => {
  const {
    status,
    moment,
    activity,
    method,
    quality,
    evaluator,
    suggestion,
    timestamp,
  } = req.body;

  try {
    const insertQuery = `
      INSERT INTO handwashing_logs
      (status, moment, activity, method, quality, evaluator, suggestion, timestamp)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *;
    `;

    const result = await pool.query(insertQuery, [
      status,
      moment,
      activity,
      method,
      quality,
      evaluator,
      suggestion,
      timestamp,
    ]);

    res.json({ status: "success", data: result.rows[0] });
  } catch (error) {
    console.error("❌ Error inserting data:", error);
    res.status(500).json({ status: "error", message: "Failed to insert data" });
  }
});

// เพิ่มใน server.js
app.get("/api/stats", async (req, res) => {
  try {
    const statsQuery = `
      SELECT * FROM handwash
      ORDER BY timestamp DESC
      LIMIT 100;
    `;
    const result = await pool.query(statsQuery);
    res.json({ status: "success", data: result.rows });
  } catch (error) {
    console.error("❌ Error fetching stats:", error);
    res.status(500).json({ status: "error", message: "Failed to fetch stats" });
  }
});

app.get("/api/ping", (req, res) => {
  res.json({ status: "success", message: "API server is running", timestamp: new Date() });
});

app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});
