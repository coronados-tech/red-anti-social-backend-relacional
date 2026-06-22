const { Tag, Post } = require("../db/models");
const postCache = require("./postCache.service");

const tagIncludes = [
    {
        model: Post,
        as: "posts",
        attributes: ["id", "description"],
        through: { attributes: [] },
    },
];

const normalizeName = (name) => name.trim().toLowerCase();

const buildInclude = (post_id) => {
    if (post_id === undefined) return tagIncludes;

    return [
        {
            model: Post,
            as: "posts",
            attributes: ["id", "description"],
            where: { id: post_id },
            required: true,
            through: { attributes: [] },
        },
    ];
};

const invalidateCacheForPosts = (posts = []) => {
    for (const post of posts) {
        postCache.deletePost(post.id);
    }
};

const findAll = ({ post_id } = {}) => Tag.findAll({ include: buildInclude(post_id) });

const findById = (id) => Tag.findByPk(id, { include: tagIncludes });

const create = async ({ name, post_id }) => {
    const [tag, created] = await Tag.findOrCreate({ where: { name: normalizeName(name) } });

    if (post_id !== undefined) {
        const post = await Post.findByPk(post_id);
        await post.addTag(tag);
        postCache.deletePost(post_id);
    }

    const result = await Tag.findByPk(tag.id, { include: tagIncludes });
    return { tag: result, created };
};

const update = async (id, { name }) => {
    const tag = await Tag.findByPk(id, { include: tagIncludes });

    if (!tag) return null;
    if (name === undefined) return { empty: true };

    await tag.update({ name: normalizeName(name) });
    invalidateCacheForPosts(tag.posts);

    return Tag.findByPk(id, { include: tagIncludes });
};

const remove = async (id) => {
    const tag = await Tag.findByPk(id, { include: tagIncludes });

    if (!tag) return false;

    const posts = tag.posts;
    await tag.destroy();
    invalidateCacheForPosts(posts);
    return true;
};

module.exports = {
    findAll,
    findById,
    create,
    update,
    remove,
};
