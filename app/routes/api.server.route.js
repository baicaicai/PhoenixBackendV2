/**
 * Created by chaojie.cai on 03/26/2015.
 */

'use strict';


 module.exports= function (app) {
 	// body...
 	var api = require('../controllers/api.server.controller.js');
 	app.get('/parseCIA',api.parseCIA);
 }