/**
 * Created by daniel on 04.07.2015.
 */
var mongoose = require('mongoose');
//Model für Fachschaftsmitgliedschaft
module.exports = mongoose.model('Membership_Council',{
    id: String,
    council_id: String,
    from: Date,
    to: Date,
    user_id: String
});