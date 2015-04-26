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
};
function findFlightByTime(startDate,endDate){
	initializeAVCloud(true);
	return Q.Promise(function(resolve,reject){
		var q = new AV.Query('Flight');
		q.greaterThanOrEqualTo('DutyDate',startDate);
		if(endDate){
			q.lessThan('DutyDate',endDate);
		}
		q.equalTo('Cid','0000058908');
		q.find().then(function(result){
			resolve(result);
		},
		function(error){
			reject(error);
		});
	});
}
function insertFlights(newFlights){

	initializeAVCloud(true);
	var Flight = AV.Object.extend('Flight');
	//创建需要存储的数据数组以供后续的方法进行调用
	var flights = [];
	_.map(newFlights,
		function (elem, key, list) {
			var flight = new Flight();
			_.map(elem,function(elem1,key1,list1){
				flight.set(key1, elem1);
			});
			flights.push(flight);
		}
	);

	return Q.Promise(function(resolve,reject){
		AV.Object.saveAll(flights).then(function(result){
				console.log("已经成功更新"+result.length + "条数据");
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
				console.log("已经成功更新" + result.length + "条数据");
				resolve(result);
			},function(result,error){
				console.log('MIDΪ' + result.Mid + '�洢����г��ִ���?' + error);
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