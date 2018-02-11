var tokenMgr = require('../../../utils/token');
var roomMgr = require('../../../game/RoomMgr');
var userMgr = require('../../../game/UserMgr');
var crypto = require('../../../utils/crypto');
var configs = require("../../../server_configs/config");
var config = configs.game_server();
module.exports = function(app) {
    return new GameService(app);
};

var GameService = function(app) {
    this.app = app;
};
//登录
GameService.prototype.login = function(msg,session,next){
    console.log("到达GameService login");
    console.log(msg);
    var self = this;

    //令牌
    var token = msg.token;
    var roomId = msg.roomid;
    var time = msg.time;
    //数字签名
    var sign = msg.sign;


    //检查参数合法性
    if(token == null || roomId == null || sign == null || time == null){
        next(null,{
            errcode:1,
            errmsg:"invalid parameters"
        });
        return;
    }

    //检查参数是否被篡改
    var md5 = crypto.md5(roomId + token + time + config.ROOM_PRI_KEY);
    if(md5 != sign){
        next(null,{
            errcode:2,
            errmsg:"login failed. invalid sign!"
        });
        return;
    }

    //检查token是否有效
    if(tokenMgr.isTokenValid(token)==false){
        next(null,{
            errcode:3,
            errmsg:"token out of time."
        });
        return;
    }

    //检查房间合法性
    var userId = tokenMgr.getUserID(token);
    //房间Id
    var roomId = roomMgr.getUserRoom(userId);

    userMgr.bind(userId,session);

    console.log("userId:"+userId);
    console.log("roomId:"+roomId);

    //TODO
    session.bind(userId);
    session.set("roomId",roomId);
    session.push('roomId', function(err) {
        if(err){
            console.error('set rid for session service failed! error is : %j', err.stack);
        }
    });

    //返回房间信息
    var roomInfo = roomMgr.getRoom(roomId);
    //或的用户座位下标
    var seatIndex = roomMgr.getUserSeat(userId);

    var userData = null;
    var seats = [];
    for(var i = 0; i < roomInfo.seats.length; ++i){
        var rs = roomInfo.seats[i];
        var online = false;
        if(rs.userId > 0){
            //查看userId有没有绑定信道，绑定了就是在线，没有绑定就是不在线
            online = userMgr.isOnline(rs.userId);
        }

        seats.push({
            userid:rs.userId,
            ip:rs.ip,
            score:rs.score,
            name:rs.name,
            online:online,
            ready:rs.ready,
            seatindex:i
        });

        if(userId == rs.userId){
            userData = seats[i];
        }
    }

    //通知前端
    var ret = {
        errcode:0,
        errmsg:"ok",
        data:{
            roomid:roomInfo.id,
            conf:roomInfo.conf,
            numofgames:roomInfo.numOfGames,
            seats:seats
        }
    };
    var serverId = self.app.get('serverId');
    //发送login_result推送给自己
    self.app.rpc.channel.ChannelRemote.backMessage(session,'login_result',ret,userId,serverId,function () {
        session.set('gameMgr',roomInfo.gameMgr);
        session.push('gameMgr', function(err) {
            if(err){
                console.error('set rid for session service failed! error is : %j', err.stack);
            }
        });

        var gameMgr = session.get('gameMgr');
        gameMgr.setReady(session,self,userId);
        self.app.rpc.channel.ChannelRemote.backMessage(session,'login_finished',{},userId,serverId,function () {
            next(null,{
                errcode:0,
                errormsg:"ok"
            });
        })
    });
    //广播userData给房间里的所有人
    self.app.rpc.channel.ChannelRemote.joinRoom(session,userId,roomId,serverId,function () {
        //通知其它客户端
        self.app.rpc.channel.ChannelRemote.pushMessageInRoom(session,'new_user_comes_push',userData,roomId,function () {

        });
    });

};

//准备
GameService.prototype.ready = function (msg,session,next) {
    console.log("到达RoomService ready");
    var self = this;
    var userId = session.uid;
    if(userId == null){
        return;
    }
    var gameMgr = session.get('gameMgr');
    gameMgr.setReady(session,self,userId);
    var roomId = session.get('roomId');
    self.app.rpc.channel.ChannelRemote.pushMessageInRoom(session,'user_ready_push',{userid:userId,ready:true},roomId,function () {
        
    });
}

//换牌
GameService.prototype.huanpai=function (msg,session) {
    console.log("到达GameService huanpai");
    console.log(msg);
    var self = this;
    var data = msg;
    if(session.uid == null){
        console.log("没有uid");
        return;
    }
    if(data == null){
        console.log("")
        return;
    }

    if(typeof(data) == "string"){
        data = JSON.parse(data);
    }

    var p1 = data.p1;
    var p2 = data.p2;
    var p3 = data.p3;
    if(p1 == null || p2 == null || p3 == null){
        console.log("invalid data");
        return;
    }
    var gameMgr= session.get('gameMgr');
    gameMgr.huanSanZhang(session,self,p1,p2,p3);
};

//定缺
GameService.prototype.dingque = function (msg,session) {
    console.log("到达GameService dingque");
    console.log(msg);
    var self =this;
    var data = msg;
    if(session.uid == null){
        return;
    }
    var que = data;
    var gameMgr = session.get('gameMgr');
    gameMgr.dingQue(session,self,session.uid,que);
};

//出牌
GameService.prototype.chupai = function (msg,session) {
    console.log("---到达GameService chupai---");
    console.log("--pai--");
    var self = this;
    if(session.uid == null){
        return;
    }
    var pai = msg.mjId;
    console.log(pai);
    var gameMgr = session.get('gameMgr');
    gameMgr.chuPai(session,self,pai);
}

//碰
GameService.prototype.peng =function (msg,session) {
    console.log("到达GameService peng");
    var self = this;
    var gameMgr = session.get('gameMgr');
    gameMgr.peng(session,self,session.uid);
};

//杠
GameService.prototype.gang =function (msg,session) {
    console.log("到达GameService gang");
    var self = this;
    var data = msg;
    if(session.uid == null || data == null){
        return;
    }
    var pai = -1;
    if(typeof(data) == "number"){
        pai = data;
    }
    else if(typeof(data) == "string"){
        pai = parseInt(data);
    }
    else{
        console.log("gang:invalid param");
        return;
    }
    var gameMgr = session.get('gameMgr');
    gameMgr.gang(session,self,pai);
};

//胡
GameService.prototype.hu =function (msg,session) {
    console.log("到达GameService hu");
    var self = this;
    if(session.uid == null){
        return;
    }
    var gameMgr = session.get('gameMgr');
    gameMgr.hu(session,self,session.uid);

};

//过
GameService.prototype.guo =function (msg,session) {
    console.log("到达GameService guo");
    var self = this;
    if(session.uid == null){
        return;
    }
    var gameMgr = session.get('gameMgr');
    gameMgr.guo(session,self);
};
