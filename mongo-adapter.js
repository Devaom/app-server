require('dotenv').config();
var mongoose = require('mongoose');
var News = require('./models/news');

mongoose.connect(process.env.MONGO_URI)
	.then(() => console.log('Successfully connected to MongoDB'))
	.catch(e => console.error(e));

// MongoDB에 save
// return _id

function insertNewsToMongoPromise(news){
	return new Promise(function(resolve, reject) {
		news.save(function(error, saved_news) {
			if(err) {
				reject(error);
			} else {
				// MongoDB에서 처리되었을 때는 값이 약간 변경됨 유의
				resolve(saved_news);
			}
		})
	});
}

exports.insertNewsToMongoPromise = insertNewsToMongoPromise;
