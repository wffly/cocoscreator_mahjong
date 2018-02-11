var crypto = require('../../../utils/crypto');
var config = require('../../../server_configs/config').account_server();
module.exports = function(app) {
    return new AccountService(app);
};

var AccountService = function(app) {
    this.app = app;
};

function check_account(account,sign){
    if(account == null || sign == null){
        next(null,{
            errcode:1,
            errmsg:"unknown error"
        });
        return false;
    }
    return true;
}
//游客
AccountService.prototype.guest = function(msg, session, next) {
    console.log("到达AccountControl guest");
    var ip = session.__session__.__socket__.remoteAddress.ip.split(":")[3];
    var account = "guest_" + msg.account;
    var sign = crypto.md5(account + ip + config.ACCOUNT_PRI_KEY);
    var ret = {
        errcode:0,
        errmsg:"ok",
        account:account,
        halladdr:config.HALL_IP+":"+config.HALL_CLIENT_PORT,
        sign:sign
    }
    next(null,ret);
};
//登录
AccountService.prototype.login = function (msg, session, next) {
    console.log("到达AccountControl login");
    var self = this;
    if(!check_account(msg.account,msg.sign,next)){
        return;
    }

    var ip = session.__session__.__socket__.remoteAddress.ip;
    if(ip.indexOf("::ffff:") != -1){
        ip = ip.substr(7);
    }

    var account = msg.account;

    self.app.rpc.dao.UserDao.get_user_data(session,account,function (data) {
        console.log(data);
        if(data==null||data.length==0){
            next(null,{
                errcode:0,
                errmsg:"ok"
            });
            return;
        }

        var ret = {
            account:data[0].account,
            userid:data[0].userid,
            name:data[0].name,
            lv:data[0].lv,
            exp:data[0].exp,
            coins:data[0].coins,
            gems:data[0].gems,
            ip:ip,
            sex:data[0].sex,
        };

        self.app.rpc.dao.RoomDao.get_room_id_of_user(session,data[0].userid,function(roomId){
            //如果用户处于房间中，则需要对其房间进行检查。 如果房间还在，则通知用户进入
            if(roomId != null){
                //检查房间是否存在于数据库中
                self.app.rpc.dao.RoomDao.is_room_exist(session,roomId,function (retval){
                    console.log(retval);
                    if(retval){
                        ret.roomid = roomId;
                    }
                    else{
                        //如果房间不在了，表示信息不同步，清除掉用户记录
                        self.app.rpc.dao.RoomDao.set_room_id_of_user(data.userid,null);
                    }
                    next(null,{
                        errcode:0,
                        errmsg:"ok",
                        ret:ret
                    });
                });
            }
            else {
                next(null,{
                    errcode:0,
                    errmsg:"ok",
                    ret:ret
                });
            }
        });
    });
};