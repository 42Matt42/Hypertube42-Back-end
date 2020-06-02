// const { Sequelize, DataTypes } = require('sequelize');
// const User = require('./user')


module.exports = (dbc, DataTypes) => {
  const Film = dbc.define('film', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      filmRef: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        //TODO ref validation regex
      },

      path: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      magnet: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      viewed: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
  );

  Film.associate = function (models) {
    models.user.hasMany(models.filmView);
  };

  return Film;
}