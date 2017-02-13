(function(){
	var component = {
		fileName: 		"Notifier",
		classNames:		["Notifier"],
		requirements:	[],
		description:	"Displays notifications",
		credits:		"By Luke Nickerson, 2017"
	};

	//TODO: Add ability to have notifications time-out / fade-out on their own
	//TODO: Add XSS protection for template-filling
	
	
	function Notifier (options) {
		if (typeof options === 'undefined') {
			options = {};
		}
		this.selector = (options.selector) || '.notifier';
		this.$elt = $(this.selector);
		this.notifications = [];
		this.addDuplicates = false;
		this.template = (					// Best if this is styled (see: notifier.css)
			'<li class="notification">'
				+ '<span class="message">'
					+ '{{message}}'
				+ '</span>'
				+ '<button type="button" class="dismiss-notification">X</button>'
			+ '</li>'
		);
		this.appendFunctionName = "prepend"; // could be append, etc.
		if (this.$elt.length > 0) {
			this.setup();
		}
	};
	component.Notifier = Notifier;

	// Setup on the DOM
	Notifier.prototype.setup = function () {
		var o = this;
		o.$elt.on("click", ".dismiss-notification", function(e){
			var $clicked = $(e.target);
			var $note = $clicked.closest(".notification");
			o.dismiss($note.attr("id"));
		});
	};

	// Gets
	Notifier.prototype.getLastNotification = function(){
		return this.notifications[(this.notifications.length - 1)];
	};

	// Write Messages
	Notifier.prototype.notify = function (message, type) {
		var note = new Notification({ 
			message: message, 
			type: type
		});
		if (this.notifications.length > 0) {
			if (!this.addDuplicates && note.message === this.getLastNotification().message) {
				return false;
			}
		}
		this.notifications.push(note);
		this.writeNotification(note);
		return true;
	};
	Notifier.prototype.log = function () {
		var args = [].slice.call(arguments);
		console.log.apply(arguments);
		this.notify(args.join(' '), 'log');
	};
	Notifier.prototype.warn = function () {
		var args = [].slice.call(arguments);
		console.warn.apply(arguments);
		this.notify(args.join(' '), 'warn');
	};
	Notifier.prototype.error = function () {
		var args = [].slice.call(arguments);
		console.error.apply(arguments);
		this.notify(args.join(' '), 'error');
	};

	Notifier.prototype.writeNotification = function(note){
		var $note;
		var html = this.template;
		html = html.replace('{{message}}', note.message);
		//html = html.replace('{{id}}', note.id);
		$note = $(html).attr("id", note.id);
		if (note.type) {
			$note.addClass("message-" + note.type);
		}
		console.log($note);
		this.$elt[this.appendFunctionName]($note);
		return $note;
	};

	// Dismiss/Remove Messages
	Notifier.prototype.dismiss = function (noteId) {
		var note;
		var i = this.notifications.length;
		var $note = $('#' + noteId).remove();
		while (i--) {
			if (this.notifications[i].id == noteId) {
				note = this.notifications.splice(i);
				return note;
			}
		}
		if (note || $note.length) {
			return true;
		}
		return false;
	};




	function Notification (options) {
		this.message = options.message || "";
		this.type = options.type || null;
		this.date = new Date();
		this.id = "notification-" + RocketBoots.getUniqueId();
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