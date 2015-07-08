var mongoose = require('mongoose');
//Model für User zur Autorisierung des Webinterfaces
module.exports = mongoose.model('User',{
    id: String,
    username: String,
    password: String,
    email: String,
    firstName: String,
    lastName: String,
    admin: {type: Boolean, default: false}
});