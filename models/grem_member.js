/**
 * Created by daniel on 13.06.2015.
 */
var mongoose = require('mongoose');

module.exports = mongoose.model('Grem_member',{
    id: String,
    firstname: String,
    lastname: String,
    nkz: String,
    matr_nr: Number
});