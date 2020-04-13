// const { Sequelize, DataTypes } = require('sequelize');
const User = require('./user')


module.exports = (dbc, DataTypes) => {
    const TempEmail = dbc.define('tempEmail', {
            email: {
                type: DataTypes.STRING,
                // unique: true,
                allowNull: true,
                validate: {
                    isEmail: {
                        args: true,
                        msg: "Please provide a valid email"
                    },
                    isNull: function (val) {
                        if (!val) {
                            throw new Error("Please provide email")
                        }
                    }
                }
            },
            token: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
            },
            token_creation: {
                type: DataTypes.DATE,
                defaultValue: DataTypes.NOW,
            },
        },
    );

    TempEmail.associate = function (models) {
        models.tempEmail.belongsTo(models.user, {
            onDelete: "CASCADE",
            foreignKey: {
                allowNull: false,
                unique: true
            }
        });
    };

    return TempEmail;
}