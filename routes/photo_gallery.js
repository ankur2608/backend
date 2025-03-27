const express = require("express");
const multer = require("multer");
const path = require("path");
const router = express.Router();
const { poolPromise } = require("../config/db");

// Set up multer for file uploads
const storage = multer.diskStorage({
  destination: "./uploads/PhotoGallery/",
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

// 📌 **Get All Photos**
router.get("/", async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query("SELECT * FROM tbl_gallery WHERE del = 0 and type = 'Photo'");
    res.json(result.recordset);
  } catch (err) {
    console.error("Database Error:", err);
    res.status(500).json({ error: "Database connection failed" });
  }
});

// 📌 **Add a New Photo**
router.post("/", upload.single("image"), async (req, res) => {
  const { title, category } = req.body;
  const path = req.file ? `PhotoGallery/${req.file.filename}` : null;

  if (!path) {
    return res.status(400).json({ error: "Image are required" });
  }

  try {
    const pool = await poolPromise;
    await pool
      .request()
      .input("title", title)
      .input("category", category)
      .input("path", path)
      .query(
        "INSERT INTO tbl_gallery (type, title, category, path, status, createdAT, del) VALUES ('Photo', @title, @category, @path, 1, GETDATE(), 0)"
      );

    res.status(201).json({ message: "Photo added successfully" });
  } catch (err) {
    console.error("Database Error:", err);
    res.status(500).json({ error: "Database insertion failed" });
  }
});

// 📌 **Edit Photo (Update Title, Category, and Image)**
router.put("/:id", upload.single("image"), async (req, res) => {
  const { id } = req.params;
  const { title, category } = req.body;
  const path = req.file ? `PhotoGallery/${req.file.filename}` : null;

  try {
    const pool = await poolPromise;
    let query = "UPDATE tbl_gallery SET title = @title, category = @category";
    
    if (path) {
      query += ", path = @path";
    }
    
    query += " WHERE idKey = @id";

    const request = pool.request()
      .input("id", id)
      .input("title", title)
      .input("category", category);

    if (path) {
      request.input("path", path);
    }

    await request.query(query);
    res.json({ message: "Photo updated successfully" });
  } catch (err) {
    console.error("Database Error:", err);
    res.status(500).json({ error: "Failed to update photo" });
  }
});

// 📌 Update Gallery Status
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
      .query("UPDATE tbl_gallery SET status = @status WHERE idKey = @id");

    // Check if rows were updated (i.e., the slider exists)
    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ success: false, message: "Photo not found" });
    }

    // Send success response with the new status
    res.json({ success: true, newStatus: status });
  } catch (err) {
    console.error("Error updating status:", err);
    res.status(500).json({ success: false, message: "Database error" });
  }
});


// 📌 **Soft Delete Photo**
router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const pool = await poolPromise;
    await pool
      .request()
      .input("id", id)
      .query("UPDATE tbl_gallery SET del = 1 WHERE idKey = @id");

    res.json({ message: "Photo deleted successfully" });
  } catch (err) {
    console.error("Database Error:", err);
    res.status(500).json({ error: "Failed to delete photo" });
  }
});

module.exports = router;