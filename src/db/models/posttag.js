"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class PostTag extends Model {
    static associate(models) {
      PostTag.belongsTo(models.Post, { foreignKey: "post_id" });
      PostTag.belongsTo(models.Tag, { foreignKey: "tag_id" });
    }
  }
  PostTag.init(
    {
      post_id: { type: DataTypes.INTEGER, allowNull: false },
      tag_id: { type: DataTypes.INTEGER, allowNull: false },
    },
    {
      sequelize,
      modelName: "PostTag",
      tableName: "PostTags",
      timestamps: false,
    },
  );
  return PostTag;
};
