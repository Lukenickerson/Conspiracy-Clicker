RocketBoots.loadComponents([
	"StateMachine",
	"Loop",
	"Incrementer",
	"Dice",
	"SoundBank",
	"Notifier"
]).ready(function(rb){

	//==== CONSTANTS

	var LOOP_DELAY 			= 10,
		// 1000 = 1 second
		// 100 = 1/10th of a second
		// 10 = 1/100th of a second (better than 60 fps)
		SECONDS_PER_LOOP 	= (LOOP_DELAY / 1000),
		// Update certain things once every X iterations
		// 10 ==> once per second
		LOOP_MODULUS		= 10,
		SAVE_EVERY_SECONDS	= 10 // 10 seconds
	; 

	//==== GAME, STATES, MAIN LOOP

	var g = new RocketBoots.Game({
		name: "Conspiracy Clicker",
		instantiateComponents: [
			{"state": "StateMachine"},
			{"loop": "Loop"},
			{"incrementer": "Incrementer"},
			{"dice": "Dice"},
			{"sounds": "SoundBank"},
			{"notifier": "Notifier"}
		]
	});
	var curr = g.currencies = g.incrementer.currencies;
	g.version = "v1.2-beta1";
	g.cc = new CCGameClass();

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
				// Automatically move on...
				if (g.cc.loadGame()) {
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
				if (!g.cc.loadGame()) {
					g.cc.saveGame();
					if (!g.cc.loadGame()) {
						g.state.transition("intro");
					}
				}
				g.calculateAll();
				g.cc.writeUpgrades();
				//o.addFlipCardEvents();
				$('.upgradeList').hide().fadeIn(1000);
				$('.metrics').fadeIn(500);
				$('.progress').slideDown(200);
				$('.notifications').show();
				//$('.threeCols').fadeIn(800, function(){
					g.loop.start();
				//});
				
			},
			end: function(){
				$('.notifications').hide();
				g.cc.saveGame();
				g.loop.stop();
			}
		},
		"pause": {

		},
		"menu": {
			start: function(){
				$('.notifications').show();
				g.loop.start();
			}, stop: function(){
				$('.notifications').hide();
				g.loop.stop();
			}
		},
		"win": {

		}
	});

	g.loop.set(function(iteration){
		g.incrementer.incrementByElapsedTime(undefined, true);
		g.incrementer.calculate();
	}, LOOP_DELAY).addActionPerSecond(function(){
		g.calculateAll();
		g.cc.displayProgress();
		g.cc.updateUpgradeAfford();
	}, 0.5).addActionPerSecond(function(){
		g.cc.autoSaveGame();
		g.displayLastSaveTime();
	}, 1);

	g.cc.setup(); // TODO: move this to state machine


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
		g.cc.calculateUpgradeCounts();
		g.cc.calculateFlowRates();
		g.cc.calculateUpgradeRates();			
	};


	//===== Timing functions

	g.getSecondsSinceLastSaveTime = function () {
		var now = new Date(); 
		return Math.round((now - g.cc.lastSaveDateTime) / 1000);
	};

	g.displayLastSaveTime = function () {
		$('.lastSavedSeconds').html(this.getSecondsSinceLastSaveTime());
	};


	//==== Control

	g.loopOverSectors = function (callback) {
		for (var sector in g.cc.owned.upgrades) {
			callback(sector);
		}
	}

	g.loopOverCurrencies = function (callback) {
		var numOfCurrencies = this.mainCurrencyNames.length;
		for (var i = 0; i < numOfCurrencies; i++) {
			callback(this.mainCurrencyNames[i]);
		}		
	}


	/* === Original Conspiracy Clicker Game === */

	function CCGameClass () {
		// Constants

		this.totalPopulation = 314000000;
		
		// Static Data
		this.data = {	// Get from JSON data
			"upgrades" 	: {}
			,"groups"	: {}
		};	
		// Game Data
		this.owned = {
			"upgrades" : {
				//"industry" : [], "politics" : [], "media" : []
			}
		};
		this.winShown = false;
		this.isAutoSaveOn = true;
		this.lastSaveDateTime = new Date();
		
		// Constants, Lookups
		this.sectorArray = ["industry", "politics", "media"];
		this.shortDisplayValueTypes = {
			"indMoney" 		: "$"
			,"polMoney" 	: "$"
			,"medMoney"		: "$"
			,"votes"		: "votes"
			,"minds"		: "minds"
		};	
		this.displayValueTypes = {
			"indMoney" 		: "industry $"
			,"polMoney" 	: "politics $"
			,"medMoney"		: "media $"
			,"votes"		: "votes"
			,"minds"		: "minds"
		};
		// Game Data
		this.flow = {
			"from" 			: ""
			,"to"			: ""
			,"baseSpeed"	: 1
			,"percentSpeed"	: 0.005
			,"efficiency"	: 0.75
		};

		
		//=============================================== OUTPUT DISPLAY

		this.displayProgress = function () {
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
			if (totalControlled > this.totalPopulation) {
				totalControlled = this.totalPopulation;
			}
			controlProgress = (totalControlled / this.totalPopulation) * 100;
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
		
		this.displayNumber = function (n, $elt) {
			//console.log($elt);
			$elt.html(this.getDisplayNumber(n));
		}
		
		this.getDisplayNumber = function(n , addK) {
			if (n < 10) {
				n = Math.round( n * 10 ) / 10;
			} else if (n > 99999 && typeof addK === 'boolean' && addK) {
				n = Math.round(n / 1000);
				n = this.getCommaSeparatedNumber(n); //n = n.toLocaleString('en');
				n += "k";
			} else {
				n = parseInt(n);
				n = this.getCommaSeparatedNumber(n); //n = n.toLocaleString('en');
			}
			return n;
		}
		
		this.writeUpgrades = function () {
			for (var sector in this.owned.upgrades) {
				this.writeUpgradesForSector(sector);
			}
		}
		
		this.writeUpgradesForSector = function (sector) {
			var h = "";
			var sectorUpgrades = this.owned.upgrades[sector];
			var lastOwnedUpgradeIndex = -1;
			var SHOW_LAST_UPGRADES = 3;
			var unknownCount = 0;
			for (var ugi in sectorUpgrades) {
				var upgradeCount = sectorUpgrades[ugi];
				var upgrade = this.data.upgrades[sector][ugi];
				var canAfford = this.canAffordUpgrade(sector, ugi);
				
				h += '<li class="upgrade clearfix flip ug-' + ugi;
				if (canAfford) {
					h += ' afford ';
				} else {
					h += ' cannotAfford ';
				}
				if (upgradeCount > 0) {
					h += ' owned ';
					lastOwnedUpgradeIndex = ugi;
				} else {
					h += ' notOwned ';
				}
				if ((ugi - lastOwnedUpgradeIndex) > SHOW_LAST_UPGRADES) {
					h += ' unknown ';
					unknownCount++;
				}
				h += '" ' // end class
					+ ' data-ugi="' + ugi + '" '
					+ ' data-sector="' + sector + '" '
					+ '>'
					+ '<div class="front">'
					+ '<div class="name">' + upgrade.name + '</div>'
					
					+ '<button type="button" class="buy"><div class="buyText">Buy</div>'
				;
				for (var currName in upgrade.baseCost) {
					var finalCost = this.calcCost(upgrade, upgradeCount, currName);
					h += '<div class="cost val">'
						+ this.getDisplayNumber(finalCost, true)
						+ ' ' + this.shortDisplayValueTypes[currName]
						+ '</div>'
					;
				}
				h += '</button>'
					+ '<div class="count">' 
					+ ((upgradeCount == 0) ? '-' : upgradeCount)
					+ '</div>'
					+ '</div>' // endof front
					+ '<div class="back">'
				;
				if (typeof upgrade.details === 'string') {
					h += '<div class="details">' + upgrade.details + '</div>';
				}
				if (typeof upgrade.perSecond === 'object') {
					h += '<ul class="">';
					for (var currName in upgrade.perSecond) {
						h += '<li>' 
							+ ((upgrade.perSecond[currName] > 0) ? "+" : "")
							+ this.getDisplayNumber(upgrade.perSecond[currName])
							+ ' ' + this.displayValueTypes[currName]
							+ '/sec'
							+ '</li>'
						;
					}
					h += '</ul>';
				}
				h += '</div>' // endof back
					+ '</li>'
				;
			}
			if (unknownCount > 0) {
				h += '<div class="upgrades-tease">+ ' + unknownCount + ' more upgrades</div>';
			}
			if (typeof this.$upgradeLists[sector] !== 'undefined') {
				this.$upgradeLists[sector].html(h);
				this.addFlipCardEvents(this.$upgradeLists[sector]);
			}
		}
		
		this.updateUpgradeAfford = function () {
			for (var sector in this.owned.upgrades) {
				var sectorUpgrades = this.owned.upgrades[sector];
				for (var ugi in sectorUpgrades) {
					var $upgrade = $('section.' + sector + ' .ug-' + ugi);
					var upgradeCount = sectorUpgrades[ugi];
					if (upgradeCount > 0) {
						$upgrade.addClass("owned").removeClass("notOwned");
					} else {
						$upgrade.addClass("notOwned").removeClass("owned");
					}
					var canAfford = this.canAffordUpgrade(sector, ugi);
					if (canAfford) {
						$upgrade.addClass("afford").removeClass("cannotAfford");
					} else {
						$upgrade.addClass("cannotAfford").removeClass("afford");
					}				
				}
			}	
		}

		
		//=============================================== Clickity Click
		
		this.industryClick = function (evt) {
			g.sounds.play("coin1");
			curr.indMoney.add(curr.indMoneyPerClick.val);
			this.animateClickEarning(curr.indMoneyPerClick.val, evt);
		}

		this.politicsClick = function (evt) {
			g.sounds.play("coin2");
			curr.polMoney.add(curr.polMoneyPerClick.val);
			this.animateClickEarning(curr.polMoneyPerClick.val, evt);
		}

		this.mediaClick = function (evt) {
			g.sounds.play("coin1");
			curr.medMoney.add(curr.medMoneyPerClick.val);
			this.animateClickEarning(curr.medMoneyPerClick.val, evt);
		}

		this.animateClickEarning = function (amount, evt) {
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

		//=============================================== Numbers
		
		this.calculateUpgradeCounts = function () {
			g.zeroUpgradeCounts();
			for (var s in this.sectorArray) {
				var sector = this.sectorArray[s];
				var sectorUpgrades = this.owned.upgrades[sector];
				for (var ugi in sectorUpgrades) {
					g.upgradeCounts[sector] += sectorUpgrades[ugi];
					g.upgradeCounts.total += sectorUpgrades[ugi];
					g.upgradeCounts.uniqueTotal += 1;
					if (sectorUpgrades[ugi] > 0) {
						g.upgradeCounts.uniqueOwned += 1;
					}
				}
			}
			return g.upgradeCounts;
		};

		
		this.isFlowing = function () {
			return (this.flow.from.length > 0 && this.flow.to.length > 0);
		}

		this.calculateFlowRates = function () {
			var flowSpeed;
			g.zeroFlowRates();
			this.flow.baseSpeed = 1.0 + (g.upgradeCounts.total / 20);
			if (this.isFlowing()) {
				flowSpeed = this.flow.baseSpeed + (this.flow.percentSpeed * curr[this.flow.from].val);
				// Make sure the amount flowing from can support it
				if (curr[this.flow.from].val >= flowSpeed) {
					flowRates[this.flow.from] -= flowSpeed;
					flowRates[this.flow.to] += (flowSpeed * this.flow.efficiency);
				}
			}
		}

		this.calculateUpgradeRates = function () {
			var o = this;
			
			g.zeroUpgradeRates();
			
			// Loop through all upgrades
			g.loopOverSectors(function(sector){
				var sectorUpgrades = o.owned.upgrades[sector];
				for (var ug in sectorUpgrades) {
					var upgradeQuantity = sectorUpgrades[ug];
					if (upgradeQuantity > 0) {
						var upgrade = o.data.upgrades[sector][ug];
						if (typeof upgrade.perSecond === 'object') {
							// Loop through all and see if the upgrade has values
							for (var ci in g.mainCurrencyNames) {
								var currName = g.mainCurrencyNames[ci];
								if (typeof upgrade.perSecond[currName] === 'number') {
									g.upgradeRates[currName] += (upgradeQuantity * upgrade.perSecond[currName]);
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
				}
			});
		}
		
		this.buyUpgrade = function(sector, upgradeIndex, doWriteUpgrades) {
			console.log("buyUpgrade " + sector + ", " + upgradeIndex);
			var upgrade = this.data.upgrades[sector][upgradeIndex];
			if (this.canAffordUpgrade(sector, upgradeIndex)) {
				// The amount before the purchase
				var upgradeQuantity = this.owned.upgrades[sector][upgradeIndex];
				// Remove the cost from the totals...
				for (var currName in upgrade.baseCost) {
					curr[currName].subtract(this.calcCost(upgrade, upgradeQuantity, currName));
				}			
				// Add the upgrade to owned things
				this.owned.upgrades[sector][upgradeIndex] += 1;
				
				if (typeof doWriteUpgrades !== 'boolean') doWriteUpgrades = true;
				if (doWriteUpgrades) this.writeUpgrades();
				g.sounds.play("upgrade1");
				return true;
			} else {
				g.sounds.play("dud");
				return false;
			}
		}
		
		this.calcCost = function (upgrade, upgradeQuantity, currencyName) {
			var finalCost = upgrade.baseCost[currencyName];
			finalCost = (finalCost * Math.pow(upgrade.costMultiplier, upgradeQuantity));
			return finalCost;
		}
		
		this.canAffordUpgrade = function (sector, upgradeIndex) {
			var upgrade = this.data.upgrades[sector][upgradeIndex];
			var upgradeQuantity = this.owned.upgrades[sector][upgradeIndex];
			// Loop over all value types and compare to current totals
			if (typeof upgrade.baseCost === 'object' &&
				typeof upgrade.costMultiplier === 'number') 
			{
				for (var ci in g.mainCurrencyNames) {
					var currName = g.mainCurrencyNames[ci];
					if (typeof upgrade.baseCost[currName] === 'number') {
						var finalCost = this.calcCost(upgrade, upgradeQuantity, currName);
						if (curr[currName].val < finalCost) {
							return false;
						}
					}
					
				}
			} else {
				console.error("Upgrade (" + sector + ", " + upgrade + ") is missing baseCost or costMultiplier");
				return false;
			}
			return true;
		}
		

		
		//=============================================== SETUP & LAUNCH
		
		this.addFlipCardEvents = function ($elt) {
			console.log("Adding flipcard events");
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
		}
		
		this.setup = function () {
			var o = this;
			var ajaxGetData = {};
			
			$.ajax({
				type: 		"get"
				,url:		"data/cc_data.json"
				,dataType: 	"json"
				,complete: function(x,t) {
				}
				,success: function(responseObj) {
					try {
						//var responseObj = $.parseJSON(response);
						o.data.upgrades = responseObj.upgrades;
						o.data.groups 	= responseObj.groups;
						console.log("Ajax Success loading data");
					} catch (err) {
						g.notifier.warn("ERROR IN JSON DATA");
						console.log(responseObj);
					}
					// Loop through upgrade data and setup default ownership
					for (sector in o.data.upgrades) {
						o.owned.upgrades[sector] = [];
						for (ug in o.data.upgrades[sector]) {
							o.owned.upgrades[sector][ug] = 0;
						}
					}
				}
				,failure: function(msg) {
					console.log("Fail\n"+ msg);
				}
				,error: function(x, textStatus, errorThrown) {
					console.log("Error\n" + x.responseText + "\nText Status: " + textStatus + "\nError Thrown: " + errorThrown);
				}
			});
		
		
		
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
				o.saveGame(true);
				//g.notifier.notify('Saved');
			});
			$('.load').click(function(e){
				g.sounds.play("save1");
				if (o.loadGame()) {
					g.state.transition("game");
				} else {
					g.state.transition("intro");
				}
			});
			$('.delete').click(function(e){
				g.sounds.play("shock1");
				o.deleteGame(true);
				//g.state.transition("intro");
			});
			$('.toggleSound').click(function(e){
				if (g.sounds.toggle()) {
					g.sounds.play("dud2");
				}
				o.saveGame();
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
					o.flow.from = "";
					o.flow.to = "";
				} else {
					g.sounds.play("transfer1");
					$arrows.removeClass("active");
					$thisArrow.addClass("active");
					o.flow.from = $thisArrow.data("flowfrom");
					o.flow.to = $thisArrow.data("flowto");
				}
			});
			
			o.$upgradeLists = {};
			
			$('.metrics').click(function(e){
				$(this).find('.perClick').toggle(300);
			});
			
			for (var s in o.sectorArray) {
				(function(sector){
					o.$upgradeLists[sector] = $('section.' + sector + ' ul.upgradeList');
					//console.log("Adding click event to List for sector: " + sector);
					//console.log(o.$upgradeLists[sector]);
					
					o.$upgradeLists[sector].on("click", function(e){
						
						var $target = $(e.target);
						var $ugli = $target.closest('li.upgrade');
						//console.log("List Clicked - sector: " + sector);
						//console.log($ugli);

						if ($target.hasClass("buy") || $target.parent().hasClass("buy")) {
							var upgradeIndex = $ugli.data("ugi");
							o.buyUpgrade(sector, upgradeIndex);
						} else {
							//$ugli.find('.details').toggle();
						}
						e.stopPropagation();
					});
				}(o.sectorArray[s]));
			}
			
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
			
			//$('.upgradeList > li').click(function(e){	o.buyUpgrade(1); });


			//=========== Launch!
			var launchTimer = window.setTimeout(function(){
				o.launch(0);
			}, 250);
		}
		
		this.launch = function (iteration) {
			var o = this;
			iteration++;
			if (Object.keys(o.data.upgrades).length > 0) {
				console.log("Launching Game!");
				g.state.transition("preload");
			} else if (iteration < 40) {
				console.log("Launch... Cannot start yet. " + iteration);
				var launchTimer = window.setTimeout(function(){
					o.launch(iteration);
				}, 250);			
			} else {
				g.notifier.error("Cannot launch game.");
			}
		}

		//==== Save/Load
		
		this.autoSaveGame = function () {
			if (this.isAutoSaveOn) {
				if (g.getSecondsSinceLastSaveTime() > SAVE_EVERY_SECONDS) {
					this.saveGame();
				}
			}
		};

		this.saveGame = function(showNotice) {
			localStorage.setItem("owned", JSON.stringify(this.owned));
			localStorage.setItem("currencies", JSON.stringify({
				indMoney: curr.indMoney.val,
				polMoney: curr.polMoney.val,
				medMoney: curr.medMoney.val,
				votes: curr.votes.val,
				minds: curr.minds.val,
			}));
			localStorage.setItem("isSoundOn", JSON.stringify(g.sounds.isSoundOn));
			localStorage.setItem("version", g.version);

			this.lastSaveDateTime = new Date();
			g.displayLastSaveTime();
			console.log("Game saved.");
		}
		
		this.deleteGame = function() {
			localStorage.removeItem("owned");
			localStorage.removeItem("currencies");
			localStorage.removeItem("version");
			g.notifier.warn("Saved game deleted!");
			// TODO: Make a way to delete/restart without reloading the page
			window.location.reload(true); 
		}	
		
		this.loadGame = function () {
			var o = this;
			var isLoaded = false;
			// Load game data (two objects)
			console.log("checking localStorage", localStorage.getItem("owned"), localStorage.getItem("currencies"));
			var loadedOwned = localStorage.getItem("owned");
			if (loadedOwned !== null) {
				o.owned = JSON.parse(loadedOwned);
				isLoaded = true;
			}
			var loadedCurrencies = localStorage.getItem("currencies");
			if (loadedCurrencies !== null) {
				loadedCurrencies = JSON.parse(loadedCurrencies);
				g.loopOverCurrencies(function(currName){
					curr[currName].setVal(loadedCurrencies[currName]);
				});
				isLoaded = true;
			}
			var loadedSound = localStorage.getItem("isSoundOn");
			if (loadedSound !== null) {
				g.sounds.toggle( (JSON.parse(loadedSound) ? true : false) );
			}
			var version = localStorage.getItem("version");
			if (version !== g.version) {
				g.notifier.warn("Loaded a saved game that was saved with a different game version than the current (" + g.version + "). This could result in game errors. If so you may want to start a new game.");
			}


			return isLoaded;
		}
		
		
		//========================================= Helpers
		
		this.getCommaSeparatedNumber = function (val) {
			// From: http://stackoverflow.com/a/12947816/1766230
			while (/(\d+)(\d{3})/.test(val.toString())){
				val = val.toString().replace(/(\d+)(\d{3})/, '$1'+','+'$2');
			}
			return val;
		}	

		//========================================= Construction
		if (!window.localStorage) {
			alert("This browser does not support localStorage, so this app will not run properly. Please try another browser, such as the most current version of Google Chrome.");
		}
		if (!window.jQuery) { alert("ERROR - jQuery is not loaded!"); }
	}

	// Expose to the window object for debugging
	window.g = g;
});
