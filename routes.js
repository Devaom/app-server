require('dotenv').config()
//var mongoose = require('mongoose');
var News = require('./models/news');
//var AWS = require('aws-sdk');
//var amqp = require('amqplib/callback_api');
//var http = require('http');
var mq_adapter = require('./mq-adapter');
var mongo_adapter = require('./mongo-adapter');
//var authAdapter = require('./auth-adapter');
//var fcmAdapter = require('./fcm-adapter');
var firebaseAdapter = require('./firebase-adapter');
var mysql_adapter = require('./mysql-adapter');
var es_adapter = require('./es-adapter');

// YAML 문법에 관한 샘플 https://gongzza.github.io/javascript/nodejs/swagger-node-express/ 참고하였음

/**
 * @swagger
 * definitions:
 *   News:
 *     type: object
 *     required:
 *     properties:
 *       article_id:
 *         type: string
 *         description: article id
 *         example: 0000004447
 *       article_url:
 *         type: string
 *         description: article url
 *         example: https://news.naver.com/main/read.nhn?mode=LSD&mid=sec&sid1=001&oid=089&aid=0000004447
 *       redirect_url:
 *         type: string
 *         description: redirect url
 *         example: https://news.naver.com/main/read.nhn?mode=LSD&mid=sec&sid1=001&oid=089&aid=0000004447
 *       origin_url:
 *         type: string
 *         description: origin url
 *         example: null
 *       title:
 *         type: string
 *         description: article title
 *         example: 동정
 *       body_html:
 *         type: string
 *         description: article body content
 *         example: <html><body><div id=\"articleBodyContents\">\n\n\n\n\n\t\n\t대전 국립현충원 참배 홍선기 대전시장은 2일 오전 7시30분 영렬탑과 현충원을 찾아 호국영령들에게 참배한후 2002년도 시무식을 갖는다.\r<br/><br/>올 업무추진 방향 논의 오제직 공주대총장은 2일 대학본부 회의실에서 2002년도 시무식을 갖고 주요 업무 추진 방향등에 대해 논의한다.\r<br/><br/>국립대전현충원 참배 심대평 충청남도지사는 1일 오전 계룡산 천황봉 해맞이 행사에 참석한데 이어 국립대전현충원을 참배한다.새해 추진업무등 논의 이시찬 바르게살기운동 대전광역시협의회 회장은 2일 협의회사무실에서 임원들과 함께 새해 추진업무에 대해 논의한다.<br/><br/>\n\n</div></body></html>
 *       time:
 *         type: datetime
 *         description: date and time
 *         example: 1990.01.01 10:55
 *       provider:
 *         type: string
 *         description: press
 *         example: 대전일보
 *       reporter:
 *         type: string
 *         description: 기자명 혹은 이메일
 *         example: null
 *       category:
 *         type: string
 *         description: category
 *         example: null
 *       relatedStocks:
 *         type: string
 *         description: related stock list
 *         example: [12, 34]
 *   IndexedNews:
 *     allOf:
 *       - $ref: '#/definitions/News'
 *       - type: object
 *         required: 
 *         properties:
 *           _id: 
 *             type: string
 *             description: indexed news id
 *   Users:
 *     type: object
 *     required:
 *     properties:
 *       firebase_uid:
 *         type: string
 *         description: firebase uid
 *         example: uid123
 *       device_token:
 *         type: string
 *         description: device token
 *         example: token123
 *   StockEvents:
 *     type: object
 *     required:
 *     properties:
 *       event_name:
 *         type: string
 *         description: event name
 *         example: 테스트 이벤트1
 *       event_content:
 *         type: string
 *         description: event content
 *         example: 이벤트 내용
 *       event_time:
 *         type: string
 *         description: event datetime
 *         example: 2018.12.25 12:12:12
 *       related_news_list:
 *         type: string
 *         description: related news list
 *         example: [1, 3, 223]
 *       incidents:
 *         type: string
 *         description: incidents
 *         example: ["ada", "addasdw"]
 *       links:
 *         type: string
 *         description: incidents
 *         example: ["ada", "addasdw"]
 *       extra_fields:
 *         type: string
 *         description: extra fields
 *         example: { "extra1": "엑스트라1", "extra2": "엑스트라2"}
*/

/**
 * @swagger
 * tags:
 *  - name: News
 *    description: News(which not indexed), IndexedNews(which indexed to ES)
 *  - name: Users
 *    description: User & Device information
 *  - name: StockEvents
 *    description: Stock Event
*/

/**
 * @swagger
 * paths:
 *   /news:
 *     post:
 *       tags: [News]
 *       summary: storing & indexing a news
 *       description: storing in mongodb and indexing to elasticsearch. 
 *       consume: application/json
 *       parameters:
 *         - name: body
 *           in: body
 *           description: the body of request
 *           schema:
 *             $ref: '#/definitions/News'
 *       responses:
 *         200:
 *           description: OK
 *           schema:
 *             $ref: '#/definitions/IndexedNews'
 *           content:
 *             application/json:
 */
exports.post_news = async function(req, res) {
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

	try {
		var mongo_saved_news_id = await mongo_adapter.insert_news_promise(news);
		if(mongo_saved_news_id) console.log('mongo_saved_news_id=', mongo_saved_news_id);
		
		var queue_success = await mq_adapter.publish_queue_promise('es-index', mongo_saved_news_id);
		console.log('\'es-index\' queue 성공=', queue_success);

		return res.json({
			mongo_saved_news_id: mongo_saved_news_id
		});
	} catch(error) {
		console.log('An error occured while storing and indexing a news:', error);
		return res.json({
			error: error
		});
	}
};

/**
 * @swagger
 * paths:
 *   /news/{news_id}:
 *     get:
 *       tags: [News]
 *       summary: get a news.
 *       description: get a news~!
 *       consume: application/json
 *       parameters:
 *         - name: news_id
 *           in: path
 *           description: news id
 *           required: true
 *           schema:
 *             type: string
 *           default: 5bbe7dd0fd3e5a589f872b14
 *       responses:
 *         200:
 *           description: OK
 *           schema:
 *             $ref: '#/definitions/News'
 *           content:
 *             application/json:
 */
exports.get_news_by_id = async function(req, res) {
	var news_id = req.params.news_id;
	console.log('routes.get_news_by_id 진입');
	try {
		var news = await mongo_adapter.get_news_by_id_promise(news_id);
		return res.json(news);
	} catch(error) {
		return res.json({
			error: error
		});
	}
};

/**
 * @swagger
 * paths:
 *   /news:
 *     get:
 *       tags: [News]
 *       summary: getting a news by query.
 *       description: getting a news by query.
 *       consume: application/json
 *       parameters:
 *         - name: type
 *           in: query
 *           description: latest=최신순(미지원), greater_than=last_news_id 바로 다음 뉴스부터 검색
 *           required: true
 *           schema:
 *             type: string
 *           default: greater_than
 *         - name: max_length
 *           in: query
 *           description: 가져올 뉴스 갯수
 *           required: true
 *           schema:
 *             type: string
 *           default: 10
 *         - name: last_news_id
 *           in: query
 *           description: 지난 마지막 뉴스 ID
 *           required: false
 *           schema:
 *             type: string
 *           default: 5bc094100ab3836eaceac457
 *       responses:
 *         200:
 *           description: OK
 *           schema:
 *           content:
 *             application/json:
 */
exports.get_news_by_query = async function(req, res) {
	var type = req.query.type;
	if(type == 'latest')
		return res.json({
			error: '지원하지 않아요'
		});
	else if(type != 'greater_than')
		return res.json({
			error: '그런 type은 없어요'
		});

	var max_length = parseInt(req.query.max_length);
	var last_news_id = req.query.last_news_id;
	console.log('max_length=', max_length);

	try {
		var result = await es_adapter.get_news_latest(String(max_length), last_news_id);
		console.log('result=', result);
		if(result == -1)
			return res.json({
				error: '존재하지 않는 news_id'
			});
		console.log('Successfully getting news!:', result);
		return res.json({
			result: result
		});
	} catch(error) {
		console.log('An error occured while test-retrieving..:', error);
		return res.json({
			error: error.name + ' : ' + error.message
		});
	}
}

/**
 * @swagger
 * paths:
 *   /users:
 *     post:
 *       tags: [Users]
 *       summary: creating an user.
 *       description: creating an user.
 *       consume: application/json
 *       parameters:
 *         - name: body
 *           in: body
 *           description: the body of request
 *           schema:
 *             $ref: '#/definitions/Users'
 *       responses:
 *         200:
 *           description: OK
 *           schema:
 *             $ref: '#definitions/Users'
 *           content:
 *             application/json:
 */
exports.create_user = async function(req, res) {
	var created_user = await mysql_adapter.create_user(req.body);
	return res.json({
		created_user: created_user
	});
}

/**
 * @swagger
 * paths:
 *   /users/{firebase_uid}:
 *     delete:
 *       tags: [Users]
 *       summary: deleting an user.
 *       description: deleting an user.
 *       consume: application/json
 *       parameters:
 *         - name: firebase_uid
 *           in: path
 *           description: firebase uid
 *           required: true
 *           schema:
 *             type: string
 *           default: uid123
 *       responses:
 *         200:
 *           description: OK
 *           schema:
 *           content:
 *             application/json:
 */
exports.delete_user = async function(req, res) {
	var deleted_user_count = await mysql_adapter.delete_user(req.params.firebase_uid);
	return res.json({
		deleted_user_count: deleted_user_count
	});
}

/**
 * @swagger
 * paths:
 *   /users/{firebase_uid}:
 *     get:
 *       tags: [Users]
 *       summary: getting an user by id.
 *       description: getting an user by id.
 *       consume: application/json
 *       parameters:
 *         - name: firebase_uid
 *           in: path
 *           description: firebase uid
 *           required: true
 *           schema:
 *             type: string
 *           default: uid123
 *       responses:
 *         200:
 *           description: OK
 *           schema:
 *           content:
 *             application/json:
 */
exports.get_user_by_id = async function(req, res) {
	var user = await mysql_adapter.get_user_by_id(req.params.firebase_uid);
	return res.json(user);
}

/**
 * @swagger
 * paths:
 *   /users:
 *     get:
 *       tags: [Users]
 *       summary: getting an user by query.
 *       description: getting an user by query.
 *       consume: application/json
 *       parameters:
 *         - name: type
 *           in: query
 *           description: all=모든 user 검색 * 현재는 all만 지원하는게 함정
 *           required: true
 *           schema:
 *             type: string
 *           default: all
 *       responses:
 *         200:
 *           description: OK
 *           schema:
 *           content:
 *             application/json:
 */
exports.get_user_by_query = async function(req, res) {
	var users = await mysql_adapter.get_user_by_query(req.query);
	return res.json({
		users: users
	});
}

/**
 * @swagger
 * paths:
 *   /users/{firebase_uid}/device_token:
 *     put:
 *       tags: [Users]
 *       summary: updating user's device token.
 *       description: updating user's device token.
 *       consume: application/json
 *       parameters:
 *         - name: firebase_uid
 *           in: path
 *           description: firebase uid
 *           required: true
 *           schema:
 *             type: string
 *           default: uid123
 *         - name: body
 *           in: body
 *           description: specify device token.
 *           required: true
 *           example:
 *             device_token: dYIoUSIqYg0:APA91bGvWgvybfC4eXhWRgdwJxa8FgU1brHdNL_KdjgMOSR4LJwLK3lqTXj0sQSKB0zyu07yhwV_o3hJQM-jU8jceRnDPA6NOp_ay-dXIgVnHbuiwal0mEWcsxaw0LMuOccgbMbhC6Cx
 *       responses:
 *         200:
 *           description: OK
 *           schema:
 *           content:
 *             application/json:
 */
exports.update_user_device_token = async function(req, res) {
	var firebase_uid = req.params.firebase_uid;	
	var device_token = req.body.device_token;
	try {
		var updated_users_count = await mysql_adapter.update_user_device_token(firebase_uid, device_token);
		return res.json({
			updated_users_count: updated_users_count[0]
		});
	} catch (error) {
		console.log('An error occured while updating device token:', error);
		return res.json({
			error: error
		});
	}
}

/**
 * @swagger
 * paths:
 *   /stock_events:
 *     post:
 *       tags: [StockEvents]
 *       summary: creating stock event
 *       description: creating stock event
 *       consume: application/json
 *       parameters:
 *         - name: body
 *           in: body
 *           description:
 *           required: true
 *           schema:
 *             $ref: '#/definitions/StockEvents'
 *       responses:
 *         200:
 *           description: OK
 *           schema:
 *           content:
 *             application/json:
 */
exports.create_stock_event = async function(req, res) {
	var stock_event = req.body;
	var result = await mysql_adapter.insert_stock_event(stock_event);
	return res.json(result);
}

/**
 * @swagger
 * paths:
 *   /stock_events/{stock_event_id}/extra_fields:
 *     put:
 *       tags: [StockEvents]
 *       summary: stock event의 extra_fields 필드 수정을 위한 API
 *       description: stock event의 extra fields 필드 수정을 위한 API
 *       consume: application/json
 *       parameters:
 *         - name: stock_event_id
 *           in: path
 *           description: stock event id
 *           required: true
 *           schema:
 *             type: string
 *           default: default_stock_event_id
 *         - name: body
 *           in: body
 *           description: 수정할 extra_fields
 *           required: true
 *           example:
 *             extra_fields: 
 *               extra_test1: 엑스트라 테스트1
 *               extra_test2: 엑스트라 테스트2
 *       responses:
 *         200:
 *           description: OK
 *           schema:
 *           content:
 *             application/json:
 */
exports.update_stock_event_extra_fields = async function(req, res) {
	var modify_extra_fields = req.body;
	var stock_event_id = req.params.stock_event_id;
	var updated_stock_event_count = await mysql_adapter.update_stock_event_extra_fields(stock_event_id, modify_extra_fields);
	var result = {
		updated_stock_event_count: updated_stock_event_count
	}
	return res.json(result);
}

/**
 * @swagger
 * paths:
 *   /stock_events/{stock_event_id}:
 *     get:
 *       tags: [StockEvents]
 *       summary: getting an stock event by id.
 *       description: getting an stock event by id.
 *       consume: application/json
 *       parameters:
 *         - name: stock_event_id
 *           in: path
 *           description: stock event id
 *           required: true
 *           schema:
 *             type: string
 *           default: default_stock_event_id
 *       responses:
 *         200:
 *           description: OK
 *           schema:
 *           content:
 *             application/json:
 */
exports.get_stock_event_by_id = async function(req, res) {
	var stock_event_id = req.params.stock_event_id;
	var result = await mysql_adapter.get_stock_event_by_id(stock_event_id);
	return res.json(result);
}

/**
 * @swagger
 * paths:
 *   /stock_events:
 *     get:
 *       tags: [StockEvents]
 *       summary: getting stock events by query.
 *       description: getting stock events by query.
 *       consume: application/json
 *       parameters:
 *         - name: type
 *           in: query
 *           description: all=모든 stock event 검색, daily=일별, weekly=주별, monthly=월별
 *           required: true
 *           schema:
 *             type: string
 *           default: daily
 *         - name: query_date
 *           in: query
 *           description: type=daily, weekly, monthly 일 때, 검색할 날자를 지정
 *           required: false
 *           schema:
 *             type: string
 *           default: '2017-10-01'
 *         - name: max_length
 *           in: query
 *           description: (사용X) max length
 *           required: false
 *           schema:
 *             type: string
 *           default: 10
 *       responses:
 *         200:
 *           description: OK
 *           schema:
 *           content:
 *             application/json:
 */
exports.get_stock_event_by_query = async function(req, res) {
	var query_type = req.query.type;
	var query_date = req.query.query_date;
	var max_length = req.query.max_length;
	if(query_type != 'all' && query_type != 'daily' && query_type != 'weekly' && query_type != 'monthly')
		return res.json({
			error: 'all type만 지원함'
		});

	try {
		var result = await mysql_adapter.get_stock_event_by_query(query_type, query_date, max_length);
		console.log('result=', result);
		return res.json(result);

	} catch(error) {
		return res.json({
			error: error.name + ' : ' + error.message
		});
	}
}

/**
 * @swagger
 * paths:
 *   /stock_events/{stock_event_id}:
 *     delete:
 *       tags: [StockEvents]
 *       parameters:
 *         - name: stock_event_id
 *           in: path
 *           description:
 *           required: true
 *           schema:
 *             type: string
 *           default: default_news_id
 *       responses:
 *         200:
 *           description: OK
 *           schema:
 *           content:
 *             application/json:
 */
exports.delete_stock_event_by_id = async function(req, res){
	var stock_event_id = req.params.stock_event_id;
	var deleted_stock_count = await mysql_adapter.delete_stock_event_by_id(stock_event_id);
	return res.json({
		deleted_stock_count: deleted_stock_count		
	});
}

/*
exports.delete_stock_events = async function(req, res) {
	var stock_event_id = req.params.stock_event_id;
	var deleted_stock_count = await mysql_adapter.delete_stock_events(stock_event_id);
	
	var result = {
		deleted_stock_count: deleted_stock_count
	}
	return res.json(result);
}
*/




/*
app.post('/stock_events', function(req, res) {
	routes.create_stock_event(req, res);
});

app.put('/stock_events/:stock_event_id', function(req, res) {
	routes.update_stock_event_extra_fields(req, res);
});

app.get('/stock_events/:stock_event_id', function(req, res) {
	routes.get_stock_events(req, res);
});

app.delete('/stock_events/:stock_event_id', function(req, res) {
	routes.delete_stock_events(req, res);
});

// deprecated
app.put('/register_token/:firebase_uid', function(req, res) {
	console.log('[PUT /register_token/:' + req.params.firebase_uid + '] QUERY: ' + JSON.stringify(req.body));
	routes.register_token(req, res);
});
*/

/*
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
*/

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

/*
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
*/
