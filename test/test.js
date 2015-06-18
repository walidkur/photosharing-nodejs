var should = require('chai').should(),
  app = require('../app.js');
  expect = require('chai').expect,
  request = require('supertest'),
  user1 = request.agent(app);

describe('Get feed', function(){
  it('login', function(done){
    user1.post('/login')
         .send({username: 'Bob', password: '123'})
         .expect(302)
         .expect('Location', '/')
         .end(function(err, res){
           if (err) return done(err);
           return done();
         });
  });
  it('get feed', function(done){
    user1.get('/api/feed')
         .expect(200)
         .end(function(err, res){
           if (err) return done(err);
           return done();
         })
  })
})
