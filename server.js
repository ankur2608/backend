require('dotenv').config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const { poolPromise } = require("./config/db");


const app = express();
app.use(express.json());
app.use(cors());

// Serve static files (uploaded images)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// === Backend API Routes ===
app.use("/api/slider", require("./routes/slider"));
app.use("/api/testimonial", require("./routes/testimonial"));
app.use("/api/stu_birthday", require("./routes/stu_birthday"));
app.use("/api/messages_content", require("./routes/messages_content"));
app.use("/api/toppers", require("./routes/toppers"));
app.use("/api/photo_gallery", require("./routes/photo_gallery"));
app.use("/api/video_gallery", require("./routes/video_gallery"));
app.use("/api/press_release", require("./routes/press_release"));

app.get("/", (req, res) => {
  res.send("API is running...");
});

const PORT = process.env.PORT || 5000;


const os = require("os");
const networkInterfaces = os.networkInterfaces();
const ip = networkInterfaces["Wi-Fi"] || networkInterfaces["Ethernet"]; 
const localIP = ip ? ip.find((x) => x.family === "IPv4").address : "127.0.0.1";

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on: http://${localIP}:${PORT}`);
});
