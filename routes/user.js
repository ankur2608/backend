const sql = require("mssql");
require("dotenv").config();

const config = {
  server: process.env.DB_SERVER,
  database: process.env.DB_DATABASE,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT) || 1433,
  options: {
    encrypt: false, // Set to true if using Azure
    trustServerCertificate: true,
  },
};

const poolPromise = new sql.ConnectionPool(config)
  .connect()
  .then((pool) => {
    console.log("✅ Connected to SQL Server");
    return pool;
  })
  .catch((err) => {
    console.error("❌ Database connection failed:", err);
    throw err;
  });

module.exports = { poolPromise, sql };
