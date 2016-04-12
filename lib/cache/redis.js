/**
 * staticize
 * Copyright (c) 2015 Meizu bigertech, All rights reserved.
 * MIT Licensed
 */

'use strict';

/**
 * dependencies
 */
var _            = require('lodash'),
    redis        = require('redis'),
    Promises     = require('bluebird'),
    EventEmitter = require('events').EventEmitter;

Promises.promisifyAll(redis.RedisClient.prototype);
Promises.promisifyAll(redis.Multi.prototype);

module.exports = RedisCache;

function RedisCache(options) {

  var self = this;

  options = _.merge({
    host: '127.0.0.1',
    port: 6379
  }, options);
  // a new redis client
  self._engine = redis.createClient(options);

  self.__proto__.set = function (key, data, ttl) {
    return self._engine
      .setAsync(key, JSON.stringify(data))
      .then(function () {
        return self._engine.expireAsync(key, ttl);
      })
  };

  self.__proto__.get = function (key) {
    return self._engine.getAsync(key)
      .then(function (data) {
        if (data) {
          try {
            return JSON.parse(data);
          } catch (e) {
            return Promises.reject(e);
          }
        }
        return data;
      });
  };
}
