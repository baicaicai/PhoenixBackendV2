/**
 * Created by chaojie.cai on 4/22/2015.
 */

/**
 * Created by chaojie.cai on 12/23/2014.
 */

'use strict';

//���û�������NODE_ENV��Ĭ��ֵΪ'development'
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

//��ʼ��expressʵ��
var express = require('./config/express.js');
var app = express();
app.listen(3000);
console.log('server is running at http://localhost:3000');

module.exports = app;



