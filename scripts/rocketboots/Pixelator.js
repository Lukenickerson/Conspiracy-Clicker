(function(){
	var component = {
		fileName: 		"Pixelator",
		classNames:		["Pixelator"],
		requirements:	[],
		description:	"",
		credits:		"By Luke Nickerson, 2017"
	};

	function Pixelator (options){
		this.init(options);
	}
	component.Pixelator = Pixelator;


	Pixelator.prototype.init = function (options){
		_.extend(this, {canvas: null, ctx: null}, options);
		// Setup canvas context ctx
		if (this.canvas === null || this.ctx === null) {
			this.canvas = window.document.createElement('canvas');
			this.ctx = this.canvas.getContext('2d');
		}
		return this;
	};

	Pixelator.prototype.drawImage = function(image) {
		if (!(image instanceof Image)) { console.error("Not an image", image); return false; }
		this.canvas.width = image.width;
		this.canvas.height = image.height;
		this.ctx.drawImage(image, 0, 0);
		return this.ctx;	
	};

	Pixelator.prototype.loopOverImagePixels = function(image, callback, returnAdjacentPixels){
		var DATA_PER_PIXEL = 4;
		var pixelData;
		var color;
		var imageSize = {x: image.width, y: image.height};
		var mapWidth = image.width;
		var x = 0, y = (image.height - 1);
		var adjacentPixels;
		pixelData = this.getPixelData(image);
		for (var i = 0, l = pixelData.length; i < l; i += DATA_PER_PIXEL) {
			color = this.getColorFromPixelData(pixelData, i);
			if (returnAdjacentPixels) {
				adjacentPixelColors = [
					this.getColorFromPixelDataByCoords(pixelData, {x: (x), 		y: (y - 1)}, imageSize),	// 0 = up
					this.getColorFromPixelDataByCoords(pixelData, {x: (x + 1), 	y: (y - 1)}, imageSize),	// 1 = up-right
					this.getColorFromPixelDataByCoords(pixelData, {x: (x + 1), 	y: (y)}, imageSize),		// 2 = right
					this.getColorFromPixelDataByCoords(pixelData, {x: (x + 1), 	y: (y + 1)}, imageSize),	// 3 = down-right
					this.getColorFromPixelDataByCoords(pixelData, {x: (x), 		y: (y + 1)}, imageSize),	// 4 = down
					this.getColorFromPixelDataByCoords(pixelData, {x: (x - 1), 	y: (y + 1)}, imageSize),	// 5 = down-left
					this.getColorFromPixelDataByCoords(pixelData, {x: (x - 1), 	y: (y)}, imageSize),		// 6 = left
					this.getColorFromPixelDataByCoords(pixelData, {x: (x - 1), 	y: (y - 1)}, imageSize)		// 7 = up-left
/*
					this.getColorFromPixelDataByCoords(pixelData, i - (mapWidth * DATA_PER_PIXEL)), 		// 0 = up
					this.getColorFromPixelData(pixelData, i - ((mapWidth + 1) * DATA_PER_PIXEL)), 	// 1 = up-right
					this.getColorFromPixelData(pixelData, i + (1 * DATA_PER_PIXEL)), 				// 2 = right
					this.getColorFromPixelData(pixelData, i + ((mapWidth + 1) * DATA_PER_PIXEL)), 	// 3 = down-right
					this.getColorFromPixelData(pixelData, i + (mapWidth * DATA_PER_PIXEL)), 		// 4 = down
					this.getColorFromPixelData(pixelData, i + ((mapWidth - 1) * DATA_PER_PIXEL)), 	// 5 = down-left
					this.getColorFromPixelData(pixelData, i - (1 * DATA_PER_PIXEL)), 				// 6 = left
					this.getColorFromPixelData(pixelData, i - ((mapWidth - 1) * DATA_PER_PIXEL)), 	// 7 = up-left
*/
				];
				callback(color, {x: x, y: y}, adjacentPixelColors);
			} else {
				callback(color, {x: x, y: y}); //, this.colorToHex(color));
			}
			x++;
			if (x >= mapWidth) {
				x = 0;
				y--;
			}
			
		}	
	};

	Pixelator.prototype.getColorFromPixelDataByCoords = function(pixelData, coords, size, outOfBoundsColor) {
		var color;
		if (coords.x < 0 || coords.y < 0 || coords.x >= size.x || coords.y >= size.y) {
			if (typeof outOfBoundsColor === 'undefined') {
				outOfBoundsColor = {red: 0, green: 0, blue: 0, alpha: 0};
			}
			return (new this.Color(outOfBoundsColor));
		}
		i = (coords.y * size.x) + coords.x;
		return this.getColorFromPixelData(pixelData, i);
	};

	Pixelator.prototype.getColorFromPixelData = function(pixelData, i) {
		var color;
		if (typeof pixelData !== 'object') {
			return false;
		}
		if (pixelData.length == 0 || i < 0 || (i+3) >= pixelData.length) {
			console.warn("Could not get color - Pixel not found", pixelData, pixelData.length, "i = ", i);
			return false;
		}
		color = new this.Color({
			red:	pixelData[i],
			green:	pixelData[i+1],
			blue:	pixelData[i+2],
			alpha:	pixelData[i+3]
		});
		return color;
	};

	Pixelator.prototype.getPixelData = 
	Pixelator.prototype.imageToPixelData =
	function (image) {
		if (!(image instanceof Image)) { console.error("Not an image", image); return false; }
		var ctx = this.drawImage(image);
		var imageData = ctx.getImageData(0, 0, image.width, image.height);
		return imageData.data;
	};
	//Pixelator.prototype.imageToPixelData = Pixelator.prototype.getPixelData;

	Pixelator.prototype.getImageFromPixelData = 
	Pixelator.prototype.pixelDataToImage = 
	function (pixelData) {
		var canvas = window.document.createElement('canvas');
		var ctx = canvas.getContext('2d');
		var image = new Image();
		canvas.width = pixelData.width;
		canvas.height = pixelData.height;
		ctx.putImageData(pixelData, 0, 0);
		image.src = canvas.toDataURL();
		// TODO: remove canvas?
		//canvas.parent.removeChild(canvas);
		return image;
	};
	//Pixelator.prototype.pixelDataToImage = Pixelator.prototype.getImageFromPixelData;

	Pixelator.prototype.colorToHex = function (color) {
		function componentToHex(c) {
			var hex = c.toString(16);
			return hex.length == 1 ? "0" + hex : hex;
		}
		return '#' + componentToHex(color.red) + componentToHex(color.green) + componentToHex(color.blue);
	};

	Pixelator.prototype.getSpriteSheet = function (options) {
		var ss = new this.SpriteSheet(options);
		return ss;
	};


	//==== Pixel

	Pixelator.prototype.Pixel = function Pixel (options) {
		_.extend(this, { red: -1, green: -1, blue: -1, alpha: 1 }, options);
	};
	Pixelator.prototype.Pixel.prototype.isEqualRGB = function (color) {
		if (!(color instanceof Pixelator.prototype.Pixel)) { console.warn("Not a color:", color); }
		return (this.red === color.red && this.green === color.green && this.blue === color.blue);
	};
	Pixelator.prototype.Pixel.prototype.isEqualRGBA = function (color) {
		if (!(color instanceof Pixelator.prototype.Pixel)) { console.warn("Not a color:", color); }
		return (this.isEqualRGB(color) && this.alpha === color.alpha);
	};
	Pixelator.prototype.Pixel.prototype.isEqual = Pixelator.prototype.Pixel.prototype.isEqualRGBA;


	//==== Color (aka. a pixel)

	Pixelator.prototype.Color = Pixelator.prototype.Pixel;


	//==== Sprite Sheet

	Pixelator.prototype.SpriteSheet = function SpriteSheet (options) {
		if (typeof options === 'string') {
			options = {imageURL: options};
		} else if (options instanceof Image) {
			options = {image: options};
		}
		this.init(options);
	};
	
	Pixelator.prototype.SpriteSheet.prototype.init = function (options) {
		_.extend(this, {
			imageURL: null,
			image: null,
			sprites: []
		}, options);
		this.pixelator = new Pixelator();
		// TODO:LATER: Load this.image based on imageURL
	};

	Pixelator.prototype.SpriteSheet.prototype.getSprite = function (x, size) {
		// TODO:LATER: try to guess the size if not specified
		if (typeof x === 'number') {
			return this.getSpriteByIndex(x, size);
		}
		return this.getSpriteByCoords(x, size);
	};		
	Pixelator.prototype.SpriteSheet.prototype.getSpriteByIndex = function (i, size) {
		var sprite;
		if (this.sprites[i] instanceof Image) {
			return this.sprites[i];
		}
		// TODO: if size of sheet is not long enough... 
		if (false) {
			// TODO:LATER: do special stuff to look lower (left->right, top->bottom)
		} else {
			sprite = this.getSpriteByCoords({ x: i, y: 0 }, size);
			this.sprites[i] = sprite;
			return sprite;
		}
	};
	Pixelator.prototype.SpriteSheet.prototype.getSpriteByCoords = function (coords, size) {
		var pixelCoords = {
			x: (coords.x * size.x),
			y: (coords.y * size.y)
		};
		return this.getSpriteByPixelCoords(pixelCoords, size);
	};
	Pixelator.prototype.SpriteSheet.prototype.getSpriteByPixelCoords = function (coords, size) {
		var ctx = this.pixelator.drawImage(this.image);
		var pixelData = ctx.getImageData(coords.x, coords.y, size.x, size.y);
		var image = this.pixelator.getImageFromPixelData(pixelData);
		return image;
	};



	// Install into RocketBoots if it exists
	if (typeof RocketBoots === "object") {
		RocketBoots.installComponent(component);
	} else { // Otherwise put the classes on the global window object
		for (var i = 0; i < component.classNames.length; i++) {
			window[component.classNames[i]] = component[component.classNames[i]];
		}
	}
})();