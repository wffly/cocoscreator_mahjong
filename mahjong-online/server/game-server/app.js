var pomelo = require('pomelo');

/**
 * Init app for client.
 */
var app = pomelo.createApp();
app.set('name', 'server');

app.configure('production|development', 'connector', function(){
    app.set('connectorConfig',
        {
            connector : pomelo.connectors.hybridconnector,
            useDict : true,
            useProtobuf : true
        });
});

app.configure('production|development', 'gate', function(){
    app.set('connectorConfig',
        {
            connector : pomelo.connectors.hybridconnector,
            useProtobuf : true
        });
});

// 添加配置
app.loadConfig("mysql", app.getBase() + "/config/mysql.json");
app.configure('production|development', "dao", function () {
    // 初始化dbclient
    var dbclient = require("./app/mysql/mysql.js").init(app);
    // dbclient 为外部数据库接口，app,get("dbclient") 来使用
    app.set("dbclient", dbclient);
});

function update(){
    if(lastTickTime + config.HTTP_TICK_TIME < Date.now()){
        lastTickTime = Date.now();
        gameServerInfo.load = roomMgr.getTotalRooms();
        http.get(config.HALL_IP,config.HALL_PORT,"/register_gs",gameServerInfo,function(ret,data){
            if(ret == true){
                if(data.errcode != 0){
                    console.log(data.errmsg);
                }

                if(data.ip != null){
                    serverIp = data.ip;
                }
            }
            else{
                //
                lastTickTime = 0;
            }
        });

        var mem = process.memoryUsage();
        var format = function(bytes) {
            return (bytes/1024/1024).toFixed(2)+'MB';
        };
        //console.log('Process: heapTotal '+format(mem.heapTotal) + ' heapUsed ' + format(mem.heapUsed) + ' rss ' + format(mem.rss));
    }
}

// start app
app.start();

process.on('uncaughtException', function (err) {
  console.error(' Caught exception: ' + err.stack);
});
