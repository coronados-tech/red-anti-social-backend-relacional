const HTTP = require("../config/HttpCode");
const blobStorage = require("../services/blobStorage.service");
const postImageService = require("../services/postimage.service");
const postService = require("../services/post.service");

const resolvePostId = (req) => {
    if (req.params.image_id != null || req.params.imageId != null) {
        return req.params.id;
    }
    if (req.baseUrl === "/posts" && req.path.endsWith("/images")) {
        return req.params.id;
    }
    return req.body?.postId ?? req.body?.post_id;
};

const resolveImageId = (req) =>
    req.params.image_id ?? req.params.imageId ?? req.params.id;

const respondServiceError = (res, result, { imageId, postId } = {}) => {
    if (!result?.status || result.status === "ok") return false;

    switch (result.status) {
        case "post_not_found":
            res.status(HTTP.NOT_FOUND).json({
                message: res.__("id_dont_exist", { id: postId, nombreModelo: "Post" }),
            });
            return true;
        case "image_not_found":
            res.status(HTTP.NOT_FOUND).json({
                message: res.__("post_image_not_in_post", { imageId, postId }),
            });
            return true;
        case "not_found":
            res.status(HTTP.NOT_FOUND).json({
                message: res.__("id_dont_exist", { id: imageId, nombreModelo: "PostImage" }),
            });
            return true;
        default:
            return false;
    }
};

const createPostImage = async (req, res) => {
    if (!req.file) {
        return res.status(HTTP.BAD_REQUEST).json({
            message: res.__("no_image_sent"),
        });
    }

    const url = await blobStorage.savePostImagePersisted(req.file, req);
    const postId = resolvePostId(req);
    const postImage = await postImageService.create({ postId, url });

    res.status(HTTP.CREATED).json(postImage);
};

const getAllPostImages = async (req, res) => {
    const postImages = await postImageService.findAll();
    res.status(HTTP.OK).json(postImages);
};

const getPostImageById = async (req, res) => {
    const { id } = req.params;
    const postImage = await postImageService.findById(id);

    res.status(HTTP.OK).json(postImage);
};

const getPostImagesByPost = async (req, res) => {
    const postId = resolvePostId(req);
    const access = await postService.canViewPostById(postId);

    if (access.notFound) {
        return res.status(HTTP.NOT_FOUND).json({
            message: res.__("id_dont_exist", { id: postId, nombreModelo: "Post" }),
        });
    }

    const { images } = await postImageService.findByPostId(postId);

    res.status(HTTP.OK).json(images);
};

const updatePostImage = async (req, res) => {
    const imageId = resolveImageId(req);
    const postId = resolvePostId(req);
    const url = req.file ? await blobStorage.savePostImagePersisted(req.file, req) : undefined;
    const result = await postImageService.update(imageId, {
        postId,
        url,
        newPostId: req.body?.postId ?? req.body?.post_id,
    });

    if (respondServiceError(res, result, { imageId, postId })) return;

    res.status(HTTP.OK).json(result.postImage);
};

const deletePostImage = async (req, res) => {
    const imageId = resolveImageId(req);
    const postId = resolvePostId(req);
    const result = await postImageService.remove(imageId, { postId });

    if (respondServiceError(res, result, { imageId, postId })) return;

    if (postId != null) {
        return res.status(HTTP.OK).json({
            message: res.__("delete_post_image_from_post", { imageId, postId }),
        });
    }

    res.status(HTTP.OK).json({ message: res.__("delete_post_image", { id: imageId }) });
};

module.exports = {
    createPostImage,
    getAllPostImages,
    getPostImageById,
    getPostImagesByPost,
    updatePostImage,
    deletePostImage,
};
