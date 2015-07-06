var express = require('express');
var router = express.Router();
var validator = require('validator');
var grm_user_model = require('../models/grem_member');
var membership_model = require('../models/membership');
var committee_model = require('../models/committee');
var student_council_model = require('../models/student_council');
var period_model = require('../models/period');
var membership_council_model = require('../models/membership_council');
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
    router.get('/', function(req, res) {
        // Display the Login page with any flash message, if any
        res.render('index', { message: req.flash('message') });
    });
  /* Handle Login POST */
    router.post('/login',function(req, res, next) {
        passport.authenticate('login', function(err,user){
            if (err) { return next(err); }
            if (!user) { return res.redirect('/login'); }
            req.logIn(user, function(err) {
                if (err) { return next(err); }
                if(user.admin){
                    console.log("Login as Adminuser");
                    return res.redirect('/admin')
                }
                else if (!user.admin){
                    console.log("Login as normal user");
                    return res.redirect('/search');
                }

            });
    })(req, res, next)
    });

  /* GET Registration Page */
  router.get('/signup', function(req, res){
    res.render('register',{message: req.flash('message')});
  });

  /* Handle Registration POST */
    router.post('/signup',function(req, res, next) {
        passport.authenticate('signup', function(err,user){
            if (err) { return next(err); }
            if (!user) { return res.redirect('/signup'); }
            req.logIn(user, function(err) {
                if (err) { return next(err); }
                if(user.admin){
                    console.log("Login as Adminuser");
                    return res.redirect('/admin')
                }
                else if (!user.admin){
                    console.log("Login as normal user");
                    return res.redirect('/search');
                }

            });
        })(req, res, next)
    });


    /* Handle grem_user Create Post */
  router.post('/create_grem_user',isAuthenticated, function(req, res, next){
      if(!req.user.admin) {res.redirect('/');}
      else {
          console.log('got from form: ');
          console.log(req.body);
          var user = new grm_user_model({
              firstname: req.body.firstname,
              lastname: req.body.lastname,
              nkz: req.body.nkz,
              matr_nr: req.body.matr_nr
          });
          console.log('\nsave user: ');
          console.log(user);
          for (var grem in req.body.comm) {
              //console.log("ID beim Post: "+user._id);

              var membership = new membership_model({
                  grem_id: req.body.comm[grem].committee,
                  from: req.body.comm[grem].from,
                  to: req.body.comm[grem].to,
                  reason: req.body.comm[grem].reason,
                  user_id: user._id,
                  council_id: req.body.comm[grem].council_id,
                  period_id: req.body.comm[grem].period_id,
                  successor: req.body.comm[grem].successor || false

              });
              membership.save(function (err, user) {
                  if (err) {
                      res.status(err.status || 500);
                      res.render('error', {
                          message: err.message,
                          error: err
                      })
                  }
              });


              console.log('\nsave membership: ');
              console.log(membership);
          }
          for (var council in req.body.councils) {
              //console.log("ID beim Post: "+user._id);

              var council_membership = new membership_council_model({
                  from: req.body.councils[council].from,
                  to: req.body.councils[council].to,
                  user_id: user._id,
                  council_id: req.body.councils[council].council_id
              });
              council_membership.save(function (err) {
                  if (err) {
                      res.status(err.status || 500);
                      res.render('error', {
                          message: err.message,
                          error: err
                      })
                  }
              });


              console.log('\nsave Council_membership: ');
              console.log(council);
          }
          user.save(function (err, user) {
              if (err) {
                  res.status(err.status || 500);
                  res.render('error', {
                      message: err.message,
                      error: err
                  });
              }
              else res.render('success', {msg: 'Nuter erfolgreich angelegt'});


          })
      }
  });
    /*Get Member Edit*/
    router.get('/edit_grm_user/:user_id',isAuthenticated, function(req, res){
        if(!req.user.admin) {res.redirect('/');}
        else {
            var user_id = req.params.user_id;
            console.log("User_id: " + user_id);
            var member;
            var council_membership;
            grm_user_model.findOne({_id: user_id}, function (err, user) {
                if (!user) res.status(404).send("Nutzer nicht gefunden");
                else if (err) res.status(500).send(err.message);
                else {

                    member = user;
                }
            });
            membership_council_model.find({user_id: user_id}, function (err, data) {
                if (err) {
                    res.status(err.status || 500);
                    res.render('error', {
                        message: err.message,
                        error: err
                    });
                }
                else if (!data) res.status(404).send('Council_Membership not found');
                else {
                    council_membership = data;
                }
            });
            membership_model.find({user_id: user_id}, isAuthenticated, function (err, memberships) {
                if (!memberships) res.status(404).send("Keine Gremnienmitgliedschaft");
                else if (err) res.status(500).send(err.message);
                else {
                    JSON.stringify(memberships);
                    console.log("Membership from DB " + JSON.stringify(memberships));
                    JSON.stringify(member);
                    committee_model.find().lean().exec(function (err, committees) {
                        if (err) {
                            res.status(err.status || 500);
                            res.render('error', {
                                message: err.message,
                                error: err
                            });
                        }
                        else if (!committees) res.status(404).send('Committee not found');
                        else {
                            JSON.stringify(committees);

                            student_council_model.find().lean().exec(function (err, student_council) {
                                if (err) {
                                    res.status(err.status || 500);
                                    res.render('error', {
                                        message: err.message,
                                        error: err
                                    });
                                }
                                else if (!student_council) res.status(404).send('Student council not found');
                                else {
                                    period_model.find().lean().exec(function (err, periods) {
                                        if (err) {
                                            res.status(err.status || 500);
                                            res.render('error', {
                                                message: err.message,
                                                error: err
                                            });
                                        }
                                        else if (!periods) res.status(404).send('Period not found');
                                        else {

                                            res.render('edit_grm_user', {
                                                moment: moment,
                                                user: member,
                                                memberships: memberships,
                                                student_council: student_council,
                                                committees: committees,
                                                councils: council_membership,
                                                periods: periods
                                            });

                                        }
                                    });
                                }
                            });
                        }
                    });
                }
            });
        }
    });

    router.get('/create_committee',isAuthenticated, function(req, res){
        res.render('create_committee');
    });

    router.post('/create_committee',isAuthenticated, function(req, res){
        if(!req.user.admin) {res.redirect('/');}
        else {
            var comm = req.body;
            //console.log("From Create_Committee: "+JSON.stringify(comm));
            var committee = new committee_model({
                _name: comm._name,
                description: comm.description
            });
            committee.save(function (err) {
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

    router.post('/edit_committee/:_id', function(req, res) {
        if(!req.user.admin) {res.redirect('/');}
        else {
            var committee = req.body;
            var comm_id = req.params._id;
            console.log("From Create_Committee: " + comm_id);
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
                        res.render('success', {msg: 'Gremium erfolgreich editiert'});
                    })
                }
            });
        }
    });

    router.get('/create_student_council',isAuthenticated, function(req, res){
        if(!req.user.admin) {res.redirect('/');}
        else {
            res.render('create_student_council');
        }
    });




    router.post('/create_student_council',isAuthenticated, function(req, res){
        if(!req.user.admin) {res.redirect('/');}
        else {
            var council = req.body;
            console.log("Create Student Council: " + JSON.stringify(council));
            var cou = new student_council_model({
                _name: council._name
            });
            cou.save(function (err) {
                if (err) {
                    res.status(err.status || 500);
                    res.render('error', {
                        message: err.message,
                        error: err
                    });
                }
                res.render('success', {msg: 'Fachschaft erfolgreich angelegt'});
            })
        }
    });


    router.post('/edit_student_council/:_id',isAuthenticated, function(req, res) {
        if(!req.user.admin) {res.redirect('/');}
        else {
            var council = req.body;
            var council_id = req.params._id;
            console.log("From Edit Council: " + council_id);
            student_council_model.findById(council_id, function (err, cou) {
                if (err) {
                    res.status(err.status || 500);
                    res.render('error', {
                        message: err.message,
                        error: err
                    });
                }
                else if (!cou) res.status(404).send("Fachschaft nicht gefunden");
                else {

                    cou._name = council._name || cou._name;
                    cou.save(function (err, council) {
                        if (err) {
                            res.status(err.status || 500);
                            res.render('error', {
                                message: err.message,
                                error: err
                            });
                        }
                        res.render('success', {msg: 'Fachschaft erfolgreich editiert'});
                    })
                }
            });
        }
    });

    router.get('/create_period',isAuthenticated, function(req, res){
        if(!req.user.admin) {res.redirect('/');}
        else {
            res.render('create_period');
        }
    });

    router.post('/create_period',isAuthenticated, function(req, res){
        if(!req.user.admin) {res.redirect('/');}
        else {
            var period = req.body;
            console.log("Create period: " + JSON.stringify(period));
            var per = new period_model({
                from: period.from,
                to: period.to
            });
            per.save(function (err) {
                if (err) {
                    res.status(err.status || 500);
                    res.render('error', {
                        message: err.message,
                        error: err
                    });
                }
                res.render('success', {msg: 'Amtsperiode erfolgreich angelegt'});
            })
        }
    });

    router.post('/edit_period/:_id',isAuthenticated, function(req, res) {
        if(!req.user.admin) {res.redirect('/');}
        else {
            var period = req.body;
            var period_id = req.params._id;
            console.log("From Edit Period: " + period_id);
            period_model.findById(period_id, function (err, per) {
                if (err) {
                    res.status(err.status || 500);
                    res.render('error', {
                        message: err.message,
                        error: err
                    });
                }
                else if (!per) res.status(404).send("Amtszeit nicht gefunden");
                else {

                    per.from = period.from || per.from;
                    per.to = period.to || per.to;
                    per.save(function (err, per_new) {
                        if (err) {
                            res.status(err.status || 500);
                            res.render('error', {
                                message: err.message,
                                error: err
                            });
                        }
                        res.render('success', {msg: 'Amtsperiode erfolgreich editiert'});
                    })
                }
            });
        }
    });


    router.post('/edit_grm_user/:_id',isAuthenticated,function(req,res,next) {
        if(!req.user.admin) {res.redirect('/');}
        else {
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
                    console.log("speicher gešnderte Userdaten");
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

                    for (var cou in user.councils) {
                        cou_id = user.councils[cou]._id;
                        console.log("Bearbeite Fachschaft: " + JSON.stringify(cou_id));
                        membership_council_model.findOne({_id: cou_id}, function (err, council) {
                            if (err) {
                                res.status(err.status || 500);
                                res.render('error', {
                                    message: err.message,
                                    error: err
                                });
                            }
                            else if (!council) {
                                res.status(404);
                                res.send('Council Membership not found');
                            }
                            else {

                                council.council_id = user.councils[cou].council_id || council.council_id;
                                council.from = user.councils[cou].from || council.from;
                                council.to = user.councils[cou].to || council.to;
                                council.user_id = user.councils[cou].user_id || council.user_id;
                                console.log("Save council Membership: " + council);
                                council.save(function (err) {
                                    if (err) {
                                        res.status(500);
                                        res.render('error', {
                                            message: err.message,
                                            error: err
                                        });
                                    }

                                });


                                for (var membership in user.comm) {
                                    var membership_id = user.comm[membership].membership_id;
                                    console.log("gefundene membership_id" + membership_id);
                                    if (validator.isNull(membership_id)) {
                                        var membershipsave = new membership_model({
                                            grem_id: req.body.comm[membership].committee,
                                            from: req.body.comm[membership].from,
                                            to: req.body.comm[membership].to,
                                            reason: req.body.comm[membership].reason,
                                            user_id: user._id,
                                            council_id: req.body.comm[membership].council_id,
                                            successor: req.body.comm[membership].successor || false

                                        });
                                        console.log("Try to Save Membership from Edit: ");
                                        console.log(membershipsave);
                                        membershipsave.save(function (err, user) {
                                            if (err) {
                                                res.status(err.status || 500);
                                                res.render('error', {
                                                    message: err.message,
                                                    error: err
                                                })
                                            }
                                        });
                                    }
                                    else
                                        membership_model.findOne({_id: membership_id}, function (err, comm) {
                                            if (err) {
                                                res.status(err.status || 500);
                                                res.render('error', {
                                                    message: err.message,
                                                    error: err
                                                });
                                            }
                                            else if (!comm) {
                                                res.send('Committee not found');
                                            }
                                            else {

                                                period_model.find().lean().exec(function (err, periods) {

                                                    if (err) {
                                                        res.status(err.status || 500);
                                                        res.render('error', {
                                                            message: err.message,
                                                            error: err
                                                        });
                                                    }
                                                    else if (!periods) {
                                                        res.status(404);
                                                        res.send('period not found');
                                                    }
                                                    else {
                                                        var succ = user.comm[membership].successor;
                                                        if (!succ) succ = false;
                                                        comm.grem_id = user.comm[membership].committee || comm.grem_id;
                                                        comm.from = user.comm[membership].from || comm.from;
                                                        comm.to = user.comm[membership].to || comm.to;
                                                        comm.reason = user.comm[membership].reason;
                                                        comm.successor = succ;

                                                        console.log('Save Membership: ' + comm);
                                                        comm.save(function (err) {
                                                            if (err) {

                                                                res.render('error', {
                                                                    message: err.message,
                                                                    error: err
                                                                });
                                                            }

                                                        });
                                                        res.render('success', {msg: "Nutzer erfolgreich ge&auml;ndert "});
                                                    }


                                                });

                                            }

                                        });

                                }
                            }
                        })


                    }
                }

            });
        }
    });

  /* GET Home Page */
  router.get('/admin',isAuthenticated, function(req, res){
        if(!req.user.admin) {res.redirect('/');}
      else{
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

                              student_council_model.find().lean().exec(function (err, student_council) {
                                  if (err) {
                                      res.status(err.status || 500);
                                      res.render('error', {
                                          message: err.message,
                                          error: err
                                      });
                                  }
                                  else if (!student_council) res.status(404).send('Fehler beim DB Zugriff');
                                  else {

                                      period_model.find().lean().exec(function (err, periods) {
                                          if (err) {
                                              res.status(err.status || 500);
                                              res.render('error', {
                                                  message: err.message,
                                                  error: err
                                              });
                                          }
                                          else if (!periods) res.status(404).send('Fehler beim DB Zugriff');
                                          else {


                      res.render('admin', {
                          grm_members: grm_user_models,
                          user: req.user,
                          title: 'testuser',
                          committees: committees,
                          student_council: student_council,
                          periods: periods,
                          moment: moment

                      });

                  } });
                                  }
                              });
                          }
              });
          }
      });
          }
      });}
          });

  /* Handle Logout */
  router.get('/signout', function(req, res) {
    req.logout();
    res.redirect('/');
  });
    router.get('/search',isAuthenticated, function(req, res) {
        period_model.find().lean().exec(function (err, periods) {

            if (err) {
                res.status(err.status || 500);
                res.render('error', {
                    message: err.message,
                    error: err
                });
            }
            else if (!periods) {
                res.status(404);
                res.send('Period not found');
            }
            else {

                committee_model.find().lean().exec(function (err, committees) {
                    if (err) {
                        res.status(err.status || 500);
                        res.render('error', {
                            message: err.message,
                            error: err
                        });
                    }
                    else if (!committees) {
                        res.status(404);
                        res.send('Committee not found');
                    }
                    else {
                        student_council_model.find().lean().exec(function (err, councils) {
                            if (err) {
                                res.status(err.status || 500);
                                res.render('error', {
                                    message: err.message,
                                    error: err
                                });
                            }
                            else if (!councils) {
                                res.status(404);
                                res.send('Council not found');
                            }
                            else {

                        res.render('search', {periods: periods, moment: moment, committees: committees, councils: councils});
                    }

                    });
            }

        });
            }
            });
        });

    router.post('/search',isAuthenticated, function(req, res) {
        console.log("Search Result: ");console.log(req.body);
        var query = {};

        if(!validator.isNull(req.body.committee)) query.grem_id = req.body.committee;
        if(!validator.isNull(req.body.council)) query.council_id = req.body.council;
        if(!validator.isNull(req.body.period)) query.period_id = req.body.period;

        console.log("created Membership Searchquery: ");console.log(query);

        membership_model.find(query,function(err,mem) {
            if (err) {
                res.status(err.status || 500);
                res.render('error', {
                    message: err.message,
                    error: err
                });
            }
            else if (!mem) {
                res.status(404);
                res.send('User not found');
            }
            else {
                console.log('gefundene Memberships: ');console.log(mem);




            }
        });


    });
  return router;
};