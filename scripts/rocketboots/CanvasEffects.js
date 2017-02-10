(function(){
	var component = {
		fileName: 		"CanvasEffects",
		classNames:		["CanvasEffects"],
		requirements:	[],
		description:	"",
		credits:		""
	};


	component.CanvasEffects = function CanvasEffectsClass () {

	}





	// Install into RocketBoots if it exists
	if (typeof RocketBoots == "object") {
		RocketBoots.installComponent(component);
	} else { // Otherwise put the classes on the global window object
		for (var i = 0; i < component.classNames.length; i++) {
			window[component.classNames[i]] = component[component.classNames[i]];
		}
	}
})();