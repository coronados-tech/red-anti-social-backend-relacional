const dotenv = require("dotenv");
dotenv.config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const i18n = require("i18n");
const { sequelize } = require("./db/models");
const { runMigrations } = require("./db/migrate");
const errorMiddleware = require("./middlewares/error.middleware");
const filterPostCommentsMiddleware = require("./middlewares/filterPostComments.middleware");

const PORT = process.env.PORT || 3001;
const locale = process.env.IDIOMA === "es" ? process.env.IDIOMA : "es";

i18n.configure({
    locales: ["es"],
    directory: path.join(__dirname, "locales"),
    defaultLocale: locale,
    autoReload: true,
    updateFiles: false,
});
//ROUTE
const authRouter = require("./routes/auth.routes");
const commentsRouter = require("./routes/comments.route");
const usersRouter = require("./routes/user.routes");
const postsRouter = require("./routes/post.routes");
const postImagesRouter = require("./routes/postimage.routes");
const tagsRouter = require("./routes/tag.routes");

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
app.use(i18n.init);
app.use(express.json());

if (enableSwagger) {
    const swaggerUi = require("swagger-ui-express");
    const YAML = require("yamljs");
    const swaggerDocument = YAML.load(path.join(__dirname, "../docs/swagger.yaml"));
    app.use("/swagger", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
}

app.use("/auth", authRouter);
app.use("/comments", commentsRouter);
app.use("/users", usersRouter);

app.use("/posts", filterPostCommentsMiddleware, postsRouter);
app.use("/tags", tagsRouter);

app.use("/uploads", express.static(path.join(__dirname, "../uploads")));
app.use("/post-images", postImagesRouter);

app.use(errorMiddleware);

app.listen(PORT, async (err) => {
    if (err) {
        console.error(err.message);
        process.exit(1);
    }
    await sequelize.authenticate();
    await runMigrations();

    const syncOptions = {};
    if (process.env.DB_SYNC_FORCE === "true") {
        syncOptions.force = true;
    }

    await sequelize.sync(syncOptions);
    console.log(`App iniciada en el puerto ${PORT}`);
});
