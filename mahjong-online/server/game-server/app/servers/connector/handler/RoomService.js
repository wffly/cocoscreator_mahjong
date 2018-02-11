var tokenMgr = require('../../../utils/token');
var crypto = require('../../../utils/crypto');

var roomMgr = require("../../../game/RoomMgr");
module.exports = function(app) {
    return new RoomService(app);
};

var RoomService = function(app) {
    this.app = app;
};

//检查account和签名
check_account=function(account,sign){
    if(account == null || sign == null){
        next(null,{
            errcode:1,
            errmsg:"unknown error"
        });
        return false;
    }
    return true;
};

//创建私人房间
RoomService.prototype.create_private_room = function(msg, session, next) {
    console.log("到达RoomService create_private_room");
    var self = this;
    //验证参数合法性
    var data = msg;
    //验证玩家身份
    if (!check_account(msg.account, msg.sign)) {
        return;
    }

    var account = data.account;
    data.account = null;
    data.sign = null;
    var confs = data.conf;
    console.log("conf:" + confs + " " +
        "client_service.js" + " " +
        "line:137");
    //通过account来查询用户信息
    roomMgr.createRoom(session,self,confs,account,next);
};

//进入私人房间 
RoomService.prototype.enter_private_room = function (msg,session,next) {
    console.log("进入RoomService enter_private_room");
    var self = this;
    var data = msg;
    var roomId = data.roomid;
    if(roomId == null){
        next(null,{
            errcode:-1,
            errormsg:"parameters don't match api requirements."
        });
        return;
    }
    if(!check_account(data.account,data.sign)){
        return;
    }

    var account = data.account;

    self.app.rpc.dao.UserDao.get_user_data(session,account,function(data){
        if(data == null){
            http.send(res,-1,"system error");
            return;
        }
        var userId = data[0].userid;
        var name = data[0].name;

        //验证玩家状态
        //进入房间
        roomMgr.enterRoom(session,self,userId,name,roomId,function(errcode,enterInfo){
            if(enterInfo){
                next(null,{
                    errcode:0,
                    errormsg:"ok",
                    ret:enterInfo
                });
            }
            else{
                next(null,{
                    errcode:errcode,
                    errormsg:"enter room failed."
                });
            }
        });
    });
};




