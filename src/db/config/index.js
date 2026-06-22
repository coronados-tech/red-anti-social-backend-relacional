const fs = require("fs");
const path = require("path");

const DEFAULT_PORTS = {
  mysql: 3306,
  mariadb: 3306,
  postgres: 5432,
};

const ensureSqliteDir = (storagePath) => {
  const dir = path.dirname(storagePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

const buildConfig = (env = "development") => {
  const dialect = (process.env.DB_DIALECT || "sqlite").toLowerCase();
  const logging = process.env.DB_LOGGING === "true" ? console.log : false;

  if (dialect === "sqlite") {
    const storage =
      process.env.DB_STORAGE ||
      path.join(process.cwd(), "data", "datastore.db");

    ensureSqliteDir(storage);

    return {
      dialect: "sqlite",
      storage,
      logging,
    };
  }

  const defaultPort = DEFAULT_PORTS[dialect] ?? 3306;

  return {
    dialect,
    host: process.env.DB_HOST || "127.0.0.1",
    port: Number(process.env.DB_PORT || defaultPort),
    database: process.env.DB_NAME || `anti-social-${env}`,
    username: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || null,
    logging,
  };
};

module.exports = buildConfig;
