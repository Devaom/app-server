require('dotenv').config();
var AWS = require('aws-sdk');
var ES_TYPE = process.env.ES_TYPE;
var ES_INDEX = process.env.ES_INDEX;
var ES_REGION = process.env.ES_REGION;
var ES_DOMAIN_V2 = process.env.ES_DOMAIN_V2;
var endpoint = new AWS.Endpoint(process.env.ES_DOMAIN_V2);

// 얘를 호출할때 news 객체에 _id 값을 지우고 파라미터에 넣기!!
// delete news._id; // es에 인덱싱할때, body에 _id를 담아서 보낼 수 없음. url 변수에 넣었음.
exports.index_news_promise = function(news, news_id) {
	return new Promise(function(resolve, reject) {
		var request = new AWS.HttpRequest(endpoint, ES_REGION);
		request.method = 'PUT';
		request.path += ES_INDEX + '/' + ES_TYPE + '/' + news_id;
		request.body = JSON.stringify(news);
		request.headers['host'] = ES_DOMAIN_V2;
		request.headers['Content-Type'] = 'application/json';

		var response_body = '';
		var client = new AWS.HttpClient();
		client.handleRequest(request, null, function(response) {
			response.on('data', function(chunk) {
				response_body += chunk;
			});
			response.on('end', function() {
				resolve(JSON.parse(response_body));
				/*
				var result = {
					headers: {
						code: response.statusCode,
						message: response.statusMessage
					},
					body: JSON.parse(responseBody)
				};
				resolve(result);
				*/
			});
		}, function(error) {
			reject(error);
		})
	});
}

exports.indexNewsPromise = function(news) {
	return new Promise(function(resolve, reject) {
		//var endpoint = new AWS.Endpoint(process.env.ES_DOMAIN)
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
				responseBody += chunk;
			});
			response.on('end', function() {
				var result = {
					headers: {
						code: response.statusCode,
						message: response.statusMessage
					},
					body: JSON.parse(responseBody)
				};
				resolve(result);
			});
		}, function(error) {
			reject(error);
		})
	})
}

exports.get_news_latest = function(max_length) {
	return new Promise(function(resolve, reject) {
		var endpoint = new AWS.Endpoint(process.env.ES_DOMAIN)
		var request = new AWS.HttpRequest(endpoint, process.env.ES_REGION);
		request.method = 'POST';
		request.path += process.env.ES_INDEX + '/' + process.env.ES_TYPE + '/_search';
		//request.path += process.env.ES_INDEX + '/_search';

		request.body = JSON.stringify({
			query: {
				/*
				match: {
					title: '동정'
				}
				*/
			},
			sort: [
				{ time: { order: 'desc' } }
			]
		});

		request.headers['host'] = process.env.ES_DOMAIN;
		request.headers['Content-Type'] = 'application/json';

		var response_body = '';
		var client = new AWS.HttpClient();
		client.handleRequest(request, null, function(response) {
			response.on('data', function(chunk) {
				response_body += chunk;
			});

			response.on('end', function() {
				resolve({
					headers: {
						code: response.statusCode,
						message: response.statusMessage
					},
					body: JSON.parse(response_body)
				});
			});

		}, function(error) {
			reject(error);
		});
	});
}

/*
exports.get_news_by_query = function() {
	return new Promise(function(resolve, reject) {
		
	});
}
*/
