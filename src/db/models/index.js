"use strict";

const fs = require("fs");
const path = require("path");
const Sequelize = require("sequelize");
const process = require("process");
const buildConfig = require("../config");
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || "development";
const config = buildConfig(env);
const db = {};

const createSequelize = (dbConfig) => {
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
