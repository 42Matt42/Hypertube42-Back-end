// const { Sequelize, DataTypes } = require('sequelize');
// const User = require('./user')
// const Film = require('./film')

module.exports = (dbc, DataTypes) => {
  const FilmView = dbc.define('filmView', {
      date: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      userId: {
        type: DataTypes.INTEGER,
        unique: 'userId-filmId-pair'
      },
      filmId: {
        type: DataTypes.INTEGER,
        unique: 'userId-filmId-pair'
      }
    },
  );

  FilmView.associate = function (models) {
    models.filmView.belongsTo(models.user, {
      onDelete: "CASCADE",
      foreignKey: {
        allowNull: false,
        unique: false
      }
    });
    models.filmView.belongsTo(models.film, {
      onDelete: "CASCADE",
      foreignKey: {
        allowNull: false,
        unique: false
      }
    });
  };

  return FilmView;
}