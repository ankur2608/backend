const sql = require("mssql/msnodesqlv8");

const config = {
  server: process.env.ANKUR, // Read from environment variables
  database: process.env.Schoolmanagement, // Read from environment variables
  options: {
    trustedConnection: true,
    trustServerCertificate: true,
  },
  driver: "msnodesqlv8",
};

const poolPromise = new sql.ConnectionPool(config)
  .connect()
  .then((pool) => {
    console.log("Connected to SQL Server");
    return pool;
  })
  .catch((err) => {
    console.error("Database connection failed:", err);
    throw err;
  });

module.exports = { poolPromise, sql };
