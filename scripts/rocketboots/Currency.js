(function(){
	var component = {
		fileName: 		"Currency", 
		classNames:		["Currency"],
		requirements:	[],
		description:	"Currency class, useful for incremental games",
		credits:		"previously part of incrementer; by Luke Nickerson 2015-2016"
	};

	var Currency = component.Currency = function CurrencyClass (options){
		options 		= options || {};
		this.name 		= (options.name || options.elementId || "Currency_" + Math.round(Math.random() * 9999999));
		this.displayName = (options.displayName || this.name);
		this.symbol 	= (options.symbol || "");
		this.symbolBefore = true;
		//this.showRate	= (typeof options.showRate === "boolean") ? options.showRate : true;
		//this.showMax	= (typeof options.showMax === "boolean") ? options.showMax : false;
		this.rate 		= getDefaultNumber(options.rate, 0); // Increase per step
		this.min 		= getDefaultNumber(options.min, 0);
		this.max 		= getDefaultNumber(options.max, 1000000000); // 1B default
		this.val 		= getDefaultNumber(options.val, this.min);
		this.floor 		= Math.floor(this.val);
		this.stepsPerSecond = getDefaultNumber(options.stepsPerSecond, 1);
		this.lastUpdated = new Date();
		this.mathMethodForDisplay	= (options.mathMethodForDisplay || "floor");
		this.tip 		= (typeof options.tip === "string") ? options.tip : "";

		//this.hasCalculations = (options.calcRate || options.calcValue || options.calcMax) ? true : false;
		this.calcRate 	= (options.calcRate || undefined);
		this.calcValue 	= (options.calcValue || options.calcVal || undefined);
		this.calcMax 	= (options.calcMax || undefined);
		this.calcVal = this.calcValue; // alias

		if (typeof options.element === "object") {
			this.element	= options.element;	
		} else if (typeof options.elementId === "string") {
			this.element	= RocketBoots.document.getElementById(options.elementId);
		} else {
			this.element = RocketBoots.document.getElementById(this.name);
		}
		
		if (typeof options.callback == "function") {
			this.increment = function (steps){
				this._increment(steps);
				options.callback();
			}
			this.incrementByElapsedTime = function (now) {
				this._incrementByElapsedTime(now);
				options.callback();
			}
		}
		/* else {
			this.increment = this._increment;
			this.incrementByElapsedTime = this._incrementByElapsedTime;
		}
		*/
		function getDefaultNumber (a, b) {
			if (typeof a === "number") {
				return a;
			} else {
				return b;
			}
		}

	};

	Currency.prototype.getPercent = function(){
		if (this.max == 0) { return 0; }
		return this.val / this.max;
	}
	
	Currency.prototype.add = function(amount){
		if (typeof amount === "number") {
			this.val += amount;
		}
		this.correctBounds();
		return this;
	};
	Currency.prototype.subtract = function(amount) {
		this.add( -1 * amount );
	};
	Currency.prototype.zero = function () {
		this.val = 0;
		this.correctBounds();
		return this;
	};
	Currency.prototype.correctBounds = function(){
		if (this.val > this.max) {
			this.val = this.max;
		} else if (this.val < this.min) {
			this.val = this.min;
		}
		this.floor = Math.floor(this.val);
		return this;
	};	

	Currency.prototype.calculate = function(arg){
		//if (!this.hasCalculations) { return this; }
		_calculate.apply(this, ["rate", "calcRate", arg]);
		_calculate.apply(this, ["val", "calcValue", arg]);
		_calculate.apply(this, ["max", "calcMax", arg]);
		return this;
	};
	function _calculate (prop, methodName, arg) {
		if (typeof this[methodName] === "function") {
			var x = this[methodName](arg);
			if (typeof x === 'number') {
				this[prop] = x;
			} else {
				console.warn("Tried to set", this.name, " ", prop, "based on", methodName, "but its not a number.", this);
			}
		} else {
			//console.log("No methodName", methodName, "on", this);
		}		
	}


	// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/get
	Object.defineProperty(Currency.prototype, "displayValue", { get: function() {
		return _getDisplayValue(this.val, this.mathMethodForDisplay);
	}});
	Object.defineProperty(Currency.prototype, "displayMax", { get: function() {
		return _getDisplayValue(this.max, this.mathMethodForDisplay);
	}});

	function _getDisplayValue (n, mathMethod, div) {
		if (n === NaN) { console.warn("display value NaN"); }
		if (typeof div === 'undefined') {
			if (n > 10) {
				div = 1;
			} else if (n < 0.01) {
				div = 1000;
			} else if (n < 0.1) {
				div = 100;
			} else {
				div = 10;
			}
		}
		return Math[mathMethod](n * div)/div;
	}
	function _getDisplayValueString (n, mathMethod, div) {
		return _getDisplayValue(n, mathMethod, div).toLocaleString();
	}


	// FIXME: Move this to somewhere else?
	Currency.prototype.draw = function () {
		if (typeof this.element === 'undefined' || this.element === null) {
			return false;
		}
		var realRatePerSecond = this.rate * this.stepsPerSecond;
		var ratePerSecond = _getDisplayValueString(realRatePerSecond, this.mathMethodForDisplay);
		var plus = (realRatePerSecond < 0) ? "" : "+";
		var text =  this.displayValue;
		var html = '<span class="currency-val">' + text + '</span>';
		var symbol = "";
		
		text += " / " + this.displayMax;
		html += '<span class="currency-out-of">/</span><span class="currency-max">' + this.displayMax.toLocaleString() + '</span>';

		if (realRatePerSecond != 0) {
		 	text += " (" + plus + ratePerSecond.toLocaleString() + "/s)";
		 	html += ' <span class="currency-rate">(' + plus + ratePerSecond.toLocaleString() + '/s)</span>';
		}
		if (this.symbol.length > 0 && this.symbolBefore) {
			html = '<span class="currency-symbol">' + this.symbol + '</span>' + html;
		}
		if (this.tip.length > 0) {
			html += '<span class="currency-tip">' + this.tip + '</span>';
		}
		this.element.innerHTML = html;
		this.element.setAttribute("title", this.displayName + ": " + text);
		return true;
	}

	Currency.prototype._increment = function(steps){
		this.add(steps * this.rate);
		this.lastUpdated = new Date();
		//console.log(this.name, this.val);
		return this;
	};

	Currency.prototype._incrementByElapsedTime = function(now){
		if (typeof now === "undefined") { now = new Date(); }
		var secondsElapsed = (now - this.lastUpdated) / 1000;
		this.add(this.stepsPerSecond * secondsElapsed * this.rate);
		this.lastUpdated = now;
		//console.log(this.name, this.val);
		return this;
	};

	Currency.prototype.increment = Currency.prototype._increment;
	Currency.prototype.incrementByElapsedTime = Currency.prototype._incrementByElapsedTime;


	// Install into RocketBoots if it exists
	if (typeof RocketBoots == "object") {
		RocketBoots.installComponent(component);
	} else { // Otherwise put the classes on the global window object
		for (var i = 0; i < component.classNames.length; i++) {
			window[component.classNames[i]] = component[component.classNames[i]];
		}
	}
})();