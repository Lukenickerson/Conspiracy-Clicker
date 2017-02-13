(function(){
	var component = {
		fileName: 		"Storage",
		classNames:		["Storage"],
		requirements:	[],
		description:	"Wrapper for localStorage",
		credits:		"By Luke Nickerson, 2017"
	};

	function Storage (options) {
		if (typeof options === 'undefined') {
			options = {};
		}
		options = _.extend({
			prefix: 	"Game.RocketBoots.",
			_storage: 	localStorage
		}, options);

		_.extend(this, options);
	};
	component.Storage = Storage;

	Storage.prototype.save = function (data) {
		for (var key in data) {
			this.saveItem(key, data[key]);
		}
	};

	Storage.prototype.saveItem = function (key, value) {
		//console.log("Saving... ", this.prefix + key, value, JSON.stringify(value));
		return this._storage.setItem(this.prefix + key, JSON.stringify(value));
	};

	Storage.prototype.load = function (handlerObj) {
		var loaded = [];
		var data;
		var loadedObj;
		if (typeof handlerObj === "string") {
			return this.loadItem(handlerObj);
		} else if (typeof handlerObj === "object") {
			for (var key in handlerObj) {
				data = this.loadItem(key, handlerObj[key]);
				if (data !== null) {
					loadedObj = {};
					loadedObj[key] = data;
					loaded.push(loadedObj);
				}
			}
		}
		//console.log(loaded);
		return loaded;
	};

	Storage.prototype.loadItem = function (key, handler) {
		var data = this._storage.getItem(this.prefix + key);
		//console.log("Loading", this.prefix + key, "...", data);
		data = JSON.parse(data);
		//console.log(data);
		if (data !== null && typeof handler === "function") { 
			handler(data);
		}
		return data;
	};

	Storage.prototype.remove = function (arg) {
		if (typeof arg === "string") {
			return this.removeItem(arg);
		}
		for (var i = 0; i < arg.length; i++) {
			this.removeItem(arg[i]);
		}
	};

	Storage.prototype.removeItem = function (key) {
		return this._storage.removeItem(this.prefix + key);
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