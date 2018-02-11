var config = require('../../../server_configs/config').account_server();

module.exports = function(app) {
    return new gateHandler(app);
};

var gateHandler = function(app) {
    this.app = app;
};

gateHandler.prototype.get_serverinfo = function(msg, session, next) {
    console.log("到达get_serverinfo");
    var ret = {
        version:config.VERSION,
        host:config.HALL_IP,
        port:config.HALL_CLIENT_PORT,
        appweb:config.APP_WEB,
    };
    next(null,ret);
};
