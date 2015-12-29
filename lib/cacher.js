/**
 * staticize
 * Copyright (c) 2015 Meizu bigertech, All rights reserved.
 * MIT Licensed
 */

'use strict';

/**
 * exports
 * @type {Cacher}
 */
module.exports = Cacher;

/**
 * choose to use `memory` or `local` or DATABASE like `redis` `mysql` `mongodb` ...
 * @param {Object} options
 */
function Cacher(options) {
  // require `./cache/${adapter}`
  var adapter = options.adapter || 'memory';
  if (typeof adapter !== 'string') {
    throw new TypeError('adapter should be string, ' + adapter);
  }
  try {
    return require('./cache/' + adapter)(options.config)
  } catch (err) {
    throw new Error('Unsupported Cacher: ' + adapter);
  }
}
