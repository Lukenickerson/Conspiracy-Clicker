(function(){
	var component = {
		fileName: 		"SoundBank",
		classNames:		["SoundBank"],
		requirements:	[],
		description:	"Sound loader/player; formerly SoundCannon",
		credits:		"By Luke Nickerson, 2014-2015"
	};
	
	var sc = component.SoundBank = function() {
		this.sounds = {};
		this.isSoundOn = true;
		this.isMusicOn = true;
		this.callback = function(){};
		this.musicCallback = function(){};
	};
	sc.prototype._set = function(bool){
		if (!bool) this._setMusic(false);
		this.isSoundOn = bool;
		this.callback(bool);
	}
	sc.prototype._setMusic = function(bool){
		if (bool) this._set(true);
		this.isMusicOn = bool;
		this.musicCallback(bool);
	}
	sc.prototype.on = function() {
		this._set(true);
		return this;
	}
	sc.prototype.off = function() {
		this._set(false);
		return this;
	}
	sc.prototype.musicOn = function() {
		this._setMusic(true);
		return this;
	}
	sc.prototype.musicOff = function() {
		this._setMusic(false);
		return this;
	}
	sc.prototype.toggle = function (forceSound) {
		if (typeof forceSound === 'boolean') { 	
			this._set(forceSound);
		} else {
			this._set( !this.isSoundOn );
		}
		return this.isSoundOn;	
	}
	sc.prototype.toggleMusic = function (forceMusic) {
		if (typeof forceMusic === 'boolean') { 	
			this._setMusic(forceMusic);
		} else {
			this._setMusic(!this.isMusicOn);
		}
		return this.isMusicOn;	
	}
	sc.prototype.loadSounds = function(soundNameArray, directory, extension) {
		if (typeof directory != "string") directory = "sounds/";
		if (typeof extension != "string") extension = "mp3";
		var sn, snL = soundNameArray.length;
		for (var i = 0; i < snL; i++) {
			sn = soundNameArray[i];
			// *** if array is another array, then use index 0 as name, index 1 as volume
			this.sounds[sn] = new Audio(directory + sn + '.' + extension);
			this.sounds[sn].volume = 0.6;
		}
		console.log("Loaded", snL, "sounds.");
	}
	sc.prototype.play = function (soundName, isLooped)
	{
		if (this.isSoundOn) {	
			if (typeof this.sounds[soundName] === 'undefined') {
				console.log("Sound does not exist: " + soundName);
				return false;
			} else {
				if (typeof isLooped !== 'boolean') {
					isLooped = false;
				}
				this.sounds[soundName].loop = isLooped;
				if (!isLooped || this.isMusicOn) {
					this.sounds[soundName].play();
				}
				return true;
			}
		} else {
			return false;
		}
	}
	
	sc.prototype.stop = function(soundName){
		if (this.sounds[soundName]) {
			this.sounds[soundName].pause();
		} else {
			console.warning("Sound not found", soundName, this.sounds);
		}
	}


	// Install into RocketBoots if it exists
	if (typeof RocketBoots === "object") {
		RocketBoots.installComponent(component);
	} else { // Otherwise put the classes on the global window object
		for (var i = 0; i < component.classNames.length; i++) {
			window[component.classNames[i]] = component[component.classNames[i]];
		}
	}
})();