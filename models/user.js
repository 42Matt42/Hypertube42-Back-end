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
                    isAlpha: {
                        args: true,
                        msg: "First name can contain only letters"
                    },
                    isNull: function (val){
                        if (!val){
                            throw new Error("Please provide first name")
                        }
                    }
                }
            },
            lastName: {
                type: DataTypes.STRING,
                allowNull: true,
                validate: {
                    isAlpha: {
                        args: true,
                        msg: "Last name can contain only letters"
                    },
                    isNull: function (val){
                        if (!val){
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
                    isNull: function (val){
                        if (!val){
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
                        args: [6, 15],
                        msg: "Password should contain between 6 and 15 characters"
                    },
                    isNull: function (val){
                        if (!val){
                            throw new Error("Please provide email")
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

        },
    );

//to sync a table
//     (async () => {
//         await User.sync({force: true});
//         console.log("The table for the User model was just (re)created!");
//     })();


// create user
//     User.sync().then(function () {
//         // Table created
//         return
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
    // });

    return User;
}