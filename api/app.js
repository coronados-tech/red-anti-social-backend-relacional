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

const lazyRouter = (modulePath) => {
  let router;
  return (req, res, next) => {
    if (!router) {
      router = resolveHandler(require(modulePath));
    }
    return router(req, res, next);
  };
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
      const { sequelize } = require("../src/db/models");
      const { runMigrations } = require("../src/db/migrate");

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
  require("../src/middlewares/filterPostComments.middleware"),
);
const errorMiddleware = resolveHandler(require("../src/middlewares/error.middleware"));

const app = express();

const corsOrigins = (process.env.CORS_ORIGIN || "http://localhost:5173,http://localhost:5174")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const enableSwagger = process.env.NODE_ENV !== "production" || process.env.ENABLE_SWAGGER === "true";

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    hasDatabaseUrl: hasDatabaseUrl(),
    onVercel: runningOnVercel,
  });
});

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

app.use("/auth", lazyRouter("../src/routes/auth.routes"));
app.use("/comments", lazyRouter("../src/routes/comments.route"));
app.use("/users", lazyRouter("../src/routes/user.routes"));
app.use("/posts", filterPostCommentsMiddleware, lazyRouter("../src/routes/post.routes"));
app.use("/tags", lazyRouter("../src/routes/tag.routes"));

const uploadsRoot = runningOnVercel
  ? path.join("/tmp", "uploads")
  : path.join(__dirname, "../uploads");

app.use("/uploads", express.static(uploadsRoot));
app.use("/post-images", lazyRouter("../src/routes/postimage.routes"));
app.use(errorMiddleware);

module.exports = app;
app.ensureDatabase = ensureDatabase;
