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
					reject();
				} else {
					var value = new Buffer(String(value)); // Queue에 전송시 Buffer로 보내야 하므로
					var success = channel.sendToQueue(value);
					resolve(success);
				}
			});
		})
	})
}

exports.publishQueuePromise = publishQueuePromise;
