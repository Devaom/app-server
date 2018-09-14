var mongoose = require('mongoose');
var News = require('./models/news');

mongoose.connect(process.env.MONGO_URI)
	.then(() => console.log('Successfully connected to mongodb'))
	.catch(e => console.error(e));

exports.postNews = function(req, res){
	console.log('postNews called');
	var news = new News();
	news.title = req.body.title;
	news.pubDate = req.body.pubDate;
	news.pubTime = req.body.pubTime;
	news.body = req.body.body;
	news.reporter = req.body.reporter;
	news.press = req.body.press;
	news.relatedStocks = req.body.relatedStocks;

	news.save(function(err, obj){
		if(err){
			console.error(err);
			return res.json({success: false});
			//var result = {result: 0};
			//return result;
		} else{
			//var result = {result: 1};
			//return result;
			return res.json({success: true, god: obj});
		}
	});
}

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
