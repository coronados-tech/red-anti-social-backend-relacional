"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Post extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Post.belongsTo(models.User, { foreignKey: "user_id", as: "user" });
      Post.hasMany(models.Comment, { foreignKey: "post_id", as: "comments" });
      Post.hasMany(models.PostImage, {
        foreignKey: "post_id",
        as: "postImages",
      });
      Post.belongsToMany(models.Tag, {
        through: models.PostTag,
        foreignKey: "post_id",
        otherKey: "tag_id",
        as: "tags",
      });
    }
  }
  Post.init(
    {
      titulo: { type: DataTypes.STRING(200), allowNull: false },
      slug: { type: DataTypes.STRING(220), allowNull: false, unique: true },
      description: { type: DataTypes.TEXT, allowNull: false },
      //publicationDate: { type: DataTypes.DATE, allowNull: false },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize,
      modelName: "Post",
    },
  );
  return Post;
};
