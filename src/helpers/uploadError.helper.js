const multer = require("multer");
const HTTP = require("../config/HttpCode");

const mapUploadError = (
  err,
  {
    invalidTypeMessageKey = "upload_invalid_type",
    fileTooLargeMessageKey = "upload_file_too_large",
    maxFileSize,
  } = {}
) => {
  if (!err) return null;

  if (err instanceof multer.MulterError) {
    switch (err.code) {
      case "LIMIT_FILE_SIZE":
        return {
          status: HTTP.BAD_REQUEST,
          messageKey: fileTooLargeMessageKey,
          params: maxFileSize
            ? { maxSizeMB: Math.round(maxFileSize / (1024 * 1024)) }
            : {},
        };
      case "LIMIT_FILE_COUNT":
      case "LIMIT_UNEXPECTED_FILE":
        return {
          status: HTTP.BAD_REQUEST,
          messageKey:
            err.code === "LIMIT_FILE_COUNT"
              ? "upload_single_image_only"
              : "upload_unexpected_field",
          params: err.field ? { field: err.field } : {},
        };
      default:
        return { status: HTTP.BAD_REQUEST, messageKey: "upload_error" };
    }
  }

  if (err.message === invalidTypeMessageKey) {
    return { status: HTTP.BAD_REQUEST, messageKey: invalidTypeMessageKey };
  }

  return null;
};

module.exports = { mapUploadError };
