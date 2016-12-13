/**
 * staticize
 * Copyright (c) 2015 Meizu bigertech, All rights reserved.
 * MIT Licensed
 */

'use strict';

/**
 * Module dependencies
 */
var debug = require('debug')('staticize');

var _       = require('lodash'),
    crypto  = require('crypto'),
    Cacher  = require('./lib/cacher'),
    resolve = require('path').resolve,
    pathToRegexp = require('path-to-regexp'),
    fresh = require('fresh');

/**
 * Module exports
 */
module.exports = Staticize;

/**
 * config storage of staticize
 *
 * @param {Object} options:
 *   1. `options.cache` - such as {adapter: 'redis', options: {host: 'localhost', port: '6379', database: 2}}
 *   2. `[options.routes]` - such as `{'get /index': 60, 'get /post': 120 }` (cache for seconds)
 * @public
 */
function Staticize(options) {
  // default to `{}`
  options = options || {};
  // a cache
  this._cache = new Cacher(options.cache);
  // route options
  this._routes = this._parseRoutes(options.routes || {});
  // debug info
  debug('Staticize initial');
}

/**
 * parse route path to regular expression
 * @param routes
 * @returns {Object} routesMap
 *   {
 *     get: [
 *       {
 *         path: '/foo/:bar',
 *         pattern: '/^\/foo\/((?:[^\/]+?))(?:\/(?=$))?$/i',
 *         ttl: 30
 *       }
 *     ],
 *     post: [...]
 *   }
 * @private
 */
Staticize.prototype._parseRoutes = function (routes) {
  var routesMap = {};

  for (var routePath in routes) {
    var routeItem = routes[routePath];
    var ttl = +routeItem;
    var cors = null;

    if (_.isObject(routeItem)) {
      ttl = +routeItem.ttl;
      if (_.isString(routeItem.cors)) {
        cors = routeItem.cors;
      } else {
        throw new TypeError('cors must be a string object');
      }
    }

    if (_.isNumber(ttl)) {
      var method = 'get';
      var tmp = routePath.split(' ');
      if (tmp.length >= 2) {
        method = tmp[0].toLowerCase();
        routePath = tmp[1];
      }

      debug('set ttl %s: %d', method + ' ' + routePath, ttl);

      routesMap[method] = routesMap[method] || [];
      routesMap[method].push({
        path: routePath,
        pattern: pathToRegexp(routePath), // path to regular expression
        ttl: ttl,
        cors: cors,
      });
    } else {
      throw new TypeError('ttl must be a number');
    }
  }

  return routesMap;
};

/**
 * get cache ttl
 * @param {String} method req.method.toLowerCase()
 * @param {String} originalUrl  req.originalUrl
 * @param {Number} ttl cache seconds
 * @private
 */
Staticize.prototype._getCacheConfig = function (method, originalUrl, routeConfig) {
  if (routeConfig) {
    if (_.isNumber(routeConfig)) {
      return { ttl: routeConfig };
    }
    return routeConfig;
  }

  var routes = this._routes[method] || [];
  for (var index in routes) {
    var route = routes[index];
    if (route.pattern.test(originalUrl)) {
      debug('match cache route: %s', route.path);
      return route;
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
 * @param {RegExp} [skip] regExp which routes will be skiper
 * @param {Function} [fn=hash(req.body)] use `req` to create a extension string adding to cache key
 *   if method !== get|head
 */
Staticize.prototype.cacheMiddleware = function (cacheConf, skip, fn) {
  // back this
  var self = this;
  // check ttl
  if (!cacheConf) {
    cacheConf = null;
  }

  // set fn
  fn = typeof skip === 'function' ? skip : fn;
  if (!fn || (typeof fn !== 'function')) {
    fn = self._hash;
  }

  // middleware function
  return function (req, res, next) {
    // just skip
    if (skip && req.originalUrl.match(skip)) {
      return next();
    }
    // method
    var method = req.method.toLowerCase();
    var origin = req.origin || 'm';
    // cacheKey from req
    var cacheKey = method + ':' + req.originalUrl + ':' + origin;  // cache for diff `req.origin`
    cacheKey += fn(req);
    // get from cache
    var config = self._getCacheConfig(method, req.originalUrl, cacheConf);
    if (config) {
      self._cache.get(cacheKey)
        .then(function (data) {
          // found a cache
          if (data) {

            debug('get %s:%s from cache', method, cacheKey);
            // send res
            res.set(data.headers);

            // set cors headers
            if (req.headers.origin && config.cors) {
              if (config.cors === '*' || ~config.cors.indexOf(req.headers.origin)) {
                res.set('Access-Control-Allow-Credentials', true);
                res.set('Access-Control-Allow-Origin', req.headers.origin);
              }
            }

            // send to client
            return res.status(data.status).send(new Buffer(data.body));
          } else {
            // replace res.end
            res.realEnd = res.end;

            // Avoid checking Last-Modified and ETag on the first request
            res._reqHeaders = { // cache req.headers
              'if-none-match': req.headers['if-none-match'],
              'if-modified-since': req.headers['if-modified-since'],
            };
            delete req.headers['if-none-match'];
            delete req.headers['if-modified-since'];

            // new res.send
            res.end = function (/* [data][, encoding][, callback] */) {
              var body     = arguments[0],
                  encoding = arguments[1],
                  callback = arguments[2],
                  s = this.statusCode,
                  data;
              // will set to cache
              if (body) {
                data = {
                  body   : body,
                  status: this.statusCode,
                  headers: this._headers
                };

                debug('set %s:%s to cache %ds', method, cacheKey, config.ttl);

                // set
                self._cache.set(cacheKey, data, config.ttl);
              }

              // If non-modify, set statusCode = 304
              if (((s >= 200 && s < 300) || 304 == s)
                  && fresh(this._reqHeaders, this._headers)) {
                this.statusCode = 304;
                this.removeHeader('Content-Type');
                this.removeHeader('Content-Length');
                this.removeHeader('Transfer-Encoding');
                body = '';
              }

              // real end
              this.realEnd(body, encoding, callback);
            };

            // return next
            return next();
          }
        })
        .catch(function (err) {
          // log error
          console.error(err);

          return next(err);
        });
    } else {
      return next();
    }
  };
};
