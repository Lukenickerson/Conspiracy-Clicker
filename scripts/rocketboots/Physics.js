(function(){
	var component = {
		fileName: 		"Physics",
		classNames:		["Physics"],
		requirements:	[], // Entity?
		description:	"Physics class",
		credits:		"By Luke Nickerson, 2014, some funcitons from stardust.js"
	};

	var Physics = component.Physics = function(){
	
	}
	Physics.prototype.apply = function(world){
		var p = this;
		// Loop over all movable entities
		world.loopOverEntities("physics",function(entity1Index, ent1){	
			// Move according to velocity
			ent1.pos.add( ent1.vel );
			
			// Collision detection
			world.loopOverEntities("physical",function(entity2Index, ent2){
				var r = ent1.pos.getDistance(ent2.pos);
				if (r == 0) {
					// Don't do anything (Black hole or ent2 is the same as ent1)
				} else {
					var edgeToEdgeDist = r - ent1.radius - ent2.radius;
					if (edgeToEdgeDist <= 0) {
						//console.log("hit");
						
						var pushBack = edgeToEdgeDist / 1; //(edgeToEdgeDist / 1);
						if (ent1.mass <= ent2.mass) {
							ent1.pos.add( ent1.pos.getUnitVector(ent2.pos).multiply(pushBack) );
						} else {
							ent2.pos.add( ent2.pos.getUnitVector(ent1.pos).multiply(pushBack) );           
						}
						
						p.setNewCollisionVels(ent1, ent2, 0.7);
						
					}
				}
			});
			if (ent1.world.isBounded) {
				ent1.world.keepCoordsInBounds(ent1.pos);
			}
			
		});
	}

	Physics.prototype.setNewCollisionVels = function(o1, o2, elasticity){
		// http://www.gamasutra.com/view/feature/131424/pool_hall_lessons_fast_accurate_.php?page=3
		if (o1.mass <= 0 || o2.mass <= 0) {
			return false;
		}
		//console.log(o1.name, o2.name);
		//console.log("original", o1.vel.x, o1.vel.y, o2.vel.x, o2.vel.y);
		//console.log("momentum before", (o1.mass * o1.vel.getMagnitude()) + (o2.mass * o2.vel.getMagnitude()));
		var p = (o1.mass * o1.vel.getMagnitude()) + (o2.mass * o2.vel.getMagnitude());
		var n = o1.pos.getUnitVector(o2.pos);
		//console.log("n = ", n);
		var a1 = o1.vel.getDot(n);
		var a2 = o2.vel.getDot(n);
		var optimizedP = (2 * (a1 - a2)) / (o1.mass + o2.mass);
		o1.vel.add( n.getMultiply(-1 * optimizedP * o2.mass) );
		o1.vel.multiply(elasticity);
		o2.vel.add( n.getMultiply(optimizedP * o1.mass) );
		o1.vel.multiply(elasticity);
		//var pNew = (o1.mass * o1.vel.getMagnitude()) + (o2.mass * o2.vel.getMagnitude());
		//console.log(pNew - p);
		//if (pNew > p) {
			 //console.log(o1.name, o2.name, "pNew > p", pNew, p);
		//}else console.log(o1.name, o2.name, "pNew <= p", pNew, p);
		//console.log("after", newV1.x, newV1.y, newV2.x, newV2.y);
		//console.log("momentum after", (o1.mass * o1.vel.getMagnitude()) + (o2.mass * o2.vel.getMagnitude()));
		return true;
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