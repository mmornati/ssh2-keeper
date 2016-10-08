var db = require('diskdb');
var config = require('config');

var database = db.connect(config.db_path, [config.server_collection, config.tag_collection]);

module.exports = database;
