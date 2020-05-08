//TODO for dev only
const models = require('../models')
const config = require('../config/config')

exports.testUser = (() => {
  models.user.create({
    firstName: 'John',
    lastName: 'Doe',
    email: 'example@example.com',
    username: 'test',
    disabled: 0,
    password: config.testpass
  })
    .catch((error) =>{
      console.log(error)
    });
});
