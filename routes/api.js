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

// main api url
var FILES_API = 'https://' + config.server.domain + '/files/oauth/api/';

// string needed to recommendations (like)
var RECOMMENDATION_STRING = '<?xml version="1.0" encoding="UTF-8"?><entry xmlns="http://www.w3.org/2005/Atom"><category term="recommendation" scheme="tag:ibm.com,2006:td/type" label="recommendation"/></entry>';

// formatter for comment content
function commentFormat(content){
  return '<?xml version="1.0" encoding="UTF-8"?><entry xmlns="http://www.w3.org/2005/Atom" xmlns:app="http://www.w3.org/2007/app" xmlns:snx="http://www.ibm.com/xmlns/prod/sn"><category scheme="tag:ibm.com,2006:td/type" term="comment" label="comment"/><content type="text">' + content + '</content></entry>';
}

function updatePhotoFormat(id, title){
  if(title) {
    return '<?xml version="1.0" encoding="UTF-8"?><entry xmlns="http://www.w3.org/2005/Atom"><category term="document" label="document" scheme="tag:ibm.com,2006:td/type"/><id>' + id + '</id><label xmlns="urn:ibm.com/td">' + title + '</label></entry>';
  } else {
    return '<?xml version="1.0" encoding="UTF-8"?><entry xmlns="http://www.w3.org/2005/Atom"><category term="document" label="document" scheme="tag:ibm.com,2006:td/type"/><id>' + id + '</id></entry>';
  }
}

// check whether a session exists for the request
function isAuth(req, res, next){
  if(!req.user) return res.status(401).end();
  else next();
}

// redirect to homepage
router.get('/', function(req, res, next) {
  res.redirect('/');
});

// get feed of photos
router.get('/feed', isAuth, function(req, res, next){

  if(isEmpty(req.query.type)) return res.status(412).end();

  var url;

  switch(req.query.type) {
    case 'public':

    // config.server.domain is the domain name of the server (without the
    // https or the directory, for example: example.com).
    // the url to return a feed of public files
    url = FILES_API + 'documents/feed?visibility=public&includeTags=true&includeRecommendation=true';
    break;

    case 'user':
    if(isEmpty(req.query.uid)) return res.status(412).end();

    // the url to return a feed of a user's files
    url = FILES_API + 'userlibrary/' + req.query.uid + '/feed?visibility=public&includeTags=true&includeRecommendation=true';
    break;

    case 'private':

    // the url to return a feed of files shared with the user
    url = FILES_API + 'documents/shared/feed?includeTags=true&direction=inbound&includeRecommendation=true'
    break;

    case 'myphotos':

    // url to return the user's photos
    url = FILES_API + 'myuserlibrary/feed?includeTags=true&includeRecommendation=true'
    break;

    default:
    return res.status(412).end();
    break;
  }

  // append the tags to the url if query parameter exist
  if(!isEmpty(req.query.q)){
    var array = req.query.q.split(",");
    for(var i = 0; i < array.length; i++) url = url + '&tag=' + array[i];
  }

  // append page size to the url if page size parameter exist
  if(!isEmpty(req.query.ps))  url = url + '&ps=' + req.query.ps;

  // append start index to the url if start index parameter exists
  if(!isEmpty(req.query.si))  url = url + '&sI=' + req.query.si;

  var headers = {};

  // passport adds a user object to the request which contains the access token
  // from the Connection Cloud Server. Add this onto the header of the request
  // under Authorization, with the value 'Bearer ' + the access token
  headers['Authorization'] = 'Bearer ' + req.user.accessToken;


  var options = {
    url: url,
    headers: headers
  };

  request.get(options, function(error, response, body){
    if(response.statusCode === 403) return res.status(403).end();

    // initialize the array of photos to be returned
    var photos = [];

    // return 500 if there is an error
    if(error){
      console.log('Error occurred: ' + JSON.stringify(error));
      return res.status(500).end();
    } else {

      // convert the xml that is returned to a JSON for easier parsing
      parseString(body, function(err, result){

        if(err){
          console.log('Error occurred: ' + JSON.stringify(err));
          return res.status(500).end();
        }

        // get the entries from the response
        var entries = result.feed.entry;

        // return the empty array if entries is empty
        if(isEmpty(entries)) return res.send(photos);

        // iterate over the entries, building a photo object for each entry
        for(var i = 0; i < entries.length; i++){
          var photo = {};
          var entry = entries[i];

          // store the id of the photo for furture requests
          photo.pid = entry['td:uuid'][0];

          // iterate through the tags in the entry and build an array of these
          // tags
          var tags = [];
          for(var j = 1; j < entry.category.length; j ++){
            var category = entry.category[j];
            var tag = category.$.label;
            tags.push(tag);
          }

          photo.liked = false;

          // add the tag array to the photo
          photo.tags = tags;

          // add the author of the file to the object
          photo.photographer = entry.author[0].name[0];

          // add the author uid to the file
          photo.uid = entry.author[0]['snx:userid'][0];

          // add the title of the file
          photo.title = entry.title[0]['_'].split(".")[0];

          // add the publish date of the file
          photo.published = entry.published[0];

          // iterate over the links provided by the api to obtain the image and
          // thumbnail of the file. These can be found by using the type and rel
          // fields respectively
          for(var j = 0; j < entry.link.length; j++){
            var link = entry.link[j];
            var type = link.$.type;
            var rel = link.$.rel;
            if(!(rel === undefined) && (rel.indexOf('recommendation') > -1))  photo.liked = true;
            if(!(type === undefined) && (type.indexOf('image') > -1)){
              photo.image = link.$.href;
              for(var x = 0; x < entry.link.length; x++){
                var link = entry.link[x];
                var rel = link.$.rel;
                if(!(rel === undefined) && (rel.indexOf('thumbnail') > -1)){
                  photo.thumbnail = link.$.href;
                  // convert the link stored to a large sized thumbnail by
                  // replacing medium in the link with large
                  photo.thumbnail = photo.thumbnail.replace(/medium/i, 'large');
                  break;
                }
              }
            }
          }

          if(isEmpty(photo.thumbnail)){
            continue;
          }

          var tags = [];

          for(var j = 1; j < entry.category.length; j++){
            var category = entry.category[j];
            var tag = category.$.label;
            tags.push(tag);
          }

          if(tags.indexOf("photonode") == -1){
            continue;
          }

          var socialx = entry['snx:rank'];
          for(var j = 0; j < socialx.length; j++){
            var x = socialx[j];
            if(x.$.scheme.indexOf('recommendations') > -1){
              photo.likes = parseInt(x['_']);
            }
            if(x.$.scheme.indexOf('share') > - 1){
              photo.shares = parseInt(x['_']);
            }
          }

          // add the library id of the photo for later api calls
          photo.lid = entry['td:libraryId'][0];

          // push the photo to our photos array
          photos.push(photo);
        }

        console.log(photos);

        // return our photos array
        res.send(photos);
      });
    }
  });
});

// get information for a photo
router.get('/photo', isAuth, function(req, res, next){

  // return 412 if the necessary queries were not passed
  if(isEmpty(req.query.pid) || isEmpty(req.query.lid))  return res.status(412).end();
  else {

    // the url to return a photo
    var url = FILES_API + 'library/' + req.query.lid + '/document/' + req.query.pid + '/entry?includeTags=true&includeRecommendation=true';

    var headers = {'Authorization': 'Bearer ' + req.user.accessToken};

    var options = {
      url: url,
      headers: headers
    };

    request.get(options, function(error, response, body){
      if(error){
        console.log('Error occurred: ' + JSON.stringify(error));
        return res.status(500).end();
      }
      if(response.statusCode === 403) return res.status(403).end();
      // see get feed for more details
      parseString(body, function(err, result){
        if(err){
          console.log('Error occurred: ' + JSON.stringify(err));
          return res.status(500).end();
        }
        var photo = {};
        var entry = result.entry;
        photo.id = entry.id[0];
        photo.liked = false;
        photo.pid = entry['td:uuid'][0];
        var tags = [];
        for(var j = 1; j < entry.category.length; j ++){
          var category = entry.category[j];
          var tag = category.$.label;
          tags.push(tag);
        }
        photo.tags = tags;
        photo.visibility = entry['td:visibility'][0];
        for(var j = 0; j < entry.link.length; j++){
          var link = entry.link[j];
          var type = link.$.type;
          var rel = link.$.rel;
          if(!(type === undefined) && (type.indexOf('image') > -1)) photo.link = link.$.href;
          if(!(rel === undefined) && (rel.indexOf('recommendation') > -1))  photo.liked = true;
          if(!(rel === undefined) && (rel.indexOf('replies') > -1)){
            photo.commenturl = link.$.href;
          }
          if(!(rel === undefined) && (rel.indexOf('edit-media') > -1)){
            photo.editurl = link.$.href
          }
        }
        photo.photographer = entry.author[0].name[0];
        photo.uid = entry.author[0]['snx:userid'][0];
        photo.title = entry.title[0]['_'].split(".")[0];
        photo.published = entry.published[0];
        var socialx = entry['snx:rank'];
        for(var i = 0; i < socialx.length; i++){
          var x = socialx[i];
          if(x.$.scheme.indexOf('recommendations') > -1){
            photo.likes = parseInt(x['_']);
          }
          if(x.$.scheme.indexOf('share') > -1){
            photo.shares = parseInt(x['_']);
          }
        }
        photo.lid = entry['td:libraryId'][0];
        res.send(photo);
      });
    });
  }
});

router.put('/photo', isAuth, function(req, res, next) {
  // return 412 if the necessary queries are not passed
  if(isEmpty(req.query.title)) next();

  var url = FILES_API + 'myuserlibrary/feed?includeCount=true&search=' + req.query.title;

  var headers = { 'Authorization' : 'Bearer ' + req.user.accessToken };

  var options = {
    url: url,
    headers: headers
  };

  request.get(options, function(error, response, body){
    if(error){
      console.log('Error occurred: ' + JSON.stringify(error));
      return res.status(500).end();
    }

    parseString(body, function(err, result){
      if(err){
        console.log('Error occurred: ' + JSON.stringify(err));
        return res.status(500).end();
      }
      var feed = result.feed;
      var searchCount = parseInt(feed['opensearch:totalResults'][0]);
      if(searchCount == 0){
        next();
      } else {
        res.status(409).end();
      }
    })
  })
}, function(req, res, next){

  if(isEmpty(req.query.pid) || isEmpty(req.body.url) || isEmpty(req.body.id)) return res.status(412).end();

  // url to return a nonce from the api
  var url = FILES_API + 'nonce';

  var headers = { 'Authorization' : 'Bearer ' + req.user.accessToken };

  var options = {
    url: url,
    headers: headers
  };

  // perform request to get a nonce from the server
  request.get(options, function(error, response, body){
    if(error){
      console.log('Error occurred: ' + JSON.stringify(error));
      return res.status(500).end();
    }
    if(response.statusCode === 403) return res.status(403).end();

    var nonce = body;

    var url = 'https://' + config.server.domain + '/files/basic/api/' + 'myuserlibrary/document/' + req.query.pid + '/entry?';

    var title;

    if(req.query.title){
      title = req.query.title + '.jpg';
    }

    var body = updatePhotoFormat(req.body.id, title);

    if(!isEmpty(req.query.q)) url = url + '&tag=' + req.query.q;

    if(!isEmpty(req.query.share)) url = url + '&shareWith=' + req.query.share;

    if(!isEmpty(req.query.visibility)) url = url + '&visibility=' + req.query.visibility;

    var headers = {
      'Authorization': 'Bearer ' + req.user.accessToken,
      'X-Update-Nonce': nonce,
      'Content-Length' : body.length,
      'Content-Type' : 'application/atom+xml'
    };

    var options = {
      url: url,
      headers: headers,
      body: body
    };

    request.put(options, function(error, response, body){
      if(error){
        console.log('Error occurred: ' + JSON.stringify(error));
        return res.status(500).end();
      }
      if(response.statusCode === 402) return res.status(403).end();
      return res.status(200).end();
    });
  });
});

// delete a photo
router.delete('/photo', isAuth, function(req, res, next){

  // retrn 412 if the necessary queries were not passed
  if(isEmpty(req.query.pid))  return res.status(412).end();

  // url to return a nonce from the api
  var url = FILES_API + 'nonce';

  var headers = {'Authorization': 'Bearer ' + req.user.accessToken};

  var options = {
    url: url,
    headers: headers
  };

  // perform request to get a nonce from the server
  request.get(options, function(error, response, body){
    if(error){
      console.log('Error occurred: ' + JSON.stringify(error));
      return res.status(500).end();
    }
    if(response.statusCode === 403) return res.status(403).end();

    var nonce = body;

    // url to delete a photo
    var url = FILES_API + 'myuserlibrary/document/' + req.query.pid + '/entry';

    var headers = {
      'Authorization': 'Bearer ' + req.user.accessToken,
      'X-Update-Nonce': nonce
    };

    var options = {
      url: url,
      headers: headers
    };

    request.del(options, function(error, response, body){
      if(error){
        console.log('Error occurred: ' + JSON.stringify(error));
        return res.status(500).end();
      }
      return res.status(200).end();
    });
  });
});

// like or unlike a photo
router.post('/like', isAuth, function(req, res, next){

  // return 412 is the necessary queries were not passed
  if(isEmpty(req.query.lid) || isEmpty(req.query.r) || isEmpty(req.query.pid))  return req.status(412).end();

  // url to return a nonce
  var url = FILES_API + 'nonce';

  var headers = {'Authorization': 'Bearer ' + req.user.accessToken};

  var options = {
    url: url,
    headers: headers
  }

  request.get(options, function(error, response, body){
    if(error){
      console.log('Error occurred: ' + error);
      return res.status(500).end();
    }
    if(response.statusCode === 403) return res.status(403).end();
    var nonce = body;

    var headers = {
      'Authorization': 'Bearer ' + req.user.accessToken,
      'X-Update-Nonce': nonce,
      'Content-Type': 'application/atom+xml'
    };

    var url;
    if(req.query.r === 'off'){
      url = FILES_API + 'library/' + req.query.lid + '/document/' + req.query.pid + '/recommendation/' + req.user.userid + '/entry'
      headers['X-METHOD-OVERRIDE'] = 'delete';
    } else url = FILES_API + 'library/' + req.query.lid + '/document/' + req.query.pid + '/feed'

    var content = RECOMMENDATION_STRING;

    var options = {
      url: url,
      headers: headers,
      body: content
    };

    request.post(options, function(error, response, body){
      if(error){
        console.log('Error occurred: ' + JSON.stringify(error));
        return res.status(500).end();
      }
      if(response.statusCode === 403) return res.status(403).end();
      return res.status(200).end();
    });
  });
});

// get the feed of comments for a photo
router.get('/comments', isAuth, function(req, res, next){

  // return 412 if the necessary queries were not passed
  if(isEmpty(req.query.pid) || isEmpty(req.query.uid))  return res.status(412).end();
  else {

    // the url to return comments on a file; specify category=comment
    var url = FILES_API + 'userlibrary/' + req.query.uid + '/document/' + req.query.pid + '/feed?category=comment';

    var headers = {'Authorization': 'Bearer ' + req.user.accessToken};

    var options = {
      url: url,
      headers: headers
    };

    request.get(options, function(error, response, body){
      if(error){
        console.log('Error occurred: ' + JSON.stringify(error));
        return res.status(500).end();
      }
      if(response.statusCode === 403) return res.status(403).end();
      parseString(body, function(err, result){
        if(err){
          console.log('Error occurred: ' + JSON.stringify(err));
          return res.status(500).end();
        }

        // create the comment array that to be return
        var comments = [];

        // get the entries from the response object
        var entries = result.feed.entry;

        // return the empty comment array if there are no entries
        if(isEmpty(entries))  return res.send(comments);

        // iterate through the comments creating new objects and pushing them
        // to the array
        for(var i = 0; i < entries.length; i++){

          // obtain the entry
          var entry = entries[i];

          // create the comment to be added to the array
          var comment = {};

          // add the user id of the author to the comment object
          comment.uid = entry.author[0]['snx:userid'][0];

          // add the author of the comment to the comment object
          comment.author = entry.author[0].name[0];

          // add the publish date of the comment
          comment.date = entry.published[0];

          // add the content of the comment
          comment.content = entry.content[0]['_'];

          // add the id of the comment
          comment.cid = entry['td:uuid'][0];

          // push the comment to the array
          comments.push(comment);
        }

        // return the array of comments
        res.send(comments);
      });
    });
  }
});

// add a comment
router.post('/comments', isAuth, function(req, res, next){

  // return 412 if the necessary queries were not passed
  if(isEmpty(req.query.pid) || isEmpty(req.query.uid) || isEmpty(req.body.comment) || isEmpty(req.body.url))  return res.status(412).end();

  // url to return a nonce
  var url = FILES_API + 'nonce';

  var headers = {'Authorization': 'Bearer ' + req.user.accessToken}

  var options = {
    url: url,
    headers: headers
  }

  request.get(options, function(error, response, body){
    if(error){
      console.log('Error occurred: ' + JSON.stringify(error));
      return res.status(500).end();
    }
    if(response.statusCode === 403) return res.status(403).end();

    var nonce = body;

    // create the xml string that wraps the comment
    var body = commentFormat(req.body.comment);

    // url to post a comment on a file
    var url = req.body.url;

    var headers = {
      'Authorization': 'Bearer ' + req.user.accessToken,
      'Content-Type': 'application/atom+xml',
      'Content-Length': body.length,
      'X-Update-Nonce': nonce
    };

    // add the atom (xml) document that was created to the body of the request
    var options = {
      url: url,
      headers: headers,
      body: body
    };

    request.post(options, function(error, response, body){
      if(error){
        console.log('Error occurred: ' + JSON.stringify(error));
        return res.status(500).end();
      }
      if(response.statusCode === 403) return res.status(403).end();
      parseString(body, function(err, result){
        if(err){
          console.log('Error occurred: ' + JSON.stringify(err));
          return res.status(500).end();
        }
        var comment = {};
        var entry = result.entry;
        comment.uid = entry.author[0]['snx:userid'][0];
        comment.author = entry.author[0].name[0];
        comment.date = entry.published[0];
        comment.content = entry.content[0]['_'];
        comment.cid = entry['td:uuid'][0];
        res.send(comment);
      });
    });
  });
});

// update a comment
router.put('/comments', isAuth, function(req, res, next){
  if(isEmpty(req.query.cid) || isEmpty(req.query.pid) || isEmpty(req.query.uid) || isEmpty(req.body.comment)) return res.status(412).end();

  // url to return a nonce
  var url = FILES_API + 'nonce';

  var headers = {'Authorization': 'Bearer ' + req.user.accessToken}

  var options = {
    url: url,
    headers: headers
  }

  request.get(options, function(error, response, body){
    if(error){
      console.log('Error occurred: ' + JSON.stringify(error));
      return res.status(500).end();
    }
    if(response.statusCode === 403) return res.status(403).end();
    var nonce = body;

    var url = FILES_API + 'userlibrary/' + req.query.uid + '/document/' + req.query.pid + '/comment/' + req.query.cid + '/entry';

    var body = commentFormat(req.body.comment);

    var headers = {
      'Authorization' : 'Bearer ' + req.user.accessToken,
      'Content-Type': 'application/atom+xml',
      'Content-Length': body.length,
      'X-Update-Nonce': nonce
    };

    var options = {
      url: url,
      headers: headers,
      body: body
    };

    request.put(options, function(error, response, body){
      if(error){
        console.log('Error occurred: ' + JSON.stringify(error));
        return res.status(500).end();
      }
      if(response.statusCode === 403) return res.status(403).end();
      return res.status(200).end();
    });
  });
});

// delete a comment
router.delete('/comments', isAuth, function(req, res, next){

  // return 412 if the necessary queries are not passed
  if(isEmpty(req.query.cid) || isEmpty(req.query.pid) || isEmpty(req.query.uid))  return res.status(412).end();

  // url to return a nonce
  var url = FILES_API + 'nonce';

  var headers = {'Authorization': 'Bearer ' + req.user.accessToken}

  var options = {
    url: url,
    headers: headers
  }

  request.get(options, function(error, response, body){
    if(error){
      console.log('Error occurred: ' + JSON.stringify(error));
      return res.status(500).end();
    }
    if(response.statusCode === 403) return res.status(403).end();

    var nonce = body;

    // url to return a comment
    var url = FILES_API + 'userlibrary/' + req.query.uid + '/document/' + req.query.pid + '/comment/' + req.query.cid + '/entry';

    var headers = {
      'Authorization': 'Bearer ' + req.user.accessToken,
      'X-Update-Nonce': nonce
    };

    var options = {
      url: url,
      headers: headers
    };

    request.del(options, function(error, response, body){
      if(error){
        console.log('Error occurred: ' + JSON.stringify(error));
        return res.status(500).end()
      }
      if(response.statusCode === 403) return res.status(403).end();
      return res.status(200).end();
    });
  });
});

// upload a file
router.post('/upload', isAuth, function(req, res, next) {
  // return 412 if the necessary queries are not passed
  if(isEmpty(req.query.visibility) || isEmpty(req.query.title)) return res.status(412).end();

  var url = FILES_API + 'myuserlibrary/feed?includeCount=true&search=' + req.query.title;

  var headers = { 'Authorization' : 'Bearer ' + req.user.accessToken };

  var options = {
    url: url,
    headers: headers
  };

  request.get(options, function(error, response, body){
    if(error){
      console.log('Error occurred: ' + JSON.stringify(error));
      return res.status(500).end();
    }

    parseString(body, function(err, result){
      if(err){
        console.log('Error occurred: ' + JSON.stringify(err));
        return res.status(500).end();
      }
      var feed = result.feed;
      var searchCount = parseInt(feed['opensearch:totalResults'][0]);
      if(searchCount == 0){
        next();
      } else {
        res.status(409).end();
      }
    })
  })
}, function(req, res, next){

  // return 412 if the necessary queries are not passed
  if(isEmpty(req.query.visibility) || isEmpty(req.query.title)) return res.status(412).end();

  // create a new Busboy instance which is used to obtain the stream of
  // the files
  var busboy = new Busboy({headers: req.headers});

  // url to return a nonce
  var url = FILES_API + 'nonce';

  var headers = {'Authorization': 'Bearer ' + req.user.accessToken};

  var options = {
    url: url,
    headers: headers
  };

  request.get(options, function(error, response, body){

    // return 400 if there was an error
    if(error){
      console.log('Error occurred: ' + JSON.stringify(error));
      return res.status(500).end()
    }
    if(response.statusCode === 403) return res.status(403).end();
    var nonce = body;

    // process the file to be uploaded
    busboy.on('file', function(fieldname, file, filename, encoding, mimetype){
      var j = request.jar();
      var url = FILES_API + 'myuserlibrary/feed?visibility=' + req.query.visibility;

      // add tags to the url
      if(!isEmpty(req.query.q)) url = url + '&tag=' + req.query.q;

      // add shares to the url
      if(!isEmpty(req.query.share)) url = url + '&shareWith=' + req.query.share + '&shared=true';

      // assign the slug (identifier) to the filename of the uploaded file
      var slug;
      if(!isEmpty(req.query.title)){
        slug = req.query.title + '.' + filename.split(".")[1];
      } else {
        slug = filename;
      }

      var headers = {
        'Authorization': 'Bearer ' + req.user.accessToken,
        'Slug': slug,
        'Content-Length': req.headers['x-content-length'],
        //the nonce is the nonce we obtained before
        'X-Update-Nonce': nonce
      };

      var options = {
        url: url,
        headers: headers
      };

      // pipe the file to the request
      file.pipe(request.post(options, function(error, response, body){
        // return 500 if there was an error
        if(error){
          console.log('Error occurred: ' + JSON.stringify(error));
          return res.status(500).end();
        }
        if(response.statusCode === 403) return res.status(403).end();
        parseString(body, function(err, result){
          if(err){
            console.log('Error occurred: ' + JSON.stringify(err));
            return res.status(500).end();
          }
          var entry = result.entry;
          var pid = entry['td:uuid'];
          var lid = entry['td:libraryId'];
          var photo = {};
          photo.pid = pid;
          photo.lid = lid;
          return res.send(photo);
        });
      }));
    });

    // return 200 when busboy finishes processing the file
    busboy.on('finish', function(){
    });

    // pipe the request to busboy
    req.pipe(busboy);
  });
});

// get a profile
router.get('/profile', isAuth, function(req, res, next){

  // return 412 if the necessary queryies are not passed
  if(isEmpty(req.query.uid))  return req.status(412).end()

  // url to search for a profile by id
  var url = 'https://' + config.server.domain + '/profiles/atom/profile.do?userid=' + req.query.uid;

  var headers = {'Authorization' : 'Bearer ' + req.user.accessToken};

  var options = {
    url : url,
    headers : headers
  };

  request.get(options, function(error, response, body){

    // return 500 if there was an error
    if(error){
      console.log('Error occurred: ' + JSON.stringify(error));
      return res.status(500).end();
    }
    if(response.statusCode === 403) return res.status(403).end();

    parseString(body, function(err, result){
      if(err){
        console.log('Error occurred: ' + JSON.stringify(err));
        return res.status(500).end();
      }

      var entry = result.feed.entry;

      // send back "no user found" if the entry is empty
      if(isEmpty(entry))  return res.send("User does not exist.");

      // get the entry form the response
      entry = result.feed.entry[0];

      // create the object to be sent back
      var profile = {};

      // add the name of the user
      profile.name = entry.contributor[0].name[0];

      // add the email of the user
      profile.email = entry.contributor[0].email[0];

      // iterate through the links to find the profile picture
      for(var i = 0; i < entry.link.length; i++){
        if(entry.link[i].$.type.indexOf('image') > -1){
          profile.img = entry.link[i].$.href;
          break;
        }
      }

      //send back the profile
      res.send(profile);
    });
  });
});

router.get('/searchTags', isAuth, function(req, res, next){

  if(isEmpty(req.query.q)) return res.status(412).end();

  var url = 'https://' + config.server.domain + '/files/oauth/api/tags/feed?format=json&scope=document&pageSize=16&filter=' + req.query.q

  var headers = {
    'Authorization' : 'Bearer ' + req.user.accessToken
  }

  var options = {
    url : url,
    headers : headers
  }

  request.get(options, function(error, response, body){
    if(error){
      console.log('Error occurred: ' + JSON.stringify(error));
      return res.status(500);
    }
    if(response.statusCode === 403) return res.status(403).end();
    res.send(body);
  })
});

var hasOwnProperty = Object.prototype.hasOwnProperty;

function isEmpty(obj) {

  // null and undefined are "empty"
  if (obj == null) return true;

  // Assume if it has a length property with a non-zero value
  // that property is correct.
  if (obj.length > 0)    return false;
  if (obj.length === 0)  return true;

  // check to see if the obj has its own properties
  for (var key in obj) {
    if (hasOwnProperty.call(obj, key)) return false;
  }

  return true;
}

module.exports = router;
