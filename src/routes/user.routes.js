const express = require("express");
const router = express.Router();
const {
  createUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  uploadUserProfilePicture,
  deleteUserProfilePicture,
  getUserFollowers,
  getUserFollowing,
  followUser,
  unfollowUser,
} = require("../controllers/user.controller");
const { userSchema, updateUserSchema, viewerIdQuerySchema } = require("../schemas/user.schema");
const { User } = require("../db/models");
const schemaValidatorMiddleware = require("../middlewares/validations/schema.middleware");
const querySchemaValidatorMiddleware =
  require("../middlewares/validations/schema.middleware").querySchemaValidatorMiddleware;
const existValidateMiddleware = require("../middlewares/validations/exist.middleware");
const numericParamValidateMiddleware = require("../middlewares/validations/numeric.middleware");
const alreadyFollowingMiddleware = require("../middlewares/validations/alreadyFollowing.middleware");
const duplicateUserMiddleware = require("../middlewares/validations/duplicateUser.middleware");
const { uploadProfilePicture } = require("../middlewares/upload.middleware");
const {
  optionalAuthMiddleware,
  requireAuthMiddleware,
  resolveViewerMiddleware,
} = require("../middlewares/auth.middleware");

const profileViewerMiddleware = [
  optionalAuthMiddleware,
  querySchemaValidatorMiddleware(viewerIdQuerySchema),
  existValidateMiddleware(User, "viewer_id", { optional: true, source: "query" }),
  resolveViewerMiddleware,
];

router.get("/", ...profileViewerMiddleware, getAllUsers);

router.post(
  "/",
  schemaValidatorMiddleware(userSchema),
  duplicateUserMiddleware(),
  createUser,
);

router.get(
  "/:id/followers",
  numericParamValidateMiddleware("id"),
  existValidateMiddleware(User, "id"),
  ...profileViewerMiddleware,
  getUserFollowers,
);

router.get(
  "/:id/following",
  numericParamValidateMiddleware("id"),
  existValidateMiddleware(User, "id"),
  ...profileViewerMiddleware,
  getUserFollowing,
);

router.post(
  "/:id/follow",
  requireAuthMiddleware,
  numericParamValidateMiddleware("id"),
  existValidateMiddleware(User, "id"),
  alreadyFollowingMiddleware,
  followUser,
);

router.delete(
  "/:id/follow",
  requireAuthMiddleware,
  numericParamValidateMiddleware("id"),
  existValidateMiddleware(User, "id"),
  unfollowUser,
);

router.put(
  "/:id/profile-picture",
  numericParamValidateMiddleware("id"),
  existValidateMiddleware(User, "id"),
  uploadProfilePicture,
  uploadUserProfilePicture,
);

router.delete(
  "/:id/profile-picture",
  numericParamValidateMiddleware("id"),
  existValidateMiddleware(User, "id"),
  deleteUserProfilePicture,
);

router.get(
  "/:id",
  numericParamValidateMiddleware("id"),
  existValidateMiddleware(User, "id"),
  ...profileViewerMiddleware,
  getUserById,
);

router.put(
  "/:id",
  numericParamValidateMiddleware("id"),
  existValidateMiddleware(User, "id"),
  schemaValidatorMiddleware(updateUserSchema),
  duplicateUserMiddleware({ excludeParam: "id" }),
  updateUser,
);

router.delete(
  "/:id",
  numericParamValidateMiddleware("id"),
  existValidateMiddleware(User, "id"),
  deleteUser,
);

module.exports = router;
