//Modulabhänigkeiten
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var methodOverride = require('method-override');
var mongoose = require('mongoose');

//Konfigurationsdatei einbinden
var dbConfig = require('./db');

// Verbinden zur DB
mongoose.connect(dbConfig.url);

var app = express();
//Freigeben des /public Verzeichnisses
app.use("/public", express.static(path.join(__dirname, 'public')));

// View Engine Konfigurieren
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(express.static(path.join(__dirname, 'public')));
//app.use(favicon());
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());


// Konfiguration Passport
var passport = require('passport');
app.use(session({resave: false,saveUninitialized: true,secret: 'mySecretKey'}));
app.use(passport.initialize());
app.use(passport.session());

// Using the flash middleware provided by connect-flash to store messages in session
// and displaying in templates
var flash = require('connect-flash');
app.use(flash());

// Initialiere Passport
var initPassport = require('./passport/init');
initPassport(passport);
app.use(methodOverride());
var routes = require('./routes/index')(passport);
app.use('/', routes);
// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
/*
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}
*/
// production error handler
// no stacktraces leaked to user
/*
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});

*/
module.exports = app;