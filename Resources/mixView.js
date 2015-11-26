
var mixShortToProtocolScale = 1;
var mixOriginToProtocolScale = 1;
var mixOriginToShortScale = 1;

var mixOccupyArray = null;
// var mixDirtyList = null;
var mixShortCanvasArray = null;
var mixCanvasPointArray = null;

var mixCurrentRow = 1;
var mixCurrentCol = 1;

// var mixUpdateOccupyBlocks = function(){
	// for(var rc in mixDirtyList){
		// var val = mixDirtyList[rc];
		// if(typeof val == "boolean"){
			// var rcsplit = rc.split('-');
			// var ridx = parseInt(rcsplit[0]) - 1;
			// var cidx = parseInt(rcsplit[1]) - 1; 
			// mixOccupyArray[ridx][cidx] = val;	
		// }
	// }
	// mixDirtyList = {};
// };

// ==========  Event Handlers  ==========
var mixActionCallback = function(){
	var scope = currentWindow;
	var maskView = scope.maskView;
	return function(data){
		if(data.action == START_EVENT){
			//mixUpdateOccupyBlocks();
			maskView.hide();
			// maybe auto clear
			scope.countDownLabel.doCountDown();
		}else if(data.action == STOP_EVENT){
			//mixUpdateOccupyBlocks();
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

var mixClearCallback = function(){
	var scope = currentWindow;
	return function(data){
		var blockView = scope.children[scope.children.length - 3];
		var compareId = socketUser;
		//if(!isNaN(parseInt(socketUser))) compareId = socketUser.toString();
		if(data && compareId == data.user_id && data.block){
			// clear specified block
			blockView.clearBlock(data.block);
		}else if(!data || !data.user_id || compareId == data.user_id){
			// clear all blocks
			//can.clear();
			blockView.clearAll();	
		}
	};
};

var mixContinueWriteCallback = function(){
	var scope = currentWindow;
	var mask = scope.maskView;
	return function(data){
		if(socketUser == data.user_id){
			mask.hide();
			// runningDeviceAction('start');
		}
	};
};

var mixSendTextCallback = function(){
	var scope = currentWindow;
	return function(data){
		if(data && data.block && data.text){
			var block = data.block;
			var text = data.text;
			var rowIndex = parseInt(block.row) - 1;
			var colIndex = parseInt(block.column) - 1;
			
			var innerShortCanvas = mixShortCanvasArray[rowIndex][colIndex];
			if(innerShortCanvas){
				var w = parseFloat(innerShortCanvas.getWidth());
				innerShortCanvas.beginPath();
				//innerShortCanvas.textAlign = "center";
				innerShortCanvas.textStyle = "bold";
				innerShortCanvas.fillStyle = "#2222ee";
				innerShortCanvas.textSize = w * 13 / 15;
				innerShortCanvas.fillText(text, w / 15, w * 12 / 15);
			}
			mixOccupyArray[rowIndex][colIndex] = true;	
		}
	};
};


// ==========  Event Triggers  ==========
var mixTriggerDeviceAction = function(name){
	if(socketObj){
		socketObj.trigger(
			MIX_EVENT + "." + ACTION_EVENT,
			{
				user_id: socketUser,
				block:{
					row: mixCurrentRow,
					column: mixCurrentCol
				},
				stamp: (new Date()).getTime(),
				action: "device_" + name,
				hasTrack: mixShortCanvasArray[mixCurrentRow - 1][mixCurrentCol - 1].hasTrack === true
				// ,
				// cid: socketUser + "_" + mixCurrentRow + "_" + mixCurrentCol
			}
		);
	}
};

var mixTriggerMoveBlock = function(){
	// if(socketObj){
		// socketObj.trigger(
			// MIX_EVENT + "." + MOVE_BLOCK_EVENT,
			// {
				// user_id: socketUser,
				// block:{
					// row: mixCurrentRow,
					// column: mixCurrentCol
				// }
			// }
		// );
	// }
};

var mixPrepareShortCanvasView = function(canvasInfo){
	var isValid = canvasInfo.rowIndex == 1 || canvasInfo.colIndex == 1;
	var res = Canvas.createCanvasView({
		width: canvasInfo.width + 'px',
		height: canvasInfo.height + 'px',
		left: canvasInfo.left + 'px',
		top: canvasInfo.top + 'px',
		borderWidth: 2,
		borderColor: isValid? "#ff3300": "#ffffff"
	});
	
	res.rowIndex = canvasInfo.rowIndex;
	res.colIndex = canvasInfo.colIndex;
	
	// use protocol
	//res.pointCache = [];
	if(isValid){
		res.addEventListener('load', function(e){
			var v = e.source;
			v.lineWidth = canvasProtocol.lineWidth / mixShortToProtocolScale;
			v.lineCap = canvasProtocol.lineCap;
		});
		res.addEventListener('click', (function(view){
			return function(e){
				var canvas = e.source;
				var row = canvas.rowIndex;
				var col = canvas.colIndex;
				mixCurrentRow = row + 1;
				mixCurrentCol = col + 1;
				var isOccupied = mixOccupyArray[row][col];
				if(isOccupied) alert("這是後台給的不能改唷！");
				if(testMode || !isOccupied){
					var points = mixCanvasPointArray[row][col];
					if(points.length > 0){
						var last = view.children.length - 1;
						drawPointToCanvas(points, view.children[last], mixOriginToProtocolScale);
					}
					view.show();
					mixTriggerMoveBlock();
					mixTriggerDeviceAction('start');	
				}
			};
		})(canvasInfo.relatedView));	
	}else{
		res.addEventListener('load', function(e){});
		res.addEventListener('click', function(e){});
	}
	
	
	return res;
};

var mixPrepareCanvasView = function(initPosition, img){
	var res = Canvas.createCanvasView({
		backgroundImage: img || 'block-524.png',
		width: initPosition.squareWidth + 'px',
		height: initPosition.squareWidth + 'px',
		bottom: initPosition.canvasBottom + 'px'
	});
	
	res.addEventListener('load', function(e){
		var v = e.source;
		v.lineWidth = canvasProtocol.lineWidth / mixOriginToProtocolScale;
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
				MIX_EVENT + "." + TOUCH_DOWN_EVENT,
				{
					user_id: socketUser,
					x: e.x * mixOriginToProtocolScale, 
					y: e.y * mixOriginToProtocolScale,
					block:{
						row: mixCurrentRow,
						column: mixCurrentCol
					},
					stamp: stamp 
				}
			);
		}
		obj.moveTo(e.x, e.y);
		//*/
		obj.pointCache = [
			[e.x * mixOriginToProtocolScale],
			[e.y * mixOriginToProtocolScale]
		];
		/*/
		var pointCache = mixCanvasPointArray[mixCurrentRow - 1][mixCurrentCol - 1];
		pointCache.push([
			{
				x: e.x * mixOriginToProtocolScale, 
				y: e.y * mixOriginToProtocolScale
			}
		]);
		//*/
		// mixDirtyList[mixCurrentRow + '-' + mixCurrentCol] = true;
		
		var innerShortCanvas = mixShortCanvasArray[mixCurrentRow - 1][mixCurrentCol - 1];
		if(innerShortCanvas){
			innerShortCanvas.beginPath();
			innerShortCanvas.drawPoint(e.x * mixOriginToShortScale, e.y * mixOriginToShortScale);
			innerShortCanvas.moveTo(e.x * mixOriginToShortScale, e.y * mixOriginToShortScale);
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
					MIX_EVENT + "." + TOUCH_MOVE_EVENT,
					{
						user_id: socketUser,
						x: e.x * mixOriginToProtocolScale,
						y: e.y * mixOriginToProtocolScale,
						block:{
							row: mixCurrentRow,
							column: mixCurrentCol
						},
						stamp: stamp
					}
				);
			}
			//*/
			obj.pointCache = obj.pointCache || [ [], [] ];
			obj.pointCache[0].push(e.x * mixOriginToProtocolScale);
			obj.pointCache[1].push(e.y * mixOriginToProtocolScale);
			/*/
			var pointCache = mixCanvasPointArray[mixCurrentRow - 1][mixCurrentCol - 1];
			pointCache[pointCache.length - 1].push({
				x: e.x * mixOriginToProtocolScale, 
				y: e.y * mixOriginToProtocolScale
			});
			//*/
			// mixDirtyList[mixCurrentRow + '-' + mixCurrentCol] = true;
			
			var innerShortCanvas = mixShortCanvasArray[mixCurrentRow - 1][mixCurrentCol - 1];
			if(innerShortCanvas){
				innerShortCanvas.lineTo(e.x * mixOriginToShortScale, e.y * mixOriginToShortScale);
				innerShortCanvas.moveTo(e.x * mixOriginToShortScale, e.y * mixOriginToShortScale);
				innerShortCanvas.stroke();
			}
		}
	});
	res.addEventListener('touchend', function(e){ isDrawing = false;
		var pc = e.source.pointCache;
		if(pc && pc.length > 0){
			mixCanvasPointArray[mixCurrentRow - 1][mixCurrentCol - 1].push(pc.slice(0));
			e.source.pointCache = null;
		}
	});
	res.addEventListener('touchcancel', function(e){ isDrawing = false;
		var pc = e.source.pointCache;
		if(pc && pc.length > 0){
			mixCanvasPointArray[mixCurrentRow - 1][mixCurrentCol - 1].push(pc.slice(0));
			e.source.pointCache = null;
		}
	});
	
	return res;
};

var mixPrepareDrawingView = function(initPosition){
	var mixCanvasSize = initPosition.shortSideWidth;
	
	//var buttonWidth = initPosition.gapUnitSize * 3;
	//var buttonHeight = initPosition.gapUnitSize * 2;
	//var drawingViewHeight = mixCanvasSize + buttonHeight + initPosition.padding;
	//var buttonRight = (initPosition.longSideWidth - mixCanvasSize) / 2 - initPosition.padding - clearBtnWidth;
	
	var mixDrawingView = Ti.UI.createView({
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
	
	var mixConfirmButton = Ti.UI.createButton({
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
	
	var mixClearButton = Ti.UI.createButton({
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
	
	var cview = mixPrepareCanvasView(initPosition);
	
	maskView.addEventListener('click', function(e){
		mixDrawingView.hide();
		//var cview = mixCanvasPointArray[mixCurrentRow - 1][mixCurrentCol - 1];
		mixTriggerDeviceAction('stop');
		cview.clear();
	});
	
	mixConfirmButton.addEventListener('click', function(e){
		mixDrawingView.hide();
		//var cview = mixCanvasPointArray[mixCurrentRow - 1][mixCurrentCol - 1];
		mixTriggerDeviceAction('stop');
		var canvasPoint = mixCanvasPointArray[mixCurrentRow-1][mixCurrentCol-1]; 
		//Ti.API.info("In DrawView: " + JSON.stringify(canvasPoint));
		//alert(JSON.stringify(canvasPoint));
		
		// if(socketObj && canvasPoint.length > 0){
			// socketObj.trigger(
				// MIX_EVENT + "." + SUBMIT_EVENT,
				// {
					// user_id: socketUser,
					// block:{
						// row: mixCurrentRow,
						// column: mixCurrentCol
					// }
				// }
			// );
		// }
		
		cview.clear();
	});
	
	mixClearButton.addEventListener('click', function(e){
		var rowIndex = mixCurrentRow - 1;
		var colIndex = mixCurrentCol - 1;
		
		// mixDirtyList[mixCurrentRow + '-' + mixCurrentCol] = false;
		mixCanvasPointArray[rowIndex][colIndex] = [];
		
		cview.clear();
		var shortCanvas = mixShortCanvasArray[rowIndex][colIndex];
		shortCanvas.clear();
		if(socketObj){
			socketObj.trigger(
				MIX_EVENT + "." + CLEAR_EVENT,
				{
					user_id: socketUser, 
					block:{
						row: mixCurrentRow,
						column: mixCurrentCol
					},
					stamp: (new Date()).getTime() 
				}
			);
		}
	});
	
	mixDrawingView.add(maskView);
	//mixDrawingView.add(mixCancelButton);
	mixDrawingView.add(mixConfirmButton);
	mixDrawingView.add(mixClearButton);
	mixDrawingView.add(cview);
	//mixDrawingView.add(mixCanvasPointArray[mixCurrentRow - 1][mixCurrentCol - 1]);
	
	mixDrawingView.arrangeLayout = function(orientation){
		var currentPosition = getCurrentPositionLayout(orientation);
		mixConfirmButton.setBottom(currentPosition.submitBtnBottom + 'px');
		mixConfirmButton.setRight(currentPosition.submitBtnRight + 'px');
		mixClearButton.setBottom(currentPosition.clearBtnBottom + 'px');
		mixClearButton.setRight(currentPosition.clearBtnRight + 'px');
	};
	
	return mixDrawingView;
};


var mixBlockViewInit = function(initPosition, relateBigView){
	var imageBottomPosition = (initPosition.photoHeight + initPosition.padding);
	//var remainHeight = initPosition.longSideWidth - imageBottomPosition;
	var view = Titanium.UI.createView({
		//zIndex:1,
		width: initPosition.squareWidth + 'px',
		height: initPosition.squareWidth + 'px',
		// top: (initPosition.longSideWidth + imageBottomPosition - initPosition.squareWidth) / 2 + 'px',
		top: (imageBottomPosition + initPosition.buttonHeight + initPosition.padding * 2) + 'px',
		right: initPosition.canvasRight + 'px',
		clearAll:function(){
			// mixDirtyList = {};
			for(var r = 0; r < 3; r++){
				for(var c = 0; c < 3; c++){
					if(r == 1 || c == 1){
						mixCanvasPointArray[r][c] = [];
						mixOccupyArray[r][c] = false;
						var innerCanvas = mixShortCanvasArray[r][c];
						if(innerCanvas){
							innerCanvas.clear();
							innerCanvas.strokeStyle = canvasProtocol.lineColor;
						}	
					}
				}
			}
		},
		clearBlock:function(block){
			var rowIndex = parseInt(block.row) - 1;
			var colIndex = parseInt(block.column) - 1;
			// mixDirtyList[block.row + '-' + block.column] = false;
			mixCanvasPointArray[rowIndex][colIndex] = [];
			mixOccupyArray[rowIndex][colIndex] = false;
			var innerCanvas = mixShortCanvasArray[rowIndex][colIndex];
			if(innerCanvas){
				innerCanvas.clear();
				innerCanvas.strokeStyle = canvasProtocol.lineColor;
			} 
		}
	});
	
	//var pointsArray = [];
	
	var shortCanvasWidth = initPosition.mixCanvasWidth;
	
	// if(!mixDirtyList) mixDirtyList = {};
	if(!mixOccupyArray) mixOccupyArray = [];
	if(!mixShortCanvasArray) mixShortCanvasArray = [];
	if(!mixCanvasPointArray) mixCanvasPointArray = [];
	for(var row = 0; row < 3; row++){
		var oSingleRow = [];
		var scSingleRow = [];
		var cSingleRow = [];
		for(var col = 0; col < 3; col++){
			oSingleRow.push(false);
			var shortCanvas = mixPrepareShortCanvasView({
				width: shortCanvasWidth,
				height: shortCanvasWidth,
				left: shortCanvasWidth * col + initPosition.padding * col,
				top: shortCanvasWidth * row + initPosition.padding * row,
				relatedView: relateBigView,
				rowIndex: row,
				colIndex: col
			}); 
			scSingleRow.push(shortCanvas);
			view.add(shortCanvas);
			
			cSingleRow.push([]);
			
		}
		mixOccupyArray.push(oSingleRow);
		mixShortCanvasArray.push(scSingleRow);
		mixCanvasPointArray.push(cSingleRow);
	}
	 
	
	return view;
};

var mixViewInit = function(meta){
	meta = meta || {};
	/*
	 * hasSecond: hasSecond, toLocked: toLocked
	 */
	var initPosition = getCurrentPositionLayout();
	var mixWindow = Titanium.UI.createWindow({
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
	
	var mixMaskView = Titanium.UI.createView({
		backgroundColor:'#e0e0e0',
		opacity:0.7,
		//zIndex:1,
		visible:!testMode,
		width: initPosition.screenWidth + 'px',
		height: initPosition.screenHeight + 'px',
		left:0,top:0
	});
	var mixMaskLabel = Titanium.UI.createLabel({
		color:'#000',
		text:waitForServer,
		//textAlign:'center',
		font:{
			fontSize: initPosition.fontSize + 'px',
			fontFamily: 'Helvetica Neue'
		}
	});
	
	mixMaskView.add(mixMaskLabel);
	mixMaskView.label = mixMaskLabel;
	mixWindow.maskView = mixMaskView;
	
	mixShortToProtocolScale = canvasProtocol.width / initPosition.mixCanvasWidth;
	mixOriginToProtocolScale = canvasProtocol.width / initPosition.squareWidth;
	mixOriginToShortScale = initPosition.mixCanvasWidth / initPosition.squareWidth;
	
	/* Create Background Image */
	var backgroundView = Ti.UI.createImageView({
		image: "bk.png",
		right: 0 + 'px',
		top: 0 + 'px',
		width: initPosition.backgroundWidth + 'px',
		//height: initPosition.backgroundHeight + 'px',
		height: 'auto'
		//image:'http://' + socketRootHost + "/uploads/",
		
		//backgroundColor: "#f5f5f5"
		//borderWidth: 2,
		//borderColor: "#ff0000"
	});
	
	// Create drawing view
	var drawingView = mixPrepareDrawingView(initPosition);
	// Create a block view
	var blockView = mixBlockViewInit(initPosition, drawingView);
	
	var totalSubmitButton = Ti.UI.createButton({
		color: '#ffffff',
		backgroundColor:'#ee7722',
		
		top: (initPosition.photoHeight + initPosition.padding * 2) + 'px',
		right: initPosition.padding + 'px',
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
		var msg = mixWindow.passedMessage || "";
		mixWindow.text = msg || ("已傳送資料" + '\n' + waitForServer);
		if(testMode){
			mixWindow.countDownLabel.stopCountDown();
		}
		mixMaskView.show();
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
		
		//image:'http://' + socketRootHost + "/uploads/",
		
		//backgroundColor: "#f5f5f5"
		//backgroundImage: "exampleHead.png"
		//borderWidth: 2,
		//borderColor: "#ff0000"
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
		
		//textAlign:'center',
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
				mixMaskView.show();	
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
	
	mixWindow.countDownLabel = countDownLabel;
	
	mixWindow.addEventListener('androidback', function(e){
		// close socket
		e.cancelBubble = true;
		if(testMode){
			if(mixWindow.countdownInterval) clearInterval(mixWindow.countdownInterval);
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
				    	if(mixWindow.countdownInterval) clearInterval(mixWindow.countdownInterval);
				    	clearConnectionInfo();
				    }
				};
			})(e));
			dialog.show();
		}
	});
	
	/*
	mixWindow.addEventListener('orientationchange', function(e){
		var currentPosition = getCurrentPositionLayout(e.orientation);
		submitButton.setBottom(currentPosition.submitBtnBottom + 'px');
		submitButton.setRight(currentPosition.submitBtnRight + 'px');
		clearButton.setBottom(currentPosition.clearBtnBottom + 'px');
		clearButton.setRight(currentPosition.clearBtnRight + 'px');
		mixMaskView.setWidth(currentPosition.screenWidth + 'px');
		mixMaskView.setHeight(currentPosition.screenHeight + 'px');
		backgroundView.setWidth(currentPosition.backgroundWidth + 'px');
		backgroundView.setRight(currentPosition.backgroundRight + 'px');
		backgroundView.setTop(currentPosition.backgroundTop + 'px');
	});
	*/
	
	mixWindow.add(backgroundView);
	
	//mixWindow.add(canvas);
	
	mixWindow.add(imageView);
	mixWindow.add(userNumberLabel);
	//mixWindow.add(submitButton);
	//mixWindow.add(clearButton);
	mixWindow.add(countDownLabel);
	
	mixWindow.add(totalSubmitButton);
	
	mixWindow.add(blockView);
	mixWindow.add(drawingView);
	
	mixWindow.add(mixMaskView);
	
	mixWindow.arrangeLayout = function(orientation){
		var currentPosition = getCurrentPositionLayout(orientation);
		mixMaskView.setWidth(currentPosition.screenWidth + 'px');
		mixMaskView.setHeight(currentPosition.screenHeight + 'px');
		backgroundView.setWidth(currentPosition.backgroundWidth + 'px');
		backgroundView.setRight(currentPosition.backgroundRight + 'px');
		backgroundView.setTop(currentPosition.backgroundTop + 'px');
		// countDownLabel.setRight(currentPosition.countRight + 'px');
		// countDownLabel.setBottom(currentPosition.countBottom + 'px');
		drawingView.arrangeLayout(orientation);
	};
	
	mixWindow.refreshAll = function(){
		var self = this;
		// mixTriggerDeviceAction('stop');
		isDrawing = false;
		drawingView.hide();
		// mixDirtyList = {};
		mixCurrentRow = 1; 
		mixCurrentCol = 1;
		//canvas.clear();
		
		var xBlocks = 3;
		var yBlocks = 3;
		for(var row = 0; row < yBlocks; row++){
			for(var col = 0; col < xBlocks; col++){
				mixOccupyArray[row][col] = false;
				mixShortCanvasArray[row][col].clear();
				mixCanvasPointArray[row][col] = [];
			}
		}
		
		self.countDownLabel.reloadCountDownSecond();
		mixMaskView.label.text = waitForServer;
		mixMaskView.show();
		if(socketObj){
			socketObj.trigger(DEVICE_READY_EVENT, triggerObj);
		}
	};
	
	
	return mixWindow;
};
