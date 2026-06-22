const express = require("express");
const router = express.Router();
const { User, Post, Comment } = require("../db/models");
const {
    getAllComments,
    getCommentById,
    createComment,
    updateComment,
    deleteComment,
} = require("../controllers/comments.controller");
const { commentSchema, updateCommentSchema, getAllCommentsQuerySchema } = require("../schemas/comment.schema");
const schemaValidatorMiddleware = require("../middlewares/validations/schema.middleware");
const querySchemaValidatorMiddleware =
    require("../middlewares/validations/schema.middleware").querySchemaValidatorMiddleware;
const existValidateMiddleware = require("../middlewares/validations/exist.middleware");
const numericParamValidateMiddleware = require("../middlewares/validations/numeric.middleware");

router.get(
    "/",
    querySchemaValidatorMiddleware(getAllCommentsQuerySchema),
    existValidateMiddleware(Post, "post_id", { optional: true }),
    getAllComments,
);

router.post(
    "/",
    schemaValidatorMiddleware(commentSchema),
    existValidateMiddleware(User, "user_id"),
    existValidateMiddleware(Post, "post_id"),
    createComment,
);

router.get("/:id", numericParamValidateMiddleware("id"), existValidateMiddleware(Comment, "id"), getCommentById);

router.patch(
    "/:id",
    numericParamValidateMiddleware("id"),
    existValidateMiddleware(Comment, "id"),
    schemaValidatorMiddleware(updateCommentSchema),
    updateComment,
);

router.delete("/:id", numericParamValidateMiddleware("id"), existValidateMiddleware(Comment, "id"), deleteComment);

module.exports = router;
