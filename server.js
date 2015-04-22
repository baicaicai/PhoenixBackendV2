/**
 * Created by chaojie.cai on 4/22/2015.
 */

/**
 * Created by chaojie.cai on 12/23/2014.
 */

'use strict';

//设置环境变量NODE_ENV的默认值为'development'
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

//初始化express实例
var express = require('./config/express.js');
var app = express();
app.listen(3000);
console.log('server is running at http://localhost:3000');

module.exports = app;



