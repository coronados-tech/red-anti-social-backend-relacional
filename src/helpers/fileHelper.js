const fs = require("fs");
const path = require("path");

const buildPublicUrl = (req, filename, folder = "posts") =>
  `${req.protocol}://${req.get("host")}/uploads/${folder}/${filename}`;

const deleteFileFromUrl = (url) => {
  if (!url) return;
  try {
    const pathname = new URL(url).pathname;
    const relativePath = pathname.replace(/^\/uploads\//, "");
    const filePath = path.join(__dirname, "../../uploads", relativePath);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch {
    const filename = path.basename(url);
    for (const folder of ["posts", "profiles"]) {
      const filePath = path.join(__dirname, "../../uploads", folder, filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        break;
      }
    }
  }
};

module.exports = { buildPublicUrl, deleteFileFromUrl };
