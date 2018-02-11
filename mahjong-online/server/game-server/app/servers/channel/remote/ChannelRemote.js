module.exports = function(app) {
    return new ChannelRemote(app);
};

var ChannelRemote = function(app) {
    this.app = app;
    this.channelService = this.app.get('channelService');
};
ChannelRemote.prototype.backMessage = function(route,msg,userId,serverId,callback){
    console.log("到达ChannelRemote backMessage");
    console.log(route);
    var self =this;
    self.channelService.pushMessageByUids(route,msg,[{uid:userId,sid:serverId}],function () {
        console.log("推送消息成功");
        callback();
    });
};

//在房间里广播消息
ChannelRemote.prototype.pushMessageInRoom = function(route,msg,roomId,callback){
    console.log("到达ChannelRemote pushMessageInRoom");
    console.log(msg);
    var self =this;
    var channel =self.channelService.getChannel(roomId,false);
    var param={
        route:route,
        msg:msg
    };
    channel.pushMessage(param);
    callback();
};

//添加房间广播
ChannelRemote.prototype.joinRoom = function (userId,roomId,serverId,callback) {
    console.log("到达channelRemote joinRoom");
    var self = this;
    var channel =self.channelService.getChannel(roomId,true);
    if(!!channel) {
        channel.add(userId,serverId);
    }
    callback();
};
