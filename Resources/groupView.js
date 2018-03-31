// Change:
	// socketObj  block : int

// Trigger Events:
/*
group.down_location
group.move_location
group.up_location
group.submit			// for single block submit
group.move_block
group.clear
group.action
group.continue_write			// maybe not used
group.set_gameinfo_to_socket	// maybe not used

submit		// for total submit
*/

var groupShortToProtocolScale = 1;
var groupOriginToProtocolScale = 1;
var groupOriginToShortScale = 1;

var groupShortCanvasArray = null;
var groupCanvasPointArray = null;

var groupCurrentBlock = 1;

// ==========  Event Handlers  ==========
var groupActionCallback = function(){
	var scope = currentWindow;
	var maskView = scope.maskView;
	return function(data){
		if(data.action == START_EVENT){
			maskView.hide();
			// maybe auto clear
			scope.countDownLabel.doCountDown();
		}else if(data.action == STOP_EVENT){
			isDrawing = false;
			
			var drawingView = scope.children[scope.children.length - 2];
			drawingView.hide();
			drawingView.children[drawingView.children.length - 1].clear();
			
			var label = maskView.label;
			label.text = data.showText || (scope.refreshCountAfterStop? "時間到" : "");
			label.text += waitForServer;
			maskView.show();
			scope.countDownLabel.stopCountDown(scope.refreshCountAfterStop);
		}
	};
};

var groupClearCallback = function(){
	var scope = currentWindow;
	return function(data){
		var blockView = scope.children[scope.children.length - 3];
		var compareId = socketUser;
		if(data && compareId == data.user_id && data.block){
			// clear specified block
			blockView.clearBlock(data.block);
		}else if(!data || !data.user_id || compareId == data.user_id){
			// clear all blocks
			blockView.clearAll();	
		}
	};
};

var groupContinueWriteCallback = function(){
	var scope = currentWindow;
	var mask = scope.maskView;
	return function(data){
		if(socketUser == data.user_id){
			mask.hide();
		}
	};
};


// ==========  Event Triggers  ==========
var groupTriggerDeviceAction = function(name){
	if(socketObj){
		socketObj.trigger(
			GROUP_EVENT + "." + ACTION_EVENT,
			{
				user_id: socketUser,
				block: groupCurrentBlock,
				stamp: (new Date()).getTime(),
				action: "device_" + name,
				hasTrack: groupShortCanvasArray[groupCurrentBlock - 1].hasTrack === true
			}
		);
	}
};

var groupTriggerMoveBlock = function(){
	if(socketObj){
		socketObj.trigger(
			GROUP_EVENT + "." + MOVE_BLOCK_EVENT,
			{
				user_id: socketUser,
				block: groupCurrentBlock
			}
		);
	}
};

// ========== Single Short Canvas View  ==========
var groupPrepareShortCanvasView = function(canvasInfo){
	// var isValid = canvasInfo.rowIndex == 1 || canvasInfo.colIndex == 1;
	var res = Canvas.createCanvasView({
		width: canvasInfo.width + 'px',
		height: canvasInfo.height + 'px',
		left: canvasInfo.left + 'px',
		top: canvasInfo.top + 'px',
		borderWidth: 2,
		borderColor: "#ff3300"
	});
	
	res.blockIndex = canvasInfo.blockIndex;
	
	res.addEventListener('load', function(e){
		var v = e.source;
		v.lineWidth = canvasProtocol.lineWidth / groupShortToProtocolScale;
		v.lineCap = canvasProtocol.lineCap;
	});
	res.addEventListener('click', (function(view){
		return function(e){
			var canvas = e.source;
			var block = canvas.blockIndex;
			groupCurrentBlock = block + 1;
			var points = groupCanvasPointArray[block];
			if(points.length > 0){
				var last = view.children.length - 1;
				drawPointToCanvas(points, view.children[last], groupOriginToProtocolScale);
			}
			view.show();
			groupTriggerMoveBlock();
			groupTriggerDeviceAction('start');
		};
	})(canvasInfo.relatedView));
	
	return res;
};

// ========== The Big Canvas View  ==========
var groupPrepareCanvasView = function(initPosition, img){
	var res = Canvas.createCanvasView({
		backgroundImage: img || 'block-524.png',
		width: initPosition.squareWidth + 'px',
		height: initPosition.squareWidth + 'px',
		bottom: initPosition.canvasBottom + 'px'
	});
	
	res.addEventListener('load', function(e){
		var v = e.source;
		v.lineWidth = canvasProtocol.lineWidth / groupOriginToProtocolScale;
		v.strokeStyle = canvasProtocol.lineColor;
		v.lineCap = canvasProtocol.lineCap;
		v.prestamp = 0;
	});
	res.addEventListener('touchstart', function(e){
		isDrawing = true;
		var obj = e.source;
		var stamp = (new Date()).getTime();
		obj.beginPath();
		obj.drawPoint(e.x, e.y);
		if(socketObj && stamp - obj.prestamp >= stampFilter){
			obj.prestamp = stamp;
			socketObj.trigger(
				GROUP_EVENT + "." + TOUCH_DOWN_EVENT,
				{
					user_id: socketUser,
					x: e.x * groupOriginToProtocolScale, 
					y: e.y * groupOriginToProtocolScale,
					block: groupCurrentBlock,
					stamp: stamp 
				}
			);
		}
		obj.moveTo(e.x, e.y);
		
		obj.pointCache = [
			[e.x * groupOriginToProtocolScale],
			[e.y * groupOriginToProtocolScale]
		];
		
		var innerShortCanvas = groupShortCanvasArray[groupCurrentBlock - 1];
		if(innerShortCanvas){
			innerShortCanvas.beginPath();
			innerShortCanvas.drawPoint(e.x * groupOriginToShortScale, e.y * groupOriginToShortScale);
			innerShortCanvas.moveTo(e.x * groupOriginToShortScale, e.y * groupOriginToShortScale);
		}
	});

	res.addEventListener('touchmove', function(e){
		if(isDrawing){
			var obj = e.source;
			var stamp = (new Date()).getTime();
			obj.lineTo(e.x, e.y);
			obj.moveTo(e.x, e.y);
			obj.stroke();
			if(socketObj && stamp - obj.prestamp >= stampFilter){
				obj.prestamp = stamp;
				socketObj.trigger(
					GROUP_EVENT + "." + TOUCH_MOVE_EVENT,
					{
						user_id: socketUser,
						x: e.x * groupOriginToProtocolScale, 
						y: e.y * groupOriginToProtocolScale,
						block: groupCurrentBlock,
						stamp: stamp 
					}
				);
			}
			
			obj.pointCache = obj.pointCache || [ [], [] ];
			obj.pointCache[0].push(e.x * groupOriginToProtocolScale);
			obj.pointCache[1].push(e.y * groupOriginToProtocolScale);
			
			var innerShortCanvas = groupShortCanvasArray[groupCurrentBlock - 1];
			if(innerShortCanvas){
				innerShortCanvas.lineTo(e.x * groupOriginToShortScale, e.y * groupOriginToShortScale);
				innerShortCanvas.moveTo(e.x * groupOriginToShortScale, e.y * groupOriginToShortScale);
				innerShortCanvas.stroke();
			}
		}
	});

	function touchEndAndCancelHandler(e){
		isDrawing = false; 
		e.source.prestamp = 0;

		var pc = e.source.pointCache;
		if(pc && pc.length > 0){
			groupCanvasPointArray[groupCurrentBlock - 1].push(pc.slice(0));
			e.source.pointCache = null;
		}
	}

	res.addEventListener('touchend', touchEndAndCancelHandler);
	res.addEventListener('touchcancel', touchEndAndCancelHandler);
	
	return res;
};

// ========== The Drawing View With Big Canvas  ==========
var groupPrepareDrawingView = function(initPosition){
	var groupCanvasSize = initPosition.shortSideWidth;
	
	var groupDrawingView = Ti.UI.createView({
		width: initPosition.shortSideWidth + 'px',
		height: initPosition.longSideWidth + 'px',
		visible:false
	});
	
	var maskView = Ti.UI.createView({
		width: initPosition.shortSideWidth + 'px',
		height: initPosition.longSideWidth + 'px',
		backgroundColor:'#e0e0e0',
		opacity:0.7
	});
	
	var groupConfirmButton = Ti.UI.createButton({
		color: '#ffffff',
		backgroundColor:'#22ee22',
		//backgroundSelectedColor:'#3ff',	// that is not support IOS
		// maybe use backgroundImage and backgroundSelectedImage instead
		
		bottom: initPosition.submitBtnBottom + 'px',
		right: initPosition.submitBtnRight + 'px',
		width: initPosition.buttonWidth + 'px',
		height: initPosition.buttonHeight + 'px',
		
		title:'確定',
		font:{
			fontSize: initPosition.fontSize + 'px',
			fontFamily: 'Helvetica Neue',
			fontWeight: 'bold'
		}
	});
	
	var groupClearButton = Ti.UI.createButton({
		color: '#ffffff',
		backgroundColor:'#ee2222',
		
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
	
	var cview = groupPrepareCanvasView(initPosition);
	
	maskView.addEventListener('click', function(e){
		groupDrawingView.hide();
		//var cview = groupCanvasPointArray[groupCurrentRow - 1][groupCurrentCol - 1];
		groupTriggerDeviceAction('stop');
		cview.clear();
	});
	
	groupConfirmButton.addEventListener('click', function(e){
		groupDrawingView.hide();
		groupTriggerDeviceAction('stop');

		var canvasPoint = groupCanvasPointArray[groupCurrentBlock - 1]; 
		
		if(socketObj && canvasPoint.length > 0){
			socketObj.trigger(
				GROUP_EVENT + "." + SUBMIT_EVENT,
				{
					user_id: socketUser,
					block: groupCurrentBlock
				}
			);
		}
		
		cview.clear();
	});
	
	groupClearButton.addEventListener('click', function(e){
		var blockIndex = groupCurrentBlock - 1;
		
		groupCanvasPointArray[blockIndex] = [];
		
		cview.clear();
		var shortCanvas = groupShortCanvasArray[blockIndex];
		shortCanvas.clear();
		if(socketObj){
			socketObj.trigger(
				GROUP_EVENT + "." + CLEAR_EVENT,
				{
					user_id: socketUser, 
					block: groupCurrentBlock,
					stamp: (new Date()).getTime() 
				}
			);
		}
	});
	
	groupDrawingView.add(maskView);
	groupDrawingView.add(groupConfirmButton);
	groupDrawingView.add(groupClearButton);
	groupDrawingView.add(cview);
	
	groupDrawingView.arrangeLayout = function(orientation){
		var currentPosition = getCurrentPositionLayout(orientation);
		groupConfirmButton.setBottom(currentPosition.submitBtnBottom + 'px');
		groupConfirmButton.setRight(currentPosition.submitBtnRight + 'px');
		groupClearButton.setBottom(currentPosition.clearBtnBottom + 'px');
		groupClearButton.setRight(currentPosition.clearBtnRight + 'px');
	};
	
	return groupDrawingView;
};

// ========== The Blocks View ==========
// relateBigView -> prop.relateBigView
// prop.blockCount
var groupBlockViewInit = function(initPosition, prop){
	var imageBottomPosition = (initPosition.photoHeight + initPosition.padding);
	
	var view = Titanium.UI.createView({
		//zIndex:1,
		width: initPosition.squareWidth + 'px',
		height: initPosition.squareWidth + 'px',
		// top: (initPosition.longSideWidth + imageBottomPosition - initPosition.squareWidth) / 2 + 'px',
		top: (imageBottomPosition + initPosition.buttonHeight + initPosition.padding * 2) + 'px',
		right: initPosition.canvasRight + 'px',
		clearAll:function(){
			for(var b = 0; b < prop.blockCount; b++){
				groupCanvasPointArray[b] = [];
				var innerCanvas = groupShortCanvasArray[b];
				if(innerCanvas){
					innerCanvas.clear();
					innerCanvas.strokeStyle = canvasProtocol.lineColor;
				}
			}
		},
		clearBlock:function(block){
			var blockIndex = parseInt(block) - 1;
			groupCanvasPointArray[blockIndex] = [];
			
			var innerCanvas = groupShortCanvasArray[blockIndex];
			if(innerCanvas){
				innerCanvas.clear();
				innerCanvas.strokeStyle = canvasProtocol.lineColor;
			} 
		}
	});
	
	var shortCanvasWidth = initPosition.groupCanvasWidth;
	
	if(!groupShortCanvasArray) groupShortCanvasArray = [];
	if(!groupCanvasPointArray) groupCanvasPointArray = [];
	for(var block = 0; block < prop.blockCount; block++){
		var shortCanvas = groupPrepareShortCanvasView({
			width: shortCanvasWidth,
			height: shortCanvasWidth,
			// left: shortCanvasWidth * col + initPosition.padding * col,
			// top: shortCanvasWidth * row + initPosition.padding * row,
			left: (initPosition.shortSideWidth - shortCanvasWidth) / 2,
			top: shortCanvasWidth * block + initPosition.padding * block,
			relatedView: prop.relateBigView,
			blockIndex: block
		});
		groupShortCanvasArray.push(shortCanvas);
		view.add(shortCanvas);
		groupCanvasPointArray.push([]);
	}
	
	return view;
};

// ========== The Group View ==========
var groupViewInit = function(meta){
	meta = meta || {};
	/*
	 * hasSecond: hasSecond, toLocked: toLocked, blockCount: blockCount
	 */
	var initPosition = getCurrentPositionLayout(meta);
	var groupWindow = Titanium.UI.createWindow({
		title: '',
		navBarHidden:true,
		backgroundColor:'#fff',
		fullscreen:true,
		orientationModes:[
			//Ti.UI.LANDSCAPE_LEFT,
			//Ti.UI.LANDSCAPE_RIGHT,
			Ti.UI.PORTRAIT
		]
	});
	
	var groupMaskView = Titanium.UI.createView({
		backgroundColor:'#e0e0e0',
		opacity:0.7,
		//zIndex:1,
		// visible:!testMode,
		width: initPosition.screenWidth + 'px',
		height: initPosition.screenHeight + 'px',
		left:0,top:0
	});
	var groupMaskLabel = Titanium.UI.createLabel({
		color:'#000',
		text:waitForServer,
		//textAlign:'center',
		font:{
			fontSize: initPosition.fontSize + 'px',
			fontFamily: 'Helvetica Neue'
		}
	});
	
	groupMaskView.add(groupMaskLabel);
	groupMaskView.label = groupMaskLabel;
	groupWindow.maskView = groupMaskView;
	
	groupShortToProtocolScale = canvasProtocol.width / initPosition.groupCanvasWidth;
	groupOriginToProtocolScale = canvasProtocol.width / initPosition.squareWidth;
	groupOriginToShortScale = initPosition.groupCanvasWidth / initPosition.squareWidth;
	
	/* Create Background Image */
	var backgroundView = Ti.UI.createImageView({
		image: "bk.png",
		right: 0 + 'px',
		top: 0 + 'px',
		width: initPosition.backgroundWidth + 'px',
		height: 'auto'
	});
	
	// Create drawing view
	var drawingView = groupPrepareDrawingView(initPosition);
	// Create a block view
	var blockView = groupBlockViewInit(initPosition, {
		relateBigView: drawingView,
		blockCount: meta.blockCount
	});
	
	var totalSubmitButton = Ti.UI.createButton({
		color: '#ffffff',
		backgroundColor:'#ee7722',
		
		top: (initPosition.photoHeight + initPosition.padding * 2) + 'px',
		right: initPosition.padding + initPosition.buttonWidth + 'px',
		width: initPosition.buttonWidth + 'px',
		height: initPosition.buttonHeight + 'px',
		
		title:'送出',
		font:{
			fontSize: initPosition.fontSize + 'px',
			fontFamily: 'Helvetica Neue',
			fontWeight: 'bold'
		}
	});
	totalSubmitButton.addEventListener('click', function(e){
		var msg = groupWindow.passedMessage || "";
		groupWindow.text = msg || ("已傳送資料" + '\n' + waitForServer);
		groupMaskView.show();
		if(socketObj){
			// runningDeviceAction('stop');
			var stamp = (new Date()).getTime();
			socketObj.trigger(
				SUBMIT_EVENT,
				triggerObj.combine({ 
					stamp: stamp 
				})
			);
		}
	});
	
	// User image
	var imageView = Ti.UI.createImageView({
		//image: "exampleHead.png",
		image: meta.imageUrl || "",
		left: initPosition.photoLeft + 'px',
		top: initPosition.photoTop + 'px',
		width: initPosition.photoWidth + 'px',
		height: initPosition.photoHeight + 'px'
	});
	
	var userNumberLabel = Titanium.UI.createLabel({
		color:'#000',
		text: socketUser.toString(),
		textAlign: Ti.UI.TEXT_ALIGNMENT_CENTER,
		shadowOffset: {x:5, y:5},
  		shadowRadius: 3,
  		
  		backgroundColor: '#eee',
  		
		left: initPosition.photoLeft + 'px',
		top: initPosition.photoTop + 'px',
		width: initPosition.numberWidth + 'px',
		height: initPosition.numberHeight + 'px',
		
		font:{
			fontSize: initPosition.fontSize + 'px',
			fontFamily: 'Helvetica Neue'
		}
	});

	var s = (gameInfo.second || 30);
	var countDownLabel = Titanium.UI.createLabel({
		color:'#ff0033',
		text: s + "秒",
		originSecond: s,
		textAlign: Ti.UI.TEXT_ALIGNMENT_RIGHT,
		visible: !!meta.hasSecond,
		
		right: initPosition.countRight + 'px',
		top: (initPosition.photoHeight + initPosition.padding * 2) + 'px',
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
						if(current <= 0) scope.stopCountDown();
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
				groupMaskView.show();	
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
	
	groupWindow.countDownLabel = countDownLabel;
	
	groupWindow.addEventListener('androidback', function(e){
		// close socket
		e.cancelBubble = true;
		var dialog = Ti.UI.createAlertDialog({
		    cancel: 1,
		    buttonNames: ['是', '否'],
		    message: '這個動作將與伺服器中斷連線',
		    title: '離線'
		});
		dialog.addEventListener('click', (function(preEvent){
			return function(e){
			    if (e.index !== e.source.cancel){
			    	if(groupWindow.countdownInterval) clearInterval(groupWindow.countdownInterval);
			    	clearConnectionInfo();
			    }
			};
		})(e));
		dialog.show();
	});
	
	groupWindow.add(backgroundView);
	
	groupWindow.add(imageView);
	groupWindow.add(userNumberLabel);
	
	groupWindow.add(countDownLabel);
	
	groupWindow.add(totalSubmitButton);
	
	groupWindow.add(blockView);
	groupWindow.add(drawingView);
	
	groupWindow.add(groupMaskView);
	
	groupWindow.arrangeLayout = function(orientation){
		var currentPosition = getCurrentPositionLayout(orientation);
		groupMaskView.setWidth(currentPosition.screenWidth + 'px');
		groupMaskView.setHeight(currentPosition.screenHeight + 'px');
		backgroundView.setWidth(currentPosition.backgroundWidth + 'px');
		backgroundView.setRight(currentPosition.backgroundRight + 'px');
		backgroundView.setTop(currentPosition.backgroundTop + 'px');
		drawingView.arrangeLayout(orientation);
	};
	
	groupWindow.refreshAll = function(){
		var self = this;
		isDrawing = false;
		drawingView.hide();
		groupCurrentBlock = 1;
		
		var totalBlocks = meta.blockCount;
		for(var block = 0; block < totalBlocks; block++){
			groupShortCanvasArray[block].clear();
			groupCanvasPointArray[block] = [];
		}
		
		self.countDownLabel.reloadCountDownSecond();
		groupMaskView.label.text = waitForServer;
		groupMaskView.show();
		if(socketObj){
			socketObj.trigger(DEVICE_READY_EVENT, triggerObj);
		}
	};
	
	return groupWindow;
};
