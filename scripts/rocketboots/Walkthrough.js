(function(){
	var component = {
		fileName: 		"Walkthrough",
		classNames:		["Walkthrough"],
		requirements:	[],
		description:	"Walkthrough class, useful for tips",
		credits:		"By Luke Nickerson, 2017"
	};

	function Walkthrough (options) {
		if (typeof options !== 'object') {
			options = {};
		}
		options = _.extend({
			progress: 				1,
			tipSelector: 			'.tip',
			targetClass: 			'tip-target',
			nextButtonClass: 		'tip-next',
			nextButtonTemplate: 	'<button type="button">Ok, I got it.</button>',
			$tips: 					null
		}, options);

		_.extend(this, options);
	};
	component.Walkthrough = Walkthrough;

	Walkthrough.prototype.setup = function () {
		var w = this;
		w.$tips = $(w.tipSelector).hide();
		w.$tips.each(function(i, tip){
			var $tip = $(tip);
			var $nextButton = $(w.nextButtonTemplate);
			$nextButton.addClass(w.nextButtonClass).click(function(e){
				w.next();
			});
			$tip.find('.' + w.nextButtonClass).remove();
			$tip.append($nextButton);
			w.adjust($tip);
		});
		w.reset();
		return this;
	};

	Walkthrough.prototype.getCurrentTip = function () {
		return this.$tips.filter(this.tipSelector + this.progress);
	};

	Walkthrough.prototype.getTarget = function ($tip) {
		if (typeof $tip !== 'object') { $tip = this.getCurrentTip(); }
		return $($tip.data("near")).first();
	};

	Walkthrough.prototype.adjust = function ($tip) {
		if (typeof $tip !== 'object') { $tip = this.getCurrentTip(); }
		var $near = this.getTarget();
		var nearOffset;
		if ($near.length > 0) {
			nearOffset = $near.offset();
			//console.log($tip.data("near"), $near);
			//console.log(nearOffset.top + $near.outerHeight(), (nearOffset.left + ($near.outerWidth()/2)));
			$tip.css({
				top: (nearOffset.top + $near.outerHeight()),
				left: (nearOffset.left + ($near.outerWidth()/4))
			});
		} else {
			$near = $('body');
			$tip.css({
				top: (($near.outerHeight()/2) - ($tip.outerHeight()/2)),
				left: (($near.outerWidth()/2) - ($tip.outerWidth()/2))
			});			
		}
		return this;	
	};

	Walkthrough.prototype.reset = function () {
		this.progress = 1;
		return this;
	};

	Walkthrough.prototype.show = function () {
		var $currentTip = this.getCurrentTip();
		var $target = this.getTarget();
		this.adjust($currentTip);
		$target.addClass(this.targetClass);

		if ($currentTip.length > 0) {
			$currentTip.removeClass("tip-closed").show();
		}
		return this;
	};

	Walkthrough.prototype.hide = function () {
		$('.' + this.targetClass).removeClass(this.targetClass);
		this.$tips.hide();
		return this;
	};

	Walkthrough.prototype.next = function () {
		var w = this;
		w.progress++;
		$('.' + this.targetClass).removeClass(this.targetClass);
		w.$tips.not(this.tipSelector + this.progress).addClass("tip-closed");
		w.show();
		/*
		w.$tips.not(this.tipSelector + this.progress).fadeOut(function(){
			w.show();
		}).addClass("tip-closed");
		*/
		return this;
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