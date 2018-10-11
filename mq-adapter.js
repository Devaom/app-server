require('dotenv').config();
var amqp = require('amqplib/callback_api');
var RABBITMQ_AMQP_DOMAIN = process.env.RABBITMQ_AMQP_DOMAIN;

/*
exports.publish_queue_promise = function(queue, value) {
	console.log('publish_queue_promise 진입');
	return new Promise(function(resolve, reject) {
		console.log('Promise 실행!');
		amqp.connect(process.env.RABBITMQ_AMQP_DOMAIN, function(error, conn) {
			console.log('amqp.connect 진입!');
			if(error) {
				console.log("An error occured while publishing to '" + queue + "' queue: " + String(error));
				reject(error);
			} 

			conn.createChannel(async function(error, channel) {
				if(error) {
					console.log('An error occured while creating channel: ' + String(error));
					reject(false);
				} else {
					var buffered_value = new Buffer(String(value)); // Queue에 전송시 Buffer로 보내야 하므로
					var success = await channel.sendToQueue(queue, buffered_value);
					console.log('Successfully sent to queue:', success);
					resolve(success);
				}
			});
		})
	})
}
*/

exports.publish_queue_promise = function(queue_name, value) {
	return new Promise(function(resolve, reject) {
		amqp.connect(RABBITMQ_AMQP_DOMAIN, function(conn_err, conn) {
			if(conn_err) {
				conn.close();
				reject(conn_err);
			}

			conn.createChannel(async function(channel_err, channel) {
				if(channel_err) {
					reject(channel_err);
				}

				var buffered_value = new Buffer(String(value));
				var success = await channel.sendToQueue(queue_name, buffered_value);
				conn.close(); // 안닫으면 나중에 터짐 ㅜㅜ
				resolve(success);
			});
		})
	});
}



//exports.publishQueuePromise = publishQueuePromise;

/*
function testFunc1(value) {
	console.log('프로미스 밖에서 확인 = ' + value);

	return new Promise(function(resolve, reject) {
		console.log('프로미스 안에서 확인 = ' + value);
		var value = new Buffer(String(value));
	});
}

testFunc1('테스트1');
// 프로미스 밖에서 확인 = 테스트1
// 프로미스 안에서 확인 = undefined

function testFunc2(value) {
	console.log('프로미스 밖에서 확인 = ' + value);

	return new Promise(function(resolve, reject) {
		console.log('프로미스 안에서 확인 = ' + value);
		//var value = new Buffer(String(value));
	});
}

testFunc2('테스트2');
// 프로미스 밖에서 확인 = 테스트2
// 프로미스 안에서 확인 = 테스트2

function testFunc3(value) {
	console.log('값 확인 = ' + value);
	console.log(new Buffer(String(value)));
}

*/
