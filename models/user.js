// const { Sequelize, DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs')

module.exports = (dbc, DataTypes) => {
  const User = dbc.define('user', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      firstName: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
          is: {
            args: [/^[a-z]+$/i],
            msg: "First name can contain only letters"
          },
          len: {
            args: [2, 15],
            msg: "Firstname should contain between 2 and 15 characters"
          },
          isNull: function (val) {
            if (!val) {
              throw new Error("Please provide first name")
            }
          }
        }
      },
      lastName: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
          is: {
            args: [/^[a-z]+$/i],
            msg: "Last name can contain only letters"
          },
          len: {
            args: [2, 15],
            msg: "Lastname should contain between 2 and 15 characters"
          },
          isNull: function (val) {
            if (!val) {
              throw new Error("Please provide last name")
            }
          }
        }
      },
      email: {
        type: DataTypes.STRING,
        unique: true,
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
      username: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true,
        validate: {
          isAlphanumeric: {
            args: true,
            msg: "Username can contain only letters and numbers"
          },
          len: {
            args: [4, 15],
            msg: "Username should contain between 4 and 15 characters"
          }
        }
      },
      password_hash: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: true,
        },
      },
      password: {
        type: DataTypes.VIRTUAL,
        allowNull: false,
        validate: {
          is: {
            args: [/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{8,42}$/],
            msg: "8-42 characters, at least one uppercase letter, one lowercase letter, one number"
          },
        },
          set: function (value) {
          this.setDataValue('password', value);
          this.setDataValue('password_hash', bcrypt.hashSync(value, 8));
        }
      },
      photo: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'uploads/image.png',
      },
      language: {
        type: DataTypes.ENUM('english', 'french'),
        allowNull: false,
        defaultValue: 'english',
      },
      disabled: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
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

  User.associate = function (models) {
    models.user.hasMany(models.tempEmail);
  };

  return User;
}
