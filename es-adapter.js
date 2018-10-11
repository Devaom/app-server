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

exports.get_news_latest = function(max_length, last_news_id) {
	// start_news_id 이후 max_length 만큼의 뉴스기사를 받아온다
	// start_news_id가 없으면 그냥 가장 최신의 기사를 max_length 만큼 받아온다
	return new Promise(async function(resolve, reject) {
		var endpoint = new AWS.Endpoint(ES_DOMAIN_V2)
		var request = new AWS.HttpRequest(endpoint, ES_REGION);
		request.method = 'POST';
		request.path += ES_INDEX + '/' + ES_TYPE + '/_search';
		//request.path += '?filter_path=hits.hits._source'
		//request.path += process.env.ES_INDEX + '/_search';

		var last_news_time = await get_news_time(last_news_id);
		console.log('last_news_time=', last_news_time);

		request.body = JSON.stringify({
			query: {
				range: {
					time: {
						gt: last_news_time
					}
				}
			},
			sort: [
				{ time: { order: 'asc' } }
			],
			size: max_length
		});

		request.headers['host'] = ES_DOMAIN_V2;
		request.headers['Content-Type'] = 'application/json';

		var response_body = '';
		var client = new AWS.HttpClient();
		client.handleRequest(request, null, function(response) {
			response.on('data', function(chunk) {
				response_body += chunk;
			});

			response.on('end', function() {
				response_body = JSON.parse(response_body);
				resolve(convert_standard(response_body));
			});
		}, function(error) {
			reject(error);
		});
	});
}

// es 응답 형식을 우리 프로젝트 응답형식으로 변환하기
function convert_standard(es_response){
	var documents = es_response.hits.hits;
	var converted = [];

	documents.forEach(function(document) {
		document._source._id = document._id;
		converted.push(document._source);
	});

	return converted;
}

function get_news_time(news_id) {
	return new Promise(function(resolve, reject) {
		var endpoint = new AWS.Endpoint(ES_DOMAIN_V2)
		var request = new AWS.HttpRequest(endpoint, ES_REGION);
		request.method = 'POST';
		request.path += ES_INDEX + '/' + ES_TYPE + '/_search';
		//request.path += '?filter_path=hits.hits._source'
		//request.path += process.env.ES_INDEX + '/_search';

		// news_id에 해당하는 time을 가져와야 함
		request.body = JSON.stringify({
			_source: ["time"], // 요 필드만 가져올거임
			query: {
				match: {
					_id: news_id
				}
			}
		});
		
		/*
		request.body = JSON.stringify({
			query: {
				match_all: {}
			},
			sort: [
				{ time: { order: 'desc' } }
			]
		});
		*/

		request.headers['host'] = ES_DOMAIN_V2;
		request.headers['Content-Type'] = 'application/json';

		var response_body = '';
		var client = new AWS.HttpClient();
		client.handleRequest(request, null, function(response) {
			response.on('data', function(chunk) {
				response_body += chunk;
			});

			response.on('end', function() {
				response_body = JSON.parse(response_body);
				var time = response_body.hits.hits[0]._source.time;
				//time = new Date(time); // 이걸 지우면 그냥 es에 적재된 포맷 그대로
				resolve(time);
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
