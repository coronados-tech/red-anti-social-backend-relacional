const { sequelize, Sequelize } = require("./models");

const addColumnIfMissing = async (table, column, definition) => {
  const queryInterface = sequelize.getQueryInterface();
  const description = await queryInterface.describeTable(table);

  if (description[column]) return;

  await queryInterface.addColumn(table, column, definition);
};

const backfillPostTitles = async () => {
  const queryInterface = sequelize.getQueryInterface();
  const description = await queryInterface.describeTable("Posts");

  if (!description.titulo) return;

  await sequelize.query(
    "UPDATE Posts SET titulo = 'Sin título' WHERE titulo IS NULL OR titulo = ''",
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

const runMigrations = async () => {
  await addColumnIfMissing("Users", "profilePicture", {
    type: Sequelize.STRING,
    allowNull: true,
  });

  await addColumnIfMissing("Posts", "titulo", {
    type: Sequelize.STRING(200),
    allowNull: false,
    defaultValue: "Sin título",
  });

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
