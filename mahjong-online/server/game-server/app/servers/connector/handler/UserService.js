module.exports = function(app) {
    return new UserService(app);
};

var UserService = function(app) {
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

UserService.prototype.create_user = function(msg, session, next) {
    console.log("到达UserService create_user");
    var self = this;
    if(!check_account(msg.account,msg.sign)){
        return;
    }
    var account = msg.account;
    var name = msg.name;
    var coins = 1000;
    var gems = 21;
    console.log("name:"+name+
        "account:"+account+
        "client_service"+" "+
        "line:96");

    self.app.rpc.dao.UserDao.is_user_exist(session,account,function (ret) {
        console.log("is_user_exist返回结果为:"+ret);
        if(!ret){
            self.app.rpc.dao.UserDao.create_user(session,account,name,coins,gems,0,null,function(ret){
                console.log("create_user返回结果为:"+ret);
                if (ret == null) {
                    next(null,{
                        errcode:2,
                        errmsg:"system error."
                    });
                }
                else{
                    next(null,{
                        errcode:0,
                        errmsg:"ok"
                    });
                }
            });
        }
        else{
            next(null,{
                errcode:1,
                errmsg:"account have already exist."
            });
        }
    });
};