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
 *   2. `options.routes` - such as `{'get /index': 60, 'get /post': 120 }` (cache for seconds)
 *   3. `options.debug` - print debug info
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

  this.debug = options.debug || false;

  // debug info
  if (this.debug) {
    console.log('Staticize initial');
  }
}

/**
 * get cache ttl
 * @param url
 * @private
 */
Staticize.prototype._getCacheTTL = function (url) {
  if (this.routes[url]) {
    return this.routes[url];
  }
  for (var key in this.routes) {
    if (url.indexOf(key) > -1) {
      return this.routes[key];
    }
  }
  return 0;
};
/**
 * return cache file or render or api res result if exist
 */
Staticize.prototype.cacheMiddleware = function (req, res, next) {
  var cacheKey = req.method.toLowerCase() + ' ' + req.originalUrl;
  // debug
  if (this.debug) {
    console.log('get %s from cache', req.originalUrl)
  }
  // get from cache
  this.cache.get(cacheKey)
    .then(function (data) {
      if (data) {
        return res.send(data);
      } else {
        return next();
      }
    })
    .catch(function (err) {
      console.error(err);
      return next();
    });
};

/**
 * return cache file or render or api res result if exist
 * @param {String} root
 * @param options
 */
Staticize.prototype.cacheFile = function (root, options) {

};
/**
 *
 * @param routeOpts
 * @private
 */
function _parserRoute(routeOpts) {

}
