require('dotenv').config();
var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var dbAdapter = require('./db-adapter');
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
	dbAdapter.getNewsQuery(req, res);
	// 이후의 코드는 동기적 실행을 보장하지 않음. 유의
});

// ID 기준으로 뉴스 가져오기
app.get('/news/:news_id', function(req, res){
	console.log('[GET /news/:' + req.params.news_id + '] QUERY: ' + JSON.stringify(req.query));
	// query는 url 뒤의 값들.
	// params는 news_id와 같은 uri의 값
	dbAdapter.getNewsById(req, res);
	// 이후의 코드는 동기적 실행을 보장하지 않음. 유의
});

app.post('/news', function(req, res){
	console.log('[POST /news] BODY: ' + JSON.stringify(req.body));
	dbAdapter.postNews(req, res);
	// 이후의 코드는 동기적 실행을 보장하지 않음. 유의
});

app.put('/news/:news_id', function(req, res){
	console.log('[PUT /news/:' + req.params.news_id + '] BODY: ' + JSON.stringify(req.body));
	dbAdapter.putNews(req, res);
	// 이후의 코드는 동기적 실행을 보장하지 않음. 유의
});

app.delete('/news/:news_id', function(req, res){
	console.log('[DELETE /news/:' + req.params.news_id + '] QUERY: ' + JSON.stringify(req.query));
	dbAdapter.deleteNewsById(req, res);
	// 이후의 코드는 동기적 실행을 보장하지 않음. 유의
});

app.listen(port, function(){
	console.log('Express server has started on port ' + port);
});
