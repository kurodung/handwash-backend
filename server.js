const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const bodyParser = require("body-parser");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Connection Pool แทนการเชื่อมต่อเดี่ยว
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// แปลง pool เป็น promise เพื่อใช้ async/await
const promisePool = pool.promise();

// ตรวจสอบการเชื่อมต่อฐานข้อมูล
pool.getConnection((err, connection) => {
  if (err) {
    console.error("❌ Database connection failed:", err);
    if (err.code === 'ER_BAD_DB_ERROR') {
      console.error("Database doesn't exist. Please create it first.");
    }
    return;
  }
  console.log("✅ Connected to MySQL database");
  connection.release();
});

// Root endpoint
app.get("/", (req, res) => {
  res.send("Handwashing API is running");
});

// บันทึกข้อมูล handwashing
app.post("/api/submit", async (req, res) => {
    try {
      const {
        status,
        moment,
        activity,
        method,
        quality,
        evaluator,
        suggestion,
        timestamp: clientTimestamp
      } = req.body;
  
      if (!status || !moment || !method || !quality || !evaluator) {
        return res.status(400).json({ 
          status: "error", 
          message: "กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน" 
        });
      }
  
      const sql = `
        INSERT INTO handwash
        (status, moment, activity, method, quality, evaluator, suggestion, timestamp) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;
  
      const finalTimestamp = clientTimestamp || new Date().toISOString();
  
      const [result] = await promisePool.execute(
        sql,
        [status, moment, activity || '', method, quality, evaluator, suggestion || '', finalTimestamp]
      );
  
      console.log("✅ Data inserted successfully:", result.insertId);
      
      res.status(200).json({ 
        status: "success", 
        message: "บันทึกข้อมูลสำเร็จจจจจ",
        insertedId: result.insertId 
      });
    } catch (err) {
      console.error("❌ Error processing request:", err);
      res.status(500).json({ 
        status: "error", 
        message: "เกิดข้อผิดพลาดในการบันทึกข้อมูล: " + err.message 
      });
    }
  });
  

// เพิ่ม endpoint สำหรับดึงข้อมูลการประเมินทั้งหมด
app.get("/api/records", async (req, res) => {
  try {
    const [rows] = await promisePool.query("SELECT * FROM handwash ORDER BY timestamp DESC");
    res.json({ status: "success", data: rows });
  } catch (err) {
    console.error("❌ Error fetching records:", err);
    res.status(500).json({ status: "error", message: err.message });
  }
});

// เพิ่ม endpoint สำหรับดึงข้อมูลสถิติ
app.get("/api/stats", async (req, res) => {
  try {
    // จำนวนการประเมินตามสถานะ
    const [statusStats] = await promisePool.query(
      "SELECT status, COUNT(*) as count FROM handwash GROUP BY status"
    );
    
    // จำนวนการประเมินตามวิธีการล้างมือ
    const [methodStats] = await promisePool.query(
      "SELECT method, COUNT(*) as count FROM handwash GROUP BY method"
    );
    
    // จำนวนการประเมินตามคุณภาพ
    const [qualityStats] = await promisePool.query(
      "SELECT quality, COUNT(*) as count FROM handwash GROUP BY quality"
    );
    
    res.json({ 
      status: "success", 
      data: {
        byStatus: statusStats,
        byMethod: methodStats,
        byQuality: qualityStats
      }
    });
  } catch (err) {
    console.error("❌ Error fetching stats:", err);
    res.status(500).json({ status: "error", message: err.message });
  }
});

// เริ่มต้น server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});