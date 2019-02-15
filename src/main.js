import gamepads from './input-gamepads';
import Mouse from './input-mouse';
import keys from './input-keys';
import { Sprite, Container } from 'pixi.js/lib/core';
import game, { resources } from './Game';
import CustomFilter from './CustomFilter';
import size from './size';
import { clamp, lerp, intersect, nextPowerOfTwo } from './utils';
import { resizer } from '.';
import GameEngine from './game-engine';

let mouse;
let scaledMouse;
let scene;
let screen_filter;
let road_filter;
const interactiveObjects = [];

let g;
export function init() {
	g = new GameEngine();
	// initialize input managers
	gamepads.init();
	keys.init({
		capture: [keys.LEFT, keys.RIGHT, keys.UP, keys.DOWN, keys.SPACE, keys.ENTER, keys.BACKSPACE, keys.ESCAPE, keys.W, keys.A, keys.S, keys.D, keys.P, keys.M]
	});
	mouse = new Mouse(game.app.view, true);

	// setScene(new MenuScene());

	scene = new Container();



	const splash = new Sprite(resources.splash.texture);
	splash.anchor.x = splash.anchor.y = 0.5;
	splash.x = size.x / 2;
	splash.y = size.y / 2;
	resources.portal.data.play();
	game.app.stage.addChild(splash);
	setTimeout(function() {
		game.app.stage.removeChild(splash);
		splash.destroy();
		startGame();
	}, 2000);

	// setup screen filter
	screen_filter = new CustomFilter(resources.screen_shader.data);
	screen_filter.padding = 0;
	screen_filter.uniforms.uTime = 0;

	road_filter = new CustomFilter(resources.road_shader.data);
	road_filter.padding = 0;
	road_filter.uniforms.uTime = 0;
	screen_filter.uniforms.uScreenSize = road_filter.uniforms.uScreenSize = [size.x, size.y];
	screen_filter.uniforms.uBufferSize = road_filter.uniforms.uBufferSize = [nextPowerOfTwo(size.x), nextPowerOfTwo(size.y)];

	game.app.stage.filters = [screen_filter];

	scaledMouse = {
		x: 0,
		y: 0
	};

	// start main loop
	game.app.ticker.add(update);
	game.app.ticker.update();
}

let hand, hand1, hand2, hand3, hand_knob, hand_tug, hand_thumb, currentHand;
let wheel;
let wiper1, wiper2, wiping;
let arm;
let pull_cord, dial;
let dash;
let speech, link1, link2, callsignDisplay, currentCallsign;
let frequency, callsignText;

const callsigns = [
	'MASTER HAM',
	'BIG QUEEN',
	'BIG CHICKEN',
	'LITTLE TURKEY',
	'GENTLE JIM',
	'CAPTAIN',
	'PBWRITER'
];

function startGame() {
	game.started = true;

	resources.bgm.data.play();
	resources.bgm.data.fade(0, 1, 1000);


	const textContainer = window.textContainer = new Container();

	// hand
	hand = new Container();
	hand.tx = size.x / 2;
	hand.ty = size.y / 2;

	hand1 = makeHand(resources.hand.texture, 0.25, 0.1, 20, 80);
	hand2 = makeHand(resources.hand2.texture, 0.25, 0.1, 20, 80);
	hand3 = makeHand(resources.hand3.texture, 0.25, 0.1, 20, 80);
	hand_knob = makeHand(resources.hand_knob.texture, 0.1, 0.4, 40, 40);
	hand_tug = makeHand(resources.hand_tug.texture, 0.2, 0.2, 40, 40);
	hand_thumb = makeHand(resources.hand_thumb.texture, 0.3, 0.1, 0, 68);

	hand1.visible = true;
	currentHand = hand1;

	wheel = new Sprite(resources.wheel.texture);
	wheel.anchor.x = 0.6;
	wheel.anchor.y = 0.5;
	wheel.x = -size.x * 0.24;
	wheel.y = size.y * 0.22;

	wiper1 = new Sprite(resources.wiper.texture);
	wiper1.anchor.x = 0.05;
	wiper1.anchor.y = 1;
	wiper1.x = -size.x * 0.24;
	wiper1.y = size.y * 0.22;
	wiper2 = new Sprite(resources.wiper.texture);
	wiper2.anchor.x = 0.05;
	wiper2.anchor.y = 1;
	wiper2.x = -size.x * 0.24;
	wiper2.y = size.y * 0.22;
	wiping = false;

	arm = new Container();
	arm.actualSprite = new Sprite(resources.arm.texture);
	arm.addChild(arm.actualSprite);
	arm.actualSprite.anchor.x = 0.6;
	arm.actualSprite.anchor.y = 0.99;
	arm.actualSprite2 = new Sprite(resources.arm2.texture);
	arm.addChild(arm.actualSprite2);
	arm.actualSprite2.anchor.x = 0.6;
	arm.actualSprite2.anchor.y = 0.93;

	;
	const road = new Sprite((function() {
		const graphics = new PIXI.Graphics();
		graphics.beginFill(0, 0);
		graphics.drawRect(0, 0, 1, 1);
		graphics.endFill();
		const emptyTexture = graphics.generateTexture();
		graphics.destroy();
		return emptyTexture;
	}()));
	road.width = size.x;
	road.height = size.y;
	road.filterArea = new PIXI.Rectangle(0, 0, size.x, size.y);
	road.filters = [road_filter];

	game.app.stage.addChild(road);
	game.app.stage.addChild(scene);
	game.app.stage.addChild(hand);
	game.app.stage.addChild(arm);

	let toggle = new Container();
	toggle.downSprite = new Sprite(resources.switch_down.texture);
	toggle.upSprite = new Sprite(resources.switch_up.texture);
	toggle.downSprite.visible = false;
	toggle.addChild(toggle.downSprite);
	toggle.addChild(toggle.upSprite);
	toggle.position.x = 2;
	toggle.position.y = 27;
	toggle.onInteraction = function() {
		this.downSprite.visible = !this.downSprite.visible;
		this.upSprite.visible = !this.upSprite.visible;
		resources['click' + Math.ceil(Math.random() * 3)].data.play();
		hand.y += 10;
		wiping = !wiping;
	}.bind(toggle);
	toggle.restoreState = restoreButtonState;
	toggle.interactingHand = hand2;
	toggle.hoverHand = hand3;
	interactiveObjects.push(toggle);

	toggle = new Container();
	toggle.downSprite = new Sprite(resources.switch_down.texture);
	toggle.upSprite = new Sprite(resources.switch_up.texture);
	toggle.upSprite.visible = false;
	toggle.addChild(toggle.downSprite);
	toggle.addChild(toggle.upSprite);
	toggle.position.x = 14;
	toggle.position.y = 26;
	toggle.onInteraction = function() {
		this.downSprite.visible = !this.downSprite.visible;
		this.upSprite.visible = !this.upSprite.visible;
		resources['click' + Math.ceil(Math.random() * 3)].data.play();
		hand.y += 10;
	}.bind(toggle);
	toggle.restoreState = restoreButtonState;
	toggle.interactingHand = hand2;
	toggle.hoverHand = hand3;
	interactiveObjects.push(toggle);

	toggle = new Container();
	toggle.downSprite = new Sprite(resources.switch_down.texture);
	toggle.upSprite = new Sprite(resources.switch_up.texture);
	toggle.downSprite.visible = false;
	toggle.addChild(toggle.downSprite);
	toggle.addChild(toggle.upSprite);
	toggle.position.x = 26;
	toggle.position.y = 25;
	toggle.onInteraction = function() {
		this.downSprite.visible = !this.downSprite.visible;
		this.upSprite.visible = !this.upSprite.visible;
		resources['click' + Math.ceil(Math.random() * 3)].data.play();
		hand.y += 10;
	}.bind(toggle);
	toggle.restoreState = restoreButtonState;
	toggle.interactingHand = hand2;
	toggle.hoverHand = hand3;
	interactiveObjects.push(toggle);

	toggle = new Container();
	toggle.downSprite = new Sprite(resources.light1_on.texture);
	toggle.upSprite = new Sprite(resources.light1_off.texture);
	toggle.upSprite.visible = false;
	toggle.addChild(toggle.downSprite);
	toggle.addChild(toggle.upSprite);
	toggle.position.x = 0;
	toggle.position.y = 53;
	toggle.onInteraction = function() {
		this.downSprite.visible = !this.downSprite.visible;
		this.upSprite.visible = !this.upSprite.visible;
		resources['click' + Math.ceil(Math.random() * 3)].data.play();
		hand.y += 10;
	}.bind(toggle);
	toggle.restoreState = restoreButtonState;
	toggle.interactingHand = hand2;
	toggle.hoverHand = hand3;
	interactiveObjects.push(toggle);

	toggle = new Container();
	toggle.downSprite = new Sprite(resources.light2_on.texture);
	toggle.upSprite = new Sprite(resources.light2_off.texture);
	toggle.downSprite.visible = false;
	toggle.addChild(toggle.downSprite);
	toggle.addChild(toggle.upSprite);
	toggle.position.x = 20;
	toggle.position.y = 54;
	toggle.onInteraction = function() {
		this.downSprite.visible = !this.downSprite.visible;
		this.upSprite.visible = !this.upSprite.visible;
		resources['click' + Math.ceil(Math.random() * 3)].data.play();
		hand.y += 10;
	}.bind(toggle);
	toggle.restoreState = restoreButtonState;
	toggle.interactingHand = hand2;
	toggle.hoverHand = hand3;
	interactiveObjects.push(toggle);

	toggle = new Container();
	toggle.downSprite = new Sprite(resources.light3_on.texture);
	toggle.upSprite = new Sprite(resources.light3_off.texture);
	toggle.downSprite.visible = false;
	toggle.addChild(toggle.downSprite);
	toggle.addChild(toggle.upSprite);
	toggle.position.x = 40;
	toggle.position.y = 55;
	toggle.onInteraction = function() {
		this.downSprite.visible = !this.downSprite.visible;
		this.upSprite.visible = !this.upSprite.visible;
		resources['click' + Math.ceil(Math.random() * 3)].data.play();
		hand.y += 10;
	}.bind(toggle);
	toggle.restoreState = restoreButtonState;
	toggle.interactingHand = hand2;
	toggle.hoverHand = hand3;
	interactiveObjects.push(toggle);

	pull_cord = new Sprite(resources.pull_cord.texture);
	pull_cord.position.x = size.x * 0.2;
	pull_cord.position.y = -size.y * 1.1;
	pull_cord.anchor.x = 0.5;
	pull_cord.anchor.y = 0;
	pull_cord.onInteraction = function() {
		if (this.sound) {
			resources.sfxpull_cord.data.stop(this.sound);
		}
		this.sound = resources.sfxpull_cord.data.play();
		this.y = -size.y * 0.7;
		hand.y -= -size.y * 0.6;
	}.bind(pull_cord);
	pull_cord.restoreState = restoreButtonState;
	pull_cord.interactingHand = hand_tug;
	pull_cord.hoverHand = hand_tug;
	interactiveObjects.push(pull_cord);

	dial = new Container();
	dial.sprite = new Sprite(resources.dial.texture);
	dial.sprite.anchor.x = dial.sprite.anchor.y = 0.5;
	dial.addChild(dial.sprite);
	dial.position.x = 0;
	dial.position.y = 90;
	dial.onInteraction = function() {
		hand_knob.rotation += 0.2;
		if (g.activeSound && g.activeSound.done && g.nextConversation) {
			this.rotation += Math.PI / 2;
			startNextConversation();
			resources.sfxdial.data.play();
		} else {
			if (this.sound) {
				resources.not_yet.data.stop(this.sound);
			}
			this.sound = resources.not_yet.data.play();
		}
	}.bind(dial);
	dial.restoreState = restoreButtonState;
	dial.interactingHand = hand_knob;
	dial.hoverHand = hand_knob;
	interactiveObjects.push(dial);


	dash = new Sprite(resources.dash.texture);
	dash.anchor.x = dash.anchor.y = 0.5;
	speech = window.speech = new Sprite(resources.speech.texture);
	speech.anchor.x = 0.66;
	speech.anchor.y = 1.0;
	speech.x = size.x * 0.66;
	speech.y = size.y * 0.65;
	link1 = window.link1 = new Sprite(resources.option1.texture);
	link2 = window.link2 = new Sprite(resources.option2.texture);

	link1.anchor.x = link1.anchor.y = link2.anchor.x = link2.anchor.y = 0.5;

	callsignDisplay = new Container();
	callsignDisplay.position.x = 38;
	callsignDisplay.position.y = 26;
	for (let i = 0; i < callsigns.length; ++i) {
		var c = callsigns[i];
		callsigns[i] = new Sprite(resources['callsign' + c.replace(/\s/g, '_')].texture);
		callsigns[i].title = c;
		callsigns[i].visible = false;
		callsignDisplay.addChild(callsigns[i]);
	}

	// callsignDisplay.width = 12;
	// callsignDisplay.height = 12;

	for (let i = 0; i < callsigns.length; i++) {
		callsignDisplay.addChild(callsigns[i]);
	}

	currentCallsign = null;

	scene.addChild(wiper1);
	scene.addChild(wiper2);
	scene.addChild(dash);
	for (let i = 0; i < interactiveObjects.length; i++) {
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

	textContainer.x = -speech.width * 0.6;
	textContainer.y = -speech.height * 0.85;
	speech.scale.x = speech.scale.y = 0;

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

function update() {
	// update lerps
	for (let i = 0; i < lerps.length; ++i) {
		lerps[i].spr.position.y = lerp(lerps[i].spr.position.y, lerps[i].t.y, lerps[i].by);
		lerps[i].spr.position.x = lerp(lerps[i].spr.position.x, lerps[i].t.x, lerps[i].by);
	}


	// shortcuts for mute/palette swap
	if (keys.isJustDown(keys.M)) {
		toggleMute();
		resources.sfx_select.data.play();
	}

	if (game.started) {

		pull_cord.y = lerp(pull_cord.y, -size.y * 1.1, 0.1);
		wheel.rotation = Math.sin(game.app.ticker.lastTime / 1000.0 + game.app.ticker.lastTime / 1200.0) * 0.01 + Math.sin(game.app.ticker.lastTime / 900.0 + game.app.ticker.lastTime / 1400.0) * 0.01;

		var input = getInput();

		g.update();

		setHand(hand1);
		var links = [];
		var activePassage = g.currentPassage;
		var anyHover = false;
		if (activePassage) {
			var activeLinks = activePassage.links;
			for (let i = 0; i < activeLinks.length; ++i) {
				var link = activeLinks[i];
				if (link.parent.visible) {
					var p = link.parent.toGlobal(PIXI.zero);

					if (intersect(hand, {
							x: p.x - link.parent.width / 2,
							y: p.y - link.parent.height / 2,
							width: link.parent.width,
							height: link.parent.height
						})) {
						link.tint = 0xBBBBBB;
						anyHover = true;
						if (input.confirm) {
							setHand(hand_thumb);
						} else {
							setHand(hand_thumb);
						}

						if (input.justConfirm) {
							links.push(link.onclick.bind(link));
						}
					} else {
						link.tint = 0x000000;
					}
				}
			}
			for (let i = 0; i < links.length; ++i) {
				links[i]();
			}
		}

		if (!anyHover) {
			// Check interactive objects
			for (let i = 0; i < interactiveObjects.length; i++) {
				const obj = interactiveObjects[i];
				if (intersect(hand, obj.getBounds(true))) {
					if (input.justConfirm) {
						if (obj.hasOwnProperty("onInteraction")) {
							if (!obj.interacting) {
								obj.onInteraction();
								obj.interacting = true;
							}
							setHand(obj.interactingHand);
						}
					} else {
						setHand(obj.hoverHand);
						if (input.justConfirmUp) {
							if (obj.hasOwnProperty("restoreState")) {
								obj.restoreState();
								obj.interacting = false;
							}
						}
					}
				} else {
					if (obj.hasOwnProperty("restoreState") &&
						obj.hasOwnProperty("interacting") &&
						obj.interacting) {
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

	const useMouse = Math.abs(mouse.delta.x) + Math.abs(mouse.delta.y) > 0;

	// update input managers
	gamepads.update();
	keys.update();
	mouse.update();

	// keep mouse within screen
	mouse.x = clamp(0, mouse.x, (size.x - 2) * resizer.scaleMultiplier);
	mouse.y = clamp(0, mouse.y, (size.y - 2) * resizer.scaleMultiplier);

	scaledMouse.x = mouse.x / resizer.scaleMultiplier;
	scaledMouse.y = mouse.y / resizer.scaleMultiplier;

	if (game.started) {
		// update hand

		if (useMouse) {
			hand.tx = scaledMouse.x;
			hand.ty = scaledMouse.y;
		} else {
			const speed = 10;
			if (input.up) {
				hand.ty -= speed;
			}
			if (input.down) {
				hand.ty += speed;
			}
			if (input.left) {
				hand.tx -= speed;
			}
			if (input.right) {
				hand.tx += speed;
			}
		}
		hand.tx = clamp(0, hand.tx, size.x);
		hand.ty = clamp(size.y * 0.25 + Math.abs(hand.tx - size.x / 2) * 0.33, hand.ty, size.y);

		hand.x = Math.round(lerp(hand.x, hand.tx, 0.3));
		hand.y = Math.round(lerp(hand.y, hand.ty, 0.3));

		var p = currentHand.armPoint.toGlobal(PIXI.zero);
		arm.x = p.x;
		arm.y = p.y;
		var basex = size.x * 0.66 - scaledMouse.x * 0.25;
		// arm.actualSprite.visible = (hand.y + (hand.x-basex)/3) < size.y*0.5;
		arm.actualSprite2.visible = !arm.actualSprite.visible;

		arm.rotation = clamp(1.5, Math.atan2(size.y + 50 - arm.y, basex - arm.x) + Math.PI / 2, 4.5);

		road_filter.uniforms.uTime = game.app.ticker.lastTime / 1000;
		road_filter.uniforms.angle = 0.5 - (scaledMouse.x / size.x - 0.5) / 16.0;
		road_filter.uniforms.horizon = 0.25 + (scaledMouse.y / size.y - 0.5) / 32.0 + (Math.sin(game.app.ticker.lastTime / 30.0 + 0.2) * 0.003);
		dash.y = size.y / 2 - Math.floor((scaledMouse.y / size.y - 0.5) * 4.0 + Math.random() * Math.sin(game.app.ticker.lastTime / 30.0));
		dash.x = size.x / 2 - Math.floor((scaledMouse.x / size.x - 0.5) * 4.0);

		wiper1.x = dash.x - 60;
		wiper1.y = dash.y - 24;
		wiper2.x = dash.x + 200;
		wiper2.y = dash.y - 20;
		if (wiping) {
			wiper1.rotation = lerp(wiper1.rotation, Math.sin(game.app.ticker.lastTime / 200) * 1.1 - 1.1, 0.1);
			wiper2.rotation = lerp(wiper2.rotation, Math.sin(game.app.ticker.lastTime / 200 + 0.8) * 1.1 - 1.1, 0.1);
		} else {
			wiper1.rotation = lerp(wiper1.rotation, 0, 0.1);
			wiper2.rotation = lerp(wiper2.rotation, 0, 0.1);
		}

	}
	screen_filter.uniforms.uTime = game.app.ticker.lastTime / 1000.0 % 1000.0; // provide time in seconds (range 0-1000)

}
const lerps = [];

function addLerp(_spr, _by) {
	var l = {
		t: {
			x: _spr.position.x,
			y: _spr.position.y,
		},
		spr: _spr,
		by: _by || 0.1
	};

	_spr.lerp = l;
	lerps.push(l);
}

function toggleMute() {
	if (Howler._muted) {
		Howler.unmute();
	} else {
		Howler.mute();
	}
}


function getInput() {
	const res = {
		up: false,
		down: false,
		left: false,
		right: false,
		confirm: false,
		cancel: false
	};

	res.up |= keys.isDown(keys.UP);
	res.up |= keys.isDown(keys.W);
	res.up |= gamepads.isDown(gamepads.DPAD_UP);
	res.up |= gamepads.axisPast(gamepads.LSTICK_V, -0.5);

	res.down |= keys.isDown(keys.DOWN);
	res.down |= keys.isDown(keys.S);
	res.down |= gamepads.isDown(gamepads.DPAD_DOWN);
	res.down |= gamepads.axisPast(gamepads.LSTICK_V, 0.5);

	res.left |= keys.isDown(keys.LEFT);
	res.left |= keys.isDown(keys.A);
	res.left |= gamepads.isDown(gamepads.DPAD_LEFT);
	res.left |= gamepads.axisPast(gamepads.LSTICK_H, -0.5);

	res.right |= keys.isDown(keys.RIGHT);
	res.right |= keys.isDown(keys.D);
	res.right |= gamepads.isDown(gamepads.DPAD_RIGHT);
	res.right |= gamepads.axisPast(gamepads.LSTICK_H, 0.5);

	res.justConfirm = gamepads.isJustDown(gamepads.A) || gamepads.isJustDown(gamepads.B) || gamepads.isJustDown(gamepads.X) || gamepads.isJustDown(gamepads.Y) || keys.isJustDown(keys.SPACE) || keys.isJustDown(keys.ENTER) || keys.isJustDown(keys.Z) || keys.isJustDown(keys.X) || mouse.isJustDown(mouse.LEFT);
	res.justConfirmUp = gamepads.isJustUp(gamepads.A) || gamepads.isJustUp(gamepads.B) || gamepads.isJustUp(gamepads.X) || gamepads.isJustUp(gamepads.Y) || keys.isJustUp(keys.SPACE) || keys.isJustUp(keys.ENTER) || keys.isJustUp(keys.Z) || keys.isJustUp(keys.X) || mouse.isJustUp(mouse.LEFT);
	res.confirm = gamepads.isDown(gamepads.A) || gamepads.isDown(gamepads.B) || gamepads.isDown(gamepads.X) || gamepads.isDown(gamepads.Y) || keys.isDown(keys.SPACE) || keys.isDown(keys.ENTER) || keys.isDown(keys.Z) || keys.isDown(keys.X) || mouse.isDown(mouse.LEFT);

	return res;
}

function updateCallsignDisplay() {
	if (g.hasOwnProperty("currentCallsign")) {
		let callsign = g.currentCallsign;
		if (currentCallsign) {
			currentCallsign.visible = false;
		}
		callsignText.text = callsign.toLowerCase();
		if (callsign == "YOU") {
			speech.texture = resources.speech2.texture;
			callsign = g.yourCallsign || callsign;
		} else {
			speech.texture = resources.speech.texture;
		}
		for (let i = 0; i < callsigns.length; i++) {
			if (callsigns[i].title == callsign) {
				currentCallsign = callsigns[i];
				currentCallsign.visible = true;
			}
		}
	} else {
		if (currentCallsign) {
			currentCallsign.visible = false;
			callsignText.text = '???';
		}
	}
}

function makeHand(resource, x, y, x2, y2) {
	const newHand = new Sprite(resource);
	newHand.anchor.x = x;
	newHand.anchor.y = y;
	newHand.visible = false;
	newHand.armPoint = new Container();
	newHand.armPoint.visible = false;
	newHand.addChild(newHand.armPoint);
	newHand.armPoint.x += x2;
	newHand.armPoint.y += y2;
	hand.addChild(newHand);
	return newHand;
}

function setHand(hand) {
	currentHand.visible = false;
	currentHand = hand;
	currentHand.visible = true;
}

function onButtonInteraction() {}

function restoreButtonState() {}

function startNextConversation() {
	if (g.nextConversation) {
		g.goto(g.nextConversation)
			.then(function() {
				speech.scale.x = speech.scale.y = 0;
				speech.visible = true;
				g.nextConversation = null;
			});
	}
}
