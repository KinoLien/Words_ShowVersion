// this sets the background color of the master UIView (when there are no windows/tab groups on it)
Titanium.UI.setBackgroundColor('#fff');

// Add override functions
String.prototype.trim = function(){
	return this.replace(/^\s+|\s+$/g, '');
};
Object.prototype.combine = function(o){
	var res = {};
	var me = this;
	for(var p in me){
		res[p] = me[p];
	}
	if(isObject(o)){
		for(var p in o){
			res[p] = o[p];
		}
	}
	return res;
};

// requires
var Canvas = require('com.wwl.canvas');
// var TiWS = require("net.iamyellow.tiws");

Canvas.createCanvasView = (function(oldCreate){
	return function(o){
		var res = oldCreate.call(this, o);
		res.hasTrack = false;
		// drawPoint stroke
		var oldDrawPoint = res.drawPoint;
		var oldStroke = res.stroke;
		var oldClear = res.clear;
		
		res.drawPoint = (function(oldFn){
			return function(){
				oldFn.apply(this, arguments);
				this.hasTrack = true;
			};
		})(oldDrawPoint);
		
		res.stroke = (function(oldFn){
			return function(){
				oldFn.call(this);
				this.hasTrack = true;
			};
		})(oldStroke);
		
		res.clear = (function(oldFn){
			return function(){
				oldFn.call(this);
				this.hasTrack = false;
			};
		})(oldClear);
		return res;
	};
})(Canvas.createCanvasView);

// condition variables
var isAndroid = Titanium.Platform.name == 'android';

// judge functions
var isObject = function(v){
	return v && Object.prototype.toString.call(v) == '[object Object]';
};
var isFunction = function(v){
	return v && Object.prototype.toString.call(v) == "[object Function]";
};

// App windows and objects
var currentWindow = null;
var currentWindowOpenCallback = null;
var currentMask = null;
var inputView = null;
//var runView = null;
//var idiomsView = null;
var socketObj = null;

// state, default values
var appValidModes = [
	Ti.UI.LANDSCAPE_LEFT,
    Ti.UI.LANDSCAPE_RIGHT,
    Ti.UI.PORTRAIT
];
var isDrawing = false;
var lastX = 0;
var lastY = 0;
var testMode = false;
var socketUser = '1';
var socketIpAddress = '192.168.0.118';
var socketPortNumber = '5001';
var railsPortNumber = '3000';
var preWindowStack = [];
var triggerObj = {};
var stampFilter = 20;
var canvasProtocol = {
	width: 500,
	lineWidth: 10,
	lineColor: '#000000',
	lineCap: 'round'
};
var watingTimeOut;
var gameInfo = false;
// Idioms Initialize
var idiomsCurrentRow = 1;
var idiomsCurrentCol = 1;
var idiomsDirtyList = {};	
var idiomsOccupyArray = [];
var idiomsShortCanvasArray = [];
var idiomsCanvasPointArray = [];
// scales
var idiomsShortToProtocolScale = 1;
var idiomsOriginToProtocolScale = 1;
var idiomsOriginToShortScale = 1;

// constants
// idioms game event
var IDIOMS_EVENT = 'idioms';
var WRONG_EVENT = 'B2';
var MIX_EVENT = 'mix';
// normal events
var TOUCH_DOWN_EVENT = 'down_location';
var TOUCH_MOVE_EVENT = 'move_location';
var DEVICE_READY_EVENT = 'device_ready';
var CLEAR_EVENT = 'clear';
var ACTION_EVENT = 'action';
var SUBMIT_EVENT = 'submit';
var RESET_EVENT = 'reset'; // Not test yet
var CONTINUE_WRITE_EVENT = 'continue_write'; // **
var REWRITE_EVENT = 'rewrite';
var MOVE_BLOCK_EVENT = 'move_block';
var CHANG_COLOR_EVENT = 'change_color';
var SEND_TEXT_EVENT = 'send_text';
var END_ROUND_EVENT = 'end_round';
// Action events
var START_EVENT = 'start';
var STOP_EVENT = 'stop';

var clearConnectionInfo = function(clearSocket){
	if(currentWindow){
		currentWindow.countDownLabel.stopCountDown();
		if(currentWindow.activity && currentWindow.activity.removeEventListener){
			currentWindow.activity.removeEventListener("pause", pauseEventHandler);	
		}
		currentWindow.removeEventListener("open", currentWindowOpenCallback);
		currentWindowOpenCallback = null;
		currentWindow.close();
		currentWindow = null;
	}
	if(currentMask){
		//currentMask.hide();
		currentMask = inputView.maskView;
	}
	if(clearSocket !== false && socketObj){
		if(socketObj.state != 'disconnected'){
			socketObj.unbind();
			socketObj.disconnect();	
		}
		socketObj = null;
		gameInfo = false;	
	}
	
	watingTimeOut = null;
	testMode = false;
	isDrawing = false;
	// idioms B3
	idiomsCurrentRow = 1;
	idiomsCurrentCol = 1;
	idiomsOccupyArray = null;
	idiomsDirtyList = null;
	idiomsShortCanvasArray = null;
	idiomsCanvasPointArray = null;
	
	// new B2
	wrongCurrentRow = 1;
	wrongCurrentCol = 1;
	wrongOccupyArray = null;
	wrongDirtyList = null;
	wrongShortCanvasArray = null;
	wrongCanvasPointArray = null;
	
	// mix
	mixCurrentRow = 1;
	mixCurrentCol = 1;
	mixOccupyArray = null;
	// mixDirtyList = null;
	mixShortCanvasArray = null;
	mixCanvasPointArray = null;
	
	// scales
	wrongShortToProtocolScale = 1;
	wrongOriginToProtocolScale = 1;
	wrongOriginToShortScale = 1;
	mixShortToProtocolScale = 1;
	mixOriginToProtocolScale = 1;
	mixOriginToShortScale = 1;
	idiomsShortToProtocolScale = 1;
	idiomsOriginToProtocolScale = 1;
	idiomsOriginToShortScale = 1;
};

var getGameInfoRequest = function(handlers){
	handlers = {
		onsendHandler: function(){},
		successHandler: function(){},
		errorHandler: function(){}
	}.combine(handlers);
	var gameInfoUrl = "http://" + socketIpAddress + ":" + railsPortNumber + 
		"/games/get_game_data.json?id=" + socketUser;
	var client = Ti.Network.createHTTPClient({
		onload: function(e) {
			var self = e.source;
			gameInfo = parseGameInfo(JSON.parse(self.responseText), gameInfoUrl);
			if(gameInfo && typeof handlers.successHandler == 'function'){
				handlers.successHandler.call(self, gameInfo);
			}else if(!gameInfo && typeof handlers.errorHandler == 'function'){
				Ti.API.debug(e.error);
				handlers.errorHandler.call(self, gameInfo);
			}
		},
		onerror: function(e) {
			var self = e.source;
			Ti.API.debug(e.error);
			if(typeof handlers.errorHandler == 'function'){
				handlers.errorHandler.call(self, e.error);
			}
		},
		timeout : 4000  // in milliseconds
	});
	client.open('GET', gameInfoUrl);
	if(typeof handlers.onsendHandler == 'function'){
		handlers.onsendHandler.call(client);
	}
	client.send();
};

var parseGameInfo = function(info, sourceUrl){
	if(info == false) return false;
	/*	
	{
	    "visitor": {
	        "id": 9,
	        "game_id": 2,
	        "number": 1,
	        "name": "陳顯耀",
	        "image": {
	            "url": "/uploads/visitor/image/9/demo1.JPG",
	            "thumb": {
	                "url": "/uploads/visitor/image/9/thumb_demo1.JPG"
	            },
	            "medium": {
	                "url": "/uploads/visitor/image/9/medium_demo1.JPG"
	            }
	        },
	        "created_at": "2014-09-04T10:19:16.951Z",
	        "updated_at": "2014-09-04T10:19:16.951Z"
	    },
	    "second": "20",
	    "stage": "stage1"
	}
	*/
	
	sourceUrl = sourceUrl || "";
	var imageUrl = info.visitor.image.url;
	if(sourceUrl){
		var spt = sourceUrl.split('/');
		var end = (spt.length > 3)? 3 : undefined;
		imageUrl = spt.slice(0, end).join('/') + imageUrl; 
	}
	return {
		sourceUrl: sourceUrl,
		number: info.visitor.number,
		name: info.visitor.name,
		second: parseInt(info.second),
		stage: info.stage,
		imageUrl: imageUrl
	};
};

var prepareStage = function(stage, second, common, locking){
	var toRefresh = false;
	var hasSecond = true;
	var passedMsg = "已傳送資料，等待後台判斷是否正確。";
	switch (stage){
		case "A1":
			toRefresh = false;
			hasSecond = true;
			break;
		case "A2":
			toRefresh = false;
			hasSecond = true;
			break;
		case "A3":
			hasSecond = false;
			break;
		case "B1":
			hasSecond = false;
			break;
		case "B2_v1":
			hasSecond = false;
			break;
		case "B2":
			hasSecond = false;
			break;
		case "mix":
			hasSecond = second && second > 0;
			toRefresh = common && common == 1 && locking == 0;
			toLocked = locking && locking == 1;
			break;
		case "B3":
			toRefresh = false;
			hasSecond = true;
			break;
	}
	switch (stage){
		case "A1":
		case "A2":
		case "A3":
		case "B1":
		case "B2_v1":
			currentWindow = runningViewInit({
				imageUrl: gameInfo? gameInfo.imageUrl : "exampleHead.png",
				hasSecond: hasSecond
			});
			currentWindow.refreshCountAfterStop = toRefresh;
			currentWindow.passedMessage = passedMsg;
			currentWindowOpenCallback = function(){
				currentWindow.activity.actionBar.hide();
				currentWindow.activity.addEventListener("pause", pauseEventHandler);
				clearInterval(inputView.maskInterval);
				if(socketObj){
					socketObj.bind(RESET_EVENT, resetCallback);
					socketObj.bind(ACTION_EVENT, runningActionCallback());
					socketObj.bind(CLEAR_EVENT, runningClearCallback());
					socketObj.bind(CONTINUE_WRITE_EVENT, runningContinueWriteCallback());
					socketObj.trigger(DEVICE_READY_EVENT, triggerObj);	
				}
				currentMask.hide();
				currentMask = currentWindow.maskView;
				currentWindow.arrangeLayout(Ti.UI.PORTRAIT);
			};
			currentWindow.addEventListener('open', currentWindowOpenCallback);
			currentWindow.open();
			break;
		case "B2":
			currentWindow = wrongViewInit({
				imageUrl: gameInfo? gameInfo.imageUrl : "exampleHead.png",
				hasSecond: hasSecond
			});
			currentWindow.refreshCountAfterStop = toRefresh;
			currentWindowOpenCallback = function(){
				currentWindow.activity.actionBar.hide();
				currentWindow.activity.addEventListener("pause", pauseEventHandler);
				clearInterval(inputView.maskInterval);
				if(socketObj){
					socketObj.bind(RESET_EVENT, resetCallback);
					socketObj.bind(ACTION_EVENT, wrongActionCallback());
					socketObj.bind(CLEAR_EVENT, wrongClearCallback());
					//socketObj.bind(CONTINUE_WRITE_EVENT, runningContinueWriteCallback());
					socketObj.trigger(DEVICE_READY_EVENT, triggerObj);	
				}
				currentMask.hide();
				currentMask = currentWindow.maskView;
				currentWindow.arrangeLayout(Ti.UI.PORTRAIT);
			};
			currentWindow.addEventListener('open', currentWindowOpenCallback);
			currentWindow.open();
			break;
		case "mix":
			currentWindow = mixViewInit({
				imageUrl: gameInfo? gameInfo.imageUrl : "exampleHead.png",
				hasSecond: hasSecond
			});
			currentWindow.refreshCountAfterStop = toRefresh;
			currentWindowOpenCallback = function(){
				currentWindow.activity.actionBar.hide();
				currentWindow.activity.addEventListener("pause", pauseEventHandler);
				clearInterval(inputView.maskInterval);
				if(socketObj){
					socketObj.bind(RESET_EVENT, resetCallback);
					socketObj.bind(ACTION_EVENT, mixActionCallback());
					socketObj.bind(CLEAR_EVENT, mixClearCallback());
					socketObj.bind(CONTINUE_WRITE_EVENT, mixContinueWriteCallback());
					socketObj.bind(SEND_TEXT_EVENT, mixSendTextCallback()); 
					socketObj.trigger(DEVICE_READY_EVENT, triggerObj);	
				}
				currentMask.hide();
				currentMask = currentWindow.maskView;
				currentWindow.arrangeLayout(Ti.UI.PORTRAIT);
			};
			currentWindow.addEventListener('open', currentWindowOpenCallback);
			currentWindow.open();
			break;
		case "B3":
			currentWindow = idiomsViewInit({
				hasSecond: hasSecond
			});
			currentWindow.refreshCountAfterStop = toRefresh;
			currentWindowOpenCallback = function(e){
				currentWindow.activity.actionBar.hide();
				currentWindow.activity.addEventListener("pause", pauseEventHandler);
				clearInterval(inputView.maskInterval);
				if(socketObj){
					socketObj.bind(RESET_EVENT, resetCallback);
					socketObj.bind(ACTION_EVENT, idiomsActionCallback());
					socketObj.bind(TOUCH_DOWN_EVENT, idiomsTouchDownCallback());
					socketObj.bind(TOUCH_MOVE_EVENT, idiomsTouchMoveCallback());
					socketObj.bind(CLEAR_EVENT, idiomsClearCallback());
					//idiomsSendTextCallback
					socketObj.bind(SEND_TEXT_EVENT, idiomsSendTextCallback()); 
					socketObj.bind(MOVE_BLOCK_EVENT, idiomsMoveBlockCallback());
					socketObj.bind(CHANG_COLOR_EVENT, idiomsChangeColorCallback());
					socketObj.bind(REWRITE_EVENT, idiomsRewriteCallback());
					socketObj.bind(CONTINUE_WRITE_EVENT, idiomsContinueWriteCallback());
					//socketObj.bind(IDIOMS_EVENT + "." + END_ROUND_EVENT, idiomsSubmitCallback.call(idiomsView));
					socketObj.trigger(DEVICE_READY_EVENT, triggerObj);	
				}
				currentMask.hide();
				currentMask = currentWindow.maskView;
				currentWindow.arrangeLayout(Ti.UI.LANDSCAPE_LEFT);
			};
			currentWindow.addEventListener('open', currentWindowOpenCallback);
			currentWindow.open();
			break;
		default:
			break;
		
	}
};

var deprecateStage = function(stageName){
	switch (stageName){
		case "A1":
		case "A2":
		case "A3":
		case "B1":
		case "B2_v1":
			if(socketObj){
				socketObj.unbind(ACTION_EVENT);
				socketObj.unbind(CLEAR_EVENT);
				socketObj.unbind(CONTINUE_WRITE_EVENT);
				socketObj.unbind(RESET_EVENT);
			}
			break;
		case "B2":
			if(socketObj){
				socketObj.unbind(ACTION_EVENT);
				socketObj.unbind(CLEAR_EVENT);
				socketObj.unbind(RESET_EVENT);
				//socketObj.unbind(CONTINUE_WRITE_EVENT);
			}
			break;
		case "mix":
			if(socketObj){
				socketObj.unbind(ACTION_EVENT);
				socketObj.unbind(CLEAR_EVENT);
				socketObj.unbind(CONTINUE_WRITE_EVENT);
				socketObj.unbind(SEND_TEXT_EVENT); 
				socketObj.unbind(RESET_EVENT);
			}
			break;
		case "B3":
			if(socketObj){
				socketObj.unbind(ACTION_EVENT);
				socketObj.unbind(TOUCH_DOWN_EVENT);
				socketObj.unbind(TOUCH_MOVE_EVENT);
				socketObj.unbind(CLEAR_EVENT);
				socketObj.unbind(MOVE_BLOCK_EVENT);
				socketObj.unbind(CHANG_COLOR_EVENT);
				socketObj.unbind(SEND_TEXT_EVENT);
				socketObj.unbind(REWRITE_EVENT);
				socketObj.unbind(CONTINUE_WRITE_EVENT);
				socketObj.unbind(RESET_EVENT);
			}
			break;
		default:
			break;
	}
	clearConnectionInfo(false);
};

var drawPointToCanvas = function(protocolPointArray, target, scale){
	//var scale = idiomsOriginToProtocolScale;
	//Ti.API.info("In Function: " + JSON.stringify(protocolPointArray));
	//alert(JSON.stringify(protocolPointArray));
	var step = 2;
	var pin = 0;
	for(var i = 0, len = protocolPointArray.length; i < len; i++){
		var pen = protocolPointArray[i];
		/*/
		var first = pen[0];
		target.beginPath();
		var fcx = first.x / scale;
		var fcy = first.y / scale;
		target.drawPoint(fcx, fcy);
		target.moveTo(fcx, fcy);
		for(var p = 1, pm = pen.length; p < pm; p++){
			var item = pen[p];
			var icx = item.x / scale;
			var icy = item.y / scale;
			target.lineTo(icx, icy);
			target.stroke();
			target.moveTo(icx, icy);
		}
		/*/
		//  [ [11,22,33], [22,33,33] ]
		var xList = pen[0];
		var yList = pen[1];
		var pm = Math.min(xList.length, yList.length);
		for(var p = 0; p < pm; p++){
			var fcx = xList[p] / scale;
			var fcy = yList[p] / scale;
			if(p == 0){
				setTimeout((function(c, x, y){
					return function(){
						c.beginPath();
						c.drawPoint(x, y);
						c.moveTo(x, y);
					};
				})(target, fcx, fcy), pin++ * step);
			}else{
				setTimeout((function(c, x, y){
					return function(){
						c.lineTo(x, y);
						c.stroke();
						c.moveTo(x, y);
					};
				})(target, fcx, fcy), pin++ * step);	
			}
		}
		//*/
	}
};

var pauseEventHandler = function(){
	Ti.API.log('paused');
	if(currentWindow){
		if(currentWindow.countdownInterval) clearInterval(currentWindow.countdownInterval);
    	clearConnectionInfo();	
	}
};

Ti.include('websocketrails.js');
Ti.include('websocketnode.js');

Ti.include('layout.js');
Ti.include('serialInputView.js');
Ti.include('idiomsView.js');
Ti.include('runningView.js');
Ti.include('wrongView.js');
Ti.include('mixView.js');

inputView = serialInputViewInit();
inputView.addEventListener('open', function(e){
	currentMask = inputView.maskView;
});
inputView.open();

