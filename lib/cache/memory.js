/**
 * staticize
 * Copyright (c) 2015 Meizu bigertech, All rights reserved.
 * MIT Licensed
 */

'use strict';

/**
 * dependencies
 */
var cache = require('memory-cache');
var Promise = require('bluebird');

module.exports = MemoryCache;

/**
 * just use momery
 */
function MemoryCache() {

  this.set = function (key, value, time) {
    // ttl second to millisecond
    return Promise.resolve(cache.put(key, value, time * 1000))
  };

  this.get = function (key) {
    return Promise.resolve(cache.get(key));
  };
}
