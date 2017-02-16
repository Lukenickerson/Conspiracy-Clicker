(function(){
	var component = {
		fileName: 		"Incrementer",
		classNames:		["Incrementer"],
		requirements:	["Currency"],
		description:	"Incrementer class, useful for incremental games",
		credits:		"By Luke Nickerson, 2015-2016"
	};

	function Incrementer (options) {
		this.currencies = {};
		this.currencyArray = [];
		this.currencyNum = 0;
		this.upgrades = [];
		this.upgradesLookup = {};
	};
	component.Incrementer = Incrementer;

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
		var incrementDrawFunction;
		if (draw) {
			incrementDrawFunction = function (curr) { 
				curr[incMethod](arg1);
				curr.draw();
			};
		} else {
			incrementDrawFunction = function (curr) { 
				curr[incMethod](arg1); 
			};
		}
		this.loopOverCurrencies(incrementDrawFunction);		
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
	};
	
	//==== Upgrades

	Incrementer.prototype.addUpgrades = function (upgradesList) {
		if (upgradesList instanceof Array) {
			for (var i = 0; i < upgradesList.length; i++) {
				this.addUpgrade(upgradesList[i]);
			}
		} else if (typeof upgradesList === "object") {
			for (var key in upgradesList) {
				this.addUpgrade(upgradesList[key]);
			}
		}
		return this;
	};

	Incrementer.prototype.addUpgrade = function (obj) {
		var ug = new Upgrade(obj);
		this.upgrades.push(ug);
		this.upgradesLookup[ug.id] = ug;
		// Should we check for duplicate names?
		return this;
	};

	Incrementer.prototype.getUpgrade = function (id) {
		return this.upgradesLookup[id];
	};

	Incrementer.prototype.getUpgrades = function (label) {
		if (typeof label === "string") {
			return _.filter(this.upgrades, function(o){
				return (o.labels.indexOf(label) > -1) ? true : false;
			});
		}
		return this.upgrades;
	};

	Incrementer.prototype.getOwnedUpgrades = function (label) {
		var upgrades = this.getUpgrades(label);
		return _.filter(upgrades, function(o){
			return (o.owned > 0) ? true : false;
		});
	};

	Incrementer.prototype.exportUpgradeOwnership = function () {
		var upgradeOwnership = [];
		this.loopOverUpgrades(function(upgrade){
			upgradeOwnership.push(upgrade.owned);
		});
		return upgradeOwnership;
	};

	Incrementer.prototype.importUpgradeOwnership = function (upgradeOwnership) {
		if (upgradeOwnership.length !== this.upgrades.length) {
			console.warn("Upgrade ownership number being imported (" + upgradeOwnership.length + ") does not match number of upgrades (" + this.upgrades.length + ").");
		}
		this.loopOverUpgrades(function(upgrade, i){
			upgrade.owned = upgradeOwnership[i];
		});
	};

	Incrementer.prototype.loopOverUpgrades = function (arg1, arg2) {
		var label, callback, upgrades, i;
		if (typeof arg1 === "string") {
			label = arg1;
			callback = arg2;
		} else {
			callback = arg1;
		}
		upgrades = this.getUpgrades(label);
		for (i = 0; i < upgrades.length; i++) {
			callback(upgrades[i], i, label);
		}
	};

	Incrementer.prototype.buyUpgrade = function (id, successCallback, failureCallback) {
		var ug = this.getUpgrade(id);
		var cost = ug.cost();
		var currName;
		if (this.canAffordUpgrade(ug)) {
			for (currName in cost) {
				this.currencies[currName].subtract(cost[currName]);
			}
			ug.owned += 1;

			if (typeof successCallback === "function") { successCallback(ug); }
			return true;
		} else {
			if (typeof failureCallback === "function") { failureCallback(ug); }
			return false;
		}
	};

	Incrementer.prototype.canAffordUpgrade = function (arg) {
		if (typeof arg === 'object') {
			var ug = arg;
		} else if (typeof arg === 'string') {
			var ug = this.getUpgrade(arg);
		}
		var cost = ug.cost();
		var affordCount = 0;
		var currencyCostCount = 0;
		for (var currName in cost) {
			currencyCostCount++;
			if (this.currencies[currName].val >= cost[currName]) {
				affordCount++; 
			}
		}
		return (affordCount == currencyCostCount);
	};


	function Upgrade (options) {
		options = _.extend({
			id: 					"upgrade-" + RocketBoots.getUniqueId(),
			name: 					"Upgrade",
			description: 			"",
			costCurrencyName: 		"",
			baseCost: 				{},
			owned: 					0,
			output:  				{},
			costMultiplier: 		1.5,
			costPowerMultiplier: 	1.1,
			outputValue: 			null,
			outputValueMultiplier: 	1,
			labels:					[]
		}, options);

		_.extend(this, options);
	};

	// This assumes that all currencies have an equal value 1-to-1
	Upgrade.prototype.getOutputValue = function () {
		var ov = 0;
		for (var currName in this.output) {
			ov += this.output[currName];
		}
		return ov;
	};

	Upgrade.prototype.calculateOutputValue = function () {
		this.outputValue = this.getOutputValue() * this.outputValueMultiplier;
		return this.outputValue;
	};

	// The base cost is the cost for the first unit of upgrade
	Upgrade.prototype.calculateBaseCost = function (n) {
		var costPerOutput = (100 * (n-1) + Math.pow(15, 1+(n*0.12)));
		costPerOutput = Math.round(costPerOutput/10) * 10; // round to nearest ten
		this.calculateOutputValue();
		this.baseCost = {};
		this.baseCost[this.costCurrencyName] = costPerOutput * this.outputValue;
		return this.baseCost;
	};

	// "cost" is the cost for the next unit of upgrade (costs go up exponentially)
	Upgrade.prototype.cost = function () {
		var finalCost = {};
		var base = 1;
		var power = 1;
		var roundBy = 10;
		for (var currName in this.baseCost) {
			base = this.baseCost[currName];
			power = this.owned == 1
			//if (this.owned == 1) {
			//	power = 0;
			//} else {
				power = this.owned * this.costPowerMultiplier;
			//}
			finalCost[currName] = (base * Math.pow(this.costMultiplier, power));
			if (finalCost[currName] > 1000000000)  {
				roundBy = 100000000;
			} else if (finalCost[currName] > 100000000)  {
				roundBy = 10000000;
			} else if (finalCost[currName] > 10000000)  {
				roundBy = 1000000;
			} else if (finalCost[currName] > 1000000)  {
				roundBy = 100000;
			} else if (finalCost[currName] > 100000)  {
				roundBy = 10000;
			} else if (finalCost[currName] > 10000) {
				roundBy = 1000;
			} else if (finalCost[currName] > 1000) {
				roundBy = 100;
			}
			finalCost[currName] = Math.round(finalCost[currName] / roundBy) * roundBy;
		}
		return finalCost;		
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