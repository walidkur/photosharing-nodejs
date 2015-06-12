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
var config = require('../config/server');
var parseString = require('xml2js').parseString;
var request = require('request');
var Busboy = require('busboy');
var fs = require('fs');


/* GET home page. */
router.get('/', function(req, res, next) {
  res.redirect('/');
});

//getfeed for home page content
router.get('/feed', function(req, res, next){
  if(!req.user)
    res.status(403).end();

  //config.server.domain is the domain name of the server (without the https or the directoy i.e example.com)

  var url = 'https://' + config.server.domain + '/files/oauth/api/documents/feed?visibility=public&includeTags=true';

  //if query parameters exist, append them onto the url
  if(!isEmpty(req.query.q)){
    url = url + '?tag=' + req.query.q;
  }

  var headers = {};

  // we must attach the key we got through passportto the header as
  // Authorization: Bearer + key. Passport gives us access to the user profile
  // we saved through the request user object
  headers['Authorization'] = 'Bearer ' + req.user.accessToken;


  var options = {
    url: url,
    headers: headers
  };

  request.get(options, function(error, response, body){

    // if there is an error lets log it to the console and inform the angular
    // of our app so it can be handled
    if(error){
      console.log('Error occured while getting feed from Connections Cloud: ' + error);
      res.status(500).end();
    } else {

      // otherwise, the api returns an xml which can be easily converted to a
      // JSON to make parsing easier using the xml2js module for nodejs
      parseString(body, function(err, result){

        // initialize the array of photos we will be sending back
        var photos = [];

        // get the actual entries object in the response
        var entries = result.feed.entry;

        // iterate over the entries to send back each photo that was returned
        for(var i = 0; i < entries.length; i++){
          var photo = {};
          var entry = entries[i];

          // the photo id which is used to reference the photo internally for
          // ibm connection cloud, this will need to be stored to quickly
          // get the photo and information on the photo later
          photo.id = entry['td:uuid'][0];

          // iterate through the tags in the entry and build an object that has
          // all the tags, starting at 1 because the first category describes
          // the document and is not a true 'tag'
          var tags = [];
          for(var j = 1; j < entry.category.length; j ++){
            var category = entry.category[j];
            var tag = category.$.label;
            tags.push(tag);
          }
          photo.tags = tags;

          // the author of the file, and in our case the photographer
          photo.photographer = entry.author[0].name[0];

          // the title of the document
          photo.title = entry.title[0]['_'];

          // the upload date of the document
          photo.published = entry.published[0];

          // the link object contains many links related to the document,
          // however we want the link to the actual image, therefore we will
          // look for the object with the type of image
          for(var j = 0; j < entry.link.length; j++){
            var link = entry.link[j];
            var type = link.$.type;
            if(!(type === undefined) && (type.indexOf('image') > -1)){
              photo.link = link.$.href;
              break;
            }
          }

          // in addition we need to pass the library id of the entry, for later
          // calls in which we will have to pass the library id to the api
          photo.libraryid = entry['td:libraryId'][0];
          console.log(photo.id + ' : ' + photo.libraryid);

          // push the photo to our photos array
          console.log('pushing :' + JSON.stringify(photo));
          photos.push(photo);
        }

        //return our photos array
        console.log('sending response');
        res.send(photos);
      });
    }
  });
});

//get photo for retrieving a photo by id
router.get('/photo', function(req, res, next){

  if(!req.user)
    res.status(403).end();

  //if no id was passed, return an error code
  if(isEmpty(req.query.id) || isEmpty(req.query.lid)){
    console.log('query not found');
    res.status(412).end();
  } else {
      var url = 'https://' + config.server.domain + '/files/oauth/api/library/' + req.query.lid + '/document/' + req.query.id + '/entry?includeTags=true';

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
          console.log('photo error: ' + error);
          res.status(500).end();
        } else {
          //see get feed for more details
          parseString(body, function(err, result){
            fs.writeFile("response.txt", JSON.stringify(result));
            var photo = {};
            var entry = result.entry;
            photo.id = entry['td:uuid'][0];
            var tags = [];
            for(var j = 1; j < entry.category.length; j ++){
              var category = entry.category[j];
              var tag = category.$.label;
              tags.push(tag);
            }
            photo.tags = tags;
            for(var j = 0; j < entry.link.length; j++){
              var link = entry.link[j];
              var type = link.$.type;
              if(!(type === undefined) && (type.indexOf('image') > -1)){
                photo.link = link.$.href;
                break;
              }
            }
            photo.photographer = entry.author[0].name[0];
            photo.userid = entry.author[0]['snx:userid'][0];
            photo.title = entry.title[0]['_'];
            photo.published = entry.published[0];
            var socialx = entry['snx:rank'];
            for(var i = 0; i < socialx.length; i++){
              var x = socialx[i];
              if(x.$.scheme.indexOf('recommendations') > -1){
                photo.likes = parseInt(x['_']);
                break;
              }
            }
            photo.libraryid = entry['td:libraryId'][0];
            console.log('Sending response');
            res.send(photo);
          });
        }
      });
  }
});

router.post('/like', function(req, res, next){
  if(!req.user)
    res.status(403).end();

  if(isEmpty(req.query.id)){
    req.status(412).end();
  } else {

  }
})

router.get('/comments', function(req, res, next){
  if(!req.user)
    res.status(403).end();

  //if no id was passed
  if(isEmpty(req.query.id)){
    console.log("query not found");
    res.status(412).end();
  } else if(isEmpty(req.query.userid)){
    res.status(412).end();
  } else {
    var url = 'https://' + config.server.domain + '/files/oauth/api/userlibrary/' + req.query.userid + '/document/' + req.query.id + '/feed?category=comment';

    var headers = {'Authorization': 'Bearer ' + req.user.accessToken};

    var options = {
      url: url,
      headers: headers
    };

    console.log(JSON.stringify(options));

    console.log('Making request');

    request.get(options, function(error, response, body){
      if(error){
        console.log('error in get comment: ' + error);
        res.status(500).end();
      } else {
        parseString(body, function(err, result){
          // fs.writeFile("response.txt", JSON.stringify(result));
          var comments = [];
          var entries = result.feed.entry;
          for(var i = 0; i < entries.length; i++){
            var entry = entries[i];
            var comment = {};
            comment.author = entry.author[0].name[0];
            comment.date = entry.published[0];
            comment.content = entry.content[0]['_'];
            comments.push(comment);
          }
          res.send(comments);
        });
      }
    });
  }
});

//upload a file
router.post('/upload', function(req, res, next){
  // if the user does not exist, send back forbidden
  if(!req.user)
    res.status(403).end()

  // before uploading, we must obtain a nonce, which is a handshake between
  // the api and our server to allow us to post to the server
  var url = 'https://' + config.server.domain + '/files/oauth/api/nonce';

  var headers = {'Authorization': 'Bearer ' + req.user.accessToken};

  var options = {
    url: url,
    headers: headers
  };

  // making the nonce request
  request.get(options, function(error, response, body){

    // if there was an error log the error and send back an error
    if(error){
      console.log('nonce failed: ' + error);
      res.status(500).end()
    } else {

      // the nonce is returned in the body of the response
      var nonce = body;

      // to obtain the file from the client, we use a module called busboy
      // that allows us to obtain the file stream from the client
      var busboy = new Busboy({headers: req.headers});

      // when busboy encounters a file (which should be the only thing it
      // obtains from the page) it will then pip the file to a request to the
      // api server
      busboy.on('file', function(fieldname, file, filename, encoding, mimetype){
        var url = 'https://' + server.domain + '/files/oauth/api/myuserlibrary/feed';

        // the slug is used to tell the api what it should call the file
        var slug = filename;

        var headers = {
          'Authorization': 'Bearer ' + req.user.accessToken,
          'Slug': slug,
          //the nonce is the nonce we obtained before
          'X-Update-Nonce': nonce
        };

        var options = {
          url: url,
          headers: headers
        };

        // we then pipe the file to the request to the api server
        file.pipe(request.post(options, function(error, response, body){

          // if we recieve an error then log it and send and erro back to the
          // client
          if(error){
            console.log('upload failed: ' + error);
            res.status(500).end();
          }
        }));

      });

      // when the busboy finishes processing the file, send back an OK status
      // and close the connection
      busboy.on('finish', function(){
        res.status(200).end();
      });
    }
  });
});

router.get('/profile', function(req, res, next){
  if(!req.user){
    res.status(403).end();
  }

  if(isEmpty(req.query.displayName)){
    console.log('query not found');
    req.status(412).end()
  } else {

    var url = '/profiles/atom/search.do?displayName=' + req.query.displayName;

    var headers = {'Authorization' : 'Bearer ' + req.user.accessToken};

    var options = {
      url : url,
      headers : headers
    };

    request.get(options, function(error, response, body){
      if(error){
        console.log('error: ' + error);
        res.status(500).end();
      }

      parseString(body, function(err, result){
        fs.writeFile("response.txt", JSON.stringify(result));
      });
    });
  }
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
