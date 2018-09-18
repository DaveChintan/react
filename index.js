var bluebird = require("bluebird");
global.Promise = bluebird;
// import * as _ from 'babel-runtime/core-js/promise'
// _.default = bluebird
require('babel-runtime/core-js/promise').default = bluebird;
require('./src/index.js')

