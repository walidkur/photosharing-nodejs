var should = require('chai').should(),
  expect = require('chai').expect,
  express = require('express'),
  request = require('superagent'),
  user1 = request.agent();

it('get feed', function(done){
  user1.post('http://localhost:3000/login')
       .send({username: 'Bob', password: '123'})
       .end(function(err, res){
         console.log('res.body: ' + JSON.stringify(res.body));
         done();
       })
})
