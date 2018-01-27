// main loop

function init(){
	// initialize input managers
	gamepads.init();
	keys.init({
		capture: [keys.LEFT,keys.RIGHT,keys.UP,keys.DOWN,keys.SPACE,keys.ENTER,keys.BACKSPACE,keys.ESCAPE,keys.W,keys.A,keys.S,keys.D,keys.P,keys.M]
	});
	mouse.init("canvas", false);

	// setup main loop
	var main = function(){
	    // update time
	    this.accumulator += game.ticker.elapsedMS;

	    // call render if needed
	    if (this.accumulator > this.timestep) {
	    	update();
	        this.accumulator -= this.timestep;
	    }
	}
	main.accumulator = 0;
	main.timestep = 1000/60; // target ms/frame
	game.ticker.add(main.bind(main));

	// screen background
	(function(){
		g = new PIXI.Graphics();
		g.beginFill(0x333333,1);
		g.drawRect(0,0,size.x,size.y);
		g.endFill();
		t = g.generateTexture();
		bg = new PIXI.Sprite(t);
		g.destroy();
		game.stage.addChild(bg);
	}());

	scene = new PIXI.Container();

	textContainer = new PIXI.Container();

    // hand
	hand=new PIXI.Container();
	
	hand1=makeHand(PIXI.loader.resources.hand.texture);
	hand2=makeHand(PIXI.loader.resources.hand2.texture);
	hand3=makeHand(PIXI.loader.resources.hand3.texture);

	hand1.visible = true;
	currentHand = hand1;

	arm = new PIXI.Container();
	arm.actualSprite = new PIXI.Sprite(PIXI.loader.resources.arm.texture);
	arm.addChild(arm.actualSprite);
	arm.actualSprite.anchor.x = 0.5;
	arm.actualSprite.anchor.y = 1;

	// setup screen filter
	road_filter = new CustomFilter(PIXI.loader.resources.road_shader.data);
	road_filter.padding = 0;
	road_filter.uniforms["uTime"] = 0;

	(function(){
		var graphics = new PIXI.Graphics();
		graphics.beginFill(0,0);
		graphics.drawRect(0,0,1,1);
		graphics.endFill();
		emptyTexture = graphics.generateTexture();
		graphics.destroy();
	}());
	road = new PIXI.Sprite(emptyTexture);
	road.width = size.x;
	road.height = size.y;
	road.filterArea = new PIXI.Rectangle(0,0,size.x,size.y);
	road.filters = [road_filter];

	game.stage.addChild(road);
	game.stage.addChild(scene);
	game.stage.addChild(arm);
	game.stage.addChild(hand);

	button = new PIXI.Container();
	button.actualSprite = new PIXI.Sprite(PIXI.loader.resources.button.texture);
	button.addChild(button.actualSprite);
	button.position.x = 200 - size.x/2;
	button.position.y = 200 - size.y/2;
	button.onInteraction = startNextConversation;
	button.restoreState = restoreButtonState;
	button.interactingHand = hand2;
	button.hoverHand = hand3;

	dash = new PIXI.Sprite(PIXI.loader.resources.dash.texture);
	dash.anchor.x = dash.anchor.y = 0.5;
	speech = new PIXI.Sprite(PIXI.loader.resources.speech.texture);
	speech.anchor.x = 0.66;
	speech.anchor.y = 1.0;
	speech.x = size.x*0.66;
	speech.y = size.y*0.65;
	link1 = new PIXI.Sprite(PIXI.loader.resources.option1.texture);
	link2 = new PIXI.Sprite(PIXI.loader.resources.option2.texture);

	link1.anchor.x = link1.anchor.y = link2.anchor.x = link2.anchor.y = 0.5;

	callsignDisplay = new PIXI.Container();
	callsignDisplay.position.x = 332 - size.x/2;
	callsignDisplay.position.y = 232 - size.y/2;
	
	callsignHam = new PIXI.Sprite(PIXI.loader.resources.callsignHam.texture);
	callsignHam.title = "MASTER_HAM";
	callsignHam.visible = false;
	callsignDisplay.addChild(callsignHam);

	callsigns = [
		callsignHam
	];

	// callsignDisplay.width = 12;
	// callsignDisplay.height = 12;

	for(var i = 0; i < callsigns.length; i++){
		callsignDisplay.addChild(callsigns[i]);	
	}

    currentCallsign = null;

	interactiveObjects = [
		button
	];

	scene.addChild(dash);
	for(var i = 0; i < interactiveObjects.length; i++){
		dash.addChild(interactiveObjects[i]);	
	}
	dash.addChild(callsignDisplay);

	scene.addChild(speech);
	link1.x = 543;
	link1.y = 203;
	link2.x = 543;
	link2.y = 253;

	speech.addChild(textContainer);
	scene.addChild(link1);
	scene.addChild(link2);

	textContainer.x = -speech.width*0.6;
	textContainer.y = -speech.height*0.85;
	speech.scale.x = speech.scale.y = 0;

	scaledMouse = {
		x: 0,
		y: 0
	};

	// setup screen filter
	screen_filter = new CustomFilter(PIXI.loader.resources.screen_shader.data);
	screen_filter.padding = 0;
	screen_filter.uniforms.uTime = 0;

	game.stage.filters = [screen_filter];

	g = new Game();
	g.goto("START");

	// start the main loop
	window.onresize = onResize;
	_resize();
	game.ticker.update();
}


function startGame(){
	game.started=true;
}

function update(){

	// update lerps
	for(var i = 0; i < lerps.length; ++i){
		lerps[i].spr.position.y = lerp(lerps[i].spr.position.y, lerps[i].t.y, lerps[i].by);
		lerps[i].spr.position.x = lerp(lerps[i].spr.position.x, lerps[i].t.x, lerps[i].by);
	}


	// shortcuts for mute/palette swap
	if(keys.isJustDown(keys.M)){
		toggleMute();
		sounds["sfx_select"].play();
	}
	if(keys.isJustDown(keys.P)){
		swapPalette();
		sounds["sfx_select"].play();
	}


	var input = getInput();

	g.update();

	var links = [];
	var activePassage = g.currentPassage;
	var anyHover = false;
	if(activePassage){
		var activeLinks = activePassage.links;
		for(var i = 0; i < activeLinks.length; ++i){
			var link = activeLinks[i];
			if(link.parent.visible){
				var p = link.parent.toGlobal(PIXI.zero);

				if(intersect(scaledMouse, {
					x:p.x-link.parent.width/2,
					y:p.y-link.parent.height/2,
					width:link.parent.width,
					height:link.parent.height
				})){
					link.tint = 0xBBBBBB;
					anyHover = true;
					if(mouse.isDown(mouse.LEFT)){
						setHand(obj.interactingHand);
					}else{
						setHand(obj.hoverHand);
					}

					if(mouse.isJustDown(mouse.LEFT)){
						links.push(link.onclick.bind(link));
					}
				} else {
					link.tint = 0x000000;
				}
			}
		}
		for(var i = 0; i < links.length; ++i){
			links[i]();
		}
	}

	if(!anyHover){
		// Check interactive objects
		for(var i = 0; i < interactiveObjects.length; i++){
			obj = interactiveObjects[i];
			if(intersect(scaledMouse, obj.getBounds(true))){
				if(mouse.isJustDown(mouse.LEFT)){
					if(obj.hasOwnProperty("onInteraction")){
						if(!obj.hasOwnProperty("interacting") || !obj.interacting){
							obj.onInteraction();
							obj.interacting = true;
							setHand(obj.interactingHand);
						}
					}
			 	}else if(mouse.isJustUp(mouse.LEFT)){
					if(obj.hasOwnProperty("restoreState")){
						obj.restoreState();
						obj.interacting = false;
						setHand(hand1);
					}
				}else if(!mouse.isDown(mouse.LEFT)){
					setHand(obj.hoverHand);
				}
			}else{
				if(obj.hasOwnProperty("restoreState") 
					&& obj.hasOwnProperty("interacting") 
					&& obj.interacting){
						obj.restoreState();
						obj.interacting = false;
				}
				setHand(hand1);
			}
		}
	}
	
	updateCallsignDisplay();

	speech.scale.x = lerp(speech.scale.x, 1.0, 0.1);
	speech.scale.y = lerp(speech.scale.y, 1.0, 0.1);

	// update input managers
	gamepads.update();
	keys.update();
	mouse.update();

	// keep mouse within screen
	mouse.pos.x = clamp(0, mouse.pos.x, (size.x-2) * scaleMultiplier);
	mouse.pos.y = clamp(0, mouse.pos.y, (size.y-2) * scaleMultiplier);

	scaledMouse.x = mouse.pos.x / scaleMultiplier;
	scaledMouse.y = mouse.pos.y / scaleMultiplier;

	// update hand
	hand.x = lerp(hand.x, Math.round(scaledMouse.x), 0.3);
	hand.y = lerp(hand.y, Math.round(scaledMouse.y), 0.3);

	arm.x = hand.x;
	arm.y = hand.y ;

	arm.rotation = Math.atan2(size.y + 50 - arm.y, size.x/2 - arm.x) + Math.PI/2;

	road_filter.uniforms.uTime = game.ticker.lastTime/1000;
	road_filter.uniforms.angle = 0.5 + (scaledMouse.x/size.x-0.5)/16.0;
	road_filter.uniforms.horizon = 0.25 + (scaledMouse.y/size.y-0.5)/32.0 + (Math.sin(game.ticker.lastTime/30.0+0.2)*0.003);
	dash.y = size.y/2 -Math.floor((scaledMouse.y/size.y-0.5)*4.0 + Math.random()*Math.sin(game.ticker.lastTime/30.0));
	dash.x = size.x/2 -Math.floor((scaledMouse.x/size.x-0.5)*4.0);
	screen_filter.uniforms.uTime = game.ticker.lastTime/1000.0%1000.0; // provide time in seconds (range 0-1000)
}


lerps=[];
function addLerp(_spr,_by){
	var l={
		t:{
			x:_spr.position.x,
			y:_spr.position.y,
		},
		spr:_spr,
		by:_by||0.1
	};

	_spr.lerp=l;
	lerps.push(l);
}

function toggleMute(){
	if(Howler._muted){
		Howler.unmute();
	}else{
		Howler.mute();
	}
}


function getInput(){
	var res = {
		up: false,
		down: false,
		left: false,
		right: false,
		confirm: false,
		cancel: false
	};

	res.up |= keys.isJustDown(keys.UP);
	res.up |= keys.isJustDown(keys.W);
	res.up |= gamepads.isJustDown(gamepads.DPAD_UP);
	res.up |= gamepads.axisJustPast(gamepads.LSTICK_V, 0.5);

	res.down |= keys.isJustDown(keys.DOWN);
	res.down |= keys.isJustDown(keys.S);
	res.down |= gamepads.isJustDown(gamepads.DPAD_DOWN);
	res.down |= gamepads.axisJustPast(gamepads.LSTICK_V, -0.5);

	res.left |= keys.isJustDown(keys.LEFT);
	res.left |= keys.isJustDown(keys.A);
	res.left |= gamepads.isJustDown(gamepads.DPAD_LEFT);
	res.left |= gamepads.axisJustPast(gamepads.LSTICK_H, -0.5);

	res.right |= keys.isJustDown(keys.RIGHT);
	res.right |= keys.isJustDown(keys.D);
	res.right |= gamepads.isJustDown(gamepads.DPAD_RIGHT);
	res.right |= gamepads.axisJustPast(gamepads.LSTICK_H, 0.5);

	return res;
}

function updateCallsignDisplay(){
	if(g.hasOwnProperty("currentCallsign")){
		var callsign = g.currentCallsign;
		if(currentCallsign){
			currentCallsign.visible = false;
		}
		for(i = 0; i < callsigns.length; i++){
			if(callsigns[i].title == callsign){
				currentCallsign = callsigns[i];
				currentCallsign.visible = true;
			}
		}
	}else{
		if(currentCallsign){
			currentCallsign.visible = false;
		}
	}
}

function makeHand(resource){
	newHand=new PIXI.Sprite(resource);
	newHand.anchor.x=0.5;
	newHand.anchor.y=0.5;
	newHand.visible = false;
	hand.addChild(newHand);
	return newHand;
}

function setHand(hand){
	currentHand.visible = false;
	currentHand = hand;
	currentHand.visible = true;
}

function onButtonInteraction(){
	button.actualSprite.width = 300;
}

function restoreButtonState(){
	button.actualSprite.width = 79;
}

function startNextConversation(){
	g.goto(g.nextConversation)
	.then(function(){
		speech.scale.x = speech.scale.y = 0;
		speech.visible = true;
	});
}