require('dotenv').config();
var AWS = require('aws-sdk');

exports.indexNewsPromise = function(news) {
	return new Promise(function(resolve, reject) {
		var endpoint = new AWS.Endpoint(process.env.ES_DOMAIN)
		var request = new AWS.HttpRequest(endpoint, process.env.ES_REGION);
		request.method = 'PUT';
		request.path += process.env.ES_INDEX + '/' + process.env.ES_TYPE + '/' + news._id;
		delete news._id; // es에 인덱싱할때, body에 _id를 담아서 보낼 수 없음. url 변수에 넣었음.
		request.body = JSON.stringify(news);
		request.headers['host'] = process.env.ES_DOMAIN;
		request.headers['Content-Type'] = 'application/json';

		var responseBody = '';
		var client = new AWS.HttpClient();
		client.handleRequest(request, null, function(response) {
			response.on('data', function(chunk) {
				responseBody = chunk;
			});
			response.on('end', function() {
				var result = {
					headers: {
						code: response.statusCode,
						message: response.statusMessage
					},
					body: responseBody
				};
				resolve(result);
			});
		}, function(error) {
			reject(error);
		})
	})
}
