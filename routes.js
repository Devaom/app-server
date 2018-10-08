require('dotenv').config()
var mongoose = require('mongoose');
var News = require('./models/news');
var AWS = require('aws-sdk');
var amqp = require('amqplib/callback_api');
var http = require('http');
var mqAdapter = require('./mq-adapter');
var mongoAdapter = require('./mongo-adapter');
//var authAdapter = require('./auth-adapter');
//var fcmAdapter = require('./fcm-adapter');
var firebaseAdapter = require('./firebase-adapter');
var mysqlAdapter = require('./mysql-adapter');

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

exports.register_token2 = async function(req, res) {
	// firebase_uid를 날릴 수 있다고 하는데..
	// 날릴때, deviceToken값과 같은지 확인할 것.
	var firebase_uid = req.params.firebase_uid;
	//var device_token = req.body.device_token;
	var device_token = 'dYIoUSIqYg0:APA91bGvWgvybfC4eXhWRgdwJxa8FgU1brHdNL_KdjgMOSR4LJwLK3lqTXj0sQSKB0zyu07yhwV_o3hJQM-jU8jceRnDPA6NOp_ay-dXIgVnHbuiwal0mEWcsxaw0LMuOccgbMbhC6Cx';

	console.log('firebase_uid = ' + firebase_uid + ', device_token = ' + device_token);
	try {
		if(await firebaseAdapter.checkTokenAndUID(device_token, firebase_uid))
			console.log('device_token에서 얻어낸 uid가 firebase_uid와 같음');
		else
			console.log('device_token에서 얻어낸 uid가 firebase_uid와 다름');
	} catch (error) {
		console.log('An error occured while checking token..:', error);
	}

	try {
		var fb_result = await firebaseAdapter.send(device_token, '테스트임 무시하셈', '테스트임 무시해도됨');
	} catch (error) {
		console.log('An error occured while sending message..:', error);
	}

	var response = {
		fb_result: fb_result
	}

	console.log('result = ' + JSON.stringify(response));

	return res.json(response);
}

// firebase_uid에 해당하는 user에 device_token 매핑하기
exports.register_token = async function(req, res) {
	var firebase_uid = req.params.firebase_uid;	
	var device_token = req.body.device_token;

	// DB에서 firebase_uid에 해당하는 user의 device_token 변경
	try {
		var resultsAndFields = await mysqlAdapter.update_user_device_token(firebase_uid, device_token);
		return res.json({
			success: 'I dunno',
			resultsAndFields: resultsAndFields
		});
	} catch (error) {
		var msg = 'An error occured while modifying user device token: ' + String(error);
		console.log(msg);
		return res.json({
			success: false,
			result: msg
		});
	}
}

exports.create_stock_event = async function(req, res) {
	var stock_event = req.body;
	var result = await mysqlAdapter.insert_stock_event(stock_event);
	return res.json(result);
}

exports.update_stock_event_extra_fields = async function(req, res) {
	var modify_extra_fields = req.body;
	var stock_event_id = req.params.stock_event_id;
	var result = await mysqlAdapter.update_stock_event_extra_fields(stock_event_id, modify_extra_fields);
	return res.json(result);
}

exports.get_stock_events = async function(req, res) {
	var stock_event_id = req.params.stock_event_id;
	var query_date = req.query.query_date;
	var result = await mysqlAdapter.select_stock_events(stock_event_id, query_date);
	return res.json(result);
}

exports.delete_stock_events = async function(req, res) {
	var stock_event_id = req.params.stock_event_id;
	var result = await mysqlAdapter.delete_stock_events(stock_event_id);
	return res.json(result);
}

/*
app.post('/user', function(req, res) {
	// user 신규 등록
	routes.createUser(req, res);
});

app.put('/user/:firebase_uid', function(req, res) {
	// token 등록할 때도 쓰고.
	routes.modifyUser(req, res);
});

// firebase_uid에 device_token 매핑
app.put('/users/:firebase_uid/device_token', function(req, res) {
	routes.register_token(req, res);
});
*/







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
