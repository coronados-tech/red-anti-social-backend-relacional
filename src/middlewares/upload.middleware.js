const path = require("path");
const { mapUploadError } = require("../helpers/uploadError.helper");
const { createStorage, MB } = require("../services/storage.service");

const POST_IMAGE_UPLOAD_DIR = path.join(__dirname, "../../uploads/posts");
const PROFILE_PICTURE_UPLOAD_DIR = path.join(__dirname, "../../uploads/profiles");
const IMAGE_MIMES = ["image/jpeg", "image/png", "image/webp"];
const IMAGE_MAX_SIZE = 5 * MB;

const postImageStorage = createStorage({
  destination: POST_IMAGE_UPLOAD_DIR,
  allowedMimeTypes: IMAGE_MIMES,
  maxFileSize: IMAGE_MAX_SIZE,
});

const profilePictureStorage = createStorage({
  destination: PROFILE_PICTURE_UPLOAD_DIR,
  allowedMimeTypes: IMAGE_MIMES,
  maxFileSize: IMAGE_MAX_SIZE,
});

const respondUploadError = (res, { status, messageKey, params = {} }) =>
  res.status(status).json({ message: res.__(messageKey, params) });

const handleUploadError = (err, res, next, errorConfig) => {
  const mapped = mapUploadError(err, errorConfig);
  if (mapped) {
    respondUploadError(res, mapped);
    return true;
  }
  if (err) {
    next(err);
    return true;
  }
  return false;
};

const wrapSingle = (storage) => (fieldName) => (req, res, next) => {
  storage.upload.single(fieldName)(req, res, (err) => {
    if (handleUploadError(err, res, next, storage.errorConfig)) return;
    next();
  });
};

const uploadSingleImage = wrapSingle(postImageStorage)("image");
const uploadProfilePicture = wrapSingle(profilePictureStorage)("image");

module.exports = {
  uploadSingleImage,
  uploadProfilePicture,
  UPLOAD_DIR: POST_IMAGE_UPLOAD_DIR,
};
