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

        validate: {
        // isNull: function (val) {
        //   if (!val) {
        //     throw new Error("Please provide email")
        //   }
        // }
        //     is: {
        //         args: [/^[a-z]+$/i],
        //         msg: "Film_ref can contain only letters"
        //     },
        }
      },
    },
  );

    Film.associate = function (models) {
        models.user.hasMany(models.filmView);
    };

  return Film;
}