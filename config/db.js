const sql = require("mssql");

const config = {
  user: process.env.sa, // SQL Server username
  password: process.env.sa123, // SQL Server password
  server: process.env.ANKUR, // Azure SQL Server address
  database: process.env.SCHOOLMANAGEMENT, // Your database name
  options: {
    encrypt: true, // Required for Azure
    trustServerCertificate: false, // Should be false for Azure
  },
};

const poolPromise = new sql.ConnectionPool(config)
  .connect()
  .then((pool) => {
    console.log("Connected to Azure SQL Server");
    return pool;
  })
  .catch((err) => {
    console.error("Database connection failed:", err);
    throw err;
  });

module.exports = { poolPromise, sql };
