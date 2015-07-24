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
var request = require('sync-request');


try {
  fs.openSync('./config/server.js', 'r', function(err, fd){
      if (err && err.code=='ENOENT') { return console.log('Server.js does not exist') }
      resolve();
  });
} catch (e) {

  var vcapApp = JSON.parse(process.env['VCAP_APPLICATION']);
  var vcapServ = JSON.parse(process.env['VCAP_SERVICES'])['Social File Sharing'][0].credentials;
  var url = "https://filesharingservicebroker.mybluemix.net/v2/initApp/" + vcapServ['instanceId'];

  var res = request('PUT', url, {
    json: {callbackurl: 'http://' + vcapApp['application_uris'][0] + '/callback'}
  });

  if(res.statusCode === 409){
    var url = "https://filesharingservicebroker.mybluemix.net/v2/getAppInfo/" + vcapServ['instanceId'];

    var res = request('GET', url);

    var data = JSON.parse(res.getBody('utf8'));

    var text = 'var server = {clientID : "' + data['appId'] + '", clientSecret : "52d786a855dd8c6dc20674f527b086145f993ffa5be37761b05d62624b3b11cfb8d4d09c127c9d06feb5624f1221a7a9dba8788d6e34f5338b6fb115a94d2630d65ddafb94ab0c13139549fdb3d1feeaf0675c67af22b31f3e24e683e353af3ab7a78d6440c40418940c740c8147c2c551c47784bd7ca829ac062535f643aae", domain : "' + data['domain'] + '", callback : "' + data['callbackUrl'] + '"}; exports.server = server';
    fs.writeFileSync("./config/server.js", text);
  } else if(res.statusCode === 200){

    var data = JSON.parse(res.getBody('utf8'));

    var text = 'var server = {clientID : "' + data['appId'] + '", clientSecret : "52d786a855dd8c6dc20674f527b086145f993ffa5be37761b05d62624b3b11cfb8d4d09c127c9d06feb5624f1221a7a9dba8788d6e34f5338b6fb115a94d2630d65ddafb94ab0c13139549fdb3d1feeaf0675c67af22b31f3e24e683e353af3ab7a78d6440c40418940c740c8147c2c551c47784bd7ca829ac062535f643aae", domain : "' + data['domain'] + '", callback : "' + data['callbackUrl'] + '"}; exports.server = server';
    fs.writeFileSync("./config/server.js", text);
  }

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
