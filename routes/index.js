var express = require('express');
var passport = require('passport');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {

  res.render('index', { title: 'Express' });

});

router.get('/login', passport.authenticate('ibm-connections-cloud'));



router.get('/callback', function(req, res, next){


res.send("Authenticated ");


});


module.exports = router;
