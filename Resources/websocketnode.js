
/*

NodeJS JavaScript Client

*/

// this.WebSocketNodeJS
  
(function(scope){
	
	var WebSocketNodeJS = function(uri, autoConnect){
		this.on_open = function(){};
		this.disconnectHandler = function(){};
		this.uri = uri;
		this._state = null;
		Object.defineProperty(this, 'state', {
	    	get: function(){
	    		return this._state;
	    	},
		    set: function(v) {
		    	var oldState = this._state; 
		    	this._state = v;
		    	if(oldState == 'connected' && v == 'disconnected'){
		    		var disMsg = Titanium.UI.createAlertDialog({
				        title : 'Alert',
				        message : '與伺服器連線中斷！',
				        buttonNames : ['確定']
				    });
// 				 
					// disMsg.addEventListener('click', (function(){
						// var scope = this;
						// return function(e) {
					        // if(e.index == 0) {
					    		// setTimeout((function(){
					    			// var s = this;
					    			// return function(){
					    				// if(s.disconnectHandler) s.disconnectHandler();
					    			// };
					    		// }).call(scope),10);
					        // }
					    // };
					// }).call(this));
				    disMsg.show();
		    	}
			}
		});
		
		if(autoConnect === true){
			this.connect();
		}
	};
	
	WebSocketNodeJS.prototype.connect = function(){
		var io = require('socket.io');
		Ti.API.log("In WebsocketNodeJS: "+this.uri);
		this.socket = io.connect(this.uri, {forceNew:true});
		
		var connectHandler = (function(ins){
			return function(){
				Ti.API.log('connected!');
				ins.state = 'connected';
				ins.on_open();
			};
		})(this);
		
		this.socket.on('connect', connectHandler);
		this.socket.on('disconnect', (function(scope){
			return function(){
				scope.state = 'disconnected';
				scope.disconnectHandler();
			};
		})(this));;

		return this;
	};
	
	WebSocketNodeJS.prototype.disconnect = function(){
		if(this.socket){
			this.socket.disconnect();
			this.state = 'disconnected';
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

