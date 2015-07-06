/**
 * Created by daniel on 13.06.2015.
 */
var mongoose = require('mongoose');

module.exports = mongoose.model('Membership',{
    id: String,
    grem_id: String,
    from: Date,
    to: Date,
    reason: String,
    period_id: String,
    user_id: String,
    council_id: String,
    successor: { type: Boolean, default: false }
});