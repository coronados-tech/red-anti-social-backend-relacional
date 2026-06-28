const fs = require("fs");
const path = require("path");

const isVercelRuntime = () => Boolean(process.env.VERCEL || process.env.VERCEL_ENV);

const getBundledUploadsRoot = () => path.join(__dirname, "../../uploads");

const getRuntimeUploadsRoot = () =>
  isVercelRuntime() ? path.join("/tmp", "uploads") : getBundledUploadsRoot();

const getUploadRoots = () => {
  const bundled = getBundledUploadsRoot();
  const runtime = getRuntimeUploadsRoot();
  return runtime === bundled ? [bundled] : [runtime, bundled];
};

const resolveUploadFilePath = (relativePath) => {
  for (const root of getUploadRoots()) {
    const filePath = path.join(root, relativePath);
    if (fs.existsSync(filePath)) {
      return filePath;
    }
  }
  return null;
};

const safeUnlink = (filePath) => {
  if (!filePath) return;
  try {
    fs.unlinkSync(filePath);
  } catch {
    // En Vercel los assets empaquetados viven en un filesystem de solo lectura.
  }
};

const buildPublicUrl = (req, filename, folder = "posts") => {
  const configuredBase = (process.env.PUBLIC_BASE_URL || "").replace(/\/$/, "");
  if (configuredBase) {
    return `${configuredBase}/uploads/${folder}/${filename}`;
  }
  return `${req.protocol}://${req.get("host")}/uploads/${folder}/${filename}`;
};

const deleteFileFromUrl = (url) => {
  if (!url) return;

  let deleted = false;

  try {
    const pathname = new URL(url).pathname;
    const relativePath = pathname.replace(/^\/uploads\//, "");
    const filePath = resolveUploadFilePath(relativePath);
    if (filePath) {
      safeUnlink(filePath);
      deleted = true;
    }
  } catch {
    // URL inválida: se intenta por nombre de archivo abajo.
  }

  if (deleted) return;

  const filename = path.basename(url);
  for (const folder of ["posts", "profiles"]) {
    const filePath = resolveUploadFilePath(path.join(folder, filename));
    if (filePath) {
      safeUnlink(filePath);
      break;
    }
  }
};

module.exports = {
  buildPublicUrl,
  deleteFileFromUrl,
  getBundledUploadsRoot,
  getRuntimeUploadsRoot,
  getUploadRoots,
};
