const express = require("express");
const router = express.Router();
const { Post, User, PostImage } = require("../db/models");

const {
  createPost,
  getAllPosts,
  getPostById,
  getPostBySlug,
  updatePost,
  deletePost,
  likePost,
  unlikePost,
} = require("../controllers/post.controller");

const {
  getPostImagesByPost,
  createPostImage,
  updatePostImage,
  deletePostImage,
} = require("../controllers/postimage.controller");

const schemaValidatorMiddleware = require("../middlewares/validations/schema.middleware");
const querySchemaValidatorMiddleware =
  require("../middlewares/validations/schema.middleware").querySchemaValidatorMiddleware;
const existValidateMiddleware = require("../middlewares/validations/exist.middleware");
const numericParamValidateMiddleware = require("../middlewares/validations/numeric.middleware");

const { uploadSingleImage } = require("../middlewares/upload.middleware");
const { requireAuthMiddleware } = require("../middlewares/auth.middleware");
const alreadyLikedMiddleware = require("../middlewares/validations/alreadyLiked.middleware");
const {
  postSchema,
  updatePostSchema,
  getAllPostsQuerySchema,
} = require("../schemas/post.schema");
const { viewerIdQuerySchema } = require("../schemas/user.schema");

router.get(
  "/",
  querySchemaValidatorMiddleware(getAllPostsQuerySchema),
  existValidateMiddleware(User, "user_id", { optional: true }),
  existValidateMiddleware(User, "viewer_id", { optional: true }),
  getAllPosts
);

router.get(
  "/slug/:slug",
  querySchemaValidatorMiddleware(viewerIdQuerySchema),
  existValidateMiddleware(User, "viewer_id", { optional: true }),
  getPostBySlug
);

router.post(
  "/",
  schemaValidatorMiddleware(postSchema),
  existValidateMiddleware(User, "user_id"),
  createPost
);

router.get(
  "/:id/images",
  numericParamValidateMiddleware("id"),
  existValidateMiddleware(Post, "id"),
  querySchemaValidatorMiddleware(viewerIdQuerySchema),
  existValidateMiddleware(User, "viewer_id", { optional: true }),
  getPostImagesByPost
);

router.post(
  "/:id/images",
  numericParamValidateMiddleware("id"),
  existValidateMiddleware(Post, "id"),
  uploadSingleImage,
  createPostImage
);

router.patch(
  "/:id/images/:image_id",
  numericParamValidateMiddleware("id"),
  numericParamValidateMiddleware("image_id"),
  existValidateMiddleware(Post, "id"),
  existValidateMiddleware(PostImage, "image_id"),
  uploadSingleImage,
  updatePostImage
);

router.delete(
  "/:id/images/:image_id",
  numericParamValidateMiddleware("id"),
  numericParamValidateMiddleware("image_id"),
  existValidateMiddleware(Post, "id"),
  existValidateMiddleware(PostImage, "image_id"),
  deletePostImage
);

router.get(
  "/:id",
  numericParamValidateMiddleware("id"),
  existValidateMiddleware(Post, "id"),
  querySchemaValidatorMiddleware(viewerIdQuerySchema),
  existValidateMiddleware(User, "viewer_id", { optional: true }),
  getPostById
);

router.patch(
  "/:id",
  numericParamValidateMiddleware("id"),
  existValidateMiddleware(Post, "id"),
  schemaValidatorMiddleware(updatePostSchema),
  updatePost,
);

router.delete(
  "/:id",
  numericParamValidateMiddleware("id"),
  existValidateMiddleware(Post, "id"),
  deletePost
);

router.post(
  "/:id/like",
  requireAuthMiddleware,
  numericParamValidateMiddleware("id"),
  existValidateMiddleware(Post, "id"),
  alreadyLikedMiddleware,
  likePost,
);

router.delete(
  "/:id/like",
  requireAuthMiddleware,
  numericParamValidateMiddleware("id"),
  existValidateMiddleware(Post, "id"),
  unlikePost,
);

module.exports = router;