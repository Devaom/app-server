var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var newsSchema = new Schema({
        title: { type: String, required: true},
        article_id: { type: String, required: false},
        article_url: { type: String, required: false},
        redirect_url: { type: String, required: false},
        origin_url: { type: String, required: false},
        body_html: { type: String, required: false},
        provider: { type: String, required: false},
        reporter: { type: String, required: false},
        category: { type: String, required: false},
        relatedStocks: { type: Array, required: false},
        time: { type: Date, required: false}
});

module.exports = mongoose.model('news', newsSchema);
