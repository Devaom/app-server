require('dotenv').config();
require('./mq-agent');

var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var routes = require('./routes');
var port = process.env.PORT;

app.use(bodyParser.urlencoded({ extended: true}));
app.use(bodyParser.json());

app.get('/', async function(req, res) {
	console.log('[GET /] Param: req.query = ' + JSON.stringify(req.query));

	return await res.json({
		NodeAngel : 'Ho!'
	});
});

// 뉴스 검색기능
app.get('/news', function(req, res){
	console.log('[GET /news] QUERY: ' + JSON.stringify(req.query));
	routes.getNewsQuery(req, res);
});

// ID 기준으로 뉴스 가져오기
app.get('/news/:news_id', function(req, res){
	console.log('[GET /news/:' + req.params.news_id + '] QUERY: ' + JSON.stringify(req.query));
	// query는 url 뒤의 값들.
	// params는 news_id와 같은 uri의 값
	routes.getNewsById(req, res);
});

app.post('/news', function(req, res){
	console.log('[POST /news] BODY: ' + JSON.stringify(req.body));
	routes.postNews(req, res);
	//dbAdapter.postNews2(req, res);
	//dbAdapter.postNews(req, res);
});

app.put('/news/:news_id', function(req, res){
	console.log('[PUT /news/:' + req.params.news_id + '] BODY: ' + JSON.stringify(req.body));
	routes.putNews(req, res);
});

app.delete('/news/:news_id', function(req, res){
	console.log('[DELETE /news/:' + req.params.news_id + '] QUERY: ' + JSON.stringify(req.query));
	routes.deleteNewsById(req, res);
});

app.listen(port, function(){
	console.log('Express server has started on port ' + port);
});
// end of the code
