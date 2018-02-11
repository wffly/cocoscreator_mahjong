cc.Class({
    extends: cc.Component,
    properties: {
        account:null,
	    userId:null,
		userName:null,
		lv:0,
		exp:0,
		coins:0,
		gems:0,
		sign:0,
        ip:"",
        sex:0,
        roomData:null,
        
        oldRoomId:null,
    },
    //游客验证
    guestAuth:function(){
        var self = this;
        var account = cc.args["account"];
        if(account == null){
            account = cc.sys.localStorage.getItem("account");
        }
        
        if(account == null){
            account = Date.now();
            cc.sys.localStorage.setItem("account",account);
        }
        pomelo.init({
            host:cc.vv.SI.host,
            port:cc.vv.SI.port,
            log:true
        },function () {
            pomelo.request("connector.AccountService.guest",{account:account},self.onAuth);
        });
    },

    //验证，并给全局变量cc.vv.userMgr赋值
    onAuth:function(ret){
        var self = cc.vv.userMgr;
        if(ret.errcode !== 0){
            console.log(ret.errmsg);
        }
        else{
            self.account = ret.account;
            self.sign = ret.sign;
            self.login();
        }   
    },
    //登录
    login:function(){
        var self = this;
        var onLogin = function(ret){
            cc.log(ret);
            if(ret.errcode !== 0){
                console.log(ret.errmsg);
            }
            else{
                if(ret.ret==null){
                    //jump to register user info.
                    cc.director.loadScene("createrole");
                }
                else{
                    console.log(ret);
                    self.account = ret.ret.account;
        			self.userId = ret.ret.userid;
        			self.userName = ret.ret.name;
        			self.lv = ret.ret.lv;
        			self.exp = ret.ret.exp;
        			self.coins = ret.ret.coins;
        			self.gems = ret.ret.gems;
                    self.roomData = ret.ret.roomid;
                    self.sex = ret.ret.sex;
                    self.ip = ret.ret.ip;
        			cc.director.loadScene("hall");
                }
            }
        };
        cc.vv.wc.show("正在登录游戏");
        cc.vv.net.sendRequest("connector.AccountService.login",{account:this.account,sign:this.sign},onLogin);
    },
    //创建用户
    create:function(name){
        var self = this;
        var onCreate = function(ret){
            if(ret.errcode !== 0){
                console.log(ret.errmsg);
            }
            else{
                self.login();
            }
        };
        
        var data = {
            account:this.account,
            sign:this.sign,
            name:name
        };
        cc.vv.net.sendRequest("connector.UserService.create_user",data,onCreate);
    },
    
    enterRoom:function(roomId,callback){
        var self = this;
        var onEnter = function(ret){
            console.log(ret);
            if(ret.errcode !== 0){
                if(ret.errcode == -1){
                    setTimeout(function(){
                        self.enterRoom(roomId,callback);
                    },5000);
                }
                else{
                    cc.vv.wc.hide();
                    if(callback != null){
                        callback(ret);
                    }
                }
            }
            else{
                if(callback != null){
                    callback(ret);
                }
                cc.vv.gameNetMgr.connectGameServer(ret);
            }
        };
        
        var data = {
            account:cc.vv.userMgr.account,
            sign:cc.vv.userMgr.sign,
            roomid:roomId
        };
        cc.vv.wc.show("正在进入房间 " + roomId);
        cc.vv.net.sendRequest("connector.RoomService.enter_private_room",data,onEnter);
    },

    getHistoryList:function(callback){
        var self = this;
        var onGet = function(ret){
            if(ret.errcode !== 0){
                console.log(ret.errmsg);
            }
            else{
                console.log(ret.history);
                if(callback != null){
                    callback(ret.history);
                }
            }
        };
        
        var data = {
            account:cc.vv.userMgr.account,
            sign:cc.vv.userMgr.sign,
        };
        cc.vv.http.sendRequest("/get_history_list",data,onGet);
    },

    getGamesOfRoom:function(uuid,callback){
        var self = this;
        var onGet = function(ret){
            if(ret.errcode !== 0){
                console.log(ret.errmsg);
            }
            else{
                console.log(ret.data);
                callback(ret.data);
            }
        };
        
        var data = {
            account:cc.vv.userMgr.account,
            sign:cc.vv.userMgr.sign,
            uuid:uuid,
        };
        cc.vv.http.sendRequest("/get_games_of_room",data,onGet);
    },
    
    getDetailOfGame:function(uuid,index,callback){
        var self = this;
        var onGet = function(ret){
            if(ret.errcode !== 0){
                console.log(ret.errmsg);
            }
            else{
                console.log(ret.data);
                callback(ret.data);
            }       
        };
        
        var data = {
            account:cc.vv.userMgr.account,
            sign:cc.vv.userMgr.sign,
            uuid:uuid,
            index:index,
        };
        cc.vv.http.sendRequest("/get_detail_of_game",data,onGet);
    }
});
