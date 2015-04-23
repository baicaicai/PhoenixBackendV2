/**
 * Created by chaojie.cai on 4/22/2015.
 */
"use strict";


var config = require('../../config/config.js');
var Q = require('q');
var AV = require('avoscloud-sdk').AV;
var _ = require('lodash');



function initializeAVCloud(masterMode){

	AV.initialize(config.avoscloudAppID, config.avoscloudAppKey,config.avoscloudMasterKey);
	console.log('成功初始化AVCloud');

};
function findFlightByTime(startDate,endDate){
	initializeAVCloud(true);
	return Q.Promise(function(resolve,reject){
		var q = new AV.Query('Flight');
		q.greaterThanOrEqualTo('DutyDate',startDate);
		if(endDate){
			q.lessThan('DutyDate',endDate);
		}
		q.equalTo('Cia','000058908');
		q.find().then(function(result){
			resolve(result);
		},
		function(error){
			reject(error);
		});
	});
}
function insertFlights(flights){
	initializeAVCloud(true);
	var Flight = AV.Object.extend('Flight');
	var flight = new Flight();
	_.map(flights,
		function (elem, key, list) {
			flight.set(key, elem);
		}
	);

	return Q.Promise(function(resolve,reject){
		flight.save().then(function(result){
				resolve(result);
			},function(result,error){
				reject(error);
			}
		);
	});


}
function updateFlightValue(key,value){
	initializeAVCloud(true);
	var Flight = AV.Object.existed('Flight');
	var flight = new Flight();
	flight.set(key,value);
	return Q.Promise(function(resolve,reject){
		flight.save().then(function(result){
				console.log('�Ѿ��ɱ���'+ result.Mid +'�ķ�����������˴洢');
				resolve(result);
			},function(result,error){
				console.log('MIDΪ' + result.Mid + '�洢����г��ִ���' + error);
				reject(error);
			}
		);
	});
}
function findFlightBySpecificDate(date){
	initializeAVCloud(true);
	return Q.Promise(function(resolve,reject){
		var q = new AV.Query('Flight');
		q.equalTo('DutyDate',date);
		q.find().then(function(result){
			resolve(result)
		},
		function(error){
			reject(error);
		});
	});
};

exports.findFlightsByTime = findFlightByTime;
exports.insertFlights = insertFlights;
exports.findFlightBySpecificDate = findFlightBySpecificDate;