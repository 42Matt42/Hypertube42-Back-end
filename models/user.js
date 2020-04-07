// const { Sequelize, DataTypes } = require('sequelize');

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
                        args: [3, 15],
                        msg: "Username should contain between 3 and 15 characters"
                    }
                }
            },
            password: {
                type: DataTypes.STRING,
                allowNull: true,
                validate: {
                    len: {
                        args: [6, 60],
                        msg: "Password should contain between 6 and 60 characters"
                    },
                    isNull: function (val) {
                        if (!val) {
                            throw new Error("Please provide password")
                        }
                    }
                }
            },
            photo: {
                type: DataTypes.STRING,
                allowNull: false,
                defaultValue: 'https://via.placeholder.com/150',
            },
            language: {
                type: DataTypes.ENUM('english', 'french', 'spanish'),
                allowNull: false,
                defaultValue: 'english',
            },
            disabled: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false, //TODO should be true
            },
        },
    );

// create user
//         User.create({
//             firstName: 'John',
//             lastName: 'Doe',
//             email: 'johndoe@gmail.com',
//             username: 'johndoe',
//             password: '1234567',
//         })
//             .then(function () {
//                 console.log("user created");
//             })
//             .catch(function (err) {
//                 console.log(err);
//             });

    return User;
}