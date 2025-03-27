const express = require("express");
const multer = require("multer");
const path = require("path");
const router = express.Router();
const { poolPromise } = require("../config/db");

// Set up multer for file uploads
const storage = multer.diskStorage({
  destination: "./uploads/StudentBirthday",
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

// 📌 **Get All Student Birthdays**
router.get("/", async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query("SELECT * FROM tbl_stuBday WHERE del = 0");
    res.json(result.recordset);
  } catch (err) {
    console.error("Database Error:", err);
    res.status(500).json({ error: "Database connection failed" });
  }
});

// 📌 **Add a New Student Birthday**
router.post("/", upload.single("image"), async (req, res) => {
  const { name, dob, batch } = req.body;
  const image_path = req.file ? `StudentBirthday/${req.file.filename}` : null;

  if (!name || !dob || !batch || !image_path) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    const pool = await poolPromise;
    await pool
      .request()
      .input("name", name)
      .input("dob", dob)
      .input("batch", batch)
      .input("image_path", image_path)
      .query(
        "INSERT INTO tbl_stuBday (name, dob, batch, image_path, status, createdAT, del) VALUES (@name, @dob, @batch, @image_path, 1, GETDATE(), 0)"
      );

    res.status(201).json({ message: "Student birthday added successfully" });
  } catch (err) {
    console.error("Database Error:", err);
    res.status(500).json({ error: "Database insertion failed" });
  }
});

// 📌 **Edit Student Birthday**
router.put("/:id", upload.single("image"), async (req, res) => {
  const { id } = req.params;
  const { name, dob, batch } = req.body;
  const image_path = req.file ? `StudentBirthday/${req.file.filename}` : null;

  try {
    const pool = await poolPromise;
    let query = "UPDATE tbl_stuBday SET name = @name, dob = @dob, batch = @batch";
    
    if (image_path) {
      query += ", image_path = @image_path";
    }

    query += " WHERE idKey = @id";

    const request = pool.request()
      .input("id", id)
      .input("name", name)
      .input("dob", dob)
      .input("batch", batch);

    if (image_path) {
      request.input("image_path", image_path);
    }

    await request.query(query);
    res.json({ message: "Student birthday updated successfully" });
  } catch (err) {
    console.error("Database Error:", err);
    res.status(500).json({ error: "Failed to update student birthday" });
  }
});

// 📌 Update Student Birthday Status
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
      .query("UPDATE tbl_stuBday SET status = @status WHERE idKey = @id");

    // Check if rows were updated (i.e., the slider exists)
    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ success: false, message: "Student Birthday not found" });
    }

    // Send success response with the new status
    res.json({ success: true, newStatus: status });
  } catch (err) {
    console.error("Error updating status:", err);
    res.status(500).json({ success: false, message: "Database error" });
  }
});


// 📌 **Delete Student Birthday**
router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const pool = await poolPromise;
    await pool
      .request()
      .input("id", id)
      .query("UPDATE tbl_stuBday SET del = 1 WHERE idKey = @id");

    res.json({ message: "Student birthday deleted successfully" });
  } catch (err) {
    console.error("Database Error:", err);
    res.status(500).json({ error: "Failed to delete student birthday" });
  }
});

module.exports = router;
