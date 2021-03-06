
var waitForServer = "等待後台允許下一輪書寫";

var socketWriteCall = function(){
	//Ti.API.info('object wrote');
};

var runningDeviceAction = function(name){
	if(socketObj){
		socketObj.trigger(
			ACTION_EVENT, {
				user_id: socketUser,
				stamp: (new Date()).getTime(),
				action: "device_" + name,
				hasTrack: currentWindow.innerCanvas.hasTrack === true,
				cid: socketUser
			}, 
			socketWriteCall
		);
	}
};

var runningActionCallback = function(){
	var scope = currentWindow;
	//var childs = scope.getChildren();
	//var maskView = childs[childs.length-1];
	var maskView = scope.maskView;
	var submitBtn = scope.children[4];
	var clearBtn = scope.children[5];
	return function(data){
		if(data.action == START_EVENT){
			runningDeviceAction('start');
			maskView.hide();
			// maybe auto clear
			scope.countDownLabel.doCountDown();
			if(isSynVersion){
				submitBtn.setOpacity(1);
				clearBtn.setOpacity(1);
			}
		}else if(data.action == STOP_EVENT){
			var label = maskView.label;
			isDrawing = false;
			runningDeviceAction('stop');
			if(isSynVersion){
				label.text = "";
				submitBtn.setOpacity(0.3);
				clearBtn.setOpacity(0.3);
			}else{
				label.text = data.showText || (scope.refreshCountAfterStop? "時間到" : "");
				label.text += "\n" + waitForServer;
			}
			maskView.show();
			scope.countDownLabel.stopCountDown(scope.refreshCountAfterStop);
		}
	};
};

var runningClearCallback = function(){
	var scope = currentWindow;
	var can = scope.children[1];
	return function(data){
		var compareId = socketUser;
		//if(!isNaN(parseInt(socketUser))) compareId = socketUser.toString();
		 
		if(!data || !data.user_id || compareId == data.user_id){
			can.clear();	
		}
	};
};

var runningContinueWriteCallback = function(){
	var scope = currentWindow;
	var mask = scope.maskView;
	var submitBtn = scope.children[4];
	var clearBtn = scope.children[5];
	return function(data){
		if(socketUser == data.user_id){
			mask.hide();
			runningDeviceAction('start');
			if(isSynVersion){
				submitBtn.setOpacity(1);
				clearBtn.setOpacity(1);
			}
		}
	};
};

var runningViewInit = function(meta){
	meta = meta || {};
	var initPosition = getCurrentPositionLayout();
	var runningWindow = Titanium.UI.createWindow({
		title: '一字千金 - Drawing',
		navBarHidden:true,
		backgroundColor:'#fff',
		backgroundImage: isSynVersion? 'sync-back.png' : undefined,
		fullscreen:true,
		orientationModes:[
			(isSynVersion? Ti.UI.LANDSCAPE_RIGHT : Ti.UI.PORTRAIT)
			//Ti.UI.LANDSCAPE_LEFT,
			//Ti.UI.LANDSCAPE_RIGHT,
		]
	});
	
	var runningMaskView = Titanium.UI.createView({
		backgroundColor:'#e0e0e0',
		opacity:isSynVersion? 0.0 : 0.7,
		//zIndex:1,
		visible:!testMode,
		width: initPosition.screenWidth + 'px',
		height: initPosition.screenHeight + 'px',
		left:0,top:0
	});
	var runningMaskLabel = Titanium.UI.createLabel({
		color:'#000',
		text: isSynVersion? "" : waitForServer,
		//textAlign:'center',
		font:{
			fontSize: initPosition.fontSize + 'px',
			fontFamily: 'Helvetica Neue'
		}
	});
	var runningPrevBtn = Ti.UI.createButton({
		color: '#376495',
		backgroundColor:'#ffffff',
		//backgroundSelectedColor:'#3ff',	// that is not support IOS
		// maybe use backgroundImage and backgroundSelectedImage instead
		
		width: initPosition.buttonWidth + 'px',
		height: initPosition.buttonHeight + 'px',
		
		title:'回上頁',
		borderRadius: 3,
		borderWidth: 2,
		borderColor: "#e0e0e0",
		font:{
			fontSize: initPosition.fontSize + 'px',
			fontFamily: 'Helvetica Neue'
		}
	});
	
	if(testMode) {
		runningMaskView.add(runningPrevBtn);
		runningPrevBtn.addEventListener('click', function(){
			runningMaskView.hide();
			runningWindow.countDownLabel.doCountDown();
		});
	}else{
		runningMaskView.add(runningMaskLabel);
	}
	runningMaskView.label = runningMaskLabel;
	runningWindow.maskView = runningMaskView;
	
	
	/* Create Background Image */
	var backgroundView = Ti.UI.createImageView({
		image: "bk.png",
		right: 0 + 'px',
		top: 0 + 'px',
		visible: !isSynVersion,
		width: initPosition.backgroundWidth + 'px',
		//height: initPosition.backgroundHeight + 'px',
		height: 'auto'
		//image:'http://' + socketRootHost + "/uploads/",
		
		//backgroundColor: "#f5f5f5"
		//borderWidth: 2,
		//borderColor: "#ff0000"
	});
		
	
	
	
	/* Create a canvas */
	var canvas = Canvas.createCanvasView({
		//backgroundColor: "#d0d0d0",
		//borderWidth: 2,
		//borderColor: "#ff0000",
		backgroundImage: isSynVersion? undefined:'block-524.png',
		//zIndex: 1,
		
		width: initPosition.squareWidth + 'px',
		height: initPosition.squareWidth + 'px',
		bottom: initPosition.canvasBottom + 'px',
		right: initPosition.canvasRight + 'px'
		
	});
	
	runningWindow.innerCanvas = canvas;
	
	//runningWindow.open();
	
	
	// User image
	var imageView = Ti.UI.createImageView({
		//image: "exampleHead.png",
		visible: !isSynVersion,
		image: meta.imageUrl || "",
		left: initPosition.photoLeft + 'px',
		top: initPosition.photoTop + 'px',
		width: initPosition.photoWidth + 'px',
		height: initPosition.photoHeight + 'px',
		
		//image:'http://' + socketRootHost + "/uploads/",
		
		//backgroundColor: "#f5f5f5"
		//backgroundImage: "exampleHead.png"
		//borderWidth: 2,
		//borderColor: "#ff0000"
	});
	
	var userNumberLabel = Titanium.UI.createLabel({
		color:'#000',
		visible: !isSynVersion,
		text: socketUser.toString(),
		textAlign: Ti.UI.TEXT_ALIGNMENT_CENTER,
		shadowOffset: {x:5, y:5},
  		shadowRadius: 3,
  		
  		backgroundColor: '#eee',
  		
		left: initPosition.photoLeft + 'px',
		top: initPosition.photoTop + 'px',
		width: initPosition.numberWidth + 'px',
		height: initPosition.numberHeight + 'px',
		
		//textAlign:'center',
		font:{
			fontSize: initPosition.fontSize + 'px',
			fontFamily: 'Helvetica Neue'
		}
	});
	
	
	
	var submitButton = Ti.UI.createButton({
		// color: isSynVersion? '#5f4741':'#ffffff',
		color: isSynVersion? '#5f4741':'#ffffff',
		backgroundColor: isSynVersion? '#f8d973':'#22ee22',
		borderColor: isSynVersion? '#d6b751':undefined,
		borderRadius: isSynVersion? 5:undefined,
		borderWidth : isSynVersion? 3:undefined,
		opacity: isSynVersion? 0.3:undefined,

		//backgroundSelectedColor:'#3ff',	// that is not support IOS
		// maybe use backgroundImage and backgroundSelectedImage instead
		// visible: !isSynVersion,
		bottom: initPosition.submitBtnBottom + 'px',
		right: initPosition.submitBtnRight + 'px',
		width: initPosition.buttonWidth + 'px',
		height: initPosition.buttonHeight + 'px',
		
		title:isSynVersion? '确定':'確定',
		font:{
			fontSize: initPosition.fontSize + 'px',
			fontFamily: 'Helvetica Neue',
			fontWeight: 'bold'
		}
	});
	
	var clearButton = Ti.UI.createButton({
		color: isSynVersion? '#5f4741':'#ffffff',
		backgroundColor:isSynVersion? '#f8d973':'#ee2222',
		borderColor: isSynVersion? '#d6b751':undefined,
		borderRadius: isSynVersion? 5:undefined,
		borderWidth : isSynVersion? 4:undefined,
		opacity: isSynVersion? 0.3:undefined,
		// visible: !isSynVersion,
		bottom: initPosition.clearBtnBottom + 'px',
		right: initPosition.clearBtnRight + 'px',
		width: initPosition.buttonWidth + 'px',
		height: initPosition.buttonHeight + 'px',
		
		title:'清除',
		font:{
			fontSize: initPosition.fontSize + 'px',
			fontFamily: 'Helvetica Neue',
			fontWeight: 'bold'
		}
	});
	
	var s = (gameInfo.second || 30);
	var countDownLabel = Titanium.UI.createLabel({
		color:'#ff0033',
		text: s + "秒",
		originSecond: s,
		textAlign: Ti.UI.TEXT_ALIGNMENT_RIGHT,
		visible: !isSynVersion && meta.hasSecond !== false,
		
		right: initPosition.countRight + 'px',
		bottom: initPosition.countBottom + 'px',
		width: initPosition.countWidth + 'px',
		height: initPosition.countHeight + 'px',
		font:{
			fontSize: initPosition.fontSize + 'px',
			fontFamily: 'Helvetica Neue'
		},
		isCountDown:false,
		doCountDown:function(){
			var self = this;
			if(!self.countdownInterval && self.visible){
				self.isCountDown = true;
				self.countdownInterval = setInterval((function(label){
					var current = parseFloat(label.text).toFixed(1);
					var scope = this;
					return function(){
						label.text = current + "秒";
						current = (current - 0.1).toFixed(1);
						if(current <= 0) scope.stopCountDown(testMode);
					};
				}).call(self, self), 100);
			}
		},
		stopCountDown: function(refresh){
			var self = this;
			if(self.visible){
				if(self.isCountDown){
					clearInterval(self.countdownInterval);
					self.countdownInterval = null;
					self.isCountDown = false;	
				}
				if(refresh){
					self.text = (gameInfo.second || 30) + "秒";
				}
				if(parseFloat(self.text).toFixed(1) <= 0){
					self.text = self.originSecond + '秒';
				}
				runningMaskView.show();	
			}
		},
		reloadCountDownSecond: function(){
			var self = this;
			if(self.visible){
				if(self.isCountDown) self.stopCountDown();
				// do reload
				self.originSecond = (gameInfo.second || 30);
				self.text = self.originSecond + "秒";	
			}
		}
	});
	
	runningWindow.countDownLabel = countDownLabel;
	
	submitButton.addEventListener('click', function(){
		var msg = runningWindow.passedMessage || "";
		if(isSynVersion){
			runningMaskLabel.text = "";
			submitButton.setOpacity(0.3);
			clearButton.setOpacity(0.3);
		}else{
			runningMaskLabel.text = msg || ("已傳送資料" + '\n' + waitForServer);
		}
		if(testMode){
			runningWindow.countDownLabel.stopCountDown();
		}
		runningMaskView.show();
		if(socketObj){
			runningDeviceAction('stop');
			var stamp = (new Date()).getTime();
			socketObj.trigger(
				SUBMIT_EVENT,
				triggerObj.combine({ 
					stamp: stamp 
				}), 
				socketWriteCall
			);
		}
	});
	clearButton.addEventListener('click',function(){
		canvas.clear();
		if(socketObj){
			socketObj.trigger(
				CLEAR_EVENT,
				triggerObj.combine({ 
					stamp: (new Date()).getTime() 
				}), 
				socketWriteCall
			);
		}
	});
	
	//var lineWidth = initPosition.squareWidth / 60;
	var rootScale =  canvasProtocol.width / initPosition.squareWidth;
	
	canvas.addEventListener('load', function(e){
		var obj = e.source;
		obj.lineWidth = canvasProtocol.lineWidth / rootScale;
    	obj.strokeStyle = isSynVersion? '#ececec' : canvasProtocol.lineColor;
    	obj.lineCap = canvasProtocol.lineCap;
    	obj.prestamp = 0;
	});
	
	canvas.addEventListener('touchstart', function(e){
		isDrawing = true;
		var obj = e.source;
		var countLabel = runningWindow.countDownLabel;
		if(!countLabel.isCountDown){
			countLabel.doCountDown();
		}
		/*
		if(!runningWindow.isCountDown){
			runningWindow.doCountDown();
		}
		*/
		//lastX = e.x;
		//lastY = e.y;
		obj.beginPath();
		obj.drawPoint(e.x, e.y);
		var stamp = (new Date()).getTime();
		// Ti.API.info(stamp-obj.prestamp);
		if(socketObj && stamp - obj.prestamp >= stampFilter){
			obj.prestamp = stamp;
			socketObj.trigger(
				TOUCH_DOWN_EVENT,
				{
					user_id: socketUser, 
					x: e.x * rootScale, 
					y: e.y * rootScale,
					stamp: stamp
				},
				socketWriteCall
			);
		}
		obj.moveTo(e.x, e.y);
	});
	canvas.addEventListener('touchmove', function(e){
		if(isDrawing){
			//canvas.beginPath();
			//canvas.moveTo(lastX, lastY);
			var obj = e.source;
			obj.lineTo(e.x, e.y);
			obj.moveTo(e.x, e.y);
			obj.stroke();
			//lastX = e.x;
			//lastY = e.y;
			var stamp = (new Date()).getTime();
			// Ti.API.info(stamp-obj.prestamp);
			if(socketObj && stamp - obj.prestamp >= stampFilter){
				obj.prestamp = stamp;
				socketObj.trigger(
					TOUCH_MOVE_EVENT,
					{
						user_id: socketUser,
						x: e.x * rootScale,
						y: e.y * rootScale,
						stamp: stamp
					},
					socketWriteCall
				);
			}
		}
	});
	canvas.addEventListener('touchend', function(e){
		isDrawing = false;
		var obj = e.source;
		obj.prestamp = 0;
		obj.lineTo(e.x, e.y);
		obj.stroke();
		if(socketObj){
			socketObj.trigger(
				TOUCH_MOVE_EVENT,
				{
					user_id: socketUser,
					x: e.x * rootScale,
					y: e.y * rootScale,
					stamp: (new Date()).getTime()
				},
				socketWriteCall
			);
		}
	});
	canvas.addEventListener('touchcancel', function(e){
		isDrawing = false;
		e.source.prestamp = 0;
	});
	
	runningWindow.addEventListener('androidback', function(e){
		// close socket
		e.cancelBubble = true;
		if(testMode){
			if(runningWindow.countdownInterval) clearInterval(runningWindow.countdownInterval);
			clearConnectionInfo();
		}else{
			var dialog = Ti.UI.createAlertDialog({
			    cancel: 1,
			    buttonNames: ['是', '否'],
			    message: '這個動作將與伺服器中斷連線',
			    title: '離線'
			});
			dialog.addEventListener('click', (function(preEvent){
				return function(e){
				    if (e.index !== e.source.cancel){
				    	if(runningWindow.countdownInterval) clearInterval(runningWindow.countdownInterval);
				    	clearConnectionInfo();
				    }
				};
			})(e));
			dialog.show();
		}
	});
	
	/*
	runningWindow.addEventListener('orientationchange', function(e){
		var currentPosition = getCurrentPositionLayout(e.orientation);
		submitButton.setBottom(currentPosition.submitBtnBottom + 'px');
		submitButton.setRight(currentPosition.submitBtnRight + 'px');
		clearButton.setBottom(currentPosition.clearBtnBottom + 'px');
		clearButton.setRight(currentPosition.clearBtnRight + 'px');
		runningMaskView.setWidth(currentPosition.screenWidth + 'px');
		runningMaskView.setHeight(currentPosition.screenHeight + 'px');
		backgroundView.setWidth(currentPosition.backgroundWidth + 'px');
		backgroundView.setRight(currentPosition.backgroundRight + 'px');
		backgroundView.setTop(currentPosition.backgroundTop + 'px');
	});
	*/
	runningWindow.add(backgroundView);
	runningWindow.add(canvas);
	runningWindow.add(imageView);
	runningWindow.add(userNumberLabel);
	runningWindow.add(submitButton);
	runningWindow.add(clearButton);
	runningWindow.add(countDownLabel);
	runningWindow.add(runningMaskView);
	
	runningWindow.arrangeLayout = function(orientation){
		var currentPosition = getCurrentPositionLayout(orientation);
		submitButton.setBottom(currentPosition.submitBtnBottom + 'px');
		submitButton.setRight(currentPosition.submitBtnRight + 'px');
		clearButton.setBottom(currentPosition.clearBtnBottom + 'px');
		clearButton.setRight(currentPosition.clearBtnRight + 'px');
		backgroundView.setWidth(currentPosition.backgroundWidth + 'px');
		backgroundView.setRight(currentPosition.backgroundRight + 'px');
		backgroundView.setTop(currentPosition.backgroundTop + 'px');	
		runningMaskView.setWidth(currentPosition.screenWidth + 'px');
		runningMaskView.setHeight(currentPosition.screenHeight + 'px');
		countDownLabel.setRight(currentPosition.countRight + 'px');
		countDownLabel.setBottom(currentPosition.countBottom + 'px');
	};
	
	runningWindow.refreshAll = function(){
		var self = this;
		runningDeviceAction('stop');
		isDrawing = false;
		canvas.clear();
		self.countDownLabel.reloadCountDownSecond();
		runningMaskView.label.text = (isSynVersion? "" : waitForServer);
		runningMaskView.show();
		if(socketObj){
			socketObj.trigger(DEVICE_READY_EVENT, triggerObj);
		}
	};
	
	
	return runningWindow;
};
