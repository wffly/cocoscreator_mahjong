var crypto = require('../../../utils/crypto');

module.exports = function(app) {
    return new RoomDao(app);
};

var RoomDao = function(app) {
    this.app = app;
};

function nop(a,b,c,d,e,f,g){

};

//通过房间号来获取user信息
RoomDao.prototype.get_room_id_of_user = function(userId,callback) {
    console.log("到达RoomDao get_room_id_of_user");
    callback = callback == null? nop:callback;
    var self =this;
    var sql = 'SELECT roomid FROM t_users WHERE userid = ?';
    var args=[userId];
    var dbclient = self.app.get('dbclient');
    dbclient.query(sql,args,function (ret) {
        console.log(ret);
        if(ret==null||ret.length== 0){
            callback(null);
        }
        else{
            callback(ret[0].roomid);
        }
    });
};

//根据id来查询房间是否存在
RoomDao.prototype.is_room_exist = function (roomId,callback) {
    console.log("到达RoomDao is_room_exist");
    callback = callback == null? nop:callback;
    var self =this;
    var sql = 'SELECT * FROM t_rooms WHERE id = "' + roomId + '"';
    var dbclient = self.app.get('dbclient');
    dbclient.query(sql,null,function (ret) {
        if(ret==null||ret.length==0){
            callback(false);
        }else{
            callback(true);
        }
    });
};

//更新房间号
RoomDao.prototype.set_room_id_of_user = function (userId,roomId,callback) {
    console.log("到达RoomDao set_room_id_of_user");
    callback = callback == null? nop:callback;
    var self =this;
    if(roomId != null){
        roomId = '"' + roomId + '"';
    }
    var sql = 'UPDATE t_users SET roomid = '+ roomId + ' WHERE userid = "' + userId + '"';
    var dbclient = self.app.get('dbclient');
    dbclient.update(sql,null,function (err,ret) {
        if(err!=null){
            callback(false);
        }else{
            callback(true);
        }


    });
};

//创建房间的数据库数据
RoomDao.prototype.create_room = function (roomId,conf,create_time,callback) {
    console.log("到达RoomDao create_room");
    var self = this;
    callback = callback == null? nop:callback;
    var sql = "INSERT INTO t_rooms(uuid,id,base_info,create_time)VALUES(?,?,?,?)";
    var uuid = Date.now() + roomId;
    var baseInfo = JSON.stringify(conf);
    var args=[uuid,roomId,baseInfo,create_time];
    var dbclient = self.app.get('dbclient');
    dbclient.insert(sql,args,function (err,ret) {
        if(err){
            callback(null);
            throw err;
        }
        else{
            callback(uuid);
        }
    });
};

//更新座位信息
RoomDao.prototype.update_seat_info = function (roomId,seatIndex,userId,icon,name,callback) {
    console.log("到达RoomDao update_seat_info");
    console.log("roomId:"+roomId+" "+
    "seatIndex:"+seatIndex+" "+
    "userId:"+userId+" "+
    "icon:"+icon+" "+
    "name:"+name);
    var self = this;
    callback = callback == null? nop:callback;
    var sql = 'UPDATE t_rooms SET user_id'+seatIndex+' = ?,user_icon'+seatIndex+' = ?,user_name'+seatIndex+'  =? WHERE id = ?';
    name = crypto.toBase64(name);
    var args=[userId,icon,name,roomId];
    var dbclient = self.app.get('dbclient');
    dbclient.update(sql,args,function (err,ret) {
        if(err){
            callback(false);
            throw err;
        }
        else{
            callback(true);
        }
    });
};

//获取房间数据
RoomDao.prototype.get_room_data = function (roomId,callback) {
    console.log("到达RoomDao get_room_data");
    var self =this;
    callback = callback == null? nop:callback;
    if(roomId == null){
        callback(null);
        return;
    }

    var sql = 'SELECT * FROM t_rooms WHERE id = ?';
    var args=[roomId];
    var dbclient = self.app.get('dbclient');
    dbclient.query(sql,args,function (err,ret) {
        if(err){
            callback(null);
            throw err;
        }
        if(ret==null||ret.length==0){
            callback(null);
        }
        else{
            ret[0].user_name0 = crypto.fromBase64(ret[0].user_name0);
            ret[0].user_name1 = crypto.fromBase64(ret[0].user_name1);
            ret[0].user_name2 = crypto.fromBase64(ret[0].user_name2);
            ret[0].user_name3 = crypto.fromBase64(ret[0].user_name3);
            callback(ret[0]);
        }
    });
};


RoomDao.prototype.update_next_button = function (roomId,nextButton,callback) {
    callback = callback == null? nop:callback;
    var self = this;
    var sql = 'UPDATE t_rooms SET next_button = ? WHERE id = ?';
    var args=[nextButton,roomId];
    var dbclient = self.app.get('dbclient');
    dbclient.update(sql,args,function (err,ret) {
        if(err){
            callback(false);
            throw err;
        }
        else{
            callback(true);
        }
    });
}
