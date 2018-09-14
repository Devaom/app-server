var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var newsSchema = new Schema({
        title: { type: String, required: true },
        pubDate: { type: String, required: true },
        pubTime: { type: String, required: false },
        body: { type: String, required: false},
        reporter: { type: String, required: false},
        category: { type: String, required: false},
        press: { type: String, required: false},
        relatedStocks: { type: Array, required: false}
});

module.exports = mongoose.model('news', newsSchema);
