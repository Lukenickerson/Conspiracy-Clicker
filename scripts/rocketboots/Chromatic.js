(function(){
	var component = {
		fileName: 		"Chromatic",
		classNames:		["Chromatic"],
		requirements:	[],
		description:	"",
		credits:		""
	};


	component.Chromatic = function ChromaticClass () {

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