require('dotenv').config();
var amqp = require('amqplib/callback_api');

console.log('index-agent called!');

amqp.connect(process.env.RABBITMQ_AMQP_DOMAIN, function(err, conn) {
    if(err) {
        console.log(err);
    } else {
	    console.log('정상');
	}

    conn.createChannel(function(err, ch) {
		if(err){
			console.log(err);
		}

        ch.consume('es-index', function(msg) {
            console.log(' [x] Received %s', msg.content.toString());
        }, {noAck: true});
    });
})
