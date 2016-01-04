/**
 * staticize
 * Copyright (c) 2015 Meizu bigertech, All rights reserved.
 * MIT Licensed
 */

'use strict';

/**
 * Module dependencies
 */
var es = require('event-stream');

/**
 * exports
 * @type {Cacher}
 */
module.exports = Cacher;

/**
 * choose to use `memory` or `local` or DATABASE like `redis` `mysql` `mongodb` ...
 * @param {Object} options
 */
function Cacher(options) {
  // require `./cache/${adapter}`
  var adapter = options.adapter || 'memory';
  if (typeof adapter !== 'string') {
    throw new TypeError('adapter should be string, ' + adapter);
  }
  try {
    this._cache = require('./cache/' + adapter);
    // set get setStream getStream
    this.__proto__.set = this._cache.set;
    this.__proto__.get = this._cache.get;

    // this
    return this;
  } catch (err) {
    throw new Error('Unsupported cache adapter: ' + adapter);
  }
}

/**
 * cache Stream
 * @param {String} key cache key
 * @param {Number} ttl seconds
 * @return {Stream}
 */
Cacher.prototype.setStream = function (key, ttl) {
  var data = [];
  var cache = this._cache;
  return es.through(function write(data) {
      // collect data
      data.push(data);
      // emit data for re-use
      this.emit('data', data);
    },
    function end() {
      // cache stream
      if (data.length > 0) {
        cache.set(key, data, ttl);
      }
      // end
      this.emit('end');
    });
};

/**
 * cache Stream
 * @param {String} key cache key
 */
Cacher.prototype.getStream = function (key) {
  var data = this._cache.get(key);
  if (data) {
    return es.readArray(data);
  }
  return null;
};
