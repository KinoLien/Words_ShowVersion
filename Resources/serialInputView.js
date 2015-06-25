
var resetCallback = function(data){
	currentMask.show();
	if(data && data.second && !data.stage){
		currentMask.label.text = waitForServer;
		// currentWindow	
		if(gameInfo) gameInfo.second = parseInt(data.second);
		//currentWindow.refreshAll();
		currentWindow.countDownLabel.reloadCountDownSecond();
	}else{
		var oldStage = gameInfo? gameInfo.stage : "";
		currentMask.label.text = "關卡設定更新中...";
		getGameInfoRequest({
			onsendHandler: function(){
				clearTimeout(watingTimeOut);
				//serialMaskLabel.statusText = "正在取得遊戲資訊";
			},
			successHandler: (function(old){
				return function(info){
					clearTimeout(watingTimeOut);
					if(old != info.stage){
						deprecateStage(old);
						currentMask.label.text = "關卡切換中...";
						currentMask.show();
						prepareStage(info.stage);
						
						//inputView.maskInterval = setInterval(genMaskInterval(serialMaskLabel), 300);
						//deprecateStage(old);
						//prepareStage(info.stage);
					}else{
						currentWindow.refreshAll();
						//currentMask.hide();
					}
				};
			})(oldStage),
			errorHandler: function(info){
				clearTimeout(watingTimeOut);
				clearConnectionInfo();
			}
		});
	}
};


var genMaskInterval = function(maskLabel){
	var points = "";
	return function(){
		maskLabel.text = maskLabel.statusText + points;
		points += ".";
		if(points == "....."){
			points = "";
		}
	}; 
};

var serialInputViewInit = function(){
	var initPosition = getCurrentPositionLayout();
	var serialInputWindow = Titanium.UI.createWindow({
		//title: '一字千金 - 設定' + initPosition.screenWidth + " " + initPosition.screenHeight,
		title: '一字千金 - 設定',
		backgroundColor:'#fff',
		fullscreen:true,
		//tabBarHidden:true
		orientationModes:[
			//Ti.UI.LANDSCAPE_LEFT,
			//Ti.UI.LANDSCAPE_RIGHT,
			Ti.UI.PORTRAIT
		]
	});
	/*
	serialInputWindow.addEventListener('orientationchange', function(e){
		// orientation changed, modify positions.
	});
	*/

	var serialMaskView = Titanium.UI.createView({
		backgroundColor:'#e0e0e0',
		opacity:0.7,
		visible:false,
		width: initPosition.screenWidth + 'px',
		height: initPosition.screenHeight + 'px',
		left:0, top:0
	});
	var serialMaskLabel = Titanium.UI.createLabel({
		color:'#000',
		text: testMode? 'Loading' : '連線中',
		statusText: testMode? 'Loading' : '連線中',
		//textAlign:'center',
		font:{
			fontSize: initPosition.fontSize + 'px',
			fontFamily: 'Helvetica Neue'
		}
	});
	serialMaskView.add(serialMaskLabel);
	serialMaskView.label = serialMaskLabel;
	//serialMaskView.hide();
	serialInputWindow.maskView = serialMaskView;
	
	var serialLabel = Titanium.UI.createLabel({
		color:'#999',
		top: initPosition.gapUnitSize + 'px',
		text:'請輸入參賽編號',
		font:{
			fontSize: initPosition.fontSize + 'px',
			fontFamily: 'Helvetica Neue'
		},
		textAlign:'center',
		width:'auto'
	});
	
	var serialField = Ti.UI.createTextField({
		borderStyle: Ti.UI.INPUT_BORDERSTYLE_ROUNDED,
		color: '#336699',
		borderWidth:1,
		borderColor:'gray',
		backgroundColor: '#ffffff',
		value:socketUser || '',
		//top: 10, left: 10,
		font:{
			fontSize: initPosition.fontSize + 'px',
			fontFamily: 'Helvetica Neue'
		},
		top: initPosition.gapUnitSize * 3 + 'px',
		width: initPosition.gapUnitSize * 3 + 'px',
		height: initPosition.gapUnitSize * 2 + 'px'
	});
	 
	var ipLabel = Titanium.UI.createLabel({
		color:'#999',
		top: initPosition.gapUnitSize * 6 + 'px',
		text:'IP 位置',
		font:{
			fontSize: initPosition.fontSize + 'px',
			fontFamily: 'Helvetica Neue'
		},
		textAlign:'center',
		width:'auto'
	});
	
	var ipField = Ti.UI.createTextField({
		borderStyle: Ti.UI.INPUT_BORDERSTYLE_ROUNDED,
		color: '#336699',
		borderWidth:1,
		borderColor:'gray',
		backgroundColor: '#ffffff',
		font:{
			fontSize: initPosition.fontSize + 'px',
			fontFamily: 'Helvetica Neue'
		},
		//top: 10, left: 10,
		value:socketIpAddress || '',
		//editable: false,
		top: initPosition.gapUnitSize * 8 + 'px',
		width: initPosition.gapUnitSize * 10 + 'px',
		height: initPosition.gapUnitSize * 2 + 'px'
	});
	
	/*
	var portField = Ti.UI.createTextField({
		borderStyle: Ti.UI.INPUT_BORDERSTYLE_ROUNDED,
		color: '#336699',
		borderWidth:1,
		borderColor:'gray',
		//top: 10, left: 10,
		value:socketPortNumber || '',
		//editable: false,
		top:240,
		width: 60, height: 40
	});
	*/
	
	var newSubmitButton = Ti.UI.createButton({
		color: '#fff',
		backgroundColor:'#ff3333',
		//backgroundSelectedColor:'#3ff',	// that is not support IOS
		// maybe use backgroundImage and backgroundSelectedImage instead
		top: initPosition.gapUnitSize * 10.8 + 'px',
		width: initPosition.gapUnitSize * 7 + 'px',
		height: initPosition.gapUnitSize * 1.8 + 'px',
		title:'加入連線(新)',
		borderRadius:3,
		font:{
			fontSize: initPosition.fontSize + 'px',
			fontFamily: 'Helvetica Neue'
		}
	});
	
	var oldSubmitButton = Ti.UI.createButton({
		color: '#fff',
		backgroundColor:'#ff3333',
		opacity:0.5,
		top: initPosition.gapUnitSize * 13 + 'px',
		width: initPosition.gapUnitSize * 5 + 'px',
		height: initPosition.gapUnitSize * 1.4 + 'px',
		title:'加入連線(舊)',
		borderRadius:3,
		font:{
			fontSize: initPosition.fontSize * 0.8 + 'px',
			fontFamily: 'Helvetica Neue'
		}
	});
	
	var testRegionLabel = Titanium.UI.createLabel({
		color:'#999',
		top: initPosition.gapUnitSize * 15 + 'px',
		text:'試玩專區',
		font:{
			fontSize: initPosition.fontSize + 'px',
			fontFamily: 'Helvetica Neue'
		},
		textAlign:'center',
		width:'auto'
	});
	
	var testButton = Ti.UI.createButton({
		color: '#fff',
		backgroundColor:'#6666ff',
		//backgroundSelectedColor:'#3ff',	// that is not support IOS
		// maybe use backgroundImage and backgroundSelectedImage instead
		top: initPosition.gapUnitSize * 16.5 + 'px',
		width: initPosition.gapUnitSize * 5.5 + 'px',
		height: initPosition.gapUnitSize * 2 + 'px',
		title:'一般',
		borderRadius:3,
		font:{
			fontSize: initPosition.fontSize + 'px',
			fontFamily: 'Helvetica Neue'
		}
	});
	
	var wrongTestButton = Ti.UI.createButton({
		color: '#fff',
		backgroundColor:'#6666ff',
		//backgroundSelectedColor:'#3ff',	// that is not support IOS
		// maybe use backgroundImage and backgroundSelectedImage instead
		top: initPosition.gapUnitSize * 19 + 'px',
		width: initPosition.gapUnitSize * 5.5 + 'px',
		height: initPosition.gapUnitSize * 2 + 'px',
		title:'改錯',
		borderRadius:3,
		font:{
			fontSize: initPosition.fontSize + 'px',
			fontFamily: 'Helvetica Neue'
		}
	});
	
	var idiomsTestButton = Ti.UI.createButton({
		color: '#fff',
		backgroundColor:'#6666ff',
		//backgroundSelectedColor:'#3ff',	// that is not support IOS
		// maybe use backgroundImage and backgroundSelectedImage instead
		top: initPosition.gapUnitSize * 21.5 + 'px',
		width: initPosition.gapUnitSize * 5.5 + 'px',
		height: initPosition.gapUnitSize * 2 + 'px',
		title:'成語',
		borderRadius:3,
		font:{
			fontSize: initPosition.fontSize + 'px',
			fontFamily: 'Helvetica Neue'
		}
	});
	
	
	testButton.addEventListener('click', function(){
		testMode = true;
		
		serialMaskLabel.statusText = "正在開啟";
		
		serialInputWindow.maskInterval = setInterval(genMaskInterval(serialMaskLabel), 300);
		
		serialMaskView.show();
		
		socketUser = serialField.getValue();
		
		prepareStage("A1");
		
		/*
		runView = runningViewInit();
		runView.addEventListener('open', function(){
			serialMaskView.hide();
			clearInterval(serialInputWindow.maskInterval);
		});
		runView.open();
		*/
	});
	
	// serialField.getValue();
	newSubmitButton.addEventListener('click', function(){
		// Cache the code to globel variable and turn to run window
		testMode = false;
		serialMaskLabel.statusText = "連線中";
		
		serialInputWindow.maskInterval = setInterval(genMaskInterval(serialMaskLabel), 300);
		
		serialMaskView.show();
		
		// cache information
		socketUser = serialField.getValue();
		socketIpAddress = ipField.getValue();
		
		var wsIpAddress = socketIpAddress + ":" + socketPortNumber + "?_rtUserId=" + socketUser;
		
		//socketPortNumber = parseInt(portField.getValue());
		
		triggerObj.user_id = socketUser;
		// open socket to server
		
		socketObj = new WebSocketNodeJS("http://"+wsIpAddress);
		
		socketObj.on_open = function(e){
			//Ti.API.info('Socket opened');
			getGameInfoRequest({
				onsendHandler: function(){
					//clearTimeout(watingTimeOut);
					serialMaskLabel.statusText = "正在取得遊戲資訊";
				},
				successHandler: function(info){
					clearTimeout(watingTimeOut);
					serialMaskLabel.statusText = "正在開啟";
					prepareStage(info.stage);
					serialMaskLabel.statusText = "";
				},
				errorHandler: function(info){
					clearTimeout(watingTimeOut);
					alert(serialMaskLabel.statusText + ' Error, info: ' + JSON.stringify(gameInfo));
					clearConnectionInfo();
					if(currentMask) currentMask.hide();
				}
			});
			socketObj.bind(RESET_EVENT, resetCallback);
		};
		socketObj.disconnectHandler = function(){
			clearConnectionInfo();
		};
		socketObj.connect();
		watingTimeOut = setTimeout(function(){
			clearInterval(serialInputWindow.maskInterval);
			alert('ERROR: 連線逾時！');
			serialMaskView.hide();
			clearConnectionInfo();
		}, 4500);
	});
	
	oldSubmitButton.addEventListener('click', function(){
		// Cache the code to globel variable and turn to run window
		testMode = false;
		serialMaskLabel.statusText = "連線中";
		
		serialInputWindow.maskInterval = setInterval(genMaskInterval(serialMaskLabel), 300);
		
		serialMaskView.show();
		
		// cache information
		socketUser = serialField.getValue();
		socketIpAddress = ipField.getValue();
		
		var wsIpAddress = socketIpAddress + ":" + railsPortNumber + "/websocket?client_id=" + socketUser;
		
		//socketPortNumber = parseInt(portField.getValue());
		
		triggerObj.user_id = socketUser;
		// open socket to server
		
		socketObj = new WebSocketRails(wsIpAddress);
		
		socketObj.on_open = function(e){
			//Ti.API.info('Socket opened');
			getGameInfoRequest({
				onsendHandler: function(){
					//clearTimeout(watingTimeOut);
					serialMaskLabel.statusText = "正在取得遊戲資訊";
				},
				successHandler: function(info){
					clearTimeout(watingTimeOut);
					serialMaskLabel.statusText = "正在開啟";
					prepareStage(info.stage);
					serialMaskLabel.statusText = "";
				},
				errorHandler: function(info){
					clearTimeout(watingTimeOut);
					alert(serialMaskLabel.statusText + ' Error, info: ' + JSON.stringify(gameInfo));
					clearConnectionInfo();
					if(currentMask) currentMask.hide();
				}
			});
			socketObj.bind(RESET_EVENT, resetCallback);
		};
		socketObj.disconnectHandler = function(){
			clearConnectionInfo();
		};
		socketObj.connect();
		watingTimeOut = setTimeout(function(){
			clearInterval(serialInputWindow.maskInterval);
			alert('ERROR: 連線逾時！');
			serialMaskView.hide();
			clearConnectionInfo();
		}, 4500);
	});
	
	
	idiomsTestButton.addEventListener('click', function(){
		testMode = true;
		
		serialMaskLabel.statusText = "正在開啟";
		
		serialInputWindow.maskInterval = setInterval(genMaskInterval(serialMaskLabel), 300);
		
		serialMaskView.show();
		
		socketUser = serialField.getValue();
		
		prepareStage("B3");
		
		/*
		idiomsView = idiomsViewInit();
		idiomsView.addEventListener('open', function(){
			serialMaskView.hide();
			clearInterval(serialInputWindow.maskInterval);
		});
		idiomsView.open();
		*/
	});
	
	wrongTestButton.addEventListener('click', function(){
		testMode = true;
		
		serialMaskLabel.statusText = "正在開啟";
		
		serialInputWindow.maskInterval = setInterval(genMaskInterval(serialMaskLabel), 300);
		
		serialMaskView.show();
		
		socketUser = serialField.getValue();
		
		prepareStage("B2");
		
		/*
		idiomsView = idiomsViewInit();
		idiomsView.addEventListener('open', function(){
			serialMaskView.hide();
			clearInterval(serialInputWindow.maskInterval);
		});
		idiomsView.open();
		*/
	});
	
	
	// backgroundSelectedColor is not support IOS, so use this way instead
	newSubmitButton.addEventListener('touchstart', function(){
		newSubmitButton.backgroundColor = '#ff003f';
	});
	newSubmitButton.addEventListener('touchend', function(){
		newSubmitButton.backgroundColor = '#ff3333';
	});
	serialInputWindow.addEventListener('androidback', function(e){
		e.cancelBubble = true;
	});
	
	serialInputWindow.add(serialLabel);
	serialInputWindow.add(serialField);
	serialInputWindow.add(ipLabel);
	serialInputWindow.add(ipField);
	//serialInputWindow.add(portField);
	serialInputWindow.add(newSubmitButton);
	serialInputWindow.add(oldSubmitButton);
	serialInputWindow.add(testRegionLabel);
	serialInputWindow.add(testButton);
	serialInputWindow.add(wrongTestButton);
	serialInputWindow.add(idiomsTestButton);
	
	serialInputWindow.add(serialMaskView);
	
	return serialInputWindow;	
};

