
// Einbinden der Module
var express = require('express');
var router = express.Router();
var validator = require('validator');
var moment = require('moment');

// Einbinden der Models für MongoDB Zugriff
var grm_user_model = require('../models/grem_member');
var membership_model = require('../models/membership');
var committee_model = require('../models/committee');
var student_council_model = require('../models/student_council');
var period_model = require('../models/period');
var membership_council_model = require('../models/membership_council');

//Sicherstellen, dass der Zugriff nur getätigt wird, wenn der Nutzer angemeldet ist
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
    //index.jade rendern
    router.get('/', function(req, res) {
        // Display the Login page with any flash message, if any
        res.render('index', { message: req.flash('message') });
    });


  /* Login Post handeln */
    router.post('/login',function(req, res, next) {
        passport.authenticate('login', function(err,user){
            //falls Fehler -> Fehler weiterreichen
            if (err) { return next(err); }
            // falls Login nicht möglich Weiterleitung zur Login Seite
            if (!user) { return res.redirect('/login'); }
            req.logIn(user, function(err) {
                if (err) { return next(err); }
                //Unterscheidung, ob Admin oder nicht
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
                //Nach erfolgreicher Registrierung -> weiterleitung: falls Admin zur admin Seite, andernfalls zum Suchinterface
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

    /*Get Member Edit*/
    router.get('/edit_grm_user/:user_id',isAuthenticated, function(req,res){
        if(!req.user.admin) {res.redirect('/');res.flush('Keine Berechtigung');}
        else {
            //Wenn Zugriff autorisiert speichern der User_id aus der URL in user_id
            var user_id = req.params.user_id;
            //console.log("User_id: " + user_id);
            var member;
            var council_membership;
            //User aus Datenbank abfragen
            grm_user_model.findOne({_id: user_id}, function (err, user) {
                //Error Handling
                if (!user) res.status(404).send("Nutzer nicht gefunden");
                else if (err) res.status(500).send(err.message);
                else {

                    member = user;
                }
            });
            // Mitgliedschaft in Fachschaften für den zuvor gefunden Nutzer aus der DB anfordern
            membership_council_model.find({user_id: user_id}, function (err, data) {
                //Error Handling
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
            // Mitgliedschaft in Gremiuen für den zuvor gefundenen Nutzer aus der DB anfordern
            membership_model.find({user_id: user_id}, function (err, memberships) {
                if (!memberships) res.status(404).send("Keine Gremnienmitgliedschaft");
                else if (err) res.status(500).send(err.message);
                else {
                    //Konsolenausgabe der gefundenen Ergebnisse
                    JSON.stringify(memberships);
                    console.log("Membership from DB " + JSON.stringify(memberships));
                    JSON.stringify(member);
                    //Alle Gremien aus der DB anfordern
                    committee_model.find().lean().exec(function (err, committees) {
                        //Error Handling
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
                            //Alle Fachschaften aus DB anfordern
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
                                    // Alle Amtszeiten aus DB anfordern
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
                                            //rendern der edit_grm_user.jade mit allen Amtzeiten, allen Fachschaften, allen Gremien, einem User und dessen Mitgliedschaften in  Fachschaften und Gremien
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
    //Handle POST user edit
    router.post('/edit_grm_user/:_id',isAuthenticated,function(req,res) {
        if(!req.user.admin) {res.redirect('/');}
        else {
            console.log('got from form edit_user: ');
            console.log(req.body);
            var user_id = req.params._id;
            var user = req.body;
            //Finden des Users, anhand der ID aus der URL
            grm_user_model.findById(user_id, function (err, usr) {
                if (err) {
                    console.error(err.message);
                    res.status(err.status || 500);
                    res.render('error', {
                        message: err.message,
                        error: err
                    });
                }
                else if (!usr) {
                    console.error("User not found");
                    res.status(404).send("Nutzer nicht gefunden");
                }
                else {
                    console.log("speicher geänderte Userdaten");
                    console.log(user);
                    //falls Daten geändert wurden, werden diese in usr geändert
                    usr.firstname = user.firstname || usr.firstname;
                    usr.lastname = user.lastname || usr.lastname;
                    usr.nkz = user.nkz || usr.nkz;
                    usr.matr_nr = user.matr_nr || usr.matr_nr;
                    //schreiben der Änderungen in die DB
                    usr.save(function (err) {
                        if (err) {
                            console.error(err.message);
                            res.status(err.status || 500);
                            res.render('error', {
                                message: err.message,
                                error: err
                            });
                        }
                    });
                    // Jede Fachschaftsmitgliedschaft des users bearbeiten
                    for (var cou in user.councils) {
                        cou_id = user.councils[cou]._id;
                        if(validator.isNull(cou_id)){
                            res.status(400).send("Wrong student council")
                            break;
                        }
                        console.log("Bearbeite Fachschaft: " + JSON.stringify(cou_id));
                        // finden der mitgliedschaft councils[cou]
                        membership_council_model.findOne({_id: cou_id}, function (err, council) {
                            if (err) {
                                console.error(err.message);
                                res.status(err.status || 500);
                                res.render('error', {
                                    message: err.message,
                                    error: err
                                });
                            }
                            else if (!council) {
                                console.error("Council Membership not found");
                                res.status(404);
                                res.send('Council Membership not found');
                            }
                            else {

                                if(validator.isAfter(user.councils[cou].from,user.councils[cou].to)){
                                    res.status(400).send("no valid student council Timeframe");
                                }

                                //schreiben der neuen wert in die gefundene Fachschaftsmitgliedschaft
                                council.council_id = user.councils[cou].council_id || council.council_id;
                                council.from = user.councils[cou].from || council.from;
                                council.to = user.councils[cou].to || council.to;
                                council.user_id = user.councils[cou].user_id || council.user_id;
                                console.log("Save council Membership: " + council);
                                //speichern der geänderten Fachschaftsmitgliedschaft
                                council.save(function (err) {
                                    if (err) {
                                        console.error(err.message);
                                        res.status(500);
                                        res.render('error', {
                                            message: err.message,
                                            error: err
                                        });
                                    }

                                });
                            }
                        });
                    }
                                //Alle Gremienmitgliedschaften des Users bearbeiten
                                for (var membership in user.comm) {
                                    var membership_id = user.comm[membership].membership_id;
                                    if(validator.isNull(membership_id)) {res.status(400).send("Wrong Membership");
                                        break;}
                                    //Abrufen der aktuellen Gremienmitgliedschaft aus DB, anhand der ID
                                        membership_model.findOne({_id: membership_id}, function (err, comm) {
                                            if (err) {
                                                console.error(err.message);
                                                res.status(err.status || 500);
                                                res.render('error', {
                                                    message: err.message,
                                                    error: err
                                                });
                                            }
                                            else if (!comm) {
                                                console.error("Committee Membership not found");
                                                res.send('Committee not found');
                                            }
                                            else {

                                                        var succ = user.comm[membership].successor;
                                                        if (!succ) succ = false;

                                                        if(validator.isAfter(user.comm[membership].from,user.comm[membership].to)){
                                                            res.status(400).send("no valid committee timeframe");
                                                        }

                                                        //Gremiummitgliedschaft durch geänderte Werte ergänzen
                                                        comm.grem_id = user.comm[membership].committee || comm.grem_id;
                                                        comm.from = user.comm[membership].from || comm.from;
                                                        comm.to = user.comm[membership].to || comm.to;
                                                        comm.reason = user.comm[membership].reason || comm.reason;
                                                        comm.successor = succ;
                                                        comm.council_id = user.comm[membership].council_id || comm.council_id;
                                                        comm.period_id = user.comm[membership].period_id || comm.period_id;

                                                        console.log('Save Membership: ' + comm);
                                                        //Abspeichern der Gremienmitgliedschaft
                                                        comm.save(function (err) {
                                                            if (err) {
                                                                console.error(err.message);
                                                                res.render('error', {
                                                                    message: err.message,
                                                                    error: err
                                                                });
                                                            }

                                                        });

                                            }

                                        });

                                }
                                //Rendern der Erfolgsmeldung erst nachdem alle Gremienmitglieschaften und Fachschaftsmitgliedschaften abgearbeitet wurden
                                res.render('success', {msg: "Nutzer erfolgreich ge\u00e4ndert "});
                            }
                        })


                    }
    });
    //Handle Membership_add GET Request
    router.get('/add_membership/:user_id',isAuthenticated, function(req,res){
        var user_id = req.params.user_id;
        //Abrufen aller Gremienmitgliedschaften
        committee_model.find({},function(err,committees){
            if (err) {
            res.status(err.status || 500);
            res.render('error', {
                message: err.message,
                error: err
            });
        }
        else if (!committees) res.status(404).send('Committee not found');
        else{
                //Abrufen aller Amtszeiten
                period_model.find({},function(err,per){
                    if (err) {
                        res.status(err.status || 500);
                        res.render('error', {
                            message: err.message,
                            error: err
                        });
                    }
                    else if (!per) res.status(404).send('Committee not found');
                    else{
                        //Abrufen aller Fachschaften
                       student_council_model.find({},function(err,cou){
                            if (err) {
                                res.status(err.status || 500);
                                res.render('error', {
                                    message: err.message,
                                    error: err
                                });
                            }
                            else if (!cou) res.status(404).send('Committee not found');
                            else{
                                //Rendern der add_membership.jade mit allen Gremien, Amtszeiten, Fachschaften und der User_id, zusätzlich noch das Modul moment zur Datumskonvertierung
                                res.render('add_membership',{committees: committees,periods: per,councils:cou,user_id: user_id,moment: moment})
                    }
                })
            }
        })
        }
        })
    });
    //Handle des Posts zum Hinzufügen einer Gremienmitgliedschaft
    router.post('/add_membership/:user_id',isAuthenticated, function(req,res){
        if(!req.user.admin) {res.redirect('/');}
        else {
            var body = req.body;
            var user_id = req.params.user_id;
            //Anlegen eines neuen Gremienmitgliedschaft und erstellen der Attribute aus dem Request
            var membershipsave = new membership_model({
                grem_id: body.committee,
                from: body.from,
                to: body.to,
                reason: body.reason,
                period_id: body.period_id,
                user_id: user_id,
                council_id: body.council_id,
                successor: body.successor || false
            });
            //Abspeichern der angelegten Gremienmitgliedschaft
            membershipsave.save(function (err) {
                if (err) {
                    res.status(err.status || 500);
                    res.render('error', {
                        message: err.message,
                        error: err
                    })
                }
                else
                //Form-Post-Redirect zur /admin Page mit vorheriger Erfolgsmeldung
                res.render('success', {msg: "Mitgliedschaft erfolgreich hinzugef\u00fcgt"});
            });
        }
    });

    //Handle GET Request für Faschaftsmitgliedschaft
    router.get('/add_membership_council/:user_id',isAuthenticated, function(req,res){
        //Abspeichern der user_id aus der URL
        var user_id = req.params.user_id;
                    // Finden aller Fachschaften
                        student_council_model.find({},function(err,cou){
                            if (err) {
                                res.status(err.status || 500);
                                res.render('error', {
                                    message: err.message,
                                    error: err
                                });
                            }
                            else if (!cou) res.status(404).send('Committee not found');
                            else{
                                //Rendern der add_membership_council.jade mit allen Fachschaften der user_id und dem Modul moment für die Datumskonvertierung
                                res.render('add_membership_council',{councils:cou,user_id: user_id,moment: moment})
                            }
                        })
    });
//Handle des POSTs zum Hinzufügen einer Fachschaftsmitgliedschaft für einen User
    router.post('/add_membership_council/:user_id',isAuthenticated, function(req,res){
        if(!req.user.admin) {res.redirect('/');}
        else {
            var body = req.body;
            var user_id = req.params.user_id;
            //neue Fachschaftsmitgliedschaft anlegen und das Model entsprechend der Definition mit den Angaben aus dem Request versehen
            var membershipsave = new membership_council_model({
                council_id: body.council_id,
                from: body.from,
                to: body.to,
                user_id: user_id
            });
            //Abspeichern des zuvor angelegten Fachschaftsmitgliedschaft
            membershipsave.save(function (err) {
                if (err) {
                    res.status(err.status || 500);
                    res.render('error', {
                        message: err.message,
                        error: err
                    })
                }
                else
                //Form-Post-Redirect bei erfolgreichem Hinzufügen der Fachschaftsmitgliedschaft mit vorheriger Ausgabe einer Erfolgsmeldung
                    res.render('success', {msg: "Mitgliedschaft erfolgreich hinzugef\u00fcgt"});
            });
        }
    });

    /* Handle User Create Post */
  router.post('/create_grem_user',isAuthenticated, function(req, res){
      if(!req.user.admin) {res.redirect('/');}
      else {
          console.log('got from form: ');
          console.log(req.body);
          //Anlegen eines neuen Nutzers aus dem grm_user_model
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

              if(validator.isAfter(req.body.comm[grem].from,req.body.comm[grem].to))
              {
                  res.status(400).send("Bad committee membership timeframe");
                  break;
              }
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
              membership.save(function (err) {
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
          //Iteration über alle Fachschaftsmitgliedschaften
          for (var council in req.body.councils) {
              //console.log("ID beim Post: "+user._id);
                //Anlegen einer neuen Fachschaftsmitgliedschaft

              if(validator.isAfter(req.body.councils[council].from,req.body.councils[council].to))
              {
                  res.status(400).send("Bad council membership timeframe");
                  break;
              }
              var council_membership = new membership_council_model({
                  from: req.body.councils[council].from,
                  to: req.body.councils[council].to,
                  user_id: user._id,
                  council_id: req.body.councils[council].council_id
              });
              //Abspeichern der Fachschaftsmitgliedschaft
              council_membership.save(function (err) {
                  if (err) {
                      res.status(err.status || 500);
                      res.render('error', {
                          message: err.message,
                          error: err
                      })
                  }
              });

                //Konsolenausgabe
              console.log('\nsave Council_membership: ');
              console.log(council);
          }

          //Abspeichern des angelegeten Users
          user.save(function (err) {
              if (err) {
                  res.status(err.status || 500);
                  res.render('error', {
                      message: err.message,
                      error: err
                  });
              }
              //Form-Post-Redirect zur /admin nach erfolgreichem Anlegen des Users und dessen Mitgliedschaften mit vorheriger Erfolgsmeldung
              else res.render('success', {msg: 'Nuter erfolgreich angelegt'});


          })
      }
  });

//Handle GET auf /create_committee
    router.get('/create_committee',isAuthenticated, function(req, res){
        //Rendern der create_committee.jade nach vorheriger Authentizitätsprüfung
        if(!req.user.admin) {res.redirect('/');}
        else {
            res.render('create_committee');
        }
    });
    //Handle create_committee -> Erstellung eines Gremium
    router.post('/create_committee',isAuthenticated, function(req, res){
        if(!req.user.admin) {res.redirect('/');}
        else {
            var comm = req.body;
            //console.log("From Create_Committee: "+JSON.stringify(comm));
            //Neues Gremium anlegen
            var committee = new committee_model({
                _name: comm._name,
                description: comm.description
            });
            //Abspeichern des angelegten Gremiums
            committee.save(function (err) {
                if (err) {
                    res.status(err.status || 500);
                    res.render('error', {
                        message: err.message,
                        error: err
                    });
                }
                //Form-Post-Redirect nach /admin mit vorheriger Erfolgsmeldung
                res.render('success', {msg: 'Gremium erfolgreich angelegt'});
            })
        }
    });
    // Handle edit_committee POST
    router.post('/edit_committee/:_id',isAuthenticated, function(req, res) {
        if(!req.user.admin) {res.redirect('/');}
        else {
            var committee = req.body;
            var comm_id = req.params._id;
            console.log("From Create_Committee: " + comm_id);
            //Finden des zu editierenden Gremiums
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
                    //Geänderte Werte in das gefundene Gremium schreiben
                    comm._name = committee._name || comm._name;
                    comm.description = committee.description || comm.description;
                    //Abspeichern der Änderungen
                    comm.save(function (err) {
                        if (err) {
                            res.status(err.status || 500);
                            res.render('error', {
                                message: err.message,
                                error: err
                            });
                        }
                        //Form-Post-Redirect zu /admin nach vorheriger Erfolgsmeldung
                        res.render('success', {msg: 'Gremium erfolgreich editiert'});
                    })
                }
            });
        }
    });

    //Handle create_student_council GET Request
    router.get('/create_student_council',isAuthenticated, function(req, res){
        //Autorisierung prüfen
        if(!req.user.admin) {res.redirect('/');}
        else {
            //Rendern der create_student_council.jade
            res.render('create_student_council');
        }
    });

    //Handle Fachschaft erstellen (create_student_council)  POST
    router.post('/create_student_council',isAuthenticated, function(req, res){
        //Autorisierung
        if(!req.user.admin) {res.redirect('/');}
        else {

            var council = req.body;
            console.log("Create Student Council: " + JSON.stringify(council));
            //Anlegen einer neuen Fachschaft
            var cou = new student_council_model({
                _name: council._name
            });
            //Abspeichern der Fachschaft
            cou.save(function (err) {
                if (err) {
                    res.status(err.status || 500);
                    res.render('error', {
                        message: err.message,
                        error: err
                    });
                }
                //Form-Post-Redirect nach erfolgreichem Eintragen in die DB nach /admin mit vorheriger Erfolgsmeldung
                res.render('success', {msg: 'Fachschaft erfolgreich angelegt'});
            })
        }
    });

    //Handle Fachschafts bearbeiten (edit_student_council) Request
    router.post('/edit_student_council/:_id',isAuthenticated, function(req, res) {
        //Autorisierung
        if(!req.user.admin) {res.redirect('/');}
        else {
            var council = req.body;
            var council_id = req.params._id;
            console.log("From Edit Council: " + council_id);
            //Die zu ändernde Fachschaft aus der DB holen
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
                    //Ändern des Namens der Fachschaft
                    cou._name = council._name || cou._name;
                    //Schreiben der Änderungen in die DB
                    cou.save(function (err) {
                        if (err) {
                            res.status(err.status || 500);
                            res.render('error', {
                                message: err.message,
                                error: err
                            });
                        }
                        //Form-Post-Redirect zu /admin nach Erfolgsmeldung
                        res.render('success', {msg: 'Fachschaft erfolgreich editiert'});
                    })
                }
            });
        }
    });
    //Handle GET Request zum Anlegen einer neuen Amtszeit
    router.get('/create_period',isAuthenticated, function(req, res){
        if(!req.user.admin) {res.redirect('/');}
        else {
            //Rendern der create_period.jade
            res.render('create_period');
        }
    });

    //Handle den Postrequest zum anlegen einer Amtszeit
    router.post('/create_period',isAuthenticated, function(req, res){
        //Autorisierung
        if(!req.user.admin) {res.redirect('/');}
        else {
            var period = req.body;
            console.log("Create period: " + JSON.stringify(period));
            //Anlegen einer neuen Periode
            var per = new period_model({
                from: period.from,
                to: period.to
            });
            //Schreiben der neuen Periode in die DB
            per.save(function (err) {
                if (err) {
                    res.status(err.status || 500);
                    res.render('error', {
                        message: err.message,
                        error: err
                    });
                }
                //Form-Post-Redirect zu /admin mit vorheriger Erfolgsmeldung
                res.render('success', {msg: 'Amtsperiode erfolgreich angelegt'});
            })
        }
    });

    //Handle POST Request zum ändern einer Amtszeit
    router.post('/edit_period/:_id',isAuthenticated, function(req, res) {
        //Autorisierung
        if(!req.user.admin) {res.redirect('/');}
        else {
            var period = req.body;
            var period_id = req.params._id;
            console.log("From Edit Period: " + period_id);
            //Finden der zu ändernden Amtszeit aus der DB
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
                    //Ändern der Werte
                    per.from = period.from || per.from;
                    per.to = period.to || per.to;
                    //Speichern der Amtszeit
                    per.save(function (err, per_new) {
                        if (err) {
                            res.status(err.status || 500);
                            res.render('error', {
                                message: err.message,
                                error: err
                            });
                        }
                        //Form-Post-Redirect zu /admin nach vorheriger Erfolgsmeldung
                        res.render('success', {msg: 'Amtsperiode erfolgreich editiert'});
                    })
                }
            });
        }
    });




  /* GET Home Page */
  router.get('/admin',isAuthenticated, function(req, res){
       //Autorisierung
        if(!req.user.admin) {res.redirect('/');}
      else{
            //Finden aller User
              grm_user_model.find().lean().exec(function (err, grm_users) {
                  if (err) {
                      res.status(err.status || 500);
                      res.render('error', {
                          message: err.message,
                          error: err
                      });
                  }
                  else if (!grm_users) res.status(404).send('Keine User in Datenbank');
                  else {
                      //console.log("DATA:");console.log(grm_users);
                      JSON.stringify(grm_users);
                      //finden aller Mitgliedschaften
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
                                //Abrufen aller Fachschaften
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
                                        //Abrufen aller Amtszeiten
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

                    //Rendern von admin.jade mit allen Usern, dem akutellem User, allen Gremien, allen Fachschaften, allen Amtszeiten und dem Modul moment für die Datumskonvertierung
                      res.render('admin', {
                          grm_members: grm_users,
                          user: req.user,
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
      });}
          });

  /* Handle Logout */
  router.get('/signout', function(req, res) {
    req.logout();
    res.redirect('/');
  });

    //Handle GET Request zum Suchinterface (/search)
    router.get('/search',isAuthenticated, function(req, res) {
        //Abrufen aller Amtszeiten
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
                //Abrufen aller Gremien
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
                        //Abrufen aller Fachschaften
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
                        //Rendern des Suchinterfaces mit allen Amtszeiten, Gremien und Fachschaften, sowie dem Modul moment zur Datumskonvertierung
                        res.render('search', {periods: periods, moment: moment, committees: committees, councils: councils});
                    }

                    });
            }

        });
            }
            });
        });

    //Handle des Post Request für die Suchanfrage
    router.post('/search',isAuthenticated, function(req, res) {
        console.log("Search Result: ");console.log(req.body);
        var query = {};

        //Bilden des Suchquerys
        if(!validator.isNull(req.body.committee)) query.grem_id = req.body.committee;
        if(!validator.isNull(req.body.council)) query.council_id = req.body.council;
        if(!validator.isNull(req.body.period)) query.period_id = req.body.period;

        console.log("created Membership Searchquery: ");console.log(query);
        //Finden der Mitgliedschaften mit dem Suchquery
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
                res.send('Membership not found');
            }
            else {
                query = {};
                //Suchquery für die Usersuche erstellen
                if(!validator.isNull(req.body.firstname)) query.firstname = req.body.firstname;
                if(!validator.isNull(req.body.lastname)) query.lastname = req.body.lastname;
                //Finden der User, welche den Suchquery erfüllen
                grm_user_model.find(query,function(err,users){
                    if (err) {
                        res.status(err.status || 500);
                        res.render('error', {
                            message: err.message,
                            error: err
                        });
                    }
                    else if (!users) {
                        res.status(404);
                        res.send('User not found');
                    }
                    else{
                        console.log("Found users");console.log(users);
                        //Finden aller Gremien
                        committee_model.find({},function(err,comm){
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
                                //Finden aller Amtszeiten
                                period_model.find({},function(err,per){
                                    if (err) {
                                        res.status(err.status || 500);
                                        res.render('error', {
                                            message: err.message,
                                            error: err
                                        });
                                    }
                                    else if (!per) {
                                        res.status(404);
                                        res.send('Period not found');
                                    }
                                    else {
                                        //rendern des Suchergebnisses mit die gefundenen Usern und dessen Mitgliedschaften, sowie allen Amtszeiten und Gremien, sowie dem Modul moment zur Datumskonvertierung
                                        res.render('search_result',{memberships: mem, users:users, moment: moment, periods: per, committees: comm})
                                    }

                            });
                            }

                        });


                    }

                });
            }
        });
    });
  return router;
};