/**
 * Created by daniel on 13.06.2015.
 */
var mongoose = require('mongoose');
//Model f�r Gremium
module.exports = mongoose.model('Committee',{
    id: String,
    _name: String,
    description: String
});