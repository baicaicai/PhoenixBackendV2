/**
 * Created by Susan on 4/23/15.
 */

module.exports = function(app){
	var getFlights = require('../controllers/getFlight.server.controller.js');
	app.get('/getFlights',getFlights.getFlights);
	app.get('/saveAllFlights',getFlights.savAllFlights);
}