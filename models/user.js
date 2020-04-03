module.exports = (sequelize, DataTypes) => {
    var User = sequelize.define('user', {
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
        },
        username: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        password: {
            type: DataTypes.STRING,
            allowNull: false,
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
    });

//to sync a table
//     (async () => {
//         await User.sync({force: true});
//         console.log("The table for the User model was just (re)created!");
//     })();


// force: true will drop the table if it already exists
    User.sync({force: true}).then(function () {
        // Table created
        return User.create({
            firstName: 'Jane',
            lastName: 'Doe',
            email: 'johndoe@gmail.com',
            username: 'johndoe',
            password: '123456',
        });
    });

    return User;
}