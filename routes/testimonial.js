const express = require("express");
const multer = require("multer");
const path = require("path");
const router = express.Router();
const { poolPromise } = require("../config/db");

// Set up multer for file uploads
const storage = multer.diskStorage({
  destination: "./uploads/Testimonial/",
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

// 📌 **Get All Testimonials**
router.get("/", async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query("SELECT * FROM tbl_testimonial WHERE del = 0");
    res.json(result.recordset);
  } catch (err) {
    console.error("Database Error:", err);
    res.status(500).json({ error: "Database connection failed" });
  }
});

// 📌 **Add a New Testimonial**
router.post("/", upload.single("image"), async (req, res) => {
  const { name, rating, comment } = req.body;
  const image_path = req.file ? `Testimonial/${req.file.filename}` : null;

  if (!name || !image_path) {
    return res.status(400).json({ error: "Name and Image are required" });
  }

  try {
    const pool = await poolPromise;
    await pool
      .request()
      .input("name", name)
      .input("rating", rating)
      .input("comment", comment)
      .input("image_path", image_path)
      .query(
        "INSERT INTO tbl_testimonial (name, rating, comment, image_path, status, createdAT, del) VALUES (@name, @rating, @comment, @image_path, 1, GETDATE(), 0)"
      );

    res.status(201).json({ message: "Testimonial added successfully" });
  } catch (err) {
    console.error("Database Error:", err);
    res.status(500).json({ error: "Database insertion failed" });
  }
});

// 📌 **Edit Testimonial (Update Name, Rating, Comment, and Image)**
router.put("/:id", upload.single("image"), async (req, res) => {
  const { id } = req.params;
  const { name, rating, comment } = req.body;
  const image_path = req.file ? `Testimonial/${req.file.filename}` : null;

  try {
    const pool = await poolPromise;
    let query = "UPDATE tbl_testimonial SET name = @name, rating = @rating, comment = @comment";
    
    if (image_path) {
      query += ", image_path = @image_path";
    }
    
    query += " WHERE idKey = @id";

    const request = pool.request()
      .input("id", id)
      .input("name", name)
      .input("rating", rating)
      .input("comment", comment);

    if (image_path) {
      request.input("image_path", image_path);
    }

    await request.query(query);
    res.json({ message: "Testimonial updated successfully" });
  } catch (err) {
    console.error("Database Error:", err);
    res.status(500).json({ error: "Failed to update testimonial" });
  }
});

// 📌 Update Testimonial Status
router.put("/status/:id", async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (status === undefined || (status !== 0 && status !== 1)) {
    return res.status(400).json({ success: false, message: "Invalid status value" });
  }

  try {
    const pool = await poolPromise;

    const result = await pool
      .request()
      .input("id", id)
      .input("status", status)
      .query("UPDATE tbl_testimonial SET status = @status WHERE idKey = @id");

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ success: false, message: "Testimonial not found" });
    }

    res.json({ success: true, newStatus: status });
  } catch (err) {
    console.error("Error updating status:", err);
    res.status(500).json({ success: false, message: "Database error" });
  }
});

// 📌 **Soft Delete Testimonial**
router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const pool = await poolPromise;
    await pool
      .request()
      .input("id", id)
      .query("UPDATE tbl_testimonial SET del = 1 WHERE idKey = @id");

    res.json({ message: "Testimonial deleted successfully" });
  } catch (err) {
    console.error("Database Error:", err);
    res.status(500).json({ error: "Failed to delete testimonial" });
  }
});

module.exports = router;
