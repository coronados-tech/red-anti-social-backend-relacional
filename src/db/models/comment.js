"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
    class Comment extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            Comment.belongsTo(models.User, { foreignKey: "user_id", as: "user" });
            Comment.belongsTo(models.Post, { foreignKey: "post_id", as: "post" });
        }
    }
    Comment.init(
        {
            //id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
            content: { type: DataTypes.TEXT, allowNull: false },
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
            monthsOld: {
                type: DataTypes.VIRTUAL,
                get() {
                    const createdAt = this.getDataValue("createdAt");
                    if (!createdAt) return null;

                    const now = new Date();
                    const created = new Date(createdAt);

                    const years = now.getFullYear() - created.getFullYear();
                    const months = now.getMonth() - created.getMonth();

                    return years * 12 + months;
                },
            },
        },
        { sequelize, modelName: "Comment" },
    );
    return Comment;
};
