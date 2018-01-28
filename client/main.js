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



	splash = new PIXI.Sprite(PIXI.loader.resources.splash.texture);
	splash.anchor.x = splash.anchor.y = 0.5;
	splash.x = size.x/2;
	splash.y = size.y/2;
	sounds.portal.play();
	game.stage.addChild(splash);
	setTimeout(function(){
		game.stage.removeChild(splash);
		splash.destroy();
		startGame();
	},2000);

	// setup screen filter
	screen_filter = new CustomFilter(PIXI.loader.resources.screen_shader.data);
	screen_filter.padding = 0;
	screen_filter.uniforms.uTime = 0;

	road_filter = new CustomFilter(PIXI.loader.resources.road_shader.data);
	road_filter.padding = 0;
	road_filter.uniforms["uTime"] = 0;

	game.stage.filters = [screen_filter];

	scaledMouse = {
		x: 0,
		y: 0
	};

	// start the main loop
	window.onresize = onResize;
	_resize();
	game.ticker.update();
}


function startGame(){
	game.started=true;

	sounds['bgm'].play();
	sounds['bgm'].fadeIn(1,1000);


	textContainer = new PIXI.Container();

	interactiveObjects=[];

    // hand
	hand=new PIXI.Container();

	hand1=makeHand(PIXI.loader.resources.hand.texture, 0.25, 0.1, 20, 80);
	hand2=makeHand(PIXI.loader.resources.hand2.texture, 0.25, 0.1, 20, 80);
	hand3=makeHand(PIXI.loader.resources.hand3.texture, 0.25, 0.1, 20, 80);
	hand_knob=makeHand(PIXI.loader.resources.hand_knob.texture, 0.1, 0.4, 40, 40);
	hand_tug=makeHand(PIXI.loader.resources.hand_tug.texture, 0.2, 0.2, 40, 40);
	hand_thumb=makeHand(PIXI.loader.resources.hand_thumb.texture, 0.3, 0.1, 0, 68);

	hand1.visible = true;
	currentHand = hand1;

	wheel = new PIXI.Sprite(PIXI.loader.resources.wheel.texture);
	wheel.anchor.x = 0.6;
	wheel.anchor.y = 0.5;
	wheel.x = -size.x*0.24;
	wheel.y = size.y*0.22;

	wiper1 = new PIXI.Sprite(PIXI.loader.resources.wiper.texture);
	wiper1.anchor.x = 0.05;
	wiper1.anchor.y = 1;
	wiper1.x = -size.x*0.24;
	wiper1.y = size.y*0.22;
	wiper2 = new PIXI.Sprite(PIXI.loader.resources.wiper.texture);
	wiper2.anchor.x = 0.05;
	wiper2.anchor.y = 1;
	wiper2.x = -size.x*0.24;
	wiper2.y = size.y*0.22;
	wiping = false;

	arm = new PIXI.Container();
	arm.actualSprite = new PIXI.Sprite(PIXI.loader.resources.arm.texture);
	arm.addChild(arm.actualSprite);
	arm.actualSprite.anchor.x = 0.6;
	arm.actualSprite.anchor.y = 0.99;
	arm.actualSprite2 = new PIXI.Sprite(PIXI.loader.resources.arm2.texture);
	arm.addChild(arm.actualSprite2);
	arm.actualSprite2.anchor.x = 0.6;
	arm.actualSprite2.anchor.y = 0.93;

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
	game.stage.addChild(hand);
	game.stage.addChild(arm);

	toggle = new PIXI.Container();
	toggle.downSprite = new PIXI.Sprite(PIXI.loader.resources.switch_down.texture);
	toggle.upSprite = new PIXI.Sprite(PIXI.loader.resources.switch_up.texture);
	toggle.downSprite.visible = false;
	toggle.addChild(toggle.downSprite);
	toggle.addChild(toggle.upSprite);
	toggle.position.x = 2;
	toggle.position.y = 27;
	toggle.onInteraction = function(){
		this.downSprite.visible = !this.downSprite.visible;
		this.upSprite.visible = !this.upSprite.visible;
		sounds['click'+Math.ceil(Math.random()*3)].play();
		hand.y += 10;
		wiping = !wiping;
	}.bind(toggle);
	toggle.restoreState = restoreButtonState;
	toggle.interactingHand = hand2;
	toggle.hoverHand = hand3;
	interactiveObjects.push(toggle);

	toggle = new PIXI.Container();
	toggle.downSprite = new PIXI.Sprite(PIXI.loader.resources.switch_down.texture);
	toggle.upSprite = new PIXI.Sprite(PIXI.loader.resources.switch_up.texture);
	toggle.upSprite.visible = false;
	toggle.addChild(toggle.downSprite);
	toggle.addChild(toggle.upSprite);
	toggle.position.x = 14;
	toggle.position.y = 26;
	toggle.onInteraction = function(){
		this.downSprite.visible = !this.downSprite.visible;
		this.upSprite.visible = !this.upSprite.visible;
		sounds['click'+Math.ceil(Math.random()*3)].play();
		hand.y += 10;
	}.bind(toggle);
	toggle.restoreState = restoreButtonState;
	toggle.interactingHand = hand2;
	toggle.hoverHand = hand3;
	interactiveObjects.push(toggle);

	toggle = new PIXI.Container();
	toggle.downSprite = new PIXI.Sprite(PIXI.loader.resources.switch_down.texture);
	toggle.upSprite = new PIXI.Sprite(PIXI.loader.resources.switch_up.texture);
	toggle.downSprite.visible = false;
	toggle.addChild(toggle.downSprite);
	toggle.addChild(toggle.upSprite);
	toggle.position.x = 26;
	toggle.position.y = 25;
	toggle.onInteraction = function(){
		this.downSprite.visible = !this.downSprite.visible;
		this.upSprite.visible = !this.upSprite.visible;
		sounds['click'+Math.ceil(Math.random()*3)].play();
		hand.y += 10;
	}.bind(toggle);
	toggle.restoreState = restoreButtonState;
	toggle.interactingHand = hand2;
	toggle.hoverHand = hand3;
	interactiveObjects.push(toggle);

	toggle = new PIXI.Container();
	toggle.downSprite = new PIXI.Sprite(PIXI.loader.resources.light1_on.texture);
	toggle.upSprite = new PIXI.Sprite(PIXI.loader.resources.light1_off.texture);
	toggle.upSprite.visible = false;
	toggle.addChild(toggle.downSprite);
	toggle.addChild(toggle.upSprite);
	toggle.position.x = 0;
	toggle.position.y = 53;
	toggle.onInteraction = function(){
		this.downSprite.visible = !this.downSprite.visible;
		this.upSprite.visible = !this.upSprite.visible;
		sounds['click'+Math.ceil(Math.random()*3)].play();
		hand.y += 10;
	}.bind(toggle);
	toggle.restoreState = restoreButtonState;
	toggle.interactingHand = hand2;
	toggle.hoverHand = hand3;
	interactiveObjects.push(toggle);

	toggle = new PIXI.Container();
	toggle.downSprite = new PIXI.Sprite(PIXI.loader.resources.light2_on.texture);
	toggle.upSprite = new PIXI.Sprite(PIXI.loader.resources.light2_off.texture);
	toggle.downSprite.visible = false;
	toggle.addChild(toggle.downSprite);
	toggle.addChild(toggle.upSprite);
	toggle.position.x = 20;
	toggle.position.y = 54;
	toggle.onInteraction = function(){
		this.downSprite.visible = !this.downSprite.visible;
		this.upSprite.visible = !this.upSprite.visible;
		sounds['click'+Math.ceil(Math.random()*3)].play();
		hand.y += 10;
	}.bind(toggle);
	toggle.restoreState = restoreButtonState;
	toggle.interactingHand = hand2;
	toggle.hoverHand = hand3;
	interactiveObjects.push(toggle);

	toggle = new PIXI.Container();
	toggle.downSprite = new PIXI.Sprite(PIXI.loader.resources.light3_on.texture);
	toggle.upSprite = new PIXI.Sprite(PIXI.loader.resources.light3_off.texture);
	toggle.downSprite.visible = false;
	toggle.addChild(toggle.downSprite);
	toggle.addChild(toggle.upSprite);
	toggle.position.x = 40;
	toggle.position.y = 55;
	toggle.onInteraction = function(){
		this.downSprite.visible = !this.downSprite.visible;
		this.upSprite.visible = !this.upSprite.visible;
		sounds['click'+Math.ceil(Math.random()*3)].play();
		hand.y += 10;
	}.bind(toggle);
	toggle.restoreState = restoreButtonState;
	toggle.interactingHand = hand2;
	toggle.hoverHand = hand3;
	interactiveObjects.push(toggle);

	pull_cord = new PIXI.Sprite(PIXI.loader.resources.pull_cord.texture);
	pull_cord.position.x = size.x*0.2;
	pull_cord.position.y = -size.y*1.1;
	pull_cord.anchor.x = 0.5;
	pull_cord.anchor.y = 0;
	pull_cord.onInteraction = function(){
		if(this.sound){
			this.sound.stop();
		}
		this.sound = sounds.pull_cord.play();
		this.y = -size.y*0.7;
		hand.y -= -size.y*0.6;
	}.bind(pull_cord);
	pull_cord.restoreState = restoreButtonState;
	pull_cord.interactingHand = hand_tug;
	pull_cord.hoverHand = hand_tug;
	interactiveObjects.push(pull_cord);

	dial = new PIXI.Container();
	dial.sprite = new PIXI.Sprite(PIXI.loader.resources.dial.texture);
	dial.sprite.anchor.x = dial.sprite.anchor.y = 0.5;
	dial.addChild(dial.sprite);
	dial.position.x = 0;
	dial.position.y = 90;
	dial.onInteraction = function(){
		hand_knob.rotation += 0.2;
		if(g.activeSound && g.activeSound.done && g.nextConversation){
			this.rotation += Math.PI/2;
			startNextConversation();
			sounds.dial.play();
		}else{
			if(this.sound){
				this.sound.stop();
			}
			this.sound = sounds.not_yet.play();
		}
	}.bind(dial);
	dial.restoreState = restoreButtonState;
	dial.interactingHand = hand_knob;
	dial.hoverHand = hand_knob;
	interactiveObjects.push(dial);


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
	callsignDisplay.position.x = 38;
	callsignDisplay.position.y = 26;
	
	callsigns = [
		'MASTER HAM',
		'BIG QUEEN',
		'BIG CHICKEN',
		'LITTLE TURKEY',
		'GENTLE JIM'
	];
	for(var i = 0; i < callsigns.length; ++i){
		var c = callsigns[i];
		callsigns[i] = new PIXI.Sprite(PIXI.loader.resources['callsign' + c].texture);
		callsigns[i].title = c;
		callsigns[i].visible = false;
		callsignDisplay.addChild(callsigns[i]);
	}

	// callsignDisplay.width = 12;
	// callsignDisplay.height = 12;

	for(var i = 0; i < callsigns.length; i++){
		callsignDisplay.addChild(callsigns[i]);	
	}

    currentCallsign = null;

    scene.addChild(wiper1);
    scene.addChild(wiper2);
	scene.addChild(dash);
	for(var i = 0; i < interactiveObjects.length; i++){
		dash.addChild(interactiveObjects[i]);	
	}
	dash.addChild(callsignDisplay);
	dash.addChild(wheel);

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

	g = new Game();
	g.goto("START");

	frequency = new PIXI.extras.BitmapText("", g.font);
	dash.addChild(frequency);
	frequency.x = 20;
	frequency.y = 85;
	frequency.tint = 0x88BBFF;
	frequency.rotation = 0.1;

	callsignText = new PIXI.extras.BitmapText("???", g.font);
	dash.addChild(callsignText);
	callsignText.x = -5;
	callsignText.y = 113;
	callsignText.tint = 0x88BBFF;
	callsignText.rotation = 0.1;
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

	if(game.started){

		pull_cord.y = lerp(pull_cord.y, -size.y*1.1, 0.1);
		wheel.rotation = Math.sin(game.ticker.lastTime/1000.0 + game.ticker.lastTime/1200.0)*0.01 + Math.sin(game.ticker.lastTime/900.0 + game.ticker.lastTime/1400.0)*0.01;

		var input = getInput();

		g.update();

		setHand(hand1);
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
							setHand(hand_thumb);
						}else{
							setHand(hand_thumb);
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
					if(mouse.isDown(mouse.LEFT)){
						if(obj.hasOwnProperty("onInteraction")){
							if(!obj.interacting){
								obj.onInteraction();
								obj.interacting = true;
							}
							setHand(obj.interactingHand);
						}
				 	}else{
						setHand(obj.hoverHand);
						if(mouse.isJustUp(mouse.LEFT)){
							if(obj.hasOwnProperty("restoreState")){
								obj.restoreState();
								obj.interacting = false;
							}
						}
					}
				}else{
					if(obj.hasOwnProperty("restoreState") 
						&& obj.hasOwnProperty("interacting") 
						&& obj.interacting){
							obj.restoreState();
							obj.interacting = false;
					}
				}
			}
		}
		
		updateCallsignDisplay();

		frequency.text = g.frequency.toString();

		speech.scale.x = lerp(speech.scale.x, 1.0, 0.1);
		speech.scale.y = lerp(speech.scale.y, 1.0, 0.1);

		hand_knob.rotation = lerp(hand_knob.rotation, 0, 0.1);

	}

	// update input managers
	gamepads.update();
	keys.update();
	mouse.update();

	// keep mouse within screen
	mouse.pos.x = clamp(0, mouse.pos.x, (size.x-2) * scaleMultiplier);
	mouse.pos.y = clamp(0, mouse.pos.y, (size.y-2) * scaleMultiplier);

	scaledMouse.x = mouse.pos.x / scaleMultiplier;
	scaledMouse.y = mouse.pos.y / scaleMultiplier;

	if(game.started){
		// update hand
		hand.x = Math.round(lerp(hand.x, scaledMouse.x, 0.3));
		hand.y = Math.round(lerp(hand.y, Math.max(scaledMouse.y, size.y*0.25 + Math.abs(hand.x-size.x/2)*0.33), 0.3));

		var p = currentHand.armPoint.toGlobal(PIXI.zero);
		arm.x = p.x;
		arm.y = p.y;
		var basex = size.x*0.66 - scaledMouse.x * 0.25;
		// arm.actualSprite.visible = (hand.y + (hand.x-basex)/3) < size.y*0.5;
		arm.actualSprite2.visible = !arm.actualSprite.visible;

		arm.rotation = clamp(1.5, Math.atan2(size.y + 50 - arm.y, basex - arm.x) + Math.PI/2, 4.5);

		road_filter.uniforms.uTime = game.ticker.lastTime/1000;
		road_filter.uniforms.angle = 0.5 - (scaledMouse.x/size.x-0.5)/16.0;
		road_filter.uniforms.horizon = 0.25 + (scaledMouse.y/size.y-0.5)/32.0 + (Math.sin(game.ticker.lastTime/30.0+0.2)*0.003);
		dash.y = size.y/2 -Math.floor((scaledMouse.y/size.y-0.5)*4.0 + Math.random()*Math.sin(game.ticker.lastTime/30.0));
		dash.x = size.x/2 -Math.floor((scaledMouse.x/size.x-0.5)*4.0);

		wiper1.x = dash.x - 60;
		wiper1.y = dash.y - 24;
		wiper2.x = dash.x + 200;
		wiper2.y = dash.y - 20;
		if(wiping){
			wiper1.rotation = lerp(wiper1.rotation, Math.sin(game.ticker.lastTime/200)*1.1-1.1, 0.1);
			wiper2.rotation = lerp(wiper2.rotation, Math.sin(game.ticker.lastTime/200+0.8)*1.1-1.1, 0.1);
		}else{
			wiper1.rotation = lerp(wiper1.rotation, 0, 0.1);
			wiper2.rotation = lerp(wiper2.rotation, 0, 0.1);
		}

	}
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
		callsignText.text = callsign.toLowerCase();
		if(callsign == "YOU") {
			speech.texture = PIXI.loader.resources.speech2.texture;
			callsign = g.yourCallsign || callsign;
		}else{
			speech.texture = PIXI.loader.resources.speech.texture;
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
			callsignText.text = '???';
		}
	}
}

function makeHand(resource, x, y, x2, y2){
	newHand=new PIXI.Sprite(resource);
	newHand.anchor.x=x;
	newHand.anchor.y=y;
	newHand.visible = false;
	newHand.armPoint = new PIXI.Container();
	newHand.armPoint.visible = false;
	newHand.addChild(newHand.armPoint);
	newHand.armPoint.x += x2;
	newHand.armPoint.y += y2;
	hand.addChild(newHand);
	return newHand;
}

function setHand(hand){
	currentHand.visible = false;
	currentHand = hand;
	currentHand.visible = true;
}

function onButtonInteraction(){
}

function restoreButtonState(){
}

function startNextConversation(){
	if(g.nextConversation){
		g.goto(g.nextConversation)
		.then(function(){
			speech.scale.x = speech.scale.y = 0;
			speech.visible = true;
			g.nextConversation = null;
		});
	}
}