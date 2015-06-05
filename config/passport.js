/* Copyright 2015 IBM Corporation

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.

See the License for the specific language governing permissions and
limitations under the License. */

var passport = require('passport'),
IBMStrategy = require('passport-ibm-connections-cloud').Strategy;

var variable = require('../bin/credentials/server');


module.exports = function(passport){

  passport.use(new IBMStrategy(

    {
      clientID: variable.server.clientID,
      clientSecret: variable.server.clientSecret,
      callbackURL: variable.server.callback,
      hostname: variable.server.hoster
    },


    function(accessToken, refreshToken, profile, done){

      var user = profile;
      user.accessToken = accessToken;

      console.log('Auth Token: ' + accessToken);

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
