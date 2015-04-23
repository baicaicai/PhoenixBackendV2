'use strict';


var request = require('request');
var cheerio = require('cheerio');
var _ = require('lodash');
var moment = require('moment');
var Q = require("q");

var avServ = require('../services/avcloudServ.js');

var initial = true;

exports.parseCIA = function(req,res){

	var rqstFrom = moment().subtract(7, 'days').format('DDMMMYY');
	var rqstTo = moment().add(30, 'days').format('DDMMMYY');
	var ciaLoginOptions = {
		url: 'http://cia.airchina.com.cn/cia/loginHandler.do',
		form: {
			userId: '0000058908',
			password: '0503'
		}
	};
	var rosterReportOptions = {
		url: 'http://cia.airchina.com.cn/cia/notificationAcknowledge.do',
		headers: {
			'Accept': '*/*',
			'Accept-Encoding': 'gzip, deflate',
			'Accept-Language': 'zh-CN,zh;q=0.8',
			'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/42.0.2305.2 Safari/537.36',
			'Content-Type': 'application/x-www-form-urlencoded',
			'DNT': '1',
			'Cookie': ''},
		form:{
			rqstFrom:rqstFrom,
			rqstTo:rqstTo
		}
	};

	getRosterReport(ciaLoginOptions).then(function(res){
		console.log('已成功登陆系统')
		var rawCookie = res.headers['set-cookie'];
		var c1 = rawCookie[0].split(';')[0];
		var c2 = rawCookie[1].split(';')[0];
		var cookies = c2.concat(";", c1, ";");
		rosterReportOptions.headers.Cookie = cookies;
		return getRosterReport(rosterReportOptions);
	}).then(function(res){
		console.log('成功获取任务信息');
		return parseRosterReport(res.body);
	}).then(function(rawFlightData){
		console.log('成功解析基本信息');
		return  checkUpdate(rawFlightData);
	}).then(function(newFlights){
		console.log('成功获取需要更新的飞行任务信息');
		if(initial){
			avServ.insertFlights(newFlights);
		}
	}).catch(function(err){
		console.log(err);
	});
};

function getRosterReport(option) {
	return Q.Promise(function(resolve,reject){
		request.post(option,function(err,res,body){
			if(err){
				return reject(err);
			}
			resolve(res);
		});
	});
};

function parseRosterReport(html){
	return Q.Promise(function(resolve,reject){
		//定义数组变量用于记录每一行飞行记录
		var userID = '0000058908';
		var passWord = '0503';
		var flightKey = [
			"Cid",
			"Mid",
			"DutyDate",
			"Day",
			"FlightNum",
			"Sector",
			"PlaneType",
			"Duty",
			"ParingDuty",
			"CrewRank",
			"RPTTime",
			"STDTime",
			"STATime",
			"FLTTime",
			"DutyTime",
			"Hotel",
			"Training",
			"Remarks",
			"CrewHref",
			"Departure",
			"Destination",
			"isExpired"
		];
		var memberKey = [
			"Index",
			"P",
			"Cid",
			"Name",
			"MailBox",
			"Rank",
			"TeamNum",
			"Duty",
			"Language",
			"Qualification",
			"SpouseNum"
		];
		var flightCol = [];

		//初始化cheerio，将html初始化为类似jquery对象
		var $ = cheerio.load(html);

		//选择html中所有的记录飞行记录的行信息
		var rawFlighs = $('#RosterReport').children('.tableRowEven, .tableRowOdd');

		// 定义最近有值得日期，星期及航班号信息，在循环中更新，用来补充原始数据
		//Todo 如果获取的第一个任务即没有飞行代码，且dutyTyep = "LO"，则此处默认为空会造成BUG,需进行进一步处理
		var lastDate = moment().subtract(7, 'days').format('DDMMMYY');
		var lastDay = moment().subtract(7, 'days').format('ddd');
		var lastFlightNum = "-";
		var lastHref = "";
		var rawFlightData = [];
		rawFlighs.each(function(i,elem){
			var Uid = userID;
			var Mid = "";
			var Departure = "";
			var Destination = "";

			var flightDetail = $(this).text().replace(/\n/g, "|").replace(/\s/g, "-").split('|');

			var rawHref = $(this).children().eq(2).children().attr('href');

			if(rawHref){
				rawHref = "http://" + rawHref;
			}
			else{
				rawHref = null;
			}


			flightDetail.shift();
			flightDetail.pop();
			flightDetail.push(rawHref);

			var rawFlightArray = _.chain(flightDetail)
				//lodash的slice截取不包含最后一个元素的数组
				.map(function (elem, index, array) {
					//使用switch功能来拼装字符串
					switch (index) {

						//必填字段，如果为空，则取上一个有值数据 lastDate
						//本子段的key是: Date

						case 0:
							if (elem == "-") {
								elem = lastDate;
								// console.log('更新第' + i + '条记录的日期信息为' + lastDate);
							}
							else {
								elem = moment(elem).toDate();
								lastDate = elem;
							}
							break;

						//必填字段，如果为空，则取上一个有值数据 lastDay
						//本子段的key是：Day

						case 1:
							if (elem == "-") {
								elem = lastDay;
								// console.log('更新第' + i + '条记录的星期为' + lastDay);
							}
							else {
								lastDay = elem;
							}
							break;

						//如果为空且任务类型为"FLY"或者"LO"则取上一个有值数据 lastFlightNum
						//本子段的key是：FlightNum

						case 2:


							if (elem == "-" || elem == "" && (array[5] === "FLY" || array[5] === "LO")) {
								elem = lastFlightNum;
								// console.log('更新第' + i + '条记录的航班编号为' + lastFlightNum);
							}
							else {
								lastFlightNum = elem;
							}
							break;

						//Key是Sector

						case 3:
							var tempSector = elem.split('-');
							Departure = tempSector[0] || "-";
							Destination = tempSector[1] || "-";
							break;

						case 16:
							if(!elem){
								elem = lastHref;
							}
							else
							{
								lastHref = elem;
							}
					}
					return elem;
				})
				.value();
			Mid = moment(rawFlightArray[0]).format('YYYYMMDD') + "_" + rawFlightArray[2]+ "_" + rawFlightArray[3] +"_" +rawFlightArray[5];
			rawFlightArray.push(Departure, Destination,false);
			rawFlightArray.unshift(Uid,Mid);
			var flightObject = _.zipObject(flightKey,rawFlightArray);
			rawFlightData.push(flightObject);
		});

		if(rawFlightData.length<1){
			reject(new Error(error));
		}
		else
		{
			resolve(rawFlightData);
		}
	});
};

function checkUpdate(rawFlightData){

	var startDate = moment().subtract(7, 'days').format('DDMMMYY');
	var endDate = moment().add(30, 'days').format('DDMMMYY');

	return Q.Promise(function(resolve,reject){
		avServ.findFlightsByTime(startDate).then(function(results){
			//初始化过程使用字段
			var dateArray = [];
			var midArray = [];

			//初始化处理结果
			var existFlights = [];
			var newFlights = [];

			if(results.length>0){
				for(var i=0;i<results.length;i++){
					dateArray.push(results[i].get('DutyDate'));
					midArray.push(results[i].get('Mid'));
				}
			}
			else{
				console.log('当前用户没有任何飞行任务信息，直接全部插入');
			}

			dateArray = _.uniq(dateArray);
			_.map(rawFlightData,function(elem,index,array){
				//如果找得到又一样的MID的话，则认为无需更新
				if(_.includes(midArray,elem.Mid)){
					existFlights.push(elem);
					console.log('MID为 ' + elem.Mid + ' 的数据已经存在，无需更新！');
				}
				//如果没找到相应的MID的话，则需要进行进一步判断
				else{
					//如果数据库中已经有需要更新航班的日期了，则说明是在原有基础上更新，需要将原有的打上"expired"标签
					if(_.includes(dateArray,elem.DutyDate)){
						avServ.findFlightBySpecificDate(elem.DutyDate)
							.then(function(results){
								for(var j=0;j<results.length;j++){
									//如果是否过期字段已经被设置为“True”,则不进行操作，否则，将该日期下所有任务的过期属性设置为‘true’
									if(!results[j].get('isExpired')){
										results[j].set('isExpired',true);
										results[j].save().then(function(expireResults){
											console.log('已将' + expireResults.id + '对象作废');
										})
									}
								}
						})
					}
					//不论是否将结果作废，都需要将数据插入数据库
					newFlights.push(elem);
				}
			});
			resolve(newFlights);
		});
	});
};

function parseCrewMember(flights){
	return Q.Promise(function(resolve,reject){


	});
};