require('dotenv').config();
var amqp = require('amqplib/callback_api');

console.log('analysis-agent loaded.');

//////////////////////////////////////////////////
// submitting a job to emr(spark) through queue //
//////////////////////////////////////////////////

function addStepToEMR(){
	return new Promise(function(resolve, reject) {
		// submit a job to spark
	})
}

amqp.connect(process.env.RABBITMQ_AMQP_DOMAIN, function(err, conn) {
    if(err) {
        console.log(err);
    }

    conn.createChannel(function(err, ch) {
		if(err){
			console.log(err);
		}

		// spark-analysis queue에서 news의 id 가져오고,
		// MongoDB or Elasticsearch에서 해당 News 가져와서 작업 제출
		// MongoDB에서 해당 News 가져와서 indexing
		ch.consume('spark-analysis', async function(msg) {
			try{
				// MongoDB에서 news_id를 기준으로 News를 가져오기
				var news_id = msg.content.toString();
				var news = await getNewsFromMongoById(news_id);
				console.log('MongoDB에서 가져온 뉴스 = ' + JSON.stringify(news));

				// News를 ES로 전송하여 indexing하기
				var es_response = await indexNews(news);
				if(es_response.body.data) es_response.body.data = new Buffer(es_response.body.data).toString();
				console.log('ElasticSearch에서 처리된 응답 = ' + JSON.stringify(es_response));
			} catch (error) {
				console.log('an error occured while processing ch.consume()');
				console.log(error);
			}
		}, {noAck: true});
	});
});








/////////////////////////////////////////////
// submitting a job to emr(spark) directly //
/////////////////////////////////////////////








/////////////////////////
// index-ageny.js code //
/////////////////////////

var AWS = require('aws-sdk');
var http = require('http');

console.log('index-agent loaded.');

// async/await 지원을 위한 function
// newsId는 es-index queue에서 꺼내온 MongoDB의 _id
// MongoDB에서 _id에 해당하는 news를 가져온다
function getNewsFromMongoById(news_id) {

	var options = {
		hostname: process.env.NGINX_URI,
		port: '80',
		path: '/api/news/' + news_id,
		method: 'GET'
	};

	return new Promise(function(resolve, reject) {
		http.request(options, function(response) {
			var responseBody = '';
			response.on('data', function(chunk){
				responseBody += chunk;
			});

			response.on('end', function() {
				//console.log('뉴스를 다 받아옴!');
				//console.log('responseBody는.. ' + responseBody);
				
				responseBody = JSON.parse(responseBody);
				//responseBody.time = new Date(responseBody.time).toISOString().replace(/T/, ' ').replace(/\..+/, '').replace(/-/, '.');
				//responseBody.time = new Date(responseBody.time).toISOString().replace(/T/, ' ').replace(/\..+/, '').replace(/-/gi, '.');
				responseBody.time = new Date(responseBody.time)
										.toISOString()
										.replace(/T/, ' ')
										.replace(/\..+/, '')
										.replace(/-/gi, '.')
										.replace(/(\s\d\d:\d\d):\d\d/, '$1');
				resolve(responseBody);
			});
		}).end();
	})
}

function indexNews(news) {
	return new Promise(function(resolve, reject) {
		var endpoint = new AWS.Endpoint(process.env.ES_DOMAIN)
		var request = new AWS.HttpRequest(endpoint, process.env.ES_REGION);
		request.method = 'PUT';
		request.path += process.env.ES_INDEX + '/' + process.env.ES_TYPE + '/' + news._id;
		delete news._id;
		request.body = JSON.stringify(news);
		console.log('JSON.stringify된 news의 값은..');
		console.log(request.body);
		console.log('JSON.stringify된 news의 값 끝!');
		console.log('News의 값은..');
		console.log(news);
		console.log('News의 값끝!');
		request.headers['host'] = process.env.ES_DOMAIN;
		request.headers['Content-Type'] = 'application/json';

		var responseBody = '';
		console.log('ES에 요청중.. 요청 설정값은 = ');
		console.log(request);
		console.log('ES에 요청 설정값끝!');
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

amqp.connect(process.env.RABBITMQ_AMQP_DOMAIN, function(err, conn) {
    if(err) {
        console.log(err);
    } else {
	    console.log('정상');
	}

    conn.createChannel(function(err, ch) {
		if(err){
			console.log(err);
		}

		// es-index queue에서 news의 id 가져오고,
		// MongoDB에서 해당 News 가져와서 indexing
		ch.consume('es-index', async function(msg) {
			try{
				// MongoDB에서 news_id를 기준으로 News를 가져오기
				var news_id = msg.content.toString();
				var news = await getNewsFromMongoById(news_id);
				console.log('MongoDB에서 가져온 뉴스 = ' + JSON.stringify(news));

				// News를 ES로 전송하여 indexing하기
				var es_response = await indexNews(news);
				if(es_response.body.data) es_response.body.data = new Buffer(es_response.body.data).toString();
				console.log('ElasticSearch에서 처리된 응답 = ' + JSON.stringify(es_response));
			} catch (error) {
				console.log('an error occured while processing ch.consume()');
				console.log(error);
			}
		}, {noAck: true});
	});
});

/*
amqp.connect(process.env.RABBITMQ_AMQP_DOMAIN, function(err, conn) {
    if(err) {
        console.log(err);
    } else {
	    console.log('정상');
	}

    conn.createChannel(function(err, ch) {
		if(err){
			console.log(err);
		}

        ch.consume('es-index', async function(msg) {
            console.log(' [x] Received %s', msg.content.toString());

			//mongodb에서 _id의 news를 가져온다
			var endpoint = new AWS.Endpoint(process.env.ES_DOMAIN)
			var request = new AWS.HttpRequest(endpoint, process.env.ES_REGION);
			request.method = 'PUT';
			request.path += process.env.ES_INDEX + '/' + process.env.ES_TYPE + '/' + msg.content.toSring();
			request.body = JSON.stringify(req.body);
			request.headers['host'] = process.env.ES_DOMAIN;
			request.headers['Content-Type'] = 'application/json';
			
			var client = new AWS.HttpClient();
			var responseBody = '';
			await client.handleRequest(request, null, function(response) {
				response.on('data', function(chunk) {
					responseBody += chunk;
				});
				response.on('end', function(chunk) {
					console.log('last Chunk: ' + chunk);

					var es_response = {
						elasticsearch_response: {
							statusCode: response.statusCode,
							statusMessage: response.statusMessage,
							responseBody: responseBody
						}
					}
					if(response.statusCode >= 300) {
						es_response.success = false;
						reject(es_response);
					} else { 
						es_response.success = true;
						return res.json(es_response);
					}
				});
			}, function(err) {
				var es_response = {
					success: false,
					elasticsearch_response: err
				}
				reject(es_response);
				console.log('an err occured');
			});	
			// mongodb에서 _id의 news를 가져왔다
			responseBody
			console.log('');
        }, {noAck: true});
    });
})
*/
