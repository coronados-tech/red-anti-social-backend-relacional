const HTTP = require("../config/HttpCode");

const tagService = require("../services/tag.service");

const createTag = async (req, res) => {
    const { name, post_id } = req.body;
    const { tag, created } = await tagService.create({ name, post_id });
    res.status(created ? HTTP.CREATED : HTTP.OK).json(tag);
};

const getAllTags = async (req, res) => {
    const { post_id } = req.query;
    const tags = await tagService.findAll({ post_id });
    res.status(HTTP.OK).json(tags);
};

const getTagById = async (req, res) => {
    const { id } = req.params;
    const tag = await tagService.findById(id);

    res.status(HTTP.OK).json(tag);
};

const updateTag = async (req, res) => {
    const { id } = req.params;
    const updatedTag = await tagService.update(id, req.body);

    res.status(HTTP.OK).json(updatedTag);
};

const deleteTag = async (req, res) => {
    const { id } = req.params;
    await tagService.remove(id);
    res.status(HTTP.OK).json({ message: res.__("delete_tag", { id }) });
};
module.exports = {
    createTag,
    getAllTags,
    getTagById,
    updateTag,
    deleteTag,
};
