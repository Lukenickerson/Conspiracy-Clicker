(function(){
	var component = {
		fileName: 		"Viewport",
		classNames:		["Viewport"],
		requirements:	[],
		description:	"",
		credits:		""
	};
/* ------- Viewport resizer --- by Luke Nickerson --- 1/2013 ---------- */
/*
function Viewport () 
{
	this.winWidth 	= 100;
	this.winHeight 	= 100;
	this.width		= 480;
	this.height		= 320;
	this.widthMin 	= 480;
	this.heightMin 	= 320;
	this.widthMax 	= 960; //1440; // 960
	this.heightMax 	= 640; //960; // 640
	this.ratio		= 1.5;

	this.setViewportValues = function () 
	{
		var $viewport = $('#viewport');
		// Get viewport dimensions from CSS
		this.width 		= $viewport.width();
		this.height 	= $viewport.height();	
		this.widthMin 	= parseInt($viewport.css("min-width"));	// 480
		this.heightMin 	= parseInt($viewport.css("min-height")); 	// 320
		this.widthMax 	= parseInt($viewport.css("max-width")); 	//1440; // 960
		this.heightMax 	= parseInt($viewport.css("max-height")); 	//960; // 640
		this.ratio = this.widthMax / this.heightMax;
	}
	
	this.setWindowValues = function () 
	{
		var $win = $(window);
		this.winWidth = $win.width();
		this.winHeight = $win.height();
		//console.log("Window width: " + $win.width() + " x height: " + $win.height());
	}
	
	this.resizeToWindow = function ()
	{
		var vp = this;
		this.setWindowValues();
		
		var w = this.winWidth, h = this.winHeight;

		this.setWidth(w, h);
		this.setHeight(w, h);
		$('#viewport').css({ "height" : this.height, "width" : this.width });
		//	.find('.display').text("Viewport: " + this.width + " x " + this.height + ", Window: " + this.winWidth + " x " + this.winHeight);
		
		$('.resizeWithViewport').each(function(i, e){
			var $elt = $(e);
			$elt.css({ 
				"width" : ($elt.data("baseWidth") / vp.widthMin) * vp.width
				,"height" : ($elt.data("baseHeight") / vp.heightMin) * vp.height
				,"top" : ($elt.data("baseTop") / vp.heightMin) * vp.height
				,"left" : ($elt.data("baseLeft") / vp.widthMin) * vp.width
			});
		});	
	}
	
	this.setWidth = function (w, h)
	{
		// Max is determined by other dimension or the set max
		var maxW = h * this.ratio;
		if (w > maxW) w = maxW;
		// Check vs. constraints
		if (w < this.widthMin) 		w = this.widthMin;
		else if (w > this.widthMax) w = this.widthMax;
		// Round
		this.width = Math.floor(w);
	}

	this.setHeight = function (w, h)
	{
		// Max is determined by other dimension or the set max
		var maxH = w / this.ratio;
		if (h > maxH) h = maxH;
		// Check vs. constraints
		if (h < this.heightMin) 		h = this.heightMin;
		else if (h > this.heightMax) 	h = this.heightMax;
		// Round
		this.height = Math.floor(h);
	}
	
	this.setResizeElementsOriginalDimension = function ()
	{
		$('.resizeWithViewport').each(function(i, e){
			var $elt = $(e);
			$elt.data("baseWidth", $elt.width());
			$elt.data("baseHeight", $elt.height());
			var eltPos = $elt.position();
			$elt.data("baseLeft", eltPos.left);
			$elt.data("baseTop", eltPos.top);
		});
	}
	
	this._construct = function () 
	{
		this.setViewportValues();
		this.setResizeElementsOriginalDimension();
		this.setWindowValues();
		this.resizeToWindow();
	}
	this._construct();
	
}

$(document).ready(function(){
	window.viewport = new Viewport();
	$(window).resize(function(){
		window.viewport.resizeToWindow();
	});
});
*/



	// Install into RocketBoots if it exists
	if (typeof RocketBoots === "object") {
		RocketBoots.installComponent(component);
	} else { // Otherwise put the classes on the global window object
		for (var i = 0; i < component.classNames.length; i++) {
			window[component.classNames[i]] = component[component.classNames[i]];
		}
	}
})();
