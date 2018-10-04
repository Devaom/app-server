require('dotenv').config()
var mongoose = require('mongoose');
var News = require('./models/news');
var AWS = require('aws-sdk');
var amqp = require('amqplib/callback_api');
var http = require('http');
var mqAdapter = require('./mq-adapter');
var mongoAdapter = require('./mongo-adapter');

exports.postNews = async function(req, res) {
	var news = new News();
	news.article_id = req.body.article_id;
	news.article_url = req.body.article_url;
	news.redirect_url = req.body.redirect_url;
	news.origin_url = req.body.origin_url;
	news.title = req.body.title;
	news.body_html = req.body.body_html;
	news.time = req.body.time;
	news.provider = req.body.provider;
	news.reporter = req.body.reporter;
	news.category = req.body.category;
	news.relatedStocks = req.body.relatedStocks;

	var mongo_saved_news = await mongoAdapter.insertNewsToMongoPromise(news);
	var queue_success = await mqAdapter.publishQueuePromise('es-index', mongo_saved_news._id);

	return res.json({
		mongo_saved_news: mongo_saved_news,
		queue_success: queue_success
	});
};

/*
function func1() {
	return new Promise(function(resolve, reject) {
		resolve({a: 1, b: 2});
	})
}

function func2(json) {
	return new Promise(function(resolve, reject) {
		delete json.a;
		console.log(json);
		resolve();
	})
}

var testFunc = async function() {
	var json = await func1();
	console.log(json); // json 값이 정상적으로 출력
	await func2(json); // 
}

testFunc();
*/

/*
// MONGODB 적재 -> 'es-index' queue에 publish하는 설계상의 시나리오
exports.postNews2 = function(req, res){
    console.log('postNews2 called!');

	var news = new News();
	news.article_id = req.body.article_id;
	news.article_url = req.body.article_url;
	news.redirect_url = req.body.redirect_url;
	news.origin_url = req.body.origin_url;
	news.title = req.body.title;
	news.body_html = req.body.body_html;
	news.time = req.body.time;
	news.provider = req.body.provider;
	news.reporter = req.body.reporter;
	news.category = req.body.category;
	news.relatedStocks = req.body.relatedStocks;

	// MONGODB에 적재하고,
	// MONGODB에서 적재된 news의 _id를 받아온다.
	// news의 _id를 queue에 발행한다.
	
	return new Promise(function(resolve, reject){
				news.save(function(err, obj){
						if(err) {
							reject({success: false,
									error: err});
						} else {
							// publish to rabbitmq
							//obj._id = new Buffer(String(obj._id));
							resolve(obj);
						}
					});
			})
			.then(function(obj){
				// publish to es-index queue
				//return mqAgent.publishQueuePromise('es-index', obj._id); // 추후에 처리해보기.
				return new Promise(function(resolve, reject) {
							amqp.connect(process.env.RABBITMQ_AMQP_DOMAIN, function(err, conn) {
								if(err) {
									console.log('an error occured while publishing to queue "es-index"');
									console.log(err);
								}
								conn.createChannel(function(err, ch) {
									if(err) {
										console.log(err);
										reject(err);
									} else {
										var value = new Buffer(String(obj._id));
										resolve(ch.sendToQueue('es-index', value));
									}
								})
							});
						})
			})
			.then(function(test) {
				console.log(test)
				var response = {test_success: test};
				return res.json(response);
			})
			.catch(function(error) {
				console.log(error)
				var response = {test_response: error};
				return res.json(response);
			});
}
*/

/*
// async/await 지원을 위한 function
// newsId는 es-index queue에서 꺼내온 MongoDB의 _id
// MongoDB에서 _id에 해당하는 news를 가져온다
exports.getNewsFromMongoByIdPromise = function(news_id) {
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
				console.log('MongoDB에서 받아온 responseBody: ' + String(responseBody));
				responseBody = JSON.parse(responseBody);
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
*/

/*
// 현재는 바로 ES로 적재하는 시나리오
exports.postNews = function(req, res){
	console.log('postNews called');
	var news = new News();
	
	news.article_id = req.body.article_id;
	news.article_url = req.body.article_url;
	news.redirect_url = req.body.redirect_url;
	news.origin_url = req.body.origin_url;
	news.title = req.body.title;
	news.body_html = req.body.body_html;
	news.time = req.body.time;
	news.provider = req.body.provider;
	news.reporter = req.body.reporter;
	news.category = req.body.category;
	news.relatedStocks = req.body.relatedStocks;

    return new Promise(function(resolve, reject){
		news.save(function(err, obj){
			if(err){
				reject({
					success: false,
					error: err
				});
				//reject(err);
			} else{
				// activemq로 publish해야함. 현재는 그냥 바로 ES로 하기로.
				//return res.json({success: true, god: obj});
				resolve(obj);
			}
		});
	})
    .then(function(obj){
		// ES에 인덱싱
		// 인덱싱 되었다는 응답을 받고나서 넘겨주어야 함
		var endpoint = new AWS.Endpoint(process.env.ES_DOMAIN)
		var request = new AWS.HttpRequest(endpoint, process.env.ES_REGION);
		request.method = 'PUT';
		request.path += process.env.ES_INDEX + '/' + process.env.ES_TYPE + '/' + obj._id;
		request.body = JSON.stringify(req.body);
		request.headers['host'] = process.env.ES_DOMAIN;
		request.headers['Content-Type'] = 'application/json';
		
		var client = new AWS.HttpClient();
		client.handleRequest(request, null, function(response) {
			var responseBody = '';
			response.on('data', function(chunk) {
				responseBody += chunk;
			});
			response.on('end', function(chunk) {
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
		});
    })
	.catch(function(err){
		console.error(err);
		return res.json(err);
	})
}
*/

/////////////////// 요 아래는 나중에 필드값 수정 필요! ////////

exports.putNews = function(req, res){
	News.findById(req.params.news_id, function(err, news){
		if(err) return res.status(500).json({ error: 'database failure' });
		if(!news) return res.status(404).json({ error: 'news not found' });

		if(req.body.title) news.title = req.body.title;
		if(req.body.pubDate) news.pubDate = req.body.pubDate;
		if(req.body.pubTime) news.pubTime = req.body.pubTime;
		if(req.body.body) news.body = req.body.body;
		if(req.body.reporter) news.reporter = req.body.reporter;
		if(req.body.press) news.press = req.body.press;
		if(req.body.category) news.category = req.body.category;
		if(req.body.relatedStocks) news.relatedStocks = req.body.relatedStocks;

		news.save(function(err){
			if(err){
				return res.status(500).json({error: 'failed to update'});
			} else {
				return res.json({message: 'news updated'});
			}
		});
	});
}

exports.getNewsQuery = function(req, res){
	News.find(function(err, news){
		if(err){
			return res.status(500).send({error:'database failure'});
		} else {
			return res.json(news);
		}
	});
}

exports.getNewsById = function(req, res){
	News.findOne({_id: req.params.news_id}, function(err, news){
		if(err) return res.status(500).json({error: err});
		if(!news) return res.status(404).json({error: 'news not found'});
		return res.json(news);
	});
}

exports.deleteNewsById = function(req, res){
	News.deleteOne({ _id: req.params.news_id }, function(err, output){
		if(err) return res.status(500).json({ error: "database failure" })
		if(!output.n) return res.status(404).json({ error: "news not found" });
		return res.json({ message: "news deleted", output: output });
	});
}
