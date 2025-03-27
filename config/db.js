const sql = require("mssql");

// Database Configuration
const config = {
  user: process.env.DB_USER,        // Database username from .env
  password: process.env.DB_PASSWORD, // Database password from .env
  server: process.env.DB_HOST,       // Server IP or domain
  database: process.env.DB_NAME,     // Database name
  options: {
    encrypt: true,  // Use true for Azure SQL, false for local servers
    trustServerCertificate: true, // Use true if running without SSL
  },
};

// Create a connection pool
const poolPromise = new sql.ConnectionPool(config)
  .connect()
  .then((pool) => {
    console.log("✅ Connected to SQL Server successfully!");
    return pool;
  })
  .catch((err) => {
    console.error("❌ Database connection failed:", err);
    throw err;
  });

module.exports = { poolPromise, sql };
