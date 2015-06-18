var should = require('chai').should(),
  app = require('../app.js');
  expect = require('chai').expect,
  express = require('express'),
  request = require('supertest'),
  user1 = request.agent(app);

it('get feed', function(done){
  user1.post('/login')
       .send({username: 'Bob', password: '123'})
       .expect(302)
       .expect('Location', '/')
       .end(function(err, res){
         if (err) return done(err);
         return done();
       });
})
