
/*

NodeJS JavaScript Client

*/

// this.WebSocketNodeJS
  
(function(scope){
	
	var WebSocketNodeJS = function(uri, autoConnect){
		this.on_open = function(){};
		this.disconnectHandler = function(){};
		this.uri = uri;
		if(autoConnect === true){
			this.connect();
		}
	};
	
	WebSocketNodeJS.prototype.connect = function(){
		var io = require('socket.io');
		Ti.API.log("In WebsocketNodeJS: "+this.uri);
		this.socket = io.connect(this.uri);
		
		var connectHandler = (function(ins){
			return function(){
				Ti.API.log('connected!');
				ins.state = 'connected';
				ins.on_open();
			};
		})(this);
		
		this.socket.on('connect', connectHandler);

		return this;
	};
	
	WebSocketNodeJS.prototype.disconnect = function(){
		this.state = 'disconnected';
		if(this.socket){
			this.socket.disconnect();
			this.disconnectHandler();
		}
		return this;
	};
	
	WebSocketNodeJS.prototype.bind = function(name, fn){
		if(this.socket){
			this.socket.on(name, fn);
		}
		return this;
	};
	
	WebSocketNodeJS.prototype.unbind = function(name){
		if(this.socket){
			this.socket.removeAllListeners(name);
		}
		return this;
	};
	
	WebSocketNodeJS.prototype.trigger = function(name, data, callback){
		if(this.socket){
			this.socket.emit(name, data, callback);
		}
		return this;
	};
	
	scope.WebSocketNodeJS = WebSocketNodeJS;
})(this);  

