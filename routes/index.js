var express = require('express');
var router = express.Router();
var grm_user = require('../models/grem_member');
var membership_model = require('../models/membership')
var isAuthenticated = function (req, res, next) {
  // if user is authenticated in the session, call the next() to call the next request handler
  // Passport adds this method to request object. A middleware is allowed to add properties to
  // request and response objects
  if (req.isAuthenticated())
    return next();
  // if the user is not authenticated then redirect him to the login page
  res.redirect('/');
}

module.exports = function(passport){

  /* GET login page. */
  router.get('/', function(req, res) {
    // Display the Login page with any flash message, if any
    res.render('index', { message: req.flash('message') });
  });

  /* Handle Login POST */
  router.post('/login', passport.authenticate('login', {
    successRedirect: '/admin',
    failureRedirect: '/',
    failureFlash : true
  }));

  /* GET Registration Page */
  router.get('/signup', function(req, res){
    res.render('register',{message: req.flash('message')});
  });

  /* Handle Registration POST */
  router.post('/signup', passport.authenticate('signup', {
    successRedirect: '/admin',
    failureRedirect: '/signup',
    failureFlash : true
  }));

  /* Handle grem_user Create Post */
  router.post('/create_grem_user', function(req, res, next){
      console.log('got from form: ');console.log(req.body);
      var user = new grm_user({
          firstname: req.body.firstname,
          lastname: req.body.lastname,
          nkz: req.body.nkz,
          matr_nr: req.body.matr_nr
      });
      console.log('\nsave user: ');console.log(user);
      for (var grem in req.body.comm){
      var membership = new membership_model({
          grem_id: req.body.comm[grem].committee,
          from : req.body.comm[grem].from,
          to : req.body.comm[grem].to,
          reason : req.body.comm[grem].reason,
          user_id : user._id,
          council_id : req.body.comm[grem].FS,
          successor: false
      });
      console.log('\nsave membership: ');console.log(membership);}
      user.save(function (err,user){
          if(err) {
              res.json(400).json(err);
              return next(err)}
                membership.save(function (err,user){
                    if(err) {
                        res.json(400).json(err);
                        return next(err)}});
              res.status(201).render('admin', {
                  message: "erfolgreich",
                  user: req.user,  title: 'testuser',
                  FS: ['Chemie','Informatik','Mathematik','Elektrotechnik/Informationstechnik','Philosophische Fakult\u00e4t','Wirtschaftswissenschaften','Human- und Sozialwissenschaften','Physik'],
                  gremien: ['StuRa','FSR']
              });
      })
  });

  /* GET Home Page */
  router.get('/admin', isAuthenticated, function(req, res){
    res.render('admin', { user: req.user,  title: 'testuser',
        FS: ['Chemie','Informatik','Mathematik','Elektrotechnik/Informationstechnik','Philosophische Fakult\u00e4t','Wirtschaftswissenschaften','Human- und Sozialwissenschaften','Physik'],
        gremien: ['StuRa','FSR']
    });
  });

  /* Handle Logout */
  router.get('/signout', function(req, res) {
    req.logout();
    res.redirect('/');
  });

  return router;
}