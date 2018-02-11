var db = require('../utils/db');
//配置文件
var configs = require("../configs_local");

db.init(configs.mysql());

//账号服配置
var config = configs.account_server();
var as = require('./account_server');
as.start(config);

var dapi = require('./dealer_api');
dapi.start(config);