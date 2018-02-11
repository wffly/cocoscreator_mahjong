var _poolModule = require('generic-pool');
var mysql = require('./mysql.js');
/*
 * Create mysql connection pool.
 */
exports.createMysqlPool =  function (app) {
    //var mysqlConfig = require('../server_configs/config.js').mysql;
    /*
    console.log("host:"+ mysqlConfig.HOST+" "+
        "user:"+ mysqlConfig.USER+" "+
        "password:"+ mysqlConfig.PSWD+" "+
        "database:"+mysqlConfig.DB+" "+
        "port:"+mysqlConfig.PORT);
    */
    const factory = {
        create: function () {
            return new Promise(function (resolve, reject) {
                var mysql = require('mysql');
                var client = mysql.createConnection({
                    host: '127.0.0.1',
                    user: 'root',
                    password: '444116',
                    database: 'ddmj',
                    port: '3306'
                });
                client.on('error', function () {
                    client.connect();
                });
                client.connect(function (error) {
                    if (error) {
                        console.log('sql connect error');
                    }
                    resolve(client)
                });

            })
        },
        destroy: function (client) {
            return new Promise(function (resolve) {
                client.on('end', function () {
                    resolve()
                })
                client.end()
            })
        }
    }
    var opts = {
        max: 10, // maximum size of the pool
        min: 2, // minimum size of the pool
        idleTimeoutMillis: 30000,
        // 如果 设置为 true 的话，就是使用 console.log 打印入职，当然你可以传递一个 function 最为作为日志记录handler
        log: true
    }
    return _poolModule.createPool(factory, opts);
};
