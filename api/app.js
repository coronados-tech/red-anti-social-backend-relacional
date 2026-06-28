const dotenv = require("dotenv");
dotenv.config();

// Vercel no detecta drivers que Sequelize carga dinámicamente
require("pg");
require("sqlite3");

const express = require("express");
const cors = require("cors");
const path = require("path");
const i18n = require("i18n");

const resolveHandler = (mod) => {
    if (typeof mod === "function") return mod;
    if (mod?.default && typeof mod.default === "function") return mod.default;
    return mod;
};

const locale = process.env.IDIOMA === "es" ? process.env.IDIOMA : "es";

let dbReady = false;
let dbInitPromise = null;

async function ensureDatabase() {
    if (dbReady) return;

    if (!dbInitPromise) {
        dbInitPromise = (async () => {
            const { sequelize } = require("../src/db/models");
            const { runMigrations } = require("../src/db/migrate");

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
}

function databaseMiddleware(_req, _res, next) {
    ensureDatabase().then(() => next()).catch(next);
}

i18n.configure({
    locales: ["es"],
    directory: path.join(__dirname, "../src/locales"),
    defaultLocale: locale,
    autoReload: true,
    updateFiles: false,
});

const authRouter = resolveHandler(require("../src/routes/auth.routes"));
const commentsRouter = resolveHandler(require("../src/routes/comments.route"));
const usersRouter = resolveHandler(require("../src/routes/user.routes"));
const postsRouter = resolveHandler(require("../src/routes/post.routes"));
const postImagesRouter = resolveHandler(require("../src/routes/postimage.routes"));
const tagsRouter = resolveHandler(require("../src/routes/tag.routes"));
const errorMiddleware = resolveHandler(require("../src/middlewares/error.middleware"));
const filterPostCommentsMiddleware = resolveHandler(
    require("../src/middlewares/filterPostComments.middleware"),
);

const app = express();

const corsOrigins = (process.env.CORS_ORIGIN || "http://localhost:5173,http://localhost:5174")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

const enableSwagger = process.env.NODE_ENV !== "production" || process.env.ENABLE_SWAGGER === "true";

app.use(cors({ origin: corsOrigins }));
app.use((req, res, next) => i18n.init(req, res, next));
app.use(express.json());
app.use(databaseMiddleware);

if (enableSwagger) {
    const swaggerUi = require("swagger-ui-express");
    const YAML = require("yamljs");
    const swaggerDocument = YAML.load(path.join(__dirname, "../docs/swagger.yaml"));
    app.use("/swagger", ...swaggerUi.serve, swaggerUi.setup(swaggerDocument));
}

app.use("/auth", authRouter);
app.use("/comments", commentsRouter);
app.use("/users", usersRouter);
app.use("/posts", filterPostCommentsMiddleware, postsRouter);
app.use("/tags", tagsRouter);

const uploadsRoot = process.env.VERCEL
    ? path.join("/tmp", "uploads")
    : path.join(__dirname, "../uploads");

app.use("/uploads", express.static(uploadsRoot));
app.use("/post-images", postImagesRouter);
app.use(errorMiddleware);

module.exports = app;
app.ensureDatabase = ensureDatabase;
