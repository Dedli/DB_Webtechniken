var express = require('express');
var router = express.Router();
var grm_user_model = require('../models/grem_member');
var membership_model = require('../models/membership');
var committee_model = require('../models/committee');
var student_council_model = require('../models/student_council');
var moment = require('moment');
var isAuthenticated = function (req, res, next) {
  // if user is authenticated in the session, call the next() to call the next request handler
  // Passport adds this method to request object. A middleware is allowed to add properties to
  // request and response objects
  if (req.isAuthenticated())
    return next();
  // if the user is not authenticated then redirect him to the login page
  res.redirect('/');
};

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
      var user = new grm_user_model({
          firstname: req.body.firstname,
          lastname: req.body.lastname,
          nkz: req.body.nkz,
          matr_nr: req.body.matr_nr
      });
      console.log('\nsave user: ');console.log(user);
      for (var grem in req.body.comm){
          console.log("ID beim Post: "+user._id);
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
              res.status(err.status || 500);
              res.render('error', {
                  message: err.message,
                  error: err
              });}
                membership.save(function (err,user) {
                    if (err) {
                        res.status(err.status || 500);
                        res.render('error', {
                            message: err.message,
                            error: err
                        })
                    }
                });
                    res.render('success', {msg: 'Nuter erfolgreich angelegt'});

      })
  });

    /*Get Member Edit*/
    router.get('/edit_grm_user/:user_id', function(req, res){
        var user_id = req.params.user_id;
        console.log("User_id: "+user_id);
        var member;
        grm_user_model.findOne({_id: user_id}, function(err,user){
           if(!user) res.status(404).send("Nutzer nicht gefunden");
           else if(err) res.status(500).send(err.message);
           else{
              member = user;
           }
        });
        membership_model.find({user_id: user_id}, function(err,memberships) {
            if(!memberships) res.status(404).send("Keine Gremnienmitgliedschaft");
            else if(err) res.status(500).send(err.message);
            else {
                JSON.stringify(memberships);
                JSON.stringify(member);
                committee_model.find().lean().exec(function (err, committees) {
                    if (err) {
                        res.status(err.status || 500);
                        res.render('error', {
                            message: err.message,
                            error: err
                        });
                    }
                    else if (!committees) res.status(404).send('Fehler beim DB Zugriff');
                    else {
                        JSON.stringify(committees);
                        res.render('edit_grm_user', {
                            moment: moment,
                            user: member,
                            memberships: memberships,
                            FS: ['Chemie', 'Informatik', 'Mathematik', 'Elektrotechnik/Informationstechnik', 'Philosophische Fakult\u00e4t', 'Wirtschaftswissenschaften', 'Human- und Sozialwissenschaften', 'Physik'],
                            committees: committees
                        });
                    }
                    });
            }
        });
    });

    router.get('/create_committee', function(req, res){
        res.render('create_committee');
    });

    router.post('/create_committee', function(req, res){
        var comm = req.body;
        //console.log("From Create_Committee: "+JSON.stringify(comm));
        var committee = new committee_model({
            _name: comm._name,
            description: comm.description
        });
        committee.save(function (err,user){
            if(err) {
                res.status(err.status || 500);
                res.render('error', {
                    message: err.message,
                    error: err
                });}
            res.render('success', {msg: 'Gremium erfolgreich angelegt'});
        })
    });

    router.post('/edit_committee/:_id', function(req, res) {
        var committee = req.body;
        var comm_id = req.params._id;
        console.log("From Create_Committee: "+comm_id);
        committee_model.findById(comm_id, function (err, comm) {
            if (err) {
                res.status(err.status || 500);
                res.render('error', {
                    message: err.message,
                    error: err
                });
            }
            else if (!comm) res.status(404).send("Gremium nicht gefunden");
            else {

                comm._name = committee._name || comm._name;
                comm.description = committee.description || comm.description;
                comm.save(function (err, committee) {
                    if (err) {
                        res.status(err.status || 500);
                        res.render('error', {
                            message: err.message,
                            error: err
                        });
                    }
                    res.render('success', {msg: 'Gremium erfolgreich angelegt'});
                })
            }
        });
    });
    router.post('/edit_grm_user/:_id',function(req,res,next) {
        console.log('got from form edit_user: ');
        console.log(req.body);
        var user_id = req.params._id;
        var user = req.body;
        grm_user_model.findById(user_id, function (err, usr) {
            if (err) {
                res.status(err.status || 500);
                res.render('error', {
                    message: err.message,
                    error: err
                });
            }
            else if (!usr) res.status(404).send("Nutzer nicht gefunden");
            else {
                console.log("speicher geänderte Userdaten");
                console.log(user);

                usr.firstname = user.firstname || usr.firstname;
                usr.lastname = user.lastname || usr.lastname;
                usr.nkz = user.nkz || usr.nkz;
                usr.matr_nr = user.matr_nr || usr.matr_nr;

                usr.save(function (err) {
                    if (err) {
                        res.status(err.status || 500);
                        res.render('error', {
                            message: err.message,
                            error: err
                        });
                    }
                });
                for(var membership in user.comm) {
                    var membership_id = user.comm[membership].membership_id;
                    membership_model.findOne({_id: membership_id}, function (err, comm) {
                        if (err) {
                            res.status(err.status || 500);
                            res.render('error', {
                                message: err.message,
                                error: err
                            });
                        }
                        else if (!comm) {
                            res.status(404);
                            res.send('Committee not found');
                        }
                        else {
                            comm.grem_id = user.comm[membership].committee || comm.grem_id;
                            comm.from = user.comm[membership].from || comm.from;
                            comm.to = user.comm[membership].to || comm.to;
                            comm.reason = user.comm[membership].reason;
                            comm.successor = user.comm[membership].successor;
                            console.log('Save Committee: '+ comm);
                            comm.save(function (err) {
                                if (err) {
                                    res.status(500);
                                    res.render('error', {
                                        message: err.message,
                                        error: err
                                    });
                                }
                                res.render('success', {msg: 'Nuter erfolgreich geaendert'});
                            });

                        }

                    });
                }
            }
        });
    });

  /* GET Home Page */
  router.get('/admin', isAuthenticated, function(req, res){
      grm_user_model.find().lean().exec(function(err,grm_user_models){
          if (err) {
              res.status(err.status || 500);
              res.render('error', {
                  message: err.message,
                  error: err
              });
          }
          else if(!grm_user_models) res.status(404).send('Keine User in Datenbank');
          else {

              grm_user_model.find().lean().exec(function (err, grm_user_models) {
                  if (err) {
                      res.status(err.status || 500);
                      res.render('error', {
                          message: err.message,
                          error: err
                      });
                  }
                  else if (!grm_user_models) res.status(404).send('Keine User in Datenbank');
                  else {
                      //console.log("DATA:");console.log(grm_user_models);
                      JSON.stringify(grm_user_models);
                      committee_model.find().lean().exec(function (err, committees) {
                          if (err) {
                              res.status(err.status || 500);
                              res.render('error', {
                                  message: err.message,
                                  error: err
                              });
                          }
                          else if (!committees) res.status(404).send('Fehler beim DB Zugriff');
                          else {
                              JSON.stringify(committees);
                              console.log("Committees: "+committees);
                      res.render('admin', {
                          grm_members: grm_user_models, user: req.user, title: 'testuser', committees: committees,
                          FS: ['Chemie', 'Informatik', 'Mathematik', 'Elektrotechnik/Informationstechnik', 'Philosophische Fakult\u00e4t', 'Wirtschaftswissenschaften', 'Human- und Sozialwissenschaften', 'Physik'],


                      });
                  }
              });
          }
      });
          }
      });
  });

  /* Handle Logout */
  router.get('/signout', function(req, res) {
    req.logout();
    res.redirect('/');
  });

  return router;
};