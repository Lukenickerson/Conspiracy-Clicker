
/* === Generic Helper Stuff (can be reused) === */

var GameHelperClass = function () {
	this.getRandomNumber = function (min, max) {
		return Math.floor(Math.random() * (max - min + 1) + min);
	}
}
window.gameHelper = new GameHelperClass();


/* === Conspiracy Clicker Game === */

var CCGameClass = function () 
{
	this.isLooping 		= false;
	this.loopTimer 		= 0;
	this.loopIteration 	= 0;
	this.lastTime 		= 0;
	// Constants
	this.loopDelay		= 10;
	// 1000 = 1 second
	// 100 = 1/10th of a second
	// 10 = 1/100th of a second (better than 60 fps)
	this.secondsPerLoop	= (this.loopDelay / 1000);
	// Update certain things once every X iterations
	// 10 ==> once per second
	this.loopModulus	= 10; 
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
	
	// Constants, Lookups
	this.sectorArray = ["industry", "politics", "media"];
	this.valueTypes = ["indMoney", "polMoney", "medMoney", "votes", "minds"];
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
	this.total = {
		indMoney	: 0
		,polMoney	: 0
		,medMoney	: 0
		,votes		: 0
		,minds		: 0
	};
	this.perSecond = {
		//indMoney	: 0
		//,polMoney	: 0
		//,medMoney	: 0
		//,votes		: 0
		//,minds		: 0
	};
	this.perClick = {
		//indMoney	: 1
		//,polMoney	: 1
		//,medMoney	: 1
		//,votes		: 0
		//,minds		: 0	
	};
	this.flow = {
		"from" 			: ""
		,"to"			: ""
		,"baseSpeed"	: 1
		,"percentSpeed"	: 0.005
		,"efficiency"	: 0.75
	};

	

	//=============================================== MAIN LOOP
	
	this.loop = function() {
		var o = this;
		console.log("loop");
	
		o.total.indMoney += (o.perSecond.indMoney * o.secondsPerLoop);
		o.total.polMoney += ((o.perSecond.polMoney) * o.secondsPerLoop);
		o.total.votes += ((o.perSecond.votes) * o.secondsPerLoop);
		o.total.medMoney += ((o.perSecond.medMoney) * o.secondsPerLoop);
		o.total.minds += ((o.perSecond.minds) * o.secondsPerLoop);
		
		if (o.total.indMoney < 0) o.total.indMoney = 0;
		if (o.total.polMoney < 0) o.total.polMoney = 0;
		if (o.total.medMoney < 0) o.total.medMoney = 0;
		if (o.total.votes < 0) o.total.votes = 0;
		if (o.total.minds < 0) o.total.minds = 0;
	
		o.displayNumber(o.total.indMoney, o.$indMoneyVal);
		o.displayNumber(o.total.polMoney, o.$polMoneyVal);
		o.displayNumber(o.total.medMoney, o.$medMoneyVal);
		o.displayNumber(o.total.votes, o.$votesVal);
		o.displayNumber(o.total.minds, o.$mindsVal);
		
		// Update these only every second or so... 
		if ((o.loopIteration % o.loopModulus) == 0) {
			o.calculateCoreValues();
			o.displayPerSecondNumbers();
			// Per click...
			o.displayNumber(o.perClick.indMoney, o.$indMoneyPerClickVal);
			o.displayNumber(o.perClick.polMoney, o.$polMoneyPerClickVal);
			o.displayNumber(o.perClick.medMoney, o.$medMoneyPerClickVal);
			o.displayNumber(o.perClick.votes, o.$votesPerClickVal);
			o.displayNumber(o.perClick.minds, o.$mindsPerClickVal);
		} else if (((o.loopIteration + 1) % o.loopModulus) == 0) {
			o.displayProgress();
			o.updateUpgradeAfford();
		} else if (((o.loopIteration + 2) % o.loopModulus) == 0) {
			if (o.flow.from != "" && o.flow.to != "") {
				var flowSpeed = o.flow.baseSpeed + (o.flow.percentSpeed * o.total[o.flow.from]);
				if (o.total[o.flow.from] >= flowSpeed) {
					o.total[o.flow.from] -= flowSpeed;
					o.total[o.flow.to] += (flowSpeed * o.flow.efficiency);
				}
			}
		}
		
	
		if (o.isLooping) {
			o.loopIteration++;
			if (o.loopIteration < 15000000) {
				o.loopTimer = window.setTimeout(function(){
					o.loop();
				}, o.loopDelay); 
				
			}
		}
	}

	this.startLoop = function() {
		this.loopIteration = 0;
		this.isLooping = true;
		this.loop();
	}
	
	this.stopLoop = function() {
		this.loopIteration = 0;
		this.isLooping = false;
		clearTimeout(this.loopTimer);
	}

	
	//=============================================== OUTPUT DISPLAY

	this.displayProgress = function () 
	{
		
		if (this.total.votes > this.total.minds) {
			var highVal = this.total.votes;
			var lowVal = this.total.minds;
		} else {
			var highVal = this.total.minds;
			var lowVal = this.total.votes;		
		}
		var totalControlled = highVal + (lowVal/2);
		if (totalControlled > this.totalPopulation) {
			totalControlled = this.totalPopulation;
		}
		var progressPercent = (totalControlled / this.totalPopulation) * 100;
		this.$progressVal.html(progressPercent + "%");
		this.$progressBar.html('<div style="width: ' + progressPercent + '%"></div>');
	
	}
	
	this.displayPerSecondNumbers = function () {
		// Per second...
		this.displayNumber(this.perSecond.indMoney, this.$indMoneyPerSecondVal);
		this.displayNumber(this.perSecond.polMoney, this.$polMoneyPerSecondVal);
		this.displayNumber(this.perSecond.medMoney, this.$medMoneyPerSecondVal);
		this.displayNumber(this.perSecond.votes, this.$votesPerSecondVal);
		this.displayNumber(this.perSecond.minds, this.$mindsPerSecondVal);	
	}
	
	this.displayPerClickNumbers = function () {
	
	}
	
	this.displayNumber = function (n, $elt) {
		//console.log($elt);
		$elt.html(this.getDisplayNumber(n));
	}
	
	this.getDisplayNumber = function(n) {
		if (n >= 5) n = parseInt(n);
		else n = Math.round( n * 10 ) / 10;
		return n.toLocaleString('en');
	}
	
	this.writeUpgrades = function () {
		for (var sector in this.owned.upgrades) {
			this.writeUpgradesForSector(sector);
		}
	}
	
	this.writeUpgradesForSector = function (sector) 
	{
		var h = "";
		var sectorUpgrades = this.owned.upgrades[sector];
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
			} else {
				h += ' notOwned ';
			}			
			h += '" '
				+ ' data-ugi="' + ugi + '" '
				+ ' data-sector="' + sector + '" '
				+ '>'
				+ '<div class="front">'
				+ '<div class="name">' + upgrade.name + '</div>'
				
				+ '<button type="button" class="buy"><div class="buyText">Buy</div>'
			;
			for (var valueType in upgrade.baseCost) {
				var finalCost = this.calcCost(upgrade, upgradeCount, valueType);
				h += '<div class="cost val">'
					+ this.getDisplayNumber(finalCost)
					+ ' ' + this.shortDisplayValueTypes[valueType]
					+ '</div>'
				;
			}
			h += '</button>'
				+ '<div class="count">' + upgradeCount + '</div>'
				+ '</div>' // endof front
				+ '<div class="back">'
			;
			if (typeof upgrade.details === 'string') {
				h += '<div class="details">' + upgrade.details + '</div>';
			}
			if (typeof upgrade.perSecond === 'object') {
				h += '<ul class="">';
				for (var valueType in upgrade.perSecond) {
					h += '<li>' 
						+ ((upgrade.perSecond[valueType] > 0) ? "+" : "")
						+ this.getDisplayNumber(upgrade.perSecond[valueType])
						+ ' ' + this.displayValueTypes[valueType]
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

	
	//=============================================== Numbers
	
	this.industryClick = function () {
		this.playSound("coin1");
		this.total.indMoney += this.perClick.indMoney;
	}

	this.politicsClick = function () {
		this.playSound("coin2");
		this.total.polMoney += this.perClick.polMoney;
		//this.total.votes += this.perClick.votes;
	}

	this.mediaClick = function () {
		this.playSound("coin1");
		this.total.medMoney += this.perClick.medMoney;
		//this.total.minds += this.perClick.votes;
	}
	
	
	this.setDefaults = function () 
	{
		this.perSecond = {
			indMoney	: 0
			,polMoney	: 0
			,medMoney	: 0
			,votes		: 0
			,minds		: 0
		};
		// Count the number of upgrades
		var totalUpgradeCount = 0;
		var upgradeCounts = { "industry" : 0, "politics" : 0, "media" : 0 };
		for (var s in this.sectorArray) {
			var sector = this.sectorArray[s];
			var sectorUpgrades = this.owned.upgrades[sector];
			for (var ugi in sectorUpgrades) {
				upgradeCounts[sector] += sectorUpgrades[ugi];
				totalUpgradeCount += sectorUpgrades[ugi];
			}
		}
		this.perClick = {
			indMoney	: (1.0 + (upgradeCounts.industry / 5))
			,polMoney	: (1.0 + (upgradeCounts.politics / 5))
			,medMoney	: (1.0 + (upgradeCounts.media / 5))
			,votes		: (0.0)
			,minds		: (0.0)
		};
		this.flow.baseSpeed = 1.0 + (totalUpgradeCount / 20);
		return true;
	}
	
	
	this.calculateCoreValues = function () 
	{
		this.setDefaults();

		
		for (var sector in this.owned.upgrades) {
			var sectorUpgrades = this.owned.upgrades[sector];
			for (var ug in sectorUpgrades) {
				var upgradeQuantity = sectorUpgrades[ug];
				if (upgradeQuantity > 0) {
					var upgrade = this.data.upgrades[sector][ug];
					if (typeof upgrade.perSecond === 'object') {
						// Loop through all types and see if the upgrade has values
						for (var vti in this.valueTypes) {
							var valueType = this.valueTypes[vti];
							if (typeof upgrade.perSecond[valueType] === 'number') {
								this.perSecond[valueType] += (upgradeQuantity * upgrade.perSecond[valueType]);
							}						
						}
					}
					if (typeof upgrade.perClick === 'object') {
						// Loop through all types and see if the upgrade has values
						for (var vti in this.valueTypes) {
							var valueType = this.valueTypes[vti];
							if (typeof upgrade.perClick[valueType] === 'number') {
								this.perSecond[valueType] += (upgradeQuantity * upgrade.perClick[valueType]);
							}							
						}					
					}
				}
			}
		}
	
	}
	
	this.buyUpgrade = function(sector, upgradeIndex, doWriteUpgrades) 
	{
		console.log("buyUpgrade " + sector + ", " + upgradeIndex);
		var upgrade = this.data.upgrades[sector][upgradeIndex];
		if (this.canAffordUpgrade(sector, upgradeIndex)) {
			// The amount before the purchase
			var upgradeQuantity = this.owned.upgrades[sector][upgradeIndex];
			// Remove the cost from the totals...
			for (var valueType in upgrade.baseCost) {
				this.total[valueType] -= this.calcCost(upgrade, upgradeQuantity, valueType);
			}			
			// Add the upgrade to owned things
			this.owned.upgrades[sector][upgradeIndex] += 1;
			
			if (typeof doWriteUpgrades !== 'boolean') doWriteUpgrades = true;
			if (doWriteUpgrades) this.writeUpgrades();
			this.playSound("upgrade1");
			return true;
		} else {
			this.playSound("dud");
			//this.notify("Cannot afford this upgrade.");
			return false;
		}
	}
	
	this.calcCost = function (upgrade, upgradeQuantity, valueType) {
		var finalCost = upgrade.baseCost[valueType];
		finalCost = (finalCost * Math.pow(upgrade.costMultiplier, upgradeQuantity));
		return finalCost;
	}
	
	this.canAffordUpgrade = function (sector, upgradeIndex)
	{
		var upgrade = this.data.upgrades[sector][upgradeIndex];
		var upgradeQuantity = this.owned.upgrades[sector][upgradeIndex];
		// Loop over all value types and compare to current totals
		if (typeof upgrade.baseCost === 'object' &&
			typeof upgrade.costMultiplier === 'number') 
		{
			for (var vti in this.valueTypes) {
				var valueType = this.valueTypes[vti];
				if (typeof upgrade.baseCost[valueType] === 'number') {
					var finalCost = this.calcCost(upgrade, upgradeQuantity, valueType);
					if (this.total[valueType] < finalCost) {
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
	
	this.notify = function (t) {
		console.warn(t);
		alert(t);
	}
	
	this.addFlipCardEvents = function ($elt) 
	{
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
	
	this.setup = function () 
	{
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
					o.notify("ERROR IN JSON DATA");
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
		
		var $indClicker = $('section.industry .clicker');
		var $polClicker = $('section.politics .clicker');
		var $medClicker = $('section.media .clicker');
		o.$indMoneyVal 			= $('section.industry .money .val');
		o.$indMoneyPerClickVal 	= $('section.industry .profitPerClick .val');
		o.$indMoneyPerSecondVal	= $('section.industry .profitPerSecond .val');
		
		o.$polMoneyVal 			= $('section.politics .money .val');
		o.$polMoneyPerClickVal	= $('section.politics .profitPerClick .val');
		o.$polMoneyPerSecondVal = $('section.politics .profitPerSecond .val');
		o.$votesVal				= $('section.politics .votes .val');
		o.$votesPerClickVal 	= $('section.politics .votesPerClick .val');
		o.$votesPerSecondVal 	= $('section.politics .votesPerSecond .val');
		
		o.$medMoneyVal 				= $('section.media .money .val');
		o.$medMoneyPerClickVal 		= $('section.media .profitPerClick .val');
		o.$medMoneyPerSecondVal 	= $('section.media .profitPerSecond .val');
		o.$mindsVal 				= $('section.media .minds .val');
		o.$mindsPerClickVal 		= $('section.media .mindsPerClick .val');
		o.$mindsPerSecondVal 		= $('section.media .mindsPerSecond .val');		
		
		o.$progressVal = $('section.progress .progressVal');
		o.$progressBar = $('section.progress .progressBar');
		
		$indClicker.click(function(e){	o.industryClick(); });
		$polClicker.click(function(e){	o.politicsClick(); });
		$medClicker.click(function(e){	o.mediaClick(); });
		
		$('.openFoot').click(function(e){
			var $this = $(this);
			if ($this.hasClass("closeFoot")) {
				
				$this.removeClass("closeFoot");
				//$('footer .foot').slideUp(400);
				$('footer').removeClass("open");
				$this.find('span').html("open");
			} else {
				$this.addClass("closeFoot");
				//$('footer .foot').slideDown(400);
				$('footer').addClass("open");
				$this.find('span').html("close");
			}
		});
		
		$('.save').click(function(e){
			o.playSound("save1");
			o.saveGame(true);
		});
		$('.load').click(function(e){
			o.playSound("save1");
			o.loadGame();
		});
		$('.delete').click(function(e){
			o.playSound("shock1");
			o.deleteGame(true);
			if (confirm("Reload page to start a new game?")) {
				window.location.reload(true); 
			}
		});
		$('.toggleSound').click(function(e){
			var x = o.toggleSound();
			o.notify("Sound turned " + ((x) ? "ON" : "OFF"));
		});
		
		/* Intro */
		$('.openWalkthru').click(function(e){
			$(this).fadeOut(200);
			$('section.intro').fadeOut(1000, function(){
				$('section.walkthru').fadeIn(1000, function(){
					$('.threeCols').fadeIn(1000);
				});
			});
		});
		$('.openGame').click(function(e){
			$(this).fadeOut(200);
			$('section.walkthru').fadeOut(1000,function(){
				o.saveGame();
				o.loadGame(true);
			});
		});
		
		
		
		
		var $arrows = $('.focus .arrow');
		$arrows.click(function(e){
			var $thisArrow = $(this);
			if ($thisArrow.hasClass("active")) {
				$arrows.removeClass("active");
				o.flow.from = "";
				o.flow.to = "";
			} else {
				o.playSound("transfer1");
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
		var $3cols = $('.threeCols');
		$win.scroll(function() {
			var height = $win.scrollTop();
			console.log(height);
			if (height > 550) {
				$3cols.addClass("fixed");
			} else {
				$3cols.removeClass("fixed");
			}
		});
		
		
		$('.stopLoop').click(function(e){ 	o.stopLoop(); });
		$('.startLoop').click(function(e){ 	o.startLoop(); });
		
		//$('.upgradeList > li').click(function(e){	o.buyUpgrade(1); });


		//=========== Launch!
		var launchTimer = window.setTimeout(function(){
			o.launch(0);
		}, 250);
	}
	
	this.launch = function (iteration) 
	{
		var o = this;
		iteration++;
		if (Object.keys(o.data.upgrades).length > 0) {
			console.log("Launching Game!");
			o.loadGame(true);
		} else if (iteration < 40) {
			console.log("Launch... Cannot start yet. " + iteration);
			var launchTimer = window.setTimeout(function(){
				o.launch(iteration);
			}, 250);			
		} else {
			o.notify("Cannot launch game.");
		}
	}
	
	this.saveGame = function(showNotice) 
	{
		localStorage.setItem("owned", JSON.stringify(this.owned));
		localStorage.setItem("total", JSON.stringify(this.total));
		localStorage.setItem("isSoundOn", JSON.stringify(this.isSoundOn));
		
		if (typeof showNotice === 'boolean') { 
			if (showNotice) this.notify("Game has been saved to this browser. Your game will be automatically loaded when you return.");
		}
	}
	
	this.deleteGame = function() 
	{
		localStorage.removeItem("owned");
		localStorage.removeItem("total");
		this.notify("Saved game deleted!");
	}	
	
	this.loadGame = function (isStartLoop) 
	{
		var o = this;
		var isLoaded = false;
		// Load game data (two objects)
		var loadedOwned = localStorage.getItem("owned");
		if (loadedOwned !== null) {
			o.owned = JSON.parse(loadedOwned);
			isLoaded = true;
		}
		var loadedTotal = localStorage.getItem("total");
		if (loadedTotal !== null) {
			o.total = JSON.parse(loadedTotal);
			isLoaded = true;
		}
		var loadedSound = localStorage.getItem("isSoundOn");
		if (loadedSound !== null) {
			o.isSoundOn = JSON.parse(loadedSound);
		}		

		$('body > header').fadeIn(5000);
		if (!isLoaded) {
			$('.intro').fadeIn(1000);
		} else {
			o.calculateCoreValues();
			o.writeUpgrades();
			//o.addFlipCardEvents();
			$('.metrics').slideDown(1000);
			$('footer').slideDown(3000);
			$('.progress').show(2000);
			$('.threeCols').fadeIn(2000, function(){
				if (isStartLoop) {
					o.startLoop();
				}
			});
		}
	}

	
	//========================================= SOUND

	this.isSoundOn = true;
	
	this.toggleSound = function (forceSound) {
		if (typeof forceSound === 'boolean') 	this.isSoundOn = forceSound;
		else									this.isSoundOn = (this.isSoundOn) ? false : true;
		return this.isSoundOn;	
	}

	this.sounds = {
		"coin1" 		: new Audio("sounds/coin1.mp3")
		,"coin2" 		: new Audio("sounds/coin2.mp3")
		,"dud1" 		: new Audio("sounds/dud1.mp3")
		,"dud2" 		: new Audio("sounds/dud2.mp3")
		,"save1" 		: new Audio("sounds/save1.mp3")
		,"transfer1" 	: new Audio("sounds/transfer1.mp3")
		,"upgrade1" 	: new Audio("sounds/upgrade1.mp3")
		,"shock1" 	: new Audio("sounds/shock1.mp3")
	}
	/*
	this.sounds["jibber1"].volume = 0.6;
	this.sounds["jibber2"].volume = 0.6;
	this.sounds["jibber3"].volume = 0.6;
	this.sounds["jibber4"].volume = 0.6;
	this.sounds["glassian"].volume = 0.4;
	*/	
	
	this.playSound = function (soundName, isLooped)
	{
		if (this.isSoundOn) {	
			if (soundName == "coin" || soundName == "dud") {
				soundName += this.roll1d(2);
			}	
			if (typeof this.sounds[soundName] === 'undefined') {
				console.log("Sound does not exist: " + soundName);
				return false;
			} else {
				if (typeof isLooped === 'boolean') {
					this.sounds[soundName].loop = isLooped;
				}
				this.sounds[soundName].play();
				return true;
			}
		} else {
			return false;
		}
	}
	
	this.roll1d = function (sides) {
		return (Math.floor(Math.random()*sides) + 1);
	}	

	//========================================= Construction
	if (!window.localStorage) {
		alert("This browser does not support localStorage, so this app will not run properly. Please try another browser, such as the most current version of Google Chrome.");
	}
	if (!window.jQuery) { alert("ERROR - jQuery is not loaded!"); }
}

