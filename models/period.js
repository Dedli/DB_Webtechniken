/**
 * Created by daniel on 30.06.2015.
 */
var mongoose = require('mongoose');
//Model für die Amtszeiten
module.exports = mongoose.model('Period',{
    id: String,
    from: Date,
    to: Date
});