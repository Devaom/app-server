// es_index queue를 확인하고, 있으면 mongodb에서 해당 _id의 news 항목을 가져온다.
// mongodb에서 가져온 news를 es에 인덱싱한다.

require('dotenv').config();
var amqp = require('amqplib/callback_api');
var AWS = require('aws-sdk');
//var dbAdapter = require('./db-adapter');
var mongo_adapter = require('./mongo-adapter');
var es_adapter = require('./es-adapter');
var mq_adapter = require('./mq-adapter');
var emr_adapter = require('./emr-adapter');

// index-agent
amqp.connect(process.env.RABBITMQ_AMQP_DOMAIN, function(err, conn) {
    if(err) console.log('an error occured while loading index-agent: ' + String(err));
	else console.log('index-agent connected successfully.');

    conn.createChannel(function(err, ch) {
		if(err){
			console.log(err);
		}

		// es-index queue에서 news의 id 가져오고,
		// MongoDB에서 해당 News 가져와서 indexing
		ch.consume('es-index', async function(msg) {
			console.log('es-index에서 값 확인! 가져오는중..');
			try {
				// MongoDB에서 news_id를 기준으로 News를 가져오기
				var news_id = msg.content.toString();
				//var news = await mongoAdapter.getSingleNewsFromMongoByIdPromise(news_id);
				var news = await mongo_adapter.get_news_by_id_promise(news_id);
				//console.log('MongoDB에서 가져온 뉴스 = ' + JSON.stringify(news));

				// News를 ES로 전송하여 indexing하기
				//var es_response = await es_adapter.indexNewsPromise(news);
				delete news._id; // _id가 포함되어있으면 es에서 에러 발생함. news_id값은 es에 요청할때 url 패스에 들어갈거임.
				var es_response = await es_adapter.index_news_promise(news, news_id);
				console.log('[ES]', es_response);
				//if(es_response.body.data) es_response.body.data = new Buffer(es_response.body.data).toString();

				// publish to spark-analysis queue
				var queue_success = await mq_adapter.publish_queue_promise('spark-analysis', news_id);
				if(queue_success) console.log("publish to 'spark-analysis' queue successfully.");
				else console.log("publishing to 'spark-analysis' queue failed.");

				//console.log('ElasticSearch에서 처리된 응답 = ' + JSON.stringify(es_response));
			} catch (err) {
				console.log('An error occured while getting a news from mongo or indexing or pubisihng queue: ' + String(err));
			}
		}, {noAck: true});
	});
});

// analysis-agent
amqp.connect(process.env.RABBITMQ_AMQP_DOMAIN, function(err, conn) {
	if(err) console.log('an error occured while loading analysis-agent: ' + String(err));
	else console.log('analysis-agent connected successfully.');

	conn.createChannel(function(err, ch) {
		if(err) {
			console.log("an error occured while creating analysis-agent channel: " + String(err));
		}

		ch.consume('spark-analysis', async function(msg) {
			try {
				// submitting to spark
				//await emr_adapter.addJobFlowStepsPromise(process.env.EMR_CLUSTER_ID, /* argv 인자값(분석처리할 news_id) */ );
				console.log('spark-analysis에서 news_id가', msg.content.toString(), '인 news를 받음!');
			} catch (err) {
				console.log('an error occured while submitting a job to spark after consuming: ' + String(err));
			}
		}, {noAck: true});
	});
})

