const { Comment, User, Post } = require("../db/models");
const postCache = require("./postCache.service");

const commentIncludes = [
    {
        model: User,
        as: "user",
        attributes: ["id", "nickname", "name", "lastName", "profilePicture"],
    },
    {
        model: Post,
        as: "post",
        attributes: ["id", "description"],
    },
];

const findAll = ({ post_id } = {}) => {
    const where = post_id !== undefined ? { post_id } : {};
    return Comment.findAll({ where, include: commentIncludes });
};

const findById = (id) => Comment.findByPk(id, { include: commentIncludes });

const create = async ({ content, user_id, post_id }) => {
    const comment = await Comment.create({
        content,
        user_id,
        post_id,
    });

    postCache.deletePost(post_id);

    return Comment.findByPk(comment.id, {
        include: commentIncludes,
    });
};

const update = async (id, { content }) => {
    const comment = await Comment.findByPk(id);

    if (!comment) return null;

    if (content === undefined) return { empty: true };

    await comment.update({ content });

    postCache.deletePost(comment.post_id);

    return Comment.findByPk(id, {
        include: commentIncludes,
    });
};

const remove = async (id) => {
    const comment = await Comment.findByPk(id);

    if (!comment) return false;

    const { post_id } = comment;
    await comment.destroy();
    postCache.deletePost(post_id);

    return true;
};

module.exports = {
    findAll,
    findById,
    create,
    update,
    remove,
};
