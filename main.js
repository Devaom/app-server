require('dotenv').config();
//require('./mq-agent');

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

app.listen(port, function(){
	console.log('Express server has started on port ' + port);
});
