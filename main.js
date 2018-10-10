require('dotenv').config();
//require('dotenv').config({path: '/home/ec2-user/.env'});
require('./mq-agent');

//var path = require('path');
var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var routes = require('./routes');

app.use(bodyParser.urlencoded({ extended: true}));
app.use(bodyParser.json());

// node_modules/swagger-ui/dist에 저장되어있는 html 파일들 라우팅
//app.use('/swagger-ui', express.static(path.join(__dirname, './node_modules/swagger-ui/dist')));
//console.log(path.join(__dirname, './node_modules/swagger-ui/dist'), '에 연결됨.');

//////////////////////////////////////////////////////////
//                     SWAGGER                          //
//////////////////////////////////////////////////////////

const swagger_js_doc = require('swagger-jsdoc');
const swagger_ui = require('swagger-ui-express');

var swagger_definition = {
	info: {
		title: 'inked API',
		version: '1.0.0',
		description: 'inked API Specification'
	},
	host: 'nginx-lb-429321543.ap-northeast-2.elb.amazonaws.com',
	basePath: '/api'
	/*
	host: 'ec2-52-79-134-126.ap-northeast-2.compute.amazonaws.com',
	basePath: ''
	*/
};

var options = {
	swaggerDefinition: swagger_definition,
	apis: [
		'routes.js',
		'routes/*'
	]
}

// initialize swagger-jsdoc. it returns validated swagger spec in json format.
var swagger_spec = swagger_js_doc(options);

// routing에 추가하기
app.use('/api-docs', swagger_ui.serve, swagger_ui.setup(swagger_spec));

app.get('/', async function(req, res) {
	console.log('[GET /] Param: req.query = ' + JSON.stringify(req.query));

	return await res.json({
		NodeAngel : 'Ho!'
	});
});

app.get('/news/:news_id', function(req, res) {
	// news_id가 없을 경우, 이곳으로 라우팅 되지 않는다.
	console.log('[GET] /news/' + req.params.news_id, '\nquery:', req.query);
	routes.get_news_by_id(req, res);
});

app.get('/news', function(req, res) {
	console.log('[GET] /news', '\nquery:', req.query);
	routes.get_news_by_query(req, res);
});

app.post('/news', function(req, res){
	console.log('[POST] /news\nbody:', req.body);
	routes.post_news(req, res);
});

app.post('/users', function(req, res) {
	console.log('[POST] /users\n', 'body:', req.body);
	// user 신규 등록
	routes.create_user(req, res);
});

app.delete('/users/:firebase_uid', function(req, res) {
	console.log('[DELETE] /users/' + req.params.firebase_uid, '\nquery:', req.query);
	routes.delete_user(req, res);
});

app.put('/users/:firebase_uid/device_token', function(req, res) {
	console.log('[PUT] /users/' + req.params.firebase_uid + '/device_token', '\nbody:', req.body);
	routes.update_user_device_token(req, res);
});

app.get('/users/:firebase_uid', function(req, res) {
	console.log('[GET] /users/' + req.params.firebase_uid, '\nquery:', req.query);
	routes.get_user_by_id(req, res);
});

app.get('/users', function(req, res) {
	console.log('[GET] /users', '\nquery:', req.query);
	routes.get_user_by_query(req, res);
});

/*
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
*/

app.put('/news/:news_id', function(req, res){
	console.log('[PUT /news/:' + req.params.news_id + '] BODY: ' + JSON.stringify(req.body));
	routes.putNews(req, res);
});

app.delete('/news/:news_id', function(req, res){
	console.log('[DELETE /news/:' + req.params.news_id + '] QUERY: ' + JSON.stringify(req.query));
	routes.deleteNewsById(req, res);
});


app.put('/user/:firebase_uid', function(req, res) {
	// token 등록할 때도 쓰고.
	routes.modifyUser(req, res);
});

/*
// firebase_uid에 device_token 매핑
app.put('/users/:firebase_uid/device_token', function(req, res) {
	routes.register_token(req, res);
});
*/

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

app.listen(process.env.PORT, function(){
	console.log('Express server has started on port ' + process.env.PORT);
});
