/**
 * Created by daniel on 13.06.2015.
 */
var mongoose = require('mongoose');
//Model f�r Fachschaft
module.exports = mongoose.model('Student_council',{
    id: String,
    _name: String
});