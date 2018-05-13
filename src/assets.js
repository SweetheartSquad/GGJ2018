import * as textures from './assets/textures/textures';
import * as audio from './assets/audio/audio';

import fontImg from './assets/font/font.fnt.png'; // not using the image directly, but need to make sure it's imported for the xml to reference
import font from './assets/font/font.fnt.xml';
import road_shader from './assets/road_shader.frag';
import screen_shader from './assets/screen_shader.frag';

import script from './assets/script.txt';

export default {
	...textures,
	...audio,
	font,
	road_shader,
	screen_shader,
	script,
};
