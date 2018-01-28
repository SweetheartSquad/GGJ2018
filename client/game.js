// used for parser
PIXI.extras.BitmapText.prototype.measureWidth = function(__text){
	var t = this.text;
	this.text = __text;
	var w = this.textWidth;
	this.text = t;
	return w;
};
function Game() {
	this.glyphs = [];
	this.font = {
		fontFamily: "font",
		fontSize: 24,
		lineHeight: 30,
		fill: "#FFFFFF",
		align: "left",
		textBaseline: "alphabetic"
	};
	this.font = {font: "16px font", align: "right", lineHeight: 16};

	this.currentPassage = null;
	this.frequency = '7.034';
	this.history = [];

	this.narrativeEngine = new NarrativeEngine();
	this.narrativeEngine.scope = this;
	this.passages = this.narrativeEngine.parseSource(PIXI.loader.resources.script.data);

	for(var i in this.passages) {
		if(this.passages.hasOwnProperty(i)){
			sounds[i] = new Howl({
				urls:["assets/audio/"+i+".ogg"],
				autoplay:false,
				loop:false,
				volume:1,
				onload: function(i){
					this.log('sound loaded:', i);
				}.bind(this, i),
				onloaderror: function(i){
					this.error('sound failed to load:', i);
				}.bind(this, i)
			});
		}
	}

	var passage = this.narrativeEngine.parsePassage(this.passages["START"])
	console.log(passage);
}

Game.prototype.log = function () {
	console.log.apply(console, arguments);
};
Game.prototype.error = function () {
	console.error.apply(console, arguments);
};

Game.prototype.goto = function (__passage) {
	this.log('Going to passage:', __passage);
	return this.transitionOut()
	.then(this.narrativeEngine.parsePassage.bind(this.narrativeEngine, this.passages[__passage]))
	.then(function (__newPassage) {
		__newPassage.title = __passage;
		return __newPassage;
	})
	.catch(function (__err) {
		console.error('Failed to parsePassage:', __passage, '\n', __err);
		return this.narrativeEngine.parsePassage(this.passages['DEFAULT']);
	})
	.then(this.displayPassage.bind(this))
	.then(this.transitionIn.bind(this));
};

Game.prototype.back = function () {
	this.log('back');
	if (this.history.length > 0) {
		return this.goto(this.history.pop()) // goto the last thing in history
		.then(function () {
			this.history.pop(); // remove the last thing in history (i.e. don't get stuck in a loop)
		}.bind(this));
	} else {
		this.error('Back skipped because no history available.');
	}
};

Game.prototype.displayPassage = function (__newPassage) {
	// history
	if (this.currentPassage && this.currentPassage.title) {
		this.history.push(this.currentPassage.title);
	} else {
		this.error('History skipped because passage has no title:', this.currentPassage);
	}

	var textWidth = speech.width * 0.85;
	this.currentPassage = this.passageToText(__newPassage, textWidth);
	this.currentPassage.title = __newPassage.title;

	this.log(this.currentPassage);

	this.activeSound = this.getSound(this.currentPassage.title).play();
	this.activeSound.done = false;
	this.activeSound.on('end', function(){
	  this.done = true;
	});

	// remove existing passage
	// var oldText = textContainer.removeChildren();
	// for(var i = 0; i < oldText.length; ++i){
	// 	oldText[i].destroy();
	// }
	// oldText = video.passageContainer.textContainer.removeChildren();
	// for(var i = 0; i < oldText.length; ++i){
	// 	oldText[i].destroy();
	// }

	// parse requested passage
	// var textWidth = this.video ? size.x/2.2 : size.x/1.9;
	// this.currentPassage = this.passageToText(__newPassage, textWidth);
	// this.currentPassage.title = __newPassage.title;

	// if(!this.video) {
	// add parsed passage
	// for(var i = 0; i < this.currentPassage.text.length; ++i){
	// 	textContainer.addChild(this.currentPassage.text[i]);
	// }
	// // re-center text
	// textContainer.y = size.y*3/4 - textContainer.height/2;
	// }else{
	// bg
	// if(video.passageContainer.bg){
	// 	video.passageContainer.removeChild(video.passageContainer.bg);
	// 	video.passageContainer.bg.destroy();
	// }
	// {
	// 	var g = new PIXI.Graphics();
	// 	g.beginFill(0,1);
	// 	g.drawRect(0,0,1,1);
	// 	g.endFill();
	// 	video.passageContainer.bg = new PIXI.Sprite(g.generateTexture());
	// 	g.destroy();
	// }
	// video.passageContainer.bg.height = 0;


	// add parsed passage
	var oldText = textContainer.removeChildren();
	oldText = oldText.concat(link1.removeChildren());
	oldText = oldText.concat(link2.removeChildren());
	for(var i = 0; i < oldText.length; ++i) {
		oldText[i].destroy();
	}

	for(var i = 0; i < this.currentPassage.text.length; ++i){
		textContainer.addChild(this.currentPassage.text[i]);
	}
	for(var i = 0; i < this.currentPassage.links.length; ++i){
		textContainer.removeChild(this.currentPassage.links[i]);
		this.currentPassage.links[i].y = -this.currentPassage.links[i].height/2;
		this.currentPassage.links[i].x -= this.currentPassage.links[i].width/2;
		this.currentPassage.links[i].tint = 0x000000;
		if(i == 0){
			link1.addChild(this.currentPassage.links[i]);
		}else{
			link2.addChild(this.currentPassage.links[i]);
		}
	}
	this.glyphs = [];
	for(var i = 0; i < textContainer.children.length; ++i){
		if(this.currentPassage.links.indexOf(textContainer.children[i]) < 0){
			this.glyphs = this.glyphs.concat(textContainer.children[i]._glyphs);
		}
	}

	for(var i = 0; i < this.glyphs.length; ++i){
		this.glyphs[i].visible = false;
	}
	link1.visible = false;
	link2.visible = false;


	speech.scale.x = speech.scale.y = 1.1;
	// video.passageContainer.bg.height = video.passageContainer.textContainer.height + border.outer*2;
	// video.passageContainer.bg.width = textWidth + border.outer*2;
	// video.passageContainer.addChildAt(video.passageContainer.bg, 0);
	// border
	// {
	// 	if(video.passageContainer.border){
	// 		video.passageContainer.removeChild(video.passageContainer.border);
	// 		video.passageContainer.border.destroy();
	// 	}
	// 	video.passageContainer.border = new PIXI.Sprite(getBorderTex(video.passageContainer.bg,false))
	// 	video.passageContainer.addChild(video.passageContainer.border);
	// }
	// re-center text
	// video.passageContainer.x = Math.floor(size.x/2 - textWidth/2);
	// video.passageContainer.y = Math.floor(size.y*3/4 - video.passageContainer.height/2);
	// }
	return;
};

Game.prototype.update = function(){
	var linksVisible;
	if(this.activeSound && !this.activeSound.done){
		for(var i = 0; i < this.glyphs.length; ++i){
			if(i/this.glyphs.length < this.activeSound.pos()/(this.activeSound._duration-1)){
				this.glyphs[i].visible = true;
			}else{
				linksVisible = false;
			}
		}
	}else if(this.activeSound && this.activeSound.done){
		for(var i = 0; i < this.glyphs.length; ++i){
			this.glyphs[i].visible = true;
		}
		linksVisible = g.currentPassage.links.length > 0;
	}

	if(linksVisible){
		link1.scale.x = lerp(link1.scale.x, 1.0, 0.25);
		link1.scale.y = lerp(link1.scale.y, 1.0, 0.55);

		link2.scale.x = lerp(link2.scale.x, 1.0, 0.15);
		link2.scale.y = lerp(link2.scale.y, 1.0, 0.45);
	}else{
		link1.scale.x = link2.scale.x = 0;
		link1.scale.y = link2.scale.y = 2;
	}

	link1.visible = linksVisible;
	link2.visible = linksVisible;
};

// go through passage contents and convert to text objects
// and interactive elements
Game.prototype.passageToText = function (__passage, __maxWidth) {
	// var temp = new PIXI.Text("", this.font);
	var temp = new PIXI.extras.BitmapText("", this.font);
	temp.tint = 0x000000;
	var line = "";
	var passage = {
		text: [],
		links: []
	};
	var y = 0;
	var x = 0;
	for (var i = 0; i < __passage.length; ++i) {
		var word = __passage[i];
		var isLink = word.hasOwnProperty('link');
		var wordText = (isLink ? word.text : word).toLowerCase();
		if (wordText.length <= 0) {
			continue;
		}

		if (x + temp.measureWidth(line + wordText) > __maxWidth || wordText === '\n') {
			// wrap a line
			temp.text = line;
			passage.text.push(temp);
			temp.y = y;
			temp.x = x;

			line = "";
			y += this.font.lineHeight;
			x = 0;

			wordText = wordText.trim();

			// temp = new PIXI.Text("", this.font);
			temp = new PIXI.extras.BitmapText("", this.font);
			temp.tint = 0x000000;
		}
		// append to current line
		if (isLink) {
			if (line) {
				// end line early
				temp.text = line;
				passage.text.push(temp);
				temp.y = y;
				temp.x = x;
				x += temp.measureWidth(temp.text);
			} else {
				temp.destroy();
			}

			// add section with link
			var outline = 1;
			// temp = new PIXI.Text(wordText, this.font);
			temp = new PIXI.extras.BitmapText(wordText, this.font);
			temp.tint = 0x000000;
			temp.x = x;
			temp.y = y;
			temp.link = word.link;
			temp.onclick = this.onLinkClicked.bind(this, temp);
			passage.text.push(temp);
			x += temp.measureWidth(temp.text);

			// continue with new line
			line = "";
			// temp = new PIXI.Text("", this.font);
			temp = new PIXI.extras.BitmapText("", this.font);
		} else {
			line += wordText.replace(/[\n]/g, '');
		}

	}
	// add the last line if we have leftovers
	if (line.length > 0) {
		temp.text = line;
		passage.text.push(temp);
		temp.y = y;
		temp.x = x;
	}

	// add text objects
	for (var i = 0; i < passage.text.length; ++i) {
		if (passage.text[i].text.length <= 0) {
			passage.text[i].renderable = false;
		}
		// passage.text[i].tint = offWhite;
		if (passage.text[i].link) {
			passage.links.push(passage.text[i]);
		}
	}
	this.log('Converted passage to text: ', passage);
	return passage;
};


Game.prototype.transitionOut = function () {
	this.log('transitionOut: start');
	var a = 1;
	return new Promise(function (__resolve, __reject) {
		a = 1;
		var i = setInterval(function () {
			if (a <= 0.2) {
				this.log('transitionOut: complete');
				clearInterval(i);
				i = undefined;
				__resolve();
			} else {
				a = lerp(a, 0, 0.1);
			}
		}.bind(this), -1);
	}.bind(this));
};
Game.prototype.transitionIn = function () {
	this.log('transitionIn: start');
	var a = 0;
	return new Promise(function (__resolve, __reject) {
		a = 0;
		var i = setInterval(function () {
			if (a >= 0.8) {
				this.log('transitionIn: complete');
				clearInterval(i);
				i = undefined;
				__resolve();
			} else {
				a = lerp(a, 1, 0.1);
			}
		}.bind(this), -1);
	}.bind(this));
};
Game.prototype.wait = function (timeout) {
	this.log('wait: start');
	return new Promise(function (__resolve, __reject) {
		setTimeout(function () {
			this.log('wait: complete');
			__resolve();
		}.bind(this), timeout);
	}.bind(this));
};
Game.prototype.onLinkClicked = function(__link){
	this.log('Clicked link: ',__link.text,'\n','Running: ', __link.link);
	this.narrativeEngine.eval(__link.link, this);
};
Game.prototype.autoRespond = function (timeout) {
	return Promise.resolve()
	.then(this.log.bind(this, 'autoRespond: start'))
	.then(this.wait.bind(this,100))
	.then(function(){
		return this.wait(this.getSound(this.currentPassage.title)._duration*1000);
	}.bind(this))
	.then(function(){
		return this.goto(this.currentPassage.title + '-RESPONSE');
	}.bind(this))
	.then(this.log.bind(this, 'autoRespond: complete'));
};
Game.prototype.waitAndGoto = function (__passage) {
	return Promise.resolve()
	.then(this.log.bind(this, 'waitAndGoto: start'))
	.then(this.wait.bind(this,100))
	.then(function(){
		return this.wait(this.getSound(this.currentPassage.title)._duration*1000);
	}.bind(this))
	.then(function(){
		return this.goto(__passage);
	}.bind(this))
	.then(this.log.bind(this, 'waitAndGoto: complete'));
};
Game.prototype.getSound = function (__id) {
	var s = sounds[__id];
	if (!s || !s._loaded) {
		s = sounds.temp;
	}
	return s;
}

Game.prototype.setCallsign = function(callsign){
	this.currentCallsign = callsign;
};
Game.prototype.setFrequency = function(frequency){
	this.frequency = frequency;
};


Game.prototype.endCurrentConversation = function(nextConversation){
	return Promise.resolve()
	.then(this.log.bind(this, 'waitAndGoto: start'))
	.then(this.wait.bind(this,100))
	.then(function(){
		return this.wait(this.getSound(this.currentPassage.title)._duration*1000);
	}.bind(this))
	.then(function(){
		speech.visible = false;
		this.nextConversation = nextConversation;
		this.setCallsign(null);
	}.bind(this));
}