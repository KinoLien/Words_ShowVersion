
var wrongShortToProtocolScale = 1;
var wrongOriginToProtocolScale = 1;
var wrongOriginToShortScale = 1;

var wrongOccupyArray = null;
var wrongDirtyList = null;
var wrongShortCanvasArray = null;
var wrongCanvasPointArray = null;

var wrongCurrentRow = 1;
var wrongCurrentCol = 1;

var wrongUpdateOccupyBlocks = function(){
	
	for(var rc in wrongDirtyList){
		var val = wrongDirtyList[rc];
		if(typeof val == "boolean"){
			var rcsplit = rc.split('-');
			var ridx = parseInt(rcsplit[0]) - 1;
			var cidx = parseInt(rcsplit[1]) - 1; 
			wrongOccupyArray[ridx][cidx] = val;	
		}
	}
	
	wrongDirtyList = {};
};

var wrongTriggerDeviceAction = function(name){
	if(socketObj){
		socketObj.trigger(
			WRONG_EVENT + "." + ACTION_EVENT,
			{
				user_id: socketUser,
				block:{
					row: wrongCurrentRow,
					column: wrongCurrentCol
				},
				stamp: (new Date()).getTime(),
				action: "device_" + name,
				hasTrack: wrongShortCanvasArray[wrongCurrentRow - 1][wrongCurrentCol - 1].hasTrack === true
				// ,
				// cid: socketUser + "_" + wrongCurrentRow + "_" + wrongCurrentCol
			}
		);
	}
};

var wrongActionCallback = function(){
	var scope = currentWindow;
	var maskView = scope.maskView;
	return function(data){
		if(data.action == START_EVENT){
			wrongUpdateOccupyBlocks();
			maskView.hide();
			// maybe auto clear
			//scope.countDownLabel.doCountDown();
		}else if(data.action == STOP_EVENT){
			wrongUpdateOccupyBlocks();
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

var wrongClearCallback = function(){
	var scope = currentWindow;
	return function(data){
		/*
		if(socketUser != data.user_id && data.block){
			var block = data.block;
			var rowIndex = parseInt(block.row) - 1;
			var colIndex = parseInt(block.column) - 1;
			
			wrongCanvasPointArray[rowIndex][colIndex] = [];
			//wrongCanvasPointArray[rowIndex][colIndex] = [];
			
			var innerShortCanvas = wrongShortCanvasArray[rowIndex][colIndex];
			if(innerShortCanvas){
				innerShortCanvas.clear();
			}
		}
		*/
		// ******
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

var wrongTriggerMoveBlock = function(){
	if(socketObj){
		socketObj.trigger(
			WRONG_EVENT + "." + MOVE_BLOCK_EVENT,
			{
				user_id: socketUser,
				block:{
					row: wrongCurrentRow,
					column: wrongCurrentCol
				}
			}
		);
	}
};

var wrongPrepareShortCanvasView = function(canvasInfo){
	var res = Canvas.createCanvasView({
		width: canvasInfo.width + 'px',
		height: canvasInfo.height + 'px',
		left: canvasInfo.left + 'px',
		top: canvasInfo.top + 'px',
		borderWidth: 2,
		borderColor: "#ff3300"
	});
	
	res.rowIndex = canvasInfo.rowIndex;
	res.colIndex = canvasInfo.colIndex;
	
	// use protocol
	//res.pointCache = [];
	
	res.addEventListener('load', function(e){
		var v = e.source;
		v.lineWidth = canvasProtocol.lineWidth / wrongShortToProtocolScale;
		v.lineCap = canvasProtocol.lineCap;
	});
	
	res.addEventListener('click', (function(view){
		return function(e){
			var canvas = e.source;
			var row = canvas.rowIndex;
			var col = canvas.colIndex;
			wrongCurrentRow = row + 1;
			wrongCurrentCol = col + 1;
			var isOccupied = wrongOccupyArray[row][col];
			if(isOccupied) alert("這格已經不能寫囉！"); 
			if(testMode || !isOccupied){
				var points = wrongCanvasPointArray[row][col];
				if(points.length > 0){
					var last = view.children.length - 1;
					drawPointToCanvas(points, view.children[last], wrongOriginToProtocolScale);
				}
				view.show();
				wrongTriggerMoveBlock();
				wrongTriggerDeviceAction('start');	
			}
		};
	})(canvasInfo.relatedView));
	
	return res;
};

var wrongPrepareCanvasView = function(initPosition, img){
	var res = Canvas.createCanvasView({
		backgroundImage: img || 'block-524.png',
		width: initPosition.squareWidth + 'px',
		height: initPosition.squareWidth + 'px',
		bottom: initPosition.canvasBottom + 'px'
	});
	
	res.addEventListener('load', function(e){
		var v = e.source;
		v.lineWidth = canvasProtocol.lineWidth / wrongOriginToProtocolScale;
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
				WRONG_EVENT + "." + TOUCH_DOWN_EVENT,
				{
					user_id: socketUser,
					x: e.x * wrongOriginToProtocolScale, 
					y: e.y * wrongOriginToProtocolScale,
					block:{
						row: wrongCurrentRow,
						column: wrongCurrentCol
					},
					stamp: stamp 
				}
			);
		}
		obj.moveTo(e.x, e.y);
		//*/
		obj.pointCache = [
			[e.x * wrongOriginToProtocolScale],
			[e.y * wrongOriginToProtocolScale]
		];
		/*/
		var pointCache = wrongCanvasPointArray[wrongCurrentRow - 1][wrongCurrentCol - 1];
		pointCache.push([
			{
				x: e.x * wrongOriginToProtocolScale, 
				y: e.y * wrongOriginToProtocolScale
			}
		]);
		//*/
		wrongDirtyList[wrongCurrentRow + '-' + wrongCurrentCol] = true;
		
		var innerShortCanvas = wrongShortCanvasArray[wrongCurrentRow - 1][wrongCurrentCol - 1];
		if(innerShortCanvas){
			innerShortCanvas.beginPath();
			innerShortCanvas.drawPoint(e.x * wrongOriginToShortScale, e.y * wrongOriginToShortScale);
			innerShortCanvas.moveTo(e.x * wrongOriginToShortScale, e.y * wrongOriginToShortScale);
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
					WRONG_EVENT + "." + TOUCH_MOVE_EVENT,
					{
						user_id: socketUser,
						x: e.x * wrongOriginToProtocolScale,
						y: e.y * wrongOriginToProtocolScale,
						block:{
							row: wrongCurrentRow,
							column: wrongCurrentCol
						},
						stamp: stamp
					}
				);
			}
			//*/
			obj.pointCache = obj.pointCache || [ [], [] ];
			obj.pointCache[0].push(e.x * wrongOriginToProtocolScale);
			obj.pointCache[1].push(e.y * wrongOriginToProtocolScale);
			/*/
			var pointCache = wrongCanvasPointArray[wrongCurrentRow - 1][wrongCurrentCol - 1];
			pointCache[pointCache.length - 1].push({
				x: e.x * wrongOriginToProtocolScale, 
				y: e.y * wrongOriginToProtocolScale
			});
			//*/
			wrongDirtyList[wrongCurrentRow + '-' + wrongCurrentCol] = true;
			
			var innerShortCanvas = wrongShortCanvasArray[wrongCurrentRow - 1][wrongCurrentCol - 1];
			if(innerShortCanvas){
				innerShortCanvas.lineTo(e.x * wrongOriginToShortScale, e.y * wrongOriginToShortScale);
				innerShortCanvas.moveTo(e.x * wrongOriginToShortScale, e.y * wrongOriginToShortScale);
				innerShortCanvas.stroke();
			}
		}
	});
	res.addEventListener('touchend', function(e){ isDrawing = false;
		var pc = e.source.pointCache;
		if(pc && pc.length > 0){
			wrongCanvasPointArray[wrongCurrentRow - 1][wrongCurrentCol - 1].push(pc.slice(0));
			e.source.pointCache = null;
		}
	});
	res.addEventListener('touchcancel', function(e){ isDrawing = false;
		var pc = e.source.pointCache;
		if(pc && pc.length > 0){
			wrongCanvasPointArray[wrongCurrentRow - 1][wrongCurrentCol - 1].push(pc.slice(0));
			e.source.pointCache = null;
		}
	});
	
	return res;
};

var wrongPrepareDrawingView = function(initPosition){
	var wrongCanvasSize = initPosition.shortSideWidth;
	
	//var buttonWidth = initPosition.gapUnitSize * 3;
	//var buttonHeight = initPosition.gapUnitSize * 2;
	//var drawingViewHeight = wrongCanvasSize + buttonHeight + initPosition.padding;
	//var buttonRight = (initPosition.longSideWidth - wrongCanvasSize) / 2 - initPosition.padding - clearBtnWidth;
	
	var wrongDrawingView = Ti.UI.createView({
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
	
	var wrongConfirmButton = Ti.UI.createButton({
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
	
	var wrongClearButton = Ti.UI.createButton({
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
	
	var cview = wrongPrepareCanvasView(initPosition);
	
	maskView.addEventListener('click', function(e){
		wrongDrawingView.hide();
		//var cview = wrongCanvasPointArray[wrongCurrentRow - 1][wrongCurrentCol - 1];
		wrongTriggerDeviceAction('stop');
		cview.clear();
	});
	
	wrongConfirmButton.addEventListener('click', function(e){
		wrongDrawingView.hide();
		//var cview = wrongCanvasPointArray[wrongCurrentRow - 1][wrongCurrentCol - 1];
		wrongTriggerDeviceAction('stop');
		var canvasPoint = wrongCanvasPointArray[wrongCurrentRow-1][wrongCurrentCol-1]; 
		//Ti.API.info("In DrawView: " + JSON.stringify(canvasPoint));
		//alert(JSON.stringify(canvasPoint));
		if(socketObj && canvasPoint.length > 0){
			socketObj.trigger(
				WRONG_EVENT + "." + SUBMIT_EVENT,
				{
					user_id: socketUser,
					block:{
						row: wrongCurrentRow,
						column: wrongCurrentCol
					}
				}
			);
		}
		cview.clear();
	});
	
	wrongClearButton.addEventListener('click', function(e){
		var rowIndex = wrongCurrentRow - 1;
		var colIndex = wrongCurrentCol - 1;
		
		wrongDirtyList[wrongCurrentRow + '-' + wrongCurrentCol] = false;
		wrongCanvasPointArray[rowIndex][colIndex] = [];
		
		cview.clear();
		var shortCanvas = wrongShortCanvasArray[rowIndex][colIndex];
		shortCanvas.clear();
		if(socketObj){
			socketObj.trigger(
				WRONG_EVENT + "." + CLEAR_EVENT,
				{
					user_id: socketUser, 
					block:{
						row: wrongCurrentRow,
						column: wrongCurrentCol
					},
					stamp: (new Date()).getTime() 
				}
			);
		}
	});
	
	wrongDrawingView.add(maskView);
	//wrongDrawingView.add(wrongCancelButton);
	wrongDrawingView.add(wrongConfirmButton);
	wrongDrawingView.add(wrongClearButton);
	wrongDrawingView.add(cview);
	//wrongDrawingView.add(wrongCanvasPointArray[wrongCurrentRow - 1][wrongCurrentCol - 1]);
	
	wrongDrawingView.arrangeLayout = function(orientation){
		var currentPosition = getCurrentPositionLayout(orientation);
		wrongConfirmButton.setBottom(currentPosition.submitBtnBottom + 'px');
		wrongConfirmButton.setRight(currentPosition.submitBtnRight + 'px');
		wrongClearButton.setBottom(currentPosition.clearBtnBottom + 'px');
		wrongClearButton.setRight(currentPosition.clearBtnRight + 'px');
	};
	
	return wrongDrawingView;
};


var blockViewInit = function(initPosition, relateBigView){
	var imageBottomPosition = (initPosition.photoHeight + initPosition.padding);
	//var remainHeight = initPosition.longSideWidth - imageBottomPosition;
	var view = Titanium.UI.createView({
		//zIndex:1,
		width: initPosition.squareWidth + 'px',
		height: initPosition.squareWidth + 'px',
		top: (initPosition.longSideWidth + imageBottomPosition - initPosition.squareWidth) / 2 + 'px',
		right: initPosition.canvasRight + 'px',
		clearAll:function(){
			wrongDirtyList = {};
			for(var r = 0; r < 3; r++){
				for(var c = 0; c < 3; c++){
					wrongCanvasPointArray[r][c] = [];
					wrongOccupyArray[r][c] = false;
					var innerCanvas = wrongShortCanvasArray[r][c];
					if(innerCanvas){
						innerCanvas.clear();
					}		
				}
			}
		},
		clearBlock:function(block){
			var rowIndex = parseInt(block.row) - 1;
			var colIndex = parseInt(block.column) - 1;
			wrongDirtyList[block.row + '-' + block.column] = false;
			wrongCanvasPointArray[rowIndex][colIndex] = [];
			wrongOccupyArray[rowIndex][colIndex] = false;
			var innerCanvas = wrongShortCanvasArray[rowIndex][colIndex];
			if(innerCanvas){
				innerCanvas.clear();
			} 
		}
	});
	
	//var pointsArray = [];
	
	var shortCanvasWidth = initPosition.wrongCanvasWidth;
	
	if(!wrongDirtyList) wrongDirtyList = {};
	if(!wrongOccupyArray) wrongOccupyArray = [];
	if(!wrongShortCanvasArray) wrongShortCanvasArray = [];
	if(!wrongCanvasPointArray) wrongCanvasPointArray = [];
	for(var row = 0; row < 3; row++){
		var oSingleRow = [];
		var scSingleRow = [];
		var cSingleRow = [];
		for(var col = 0; col < 3; col++){
			oSingleRow.push(false);
			var shortCanvas = wrongPrepareShortCanvasView({
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
		wrongOccupyArray.push(oSingleRow);
		wrongShortCanvasArray.push(scSingleRow);
		wrongCanvasPointArray.push(cSingleRow);
	}
	 
	
	return view;
};

var wrongViewInit = function(meta){
	meta = meta || {};
	var initPosition = getCurrentPositionLayout();
	var wrongWindow = Titanium.UI.createWindow({
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
	
	var wrongMaskView = Titanium.UI.createView({
		backgroundColor:'#e0e0e0',
		opacity:0.7,
		//zIndex:1,
		visible:!testMode,
		width: initPosition.screenWidth + 'px',
		height: initPosition.screenHeight + 'px',
		left:0,top:0
	});
	var wrongMaskLabel = Titanium.UI.createLabel({
		color:'#000',
		text:waitForServer,
		//textAlign:'center',
		font:{
			fontSize: initPosition.fontSize + 'px',
			fontFamily: 'Helvetica Neue'
		}
	});
	
	wrongMaskView.add(wrongMaskLabel);
	wrongMaskView.label = wrongMaskLabel;
	wrongWindow.maskView = wrongMaskView;
	
	wrongShortToProtocolScale = canvasProtocol.width / initPosition.wrongCanvasWidth;
	wrongOriginToProtocolScale = canvasProtocol.width / initPosition.squareWidth;
	wrongOriginToShortScale = initPosition.wrongCanvasWidth / initPosition.squareWidth;
	
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
	var drawingView = wrongPrepareDrawingView(initPosition);
	// Create a block view
	var blockView = blockViewInit(initPosition, drawingView);
		
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
		visible: meta.hasSecond !== false,
		
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
				wrongMaskView.show();	
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
	
	wrongWindow.countDownLabel = countDownLabel;
	
	wrongWindow.addEventListener('androidback', function(e){
		// close socket
		e.cancelBubble = true;
		if(testMode){
			if(wrongWindow.countdownInterval) clearInterval(wrongWindow.countdownInterval);
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
				    	if(wrongWindow.countdownInterval) clearInterval(wrongWindow.countdownInterval);
				    	clearConnectionInfo();
				    }
				};
			})(e));
			dialog.show();
		}
	});
	
	/*
	wrongWindow.addEventListener('orientationchange', function(e){
		var currentPosition = getCurrentPositionLayout(e.orientation);
		submitButton.setBottom(currentPosition.submitBtnBottom + 'px');
		submitButton.setRight(currentPosition.submitBtnRight + 'px');
		clearButton.setBottom(currentPosition.clearBtnBottom + 'px');
		clearButton.setRight(currentPosition.clearBtnRight + 'px');
		wrongMaskView.setWidth(currentPosition.screenWidth + 'px');
		wrongMaskView.setHeight(currentPosition.screenHeight + 'px');
		backgroundView.setWidth(currentPosition.backgroundWidth + 'px');
		backgroundView.setRight(currentPosition.backgroundRight + 'px');
		backgroundView.setTop(currentPosition.backgroundTop + 'px');
	});
	*/
	
	wrongWindow.add(backgroundView);
	
	//wrongWindow.add(canvas);
	
	wrongWindow.add(imageView);
	wrongWindow.add(userNumberLabel);
	//wrongWindow.add(submitButton);
	//wrongWindow.add(clearButton);
	wrongWindow.add(countDownLabel);
	
	wrongWindow.add(blockView);
	wrongWindow.add(drawingView);
	
	wrongWindow.add(wrongMaskView);
	
	wrongWindow.arrangeLayout = function(orientation){
		var currentPosition = getCurrentPositionLayout(orientation);
		wrongMaskView.setWidth(currentPosition.screenWidth + 'px');
		wrongMaskView.setHeight(currentPosition.screenHeight + 'px');
		backgroundView.setWidth(currentPosition.backgroundWidth + 'px');
		backgroundView.setRight(currentPosition.backgroundRight + 'px');
		backgroundView.setTop(currentPosition.backgroundTop + 'px');
		countDownLabel.setRight(currentPosition.countRight + 'px');
		countDownLabel.setBottom(currentPosition.countBottom + 'px');
		drawingView.arrangeLayout(orientation);
	};
	
	wrongWindow.refreshAll = function(){
		var self = this;
		wrongTriggerDeviceAction('stop');
		isDrawing = false;
		drawingView.hide();
		wrongDirtyList = {};
		wrongCurrentRow = 1; 
		wrongCurrentCol = 1;
		//canvas.clear();
		
		var xBlocks = 3;
		var yBlocks = 3;
		for(var row = 0; row < yBlocks; row++){
			for(var col = 0; col < xBlocks; col++){
				wrongOccupyArray[row][col] = false;
				wrongShortCanvasArray[row][col].clear();
				wrongCanvasPointArray[row][col] = [];
			}
		}
		
		self.countDownLabel.reloadCountDownSecond();
		wrongMaskView.label.text = waitForServer;
		wrongMaskView.show();
		if(socketObj){
			socketObj.trigger(DEVICE_READY_EVENT, triggerObj);
		}
	};
	
	
	return wrongWindow;
};
