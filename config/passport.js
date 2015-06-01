var passport = require('passport'),
    IBMStrategy = require('passport-ibm-connections-cloud').Strategy;

var variable = require('/bin/credentials/server');


module.exports = function(passport){

passport.use(new IBMStrategy(

{
  clientID: variable.clientID,
  clientSecret: variable.clientSecret,
  callbackURL: variable.callback,
  hostname: variable.hostname
},


function(accessToken, refreshToken, profile, done){

  var user = profile;
  user.accessToken = accessToken;

  return done(null, user);


}

));


passport.serializeUser(function(user, done){

  done(null, user);

});

passport.deserializeUser(function(user, done){

  done(null, user);
  
});


};
