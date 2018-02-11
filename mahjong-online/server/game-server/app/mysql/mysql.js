// mysql CRUD 
var _pool;

var NND = {};

/*
 * Init sql connection pool
 * @param {Object} app The app for the server.
 */
NND.init = function (app) {
    _pool = require('./dao-pool').createMysqlPool(app);
};

/**
 * Excute sql statement
 * @param {String} sql Statement The sql need to excute.
 * @param {Object} args The args for the sql.
 * @param {fuction} cb Callback function.
 *
 */
NND.query = function (sql, args, cb) {
    console.log(sql);
    var promise = _pool.acquire();
    promise.then(function (client) {
        client.query(sql, args, function (error, results, fields) {
            if (error) {
                _pool.destroy(client);
                cb(error, results);
            }
            else {
                _pool.release(client);
                cb(error, results);
            }
        });
    }, function () {
        console.log("reject");
    }).catch(function (err) {
        cb(err);
        console.log(err);
    });
};

/**
 * Close connection pool.
 */
NND.shutdown = function () {
    _pool.drain().then(function () {
        _pool.clear();
    });
};

/**
 * init database
 */
module.exports.init = function (app) {
    console.log("进入数据库初始化");
    if (!!_pool) {
        console.log("1");
        return module.exports;
    } else {
        console.log("2");
        NND.init(app);
        module.exports.insert = NND.query;
        module.exports.update = NND.query;
        module.exports.delete = NND.query;
        module.exports.query = NND.query;
        return module.exports;
    }
};

/**
 * shutdown database
 */
module.exports.shutdown = function (app) {
    NND.shutdown(app);
};

