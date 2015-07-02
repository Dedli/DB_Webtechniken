/**
 * Created by daniel on 02.07.2015.
 */
var membership_model = require('../models/membership');

var getNumberOfWaiters = function(){
   var res=0;
    membership_model.find({grem_id: "559286088a662a6c11691caf"},function (err, memberships) {
        if (err) {
            return -2;
        }
        else if (!memberships) return -1;
        else{

            for(var membership in memberships){
                console.log("MEMBERSHIP IST: "+JSON.stringify(memberships[membership]));
                if(memberships[membership].successor) res+=1;
            }
            console.log("return von "+res);
            return res;
        }
    });
};

var test = function(){return 2000;};
module.exports.getNumberOfWaiters = getNumberOfWaiters;
var MakeMemberActive = function(committee){
    membership_model.find({grem_id: committee},function (err, memberships) {
        if(err) {console.log("Eroor beim finden");return -3; }
        if (!memberships) {console.log("Eroor beim finden"); return -1;}
        else{
            var res = 0;
            var nextMember = new membership_model;
            for(var membership in memberships){
                if (memberships[membership].waitingPlace > 0 && memberships[membership].waitingPlace > res) nextMember = memberships[membership];
            }
            console.log("gefundener Member: "+JSON.stringify(nextMember));
            res = nextMember.waitingPlace;
            nextMember.successor = false;
            nextMember.waitingPlace = 0;
            nextMember.save(function(err){
                console.log("Eroor beim finden");
                return -2;
            });
            for(var member in memberships) {
                if (memberships[member].waitingPlace > res) {
                    memberships[member].waitingPlace--;
                    memberships[member].save(function (err) {
                        console.log("Eroor beim finden");
                        if (err) return -1;
                    })
                }

            }

        }
    });
};

module.exports.MakeMemberActive = MakeMemberActive;