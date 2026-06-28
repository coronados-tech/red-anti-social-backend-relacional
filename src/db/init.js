const { sequelize } = require("./models");
const { runMigrations } = require("./migrate");

let dbReady = false;
let dbInitPromise = null;

const initDatabase = async () => {
    if (dbReady) return;

    if (!dbInitPromise) {
        dbInitPromise = (async () => {
            await sequelize.authenticate();
            await runMigrations();

            const syncOptions = {};
            if (process.env.DB_SYNC_FORCE === "true") {
                syncOptions.force = true;
            }

            await sequelize.sync(syncOptions);
            dbReady = true;
        })().catch((err) => {
            dbInitPromise = null;
            throw err;
        });
    }

    await dbInitPromise;
};

module.exports = { initDatabase };
