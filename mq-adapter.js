require('dotenv').config();
var amqp = require('amqplib/callback_api');

function publishQueuePromise(queue, value) {
	return new Promise(function(resolve, reject) {
		amqp.connect(process.env.RABBITMQ_AMQP_DOMAIN, function(error, conn) {
			if(error) {
				console.log("An error occured while publishing to '" + queue + "' queue: " + String(error));
				reject(error);
			} 

			conn.createChannel(function(error, channel) {
				if(error) {
					console.log('An error occured while creating channel: ' + String(error));
					reject(false);
				} else {
					var buffered_value = new Buffer(String(value)); // Queue에 전송시 Buffer로 보내야 하므로
					var success = channel.sendToQueue(queue, buffered_value);
					resolve(success);
				}
			});
		})
	})
}

exports.publishQueuePromise = publishQueuePromise;

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
