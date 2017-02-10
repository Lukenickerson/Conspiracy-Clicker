(function(){
	var component = {
		fileName: 		"Entity",
		classNames:		["Entity"],
		requirements:	["Coords"],
		description:	"Entity class",
		credits:		"By Luke Nickerson, 2014-2016"
	};
	//=========================================================================
	//==== Entity
	
	function Entity (options){
		if (typeof options === 'string') {
			options = {name: options};
		} else {
			options = options || {};
		}
		options = _.extend({
			name: 			null,
			groups: 		[],
			world: 			null,
			size: 			{ x: 10, y: 10 },
			pos: 			{ x: 0, y: 0 },
			vel: 			{ x: 0, y: 0 },
			mass: 			null,
			image: 			null,
			color: 			"#ff7733",
			stageOffset: 	{ x: 0, y: 0 }, // for minor pixel offsets
			//collisionShape: "circle", // TODO: add functionality
			isHighlighted: 	false,
			isPhysical: 	true,
			isMovable: 		true,
			isVisible: 		true,
			draw: {
				before: 	null,
				custom: 	null,
				highlight: 	null,
				after: 		null				
			},
			entityGroups: 	[],
			entities: 		{}
		}, options);

		_.extend(this, options);

		if (this.name === null) {
			this.name = "Entity-" + Math.round(Math.random() * 999999);
		}
		if (this.mass === null) {
			this.mass		= (this.size.x * this.size.y);
		}
		// Make sure coords are actual Coords objects
		this.stageOffset 	= new RocketBoots.Coords(this.stageOffset.x, this.stageOffset.y); 
		this.pos 			= new RocketBoots.Coords(this.pos.x, this.pos.y);
		this.vel 			= new RocketBoots.Coords(this.vel.x, this.vel.y);
		this.size 			= new RocketBoots.Coords(this.size.x, this.size.y);
		this._halfSize 		= new RocketBoots.Coords(this.size.x/2, this.size.y/2);
		this.radius 		= parseInt(this.size.x/2);
	};
	component.Entity = Entity;


	// Sets
	Entity.prototype.setSize = function(x,y){
		this.size.set( new RocketBoots.Coords(x, y) );
		this._halfSize.set( new RocketBoots.Coords(x/2, y/2) );
	}
	
	// Gets
	Entity.prototype.getType = function(){
		return this.groups[0];
	}
	Entity.prototype.isInGroup = function (group) {
		return (this.groups.indexOf(group) == -1) ? false : true;
	}
	Entity.prototype.getHeadPos = function(){
		return new RocketBoots.Coords(this.pos.x, this.pos.y + this._halfSize.y);
	};
	Entity.prototype.getFootPos = function(){
		return new RocketBoots.Coords(this.pos.x, this.pos.y - this._halfSize.y);
	};
	
	// Put in / take out
	Entity.prototype.putIn = function(ent, groups, isFront){
		if (typeof groups == "string") groups = [groups];
		if (typeof isFront != "boolean") isFront = false;
		var grp = "", groupIndex = -1;
		groups = groups.concat("all");
		//console.log("Putting ", ent.name, " into ", groups);
		// Add entity to groups
		for (var t = 0; t < groups.length; t++){
			grp = groups[t];
			this.addEntityGroup(grp);
			//console.log(ent);
			if (!ent.isInGroup(grp)) {  // Is entity not in this group yet?
				groupIndex = (this.entities[grp].push(ent) - 1);
				if (isFront) {
					ent.groups = [grp].concat(ent.groups);
				} else {
					ent.groups.push(grp);
				}
				//ent.groupIndices[grp] = groupIndex;
			} else {
				console.warn('Entity already in group', grp, ent, this.groups);
			}
		}
		return ent;
	};

	Entity.prototype.putNewIn = function(options, groups, isFront, categorizeNow){
		if (typeof isFront !== "boolean") { isFront = false; }
		if (typeof groups !== "object") { groups = []; }
		options.world = this;
		var ent = new Entity(options);
		//groups = groups.concat("all");
		ent = this.putIn(ent, groups, isFront);
		if (typeof categorizeNow === 'undefined' || categorizeNow) {
			this.categorizeEntitiesByGroup();
		}
		return ent;
	};

	Entity.prototype.categorizeEntitiesByGroup = function(){
		var w = this;
		w.entities.physical = [];
		w.entities.movable = [];
		w.entities.physics = [];
		w.loopOverEntities("all", function(entityIndex, ent){
			if (ent.isPhysical) {
				w.entities.physical.push(ent);
				if (ent.isMovable) w.entities.physics.push(ent);
			}
			if (ent.isMovable) {
				w.entities.movable.push(ent);
			}
		});
	};

	Entity.prototype.getEntitiesByGroup = function(type){
		var typeId = this.entityGroups.indexOf(type);
		if (typeId == -1) {
			return false;
		}
		return this.entities[type];
	};

	Entity.prototype.addEntityGroup = function(type){
		var typeId = this.entityGroups.indexOf(type);
		if (typeId == -1) {
			typeId = (this.entityGroups.push(type) - 1);
			this.entities[type] = [];
		}
		return typeId;
	};
	Entity.prototype.addEntityGroups = function(typeArr){
		var o = this;
		var typeIds = [];
		_.each(typeArr, function(val, i){
			var typeId = o.addEntityGroup(val);
			typeIds.push(typeId);
		});
		return typeIds;
	};

	Entity.prototype.findGroupIndex = function (group) {	// 'group' is an array of entities to look in (haystack), 'this' is the needle
		var i = group.length;
		while (i--) {
			if (group[i] === this) {
				return i;
			}
		}
		return -1;
	};

	Entity.prototype.takeOut = function(ent, remGroups){
		var remGroupName = "", remGroupIndex = -1, group;
		//console.log("Remove groups", remGroups, typeof remGroups);
		if (typeof remGroups == "string") { remGroups = [remGroups]; }
		else if (typeof remGroups == "undefined") { remGroups = ["all"]; }
		// Remove "all" groups?
		if (remGroups.indexOf("all") != -1) {	
			remGroups = ent.groups.join("/").split("/");
		}
		console.log("Take", (ent.name || "entity"), "out of groups", remGroups, ent.groups);

		// Loop over groups to remove
		for (var g = 0; g < remGroups.length; g++){
			remGroupName = remGroups[g];
			if (ent.isInGroup(remGroupName)) {
				
				group = this.entities[remGroupName];

				remGroupIndex = ent.findGroupIndex(group);
				
				// Remove from group array
				//group[remGroupIndex] = null;
				group.splice(remGroupIndex, 1);

				// Remove from entity's properties
				ent.groups.splice( ent.groups.indexOf(remGroupName), 1 );
			}
		}
		return ent;
	};

	Entity.prototype.isIntersecting = function (ent) {
		// ***
	};

	// Aliases
	Entity.prototype.addEntity = Entity.prototype.putIn; 
	Entity.prototype.addNewEntity = Entity.prototype.putNewIn;	
	Entity.prototype.removeEntity = Entity.prototype.takeOut;

/*
// This wasn't working right. TODO: Revisit this...
	component.callback = function initEntityPrototype () {
		// Bring in a pointer to the Coords class from RocketBoots
		console.log(RocketBoots.Coords)
		Entity.prototype.Coords = (typeof RocketBoots.Coords == "function") ? RocketBoots.Coords : Coords;
	}
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
