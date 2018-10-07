require('dotenv').config();

// https://hyunseob.github.io/2016/03/27/usage-of-sequelize-js/
var Sequelize = require('sequelize');
var sequelize = new Sequelize(
	process.env.MYSQL_DATABASE,
	process.env.MYSQL_USER,
	process.env.MYSQL_PASSWORD,
	{
		host: process.env.MYSQL_HOST,
		dialect: 'mysql',
		operatorsAliases: false
	}
)

// 실제로 테이블에 createdAt, updatedAt 필드(type: DATETIME, null: false)도 자동으로 생성해줌.
var Users = sequelize.define('Users', {
	firebase_uid: {
		type: Sequelize.STRING,
		primaryKey: true
	},
	device_token: {
		type: Sequelize.STRING,
		allowNull: true
	}
}, {
	charset: 'utf8',
	collate: 'utf8_unicode_ci'
});

var StockEvents = sequelize.define('StockEvents', {
	event_name: {
		type: Sequelize.STRING
	}, 
	event_content: {
		type: Sequelize.STRING
	},
	event_time: {
		type: Sequelize.DATE
	},
	related_news_list: { // MongoDB의 뉴스 ID
		type: Sequelize.JSON
	},
	incidents: {
		type: Sequelize.JSON
	},
	links: {
		type: Sequelize.JSON
	},
	extra_fields: {
		type: Sequelize.JSON
	}
}, {
	charset: 'utf8',
	collate: 'utf8_unicode_ci'
});

/*
var AnalyzedNews = sequelize.define('AnalyzedNews', {

});

data class StockEventModel(val ID: String){
    var eventName: String = "New Event"
    var eventContent: String = "event description goes here..."
    var eventTime: Date = Date("2018.12.25:12:12:12")
    var relatedNewsList: MutableList<AnalyzedNewsModel> = mutableListOf()
    var incidents: MutableList<String> = mutableListOf()
    var links: MutableList<String> = mutableListOf()
    var extraFields: Map<String, String> = hashMapOf()
}
*/

sequelize.sync().then(function(result){
	console.log('Successfully synced models!');
}).catch(function(error){
	console.log('An error occured while syncing models..:', error);
});

/*
// 관계를 정의할 필요가 있을 경우..
const Label = sequelize.define('Label', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: Sequelize.STRING,
    allowNull: false,
    unique: true
  }
});
*/

async function insert_user(user) {
	try {
		var results = await Users.create(user);
		console.log('Successfully inserted user:', results);
		return results;
	} catch(error) {
		console.log('An error occured while inserting:', error);
		return error;
	}
}

async function insert_stock_event(stock_event) {
	try {
		var results = await StockEvents.create(stock_event);
		return results;
		//console.log('Successfully inserted stock_event:', results);
	} catch (error) {
		console.log('An error occured while inserting stock event', error);
		return error;
	}
}

async function find_all(table_name) {
	try {
		if(table_name == 'Users') {
			var results = await Users.findAll();
		} else if(table_name == 'StockEvents') {
			var results = await StockEvents.findAll();
		} else {
			return '잘못된 테이블명임..';
		}
		//console.log('Successfully found', table_name, ':', results);
		return results;
	} catch(error) {
		console.log('An error occured while finding:', error);
		return error;
	}
}

async function select_stock_events(stock_event_id) {
	try {
		if(stock_event_id == 'all') {
			var results = await StockEvents.findAll();
		} else {
			var results = await StockEvents.findOne({
				where: { id: stock_event_id }
			});
		}
		return results;
	} catch (error) {
		console.log('An error occured while finding:', error);
		return error;
	}
}

async function delete_stock_events(stock_event_id) {
	try {
		if(stock_event_id == 'all') {
			//var results = await StockEvents.destroy({where: {}, truncate: true});
			var results = await StockEvents.destroy({truncate: true});
		} else {
			var results = await StockEvents.destroy({
				where: { id: stock_event_id }
			});
		}
		return results;
	} catch (error) {
		console.log('An error occured while finding:', error);
		return error;
	}
}

async function update_stock_event_extra_fields(id, modify_extra_fields){
	try {
		var results = await StockEvents.update({
			extra_fields: modify_extra_fields
		}, {
			where: { id: id }
		});
		return results;

	} catch (error) {
		console.log('An error occured while updating extra fields:', error);
		return error;
	}
}

async function update_user_device_token(firebase_uid, device_token) {
	try {
		var results = await Users.update({
			device_token: device_token
		}, {
			where: { firebase_uid: firebase_uid }	
		});
		return results;
	} catch (error) {
		console.log('An error occured while updating device token:', error);
		return error;
	}
}




if(process.argv[2] == 'insert_user') {
	insert_user({
		firebase_uid: process.argv[3],
		device_token: process.argv[4]
	}).then(function(results) {
		console.log('추가된 User 데이터:', results);
	});

} else if (process.argv[2] == 'insert_stock_event') {
	insert_stock_event({}).then(function(results) {
		console.log('추가된 StockEvent 데이터:', results);
	});

} else if(process.argv[2] == 'find_all') {
	// resolve도 아닌 return으로 반환했는데 then으로 넘어간다...???
	// 만일 그냥 반환값을 가지고 쓰면.. Promise {pending} 요렇게만 출력됨
	find_all(process.argv[3]).then(function(result) {
		console.log('찾아낸', process.argv[3], ':', result);
	});

} else if(process.argv[2] == 'update_user_device_token') {
	update_user_device_token(
			process.argv[3],
			process.argv[4]
	).then(function(result) {
		console.log('디바이스 토큰 업데이트함:', result);
	});
}

exports.insert_user = insert_user;
exports.insert_stock_event = insert_stock_event;
exports.find_all = find_all;
exports.update_user_device_token = update_user_device_token;
exports.update_stock_event_extra_fields = update_stock_event_extra_fields;
exports.select_stock_events = select_stock_events;
exports.delete_stock_events = delete_stock_events;
