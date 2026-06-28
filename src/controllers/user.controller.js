const HTTP = require("../config/HttpCode");
const { User } = require("../db/models");
const blobStorage = require("../services/blobStorage.service");
const followerService = require("../services/follower.service");
const userService = require("../services/user.service");

const respondProfileForbidden = (res) =>
    res.status(HTTP.FORBIDDEN).json({
        message: res.__("profile_private"),
    });

const createUser = async (req, res) => {
    const user = await User.create(req.body);
    res.status(HTTP.CREATED).json(user);
};

const getAllUsers = async (req, res) => {
    const users = await userService.findAllForViewer(req.viewerId);
    res.status(HTTP.OK).json(users);
};

const getUserById = async (req, res) => {
    const { id } = req.params;
    const result = await userService.findByIdForViewer(id, req.viewerId);

    if (result?.forbidden) {
        return respondProfileForbidden(res);
    }

    res.status(HTTP.OK).json(result);
};

const updateUser = async (req, res) => {
    const { id } = req.params;
    const user = await User.findByPk(id);
    await user.update(req.body);
    res.status(HTTP.OK).json(user);
};

const deleteUser = async (req, res) => {
    const { id } = req.params;
    const user = await User.findByPk(id);
    await blobStorage.deleteIfStored(user.profilePicture);
    await user.destroy();
    res.status(HTTP.OK).json({ message: res.__("delete_user", { id }) });
};

const uploadUserProfilePicture = async (req, res) => {
    if (!req.file) {
        return res.status(HTTP.BAD_REQUEST).json({
            message: res.__("no_image_sent"),
        });
    }

    const { id } = req.params;
    const user = await User.findByPk(id);

    if (user.profilePicture) {
        await blobStorage.deleteIfStored(user.profilePicture);
    }

    const url = await blobStorage.saveProfileImagePersisted(req.file, req);

    await user.update({ profilePicture: url });

    res.status(HTTP.OK).json(user);
};

const deleteUserProfilePicture = async (req, res) => {
    const { id } = req.params;
    const user = await User.findByPk(id);

    if (!user.profilePicture) {
        return res.status(HTTP.NOT_FOUND).json({
            message: res.__("profile_picture_not_found"),
        });
    }

    await blobStorage.deleteIfStored(user.profilePicture);
    await user.update({ profilePicture: null });

    res.status(HTTP.OK).json({
        message: res.__("delete_profile_picture", { id }),
    });
};

const getUserFollowers = async (req, res) => {
    const { id } = req.params;
    const user = await User.findByPk(id);

    if (!(await userService.canViewFullProfile(user, req.viewerId))) {
        return respondProfileForbidden(res);
    }

    const followers = await followerService.getFollowers(id);
    res.status(HTTP.OK).json(followers);
};

const getUserFollowing = async (req, res) => {
    const { id } = req.params;
    const user = await User.findByPk(id);

    if (!(await userService.canViewFullProfile(user, req.viewerId))) {
        return respondProfileForbidden(res);
    }

    const following = await followerService.getFollowing(id);
    res.status(HTTP.OK).json(following);
};

const followUser = async (req, res) => {
    const { id } = req.params;
    const followerId = req.user.id;
    const result = await followerService.follow(id, followerId);

    if (result?.selfFollow) {
        return res.status(HTTP.BAD_REQUEST).json({
            message: res.__("cannot_follow_self"),
        });
    }

    res.status(HTTP.CREATED).json({
        message: res.__("follow_success"),
        following_id: Number(id),
        follower_id: Number(followerId),
    });
};

const unfollowUser = async (req, res) => {
    const { id } = req.params;
    const followerId = req.user.id;
    const result = await followerService.unfollow(id, followerId);

    res.status(HTTP.OK).json({
        message: res.__("unfollow_success"),
        following_id: Number(id),
        follower_id: Number(followerId),
    });
};

module.exports = {
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
};
