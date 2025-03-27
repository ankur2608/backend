const express = require("express");
const multer = require("multer");
const path = require("path");
const router = express.Router();
const { poolPromise } = require("../config/db");

// Set up multer for file uploads
const storage = multer.diskStorage({
    destination: "./uploads/PressRelease/",
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    },
});
const upload = multer({ storage });

// 📌 **Get All Press Releases**
router.get("/", async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query("SELECT * FROM tbl_press_release WHERE del = 0");
        res.json(result.recordset);
    } catch (err) {
        console.error("Database Error:", err);
        res.status(500).json({ error: "Database connection failed" });
    }
});

// 📌 **Add a New Press Release**
router.post("/", upload.single("file"), async (req, res) => {
    const {type, title } = req.body;
    const path = req.file ? `PressRelease/${req.file.filename}` : null;

    if (!type || !path) {
        return res.status(400).json({ error: "type and File are required" });
    }

    try {
        const pool = await poolPromise;
        await pool
            .request()
            .input("type", type)
            .input("title", title)
            .input("path", path)
            .query(
                "INSERT INTO tbl_press_release (type, title, path, status, createdAT, del) VALUES (@type, @title, @path, 1, GETDATE(), 0)"
            );

        res.status(201).json({ message: "Press release added successfully" });
    } catch (err) {
        console.error("Database Error:", err);
        res.status(500).json({ error: "Database insertion failed" });
    }
});

// 📌 **Edit Press Release (Update Title, Category, Description, and File)**
router.put("/:id", upload.single("file"), async (req, res) => {
    const { id } = req.params;
    const {type, title } = req.body;
    const path = req.file ? `PressRelease/${req.file.filename}` : null;

    try {
        const pool = await poolPromise;
        let query = "UPDATE tbl_press_release SET type = @type, title = @title";
        
        if (path) {
            query += ", path = @path";
        }
        
        query += " WHERE idKey = @id";

        const request = pool.request()
            .input("id", id)
            .input("type", type)
            .input("title", title);

        if (path) {
            request.input("path", path);
        }

        await request.query(query);
        res.json({ message: "Press release updated successfully" });
    } catch (err) {
        console.error("Database Error:", err);
        res.status(500).json({ error: "Failed to update press release" });
    }
});

// 📌 Update Slider Status
router.put("/status/:id", async (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // Accept the status from the request body

  if (status === undefined || (status !== 0 && status !== 1)) {
    return res.status(400).json({ success: false, message: "Invalid status value" });
  }

  try {
    const pool = await poolPromise;

    // Update the status in the database
    const result = await pool
      .request()
      .input("id", id)
      .input("status", status)
      .query("UPDATE tbl_press_release SET status = @status WHERE idKey = @id");

    // Check if rows were updated (i.e., the slider exists)
    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ success: false, message: "Slider not found" });
    }

    // Send success response with the new status
    res.json({ success: true, newStatus: status });
  } catch (err) {
    console.error("Error updating status:", err);
    res.status(500).json({ success: false, message: "Database error" });
  }
});


// 📌 **Soft Delete Press Release**
router.delete("/:id", async (req, res) => {
    const { id } = req.params;

    try {
        const pool = await poolPromise;
        await pool
            .request()
            .input("id", id)
            .query("UPDATE tbl_press_release SET del = 1 WHERE idKey = @id");

        res.json({ message: "Press release deleted successfully" });
    } catch (err) {
        console.error("Database Error:", err);
        res.status(500).json({ error: "Failed to delete press release" });
    }
});

module.exports = router;