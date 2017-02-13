(function(){
	var component = {
		fileName: 		"Loop",
		classNames:		["Loop"],
		requirements:	[],
		description:	"Loop (originally 'Looper')",
		credits:		"By Luke Nickerson, 2014-2016"
	};

	var Loop = component.Loop = function(fn, delay){
		this.set(fn, delay);
		this.isLooping 	= false;
		this.timer 		= 0;
		this.iteration 	= 0;
		//this.lastTime 	= 0;
		// Update certain things once every X iterations
		this.modulusActions 	= [];
		this.numOfModulusActions = 0;
	}
	
	Loop.prototype._reloop = function(o){
		if (o.isLooping) {
			o.iteration++;
			// TODO: Switch to animation frame -- https://jsperf.com/requestanimationframe-vs-setinterval-loop/7
			o.timer = window.setTimeout(function runLoop (){
				o.loop(); 
			}, o.delay);
		}			
	}
	/*
	Loop.prototype._safeReloop = function(o){
		if (o.isLooping) {
			o.iteration++;
			// --- Safety to prevent infinite loops ---
			if (o.iteration < 15000000) { // Use Number.MAX_SAFE_INTEGER ?
				o.timer = window.setTimeout(function(){
					o.loop(); 
				}, o.delay); 
			} else {
				o.iteration = 0;
				o.togglePause(true);
			}
		}			
	}
	*/
	
	Loop.prototype.loop = function(){
		var o = this;
		var mai = o.numOfModulusActions;
		while (mai--) {
			if ((o.iteration % o.modulusActions[mai].loopModulus) == 0) {
				o.modulusActions[mai].loopFunction();
			}
		}
		o.fn(o.iteration);
		o._reloop(o);	
	};

	Loop.prototype.start = function(){
		if (this.isLooping) {
			// Already looping (presumably)
			return this;
		}
		this.isLooping = true;
		this.numOfModulusActions = this.modulusActions.length;
		this.loop();
		return this;
	}
	Loop.prototype.pause = function(){
		this.isLooping = false;
		window.clearTimeout(this.timer);
		return this;
	}	
	Loop.prototype.stop = function(){ // same as pause except it resets the iteration count
		this.pause();
		this.iteration = 0;
		return this;
	}

	/*
	Loop.prototype.togglePause = function (forcePause) {
		if (typeof forcePause === 'boolean') {
			if (this.isLooping == !forcePause) return false;
			this.isLooping = !forcePause;
		} else {
			this.isLooping = !this.isLooping;
		}
		if (this.isLooping) this.loop();
		console.log("Game " + ((this.isLooping) ? "un" : "") + "paused.");
	}
	*/
	
	Loop.prototype.setFunction = function(fn){
		this.fn	= ((typeof fn === 'function') ? fn : function(){});
		return this;
	};

	Loop.prototype.setDelay = function(d){
		this.delay = d || 14;
		// ^ Decrease delay for more fps, increase for less fps
		// 1000 = 1 second
		// 100 = 1/10th of a second
		// 16 = 1/?th of a second = 62.5 fps (closest to 60 fps)
		// 15 = 66.667 fps
		// 14 = 71.429 fps
		// 10 = 1/100th of a second = 100 fps
		// Needs to be less than 16 to accomodate for the time it takes to run the loop 'stuff'		
		this.framesPerSecond = (1000 / this.delay);
		this.secondsPerLoop	= (this.delay / 1000);
		// TODO: This should also change all the modulus actions that are defined
		return this;
	};

	Loop.prototype.set = function(fn, delay) {
		if (typeof fn !== 'function') { fn = function(){}; }
		this.setFunction(fn)
			.setDelay(delay);
		return this;
	};

	Loop.prototype.addModulusAction = function(tps, fn, id) {
		// tps = times per second
		// framesPerSecond = once per second
		// framesPerSecond/2 = twice per second
		var ma = {
			id: id,
			loopModulus: Math.round(this.framesPerSecond/tps),
			loopFunction: fn
		};
		if (typeof ma.id !== 'string') {
			ma.id = 'Action-' + RocketBoots.getUniqueId();
		}
		this.modulusActions.push(ma);
		this.numOfModulusActions = this.modulusActions.length;
		return (this.modulusActions.length - 1);
	};

	Loop.prototype.removeModulusAction = function(index) {	
		return this.modulusActions.splice(index, 1);
	};

	// Some additional shorthand functions for more options, and which are more readable
	Loop.prototype.addAction = function (fn, ms, id) {
		if (ms < this.delay) {
			console.warn("Adding an action to occur more frequent than the delay will not work correctly.");
		}
		var tps = 1 / (ms / 1000);
		this.addModulusAction(tps, fn, id);
		return this;
	};

	Loop.prototype.removeAction = function (id) {
		for (var mai = 0; mai < this.numOfModulusActions; mai++){
			if (this.modulusActions[mai].id === id) {
				return this.removeModulusAction(mai);
			}
		}
		return false;
	};

	Loop.prototype.addActionPerSecond = function (fn, seconds, id) {
		if (typeof seconds !== 'number') {
			seconds = 1;
		}
		var ms = seconds * 1000;
		return this.addAction(fn, ms, id);
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