const HTTP = require("../config/HttpCode");
const commentService = require("../services/comment.service");

const getAllComments = async (req, res) => {
    const { post_id } = req.query;
    const comments = await commentService.findAll({ post_id });
    res.status(HTTP.OK).json(comments);
};

const getCommentById = async (req, res) => {
    const { id } = req.params;
    const comment = await commentService.findById(id);
    res.status(HTTP.OK).json(comment);
};

const createComment = async (req, res) => {
    const { content, user_id, post_id } = req.body;

    const created = await commentService.create({
        content,
        user_id,
        post_id,
    });
    res.status(HTTP.CREATED).json(created);
};

const updateComment = async (req, res) => {
    const { id } = req.params;
    const updated = await commentService.update(id, req.body);
    res.status(HTTP.OK).json(updated);
};

const deleteComment = async (req, res) => {
    const { id } = req.params;
    await commentService.remove(id);
    res.status(HTTP.OK).json({ message: res.__("delete_comment", { id }) });
};

module.exports = {
    getAllComments,
    getCommentById,
    createComment,
    updateComment,
    deleteComment,
};
