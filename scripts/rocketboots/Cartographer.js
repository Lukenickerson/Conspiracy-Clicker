(function(){
	var component = {
		fileName: 		"Cartographer",
		classNames:		["Cartographer"],
		requirements:	["Pixelator", "World"],
		description:	"",
		credits:		"By Luke Nickerson, 2017"
	};

	function Cartographer (options){
		this.init(options);
	}
	component.Cartographer = Cartographer;


	Cartographer.prototype.init = function (options){
		
		_.extend(this, {
			world: null, 
			mapImage: null,
			spriteSheetImage: null,
			entityDefaultOptions: {
				size: {x: 16, y: 16}
			},
			entityOptionsByColor: {
				// "#000000": { spriteSheetIndex: 0 }
			},
			exactColorMatch: true,
			tilesPerBlockEdge: 1, // <-- actual # of entities added will be this squared
		}, options);
		this.pixelator = new RocketBoots.Pixelator();
		this.spriteSheet = this.pixelator.getSpriteSheet(this.spriteSheetImage);
		return this;
	};



	Cartographer.prototype.putEntitiesIntoWorld = function (entGroups) { // e.g. ["terrain"]
		var o = this;

		this.loopOverMap(function(block, tile, entOptions){
			//TEST
			/*
			if (!block.adjacentPixelColors[0].isEqual(block.color) && tile.x == tile.y) {
				entOptions.image = o.spriteSheet.getSprite(block.spriteIndex+1, o.entityDefaultOptions.size);
			}
			*/
			o.world.putNewIn(entOptions, entGroups, false, false);
		});

		// For performance we need to wait to do this until the end
		o.world.categorizeEntitiesByGroup();
	};

	Cartographer.prototype.loopOverMap = function (callback) {
		var o = this;

		// Each pixel = a "block"
		// Each block can be made up of multiple "tiles", which typically become entities
		this.pixelator.loopOverImagePixels(o.mapImage, function(color, coords, adjacentPixelColors){
			var blockEntOptions = o.getEntityOptionsByColor(color);
			var block = {
				color: color,
				coords: coords,
				adjacentPixelColors: adjacentPixelColors,
				spriteSheet: o.spriteSheet,
				spriteIndex: blockEntOptions.spriteSheetIndex,
				image: null
			};
			var imageOptions = {};
			
			if (!blockEntOptions) { 
				console.warn("No ent options for block data. color =", color);
				return false; 
			}
			block.image	= block.spriteSheet.getSprite(block.spriteIndex, o.entityDefaultOptions.size);
			if (block.image instanceof Image) {
				imageOptions = {image: block.image};
			}
			
			// Set defaults
			blockEntOptions = _.extend(
				{
					color: o.pixelator.colorToHex(color),
					pos: null // <-- we should define as we loop over block
				}, 
				o.entityDefaultOptions,
				imageOptions,
				blockEntOptions
			);
			o.loopOverBlockTiles(block, blockEntOptions, callback);
		}, true);
	};

	Cartographer.prototype.loopOverBlockTiles = function (block, blockEntOptions, callback) {
		var o = this;
		var x = o.tilesPerBlockEdge;
		var y = o.tilesPerBlockEdge;
		var entHalfSize = {x: blockEntOptions.size.x / 2, y: blockEntOptions.size.y / 2};
		var tile;
		var entOptions;

		while (y--) {
			while (x--) {
				entOptions = _.clone(blockEntOptions);
				tile = {x: x, y: y};
				entOptions.pos = {
					x: ((block.coords.x * blockEntOptions.size.x * o.tilesPerBlockEdge) + (x * blockEntOptions.size.x) + entHalfSize.x),
					y: ((block.coords.y * blockEntOptions.size.y * o.tilesPerBlockEdge) + (y * blockEntOptions.size.y) + entHalfSize.y)
				};
				callback(block, tile, entOptions);			
			}
			x = o.tilesPerBlockEdge;
		}
};


	Cartographer.prototype.getEntityOptionsByColor = function(color) {
		var colorKey = this.pixelator.colorToHex(color);
		var entOptions = this.entityOptionsByColor[colorKey];
		if (typeof entOptions === 'object') {
			return entOptions;
		}
		if (!this.exactColorMatch) {
			// TODO:LATER: otherwise look for the next nearest color	
		}
		console.warn("No entities found for color key:", colorKey, this.entityOptionsByColor);
		return false;
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