
var getCurrentPositionLayout = function(orientationMode){
	var modes = appValidModes;
	
	var obj = {
		screenWidth: Ti.Platform.displayCaps.platformWidth,
		screenHeight: Ti.Platform.displayCaps.platformHeight
	};
	
	obj.shortSideWidth = Math.min(obj.screenHeight, obj.screenWidth);
	obj.longSideWidth = Math.max(obj.screenHeight, obj.screenWidth);
	
	orientationMode = orientationMode || ((obj.shortSideWidth < obj.screenHeight)? Ti.UI.PORTRAIT : Ti.UI.LANDSCAPE_LEFT);
	if(modes.indexOf(orientationMode) == -1) return undefined;
	
	obj.padding = obj.shortSideWidth / 48;
	obj.squareWidth = obj.shortSideWidth - obj.padding * 2;
	
	obj.fontSize = (obj.shortSideWidth > 480)? (obj.shortSideWidth / 450 * 28) : 28;
	obj.gapUnitSize = (obj.shortSideWidth > 480)? (obj.shortSideWidth / 450 * 30) : 30;
	
	var isPortrait = orientationMode == Ti.UI.PORTRAIT; 
	//|| orientationMode == Ti.UI.UPSIDE_PORTRAIT
	
	// in running view 
	obj.photoWidth = obj.shortSideWidth * 2 / 5;
	obj.photoHeight = obj.photoWidth / 3 * 3.5;
	obj.buttonWidth = obj.shortSideWidth / 4.5;
	obj.buttonHeight = obj.longSideWidth / 12;
	
	obj.backgroundWidth = isPortrait? 
		(obj.screenWidth - obj.photoWidth - obj.padding * 2) : 
		(obj.screenWidth - obj.squareWidth - obj.padding); 
	obj.backgroundHeight = isPortrait?
		(obj.photoHeight - obj.buttonHeight):
		(obj.screenHeight - obj.photoheight - obj.buttonHeight - obj.padding * 2);
	obj.backgroundRight = isPortrait? 0 : (obj.squareWidth + obj.padding); 
	obj.backgroundTop = isPortrait? 0 : (obj.padding + obj.photoHeight);
	
	if(!isSynVersion){
		obj.canvasBottom = obj.padding;
		obj.canvasRight = obj.padding;
	}else{
		obj.canvasBottom = obj.padding;
		obj.canvasRight = (obj.longSideWidth - obj.squareWidth) / 2;
	}

	obj.photoLeft = obj.padding;
	obj.photoTop = obj.padding;
	
	if(!isSynVersion){
		obj.submitBtnBottom = isPortrait? (obj.squareWidth + obj.padding * 2) : obj.padding; 
		obj.submitBtnRight = isPortrait? obj.padding : (obj.squareWidth + obj.padding * 2);
		obj.clearBtnBottom = obj.submitBtnBottom;
		obj.clearBtnRight = isPortrait? (obj.buttonWidth + obj.padding * 2) : (obj.buttonWidth + obj.squareWidth + obj.padding * 3);	
	}else{
		obj.submitBtnBottom = obj.buttonHeight + obj.padding * 2; 
		obj.submitBtnRight = obj.padding;
		obj.clearBtnBottom = obj.padding;
		obj.clearBtnRight = obj.padding;	
	}
	
	
	// count down label
	obj.countWidth = obj.photoWidth * 2 / 3;
	obj.countHeight = obj.gapUnitSize * 2;
	if(obj.longSideWidth - obj.photoHeight - obj.squareWidth - obj.padding * 4 > obj.countHeight){
		obj.countRight = obj.squareWidth * 3 / 5 + obj.padding;
		obj.countBottom = obj.submitBtnBottom;
	}else{
		obj.countRight = obj.clearBtnRight;
		obj.countBottom = obj.clearBtnBottom + obj.buttonHeight + obj.padding;
	} 
	
	obj.numberWidth = obj.photoWidth / 4;
	obj.numberHeight = obj.photoHeight / 6;
	
	obj.maskWidth = obj.screenWidth;
	obj.maskHeight = obj.screenHeight;
	
	
	// for idioms game
	var totalBlockWidth = 2035;
	var totalBlockHeight = 1375;
	var totalBlockColumnHeaderSize = 55;
	var totalBlockCellSize = 165;
	var highlightBorder = 7;
	obj.blockWidth = obj.shortSideWidth * (totalBlockWidth / totalBlockHeight);
	obj.blockHeight = obj.shortSideWidth;
	var totalBlockWidthScale = obj.blockWidth / totalBlockWidth;
	var totalBlockHeightScale = obj.blockWidth / totalBlockWidth;
	var highlightBorderScale = totalBlockHeight / highlightBorder;
	obj.highlightWidth = totalBlockCellSize * totalBlockWidthScale;
	obj.highlightHeight = totalBlockCellSize * totalBlockHeightScale;
	obj.highlightInitLeft = totalBlockColumnHeaderSize * totalBlockWidthScale;
	obj.highlightInitTop = totalBlockColumnHeaderSize * totalBlockHeightScale; 
	
	obj.highlightBorder = obj.blockHeight / highlightBorderScale / 2;
	
	obj.wrongCanvasWidth = (obj.shortSideWidth - obj.padding * 4) / 3;
	obj.mixCanvasWidth = (obj.shortSideWidth - obj.padding * 4) / 3;
	
	return obj;
};

Ti.Gesture.addEventListener('orientationchange', function(e){
	var modes = appValidModes;
	if(modes.indexOf(e.orientation) != -1){
		if(currentWindow) currentWindow.arrangeLayout(e.orientation);
		//if(currentWindow) currentWindow.fireEvent('orientationchange', {eventObject:e});
		//if(inputView) inputView.fireEvent('orientationchange', {eventObject:e});
	}
});

