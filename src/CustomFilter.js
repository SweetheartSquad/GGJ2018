import 'pixi.js';
import { Filter } from 'pixi.js/lib/core';

export default class CustomFilter extends Filter {
	constructor(fragmentSource) {
		super(null, fragmentSource);
	}
}
