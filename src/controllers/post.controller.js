const HTTP = require("../config/HttpCode");
const postService = require("../services/post.service");

const respondPostForbidden = (res) =>
    res.status(HTTP.FORBIDDEN).json({
        message: res.__("profile_private"),
    });

const createPost = async (req, res) => {
    const { titulo, description, user_id, tags } = req.body;
    const created = await postService.create({ titulo, description, user_id, tags });
    res.status(HTTP.CREATED).json(created);
};

const getAllPosts = async (req, res) => {
    const { user_id, viewer_id } = req.query;
    const posts = await postService.findAll({ user_id, viewer_id });

    if (posts?.forbidden) {
        return respondPostForbidden(res);
    }

    res.status(HTTP.OK).json(posts);
};

const getPostById = async (req, res) => {
    const { id } = req.params;
    const post = await postService.findById(id);

    if (!post) {
        return res.status(HTTP.NOT_FOUND).json({
            message: res.__("id_dont_exist", { id, nombreModelo: "Post" }),
        });
    }

    res.status(HTTP.OK).json(post);
};

const updatePost = async (req, res) => {
    const { id } = req.params;
    const updated = await postService.update(id, req.body);

    res.status(HTTP.OK).json(updated);
};

const deletePost = async (req, res) => {
    const { id } = req.params;
    await postService.remove(id);

    res.status(HTTP.OK).json({
        message: res.__("delete_post", { id }),
    });
};

module.exports = {
    createPost,
    getAllPosts,
    getPostById,
    updatePost,
    deletePost,
};
