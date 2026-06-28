const path = require("path");
const { deleteFileFromUrl } = require("../helpers/fileHelper");

const isBlobUrl = (url) =>
  typeof url === "string" && url.includes("blob.vercel-storage.com");

const isEnabled = () => Boolean(process.env.BLOB_READ_WRITE_TOKEN);

const getToken = () => process.env.BLOB_READ_WRITE_TOKEN;

const saveProfileImage = async (file) => {
  const { put } = require("@vercel/blob");
  const ext = path.extname(file.originalname) || ".jpg";
  const filename = `profiles/${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;

  const blob = await put(filename, file.buffer, {
    access: "public",
    contentType: file.mimetype,
    token: getToken(),
  });

  return blob.url;
};

const deleteIfStored = async (url) => {
  if (!url) return;

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
  isEnabled,
  saveProfileImage,
  deleteIfStored,
};
