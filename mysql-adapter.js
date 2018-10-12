require('dotenv').config();
require('date-utils'); // new Date('~~').toFormat() 펑션같은거를 쓸 수 있도록 확장해준다.

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

const Op = Sequelize.Op;

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

async function create_user(user) {
	try {
		var results = await Users.create(user);
		//console.log('Successfully inserted user:', results);
		return results;
	} catch(error) {
		console.log('An error occured while inserting:', error);
		return error;
	}
}

async function delete_user(firebase_uid) {
	try {
		var results = await Users.destroy({
				where: { firebase_uid: firebase_uid }
		});
		//console.log('Successfully deleted user:', results);
		return results;
	} catch(error) {
		console.log('An error occured while deleting an user:', error);
		return error;
	}
}

async function get_user_by_id(firebase_uid) {
	try {
		var result = await Users.findOne({
			where: { firebase_uid: firebase_uid }
		});
		console.log('Successfully got an user:', result);
		return result;
	} catch(error) {
		console.log('An error occured while getting an user:', error);
		return error;
	}
}

async function get_user_by_query(queries) {
	console.log('get_user_by_query called:', queries);
	try {
		if(queries.type == 'all') {
			var results = await Users.findAll();
		} else {
			var results = {};
		}
		return results
	} catch(error) {
		console.log('An error occured while getting users by query:', error);
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
exports.get_stock_event_by_id = async function(stock_event_id) {
	var result = await StockEvents.findOne({
		where: { id: stock_event_id }
	});
	return result;
}

exports.get_stock_event_by_query = async function(query_type, query_date, max_length) {
	if(query_type == 'all') {
		var result = await StockEvents.findAll();

	} else if(query_type == 'daily') {
		console.log('daily 호출!');
		var dt = new Date(query_date);
		var dt_first = new Date(dt.getFullYear(), dt.getMonth(), dt.getDate(), 0);
		var dt_last = new Date(dt.getFullYear(), dt.getMonth(), dt.getDate(), 23, 59, 59);
		console.log(dt_first, dt_last);

		var result = await StockEvents.findAll({
			where: { 
				event_time: {
					[Op.between]: [dt_first, dt_last]
				}
			}
		});

	} else if(query_type == 'weekly') {
		var dt = new Date(query_date);	
		dt.setDate(dt.getDate() - dt.getDay()); // 주의 첫번째 날로 설정
		var dt_first = new Date(dt.getFullYear(), dt.getMonth(), dt.getDate(), 0);
		dt.setDate(dt.getDate() + 6);
		var dt_last = new Date(dt.getFullYear(), dt.getMonth(), dt.getDate(), 23, 59, 59);
		var result = await StockEvents.findAll({
			where: {
				event_time: {
					[Op.between]: [dt_first, dt_last]
				}
			}
		});

	} else if(query_type == 'monthly') {
		console.log('monthly 호출');
		var dt = new Date(query_date);
		console.log('dt = ', dt.toFormat('YYYY-MM-DD'));
		var dt_first = new Date(dt.getFullYear(), dt.getMonth(), 1); // 이번달의 초
		var dt_last = new Date(dt_first.getFullYear(), dt_first.getMonth() + 1, 0); // 다음 달로 넘어가서 -1 일
		var result = await StockEvents.findAll({
			where: {
				event_time: {
					[Op.between]: [dt_first, dt_last]
				}
			}
		});
	}

	return result;
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



/*
async function select_stock_events(stock_event_id, query_date) {
	try {
		if(stock_event_id == 'all') {
			var results = await StockEvents.findAll();
		} else if (stock_event_id == 'daily') {
			var dt = new Date(query_date);
			var dt_first = new Date(dt.getFullYear(), dt.getMonth(), dt.getDate(), 0);
			var dt_last = new Date(dt.getFullYear(), dt.getMonth(), dt.getDate(), 23, 59, 59);
			console.log(dt_first, dt_last);
			var results = await StockEvents.findAll({
				where: { 
					event_time: {
						[Op.between]: [dt_first, dt_last]
					}
				}
			});

		} else if (stock_event_id == 'weekly') {
			var dt = new Date(query_date);	
			dt.setDate(dt.getDate() - dt.getDay()); // 주의 첫번째 날로 설정
			
			var dt_first = new Date(dt.getFullYear(), dt.getMonth(), dt.getDate(), 0);
			dt.setDate(dt.getDate() + 6);
			var dt_last = new Date(dt.getFullYear(), dt.getMonth(), dt.getDate(), 23, 59, 59);

			var results = await StockEvents.findAll({
				where: {
					event_time: {
						[Op.between]: [dt_first, dt_last]
					}
				}
			});

		} else if(stock_event_id == 'monthly') {
			console.log('monthly 호출');
			var dt = new Date(query_date);
			console.log('dt = ', dt.toFormat('YYYY-MM-DD'));
			var dt_first = new Date(dt.getFullYear(), dt.getMonth(), 1); // 이번달의 초
			var dt_last = new Date(dt_first.getFullYear(), dt_first.getMonth() + 1, 0); // 다음 달로 넘어가서 -1 일
			var results = await StockEvents.findAll({
				where: {
					event_time: {
						[Op.between]: [dt_first, dt_last]
					}
				}
			});

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
*/

exports.delete_stock_event_by_id = async function(stock_event_id){
	var deleted_stock_event_count = await StockEvents.destroy({
		where: { id: stock_event_id }
	});
	return deleted_stock_event_count;
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
		var updated_stock_event_count = await StockEvents.update({
			extra_fields: modify_extra_fields
		}, {
			where: { id: id }
		});
		return updated_stock_event_count[0];

	} catch (error) {
		console.log('An error occured while updating extra fields:', error);
		return error;
	}
}

async function update_user_device_token(firebase_uid, device_token) {
	try {
		var updated_users_count = await Users.update({
			device_token: device_token
		}, {
			where: { firebase_uid: firebase_uid }	
		});
		return updated_users_count;
	} catch (error) {
		console.log('An error occured while updating device token:', error);
		return error;
	}
}


/*
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
*/

exports.create_user = create_user;
exports.delete_user = delete_user;
exports.get_user_by_id = get_user_by_id;
exports.get_user_by_query = get_user_by_query;
exports.insert_stock_event = insert_stock_event;
exports.find_all = find_all;
exports.update_user_device_token = update_user_device_token;
exports.update_stock_event_extra_fields = update_stock_event_extra_fields;
//exports.select_stock_events = select_stock_events;
exports.delete_stock_events = delete_stock_events;
