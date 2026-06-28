"use strict";
const { Model } = require("sequelize");
const { hashPassword } = require("../../helpers/password.helper");
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      User.hasMany(models.Post, { foreignKey: "user_id", as: "posts" });
      User.hasMany(models.Comment, { foreignKey: "user_id", as: "comments" });
      //mis seguidores
      User.belongsToMany(models.User, {
        through: models.Follower,
        as: "followers",
        foreignKey: "following_id",
        otherKey: "follower_id",
      });
      //mis seguidos
      User.belongsToMany(models.User, {
        through: models.Follower,
        as: "following",
        foreignKey: "follower_id",
        otherKey: "following_id",
      });
    }

    toJSON() {
      const attributes = [
        "id",
        "nickname",
        "name",
        "lastName",
        "email",
        "birthDate",
        "gender",
        "profilePicture",
        "isProfilePublic",
        "createdAt",
        "updatedAt",
      ];
      const values = {};

      for (const attribute of attributes) {
        const value = this.get(attribute);
        if (value !== undefined) {
          values[attribute] = value;
        }
      }

      for (const association of ["followers", "following", "posts", "comments"]) {
        if (this[association] !== undefined) {
          values[association] = this[association];
        }
      }

      return values;
    }
  }
  User.init(
    {
      nickname: { type: DataTypes.STRING, unique: true, allowNull: false },
      name: { type: DataTypes.STRING, allowNull: false },
      lastName: { type: DataTypes.STRING, allowNull: false },
      email: { type: DataTypes.STRING, unique: true, allowNull: false },
      password: { type: DataTypes.STRING, allowNull: false },
      birthDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        get() {
          const value = this.getDataValue("birthDate");
          if (!value) return null;
          if (typeof value === "string") return value.slice(0, 10);
          return value.toISOString().slice(0, 10);
        },
      },
      gender: { type: DataTypes.STRING, allowNull: false },
      profilePicture: { type: DataTypes.TEXT, allowNull: true },
      isProfilePublic: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
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
      modelName: "User",
      hooks: {
        beforeCreate: async (user) => {
          if (user.email) {
            user.email = user.email.trim().toLowerCase();
          }
          if (user.nickname) {
            user.nickname = user.nickname.trim();
          }
          if (user.password) {
            user.password = await hashPassword(user.password);
          }
        },
        beforeUpdate: async (user) => {
          if (user.changed("email") && user.email) {
            user.email = user.email.trim().toLowerCase();
          }
          if (user.changed("nickname") && user.nickname) {
            user.nickname = user.nickname.trim();
          }
          if (user.changed("password")) {
            user.password = await hashPassword(user.password);
          }
        },
      },
    },
  );
  return User;
};
