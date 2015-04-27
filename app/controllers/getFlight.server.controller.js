/**
 * Created by Susan on 4/23/15.
 */
var request = require('request');
var cheerio = require('cheerio');
var _ = require('lodash');
var moment = require('moment');
var Q = require("q");
var avServ = require('../services/avcloudServ.js');


exports.getFlights = function(req,res){
	var startDate = moment().subtract(7, 'days').format('DDMMMYY');
	avServ.findFlightBySpecificDate(startDate).then(function(result){
		console.log(result);
	}).catch(function(error){
		console.log(error);
	});

	avServ.findFlightsByTime(startDate).then(function(result){
		console.log(result);
	}).catch(function(error){
		console.log(error);
	});



};

exports.savAllFlights = function(req,res){
	"use strict";

};