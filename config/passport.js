var passport = require('passport'),
    IBMStrategy = require('passport-ibm-connections-cloud').Strategy;


module.exports = function(passport){

passport.use(new IBMStrategy(

{
  clientID: 'app_20000393_1432835044252',
  clientSecret: '6058d328da00674bc8e9032f3b0e951e2973bc46ad7f66e9539929f9dda3e0ec168ec40aecf22a3598c7ab29d5c92e59dfe2361f8d82d91fbebbf035c3ea82ba776b7c8108048aa711e66f93e54099c7c34bf2a385b5214af67affa50db092062386d6a9c66dce024258b7c589badddd34da11628cfd3c5ba05c33345e5c2ad',
  callbackURL: 'https://connections-test.mybluemix.net/callback',
  hostname: 'apps.collabservnext.com'
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
