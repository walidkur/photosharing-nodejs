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

var fs = require('fs');

// check to see if the server.js starts
try {
  fs.openSync('./config/server.js', 'r', function(err, fd){
      if (err && err.code=='ENOENT') { return console.log('Server.js does not exist') }
  });
} catch (e) {
  console.log('Server.js does not exist')
  process.exit(0);
}

var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var passport = require('passport');
var session = require('express-session');

var index = require('./routes/index');
var api = require('./routes/api');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

//conigure passport
app.use(session({secret: 'ibmsecret'}));
app.use(passport.initialize());
app.use(passport.session());


//used for production
//reference our passport config file
require ('./config/passport.js')(passport);

app.use('/', index);
app.use('/api', api);

//used for testing
/* require('./config/mock-passport.js')(passport);
var fs = require('fs');
var response = {};
response.feed = fs.readFileSync('./test/responses/feed.txt', 'utf8')

var nock = require('nock'),
    config = require('./config/server.js');

var connectionsapi = nock('https://' + config.server.domain)
                      .get('/files/oauth/api/documents/feed?visibility=public&includeTags=true&ps=20')
                      .reply(200, response.feed);
*/

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;
