"use strict";

const fs = require("fs");
const path = require("path");
const Sequelize = require("sequelize");
const process = require("process");
const buildConfig = require("../config");
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || "development";

const isVercelRuntime = () =>
  Boolean(process.env.VERCEL || process.env.VERCEL_ENV) ||
  (typeof process.cwd === "function" && process.cwd().startsWith("/var/task")) ||
  __dirname.includes("/var/task");

const hasDatabaseUrl = () =>
  Boolean((process.env.DATABASE_URL || process.env.POSTGRES_URL || "").trim());

if (isVercelRuntime() && !hasDatabaseUrl()) {
  throw new Error(
    "Falta DATABASE_URL en Vercel. Agregala en Settings → Environment Variables y hacé Redeploy.",
  );
}

const config = buildConfig(env);
const db = {};

const loadDialectDriver = (dialect) => {
  switch (dialect) {
    case "mysql":
    case "mariadb":
      require("mysql2");
      break;
    case "postgres":
      require("pg");
      break;
    case "sqlite":
      require("sqlite3");
      break;
    default:
      break;
  }
};

loadDialectDriver(config.dialect);

const createSequelize = (dbConfig) => {
  if (dbConfig.url) {
    return new Sequelize(dbConfig.url, {
      dialect: dbConfig.dialect,
      logging: dbConfig.logging,
      dialectOptions: dbConfig.dialectOptions,
    });
  }

  if (dbConfig.dialect === "sqlite") {
    return new Sequelize({
      dialect: "sqlite",
      storage: dbConfig.storage,
      logging: dbConfig.logging,
    });
  }

  return new Sequelize(
    dbConfig.database,
    dbConfig.username,
    dbConfig.password,
    {
      host: dbConfig.host,
      port: dbConfig.port,
      dialect: dbConfig.dialect,
      logging: dbConfig.logging,
      dialectOptions: dbConfig.dialectOptions,
    },
  );
};

const sequelize = createSequelize(config);

fs.readdirSync(__dirname)
  .filter((file) => {
    return (
      file.indexOf(".") !== 0 &&
      file !== basename &&
      file.slice(-3) === ".js" &&
      file.indexOf(".test.js") === -1
    );
  })
  .forEach((file) => {
    const model = require(path.join(__dirname, file))(
      sequelize,
      Sequelize.DataTypes,
    );
    db[model.name] = model;
  });

Object.keys(db).forEach((modelName) => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
