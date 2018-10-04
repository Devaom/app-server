require('dotenv').config();
var mongoose = require('mongoose');
var News = require('./models/news');
var http = require('http');

mongoose.connect(process.env.MONGO_URI)
	.then(() => console.log('Successfully connected to MongoDB'))
	.catch(e => console.error(e));

// MongoDB에 save
// return _id

function insertNewsToMongoPromise(news) {
	return new Promise(function(resolve, reject) {
		news.save(function(error, saved_news) {
			if(error) {
				reject(error);
			} else {
				// MongoDB에서 처리되었을 때는 값이 약간 변경됨 유의
				resolve(saved_news);
			}
		})
	});
}

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

// async/await 지원을 위한 function
// newsId는 es-index queue에서 꺼내온 MongoDB의 _id
// MongoDB에서 _id에 해당하는 news를 가져온다

exports.insertNewsToMongoPromise = insertNewsToMongoPromise;
exports.getSingleNewsFromMongoByIdPromise = getSingleNewsFromMongoByIdPromise;
