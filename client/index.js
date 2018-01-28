var startTime = 0;
var lastTime = 0;
var curTime = 0;
var game;
var resizeTimeout=null;

var size={x:640,y:360};

var sounds=[];

var scaleMode = 0;

toggleFullscreen = function(){
	if (game.view.toggleFullscreen) {
		if(getFullscreenElement()) {
			exitFullscreen();
		}else{
			requestFullscreen(display);
		}
		game.view.toggleFullscreen = false;
	}
};

ready(function(){
	try{
		game = new PIXI.Application({
			width: size.x,
			height: size.y,
			antialias:false,
			transparent:false,
			resolution:1,
			roundPixels:true,
			clearBeforeRender:true,
			autoResize:false,
			backgroundColor: 0x000000
		});
	}catch(e){
		document.body.innerHTML='<p>Unsupported Browser. Sorry :(</p>';
		throw 'Unsupported Browser: '+e;
	}

	// try to auto-focus and make sure the game can be focused with a click if run from an iframe
	window.focus();
	document.body.on('mousedown',function(){
		window.focus();
	});
	document.body.on('mouseup',toggleFullscreen);
	document.body.on('keyup',toggleFullscreen);

	document.exitFullscreen =
		document.exitFullscreen ||
		document.oExitFullScreen ||
		document.msExitFullScreen ||
		document.mozCancelFullScreen ||
		document.webkitExitFullscreen;

	// setup game
	startTime=Date.now();

	display = document.getElementById('display');

	game.view.id = 'canvas';

	PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST;

	// add the canvas to the html document
	display.appendChild(game.view);

	CustomFilter.prototype = Object.create(PIXI.Filter.prototype);
	CustomFilter.prototype.constructor = CustomFilter;

	fontStyle={font: "8px font", align: "left"};

	// menu SFX
	sounds["sfx_select"] = new Howl({
		urls:["assets/audio/sfx_2.wav"],
		autoplay:false,
		loop:false,
		volume:1
	});
	sounds.click1 = new Howl({
		urls:["assets/audio/click1.ogg"],
		autoplay:false,
		loop:false,
		volume:1
	});
	sounds.click2 = new Howl({
		urls:["assets/audio/click2.ogg"],
		autoplay:false,
		loop:false,
		volume:1
	});
	sounds.click3 = new Howl({
		urls:["assets/audio/click3.ogg"],
		autoplay:false,
		loop:false,
		volume:1
	});
	sounds.dial = new Howl({
		urls:["assets/audio/dial.ogg"],
		autoplay:false,
		loop:false,
		volume:1
	});
	sounds["temp"] = new Howl({
		urls:["assets/audio/temp.wav"],
		autoplay:false,
		loop:false,
		volume:1
	});
	sounds["pull_cord"] = new Howl({
		urls:["assets/audio/horn.ogg"],
		autoplay:false,
		loop:false,
		volume:1
	});
	sounds["not_yet"] = new Howl({
		urls:["assets/audio/NOT YET.ogg", "assets/audio/NOT YET.mp3"],
		autoplay:false,
		loop:false,
		volume:1
	});

	PIXI.loader
		.add("spritesheet","asset source files/assets/textures.json")
		.add("script","assets/script.txt")
		.add('vert','assets/passthrough.vert')
		.add("road_shader","assets/road_shader.frag")
		.add('screen_shader','assets/screen_shader.frag')
		.add("font","assets/font/font.fnt")
		.add("dash", "assets/texture/dash.png")
		.add("speech", "assets/texture/speech.png")
		.add("speech2", "assets/texture/speech2.png")
		.add("option1", "assets/texture/option1.png")
		.add("option2", "assets/texture/option2.png")
		.add("switch_down", "assets/texture/switch-down.png")
		.add("switch_up", "assets/texture/switch-up.png")
		.add("light1_off", "assets/texture/light1-off.png")
		.add("light1_on", "assets/texture/light1-on.png")
		.add("light2_off", "assets/texture/light2-off.png")
		.add("light2_on", "assets/texture/light2-on.png")
		.add("light3_off", "assets/texture/light3-off.png")
		.add("light3_on", "assets/texture/light3-on.png")
		.add("dial", "assets/texture/dial.png")
		.add("pull_cord", "assets/texture/pull_cord.png")
		.add("arm", "assets/texture/arm.png")
		.add("arm2", "assets/texture/arm2.png")
		.add("hand2", "assets/texture/hand.png")
		.add("hand3", "assets/texture/hand.png")
		.add("hand_knob", "assets/texture/hand_knob.png")
		.add("hand_tug", "assets/texture/hand_tug.png")
		.add("wheel", "assets/texture/wheel.png")
		.add("callsignMASTER HAM", "assets/texture/MASTER HAM.png")
		.add("callsignBIG QUEEN", "assets/texture/BIG QUEEN.png")
		.add("callsignBIG CHICKEN", "assets/texture/BIG CHICKEN.png")
		.add("callsignLITTLE TURKEY", "assets/texture/LITTLE TURKEY.png")
		.add("hand", "assets/texture/hand.png");

	PIXI.loader
		.on("progress", loadProgressHandler)
		.load(init);
});


function CustomFilter(fragmentSource){
	PIXI.Filter.call(this,
		// vertex shader
		null,
		// fragment shader
		fragmentSource
	);
}


function loadProgressHandler(loader, resource){
	// called during loading
	console.log("loading: " + resource.url);
	console.log("progress: " + loader.progress+"%");
}


function onResize() {
	_resize();
}



function _resize(){
	var w=display.offsetWidth;
	var h=display.offsetHeight;
	var ratio=size.x/size.y;

	
	if(w/h < ratio){
		h = Math.round(w/ratio);
	}else{
		w = Math.round(h*ratio);
	}
	
	var aw,ah;

	if(scaleMode==0){
		// largest multiple
		scaleMultiplier = 1;
		aw=size.x;
		ah=size.y;

		do{
			aw+=size.x;
			ah+=size.y;
			scaleMultiplier += 1;
		}while(aw <= w || ah <= h);

		scaleMultiplier -= 1;
		aw-=size.x;
		ah-=size.y;
	}else if(scaleMode==1){
		// stretch to fit
		aw=w;
		ah=h;
		scaleMultiplier = w/size.x;
	}else{
		// 1:1
		scaleMultiplier = 1;
		aw=size.x;
		ah=size.y;
	}

	game.view.style.width=aw+'px';
	game.view.style.height=ah+'px';

	screen_filter.uniforms.uScreenSize = road_filter.uniforms.uScreenSize = [size.x,size.y];
	screen_filter.uniforms.uBufferSize = road_filter.uniforms.uBufferSize = [nextPowerOfTwo(size.x),nextPowerOfTwo(size.y)];
}

PIXI.zero=new PIXI.Point(0,0);