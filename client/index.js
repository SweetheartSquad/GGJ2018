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
	sounds["temp"] = new Howl({
		urls:["assets/audio/temp.wav"],
		autoplay:false,
		loop:false,
		volume:1
	});

	PIXI.loader
		.add("spritesheet","asset source files/assets/textures.json")
		.add("script","assets/script.txt")
		.add('vert','assets/passthrough.vert')
		.add("road_shader","assets/road_shader.frag")
		.add("font","assets/font/font.fnt")
		.add("dash", "assets/texture/dash.png")
		.add("button", "assets/texture/button.png")
		.add("arm", "assets/texture/arm.png")
		.add("hand2", "assets/texture/hand2.png")
		.add("hand3", "assets/texture/hand3.png")
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

	road_filter.uniforms["uScreenSize"] = [size.x,size.y];
	road_filter.uniforms["uBufferSize"] = [nextPowerOfTwo(size.x),nextPowerOfTwo(size.y)];
}

PIXI.zero=new PIXI.Point(0,0);