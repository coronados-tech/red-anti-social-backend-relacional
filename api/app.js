const dotenv = require("dotenv");

if (!process.env.VERCEL) {
  dotenv.config();
}

const isVercelRuntime = () =>
  Boolean(process.env.VERCEL || process.env.VERCEL_ENV) ||
  (typeof process.cwd === "function" && process.cwd().startsWith("/var/task")) ||
  __dirname.includes("/var/task");

const hasDatabaseUrl = () =>
  Boolean((process.env.DATABASE_URL || process.env.POSTGRES_URL || "").trim());

const runningOnVercel = isVercelRuntime();

require("pg");
if (!runningOnVercel) {
  require("sqlite3");
}

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

  if (!hasDatabaseUrl()) {
    throw new Error(
      "Falta DATABASE_URL en Vercel. Settings → Environment Variables → pegá la connection string de Neon → Redeploy.",
    );
  }

  if (!dbInitPromise) {
    dbInitPromise = (async () => {
      const { sequelize } = require(path.join(__dirname, "../src/db/models"));
      const { runMigrations } = require(path.join(__dirname, "../src/db/migrate"));

      await sequelize.authenticate();

      const syncOptions = {};
      if (process.env.DB_SYNC_FORCE === "true") {
        syncOptions.force = true;
      }

      await sequelize.sync(syncOptions);
      await runMigrations();
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

const filterPostCommentsMiddleware = resolveHandler(
  require(path.join(__dirname, "../src/middlewares/filterPostComments.middleware")),
);
const errorMiddleware = resolveHandler(
  require(path.join(__dirname, "../src/middlewares/error.middleware")),
);

const authRouter = resolveHandler(require(path.join(__dirname, "../src/routes/auth.routes")));
const commentsRouter = resolveHandler(require(path.join(__dirname, "../src/routes/comments.route")));
const usersRouter = resolveHandler(require(path.join(__dirname, "../src/routes/user.routes")));
const postsRouter = resolveHandler(require(path.join(__dirname, "../src/routes/post.routes")));
const postImagesRouter = resolveHandler(require(path.join(__dirname, "../src/routes/postimage.routes")));
const tagsRouter = resolveHandler(require(path.join(__dirname, "../src/routes/tag.routes")));

const app = express();

const defaultCorsOrigins =
  "http://localhost:5173,http://localhost:5174,https://red-anti-social.vercel.app";

const corsOrigins = (process.env.CORS_ORIGIN || defaultCorsOrigins)
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

function isAllowedCorsOrigin(origin) {
  if (!origin) return true;
  if (corsOrigins.includes(origin)) return true;
  if (runningOnVercel && /^https:\/\/[\w.-]+\.vercel\.app$/.test(origin)) return true;
  return false;
}

const enableSwagger = process.env.NODE_ENV !== "production" || process.env.ENABLE_SWAGGER === "true";

app.get("/health", (_req, res) => {
  const blobStorage = require(path.join(__dirname, "../src/services/blobStorage.service"));
  res.json({
    ok: true,
    hasDatabaseUrl: hasDatabaseUrl(),
    onVercel: runningOnVercel,
    hasBlobToken: blobStorage.isEnabled(),
    profilePictureStorage: blobStorage.getStorageMode(),
    postImageStorage: blobStorage.getStorageMode(),
  });
});

app.use(
  cors({
    origin(origin, callback) {
      callback(null, isAllowedCorsOrigin(origin));
    },
  }),
);
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

const bundledUploadsRoot = path.join(__dirname, "../uploads");
const runtimeUploadsRoot = runningOnVercel
  ? path.join("/tmp", "uploads")
  : bundledUploadsRoot;

app.use("/uploads", express.static(bundledUploadsRoot));
if (runningOnVercel) {
  app.use("/uploads", express.static(runtimeUploadsRoot));
}
app.use("/post-images", postImagesRouter);
app.use(errorMiddleware);

module.exports = app;
app.ensureDatabase = ensureDatabase;
