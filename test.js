/**
 * staticize
 * Copyright (c) 2015 Meizu bigertech, All rights reserved.
 * MIT Licensed
 */

'use strict';

var express = require('express');
var Staticize = require('./index');

var app = express();
var staticize = new Staticize({
  cache : {
    adapter: 'memory'
  },
  debug : true,
  routes: {
    '/cache120s'  : 120,
    'get /cache90': 90
  }
});

app.use('/cache30s', staticize.cacheMiddleware(30));
app.use('/cache60s', staticize.cacheMiddleware(60));
app.use('/cache0s', staticize.cacheMiddleware());

app.get('/*', function (req, res) {
  res.json({
    time: new Date().toLocaleString()
  });
});

app.listen(3000);