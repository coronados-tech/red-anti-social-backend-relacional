const multer = require("multer");
const path = require("path");
const fs = require("fs");
const i18n = require("i18n");

const MB = 1024 * 1024;

const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

const createDiskStorage = (destination) =>
  multer.diskStorage({
    destination: (_req, _file, cb) => {
      cb(null, destination);
    },
    filename: (_req, file, cb) => {
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      const ext = path.extname(file.originalname);
      cb(null, `${uniqueSuffix}${ext}`);
    },
  });

const createFileFilter = (allowedMimeTypes, invalidTypeMessageKey) => (_req, file, cb) => {
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(invalidTypeMessageKey), false);
  }
};

const createStorage = ({
  destination,
  allowedMimeTypes,
  maxFileSize,
  invalidTypeMessageKey = "upload_invalid_type",
  fileTooLargeMessageKey = "upload_file_too_large",
}) => {
  if (!destination || !allowedMimeTypes?.length || !maxFileSize) {
    throw new Error(i18n.__("storage_config_required"));
  }

  ensureDir(destination);

  const upload = multer({
    storage: createDiskStorage(destination),
    fileFilter: createFileFilter(allowedMimeTypes, invalidTypeMessageKey),
    limits: { fileSize: maxFileSize },
  });

  return {
    upload,
    destination,
    errorConfig: {
      invalidTypeMessageKey,
      fileTooLargeMessageKey,
      maxFileSize,
    },
  };
};

const createMemoryStorage = ({
  allowedMimeTypes,
  maxFileSize,
  invalidTypeMessageKey = "upload_invalid_type",
  fileTooLargeMessageKey = "upload_file_too_large",
}) => {
  if (!allowedMimeTypes?.length || !maxFileSize) {
    throw new Error(i18n.__("storage_config_required"));
  }

  const upload = multer({
    storage: multer.memoryStorage(),
    fileFilter: createFileFilter(allowedMimeTypes, invalidTypeMessageKey),
    limits: { fileSize: maxFileSize },
  });

  return {
    upload,
    destination: null,
    errorConfig: {
      invalidTypeMessageKey,
      fileTooLargeMessageKey,
      maxFileSize,
    },
  };
};

module.exports = { createStorage, createMemoryStorage, ensureDir, MB };
