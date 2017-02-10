
function GbClass () {
	this.isPowerOn = false;
	this.canvasSize = { "x" : 160, "y" : 144 };
	this.canvasCenter = { "x" : 80, "y" : 72 };
	this.colors = ["#D2EDD1", "#84AD82", "#576E57", "#283328"];
	this.colorsRGB = [];
	this.colorAverages = [];
	this.colorThresholds = [];
	
	// Functions to overwrite
	this.buttonEvent = function(x) {
	}
	this.power = function(on) {
	}	
	
	// Color conversions
	// Source: http://stackoverflow.com/a/5624139/1766230
	this.hexToRgb = function (hex) {
		// Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
		var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
		hex = hex.replace(shorthandRegex, function(m, r, g, b) {
			return r + r + g + g + b + b;
		});

		var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
		return result ? {
			r: parseInt(result[1], 16),
			g: parseInt(result[2], 16),
			b: parseInt(result[3], 16)
		} : null;
	}
	this.rgbToHex = function (colorObj) {
		return "#" + componentToHex(colorObj.r) + componentToHex(colorObj.g) + componentToHex(colorObj.b);
	}
	this.setColorsRgb = function() {
		this.colorsRGB = [];
		this.colorAverages = [];
		this.colorThresholds = [];
		var rgb, colorAvg;
		var lastColorAvg = null;
		var threshold = null;
		
		for (var i = 0; i < 4; i++) {
			rgb = this.hexToRgb(this.colors[i])
			this.colorsRGB.push( rgb );
			
			colorAvg = Math.round((rgb.r + rgb.g + rgb.b)/3);
			this.colorAverages.push( colorAvg );
			if (lastColorAvg !== null) {
				
				threshold = Math.ceil(lastColorAvg - (Math.abs(colorAvg - lastColorAvg)/2));
				console.log(lastColorAvg, Math.abs(colorAvg - lastColorAvg), threshold);
				this.colorThresholds.push( threshold );
				lastColorAvg = colorAvg;
			}
			lastColorAvg = colorAvg;
		}
		console.log(this.colorAverages);
		console.log(this.colorThresholds);
	}
	// Run once on start
	this.setColorsRgb();
	

	// Filter
	this.applyCanvasFilter = function() 
	{
		//console.log("applying canvas filter");
		// http://jsfiddle.net/pHwmL/1/
		var imgData = this.ctx.getImageData(0,0,this.canvasSize.x,this.canvasSize.y);
		var dat = imgData.data;
		
		var colorThresholdLightest = this.colorThresholds[0];
		var colorThresholdLight = this.colorThresholds[1];
		var colorThresholdDark = this.colorThresholds[2];
		var r,g,b,alpha,avg, colorIndex;
		
		for(var p = 0, len = dat.length; p < len; p += 4) 
		{
			r = dat[p]
			g = dat[p+1];
			b = dat[p+2];
			alpha = dat[p+3];
			//console.log(r,g,b);
			avg = Math.round((r+g+b)/3);


			if (alpha < 100) {
				// Make fully transparent ~ should be equivalent to this.colors[0]
				dat[p+3] = 0;
			} else {

				if (avg >= colorThresholdLightest) {
					colorIndex = 0;
				} else if (avg >= colorThresholdLight) {
					colorIndex = 1;
				} else if (avg >= colorThresholdDark) {
					colorIndex = 2;
				} else {
					colorIndex = 3;
				}
				dat[p] = this.colorsRGB[colorIndex].r;
				dat[p+1] = this.colorsRGB[colorIndex].g;
				dat[p+2] = this.colorsRGB[colorIndex].b;
				dat[p+3] = 255;
			}
			
			// Make gray
			//dat[p] = dat[p+1] = dat[p+2] = avg;
		}
		this.ctx.putImageData(imgData,0,0);		
	}
	
	this.initializeGameToy = function() {
		this.canvas = document.getElementById('gbScreen');
		this.ctx = this.canvas.getContext('2d');
		this.ctx.webkitImageSmoothingEnabled = false;
		this.ctx.mozImageSmoothingEnabled = false;
		this.ctx.imageSmoothingEnabled = false;
		this.ctx.fillStyle = "red";
        this.ctx.strokeStyle = "black";
        this.ctx.textBaseline = "top";		
		this.ctx.save();

	
		var o = this;
		$('.gb').off("click").on("click", ".cartridge", function(e){
			o.isPowerOn = !o.isPowerOn;
			$('.cartridgeHelp').fadeOut();
			if (o.isPowerOn) {
				$('.gb').addClass("on");
			} else {
				$('.gb').removeClass("on");
			}
			o.power(true);
		}).on("click", "button", function(e){
			o.buttonEvent(e.target.className.toUpperCase());
		});
	}
}