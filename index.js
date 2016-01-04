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
var crypto = require('crypto');
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
  options = options || {};
  // if debug
  this._debug = options.debug || false;
  // a cache
  this._cache = new Cacher(options.cache);
  // route options
  this._routes = this._parseRoutes(options.routes || {});
  // debug info
  if (this._debug) {
    console.log('Staticize initial');
  }
}

/**
 * divide `'method + url': ${ttl}` and `'url': ${ttl}`
 * @param options
 * @returns {*}
 * @private
 */
Staticize.prototype._parseRoutes = function (options) {
  var opts = {method: {}, all: {}};
  var tmp;
  for (var key in options) {
    if (_.isNumber(options[key])) {
      tmp = key.split(' ');
      if (tmp.length === 1) {
        // debug
        if (this._debug) {
          console.log('set ttl %s: %d', key, +options[key]);
        }
        opts.all[key] = +options[key];
      } else if (tmp.length >= 2) {
        // debug
        if (this._debug) {
          console.log('set ttl %s: %d', tmp[0].toLowerCase() + ' ' + tmp[1], +options[key]);
        }
        opts.method[tmp[0].toLowerCase() + ' ' + tmp[1]] = +options[key];
      }
    } else {
      throw new TypeError('ttl must be a number');
    }
  }

  return opts;
};

/**
 * get cache ttl
 * @param {String} method req.method.toLowerCase()
 * @param {String} originalUrl  req.originalUrl
 * @param {Number} ttl cache seconds
 * @private
 */
Staticize.prototype._getCacheTTL = function (method, originalUrl, ttl) {
  if (ttl) {
    return ttl;
  }
  var tmp = method + ' ' + originalUrl;
  // get ttl from routes opts
  // use method + originalUrl
  for (var key in this._routes.method) {
    if (tmp.indexOf(key) > -1) {
      return this._routes.method[key];
    }
  }
  for (var key in this._routes.all) {
    if (originalUrl.indexOf(key) > -1) {
      return this._routes.all[key];
    }
  }
  return 0;
};

/**
 * hash req.body if not (GET|HEAD)
 * @param req request
 * @returns {string}
 * @private
 */
Staticize.prototype._hash = function (req) {
  // get|head
  if (!(req.method === 'GET' || req.method === 'HEAD')) {
    // create hash
    var hash = crypto.createHash('sha1');
    hash.update(JSON.stringify(_.cloneDeep(req.body || {})), 'utf-8');
    // to base64
    return hash.digest().toString('base64').toLowerCase();
  }
  return '';
};

/**
 * return cache file or render or api res result if exist
 * @param {Number} [cacheTTL=0] default 0 second, use the `options.routes` to get ttl
 * @param {Function} [fn=hash(req.body)] use `req` to create a extension string adding to cache key
 *   if method !== get|head
 */
Staticize.prototype.cacheMiddleware = function (cacheTTL, fn) {
  // back this
  var that = this;
  // check ttl
  if (!cacheTTL || !_.isNumber(cacheTTL)) {
    cacheTTL = 0;
  }
  // set fn
  if (!fn || (typeof fn !== 'function')) {
    fn = that._hash;
  }

  // middleware function
  return function (req, res, next) {
    // method
    var method = req.method.toLowerCase();
    // cacheKey from req
    var cacheKey = method + ' ' + req.originalUrl;
    cacheKey += fn(req);
    // get from cache
    var ttl = that._getCacheTTL(method, req.originalUrl, cacheTTL);
    if (ttl) {
      that._cache.get(cacheKey)
        .then(function (data) {
          // found a cache
          if (data) {
            if (that._debug) {
              console.log('get %s - %s from cache', method, cacheKey);
            }
            // send res
            res.set(data.headers);
            // send to client
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
                  body   : body,
                  status: this.statusCode,
                  headers: this._headers
                };

                if (that._debug) {
                  console.log('set %s - %s to cache %ds', method, cacheKey, ttl);
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

