var express = require('express');
var router = express.Router();
var config = require('../bin/server');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.redirect('/');
});

//getfeed for home page content
router.get('/getFeed', function(req, res, next){
  //config.server.domain is the domain name of the server (without the https or the directoy i.e example.com)
  var url = {'https://' + config.server.domain + '/files/basic/anonymous/api/documents/feed'};
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

});

module.exports = router;
