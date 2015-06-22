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

var express = require('express');

var router = express.Router();
var passport = require('passport');


/* GET home page. */
router.get('/', function(req, res, next) {

  // store a cookie on the client so they can obtain their user information
  if(req.user){
    var cookie = {
      'displayName' : req.user.displayName,
      'uid' : req.user.userid
    };
    res.cookie('user', JSON.stringify(cookie));

    // render the index to the page
    res.render('index');
  } else
    next();

// if the user was not found in the request, authenticate the user using oauth2
}, passport.authenticate('ibm-connections-cloud'));


// logout route
router.get('/logout', function(req, res, next){
  req.logout();
  res.redirect('/');
})

router.get('/callback', passport.authenticate('ibm-connections-cloud', {successReturnToOrRedirect:'/', failureRedirect: '/'}));

//for testing only
//router.post('/login', passport.authenticate('local', {successReturnToOrRedirect:'/', failureRedirect: '/login'}));

module.exports = router;
