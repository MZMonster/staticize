/**
 * staticize
 * Copyright (c) 2015 Meizu bigertech, All rights reserved.
 * MIT Licensed
 */

'use strict';

var express = require('express');
var Staticize = require('./index');
var request = require('supertest');
var should = require('should');

describe('Test memory cache', function () {

  var app;
  var reqApp;
  // initial express
  before(function (done) {
    // express
    app = express();
    // supertest
    reqApp = request(app);
    // staticize config
    var staticize = new Staticize({
      cache : {
        adapter: 'redis'
      },
      routes: {
        '/cache2s'    : 2,
        'get /cache3s': 3,
        '/cacheCors': {
          ttl: 2,
          cors: 'http://google.com' // set cors='*' for accept all origin
        }
      }
    });
    // routes
    app.use(staticize.cacheMiddleware());
    app.use('/cache4s', staticize.cacheMiddleware(4, /login/));

    app.get('/*', function (req, res) {
      res.json({
        time: new Date().toLocaleString()
      });
    });

    app.post('/*', function (req, res) {
      res.json({
        time: new Date().toLocaleString()
      });
    });


    app.listen(3001);

    done();
  });

  describe('#Cache 2 seconds for [GET]', function () {
    var tmp;
    // request first time
    it('should get a time', function (done) {
      reqApp
        .get('/cache2s')
        .expect(200)
        .end(function (err, result) {
          should.not.exist(err);
          tmp = result.body;
          done();
        });
    });
    // second time
    it('should be equal to last one', function (done) {
      reqApp
        .get('/cache2s')
        .expect(200)
        .end(function (err, result) {
          should.not.exist(err);
          result.body.should.be.eql(tmp);
          done();
        });
    });
    // 5s
    it('should not be equal after 2 seconds', function (done) {
      this.timeout(3000);
      setTimeout(function () {
        reqApp
          .get('/cache2s')
          .expect(200)
          .end(function (err, result) {
            should.not.exist(err);
            result.body.should.not.be.eql(tmp);
            done();
          });
      }, 2000);
    });
  });

  describe('#Cache 2 seconds for [POST]', function () {
    var tmp;
    // request first time
    it('should get a time', function (done) {
      reqApp
        .post('/cache2s')
        .expect(200)
        .end(function (err, result) {
          should.not.exist(err);
          tmp = result.body;
          done();
        });
    });
    // second time
    it('should be equal to last one', function (done) {
      reqApp
        .post('/cache2s')
        .expect(200)
        .end(function (err, result) {
          should.not.exist(err);
          result.body.should.be.eql(tmp);
          done();
        });
    });
    // 5s
    it('should not be equal after 2 seconds', function (done) {
      this.timeout(3000);
      setTimeout(function () {
        reqApp
          .post('/cache2s')
          .expect(200)
          .end(function (err, result) {
            should.not.exist(err);
            result.body.should.not.be.eql(tmp);
            done();
          });
      }, 2000);
    });
  });

  describe('#Cache 3 seconds', function () {
    var tmp;
    // request first time
    it('should get a time', function (done) {
      reqApp
        .get('/cache3s')
        .expect(200)
        .end(function (err, result) {
          should.not.exist(err);
          tmp = result.body;
          done();
        });
    });
    // second time
    it('should be equal to last one', function (done) {
      reqApp
        .get('/cache3s')
        .expect(200)
        .end(function (err, result) {
          should.not.exist(err);
          result.body.should.be.eql(tmp);
          done();
        });
    });
    // 5s
    it('should not be equal after 3 seconds', function (done) {
      this.timeout(4000);
      setTimeout(function () {
        reqApp
          .get('/cache3s')
          .expect(200)
          .end(function (err, result) {
            should.not.exist(err);
            result.body.should.not.be.eql(tmp);
            done();
          });
      }, 3000);
    });
  });

  describe('#Cache 4 seconds', function () {
    var tmp;
    // request first time
    it('should get a time', function (done) {
      reqApp
        .get('/cache4s')
        .expect(200)
        .end(function (err, result) {
          should.not.exist(err);
          tmp = result.body;
          done();
        });
    });
    // url -> login
    it('login should skip', function (done) {
      this.timeout(3000);
      setTimeout(function () {
        reqApp
          .get('/cache4s/login')
          .expect(200)
          .end(function (err, result) {
            should.not.exist(err);
            result.body.should.not.be.eql(tmp);
            done();
          });
      }, 2000);
    });
    // second time
    it('should be equal to last one', function (done) {
      reqApp
        .get('/cache4s')
        .expect(200)
        .end(function (err, result) {
          should.not.exist(err);
          result.body.should.be.eql(tmp);
          done();
        });
    });
    // 5s
    it('should not be equal after 4 seconds', function (done) {
      this.timeout(5000);
      setTimeout(function () {
        reqApp
          .get('/cache4s')
          .expect(200)
          .end(function (err, result) {
            should.not.exist(err);
            result.body.should.not.be.eql(tmp);
            done();
          });
      }, 4000);
    });
  });

  describe('#skip login for [GET]', function () {
    // request first time
    it('should get a time', function (done) {
      reqApp
        .get('/login')
        .expect(200)
        .end(function (err, result) {
          should.not.exist(err);
          done();
        });
    });
  });

  describe('#cors', function () {
    var tmp;

    it('should support cors request', function (done) {
      reqApp
        .get('/cacheCors')
        .set('Origin', 'http://google.com')
        .expect(200)
        .end(function (err, result) {
          should.not.exist(err);
          tmp = result.body;
          done();
        });
    });

    it('should return with cors headers', function (done) {
      reqApp
        .get('/cacheCors')
        .set('Origin', 'http://google.com')
        .expect('Access-Control-Allow-Credentials', /true/)
        .expect('Access-Control-Allow-Origin', /http:\/\/google.com/)
        .expect(200)
        .end(function (err, result) {
          should.not.exist(err);
          result.body.should.be.eql(tmp);
          done();
        });
    });

    it('should not return with cors headers', function (done) {
      reqApp
        .get('/cacheCors')
        .set('Origin', 'http://baidu.com')
        .expect('Access-Control-Allow-Credentials', /true/)
        .expect('Access-Control-Allow-Origin', /http:\/\/baidu.com/)
        .expect(200)
        .end(function (err) {
          should.exist(err);
          done();
        });
    });

    it('should not be equal after 5 seconds', function (done) {
      this.timeout(3000);
      setTimeout(function () {
        reqApp
          .get('/cacheCors')
          .expect(200)
          .end(function (err, result) {
            should.not.exist(err);
            result.body.should.not.be.eql(tmp);
            done();
          });
      }, 2000);
    });
  });
});
