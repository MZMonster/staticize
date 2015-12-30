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
 *   2. `[options.routes]` - such as `{'get /index': 60, 'get /post': 120 }` (cache for seconds)
 *   3. `options.debug` - print debug info
 * @public
 */
function Staticize(options) {
  // default to `{}`
  var opts = Object.create(options || null);
  // a cache
  this._cache = Cacher(opts.cache);

  // route options
  this._routes = opts.routes || {};

  this._debug = opts.debug || false;

  // debug info
  if (this._debug) {
    console.log('Staticize initial');
  }
}

/**
 * get cache ttl
 * @param url
 * @param ttl
 * @private
 */
Staticize.prototype._getCacheTTL = function (url, ttl) {
  if (ttl) {
    return ttl;
  }
  // get ttl from routes opts
  if (this._routes[url]) {
    return this._routes[url];
  }
  for (var key in this._routes) {
    if (url.indexOf(key) > -1) {
      return this._routes[key];
    }
  }
  return 0;
};
/**
 * return cache file or render or api res result if exist
 * @param {Number} [ttl=1] default 1 second
 */
Staticize.prototype.cacheMiddleware = function (ttl) {
  // back this
  var that = this;
  // check ttl
  if (!ttl || !_.isNumber(ttl)) {
    ttl = 0;
  }
  // debug
  if (this._debug) {
    console.log('set ttl:', ttl)
  }

  // middleware function
  return function (req, res, next) {
    // this -> that
    // cacheKey from req
    var cacheKey = req.method.toLowerCase() + ' ' + req.originalUrl;
    // get from cache
    ttl = that._getCacheTTL(req.originalUrl, ttl);
    if (ttl) {
      that._cache.get(cacheKey)
        .then(function (data) {
          // found a cache
          if (data) {
            if (that._debug) {
              console.log('get %s from cache', req.originalUrl);
            }
            // send res
            res.set(data.headers);

            return res.status(data.status).send(data.body);
          } else {
            // replace res.end
            res.realEnd = res.end;
            // new res.send
            res.end = function (/* [data][, encoding][, callback] */) {
              var body     = arguments[0]
                , encoding = arguments[1]
                , callback = arguments[2]
                , data;
              // will set to cache
              if (body) {
                data = {
                  body    : body,
                  encoding: encoding,
                  status  : this.statusCode,
                  headers : this._headers
                };

                if (that._debug) {
                  console.log('set %s to cache %ds', req.originalUrl, ttl);
                }
                // set
                that._cache.set(cacheKey, data, ttl);
              }
              // real end
              this.realEnd(body, encoding, callback);
            };

            // return next
            return next();
          }
        })
        .catch(function (err) {
          console.error(err);
          return next();
        });
    } else {
      return next();
    }
  };
};

/**
 * return cache file or render or api res result if exist
 * @param {String} root
 * @param options
 */
Staticize.prototype.cacheFile = function (root, options) {

};

