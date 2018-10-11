//////////////////////////////////////////
//   MAPPING을 잘못 정의해서 다시 만듬  //
//////////////////////////////////////////

//require('dotenv').config();
require('dotenv').config({path: '/home/ec2-user/app-server/.env'});
var AWS = require('aws-sdk');
var region = process.env.ES_REGION;
var domain = process.env.ES_DOMAIN_V2;
var index = process.env.ES_INDEX; // inked

function delete_index() {
	return new Promise(function(resolve, reject) {
		var endpoint = new AWS.Endpoint(domain);
		var request = new AWS.HttpRequest(endpoint, region);
		request.method = 'DELETE';
		request.path += index + '/';
		//request.body = JSON.stringify(settings_and_mappings);
		request.headers['host'] = domain;
		request.headers['Content-Type'] = 'application/json';

		var client = new AWS.HttpClient();
		client.handleRequest(request, null, function(response) {
			var response_body = '';
			response.on('data', function(chunk) {
				response_body += chunk;
			});
			response.on('end', function() {
				resolve(JSON.parse(response_body));
			});
		}, function(error) {
			reject(error);
		});
	});
}

async function main() {
	try {
		console.log(await delete_index());
	} catch(error) {
		console.log('an error occured:', error);
	}
}

main();
