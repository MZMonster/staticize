# staticize

html page static for node

SUPPORTS:

- [expressjs](https://github.com/strongloop/express)


- [sailsjs](https://github.com/balderdashy/sails)

USE:

- [memory](https://github.com/ptarjan/node-cache)


- [redis](https://github.com/NodeRedis/node_redis) (coming soon)

Cache:

- api result
- api view/render

# Example

To use staticize in you module, simply import it:

``` javascript
var Staticize = require('staticize');
```

And set it (use memory or redis or others):

``` javascript
var staticize = new Staticize({
  cache : {
    adapter: 'memory'
  },
  debug : true, // will log the debug info
  routes: {
    '/cache2s'    : 2,
    'get /cache3s': 3
  }
});
```

Then you can create a middleware:

``` javascript
staticize.cacheMiddleware() // set cache seconds, default 0 to use routes config
```

Use it:

- expressjs:

``` javascript
app.use(staticize.cacheMiddleware());
app.use('/cache4s', staticize.cacheMiddleware(4));

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
- `options.cache.config` : type `object`, if not use `memory` adapter, need to connect to Adapter, for example: 

``` javascript
{
  ...
  cache: {
    adapter: 'redis',
    config: {
      host: 'localhost',
  	  port: 6379,
      database: 2
	}
  }
  ...
} 
```

if given an unsupported `adapter` would throw a `TypeError` :

``` javascript
throw new Error('Unsupported cache adapter: ' + adapter);
```



#### [options.debug]

- `true` :  use `option.log` to print debug log
- `false` or `undefined` : shutdown debug log



#### [options.routes]

`object` , `key` is `'uri'` or `'${http method} uri'` , `value` is cache seconds.

1. When `staticize.cacheMiddleware(30)` with a `ttl` , staticize will use this `ttl` and NOT search in `option.routes` .
2. When `staticize.cacheMiddleware()` with no `ttl` , staticize will search in `option.routes` :
   1. First search the `'uri' key`, found and return;
   2. Then search the `'${http method} uri' key`, found and return;
   3. if not, return 0.



# Test

Run `npm test` .



# LICENSE

MIT