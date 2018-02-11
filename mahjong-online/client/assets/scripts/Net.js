var Global = cc.Class({
    extends: cc.Component,
    statics: {
        ip:"",
        sio:null,
        isPinging:false,
        fnDisconnect:null,
        handlers:{},

        //注册socket事件
        addHandler:function(event,fn){
            if(this.handlers[event]){
                console.log("event:" + event + "' handler has been registered.");
                return;
            }

            var handler = function(data){
                //console.log(event + "(" + typeof(data) + "):" + (data? data.toString():"null"));
                if(event != "disconnect" && typeof(data) == "string"){
                    data = JSON.parse(data);
                }
                fn(data);
            };
            
            this.handlers[event] = handler;
            console.log("register:function " + event);
            pomelo.on(event,handler);
        },

        /*
        connect:function() {
            var self = this;
            cc.log("进入游戏连接注册");


            //给注册的事件绑定动作
            for(var key in this.handlers){
                var value = this.handlers[key];
                if(typeof(value) == "function"){
                    if(key == 'disconnect'){
                        this.fnDisconnect = value;
                    }
                    else{
                        console.log("register:function " + key);
                        pomelo.on(key,value);
                    }
                }
            }
            //this.startHearbeat();
        },
        */
        startHearbeat:function(){
            pomelo.on('game_pong',function(){
                console.log('game_pong');
                self.lastRecieveTime = Date.now(); 
            });
            this.lastRecieveTime = Date.now();
            var self = this;
            console.log(1);
            if(!self.isPinging){
                console.log(1);
                self.isPinging = true;
                setInterval(function(){
                    console.log(3);
                    if(self.sio){
                        console.log(4);
                        if(Date.now() - self.lastRecieveTime > 10000){
                            self.close();
                        }
                        else{
                            self.ping();
                        }                        
                    }
                },5000);
            }   
        },




        /*
        send:function(event,data){
            if(this.sio.connected){
                if(data != null && (typeof(data) == "object")){
                    data = JSON.stringify(data);
                    //console.log(data);              
                }
                this.sio.emit(event,data);                
            }
        },
        */
        //发送请求
        sendRequest:function (route,data,callback){
            cc.log("给pomelo服务器发送请求");
            pomelo.request(route,data,callback);
        },
        
        ping:function(){
            this.send('game_ping');
        },
        
        close:function(){
            console.log('close');
            if(this.sio && this.sio.connected){
                this.sio.connected = false;
                this.sio.disconnect();
                this.sio = null;
            }
            if(this.fnDisconnect){
                this.fnDisconnect();
                this.fnDisconnect = null;
            }
        },
        
        test:function(fnResult){
            var xhr = null;
            var fn = function(ret){
                fnResult(ret.isonline);
                xhr = null;
            }
            
            var arr = this.ip.split(':');
            var data = {
                account:cc.vv.userMgr.account,
                sign:cc.vv.userMgr.sign,
                ip:arr[0],
                port:arr[1],
            }
            xhr = cc.vv.http.sendRequest("/is_server_online",data,fn);
            setTimeout(function(){
                if(xhr){
                    xhr.abort();
                    fnResult(false);                    
                }
            },1500);
        }
    },
});