/**
 * staticize
 * Copyright (c) 2015 Meizu bigertech, All rights reserved.
 * MIT Licensed
 */

'use strict';

/**
 * Module dependencies
 */
var _ = require('lodash');
var Cacher = require('./lib/cacher');
var resolve = require('path').resolve;

/**
 * Module exports
 */
module.exports = Staticize;

/**
 * config storage of staticize
 *
 * @param {Object} options:
 *   1. `options.cache` - such as {adapter: 'redis', config: {host: 'localhost', port: '6379', database: 2}}
 *   2. `options.routes` - such as `{'/index': 60, '/post': 120 }` (cache for seconds, only support `GET` and `HEAD`)
 * @public
 */
function Staticize(options) {
  // default to `{}`
  var opts = Object.create(options || null);
  if (_.isEmpty(opts)) {
    throw new TypeError('options required');
  }
  // a cache
  this.cache = Cacher(opts.cache);

  // route options
  var routes = options.routes;
  if (!routes || !_.isObject(routes) || _.isEmpty(routes)) {
    throw new TypeError('options.routes required');
  }
  this.routes = routes;
}

/**
 * return cache file or render or api res result if exist
 */
Staticize.prototype.cacheMiddleware = function (req, res, next) {

};

/**
 * return cache file or render or api res result if exist
 * @param {String} root
 * @param options
 */
Staticize.prototype.cacheFile = function (root, options) {

  

  return function (req, res, next) {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      return next();
    }
  }
};
/**
 *
 * @param routeOpts
 * @private
 */
function _parserRoute(routeOpts) {

}
