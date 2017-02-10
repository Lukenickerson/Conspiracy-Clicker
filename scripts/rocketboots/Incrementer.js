(function(){
	var component = {
		fileName: 		"Incrementer",
		classNames:		["Incrementer"],
		requirements:	["Currency"],
		description:	"Incrementer class, useful for incremental games",
		credits:		"By Luke Nickerson, 2015-2016"
	};

	var Incrementer = component.Incrementer = function IncrementerClass (){
		this.currencies = {};
		this.currencyArray = [];
		this.currencyNum = 0;
	}
	Incrementer.prototype.addCurrencies = function(currencies){
		for (var i = 0; i < currencies.length; i++) {
			this.addCurrency(currencies[i]);
		}
		return this;
	};
	Incrementer.prototype.addCurrency = function(currencyOptions){
		var curr;
		if (typeof this.currencies[name] == "object") {
			console.error("Currency", name, "already exists; cannot add again.");
			return false;
		} else {
			curr = new RocketBoots.Currency(currencyOptions);
			this.currencies[curr.name] = curr;
			this.currencyArray.push(curr.name);
			this.currencyNum = this.currencyArray.length;
			return this;
		}
	};

	Incrementer.prototype.increment = function(steps, draw){
		if (typeof steps != "number") { steps = 1; }
		return this._increment(steps, draw, "increment");
	};
	Incrementer.prototype.incrementByElapsedTime = function (time, draw) {
		return this._increment(time, draw, "incrementByElapsedTime");
	};
	Incrementer.prototype._increment = function (arg1, draw, incMethod) {
		var fn;
		if (draw) {
			fn = function (curr) { 
				curr[incMethod](arg1);
				curr.draw();
			};
		} else {
			fn = function (curr) { 
				curr[incMethod](arg1); 
			};
		}
		this.loopOverCurrencies(fn);		
		return this;	
	};

	Incrementer.prototype.calculate = function(modifiers){
		var currencies = this.currencies;
		var hasModifiers = (typeof modifiers === 'object' && modifiers.length > 0) ? true : false;
		this.loopOverCurrencies(function(curr, currencyKey){
			curr.calculate(currencies);
			if (hasModifiers) {
			//if (currencyKey in modifiers) {
				if (typeof modifiers[currencyKey] === 'object') {
					for (var prop in modifiers[currencyKey]) {
						curr[prop] += modifiers[currencyKey][prop];
					}
				}
			//}
			}
		});
		return this;		
	}

	Incrementer.prototype.loopOverCurrencies = function(callback){
		var i, curr;
		for (i = 0; i < this.currencyNum; i++){
			curr = this.currencies[ this.currencyArray[i] ];
			callback(curr, this.currencyArray[i]);
		}
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