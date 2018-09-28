require('dotenv').config();
var AWS = require('aws-sdk');

exports.indexNewsPromise = function(news) {
	return new Promise(function(resolve, reject) {
		var endpoint = new AWS.Endpoint(process.env.ES_DOMAIN)
		var request = new AWS.HttpRequest(endpoint, process.env.ES_REGION);
		request.method = 'PUT';
		request.path += process.env.ES_INDEX + '/' + process.env.ES_TYPE + '/' + news._id;
		delete news._id; // es에 인덱싱할때, body에 _id를 담아서 보낼 수 없음!
		request.body = JSON.stringify(news);
		//console.log('JSON.stringify된 news의 값은..');
		//console.log(request.body);
		//console.log('JSON.stringify된 news의 값 끝!');
		//console.log('News의 값은..');
		//console.log(news);
		//console.log('News의 값끝!');
		request.headers['host'] = process.env.ES_DOMAIN;
		request.headers['Content-Type'] = 'application/json';

		var responseBody = '';
		//console.log('ES에 요청중.. 요청 설정값은 = ');
		//console.log(request);
		//console.log('ES에 요청 설정값끝!');
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
