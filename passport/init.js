/**
 * Created by daniel on 12.06.2015.
 */
    //Abhängigkeiten einbinden
var login = require('./login');
var signup = require('./signup');
var User = require('../models/user');

module.exports = function(passport){

    // (De)Serialisierung der Nutzer um persistenten Login zu gewehrleisten
    passport.serializeUser(function(user, done) {
        console.log('serializing user: ');console.log(user);
        done(null, user._id);
    });

    passport.deserializeUser(function(id, done) {
        User.findById(id, function(err, user) {
            console.log('deserializing user:',user);
            done(err, user);
        });
    });

    // Passport Strategien ausführen
    login(passport);
    signup(passport);

};