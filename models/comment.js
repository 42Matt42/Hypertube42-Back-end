// const { Sequelize, DataTypes } = require('sequelize');
// const User = require('./user')
// const Film = require('./film')

module.exports = (dbc, DataTypes) => {
  const Comment = dbc.define('comment', {
      date: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      text: {
        type: DataTypes.TEXT('tiny'), //255 characters
        allowNull: false,
      },
    },
  );

  Comment.associate = function (models) {
    models.comment.belongsTo(models.user, {
      onDelete: "CASCADE",
      foreignKey: {
        allowNull: false,
        unique: false
      }
    });
    models.comment.belongsTo(models.film, {
      onDelete: "CASCADE",
      foreignKey: {
        allowNull: false,
        unique: false
      }
    });
  };

  return Comment;
}