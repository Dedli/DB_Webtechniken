/**
 * Created by daniel on 30.06.2015.
 */
var mongoose = require('mongoose');

module.exports = mongoose.model('Period',{
    id: String,
    from: Date,
    to: Date
});