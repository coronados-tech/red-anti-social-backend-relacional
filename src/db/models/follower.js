"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Follower extends Model {
    static associate(models) {
      Follower.belongsTo(models.User, {
        foreignKey: "follower_id",
        as: "follower",
      });
      Follower.belongsTo(models.User, {
        foreignKey: "following_id",
        as: "following",
      });
    }
  }

  Follower.init(
    {
      follower_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
      },
      following_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
      },
    },
    {
      sequelize,
      modelName: "Follower",
      tableName: "Followers",
    },
  );

  return Follower;
};
