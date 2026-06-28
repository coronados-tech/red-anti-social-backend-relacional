const fs = require("fs");
const path = require("path");

const DEFAULT_PORTS = {
  mysql: 3306,
  mariadb: 3306,
  postgres: 5432,
};

const isServerless = () =>
  Boolean(process.env.VERCEL || process.env.VERCEL_ENV || process.env.AWS_LAMBDA_FUNCTION_NAME);

const ensureSqliteDir = (storagePath) => {
  const dir = path.dirname(storagePath);
  if (fs.existsSync(dir)) return;

  try {
    fs.mkdirSync(dir, { recursive: true });
  } catch (err) {
    if (err.code === "ENOENT" || err.code === "EACCES" || err.code === "EROFS") {
      throw new Error(
        `No se puede crear el directorio SQLite en "${dir}". ` +
          "En Vercel usá DB_DIALECT=postgres o mysql, o no definas DB_STORAGE (usa /tmp automáticamente).",
      );
    }
    throw err;
  }
};

const buildConfig = (env = "development") => {
  const logging = process.env.DB_LOGGING === "true" ? console.log : false;

  if (process.env.DATABASE_URL) {
    return {
      url: process.env.DATABASE_URL,
      dialect: "postgres",
      logging,
      dialectOptions: {
        ssl: { require: true, rejectUnauthorized: false },
      },
    };
  }

  if (isServerless()) {
    throw new Error(
      "DATABASE_URL no está configurada en Vercel. " +
        "Agregá la connection string de Neon en Settings → Environment Variables.",
    );
  }

  const dialect = (process.env.DB_DIALECT || "sqlite").toLowerCase();

  if (dialect === "sqlite") {
    const storage = isServerless()
      ? path.join("/tmp", "datastore.db")
      : process.env.DB_STORAGE || path.join(process.cwd(), "data", "datastore.db");

    ensureSqliteDir(storage);

    return {
      dialect: "sqlite",
      storage,
      logging,
    };
  }

  const defaultPort = DEFAULT_PORTS[dialect] ?? 3306;
  const config = {
    dialect,
    host: process.env.DB_HOST || "127.0.0.1",
    port: Number(process.env.DB_PORT || defaultPort),
    database: process.env.DB_NAME || `anti-social-${env}`,
    username: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || null,
    logging,
  };

  if (dialect === "postgres" && isServerless()) {
    config.dialectOptions = {
      ssl: { require: true, rejectUnauthorized: false },
    };
  }

  return config;
};

module.exports = buildConfig;
