var admin = require('firebase-admin');
var service_account = require('./service-account-key.json');

admin.initializeApp({
	credential: admin.credential.cert(service_account)		
});

var messaging = admin.messaging();
var auth = admin.auth();

function send(device_token, title, body) {
	var data = {
		token: device_token, 
		notification: {
			title: title,
			body: body
		}
	};

	// messaging.send가 Promise를 리턴하는데, 여기서 then과 catch를 연속해도 호출해도 결과값 잘 주는듯 ㅇㅇ
	return messaging.send(data, false)
		.then(function(response) {
			console.log('Successfully sent to', device_token, ', response:', response);
			return true
		}) /* 유의! async/await에서 try~catch 예외처리된 형태로 호출되는 경우, catch문에서 예외를 처리하므로 여기서 catch()를 정의하면 안된다. */
		/*	
		.catch(function(error) {
			console.log('An error occured while sending:', error);
			return error
			//return false
		});
		*/
}

function checkTokenAndUID(firebase_uid, device_token) {
	// device_token으로부터 firebase_uid를 가져올 수 있는지를 테스트하기 위한 함수
	return auth.verifyIdToken(device_token)
		.then(function(decoded_token) {
			var uid = decoded_token.uid;
			console.log('받은 firebase_uid =', firebase_uid, 'device_token으로부터 가져온 uid =', uid);
			if(uid == firebase_uid) return true;
			else return false;
		}) /* 유의! async/await에서 try~catch 예외처리된 형태로 호출되는 경우, catch문에서 예외를 처리하므로 여기서 catch()를 정의하면 안된다. */
		/*
		.catch(function(error) {
			return error
		});
		*/
}

/*
function getUIDByToken(device_token) {
	return auth.verifyIdToken(device_token);
}

function getAuth() {
	return auth;
}
*/

exports.send = send;
exports.checkTokenAndUID = checkTokenAndUID;

/*
exports.getAuth = getAuth;
exports.getUIDByToken = getUIDByToken;
*/

/*
function checkTokenAndUID(firebase_uid, device_token) {
	return auth.verifyIdToken(device_token)
		.then(function(decoded_token) {
			var uid = decoded_token.uid;
			if(uid == firebase_uid) return true;
			else return false;
		}).catch(function(error) {
			return error
			//console.log('뭔가 에러가 발생..');
			//reject(error);
		});
}
*/


/*
// device_token에 메시지를 보내는 코드
require('dotenv').config();
var FCM = require('fcm-node');
var fcm = new FCM(process.env.FCM_SERVER_KEY);
*/

/*
var data = {
	to: 'token',
	key1: 'value1',
	key2: 'value2'
}
*/

/*
function send(device_token, data) {
	return new Promise(function(resolve, reject) {
		data.to = device.token;
		fcm.send(data, function(error, response) {
			if (error) {
				console.log('An error occured while sending message..: ' + String(error));
				reject(false);
			} else {
				console.log('Successfully sended!: ' + String(response));
				resolve(true);
			}
		});
	})
}
*/

