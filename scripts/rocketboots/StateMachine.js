(function(){
	var component = {
		fileName: 		"StateMachine",
		classNames:		["StateMachine"],
		requirements:	[],
		description:	"State machine; requires jQuery ($)",
		credits:		"By Luke Nickerson, 2014"
	};

	var StateMachine = component.StateMachine = function(){
		this.states = {};
		this.currentState = null;
		this.history = [];
		this._pruneHistoryAt = 200;
		this._pruneHistoryTo = 100;
	}

	// Getters
	StateMachine.prototype.get = function(name){
		if (typeof name == "undefined") {
			return this.currentState;
		} else if (typeof this.states[name] == "undefined") {
			console.error("State Machine: No such state " + name);
			return false;
		} else {
			return this.states[name];
		}
	}
	StateMachine.prototype.add = function(options){
		var name;
		if (typeof options === "string") {
			name = options;
			options = {};
		} else if (typeof options === "object") {
			name = options.name;
		}
		this.states[name] = new this.State(name, options);
		return this;
	};
	StateMachine.prototype.addStates = function (obj) {
		var sm = this;
		$.each(obj, function(stateName, stateOptions){
			stateOptions.name = stateName;
			sm.add(stateOptions);
		});
		return sm;
	};
	StateMachine.prototype.transition = function(newState, recordHistory){
		recordHistory = (typeof recordHistory === 'boolean') ? recordHistory : true;
		console.log("State Machine: Transition from " + this.currentState.name + " to " + newState, (recordHistory ? "": "(no history)"));
		this.currentState.end();
		this.currentState = this.get(newState);
		if (recordHistory) {
			this.history.push(newState);
			if (this.history.length > this._pruneHistoryAt) {
				this.history.splice(0, (this._pruneHistoryAt - this._pruneHistoryTo));
			}
		}
		this.currentState.start();
		return this;
	};
	StateMachine.prototype.back = function() {
		if (this.history.length >= 2) {
			this.history.pop();
			var end = this.history.length - 1;
			this.transition(this.history[end], false);
		}
		return this;
	};
	StateMachine.prototype.start = function(stateName){
		$('.state').hide();
		this.currentState = this.get(stateName);
		this.currentState.start();
		return this;
	}
	//sm.prototype.init();

	//==== State Class
	StateMachine.prototype.State = function(name, settings){
		this.name	= name;
		this.viewName = settings.viewName || name;
		this.$view	= $('.state.'+ this.viewName);
		this.start 	= null;
		this.end 	= null;
		this.update	= null;
		this.type 	= settings.type || null;
		this.autoView = settings.autoView || true;
		// Init
		this.setStart(settings.start);
		this.setEnd(settings.end);
		this.setUpdate(settings.update);
	}
	// Setters
	StateMachine.prototype.State.prototype.setStart = function(fn){
		var s = this;
		this.start = function () {
			if (typeof fn == "function") fn.apply(s); // TODO: use call or apply?
			if (s.autoView) {
				s.$view.show(); 
			}
		};
		return s;
	}
	StateMachine.prototype.State.prototype.setEnd = function(fn){
		var s = this;
		this.end = function () {
			if (typeof fn == "function") fn.apply(s); // TODO: use call or apply?
			if (s.autoView) {
				s.$view.hide(); 
			}
		};
		return s;		
	}
	StateMachine.prototype.State.prototype.setUpdate = function(fn){
		if (typeof fn == "function") this.update = fn;
		else this.update = function(){	};
		return this;
	}
	// Getters
	StateMachine.prototype.State.prototype.getType = function(){
		return this.type;
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