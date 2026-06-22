const express = require("express");
const router = express.Router();
const { Post, PostImage } = require("../db/models");
const {
  createPostImage,
  getAllPostImages,
  getPostImageById,
  updatePostImage,
  deletePostImage,
} = require("../controllers/postimage.controller");
const schemaValidatorMiddleware = require("../middlewares/validations/schema.middleware");
const numericParamValidateMiddleware = require("../middlewares/validations/numeric.middleware");
const existValidateMiddleware = require("../middlewares/validations/exist.middleware");
const { uploadSingleImage } = require("../middlewares/upload.middleware");
const {
  createPostImageSchema,
  updatePostImageSchema,
} = require("../schemas/postimage.schema");

router.get("/", getAllPostImages);

router.post(
  "/",
  uploadSingleImage,
  schemaValidatorMiddleware(createPostImageSchema),
  existValidateMiddleware(Post, "post_id", { aliases: ["postId"] }),
  createPostImage,
);

router.get(
  "/:id",
  numericParamValidateMiddleware("id"),
  existValidateMiddleware(PostImage, "id"),
  getPostImageById,
);

router.patch(
  "/:id",
  numericParamValidateMiddleware("id"),
  existValidateMiddleware(PostImage, "id"),
  uploadSingleImage,
  schemaValidatorMiddleware(updatePostImageSchema),
  existValidateMiddleware(Post, "post_id", { optional: true, aliases: ["postId"] }),
  updatePostImage,
);

router.delete(
  "/:id",
  numericParamValidateMiddleware("id"),
  existValidateMiddleware(PostImage, "id"),
  deletePostImage,
);

module.exports = router;
