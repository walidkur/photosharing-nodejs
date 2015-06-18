var passport = require('passport'),
    LocalStrategy = require('passport-local').Strategy;

module.exports = function(passport){

  passport.use(new LocalStrategy(
        function(username, password, done) {
            if(username != "Bob"){
                return done(null, false, { message : 'Incorrect username'})
            }

            if(password != "123"){
                return done(null, false, { message : 'Incorrect password'})
            }

            var user = {
                userid : 123049,
                displayName : "Bob the Builder"
            }

            return done(null, user)
        }
    ));

  passport.serializeUser(function(user, done){

    done(null, user);

  });

  passport.deserializeUser(function(user, done){

    done(null, user);

  });

}
