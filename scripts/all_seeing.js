RocketBoots.loadComponents([
	"StateMachine",
	"Loop",
	"Incrementer",
	"Dice",
	"SoundBank",
	"Notifier",
	"Storage",
	"Walkthrough"
]).ready(function(rb){

	//==== GAME

	var g = new RocketBoots.Game({
		name: "Conspiracy Clicker",
		instantiateComponents: [
			{"state": "StateMachine"},
			{"loop": "Loop"},
			{"incrementer": "Incrementer"},
			{"dice": "Dice"},
			{"sounds": "SoundBank"},
			{"notifier": "Notifier"},
			{"storage": "Storage"},
			{"walkthrough": "Walkthrough"}
		],
		version: "v1.3.2"
	});
	var curr = g.currencies = g.incrementer.currencies;

	//==== CONSTANTS

	var LOOP_DELAY 			= 10,
		// 1000 = 1 second
		// 100 = 1/10th of a second
		// 10 = 1/100th of a second (better than 60 fps)
		SECONDS_PER_LOOP 	= (LOOP_DELAY / 1000),
		// Update certain things once every X iterations
		// 10 ==> once per second
		LOOP_MODULUS		= 10,
		SAVE_EVERY_SECONDS	= 10, // 10 seconds
		TOTAL_POPULATION 	= 7000000000; // US =314000000,
		SHORT_CURRENCY_SYMBOLS = {
			"indMoney" 		: "$"
			,"polMoney" 	: "$"
			,"medMoney"		: "$"
			,"votes"		: "votes"
			,"minds"		: "minds"
		},
		LONG_CURRENCY_SYMBOLS = {
			"indMoney" 		: "industry $"
			,"polMoney" 	: "politics $"
			,"medMoney"		: "media $"
			,"votes"		: "votes"
			,"minds"		: "minds"
		},
		SHOW_LAST_UPGRADES = 300
	; 

	// Other variables

	g.storage.prefix 	= "Conspiracy-Clicker.";
	g.winShown 			= false;

	//==== STATES

	g.state.addStates({
		"preload": {
			start: function(){
				g.sounds.loadSounds(["coin1","coin2","dud1","dud2","save1","transfer1","upgrade1","shock1"]);
				g.sounds.soundHook = function(isOn){
					if (isOn) {
						$('.toggleSound').removeClass("off").addClass("on");
					} else {
						$('.toggleSound').removeClass("on").addClass("off");
					}
				}
				g.walkthrough.setup();
				// Automatically move on...
				if (g.loadGame()) {
					g.state.transition("game");
				} else {
					g.state.transition("intro");
				}
			}
		},
		"intro": {
			start: function(){
				$('.intro .goto').fadeIn(200);
			}, end: function(){
				$('.intro .goto').fadeOut(200);
			}
		},
		"walkthru": {
			start: function(){
				$('section.intro').fadeOut(1000, function(){
					$('section.walkthru').fadeIn(1000);
					$('.threeCols').fadeIn(1000);
					$('.metrics').hide();
					$('.progress').hide();
				});
				$('.walkthru .goto').fadeIn(200);
			},
			end: function(){				
				$('.walkthru .goto').fadeOut(200);
				$('section.walkthru').fadeOut(1000);				
			}
		},
		"game": {
			viewName: "game",
			start: function(){
				// Load saved game; if none exists then create a baseline save; if all fails, bail out back to intro
				if (!g.loadGame()) {
					g.saveGame();
					if (!g.loadGame()) {
						g.state.transition("intro");
					}
				}
				g.calculateAll();
				g.writeUpgrades();
				//o.addFlipCardEvents();
				$('.upgradeList').hide().fadeIn(1000);
				$('.metrics').fadeIn(500);
				$('.progress').slideDown(200);
				$('.notifications').show();
				g.walkthrough.show();
				g.loop.start();				
			},
			end: function(){
				$('.notifications').hide();
				g.walkthrough.hide();
				g.saveGame();
				g.loop.stop();
			}
		},
		"pause": {

		},
		"menu": {
			start: function(){
				$('.notifications').show();
				g.loop.start();
			}, end: function(){
				$('.notifications').hide();
				g.loop.stop();
				g.saveGame();
			}
		},
		"win": {

		}
	});

	//==== MAIN LOOP

	g.loop.set(function quickLoop (iteration){
		g.incrementer.incrementByElapsedTime(undefined, true);
		g.incrementer.calculate();
	}, LOOP_DELAY).addActionPerSecond(function halfSecondLoop (){
		g.calculateAll();
		g.displayProgress();
		g.updateUpgradeAfford();
	}, 0.5).addActionPerSecond(function slowLoop (){
		g.autoSaveGame();
		g.displayLastSaveTime();
	}, 1);


	//===== Currencies

	g.incrementer.addCurrencies([
		// TOTALS
		{
			name: "indMoney",
			displayName: "Industry Money",
			selectors: {
				val: [".industry .money .val"],
				rate: [".industry .profitPerSecond .val"]
			}, calcRate: function(c){
				return g.upgradeRates[this.name] + g.flowRates[this.name];
			}
		},{
			name: "polMoney",
			displayName: "Politics Money",
			selectors: {
				val: [".politics .money .val"],
				rate: [".politics .profitPerSecond .val"]
			}, calcRate: function(c){
				return g.upgradeRates[this.name] + g.flowRates[this.name];
			}
		},{
			name: "medMoney",
			displayName: "Media Money",
			selectors: {
				val: [".media .money .val"],
				rate: [".media .profitPerSecond .val"]
			}, calcRate: function(c){
				return g.upgradeRates[this.name] + g.flowRates[this.name];
			}
		},{
			name: "votes",
			displayName: "Votes",
			selectors: {
				val: [".politics .votes .val"],
				rate: [".politics .votesPerSecond .val"]
			}, calcRate: function(c){
				return g.upgradeRates[this.name] + g.flowRates[this.name];
			}
		},{
			name: "minds",
			displayName: "Minds Controlled",
			selectors: {
				val: [".media .minds .val"],
				rate: [".media .mindsPerSecond .val"]
			}, calcRate: function(c){
				return g.upgradeRates[this.name] + g.flowRates[this.name];
			}
		},
		// PER CLICKS
		{
			name: "indMoneyPerClick",
			selectors: ".industry .profitPerClick .val",
			calcVal: function(c){
				return (1.0 + (g.upgradeCounts.industry / 5));
			}
		},{
			name: "polMoneyPerClick",
			selectors: ".politics .profitPerClick .val",
			calcVal: function(c){
				return (1.0 + (g.upgradeCounts.politics / 5));
			}
		},{
			name: "medMoneyPerClick",
			selectors: ".media .profitPerClick .val",
			calcVal: function(c){
				return (1.0 + (g.upgradeCounts.media / 5));
			}
		}
	]);

	g.mainCurrencyNames = ["indMoney", "polMoney", "medMoney", "votes", "minds"];


	//==== Upgrades

	g.importUpgradeData = function (rawUpgrades) {
		g.loopOverSectors(function(sector){
			//console.log(sector, "------------------");
			g.incrementer.addUpgrades(rawUpgrades[sector]);
			g.incrementer.loopOverUpgrades(sector, function(upgrade, i){
				upgrade.calculateBaseCost((i + 1));
				//console.log(upgrade.outputValue, upgrade.name, upgrade.outputValue / (i+1));
			});
		});
	};

	g.buyUpgrade = function($upgrade) {
		var id = $upgrade.attr("id");
		var bought = g.incrementer.buyUpgrade(id);
		if (bought) {
			g.sounds.play("upgrade1");
		} else {
			g.sounds.play("dud");
		}
		g.writeUpgrades();
		return bought;
	};


	//==== Rate Summations

	g.upgradeRates = {};
	g.zeroUpgradeRates = function () {
		g.loopOverCurrencies(function(currName){
			g.upgradeRates[currName] = 0;
		});
	};

	g.upgradeCounts = {};
	g.zeroUpgradeCounts = function () {
		g.upgradeCounts = { 
			"industry" : 0, "politics" : 0, "media" : 0, 
			"total": 0, 
			"uniqueOwned": 0,
			"uniqueTotal": 0,
		};
	};

	g.flowRates = {};
	g.zeroFlowRates = function(){
		g.loopOverCurrencies(function(currName){
			g.flowRates[currName] = 0;
		});
	};

	g.calculateAll = function () {
		g.calculateUpgradeCounts();
		g.calculateFlowRates();
		g.calculateUpgradeRates();			
	};

	g.calculateUpgradeCounts = function () {
		g.zeroUpgradeCounts();
		g.loopOverSectors(function(sector){
			g.incrementer.loopOverUpgrades(sector, function(upgrade){
				g.upgradeCounts[sector] += upgrade.owned;
				g.upgradeCounts.total += upgrade.owned;
				g.upgradeCounts.uniqueTotal += 1;
				if (upgrade.owned) {
					g.upgradeCounts.uniqueOwned += 1;
				}
			});
		});
		return g.upgradeCounts;
	};


	g.calculateUpgradeRates = function () {
		var o = this;
		g.zeroUpgradeRates();
		
		// Loop through all upgrades
		g.loopOverSectors(function(sector){
			g.incrementer.loopOverUpgrades(sector, function(upgrade){		
				if (upgrade.owned > 0) {
					if (typeof upgrade.output === 'object') {
						// Loop through all and see if the upgrade has values
						for (var ci in g.mainCurrencyNames) {
							var currName = g.mainCurrencyNames[ci];
							if (typeof upgrade.output[currName] === 'number') {
								g.upgradeRates[currName] += (upgrade.owned * upgrade.output[currName]);
							}
						}
					}
					/*
					if (typeof upgrade.perClick === 'object') {
						// Loop through all types and see if the upgrade has values
						for (var ci in g.mainCurrencyNames) {
							var currName = g.mainCurrencyNames[ci];
							if (typeof upgrade.perClick[currName] === 'number') {
								curr[currName + "PerClick"].val += (upgradeQuantity * upgrade.perClick[currName]);
							}							
						}					
					}
					*/
				}
			});
		});
	};

	
	g.flow = {
		"from" 			: ""
		,"to"			: ""
		,"baseSpeed"	: 1
		,"percentSpeed"	: 0.005
		,"efficiency"	: 0.75
	};

	g.isFlowing = function () {
		return (this.flow.from.length > 0 && this.flow.to.length > 0);
	}

	g.calculateFlowRates = function () {
		var flowSpeed;
		this.zeroFlowRates();
		this.flow.baseSpeed = 1.0 + (this.upgradeCounts.total / 20);
		if (this.isFlowing()) {
			flowSpeed = this.flow.baseSpeed + (this.flow.percentSpeed * curr[this.flow.from].val);
			// Make sure the amount flowing from can support it
			if (curr[this.flow.from].val >= flowSpeed) {
				g.flowRates[this.flow.from] -= flowSpeed;
				g.flowRates[this.flow.to] += (flowSpeed * this.flow.efficiency);
			}
		}
	}


	//==== Control

	g.sectors = ["industry", "politics", "media"];

	g.loopOverSectors = function (callback) {
		for (var i = 0; i < g.sectors.length; i++) {
			callback(g.sectors[i]);
		}
	}

	g.loopOverCurrencies = function (callback) {
		var numOfCurrencies = this.mainCurrencyNames.length;
		for (var i = 0; i < numOfCurrencies; i++) {
			callback(this.mainCurrencyNames[i]);
		}		
	}



	//===== Timing functions

	g.getSecondsSinceLastSaveTime = function () {
		var now = new Date(); 
		return Math.round((now - g.lastSaveDateTime) / 1000);
	};

	g.displayLastSaveTime = function () {
		var $lss = $('.lastSavedSeconds');
		if ($lss.is(":visible")) {
			$lss.html(this.getSecondsSinceLastSaveTime());
		}
	};

	//==== Save/Load
	
	g.isAutoSaveOn = true;
	g.lastSaveDateTime = new Date();

	g.autoSaveGame = function () {
		if (g.isAutoSaveOn) {
			if (g.getSecondsSinceLastSaveTime() > SAVE_EVERY_SECONDS) {
				g.saveGame();
			}
		}
	};

	g.saveGame = function(showNotice) {
		this.storage.save({
			"upgrades": g.incrementer.exportUpgradeOwnership(),
			"currencies": {
				indMoney: curr.indMoney.val,
				polMoney: curr.polMoney.val,
				medMoney: curr.medMoney.val,
				votes: curr.votes.val,
				minds: curr.minds.val,
			},
			"isSoundOn": g.sounds.isSoundOn,
			"walkthroughProgress": g.walkthrough.progress,
			"version": g.version
		});

		this.lastSaveDateTime = new Date();
		g.displayLastSaveTime();
		console.log("Game saved.");
	}
	
	g.deleteGame = function() {
		g.storage.remove(["upgrades", "currencies", "walkthroughProgress", "version"]);
		g.notifier.warn("Saved game deleted!");
		// TODO: Make a way to delete/restart without reloading the page
		window.location.reload(true); 
	}	
	
	g.loadGame = function () {
		var EXPECTED_KEYS = 5;
		var isFullyLoaded = false;
		var loaded = g.storage.load({
			"upgrades": function(data) {
				g.incrementer.importUpgradeOwnership(data);
			},
			"currencies": function(data) {
				g.loopOverCurrencies(function(currName){
					curr[currName].setVal(data[currName]);
				});
			},
			"isSoundOn": function(data) {
				g.sounds.toggle(data);
			},
			"walkthroughProgress": function(data) {
				g.walkthrough.progress = data;
			},
			"version": function(data) {
				if (data !== g.version) {
					g.notifier.warn("Loaded a saved game that was saved with a different game version (" + data + ") than the current (" + g.version + "). This could result in game errors. If so you may want to start a new game from the menu.");
				}			
			}
		});
		isFullyLoaded = (loaded.length === EXPECTED_KEYS);
		/*
		if (!isFullyLoaded) {
			g.notifier.warn("Could not fully load the game.");
		}
		*/
		return isFullyLoaded;
	}

	
	//=============================================== OUTPUT DISPLAY

	g.displayProgress = function () {
		var highVal = 0,
			lowVal = 0,
			totalControlled = 0,
			controlProgress = 0,
			unlockPercent = 0,
			combinedPercent = 0;

		if (curr.votes.val > curr.minds.val) {
			highVal = curr.votes.val;
			lowVal = curr.minds.val;
		} else {
			highVal = curr.minds.val;
			lowVal = curr.votes.val;		
		}
		totalControlled = highVal + (lowVal/2);

		controlProgress = (totalControlled / TOTAL_POPULATION) * 100;
		if (controlProgress > 100) {
			controlProgress = 100;
		}
		if (controlProgress < 0) {
			controlProgress = Math.round( controlProgress * 100000 ) / 100000;
		} else {
			controlProgress = Math.round( controlProgress * 10 ) / 10;
		}

		unlockPercent =  Math.floor((g.upgradeCounts.uniqueOwned / g.upgradeCounts.uniqueTotal) * 100);

		combinedPercent = (controlProgress + unlockPercent) / 2;

		// Display

		this.$mindControlPercent.html(controlProgress);
		this.$upgradeUnlockedPercent.html(unlockPercent);

		this.$progressVal.html(combinedPercent + "%");
		this.$progressBar.html('<div style="width: ' + combinedPercent + '%"></div>');
		
		// Check for win

		if (combinedPercent == 100 && !this.winShown) {
			g.state.transition("win");
			this.winShown = true;
		}
	}
	
	g.getDisplayNumber = function(n , abbreviate) {
		abbreviate = (abbreviate) ? true : false;
		if (n < 10) {
			n = ( n * 10 ) / 10;
		} else if (n > 999999999 && abbreviate) {
			n = (n / 1000000000);
			n = this.getCommaSeparatedNumber(n); //n = n.toLocaleString('en');
			n += "B";
		} else if (n > 999999 && abbreviate) {
			n = (n / 1000000);
			n = this.getCommaSeparatedNumber(n); //n = n.toLocaleString('en');
			n += "M";			
		} else if (n > 9999 && abbreviate) {
			n = (n / 1000);
			n = this.getCommaSeparatedNumber(n); //n = n.toLocaleString('en');
			n += "k";
		} else {
			n = parseInt(n);
			n = this.getCommaSeparatedNumber(n); //n = n.toLocaleString('en');
		}
		return n;
	}
	
	g.writeUpgrades = function () {
		var o = this;
		g.loopOverSectors(function(sector){
			o.writeUpgradesForSector(sector);
		});
	}
	
	g.writeUpgradesForSector = function (sector) {
		var o = this;
		var h = "";
		var lastOwnedUpgradeIndex = -1;
		var unknownCount = 0;
		g.incrementer.loopOverUpgrades(sector, function(upgrade, i){
			var canAfford = g.incrementer.canAffordUpgrade(upgrade);
			var cost = upgrade.cost();
			
			h += '<li class="upgrade clearfix flip ug-' + i;
			h += ((canAfford) ? ' afford ' : ' cannotAfford ');

			if (upgrade.owned > 0) {
				h += ' owned ';
				lastOwnedUpgradeIndex = i;
			} else {
				h += ' notOwned ';
			}
			if ((i - lastOwnedUpgradeIndex) > SHOW_LAST_UPGRADES) {
				h += ' unknown ';
				unknownCount++;
			}
			h += '" ' // end class
				+ ' id="' + upgrade.id + '" '
				+ ' data-sector="' + sector + '" '
				+ '>'
				+ '<div class="front">'
				+ '<div class="name">' + upgrade.name + '</div>'
				
				+ '<button type="button" class="buy"><div class="buyText">Buy</div>'
			;
			for (var currName in cost) {
				h += '<div class="cost val" title="Buy for ' + o.getDisplayNumber(cost[currName]) + ' ' + SHORT_CURRENCY_SYMBOLS[currName] + '">'
					+ o.getDisplayNumber(cost[currName], true)
					+ ' ' + SHORT_CURRENCY_SYMBOLS[currName]
					+ '</div>'
				;
			}
			h += '</button>'
				+ '<div class="count">' 
				+ ((upgrade.owned == 0) ? '-' : upgrade.owned)
				+ '</div>'
				+ '</div>' // endof front
				+ '<div class="back">'
			;
			if (typeof upgrade.description === 'string') {
				h += '<div class="details">' + upgrade.description + '</div>';
			}
			if (typeof upgrade.output === 'object') {
				h += '<ul class="">';
				for (var currName in upgrade.output) {
					h += '<li>' 
						+ ((upgrade.output[currName] > 0) ? "+" : "")
						+ o.getDisplayNumber(upgrade.output[currName])
						+ ' ' + LONG_CURRENCY_SYMBOLS[currName]
						+ '/sec'
						+ '</li>'
					;
				}
				h += '</ul>';
			}
			h += '</div>' // endof back
				+ '</li>'
			;
		});
		if (unknownCount > 0) {
			h += '<div class="upgrades-tease">+ ' + unknownCount + ' more upgrades</div>';
		}
		if (typeof o.$upgradeLists[sector] !== 'undefined') {
			o.$upgradeLists[sector].html(h);
			o.addFlipCardEvents(o.$upgradeLists[sector]);
		}
	}

	g.updateUpgradeAfford = function () {
		var o = this;
		g.loopOverSectors(function(sector){
			o.updateUpgradeAffordForSector(sector);
		});
	};

	g.updateUpgradeAffordForSector = function (sector) {
		g.incrementer.loopOverUpgrades(sector, function(upgrade){
			var $upgrade = $('#' + upgrade.id);
			var canAfford = g.incrementer.canAffordUpgrade(upgrade);
			if (upgrade.owned > 0) {
				$upgrade.addClass("owned").removeClass("notOwned");
			} else {
				$upgrade.addClass("notOwned").removeClass("owned");
			}
			if (canAfford) {
				$upgrade.addClass("afford").removeClass("cannotAfford");
			} else {
				$upgrade.addClass("cannotAfford").removeClass("afford");
			}
		});
	};

	
	//=============================================== Clickity Click
	
	g.industryClick = function (evt) {
		g.sounds.play("coin1");
		curr.indMoney.add(curr.indMoneyPerClick.val);
		this.animateClickEarning(curr.indMoneyPerClick.val, evt);
	}

	g.politicsClick = function (evt) {
		g.sounds.play("coin2");
		curr.polMoney.add(curr.polMoneyPerClick.val);
		this.animateClickEarning(curr.polMoneyPerClick.val, evt);
	}

	g.mediaClick = function (evt) {
		g.sounds.play("coin1");
		curr.medMoney.add(curr.medMoneyPerClick.val);
		this.animateClickEarning(curr.medMoneyPerClick.val, evt);
	}

	g.animateClickEarning = function (amount, evt) {
		var x = evt.pageX, y = evt.pageY;
		var $div = $('<div class="click-earn">+$' + amount + '</div>').css({
			//position: "absolute",
			opacity: 1
		}).appendTo('body');
		x = x - ($div.width() / 2); // center
		y = y - ($div.height() * 1.5); // go above cursor
		$div.css({ 
			top: 	y + "px",
			left: 	x + "px"
		});
		$div.animate({
			top: (y - 200) + "px",
			left: (x + g.dice.getRandomAround(100)) + "px",
			opacity: 0,
			fontSize: "80%"
		}, 1000, function(){
			$div.remove();
		});
	}

	//=============================================== SETUP & LAUNCH
	
	g.addFlipCardEvents = function ($elt) {
		if (typeof $elt === 'undefined') {
			var $base = $('.flip');
		} else {
			var $base = $elt.find('.flip');
		}
		$base.off("click").click(function () {
			var $flipcard = $(this);
			if ($flipcard.hasClass("flipped")) {
				$flipcard.removeClass('flipped');
			} else {
				$flipcard.addClass('flipped');
			}
		});
	};
	
	g.setup = function () {
		var o = this;
		var ajaxGetData = {};
		
	
		//=========== Setup UI

		$('.version').html(g.version);
		
		var $indClicker = $('.industry .clicker');
		var $polClicker = $('.politics .clicker');
		var $medClicker = $('.media .clicker');	
		
		o.$progressVal = $('.progress .progressVal');
		o.$progressBar = $('.progress .progressBar');

		o.$mindControlPercent = $('.mindControlPercent .val');
		o.$upgradeUnlockedPercent = $('.upgradeUnlockedPercent .val');
		
		$indClicker.click(function(e){	o.industryClick(e); });
		$polClicker.click(function(e){	o.politicsClick(e); });
		$medClicker.click(function(e){	o.mediaClick(e); });
		
		$('.save').click(function(e){
			g.sounds.play("save1");
			g.saveGame(true);
			//g.notifier.notify('Saved');
		});
		$('.load').click(function(e){
			g.sounds.play("save1");
			if (g.loadGame()) {
				g.state.transition("game");
			} else {
				g.state.transition("intro");
			}
		});
		$('.delete').click(function(e){
			g.sounds.play("shock1");
			g.deleteGame(true);
			//g.state.transition("intro");
		});
		$('.toggleSound').click(function(e){
			if (g.sounds.toggle()) {
				g.sounds.play("dud2");
			}
			g.saveGame();
		});
		$('.resetTips').click(function(e){
			console.log("Resetting tips");
			g.walkthrough.reset();
			g.state.transition("game");
		});
		/*
		$('.toggleAutoSave').click(function(e){
			o.isAutoSaveOn = !o.isAutoSaveOn;
			g.notifier.warn("AutoSave turned " + ((o.isAutoSaveOn) ? "ON" : "OFF"));
		});
		*/
		
		
		var $arrows = $('.focus .arrow');
		$arrows.click(function(e){
			var $thisArrow = $(this);
			if ($thisArrow.hasClass("active")) {
				$arrows.removeClass("active");
				g.flow.from = "";
				g.flow.to = "";
			} else {
				g.sounds.play("transfer1");
				$arrows.removeClass("active");
				$thisArrow.addClass("active");
				g.flow.from = $thisArrow.data("flowfrom");
				g.flow.to = $thisArrow.data("flowto");
			}
		});
		
		o.$upgradeLists = {};
		
		$('.metrics').click(function(e){
			$(this).find('.perClick').toggle(300);
		});
		
		g.loopOverSectors(function(sector){
			o.$upgradeLists[sector] = $('section.' + sector + ' ul.upgradeList');
			//console.log("Adding click event to List for sector: " + sector);
			//console.log(o.$upgradeLists[sector]);
			
			o.$upgradeLists[sector].on("click", function(e){
				
				var $target = $(e.target);
				var $ugli = $target.closest('li.upgrade');

				if ($target.hasClass("buy") || $target.parent().hasClass("buy")) {
					g.buyUpgrade($ugli);
				} else {
					//$ugli.find('.details').toggle();
				}
				e.stopPropagation();
			});
		});
		
		// Scroll Event
		var $win = $(window);
		//var $3cols = $('.threeCols');
		var $body = $('body');
		$win.scroll(function() {
			var height = $win.scrollTop();
			if (height > 450) {
				$body.addClass("scrolled-down");
				//$3cols.addClass("fixed");
			} else {
				$body.removeClass("scrolled-down");
				//$3cols.removeClass("fixed");

			}
		});

		$.ajax({
			type: 		"get"
			,url:		"data/cc_data.json"
			,dataType: 	"json"
			,complete: function(x,t) {
				g.state.transition("preload");
			}
			,success: function(responseObj) {
				g.importUpgradeData(responseObj.upgrades);
			}
			,failure: function(msg) {
				g.notifier.error("Fail\n"+ msg);
			}
			,error: function(x, textStatus, errorThrown) {
				g.notifier.error("Error\n" + x.responseText + "\nText Status: " + textStatus + "\nError Thrown: " + errorThrown);
			}
		});

	}
	
	//==== Helpers
	
	g.getCommaSeparatedNumber = function (val) {
		// From: http://stackoverflow.com/a/12947816/1766230
		while (/(\d+)(\d{3})/.test(val.toString())){
			val = val.toString().replace(/(\d+)(\d{3})/, '$1'+','+'$2');
		}
		return val;
	}
	

	g.setup(); // TODO: move this to state machine

	// Expose to the window object for debugging
	window.g = g;
});
