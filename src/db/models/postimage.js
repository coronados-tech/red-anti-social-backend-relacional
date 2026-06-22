"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
    class PostImage extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            PostImage.belongsTo(models.Post, { foreignKey: "post_id", as: "post" });
        }
    }
    PostImage.init(
        {
            url: { type: DataTypes.STRING, allowNull: false },
            createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
            updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
        },
        {
            sequelize,
            modelName: "PostImage",
        },
    );
    return PostImage;
};
