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
			o.timer = window.setTimeout(function runLoop (){
				o.loop(); 
			}, o.delay);
		}			
	}
	Loop.prototype._safeReloop = function(o){
		if (o.isLooping) {
			o.iteration++;
			// --- Safety to prevent infinite loops ---
			if (o.iteration < 15000000) {
				o.timer = window.setTimeout(function(){
					o.loop(); 
				}, o.delay); 
			} else {
				o.iteration = 0;
				o.togglePause(true);
			}
		}			
	}
	
	Loop.prototype.loop = function(){
		var o = this;

		for (var mai = 0; mai < o.numOfModulusActions; mai++){
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
	}

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
		return this;
	}
	
	Loop.prototype.addModulusAction = function(tps, fn)
	{
		// tps = times per second
		// framesPerSecond = once per second
		// framesPerSecond/2 = twice per second
		var ma = {
			loopModulus : Math.round(this.framesPerSecond/tps),
			loopFunction : fn
		};
		this.modulusActions.push(ma);
		this.numOfModulusActions = this.modulusActions.length;
		return (this.modulusActions.length - 1);
	}
	Loop.prototype.removeModulusAction = function(index)
	{	
		return this.modulusActions.splice(index, 1);
	}

	Loop.prototype.set = function(fn, delay) {
		if (typeof fn !== 'function') { fn = function(){}; }
		this.setFunction(fn)
			.setDelay(delay);
		return this;
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