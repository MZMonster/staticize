# staticize

html page static for node

SUPPORTS:

- [expressjs](https://github.com/strongloop/express)


- [sailsjs](https://github.com/balderdashy/sails)

USE:

- [memory](https://github.com/ptarjan/node-cache)


- [redis](https://github.com/NodeRedis/node_redis)



# Example

To use staticize in you module, simply import it:

``` javascript
var Staticize = require('staticize');
```

And set it (use memory or redis or others):

``` javascript
var staticize = new Staticize({
  cache: {
    adapter: 'memory'
  },
  debug: true
});
```

Then you can create a middleware:

``` javascript
staticize.cacheMiddleware(30) // set cache seconds
```

Use it:

- expressjs:

``` javascript
app.use('/cache30s', staticize.cacheMiddleware(30));
app.use('/cache60s', staticize.cacheMiddleware(60));
app.use('/cache0s', staticize.cacheMiddleware());

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



# Staticize





# LICENSE

MIT