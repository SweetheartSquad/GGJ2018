import 'pixi.js';
import HowlerMiddleware from 'howler-pixi-loader-middleware';
import assets from './assets';
import { init } from './main';
import size from './size';

// PIXI configuration stuff
PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST;
PIXI.zero = Object.freeze(new PIXI.Point(0, 0));

class Game {
	constructor() {
		const canvas = document.createElement('canvas');
		this.app = new PIXI.Application({
			view: canvas,
			width: size.x,
			height: size.y,
			antialias: false,
			forceFXAA: false,
			transparent: false,
			resolution: 1,
			roundPixels: true,
			clearBeforeRender: true,
			autoResize: false,
			backgroundColor: 0x000000
		});
		this.startTime = Date.now();

		this.setupLoader();
	}

	setupLoader() {
		this.app.loader.pre(HowlerMiddleware);
		Object.entries(assets).forEach(([name, asset]) => {
			let a;
			if (typeof asset === "string") {
				a = {
					name,
					url: asset,
				};
			} else {
				a = {
					name,
					...asset,
				};
			}
			this.app.loader.add(a);
		});

	}

	load({
		onLoad,
		onComplete,
		onError
	}) {
		this.app.loader.onLoad.add(onLoad);
		this.app.loader.onComplete.add(onComplete);
		this.app.loader.onComplete.add(init);
		this.app.loader.onError.add(onError);
		this.app.loader.load();
	}
}

const game = new Game();
export default game;
export const resources = game.app.loader.resources;
