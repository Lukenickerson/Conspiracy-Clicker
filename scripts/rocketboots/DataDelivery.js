(function(){
	var component = {
		fileName: 		"DataDelivery",
		classNames:		["DataDelivery"],
		requirements:	[],
		description:	"DataDelivery Class, requires jquery ($)",
		credits:		"By Luke Nickerson, 2014-2015"
	};

	// Requirements
	if (!window.jQuery) { 
		console.error("DataDelivery requires jQuery. jQuery is not loaded!"); 
	}
	
	// Create object
	var dd = component.DataDelivery = function (dataVarName) {
		this.dataVarName = dataVarName;
	}

	dd.prototype.deliver = function (jsonUrl, callback) {
		var v = this.dataVarName;
		jQuery.ajax({
			type: 		"get"
			,url:		jsonUrl
			,dataType: 	"json"
			,complete: function(x,t) {
			}
			,success: function(responseObj) {
				try {
					if (v.length > 0) {
						window[v] = responseObj;
					}
					//var responseObj = $.parseJSON(response);
					console.log("Ajax Success loading data");
				} catch (err) {
					alert("ERROR IN JSON DATA");
					console.error("ERROR IN JSON DATA");
					console.log(responseObj);
				}
				if (typeof callback === 'function') callback(responseObj);
			}
			,failure: function(msg) {
				console.error("Fail\n"+ msg);
			}
			,error: function(x, textStatus, errorThrown) {
				console.error("Error\n" + x.responseText + "\nText Status: " + textStatus + "\nError Thrown: " + errorThrown);
			}
		});
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