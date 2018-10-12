//////////////////////////////////////////
//   MAPPING을 잘못 정의해서 다시 만듬  //
//////////////////////////////////////////

//require('dotenv').config();
require('dotenv').config({path: '/home/ec2-user/app-server/.env'});
var AWS = require('aws-sdk');
var region = process.env.ES_REGION;
var domain = process.env.ES_DOMAIN_V2;
var index = process.env.ES_INDEX; // inked

function create_mappings(settings_and_mappings) {
	return new Promise(function(resolve, reject) {
		var endpoint = new AWS.Endpoint(domain);
		var request = new AWS.HttpRequest(endpoint, region);
		request.method = 'PUT';
		request.path += index + '/';
		request.body = JSON.stringify(settings_and_mappings);
		request.headers['host'] = domain;
		request.headers['Content-Type'] = 'application/json';

		var client = new AWS.HttpClient();
		client.handleRequest(request, null, function(response) {
			var response_body = '';
			response.on('data', function(chunk) {
				response_body += chunk;
			});
			response.on('end', function() {
				//resolve(JSON.parse(response_body));
				resolve(JSON.parse(response_body));
			});
		}, function(error) {
			reject(error);
		});
	});
}

var settings_and_mappings = {
    settings: {
        index: {
            analysis: {
                tokenizer: {
					seunjeon_default_tokenizer: {
                        type: 'seunjeon_tokenizer',
                        index_eojeol: false,
                        user_words: ["낄끼+빠빠,-100", "c\\+\\+", "어그로", "버카충", "abc마트"]
                    }
                },
                analyzer: {
                    korean: {
                        type: 'custom',
                        tokenizer: 'seunjeon_default_tokenizer'
                    }
                }
            }
        }
    },
    mappings: {
        news: {
            properties: {
                article_id: {type: 'keyword'},
                article_url: {type: 'keyword'},
                redirect_url: {type: 'keyword'},
                origin_url: {type: 'keyword'},
                title: {
					type: 'text',
					analyzer: 'korean'
				},
                body_html: {
					type: 'text',
					analyzer: 'korean'
				},
                time: {
                    type: 'date',
                    format: 'yyyy.MM.dd HH:mm:ss'
                },
                provider: {type: 'keyword'},
                reporter: {type: 'keyword'},
                category: {type: 'keyword'},
                relatedStocks: {type: 'text'} // 추후 문제 있을 시 mongodb에서 가져오도록
            }
        }
    }
};

async function main() {
	try {
		console.log(await create_mappings(settings_and_mappings));
	} catch (error) {
		console.log('an error occured:', error);
	}
}

main();
