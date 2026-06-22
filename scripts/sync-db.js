require("dotenv").config();
const { sequelize } = require("../src/db/models");
const { runMigrations } = require("../src/db/migrate");

(async () => {
  await sequelize.authenticate();
  await runMigrations();
  await sequelize.sync();
  console.log("Base de datos actualizada correctamente");
  await sequelize.close();
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
