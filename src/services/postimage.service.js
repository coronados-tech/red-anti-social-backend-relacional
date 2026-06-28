const { PostImage, Post } = require("../db/models");
const blobStorage = require("./blobStorage.service");
const postCache = require("./postCache.service");

const findPost = (postId) => Post.findByPk(postId);

const findAll = () => PostImage.findAll();

const findById = (id) => PostImage.findByPk(id);

const findByPostId = async (postId) => {
    const post = await findPost(postId);
    if (!post) return { post: null, images: null };

    const images = await PostImage.findAll({
        where: { post_id: postId },
    });

    return { post, images };
};

const create = async ({ postId, url }) => {
    const postImage = await PostImage.create({ url, post_id: postId });
    postCache.deletePost(postId);
    return postImage;
};

const findScoped = async (id, postId) => {
    const where = { id };
    if (postId != null) where.post_id = postId;

    const postImage = await PostImage.findOne({ where });
    if (postImage) return { postImage };

    if (postId != null) {
        const post = await findPost(postId);
        if (!post) return { status: "post_not_found" };
        return { status: "image_not_found" };
    }

    return { status: "not_found" };
};

const update = async (id, { postId, url, newPostId }) => {
    const scoped = await findScoped(id, postId);
    if (scoped.status) return scoped;

    const { postImage } = scoped;

    const targetPostId = newPostId ?? postImage.post_id;
    if (newPostId != null) {
        const post = await findPost(newPostId);
        if (!post) return { status: "post_not_found" };
    }

    if (url) {
        await blobStorage.deleteIfStored(postImage.url);
    }

    const previousPostId = postImage.post_id;

    await postImage.update({
        post_id: targetPostId,
        url: url ?? postImage.url,
    });

    postCache.deletePost(previousPostId);
    if (targetPostId !== previousPostId) {
        postCache.deletePost(targetPostId);
    }

    return { status: "ok", postImage };
};

const removeAllByPostId = async (postId) => {
    const images = await PostImage.findAll({ where: { post_id: postId } });
    for (const image of images) {
        await blobStorage.deleteIfStored(image.url);
        await image.destroy();
    }
};

const remove = async (id, { postId } = {}) => {
    const scoped = await findScoped(id, postId);
    if (scoped.status) return scoped;

    const { post_id } = scoped.postImage;

    await blobStorage.deleteIfStored(scoped.postImage.url);
    await scoped.postImage.destroy();
    postCache.deletePost(post_id);

    return { status: "ok" };
};

module.exports = {
    findPost,
    findAll,
    findById,
    findByPostId,
    create,
    update,
    removeAllByPostId,
    remove,
};
