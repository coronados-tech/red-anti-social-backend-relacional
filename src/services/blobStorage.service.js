const path = require("path");
const { buildPublicUrl, deleteFileFromUrl } = require("../helpers/fileHelper");

const isVercelRuntime = () =>
  Boolean(process.env.VERCEL || process.env.VERCEL_ENV);

const isBlobUrl = (url) =>
  typeof url === "string" && url.includes("blob.vercel-storage.com");

const isDataUrl = (url) => typeof url === "string" && url.startsWith("data:image/");

const isEnabled = () => Boolean(process.env.BLOB_READ_WRITE_TOKEN);

const getToken = () => process.env.BLOB_READ_WRITE_TOKEN;

const shouldUseMemoryUpload = () => isEnabled() || isVercelRuntime();

const getStorageMode = () => {
  if (isEnabled()) return "blob";
  if (isVercelRuntime()) return "database";
  return "disk";
};

const saveImageToBlob = async (file, folder) => {
  const { put } = require("@vercel/blob");
  const ext = path.extname(file.originalname) || ".jpg";
  const filename = `${folder}/${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;

  const blob = await put(filename, file.buffer, {
    access: "public",
    contentType: file.mimetype,
    token: getToken(),
  });

  return blob.url;
};

const saveImageAsDataUrl = (file) => {
  if (!file.buffer) {
    throw new Error("La imagen no llegó en memoria para guardar en la base.");
  }

  const base64 = file.buffer.toString("base64");
  return `data:${file.mimetype};base64,${base64}`;
};

const saveImagePersisted = async (file, req, folder = "posts") => {
  if (isEnabled()) {
    return saveImageToBlob(file, folder);
  }

  if (isVercelRuntime()) {
    return saveImageAsDataUrl(file);
  }

  return buildPublicUrl(req, file.filename, folder);
};

const saveProfileImagePersisted = (file, req) =>
  saveImagePersisted(file, req, "profiles");

const savePostImagePersisted = (file, req) =>
  saveImagePersisted(file, req, "posts");

const deleteIfStored = async (url) => {
  if (!url || isDataUrl(url)) return;

  if (isBlobUrl(url) && isEnabled()) {
    try {
      const { del } = require("@vercel/blob");
      await del(url, { token: getToken() });
    } catch {
      // El blob puede haber sido eliminado antes.
    }
    return;
  }

  deleteFileFromUrl(url);
};

module.exports = {
  isBlobUrl,
  isDataUrl,
  isEnabled,
  isVercelRuntime,
  shouldUseMemoryUpload,
  getStorageMode,
  saveImagePersisted,
  saveProfileImagePersisted,
  savePostImagePersisted,
  deleteIfStored,
};
