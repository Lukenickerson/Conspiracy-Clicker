(function(){
	var component = {
		fileName: 		"ImageBank",
		classNames:		["ImageBank"],
		requirements:	[],
		description:	"image loading; formerly known as Image Overseer",
		credits:		"By Luke Nickerson, 2014, 2017"
	};
	
	var ImageBank = component.ImageBank = function () {
		this.images = {};
		this.path = "images/";
	};
	ImageBank.prototype.get = function(imageName){
		return this.images[imageName];
	};
	ImageBank.prototype.getAll = function(){
		return this.images;
	};
	ImageBank.prototype.load = function(imageFileMap, callback) {
		this.images = this.loadImages(imageFileMap, callback);
	};
	ImageBank.prototype.loadImages = function(imageFileMap, callback) {
		var o = this;
		var imagesCount = 0;
		var imagesLoadedCount = 0;
		var sourceUrl = "";
		// Get the total count of images
		for (var v in imageFileMap) {
			imagesCount++;
		}
		// Loop through once more to convert the imageFileMap so it contains images
		for (var v in imageFileMap) {
			sourceUrl = imageFileMap[v];
			if (typeof sourceUrl === 'string') {
				o.images[v] = new Image();
				o.images[v].src = o.path + sourceUrl;
				o.images[v].onload = function imageOnLoad () {
					imagesLoadedCount++;
					if (imagesLoadedCount >= imagesCount) {
						console.log("ImageBank: All " + imagesCount + " images loaded.");
						if (typeof callback == "function") {
							callback(o.getAll());
						}
					}
				}
			}
		}
		console.log("ImageBank: Loading " + imagesCount + " images. (" + imagesLoadedCount + " done so far)");
		return o.images;
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