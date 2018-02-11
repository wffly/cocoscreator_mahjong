var tokenMgr = require('../utils/token');
var crypto = require('../utils/crypto');
var configs = require("../server_configs/config");
var config = configs.game_server();
//每个room的数据 roomId为键
var rooms = {};
//正在创建的房间
var creatingRooms = {};

/*
	userId为键
	userLocation[userId] = {
		roomId:roomId,
		seatIndex:i
	};
*/
var userLocation = {};
var totalRooms = 0;

var DI_FEN = [1,2,5];
var MAX_FAN = [3,4,5];
var JU_SHU = [4,8];
var JU_SHU_COST = [2,3];
//随机房间Id
exports.generateRoomId=function (){
    var roomId = "";
    for(var i = 0; i < 6; ++i){
        roomId += Math.floor(Math.random()*10);
    }
    return roomId;
}

exports.constructRoomFromDb=function(dbdata){
    var roomInfo = {
        uuid:dbdata.uuid,
        id:dbdata.id,
        numOfGames:dbdata.num_of_turns,
        createTime:dbdata.create_time,
        nextButton:dbdata.next_button,
        seats:new Array(4),
        conf:JSON.parse(dbdata.base_info)
    };


    if(roomInfo.conf.type == "xlch"){
        roomInfo.gameMgr = require("../../../game/gamemgr_xlch");
    }
    else{
        roomInfo.gameMgr = require("../../../game/gamemgr_xzdd");
    }
    var roomId = roomInfo.id;

    for(var i = 0; i < 4; ++i){
        var s = roomInfo.seats[i] = {};
        s.userId = dbdata["user_id" + i];
        s.score = dbdata["user_score" + i];
        s.name = dbdata["user_name" + i];
        s.ready = false;
        s.seatIndex = i;
        s.numZiMo = 0;
        s.numJiePao = 0;
        s.numDianPao = 0;
        s.numAnGang = 0;
        s.numMingGang = 0;
        s.numChaJiao = 0;

        if(s.userId > 0){
            userLocation[s.userId] = {
                roomId:roomId,
                seatIndex:i
            };
        }
    }
    rooms[roomId] = roomInfo;
    totalRooms++;
    return roomInfo;
};

//进入房间
exports.enterRoom=function(session,self,userId,name,roomId,fnCallback){
    console.log("进入enterRoom");
    //修改user表的roomId
    var room = rooms[roomId];
    if(room){
        exports.fnTakeSeat(session,self,room,roomId,userId,name,function (ret){
            if(ret!=0){
                fnCallback(3);
            }
            var token = tokenMgr.createToken(userId, 5000);
            self.app.rpc.dao.RoomDao.set_room_id_of_user(session, userId, roomId, function (ret) {
                if (!ret) {
                   fnCallback(-1);
                }
                var ret = {
                    roomid: roomId,
                    token: token,
                    time: Date.now()
                };
                ret.sign = crypto.md5(ret.roomid + ret.token + ret.time + config.ROOM_PRI_KEY);
               fnCallback(0,ret);
            });
        });
    }
    else{
        //获得房间信息
        self.app.rpc.dao.RoomDao.get_room_data(session,roomId,function(dbdata){
            if(dbdata == null){
                //找不到房间
                fnCallback(2);
            }
            else{
                //construct room.
                room = exports.constructRoomFromDb(dbdata);
                var ret = exports.fnTakeSeat(room);
                if(ret!=0){
                    fnCallback(3);
                }
                var token = tokenMgr.createToken(userId, 5000);
                self.app.rpc.dao.RoomDao.set_room_id_of_user(session, userId, roomId, function (ret) {
                    if (!ret) {
                      fnCallback(-1);
                    }
                    var ret = {
                        roomid: roomId,
                        token: token,
                        time: Date.now()
                    };
                    ret.sign = crypto.md5(ret.roomid + ret.token + ret.time + config.ROOM_PRI_KEY);
                    fnCallback(0,ret);
                });
            }
        });
    }

};

//找个座位
exports.fnTakeSeat=function(session,self,room,roomId,userId,name,callback) {
    console.log("进入fnTakeSeat");
    if(exports.getUserRoom(userId) == roomId){
        callback(-1);
        return;
    }
    for(var i = 0; i < 4; ++i){
        var seat = room.seats[i];
        if(seat.userId <= 0){
            seat.userId = userId;
            seat.name = name;
            userLocation[userId] = {
                roomId:roomId,
                seatIndex:i
            };
            self.app.rpc.dao.RoomDao.update_seat_info(session,roomId,i,seat.userId,"",seat.name,function () {
                callback(0);
            });
            return;
        }
    }
    //房间已满
    callback(1);
};

//从userLoacation中找座位信息
exports.getUserRoom=function(userId){
    var location = userLocation[userId];
    if(location != null){
        return location.roomId;
    }
    return null;
};

//创建房间
exports.createRoom = function(session,self,confs,account,next) {
    //通过account来查询用户信息
    self.app.rpc.dao.UserDao.get_user_data(session, account, function (data) {
        if (data == null || data.length == 0) {
            next(null, {
                errcode: 1,
                errmsg: "system error"
            });
            return;
        }
        var userId = data[0].userid;
        var name = data[0].name;
        //获得用户房间号，如果存在 说明已经在房间之中
        self.app.rpc.dao.RoomDao.get_room_id_of_user(session, userId, function (roomId) {
            if (roomId != null) {
                next(null, {
                    errcode: -1,
                    errormsg: "user is playing in room now."
                });
                return;
            }
            //通过account来获取用户的房卡数量
            self.app.rpc.dao.UserDao.get_gems(session, account, function (data) {
                console.log("RoomService.js line:90");
                console.log(data);
                if (data == null) {
                    next(null, {
                        errcode: -1,
                        errormsg: "gems is not enough."
                    });
                }
                var gems = data.gems;
                var cost = JU_SHU_COST[confs.jushuxuanze];
                //随机房间号，完成创建
                var fnCreate = function () {
                    var roomId = exports.generateRoomId();
                    if (rooms[roomId] != null || creatingRooms[roomId] != null) {
                        fnCreate();
                    }
                    else {
                        creatingRooms[roomId] = true;
                        //查询房间是否存在
                        self.app.rpc.dao.RoomDao.is_room_exist(session, roomId, function (ret) {
                            if (ret) {
                                delete creatingRooms[roomId];
                                fnCreate();
                            }
                            else {
                                var createTime = Math.ceil(Date.now() / 1000);
                                console.log(confs);
                                confs = JSON.parse(confs);
                                var roomInfo = {
                                    uuid: "",
                                    id: roomId,
                                    numOfGames: 0,
                                    createTime: createTime,
                                    nextButton: 0,
                                    seats: [],
                                    conf: {
                                        type: confs.type,
                                        baseScore: DI_FEN[confs.difen],
                                        zimo: confs.zimo,
                                        jiangdui: confs.jiangdui,
                                        hsz: confs.huansanzhang,
                                        dianganghua: parseInt(confs.dianganghua),
                                        menqing: confs.menqing,
                                        tiandihu: confs.tiandihu,
                                        maxFan: MAX_FAN[confs.zuidafanshu],
                                        maxGames: JU_SHU[confs.jushuxuanze],
                                        creator: userId,
                                    }
                                };
                                if (confs.type == "xlch") {
                                    roomInfo.gameMgr = require("./gamemgr_xlch");
                                }
                                else {
                                    roomInfo.gameMgr = require("./gamemgr_xzdd");
                                }
                                for (var i = 0; i < 4; ++i) {
                                    roomInfo.seats.push({
                                        userId: 0,
                                        score: 0,
                                        name: "",
                                        ready: false,
                                        seatIndex: i,
                                        numZiMo: 0,
                                        numJiePao: 0,
                                        numDianPao: 0,
                                        numAnGang: 0,
                                        numMingGang: 0,
                                        numChaJiao: 0,
                                    });
                                }
                                console.log(roomInfo);
                                //把创建房间的数据写到数据库里
                                self.app.rpc.dao.RoomDao.create_room(session, roomInfo.id, roomInfo.conf, createTime, function (uuid) {
                                    //将服务器内存中正在创建的房间删除
                                    delete creatingRooms[roomId];
                                    if (uuid != null) {
                                        //dao返回uuid
                                        roomInfo.uuid = uuid;
                                        console.log(uuid);
                                        //roomId----roomInfo 放在服务器内存中
                                        rooms[roomId] = roomInfo;
                                        totalRooms++;
                                        exports.enterRoom(session,self,userId,name, roomId, function (errcode,enterInfo) {
                                            if (!enterInfo) {
                                                if (errcode == 1) {
                                                    next(null, {
                                                        errcode: 4,
                                                        errormsg: "room is full."
                                                    });
                                                }
                                                else if (errcode == 2) {
                                                    next(null, {
                                                        errcode: 3,
                                                        errormsg: "can't find room."
                                                    });
                                                }
                                                return;
                                            }else{
                                                next(null,{
                                                    errcode:0,
                                                    errormsg:"ok",
                                                    ret:enterInfo
                                                });
                                            }
                                        });
                                    }
                                });
                            }
                        });
                    }
                };
                fnCreate();
            });
        });
    });
};

//获得用户座位下标
exports.getUserSeat = function(userId){
    var location = userLocation[userId];
    //console.log(userLocation[userId]);
    if(location != null){
        return location.seatIndex;
    }
    return null;
};

//通过roomId获得房间信息
exports.getRoom = function(roomId){
    return rooms[roomId];
};

//设置准备
exports.setReady = function(userId,value){
    var roomId = exports.getUserRoom(userId);
    if(roomId == null){
        return;
    }

    var room = exports.getRoom(roomId);
    if(room == null){
        return;
    }

    var seatIndex = exports.getUserSeat(userId);
    if(seatIndex == null){
        return;
    }

    var s = room.seats[seatIndex];
    s.ready = value;
};