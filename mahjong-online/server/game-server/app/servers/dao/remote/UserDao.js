var crypto = require('../../../utils/crypto');
module.exports = function(app) {
    return new UserDao(app);
};

var UserDao = function(app) {
    this.app = app;
};

function nop(a,b,c,d,e,f,g){

};
//获得用户信息
UserDao.prototype.get_user_data = function(account,callback) {
    console.log("到达UserDao get_user_data");
    console.log(account);
    var self =this;
    if(account == null){
        callback(null);
    }
    var sql = 'select userid,account,name,lv,exp,coins,gems,roomid from t_users where account=?';
    var args=[account];
    var dbclient = self.app.get('dbclient');
    dbclient.query(sql,args,function(err,ret){
        console.log(ret);
        if (err) {
            callback(null);
            throw err;
        }
        if(ret==null||ret.length == 0){
            callback(null);
        }else{
            ret[0].name = crypto.fromBase64(ret[0].name);
            callback(ret);
        }
    });
};

//查询用户是否存在
UserDao.prototype.is_user_exist = function (account,callback) {
    console.log("到达UserDao is_user_exist");
    var self = this;
    callback = callback == null? nop:callback;
    if(account == null){
        callback(false);
        return;
    }

    var sql = 'SELECT userid FROM t_users WHERE account = ?';
    var args =[account];
    var dbclient = self.app.get('dbclient');
    dbclient.query(sql,args,function(err,ret){
        if (err) {
            throw err;
        }
        if(ret.length == 0){
            callback(false);
            return;
        }
        callback(true);
    });
};

//创建用户
UserDao.prototype.create_user = function (account,name,coins,gems,sex,headimg,callback) {
    console.log("到达UserDao create_user");
    var self = this;
    callback = callback == null? nop:callback;
    if(account == null || name == null || coins==null || gems==null){
        callback(false);
        return;
    }
    if(headimg){
        headimg = '"' + headimg + '"';
    }
    else{
        headimg = 'null';
    }
    name = crypto.toBase64(name);
    var sql = 'INSERT INTO t_users(account,name,coins,gems,sex,headimg,history) VALUES(?,?,?,?,?,?,?)';
    var args =[account,name,coins,gems,sex,headimg,""];
    console.log("sql:"+sql+
        "UserDao.js line:345");
    var dbclient = self.app.get('dbclient');
    dbclient.insert(sql,args,function(err,ret){
        if (err) {
            throw err;
        }
        callback(true);
    });
};

//获得用户房卡
UserDao.prototype.get_gems =function (account,callback) {
    console.log("到达UserDao get_gems");
    var self = this;
    callback = callback == null? nop:callback;
    if(account == null){
        callback(null);
        return;
    }

    var sql = 'SELECT gems FROM t_users WHERE account =?';
    var args=[account];
    var dbclient = self.app.get('dbclient');
    dbclient.query(sql,args,function(err,ret){
        if (err) {
            callback(null);
            throw err;
        }
        if(ret==null||ret.length == 0){
            callback(null);
            return;
        }
        callback(ret);
    });
};