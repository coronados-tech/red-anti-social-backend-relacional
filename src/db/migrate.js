const { sequelize, Sequelize, Post } = require("./models");
const { buildSlug, ensureUniqueSlug } = require("../helpers/slugHelper");

const tableExists = async (table) => {
  const queryInterface = sequelize.getQueryInterface();
  try {
    await queryInterface.describeTable(table);
    return true;
  } catch {
    return false;
  }
};

const addColumnIfMissing = async (table, column, definition) => {
  if (!(await tableExists(table))) return;

  const queryInterface = sequelize.getQueryInterface();
  const description = await queryInterface.describeTable(table);

  if (description[column]) return;

  await queryInterface.addColumn(table, column, definition);
};

const backfillPostTitles = async () => {
  if (!(await tableExists("Posts"))) return;

  const queryInterface = sequelize.getQueryInterface();
  const description = await queryInterface.describeTable("Posts");

  if (!description.titulo) return;

  const dialect = sequelize.getDialect();
  const table = dialect === "postgres" ? '"Posts"' : "Posts";
  const column = dialect === "postgres" ? '"titulo"' : "titulo";

  await sequelize.query(
    `UPDATE ${table} SET ${column} = 'Sin título' WHERE ${column} IS NULL OR ${column} = ''`,
  );
};

const cleanupSqliteBackupTables = async () => {
  if (sequelize.getDialect() !== "sqlite") return;

  const [tables] = await sequelize.query(
    "SELECT name FROM sqlite_master WHERE type = 'table' AND name LIKE '%\\_backup' ESCAPE '\\'",
  );

  for (const { name } of tables) {
    await sequelize.query(`DROP TABLE IF EXISTS \`${name}\``);
  }
};

const fixFollowersUniqueConstraints = async () => {
  if (!(await tableExists("Followers"))) return;

  const queryInterface = sequelize.getQueryInterface();
  const description = await queryInterface.describeTable("Followers");

  if (!description.follower_id || !description.following_id) return;

  const dialect = sequelize.getDialect();

  if (dialect === "sqlite") {
    const [tableDef] = await sequelize.query(
      "SELECT sql FROM sqlite_master WHERE name = 'Followers'",
    );
    const createSql = tableDef[0]?.sql || "";

    if (!createSql.includes("UNIQUE")) return;

    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS Followers_fixed (
        createdAt DATETIME NOT NULL,
        updatedAt DATETIME NOT NULL,
        following_id INTEGER NOT NULL REFERENCES Users(id),
        follower_id INTEGER NOT NULL REFERENCES Users(id),
        PRIMARY KEY (following_id, follower_id)
      )
    `);
    await sequelize.query(`
      INSERT OR IGNORE INTO Followers_fixed (createdAt, updatedAt, following_id, follower_id)
      SELECT createdAt, updatedAt, following_id, follower_id FROM Followers
    `);
    await sequelize.query("DROP TABLE Followers");
    await sequelize.query("ALTER TABLE Followers_fixed RENAME TO Followers");
    return;
  }

  if (dialect === "mysql" || dialect === "mariadb") {
    const [indexes] = await sequelize.query("SHOW INDEX FROM Followers");
    const uniqueSingleColumnIndexes = indexes.filter(
      (index) =>
        index.Non_unique === 0 &&
        index.Key_name !== "PRIMARY" &&
        ["follower_id", "following_id"].includes(index.Column_name),
    );

    for (const index of uniqueSingleColumnIndexes) {
      await sequelize.query(`ALTER TABLE Followers DROP INDEX \`${index.Key_name}\``);
    }
  }

  if (dialect === "postgres") {
    await sequelize.query(`
      DO $$
      DECLARE
        constraint_name text;
      BEGIN
        FOR constraint_name IN
          SELECT c.conname
          FROM pg_constraint c
          JOIN pg_class t ON c.conrelid = t.oid
          WHERE t.relname = 'Followers'
            AND c.contype = 'u'
            AND array_length(c.conkey, 1) = 1
        LOOP
          EXECUTE format('ALTER TABLE "Followers" DROP CONSTRAINT %I', constraint_name);
        END LOOP;
      END $$;
    `);
  }
};

const backfillPostSlugs = async () => {
  if (!(await tableExists("Posts"))) return;

  const queryInterface = sequelize.getQueryInterface();
  const description = await queryInterface.describeTable("Posts");

  if (!description.slug) return;

  const posts = await Post.findAll({ attributes: ["id", "titulo", "slug"] });

  for (const post of posts) {
    if (post.slug) continue;

    const baseSlug = buildSlug(post.titulo);
    const slug = await ensureUniqueSlug(Post, baseSlug, post.id);
    await post.update({ slug });
  }
};

const ensurePostSlugUniqueIndex = async () => {
  if (!(await tableExists("Posts"))) return;

  const queryInterface = sequelize.getQueryInterface();
  const description = await queryInterface.describeTable("Posts");

  if (!description.slug) return;

  const dialect = sequelize.getDialect();
  const indexName = "posts_slug_unique";

  if (dialect === "sqlite") {
    const [indexes] = await sequelize.query(
      "SELECT name FROM sqlite_master WHERE type = 'index' AND tbl_name = 'Posts' AND name = ?",
      { replacements: [indexName] },
    );
    if (indexes.length > 0) return;

    await sequelize.query(
      `CREATE UNIQUE INDEX ${indexName} ON Posts (slug) WHERE slug IS NOT NULL`,
    );
    return;
  }

  if (dialect === "mysql" || dialect === "mariadb") {
    const [indexes] = await sequelize.query("SHOW INDEX FROM Posts");
    if (indexes.some((index) => index.Key_name === indexName)) return;

    await sequelize.query(
      `CREATE UNIQUE INDEX ${indexName} ON Posts (slug)`,
    );
    return;
  }

  if (dialect === "postgres") {
    await sequelize.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS ${indexName} ON "Posts" (slug)
    `);
  }
};

const widenProfilePictureColumn = async () => {
  const dialect = sequelize.getDialect();
  if (dialect !== "postgres") return;

  await sequelize.query(`
    ALTER TABLE "Users"
    ALTER COLUMN "profilePicture" TYPE TEXT
  `);
};

const widenPostImageUrlColumn = async () => {
  const dialect = sequelize.getDialect();
  if (dialect !== "postgres") return;

  await sequelize.query(`
    ALTER TABLE "PostImages"
    ALTER COLUMN url TYPE TEXT
  `);
};

const runMigrations = async () => {
  await addColumnIfMissing("Users", "profilePicture", {
    type: Sequelize.STRING,
    allowNull: true,
  });

  await widenProfilePictureColumn();
  await widenPostImageUrlColumn();

  await addColumnIfMissing("Posts", "titulo", {
    type: Sequelize.STRING(200),
    allowNull: false,
    defaultValue: "Sin título",
  });

  await addColumnIfMissing("Posts", "slug", {
    type: Sequelize.STRING(220),
    allowNull: true,
  });

  await backfillPostSlugs();
  await ensurePostSlugUniqueIndex();

  await addColumnIfMissing("Users", "isProfilePublic", {
    type: Sequelize.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  });

  await backfillPostTitles();
  await cleanupSqliteBackupTables();
  await fixFollowersUniqueConstraints();
};

module.exports = { runMigrations };
