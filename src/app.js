const dotenv = require("dotenv");
dotenv.config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const i18n = require("i18n");
const errorMiddleware = require("./middlewares/error.middleware");
const filterPostCommentsMiddleware = require("./middlewares/filterPostComments.middleware");

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
            const { sequelize } = require("./db/models");
            const { runMigrations } = require("./db/migrate");

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

i18n.configure({
    locales: ["es"],
    directory: path.join(__dirname, "locales"),
    defaultLocale: locale,
    autoReload: true,
    updateFiles: false,
});

const authRouter = resolveHandler(require("./routes/auth.routes"));
const commentsRouter = resolveHandler(require("./routes/comments.route"));
const usersRouter = resolveHandler(require("./routes/user.routes"));
const postsRouter = resolveHandler(require("./routes/post.routes"));
const postImagesRouter = resolveHandler(require("./routes/postimage.routes"));
const tagsRouter = resolveHandler(require("./routes/tag.routes"));

const app = express();

const corsOrigins = (process.env.CORS_ORIGIN || "http://localhost:5173,http://localhost:5174")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

const enableSwagger = process.env.NODE_ENV !== "production" || process.env.ENABLE_SWAGGER === "true";

app.use(
    cors({
        origin: corsOrigins,
    }),
);
app.use(i18n.init.bind(i18n));
app.use(express.json());

app.use(async (_req, _res, next) => {
    try {
        await ensureDatabase();
        next();
    } catch (err) {
        next(err);
    }
});

if (enableSwagger) {
    const swaggerUi = require("swagger-ui-express");
    const YAML = require("yamljs");
    const swaggerDocument = YAML.load(path.join(__dirname, "../docs/swagger.yaml"));
    app.use("/swagger", ...swaggerUi.serve, swaggerUi.setup(swaggerDocument));
}

app.use("/auth", authRouter);
app.use("/comments", commentsRouter);
app.use("/users", usersRouter);
app.use("/posts", resolveHandler(filterPostCommentsMiddleware), postsRouter);
app.use("/tags", tagsRouter);

const uploadsRoot = process.env.VERCEL
    ? path.join("/tmp", "uploads")
    : path.join(__dirname, "../uploads");

app.use("/uploads", express.static(uploadsRoot));
app.use("/post-images", postImagesRouter);

app.use(resolveHandler(errorMiddleware));

module.exports = app;
app.ensureDatabase = ensureDatabase;
