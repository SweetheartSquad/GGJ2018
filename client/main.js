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
	game.stage.addChild(scene);

    // pointer
	pointer=new PIXI.Container();
	pointer.actualSprite=new PIXI.Sprite(PIXI.Texture.fromFrame("pointer.png"));
	pointer.actualSprite.anchor.x=1/8;
	pointer.actualSprite.anchor.y=1/8;
	pointer.addChild(pointer.actualSprite);
	pointer.position.x=10;
	pointer.position.y=10;

	scene.addChild(pointer);

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

	// update input managers
	gamepads.update();
	keys.update();
	mouse.update();

	// keep mouse within screen
	mouse.pos.x = clamp(0, mouse.pos.x, (size.x-2) * scaleMultiplier);
	mouse.pos.y = clamp(0, mouse.pos.y, (size.y-2) * scaleMultiplier);
	// update pointer
	pointer.x = Math.round(mouse.pos.x/scaleMultiplier);
	pointer.y = Math.round(mouse.pos.y/scaleMultiplier);
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