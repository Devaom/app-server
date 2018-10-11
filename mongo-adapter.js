require('dotenv').config();
var mongoose = require('mongoose');
var News = require('./models/news');
var http = require('http');

mongoose.connect(process.env.MONGO_URI)
	.then(() => console.log('Successfully connected to MongoDB'))
	.catch(e => console.error(e));

exports.get_news_latest = function(max_length) {
	console.log('get_news_latest 진입');
	return new Promise(function(resolve, reject) {
		//resolve({abcd:'1234'});

		//News.find({}).limit(max_length).sort({time: -1}).exec(function(error, docs) {
		News.find({}).limit(max_length).exec(function(error, docs) {
			if(error) {
				reject(error);
			} else {
				resolve(docs);
			}
		});
	});
}

// V2 * RETURN NEWS ID(MONGO ASSIGNED) *
exports.insert_news_promise = function(news) {
	return new Promise(function(resolve, reject) {
		news.save(function(error, saved_news) {
			if(error) {
				reject(error);
			} else {
				// saved_news는 Mongo Document 객체임. 그래서 delete 연산자로 내부 값을 지울 수 없음. 유의
				// MongoDB에서 처리되었을 때는 값이 약간 변경됨 유의
				//console.log('mongo_saved_news=', saved_news);
				resolve(saved_news._id); // saved_news를 사용하지 말고 get_news_by_id_promise로 가져와서 사옹할 것
			}
		})
	});
}

// V2 * RETURN NEWS OBJECT *
exports.get_news_by_id_promise = function(news_id) {
	return new Promise(function(resolve, reject) {
		News.findOne({
			_id: {$eq: news_id}
		}).exec(function(error, news) {
			if(error) {
				console.log('An error occured while finding a news in mongo:', error);
				reject(error);
			} else {
				news = news.toJSON(); // 추후에 내부의 프로퍼티(_id, time)를 지우거나 수정하기 위해
				delete news.__v;
				news.time = new Date(news.time)
								.toISOString()
								.replace(/T/, ' ')
								.replace(/\..+/, '')
								.replace(/-/gi, '.')
								//.replace(/(\s\d\d:\d\d):\d\d/, '$1');
				resolve(news);
			}
		});
	});
}

/*
function insertNewsToMongoPromise(news) {
	return new Promise(function(resolve, reject) {
		news.save(function(error, saved_news) {
			if(error) {
				reject(error);
			} else {
				// saved_news는 Mongo Document 객체임. 그래서 delete 연산자로 내부 값을 지울 수 없음. 유의
				// MongoDB에서 처리되었을 때는 값이 약간 변경됨 유의
				console.log('mongo_saved_news=', saved_news);
				resolve(saved_news.toJSON());
			}
		})
	});
}
*/

/*
// MongoDB에 들어갈 때 time의 값이 달라지므로 변환해서 가져오도록 한다
function getSingleNewsFromMongoByIdPromise(news_id) {
	return new Promise(function(resolve, reject) {
		var options = {
			hostname: process.env.NGINX_URI,
			port: '80',
			path: '/api/news/' + news_id,
			method: 'GET'
		};

		http.request(options, function(response) {
			var responseBody = '';
			response.on('data', function(chunk){
				responseBody += chunk;
			});

			response.on('end', function() {
				console.log('MongoDB에서 받아온 responseBody: ' + String(responseBody));
				var news = JSON.parse(responseBody);
				news.time = new Date(news.time)
										.toISOString()
										.replace(/T/, ' ')
										.replace(/\..+/, '')
										.replace(/-/gi, '.')
										.replace(/(\s\d\d:\d\d):\d\d/, '$1');
				resolve(news);
			});
		}).end();
	});
}

exports.insertNewsToMongoPromise = insertNewsToMongoPromise;
exports.getSingleNewsFromMongoByIdPromise = getSingleNewsFromMongoByIdPromise;
*/
