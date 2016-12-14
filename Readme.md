# node-staticize

Router staticize for express

SUPPORTS:

- [expressjs](https://github.com/strongloop/express)


- [sailsjs](https://github.com/balderdashy/sails)

USE:

- [memory](https://github.com/ptarjan/node-cache)


- [redis](https://github.com/NodeRedis/node_redis)

Cache:

- api result
- api view/render

# Install

``` shell
npm install node-staticize
```

# Example

To use staticize in you module, simply import it:

``` javascript
var Staticize = require('staticize');
```

And set it (use memory or redis or others):

``` javascript
var staticize = new Staticize({
  cache : {
    adapter: 'redis',
    options: {
      host: '127.0.0.1',
      port: '6379'
    }
  },
  routes: {
    '/cache2s'    : 2,  // default GET method
    'get /cache3s': 3,
    'post /cache3s': 3,
    'get /foo/:bar': 5, // match /foo/whatever
    '/cacheCors': {
      ttl: 3,
      cors: 'http://yoursite.com' // allow 'http://yoursite.com' CORS access
    },
    '/cacheCorsForAll': {
      ttl: 3,
      cors: '*' // "*" to allow all domains CORS access
    }
  }
});
```

Then you can create a middleware:

``` javascript
staticize.cacheMiddleware() // set cache seconds, default 0 to skip
```

Use it:

- expressjs:

``` javascript
app.use(staticize.cacheMiddleware());
app.use('/cache4s', staticize.cacheMiddleware(4));
app.use('/cacheCors', staticize.cacheMiddleware({ ttl: 3, cors: '*' }));

app.get('/*', function (req, res) {
  res.json({
    time: new Date().toLocaleString()
  });
});

app.listen(3000);
```

- sailsjs:

``` javascript
// create a staticize.js under /policies
...
module.exports = staticize.cacheMiddleware(30);
...

// set it in policies.js
...
  'StaticizeController': {
    'test30s': ['staticize']
  }
...
```



# new Staticize(options)

#### options.cache

cache config, include:

- `options.cache.adapter` : type `string`, such as `memory` `redis` ...
- `options.cache.options` : type `object`, if not use `memory` adapter, need to connect to Adapter, for example:

``` javascript
{
  ...
  cache: {
    adapter: 'redis',
    options: {
      host: '127.0.0.1',
  	  port: 6379
	}
  }
  ...
}
```

if given an unsupported `adapter` would throw a `TypeError` :

``` javascript
throw new Error('Unsupported cache adapter: ' + adapter);
```


#### [options.routes]

`object` , `key` is `'uri'` or `'${http method} uri'` , `value` is cache seconds.

1. When `staticize.cacheMiddleware(30)` with a `ttl` , staticize will use this `ttl` and NOT search in `option.routes` .
2. When `staticize.cacheMiddleware()` with no `ttl` , staticize will search in `option.routes` :
   1. First search the `'uri' key`, found and return;
   2. Then search the `'${http method} uri' key`, found and return;
   3. if not, return 0.

# API

## `.cacheMiddleware(cacheTTL, skip, fn)`

1. `cacheTTL` is cache seconds.
2. `[skip]` is a RegExp, if `req.originalUrl.match(skip)`, goto `next()`.
3. `fn` is a function of using `req` to create a extension string adding to cache key.


# Test

Run `npm test` .


# Debug

Using [debug](https://github.com/visionmedia/debug).

# LICENSE

MIT
