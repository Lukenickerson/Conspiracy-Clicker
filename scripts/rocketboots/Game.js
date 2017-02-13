(function(){
	var component = {
		fileName: 		"Game",
		classNames:		["Game"],
		requirements:	[],
		description:	"Game Class for RocketBoots",
		credits:		"By Luke Nickerson, 2016"
	};

	function Game (options) {
		if (typeof options === 'string') {
			options = {name: options};
		} else {
			options = options || {};
		}
		this.name = options.name || "Game made with RocketBoots";
		this.version = options.version || "";
		
		this.init(options);
	}
	component.Game = Game;

	//======================================================= Game Functions ======

	Game.prototype.init = function(options){
		//console.log("Initializing Game");
		var g = this;

		g._addDefaultComponents(options);
		if (typeof options.instantiateComponents === 'object') {
			g.instantiateComponents(options.instantiateComponents);
		}
		g._addStages(options);
		g._addDefaultStates();
		g.state._setupTransitionLinks();
		g.state.start("boot");
		return this;
	}

	Game.prototype.instantiateComponents = function (components) {
		var i, key, compClass;
		for (i = 0; i < components.length; i++) {
			
			for (key in components[i]) {
				compClass = components[i][key];
				//console.log("Instantiating component class", compClass, "as", key);
				this._addComponent(key, compClass);
			}
		}
		return this;
	}

	Game.prototype._addDefaultComponents = function(options){
		this._addComponent("state", "StateMachine")	
			//._addComponent("sounds", "SoundCannon")
			//._addComponent("images", "ImageOverseer")
			//._addComponent("state", "StateMachine")	
			//._addComponent("looper", "Looper")
			//._addComponent("timeCount", "TimeCount")
			//._addComponent("incrementer", "Incrementer")
			//._addComponent("dice", "Dice")
			//._addComponent("keyboard", "Keyboard")
			//._addComponent("physics", "Physics")
			//._addComponent("entity", "Entity")
			//._addComponent("world", "World", options.world);
			// *** stage?
		return this;
	};

	Game.prototype._addComponent = function(gameCompName, componentClass, arg){
		if (RocketBoots.hasComponent(componentClass)) {
			//console.log("RB adding component", gameCompName, "to the game using class", componentClass, "and arguments:", arg);
			this[gameCompName] = new RocketBoots[componentClass](arg);
		} else {
			console.warn(componentClass, "not found as a RocketBoots component");
		}
		return this;
	};

	Game.prototype._addDefaultStates = function () {
		var g = this;
		// Setup default states (mostly menu controls)
		/*
		var startMenu = function(){ 
			//$('header, footer').show();
		};
		var endMenu = function(){
			//$('header, footer').hide();
		}
		*/
		g.state.addStates({
			"boot": { 		autoView: true },
			"preload": { 	autoView: true },
			/*
			"mainmenu": { 	autoView: true, start: startMenu, end: endMenu },
			"new": { 		autoView: true, start: startMenu, end: endMenu },
			"save": { 		autoView: true, start: startMenu, end: endMenu },
			"load": { 		autoView: true, start: startMenu, end: endMenu },
			"help": { 		autoView: true, start: startMenu, end: endMenu },
			"settings": { 	autoView: true, start: startMenu, end: endMenu },
			"credits": { 	autoView: true, start: startMenu, end: endMenu },
			"share": { 		autoView: true, start: startMenu, end: endMenu },
			*/
			"game": {}
		});
		/*
		g.state.add("game",{
			start : function(){
				$('header, footer').hide();
				this.$view.show();
			}, end : function(){
				$('header, footer').show();
				this.$view.hide();
			}
		});
		*/
		
		//g.state.get("game").$view.show();

		return g;
	};

	Game.prototype._addStages = function (options) {
		var g = this;
		var stageData;
		if (typeof RocketBoots.Stage !== "function") {
			return g;
		}
		if (typeof options.stages === 'object') {
			stageData = options.stages;
		} else if (typeof options.stage === 'object') {
			stageData = [options.stage];
		} else {
			return g;
		}
		if (stageData.length > 0) {
			g.stages = g.stages || [];
			$.each(stageData, function(i, stageOptions){
				g.stages[i] = new RocketBoots.Stage(stageOptions);
				if (typeof stageOptions.layerNames === 'object') {
					$.each(stageOptions.layerNames, function(x, layerName){
						g.stages[i].addLayer(layerName);
					});
				}
				g.stages[i].resize();
			});
			g.stage = g.stages[0];
		}
		return g;
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