(function(){
	var component = {
		fileName: 		"Keyboard",
		classNames:		["Keyboard"],
		requirements:	[],
		description:	"Component to make keyboard events easier to setup; still needs work.",
		version: 		"beta-2",
		credits:		"By Luke Nickerson, 2016"
	};
	component.Keyboard = Keyboard;
	function Keyboard (){
		this.keyDownActions = {};
		this.keyPressActions = {}; // TODO: press disabled for now; see TODO notes below
		this.keyUpActions = {};
		this.preventDefault = [];
	};

	// http://unixpapa.com/js/key.html
	Keyboard.prototype._keyCodeMap = {
		"9":	"TAB",

		"13":	"ENTER",

		"27":	"ESC",

		"32":	"SPACE",

		"37": 	"LEFT",
		"38":	"UP",
		"39":	"RIGHT",
		"40":	"DOWN",

		"48":	"0",
		"49":	"1",
		"50":	"2",
		"51":	"3",
		"52":	"4",
		"53":	"5",
		"54":	"6",
		"55":	"7",
		"56":	"8",
		"57":	"9",

		"65":	"a",

		"68":	"d",
		"69":	"e",

		"80":	"p",
		"81":	"q",

		"83":	"s",

		"87":	"w",
		"88":	"x",
		"89":	"y",
		"90":	"z",

		"112":	"F1",
		"113":	"F2",
		"114":	"F3",
		"115":	"F4",
		"116":	"F5",
		"117":	"F6",
		"118":	"F7",
		"119":	"F8",
		"120":	"F9",
		"121":	"F10",
		"122":	"F11",
		"123":	"F12",

		"187":	"=", // also "+"

		"189":	"-", // also "_"
		
	};

	Keyboard.prototype.getKeyFromKeyCode = function (keyCode) {
		return this._keyCodeMap[keyCode];
	};

	Keyboard.prototype._isFunctionKey = function (keyCode) {
		keyCode = parseInt(keyCode);
		return (keyCode >= 112 && keyCode <= 123) ? true : false;
	}

	Keyboard.prototype.tap = function (key) {
		this._fireAction(key, this.keyDownActions);
		this._fireAction(key, this.keyUpActions);
	};

	Keyboard.prototype._fireAction = function (key, keyActions) {
		var action = keyActions[key];
		var anyKeyAction = keyActions['ANY'];
		var didFindAction = false;
		var DIRECTIONS = ['UP', 'RIGHT', 'DOWN', 'LEFT'];
		if (typeof anyKeyAction === 'function') {
			//console.log("firing any-key action");
			anyKeyAction(key);
			didFindAction = true;
		}
		if (typeof action === 'function') {
			if (this.wasd) {
				switch (key) {
					case "w": key = "UP"; break;
					case "a": key = "LEFT"; break;
					case "s": key = "DOWN"; break;
					case "d": key = "RIGHT"; break;
				}
			}
			//console.log("Firing action", key)
			action(key, DIRECTIONS.indexOf(key));
			didFindAction = true;
		}
		if (didFindAction) {
			return true;
		} else {
			//console.warn("KB action not found", key);
			return false;
		}
	};	

	Keyboard.prototype.setup = function (options) {
		var kb = this;
		var RB$ = RocketBoots.$;
		options = RB$.extend({
			wasd: false,
			keyDownActions: {},
			keyPressActions: {},
			keyUpActions: {},
			preventDefault: []
		}, options);

		if (options.wasd) {
			// TODO: Do for up and press also?
			if (typeof options.keyDownActions["w"] !== 'function') {
				options.keyDownActions["w"] = options.keyDownActions["UP"];
			}
			if (typeof options.keyDownActions["a"] !== 'function') {
				options.keyDownActions["a"] = options.keyDownActions["LEFT"];
			}
			if (typeof options.keyDownActions["s"] !== 'function') {
				options.keyDownActions["s"] = options.keyDownActions["DOWN"];
			}
			if (typeof options.keyDownActions["d"] !== 'function') {
				options.keyDownActions["d"] = options.keyDownActions["RIGHT"];
			}
		}
		kb.clear();
		kb.wasd = options.wasd;
		kb.keyDownActions = options.keyDownActions;
		kb.keyPressActions = options.keyPressActions;
		kb.keyUpActions = options.keyUpActions;
		kb.preventDefault = options.preventDefault;
		
		function handleKeyEvent (event, actions) {
			var key = kb.getKeyFromKeyCode(event.which);
			var fired = kb._fireAction(key, actions);
			//console.log(event.which, key);
			// TODO: optimize this... calling inArray on every event may be slow
			if (fired || RB$.inArray(key, kb.preventDefault) > -1) {
				event.preventDefault();
			}
			// if (!kb._isFunctionKey(e.which)) {
			// 	e.preventDefault();
			// }			
		}

		// See: https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent
		RB$(document).on('keydown', function(e){
			//console.log('keydown', e.which);
			handleKeyEvent(e, kb.keyDownActions);
		}).on('keypress', function(e){
			// TODO: Make this work? Keypress uses different keycodes
			// See http://unixpapa.com/js/key.html
			// console.log('keypress', e.which);
			// handleKeyEvent(e, kb.keyPressActions);
        }).on('keyup', function(e){
        	//console.log('keyup', e.which);
        	handleKeyEvent(e, kb.keyUpActions);
        });

        // TODO: Make this more versatile and customizable
        RB$('.keyboard-tap').on("click", function(e){
        	var $clicked = RB$(this); //e.target);
        	var key = $clicked.data("keyboard-key");
        	//console.log("Click-Tapped", key);
        	kb.tap(key);
        });

        RB$('.keyboard-hold').on("mousedown", function(e){	
        	// TODO: Allow for holding down the mouse, using a timeout
        }).on("mouseup", function(e){
        	//console.log("mousedown", this);
        });
        return kb;
	};

	Keyboard.prototype.clear = function () {
		this.keyDownActions = {};
		this.keyPressActions = {};
		this.keyUpActions = {};		
		RocketBoots.$(document).off("keydown").off("keyup").off("keypress");
		RocketBoots.$('.keyboard-tap').off("click").off("mouseup").off("mousedown");
		RocketBoots.$('.keyboard-hold').off("click").off("mouseup").off("mousedown");
	};
	// Aliases
	Keyboard.prototype.start = Keyboard.prototype.setup;
	Keyboard.prototype.stop = Keyboard.prototype.clear;

	
	// Install into RocketBoots if it exists
	if (typeof RocketBoots === "object") {
		RocketBoots.installComponent(component);
	} else { // Otherwise put the classes on the global window object
		for (var i = 0; i < component.classNames.length; i++) {
			window[component.classNames[i]] = component[component.classNames[i]];
		}
	}
})();