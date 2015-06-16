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

// redirect to homepage
router.get('/', function(req, res, next) {
  res.redirect('/');
});

//getfeed for home page content
router.get('/feed', function(req, res, next){
  if(!req.user)
    return res.status(403).end();

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
      return res.status(500).end();
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
          photo.pid = entry['td:uuid'][0];

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
              photo.image = link.$.href;
              break;
            }
          }

          // the link object contains many links related to the document,
          // however we want the link to the thumbnail, therefore we will
          // look for the object with the rel of thumbnail
          for(var j = 0; j < entry.link.length; j++){
            var link = entry.link[j];
            var rel = link.$.rel;
            if(!(rel === undefined) && (type.indexOf('thumbnail') > -1)){
              photo.thumbnail = link.$.href;
              break;
            }
          }

          // in addition we need to pass the library id of the entry, for later
          // calls in which we will have to pass the library id to the api
          photo.lid = entry['td:libraryId'][0];

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

router.put('/photo', function(req, res, next){
  if(!req.user)
    return res.status(403).end();

  if(isEmpty(req.query.pid) || isEmpty(req.query.title)) {
    console.log("Query not found");
    return res.status(412).end();
  } else {
    var data = '<title type="text">' + req.query.title + '</title>';
    if(!isEmpty(req.query.tags)){
      var array = req.query.tags.split(',');
      for(var i = 0; i < array.length; i++){
        data = data + '<category term="' + array[i] + '"/>';
      }
    }
    var body =  '<?xml version="1.0" encoding="UTF-8"?><entry xmlns="http://www.w3.org/2005/Atom" xmlns:app="http://www.w3.org/2007/app" xmlns:snx="http://www.ibm.com/xmlns/prod/sn">' + data + '</entry>';
    var url = 'https://' + config.server.domain + '/files/oauth/api/myuserlibrary/document/' + req.query.pid + '/entry';

    var headers = {'Authorization' : 'Bearer ' + req.user.accessToken};

    var options = {
      url: url,
      headers: headers
    };

    request.put(options, function(error, response, body){
      if(error){
        console.log('Error while updating photo: ' + error);
        return res.status(500).end();
      }

      return res.status(200).end();
    });
  }
});

//get photo for retrieving a photo by id
router.get('/photo', function(req, res, next){

  if(!req.user)
    return res.status(403).end();

  //if no id was passed, return an error code
  if(isEmpty(req.query.pid) || isEmpty(req.query.lid)){
    console.log('query not found');
    return res.status(412).end();
  } else {
      var url = 'https://' + config.server.domain + '/files/oauth/api/library/' + req.query.lid + '/document/' + req.query.pid + '/entry?includeTags=true';
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
          // see get feed for more details
          parseString(body, function(err, result){
            var photo = {};
            var entry = result.entry;
            photo.pid = entry['td:uuid'][0];
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
            photo.uid = entry.author[0]['snx:userid'][0];
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
            photo.lid = entry['td:libraryId'][0];
            console.log('Sending response');
            res.send(photo);
          });
        }
      });
  }
});

router.put('/like', function(req, res, next){
  if(!req.user)
    return res.status(403).end();

  // check to ensure the necessary queries are included
  if(isEmpty(req.query.pid) || isEmpty(req.query.lid) || isEmpty(req.query.r)){
    console.log('Query not found');
    return req.status(412).end();
  } else {
    // we add the recommendation that was passed to the url
    var url = 'https://' + config.server.domain + '/files/oauth/api/library/' + req.query.lid + '/document/' + req.query.pid + '/media?recommendation=' + req.query.r;

    // Oauth header
    var headers = {'Authorization': 'Bearer ' + req.user.accessToken};

    var options = {
      url: url,
      headers: headers
    };

    request.put(options, function(error, response, body){
      if(error){
        console.log('error in putting like: ' + error);
        return res.status(500).end();
      } else {
        // send back success
        return res.status(200).end();
      }
    });
  }
})

router.get('/comments', function(req, res, next){
  if(!req.user)
    return res.status(403).end();

  //if no id or uid was passed
  if(isEmpty(req.query.pid) || isEmpty(req.query.uid)){
    console.log("query not found");
    return res.status(412).end();
  } else {

    // we need to add category=comment to the end of the url to tell the api
    // we want the comments on the document back
    var url = 'https://' + config.server.domain + '/files/oauth/api/userlibrary/' + req.query.uid + '/document/' + req.query.pid + '/feed?category=comment';

    var headers = {'Authorization': 'Bearer ' + req.user.accessToken};

    var options = {
      url: url,
      headers: headers
    };

    request.get(options, function(error, response, body){
      if(error){
        console.log('error in get comment: ' + error);
        return res.status(500).end();
      } else {
        parseString(body, function(err, result){

          // create the comment array that we will return
          var comments = [];

          // get the main data from the json
          var entries = result.feed.entry;

          // catch if there are no comments on the photo
          if(isEmpty(entries)){
            return res.send(comments);
          }

          // iterate through the comments creating new objects and pushing them
          // to the array
          for(var i = 0; i < entries.length; i++){

            // grab the entry we are iterating on
            var entry = entries[i];

            // create the comment we will add to the array
            var comment = {};

            // grab the author name
            comment.author = entry.author[0].name[0];

            // grab the publish date of the comment
            comment.date = entry.published[0];

            // grab the content of the comment
            comment.content = entry.content[0]['_'];

            // push the comment to the array
            comments.push(comment);
          }

          //return the array of comments
          res.send(comments);
        });
      }
    });
  }
});

router.post('/comments', function(req, res, next){
  if(!req.user)
    return res.status(403).end();

  if(isEmpty(req.query.pid) || isEmpty(req.query.uid)){
    console.log("query not found");
    return res.status(412).end();
  } else {

    // we must get a nonce from the api server in order to post a comment
    // see upload for more info
    var url = 'https://' + config.server.domain + '/files/oauth/api/nonce';

    var headers = {'Authorization': 'Bearer ' + req.user.accessToken}

    var options = {
      url: url,
      headers: headers
    }

    request.get(options, function(error, response, body){
      var nonce = body;

      // we must format the comment into an atom document for the server
      // most of this can just be hardcoded, however in the content tag is
      // where we put our comment
      var body = '<?xml version="1.0" encoding="UTF-8"?><entry xmlns="http://www.w3.org/2005/Atom" xmlns:app="http://www.w3.org/2007/app" xmlns:snx="http://www.ibm.com/xmlns/prod/sn"><category scheme="tag:ibm.com,2006:td/type" term="comment" label="comment"/><content type="text">' + req.body + '</content></entry>';

      var url = 'https://' + config.server.domain + '/files/oauth/api/userlibrary/' + req.query.uid + '/document/' + req.query.pid + '/feed';

      // we then need to added headers in order to tell the api how to handle
      // the request
      var headers = {
        'Authorization': 'Bearer ' + req.user.accessToken,
        'Content-Type': 'application/atom+xml',
        'Content-Length': body.length,
        'X-Update-Nonce': nonce
      };

      // we then add our atom document to the body of the request
      var options = {
        url: url,
        headers: headers,
        body: body
      };

      request.post(options, function(error, response, body){
        if(error){
          console.log('error posting comment: ' + error);
          return res.status(500).end();
        }

        return res.status(200).end();
      });
    });

  }
});

//upload a file
router.post('/upload', function(req, res, next){
  // if the user does not exist, send back forbidden
  if(!req.user)
    return res.status(403).end()

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
      return res.status(500).end()
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
            return res.status(500).end();
          }
        }));

      });

      // when the busboy finishes processing the file, send back an OK status
      // and close the connection
      busboy.on('finish', function(){
        return res.status(200).end();
      });
    }
  });
});

router.get('/profile', function(req, res, next){
  if(!req.user){
    return res.status(403).end();
  }

  if(isEmpty(req.query.uid)){
    console.log('query not found');
    return req.status(412).end()
  } else {

    var url = 'https://' + config.server.domain + '/profiles/atom/profile.do?userid=' + req.query.uid;

    var headers = {'Authorization' : 'Bearer ' + req.user.accessToken};

    var options = {
      url : url,
      headers : headers
    };

    request.get(options, function(error, response, body){
      if(error){
        console.log('error: ' + error);
        return res.status(500).end();
      }

      parseString(body, function(err, result){

        var entry = result.feed.entry;

        if(isEmpty(entry)){
          return res.send("User does not exist.");
        }

        // grab the main data of the json
        entry = result.feed.entry[0];

        // create the object we will send back
        var profile = {};

        // grabbing the name of the profile
        profile.name = entry.contributor[0].name[0];

        // grabbing the email of the profile
        profile.email = entry.contributor[0].email[0];

        // iterate through the links to find the image that represents the
        // profile picture
        for(var i = 0; i < entry.link.length; i++){
          if(entry.link[i].$.type.indexOf(image) > -1){
            profile.img = entry.link[i].$.href;
            break;
          }
        }

        //send back the profile
        res.send(profile);
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
