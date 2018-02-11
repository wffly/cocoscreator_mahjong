module.exports = function(app) {
    return new GameDao(app);
}

var GameDao = function(app) {
    this.app = app;
}

function nop(a,b,c,d,e,f,g){

}
//创建游戏记录
GameDao.prototype.create_game = function (room_uuid,index,base_info,callback) {
    console.log("到达GameDao create_game");
    var self = this;
    callback = callback == null? nop:callback;
    var time = Date.now();
    var args=[room_uuid,index,base_info,time];
    var sql = "INSERT INTO t_games(room_uuid,game_index,base_info,create_time) VALUES(?,?,?,?)";
    var dbclient = self.app.get('dbclient');
    dbclient.insert(sql,args,function (err,ret) {
        if(err){
            callback(null);
            throw err;
        }
        else{
            callback();
        }
    });
};

GameDao.prototype.update_game_result = function (room_uuid,index,result,callback) {
    console.log("到达GameDao update_game_result");
    var self = this;
    callback = callback == null? nop:callback;
    if(room_uuid == null || result){
        callback(false);
    }
    var args=[result,room_uuid,index];
    var sql = "UPDATE t_games SET result = ? WHERE room_uuid = ? AND game_index = ?" ;
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

//更新游戏行为记录
GameDao.prototype.update_game_action_records = function (room_uuid,index,actions,callback) {
    console.log("到达GameDao update_game_action_records");
    var self = this;
    callback = callback == null? nop:callback;
    var args=[actions,room_uuid,index];
    var sql = "UPDATE t_games SET action_records = ? WHERE room_uuid = ? AND game_index = ?" ;
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

//保存游戏局数
GameDao.prototype.update_num_of_turns = function (roomId,numOfTurns,callback) {
    console.log("到达GameDao update_num_of_turns");
    var self = this;
    callback = callback == null? nop:callback;
    var args=[numOfTurns,roomId];
    var sql = 'UPDATE t_rooms SET num_of_turns = ? WHERE id = ?'
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

//减少房卡
GameDao.prototype.cost_gems = function (userid,cost,callback) {
    console.log("到达GameDao update_num_of_turns");
    var self = this;
    callback = callback == null? nop:callback;
    var args=[cost,userid];
    var sql = 'UPDATE t_users SET gems = gems -? WHERE userid = ?';
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
