// const { Sequelize, DataTypes } = require('sequelize');

module.exports = (dbc, DataTypes) => {
    const User = dbc.define('users', {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            firstName: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            lastName: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            email: {
                type: DataTypes.STRING,
                allowNull: false,
                unique: true,
                validate: {
                    isEmail: true,
                }
            },
            username: {
                type: DataTypes.STRING,
                allowNull: false,
                unique: true,
                validate: {
                    isAlphanumeric: true,
                    len: [3, 15]
                }
            },
            password: {
                type: DataTypes.STRING,
                allowNull: false,
                validate: {
                    len: [6, 30]
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


//create user
    User.sync({force: true}).then(function () {
        // Table created
        return User.create({
            firstName: 'John',
            lastName: 'Doe',
            email: 'johndoe@gmail.com',
            username: 'johndoe',
            password: '1234567',
        })
            .then(function () {
                console.log("user created");
            })
            .catch(function (err) {
                console.log(err);
            });
    });

    return User;
}