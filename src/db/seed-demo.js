"use strict";

require("dotenv").config();

const fs = require("fs");
const path = require("path");
const { User, Post, Comment } = require("./models");
const postService = require("../services/post.service");
const postimageService = require("../services/postimage.service");
const commentService = require("../services/comment.service");
const postCache = require("../services/postCache.service");
const { deleteFileFromUrl } = require("../helpers/fileHelper");

const DEMO_PASSWORD = "123456";
const PROFILE_PICTURE_DIR = path.join(__dirname, "../../uploads/profiles");
const POST_IMAGE_DIR = path.join(__dirname, "../../uploads/posts");
const MEMES_DIR = path.join(
  __dirname,
  "../../../red-anti-social/src/assets/memes",
);
const FRONTEND_ASSETS = path.join(
  __dirname,
  "../../../red-anti-social/src/assets/profile.images",
);
const PUBLIC_BASE_URL =
  process.env.PUBLIC_BASE_URL || `http://localhost:${process.env.PORT || 3001}`;

const INTEGRANTES = [
  {
    key: "carla_perez",
    nickname: "carla_perez",
    name: "Carla Andrea",
    lastName: "Perez",
    email: "carla.perez@unahur.demo",
    birthDate: "1988-10-31",
    gender: "femenino",
    isProfilePublic: true,
    profileImage: "carla.png",
  },
  {
    key: "celeste_fernandez",
    nickname: "celeste_fernandez",
    name: "Malena Celeste",
    lastName: "Fernandez Mansilla",
    email: "celeste.fernandez@unahur.demo",
    birthDate: "2000-05-15",
    gender: "femenino",
    isProfilePublic: true,
    profileImage: "celeste.jpeg",
  },
  {
    key: "micaela_signorello",
    nickname: "micaela_signorello",
    name: "Micaela Natalia",
    lastName: "Signorello",
    email: "micaela.signorello@unahur.demo",
    birthDate: "2001-03-20",
    gender: "femenino",
    isProfilePublic: true,
    profileImage: "micaela.png",
  },
  {
    key: "rafael_barberi",
    nickname: "rafael_barberi",
    name: "Rafael Alberto",
    lastName: "Barberi Salcedo",
    email: "rafael.barberi@unahur.demo",
    birthDate: "1990-04-29",
    gender: "masculino",
    isProfilePublic: true,
    profileImage: "rafael.png",
  },
];

// Orden del feed (DESC): autores intercalados, fechas irregulares, textos informales.
const DEMO_POSTS = [
  {
    id: 12,
    userKey: "micaela_signorello",
    createdAt: "2026-06-27T18:42:00.000Z",
    titulo: "Ajusté las cards del home",
    description:
      "En mobile el título se cortaba feo. Lo arreglé y saqué un poco de padding que sobraba.",
    tags: ["ui", "mobile"],
  },
  {
    id: 11,
    userKey: "rafael_barberi",
    createdAt: "2026-06-26T11:15:00.000Z",
    titulo: "Si el token vence, te echa",
    description: "No más quedar logueado con un 401 silencioso. Ahora te manda directo al login.",
    tags: ["auth", "bugs"],
  },
  {
    id: 10,
    userKey: "celeste_fernandez",
    createdAt: "2026-06-25T09:30:00.000Z",
    titulo: "Las tablas ya están",
    description:
      "Usuarios, posts, tags, seguidores… Sequelize + MySQL. Nada exótico, pero funciona.",
    tags: ["mysql", "backend"],
  },
  {
    id: 9,
    userKey: "carla_perez",
    createdAt: "2026-06-23T22:08:00.000Z",
    titulo: "Front y back hablando",
    description:
      "Después de varios fetch fallidos, posts, comentarios e imágenes ya responden bien.",
    tags: ["tp", "api"],
  },
  {
    id: 8,
    userKey: "micaela_signorello",
    createdAt: "2026-06-22T16:45:00.000Z",
    titulo: "Dark mode",
    description: "Toggle en la navbar y queda guardado. Me gusta más oscuro para codear de noche.",
    tags: ["react", "css"],
  },
  {
    id: 7,
    userKey: "celeste_fernandez",
    createdAt: "2026-06-21T20:12:00.000Z",
    titulo: "Scroll infinito en el feed",
    description:
      "Salió la paginación en la API y en el front cargamos de a 3 mientras scrolleás. Laburo en conjunto front + back.",
    tags: ["backend", "tp"],
  },
  {
    id: 6,
    userKey: "rafael_barberi",
    createdAt: "2026-06-20T13:27:00.000Z",
    titulo: "Swagger al día",
    description: "Actualicé la doc de los endpoints que faltaban. Está en /api-docs.",
    tags: ["swagger", "api"],
  },
  {
    id: 5,
    userKey: "carla_perez",
    createdAt: "2026-06-18T10:03:00.000Z",
    titulo: "Víspera de entrega",
    description:
      "Repasé lo que falta del TP y la lista no para de crecer.",
    tags: ["ciu", "tp", "entrega"],
  },
  {
    id: 4,
    userKey: "micaela_signorello",
    createdAt: "2026-06-15T19:51:00.000Z",
    titulo: "El feed en dos columnas",
    description:
      "Filtros a la izquierda, posts a la derecha. En celu se apilan y no queda tan apretado.",
    tags: ["frontend", "layout"],
  },
  {
    id: 3,
    userKey: "rafael_barberi",
    createdAt: "2026-06-12T08:44:00.000Z",
    titulo: "Login con JWT",
    description: "Probé login, recargar la página y seguir logueado. Por ahora aguanta.",
    tags: ["jwt", "login"],
  },
  {
    id: 2,
    userKey: "celeste_fernandez",
    createdAt: "2026-06-10T17:22:00.000Z",
    titulo: "Perfil privado",
    description:
      "Si no querés que cualquiera vea tus posts, ocultás el perfil y solo lo ven tus seguidores.",
    tags: ["privacidad"],
  },
  {
    id: 1,
    userKey: "carla_perez",
    createdAt: "2026-06-08T14:00:00.000Z",
    titulo: "Arrancamos Anti-Social Net",
    description:
      "Primer commit del TP de CIU. Coronados Tech, manos a la obra.",
    tags: ["unahur", "ciu"],
  },
];

const POST_MEMES = [
  { postId: 1, memeFiles: ["materia.png"] },
  { postId: 2, memeFiles: ["perfilPrivado.jpg"] },
  { postId: 3, memeFiles: ["login.jpg"] },
  { postId: 4, memeFiles: ["elegancia.png"] },
  { postId: 5, memeFiles: ["nenellorando.jpg"] },
  { postId: 6, memeFiles: ["pro.jpg"] },
  { postId: 7, memeFiles: ["itsfine.jpg"] },
  { postId: 8, memeFiles: ["darkmode.jpg"] },
  { postId: 9, memeFiles: ["arreglar.jpg"] },
  { postId: 10, memeFiles: ["paz.jpg"] },
  { postId: 11, memeFiles: ["youshallnotpass.jpg"] },
  {
    postId: 12,
    memeFiles: ["meme-1_608_1076.png", "mevoy.jpg", "cerebro.jpg"],
  },
];

const DEMO_COMMENTS = [
  { postId: 1, userKey: "micaela_signorello", content: "Vamos Coronados, a full con el TP." },
  { postId: 1, userKey: "rafael_barberi", content: "Arrancamos fuerte." },
  { postId: 1, userKey: "celeste_fernandez", content: "Ya quiero ver el feed andando." },
  { postId: 2, userKey: "rafael_barberi", content: "Yo igual dejo el mío público jaja." },
  { postId: 2, userKey: "micaela_signorello", content: "Buena opción para la demo de privacidad." },
  { postId: 3, userKey: "celeste_fernandez", content: "JWT es magia negra pero zafa." },
  { postId: 3, userKey: "carla_perez", content: "Lo probé recién y aguanta al recargar." },
  { postId: 4, userKey: "carla_perez", content: "Quedó prolijo el layout en desktop." },
  { postId: 5, userKey: "rafael_barberi", content: "Same energy, pero entre los cuatro lo sacamos." },
  { postId: 5, userKey: "micaela_signorello", content: "Yo también miré la lista y casi lloro jaja." },
  { postId: 6, userKey: "micaela_signorello", content: "Sin Swagger no hay TP." },
  { postId: 7, userKey: "carla_perez", content: "En la home quedó mucho más liviano, buen laburo." },
  { postId: 7, userKey: "rafael_barberi", content: "Carga de a 3 y se nota el scroll infinito." },
  { postId: 7, userKey: "micaela_signorello", content: "Front y back coordinados, se ve re bien." },
  { postId: 8, userKey: "carla_perez", content: "Modo oscuro masterrace." },
  { postId: 9, userKey: "micaela_signorello", content: "Cuando responde a la primera >>>" },
  { postId: 9, userKey: "celeste_fernandez", content: "Fetch tranki, nada raro." },
  { postId: 10, userKey: "rafael_barberi", content: "MySQL no perdona pero Sequelize ayuda." },
  { postId: 11, userKey: "carla_perez", content: "Me pasó, refresqué y listo." },
  { postId: 11, userKey: "celeste_fernandez", content: "401 y chau sesión, al menos es claro." },
  { postId: 12, userKey: "rafael_barberi", content: "Esos 2px cambian el universo." },
  { postId: 12, userKey: "celeste_fernandez", content: "En mobile se ve mucho mejor ahora." },
];

async function upsertIntegrante(data) {
  const [user, created] = await User.findOrCreate({
    where: { nickname: data.nickname },
    defaults: {
      ...data,
      password: DEMO_PASSWORD,
    },
  });

  if (!created) {
    await user.update({
      name: data.name,
      lastName: data.lastName,
      email: data.email,
      birthDate: data.birthDate,
      gender: data.gender,
      isProfilePublic: data.isProfilePublic,
      password: DEMO_PASSWORD,
    });
  }

  return user;
}

function buildProfileUrl(filename) {
  return `${PUBLIC_BASE_URL}/uploads/profiles/${filename}`;
}

async function setProfilePicture(user, profileImage) {
  const sourcePath = path.join(FRONTEND_ASSETS, profileImage);

  if (!fs.existsSync(sourcePath)) {
    console.warn(`Imagen no encontrada para @${user.nickname}: ${sourcePath}`);
    return;
  }

  fs.mkdirSync(PROFILE_PICTURE_DIR, { recursive: true });

  const ext = path.extname(profileImage);
  const destFilename = `integrante-${user.nickname}${ext}`;
  const destPath = path.join(PROFILE_PICTURE_DIR, destFilename);

  if (user.profilePicture) {
    deleteFileFromUrl(user.profilePicture);
  }

  fs.copyFileSync(sourcePath, destPath);
  await user.update({ profilePicture: buildProfileUrl(destFilename) });
  console.log(`Foto de perfil → @${user.nickname}`);
}

async function loadIntegrantes() {
  const usersByKey = {};

  for (const integrante of INTEGRANTES) {
    const { key, profileImage, ...userData } = integrante;
    const user = await upsertIntegrante(userData);
    await setProfilePicture(user, profileImage);
    usersByKey[key] = user;
    console.log(`Usuario ${user.nickname} (id ${user.id}) listo`);
  }

  return usersByKey;
}

async function applyDemoPosts(usersByKey) {
  for (const postData of DEMO_POSTS) {
    const { id, userKey, createdAt, titulo, description, tags } = postData;
    const user = usersByKey[userKey];

    if (!user) {
      console.warn(`Usuario no encontrado para post ${id}: ${userKey}`);
      continue;
    }

    const existing = await Post.findByPk(id);

    if (existing) {
      await Post.update(
        { user_id: user.id, createdAt, updatedAt: createdAt },
        { where: { id }, silent: true },
      );
      await postService.update(id, { titulo, description, tags });
      console.log(`Post ${id} actualizado → @${user.nickname} (${createdAt.slice(0, 10)})`);
      continue;
    }

    const created = await postService.create({
      titulo,
      description,
      user_id: user.id,
      tags,
    });

    await Post.update(
      { createdAt, updatedAt: createdAt },
      { where: { id: created.id }, silent: true },
    );
    console.log(`Post ${created.id} creado → @${user.nickname}`);
  }

  postCache.deleteAll();
}

function buildPostImageUrl(filename) {
  return `${PUBLIC_BASE_URL}/uploads/posts/${filename}`;
}

async function attachMemesToPost(postId, memeFiles) {
  const post = await Post.findByPk(postId);

  if (!post) {
    console.warn(`Post no encontrado: ${postId}`);
    return;
  }

  fs.mkdirSync(POST_IMAGE_DIR, { recursive: true });
  await postimageService.removeAllByPostId(postId);

  const attached = [];

  for (let index = 0; index < memeFiles.length; index += 1) {
    const memeFile = memeFiles[index];
    const sourcePath = path.join(MEMES_DIR, memeFile);

    if (!fs.existsSync(sourcePath)) {
      console.warn(`Meme no encontrado para post ${postId}: ${sourcePath}`);
      continue;
    }

    const suffix = memeFiles.length === 1 ? "" : `-${index + 1}`;
    const destFilename = `meme-post-${postId}${suffix}${path.extname(memeFile)}`;
    fs.copyFileSync(sourcePath, path.join(POST_IMAGE_DIR, destFilename));

    await postimageService.create({
      postId,
      url: buildPostImageUrl(destFilename),
    });

    attached.push(memeFile);
  }

  if (attached.length > 0) {
    console.log(`Memes → post ${postId} (${attached.join(", ")})`);
  }
}

async function applyDemoMemes() {
  for (const { postId, memeFiles } of POST_MEMES) {
    await attachMemesToPost(postId, memeFiles);
  }

  postCache.deleteAll();
}

function offsetDate(isoDate, hours) {
  const date = new Date(isoDate);
  date.setHours(date.getHours() + hours);
  return date.toISOString();
}

async function getIntegrantesByKey() {
  const usersByKey = {};

  for (const integrante of INTEGRANTES) {
    const user = await User.findOne({ where: { nickname: integrante.nickname } });

    if (!user) {
      console.warn(`Usuario no encontrado: ${integrante.nickname}`);
      continue;
    }

    usersByKey[integrante.key] = user;
  }

  return usersByKey;
}

async function applyDemoComments(usersByKey) {
  const postDates = Object.fromEntries(DEMO_POSTS.map((post) => [post.id, post.createdAt]));
  const postIds = DEMO_POSTS.map((post) => post.id);

  await Comment.destroy({ where: { post_id: postIds } });

  let commentOffset = 0;

  for (const commentData of DEMO_COMMENTS) {
    const { postId, userKey, content } = commentData;
    const user = usersByKey[userKey];
    const postDate = postDates[postId];

    if (!user || !postDate) {
      console.warn(`No se pudo crear comentario en post ${postId}`);
      continue;
    }

    commentOffset += 1;
    const createdAt = offsetDate(postDate, commentOffset * 3);

    const comment = await commentService.create({
      content,
      user_id: user.id,
      post_id: postId,
    });

    await Comment.update(
      { createdAt, updatedAt: createdAt },
      { where: { id: comment.id }, silent: true },
    );

    console.log(`Comentario → post ${postId} (@${user.nickname})`);
  }

  postCache.deleteAll();
}

async function seedDemo() {
  const usersByKey = await loadIntegrantes();
  await applyDemoPosts(usersByKey);
  await applyDemoMemes();
  await applyDemoComments(usersByKey);

  console.log("\nSeed completado.");
  console.log("Contraseña demo para todos los integrantes:", DEMO_PASSWORD);
  console.log("Cuentas:", INTEGRANTES.map((i) => i.nickname).join(", "));
}

async function seedProfilesOnly() {
  for (const integrante of INTEGRANTES) {
    const { profileImage, nickname } = integrante;
    const user = await User.findOne({ where: { nickname } });

    if (!user) {
      console.warn(`Usuario no encontrado: ${nickname}`);
      continue;
    }

    await setProfilePicture(user, profileImage);
  }

  console.log("\nFotos de perfil actualizadas.");
}

async function seedPostsOnly() {
  const usersByKey = await getIntegrantesByKey();
  await applyDemoPosts(usersByKey);
  console.log("\nPosts demo actualizados (intercalados).");
}

async function seedMemesOnly() {
  await applyDemoMemes();
  console.log("\nMemes agregados a los posts.");
}

async function seedCommentsOnly() {
  const usersByKey = await getIntegrantesByKey();
  await applyDemoComments(usersByKey);
  console.log("\nComentarios demo agregados.");
}

const arg = process.argv.find((value) => value.startsWith("--"));

let runner = seedDemo;

if (arg === "--profiles-only") {
  runner = seedProfilesOnly;
} else if (arg === "--posts-only") {
  runner = seedPostsOnly;
} else if (arg === "--memes-only") {
  runner = seedMemesOnly;
} else if (arg === "--comments-only") {
  runner = seedCommentsOnly;
}

runner()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error en seed:", error);
    process.exit(1);
  });
