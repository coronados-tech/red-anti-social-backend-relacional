"use strict";

require("dotenv").config();

const { sequelize } = require("../src/db/models");

const OLD_BASE = process.env.OLD_PUBLIC_BASE_URL || "http://localhost:3001";
const NEW_BASE = (process.env.PUBLIC_BASE_URL || "").replace(/\/$/, "");

async function main() {
  if (!NEW_BASE) {
    console.error("Falta PUBLIC_BASE_URL. Ejemplo:");
    console.error(
      "  PUBLIC_BASE_URL=https://red-anti-social-backend-relacional.vercel.app node scripts/fix-media-urls.js",
    );
    process.exit(1);
  }

  await sequelize.authenticate();

  const [userCount] = await sequelize.query(
    `UPDATE "Users"
     SET "profilePicture" = REPLACE("profilePicture", :oldBase, :newBase)
     WHERE "profilePicture" LIKE :oldPattern`,
    {
      replacements: {
        oldBase: OLD_BASE,
        newBase: NEW_BASE,
        oldPattern: `${OLD_BASE}%`,
      },
    },
  );

  const [imageCount] = await sequelize.query(
    `UPDATE "PostImages"
     SET url = REPLACE(url, :oldBase, :newBase)
     WHERE url LIKE :oldPattern`,
    {
      replacements: {
        oldBase: OLD_BASE,
        newBase: NEW_BASE,
        oldPattern: `${OLD_BASE}%`,
      },
    },
  );

  console.log(`URLs de perfil actualizadas: ${userCount}`);
  console.log(`URLs de imágenes de post actualizadas: ${imageCount}`);
  console.log(`Base nueva: ${NEW_BASE}`);

  await sequelize.close();
}

main().catch(async (error) => {
  console.error(error);
  await sequelize.close();
  process.exit(1);
});
