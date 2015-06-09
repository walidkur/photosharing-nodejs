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
var server = require('../config/server');
var parseString = require('xml2js').parseString;

/* GET home page. */
router.get('/', function(req, res, next) {
  res.redirect('/');
});

//getfeed for home page content
router.get('/feed', function(req, res, next){
  if(!req.user)
    res.redirect('/');

  //config.server.domain is the domain name of the server (without the https or the directoy i.e example.com)

  var url = 'https://' + server.domain + '/files/oauth/anonymous/api/documents/feed';

  //if query parameters exist, append them onto the url
  if(!isEmpty(req.query.q)){
    url = url + '?q=' + req.query.q;
  }

  var headers = {};

  // we must attach the key we got through passportto the header as
  // Authorization: Bearer + key. Passport gives us access to the user profile
  // we saved through the request user object
  headers['Authorization'] = req.user.accessToken;


  var options = {
    url: url,
    headers: headers
  };

  request.get(options, function(error, response, body){
    if(error){
      res.send(error);
    } else {
      parseString(body, function(err, result){
        console.log(result);
      });
    }
  });
});

//get photo for retrieving a photo by id
router.get('/photo', function(req, res, next){
  if(!req.user)
    res.redirect('/');

  //if no id was passed, return an error code
  if(isEmpty(req.query.id)){
    res.status(412).end();
  } else {
      var url = 'https://' + server.domain + '/files/oauth/api/myuserlibrary/document/' + req.query.id + '/media';

      // we must attach the key we got through passportto the header as
      // Authorization: Bearer + key. Passport gives us access to the user profile
      // we saved through the request user object
      var headers = {'Authorization': 'Bearer ' + req.user.accessToken};

      var options = {
        url: url,
        headers: headers
      };

      request.get(options, function(error, response, body){
        if(error){
          res.send(error);
        } else {

        }
      });
  }

});

router.get('/like', function(req, res, next){
  if(!req.user)
    res.redirect('/');

  //if no id was passed
  if(isEmpty(req.query.id)){
    res.status(412).end();
  } else {
    var url = 'https://' + server.domain + 'files/ouath/api/myuserlibrary/document/' + req.query.id + '/entry';

    var headers = {'Authorization': 'Bearer ' + req.user.accessToken};

    var options = {
      url: url,
      headers: headers
    };

    request.get(options, function(error, response, body){
      if(error){
        res.send(error);
      } else {
        res.send(body);
      }
    });
  }
});

router.post('/like', function(req, res, next){
  if(!req.user)
    res.redirect('/');

  if(isEmpty(req.query.id)){
    req.status(412).end();
  } else {

  }
})

router.get('/commments', function(req, res, next){
  if(!req.user)
    res.redirect('/');

  //if no id was passed
  if(isEmpty(req.query.id)){
    res.status(412).end();
  } else if(isEmpty(req.query.userid)){
    res.status(412).end();
  } else {
    var url = 'https://' + server.domain + 'files/oauth/api/userlibrary/' + req.query.userid + '/document/' + req.query.id + '/feed';

    var headers: {'Authorization': 'Bearer ' + req.user.accessToken};

    var options = {
      url: url,
      headers: headers
    };

    request.get(options, function(error, response, body){
      if(error){
        res.send(error);
      } else {
        res.send(body);
      }
    });
  }
});

router.post('/upload', function(req, res, next){

  var url = 'https://' + server.domain + '/files/oauth/api/nonce';

  var headers = {'Authorization': 'Bearer ' + req.user.accessToken};

  var options = {
    url: url,
    headers: headers
  };

  request.get(options, function(error, response, body){
    if(error){
      res.send(error);
    } else {
      var nonce = body;
      var busboy = new Busyboy({headers: req.headers});

      busboy.on('file', function(fieldname, file, filename, encoding, mimetype){
        var url = 'https://' + server.domain + '/files/oauth/api/myuserlibrary/feed';
        var headers = {
          'Authorization': 'Bearer ' + req.user.accessToken,
          'Slug': filename,
          'X-Update-Nonce': nonce
        };

        var options = {
          url: url,
          headers: headers
        };

        file.pipe(request.post(options, function(error, response, body){
          if(error){
            res.send(error);
          }
        }));

      });

      busboy.on('finish', function(){
        res.status(200).end();
      });
    }
  });
});

var hasOwnProperty = Object.prototype.hasOwnProperty;

function isEmpty(obj) {

    // null and undefined are "empty"
    if (obj == null) return true;

    // Assume if it has a length property with a non-zero value
    // that that property is correct.
    if (obj.length > 0)    return false;
    if (obj.length === 0)  return true;

    // Otherwise, does it have any properties of its own?
    // Note that this doesn't handle
    // toString and valueOf enumeration bugs in IE < 9
    for (var key in obj) {
        if (hasOwnProperty.call(obj, key)) return false;
    }

    return true;
}

module.exports = router;
