(function() {
	function sMatrix() {
		this.m = { };
	}

	sMatrix.prototype.set = function (row,col,val) {
		if (typeof this.m[row] == 'undefined' ) {
			this.m[row] = { };
		}
		if (val == 0) {
			delete this.m[row][col];
		}
		this.m[row][col] = val;
	}
	sMatrix.prototype.get = function (row,col) {
		if (typeof this.m[row] == 'undefined' ) {
			return 0;
		}
		if (typeof this.m[row][col] == 'undefined' ) {
			return 0;
		}
		return this.m[row][col];
	}
	
	var animation; 										//contains the interval;
	var top = 0;										//contains the top corner
	var left = 0;										//contains the left corner
	var canvas = $('tutorial');
	//Moving around
	canvas.addEventListener('mousedown',dragEnter,false);
	canvas.addEventListener('mouseup',dragExit,false);
	//Zooming
	canvas.addEventListener('mousewheel',scroll,false);
	//Changing colors
	//canvas.addEventListener('click',changeColor,false);
	var DragColor = false;								//for deciding wether to change the color or drag
	
	var cw = canvas.width = window.innerWidth-30;
	var ch = canvas.height = window.innerHeight-70;
	var gridSize = 15;
	var gridW = Math.floor(canvas.width/gridSize);
	var gridH = Math.floor(canvas.height/gridSize);
	var radius = 10; 									//distance from center where there may be preblacked elements
	canvas = canvas.getContext('2d');
	var ant; 											//contains the ant information
	var grid; 											//contains the grid sparse matrix
	var time=20; 										//how fast should frames render in milliseconds
	var step = 0;										//what step is the animation at
	var drag = { };										//for dragging
	var rules = [];										//rules of the game. It's a 2x2 matrix, rows being ant states, columns cell colors and each element containing an array with 3 values: the color to which to turn 
														//the cell into, the direction to turn, and the resulting ant state
	var antStates;
	var cellColors;
	var colors = ['white','black','red','yellow','blue','green','pink','teal','aqua','lime','olive','gray','fuchsia','purple','navy','grey','maroon'];
	//Buttons for controlling animation
	$('start').addEventListener('click',start,false);
	$('stop').addEventListener('click',stop,false);
	$('reset').addEventListener('click',init,false);
	$('clear').addEventListener('click',function() { init(false) },false);
	$('center').addEventListener('click',function() { top=0; left=0; },false);
	$('setRule').addEventListener('click',makeRule,false);
	$('randRule').addEventListener('click',randRule,false);
	$('next').addEventListener('click',draw,false);
	window.addEventListener('resize',resize,false);
	$('options').addEventListener('mouseover',function() { this.style.height='auto';},false);
	$('options').addEventListener('mouseout',function() { this.style.height='10px';},false);
	

	init(false);
	start();
	makeTable(rules);
	
	function init(random) {
		top = 0;
		left = 0;
		step = 0;
		grid = new sMatrix();
		var hash = location.hash.substring(1);
		if (hash == '') {
			hash = '[[["1",1,"0"],["0",-1,"0"]]]';
		}
		buildRule(hash);
		if (typeof random == "undefined") {
			random = true;
		  }
		if (random) {
			for (var i = 0 ; i<gridW; i++) {
				for (var j=0; j<gridH; j++) {
					if (Math.floor(Math.random()*11) == 0  && (i>gridW/2-radius && i<gridW/2+radius) && (j>gridH/2-radius && j<gridH/2+radius)) {
						grid.set(i,j,1);
					}
				}
			}
		}
		ant = {														//the ant's
			x:Math.floor(gridW/2),					//horizontal position
			y:Math.floor(gridH/2),					//vertical position
			state:0,
			d:1														//direction. 0 is up, 1 is right, 2 is down, 3 is left		
		}
		draw();
	}
	
	//Loop
	function draw() {
		canvas.clearRect(0,0,cw,ch);
		if (gridSize>10)
			drawGrid();
		drawMap();
		drawAnt();
		step++;
		$('step').innerHTML = 'Step: '+step;
	}
	
	//Drawing functions
	function drawGrid() {
		canvas.save();
		canvas.strokeStyle = 'grey';
		for (var i = 0; i<gridW+1; i++) {
			canvas.beginPath();
			canvas.moveTo(i*gridSize,0);
			canvas.lineTo(i*gridSize,(gridH+1)*gridSize);
			canvas.closePath();
			canvas.stroke();
		}
		for (var i = 0; i<gridH+1; i++) {
			canvas.beginPath();
			canvas.moveTo(0,i*gridSize);
			canvas.lineTo((gridW+1)*gridSize,i*gridSize);
			canvas.closePath();
			canvas.stroke();
		}
		canvas.strokeStyle = 'black';
		canvas.restore();
	}
	
	function drawMap() {
		for (var i = 0 ; i<gridW; i++) {
			for (var j=0; j<gridH; j++) {
				if (grid.get(i-left,(j+top))!=0) {
					canvas.fillStyle = colors[grid.get(i-left,(j+top))];
					canvas.fillRect(i*gridSize,j*gridSize,gridSize,gridSize);
					canvas.fillStyle = 'black';
				}
			}
		}
	}
	
	function drawAnt() {
		
		if (ant.x + left > 0 && ant.y - top > 0) {
			canvas.fillStyle='orange';
			canvas.fillRect((ant.x+left)*gridSize+1,(ant.y-top)*gridSize+1,gridSize-2,gridSize-2);
			canvas.fillStyle='black';
		}
		antProgress();
	}

	function antProgress() {
		var currentRule = rules[ant.state][grid.get(ant.x,ant.y)];
		ant.d += currentRule[1];
		grid.set(ant.x,ant.y,currentRule[0]);
		ant.state = currentRule[2];
		if (ant.d < 0 )
			ant.d += 4;
		ant.d = ant.d%4;
		switch(ant.d) {
			case 0:
				ant.y--;
				break;
			case 1:
				ant.x++;
				break;
			case 2:
				ant.y++;
				break;
			case 3:
				ant.x--;
				break;
		}
	}
	//Control functions 
	function start() {
		animation = setInterval(draw, time);
		$('start').disabled=true;
	}
	
	function stop() {
		clearInterval(animation);
		animation = false;
		$('start').disabled=false;
	}
	
	function changeRule() {
		var hash = $('rule').value;
		window.location.hash = hash;
		buildRule(hash);
	}
	
	function buildRule(hash) {
		var newRule = JSON.parse(hash);
		if (checkRule(newRule)) {
			rules = newRule;
		}
		else {
			alert('bad rule');
		}
	}
	
	function checkRule(rule) {
		antStates = 0, cellColors = 0;
		var ruleElements = 0 ;
		for (var i = 0, len = rule.length; i<len; i++) {
			if (isArray(rule[i])) {
				cellColors = 0;
				for (var j = 0, lenj = rule[i].length; j<lenj; j++) {
					cellColors++;
					ruleElements++;
				}
				antStates++;
			}
			else {
				return false;
			}
		}
		if (antStates * cellColors != ruleElements) {
			return false;
		}
		for (var i = 0, len = rule.length; i<len; i++) {
			for (var j = 0, lenj = rule[i].length; j<lenj; j++) {
				if (rule[i][j][0] <0 || rule[i][j][0] > cellColors) {
					return false;
				}
				if (rule[i][j][2] <0 || rule[i][j][2] > antStates) {
					return false;
				}	
			}
		}
		return true;
	}
		
	//Table functions
	function makeTable(rule) {
		var table = document.getElementsByTagName('table')[0];
		
		//Set the Cell Color row
		var row = table.childNodes[1].childNodes[0];
		row.childNodes[3].setAttribute('colspan',cellColors*3);
		
		button = row.cells[row.cells.length-1].firstChild;
		button.addEventListener('click',addColor);
		
		//Set the cell color individual cells with numbers
		row = table.childNodes[1].childNodes[2];
		while (row.hasChildNodes()) {
			row.removeChild(row.firstChild);
		}
		for (var i = 0 ; i<cellColors; i++) {
			var cell = cE('th');
			cell.setAttribute('colspan',3);
			cell.appendChild(document.createTextNode(i));
			row.appendChild(cell);
		}
		
		//Set the cell color text cells 
		row = table.childNodes[1].childNodes[4];
		var cells = row.getElementsByTagName('td');
		while (cells.length > cellColors*3) {
			row.removeChild(cells[cells.length-1]);
		}
		for (var i = cells.length; i < cellColors*3; i++) {
			var cell = cE('td');
			if (i%3 == 0) {
				cell.appendChild(document.createTextNode('Write Color'));
			}
			if (i%3 == 1) {
				cell.appendChild(document.createTextNode('Turn direction'));
			}
			if (i%3 == 2) {
				cell.appendChild(document.createTextNode('Next ant state'));
			}
			row.appendChild(cell);
		}
		
		//Add ant states
		var rows = table.rows;
		while (rows.length > 3) {
			table.deleteRow(rows.length-1);
		}
		for (var i=0; i<antStates; i++) {
			row = cE('tr');
			var cell = cE('td');
			if (i==0) {
				cell.appendChild(document.createTextNode('Ant States'));
				cell.setAttribute('rowspan',antStates);
				row.appendChild(cell);
				cell = cE('td');
			}
			cell.appendChild(document.createTextNode(i));
			row.appendChild(cell);
			for (var j = 0; j < cellColors; j++) {
				var cell = cE('td');
				cell.appendChild(document.createTextNode(rule[i][j][0]));
				cell.setAttribute('contenteditable','true');
				row.appendChild(cell);
				cell = cE('td');
				var dir;
				switch (rule[i][j][1]) {
					case 0:
						dir = 'A';
						break;
					case 1:
						dir = 'R';
						break;
					case -1:
						dir = 'L';
						break;
					case -2:
						dir = 'B';
						break;
				}
				cell.appendChild(document.createTextNode(dir));
				cell.setAttribute('contenteditable','true');
				row.appendChild(cell);
				cell = cE('td');
				cell.appendChild(document.createTextNode(rule[i][j][2]));
				cell.setAttribute('contenteditable','true');
				row.appendChild(cell);
			}
			table.childNodes[1].appendChild(row);
		}
		
		//Add the minus ant state button
		var cell = cE('td');
		var button = cE('button');
		button.appendChild(document.createTextNode('-'));
		button.addEventListener('click',removeState);
		cell.appendChild(button);
		row = table.rows[table.rows.length-1];
		row.appendChild(cell);
		
		//Add the plus ant state and minus cell color
		row = cE('tr');
		cell = cE('td');
		cell.setAttribute('colspan',2);
		button = cE('button');
		button.appendChild(document.createTextNode('+'));
		button.addEventListener('click',addState);
		cell.appendChild(button);
		row.appendChild(cell);
		
		cell = cE('td');
		cell.setAttribute('colspan',cellColors*3-3);
		row.appendChild(cell);
		
		cell = cE('td');
		cell.setAttribute('colspan',3);
		button = cE('button');
		button.appendChild(document.createTextNode('-'));
		button.addEventListener('click',removeColor);
		cell.appendChild(button);
		row.appendChild(cell);
		
		table.childNodes[1].appendChild(row);
	}
	
	function makeRule() {
		stop();
		var table = document.getElementsByTagName('table')[0];
		var nAntStates = table.rows.length-4;
		var nCellColors = table.rows[3].cells.length - 2;
		if (nCellColors%3 != 0 )  {
			nCellColors--;
		}
		nCellColors /= 3;
		var rule = [] ;
		for (var i = 0; i<nAntStates; i++) {
			rule[i] = [];
			for (var j=0; j<nCellColors; j++) {
				rule[i][j]=[];
				if (i == 0 ) {
					var p = 2;
				}
				else {
					var p = 1;
				}
				var writeC = table.rows[i+3].cells[j*3+p].innerHTML;
				var turnD = table.rows[i+3].cells[j*3+p+1].innerHTML;
				var nextS = table.rows[i+3].cells[j*3+p+2].innerHTML;
				if (writeC < nCellColors && 'LRAB'.indexOf(turnD)!=-1 && nextS < nAntStates) {
					rule[i][j][0] = writeC;
					switch (turnD) {
						case 'L':
							rule[i][j][1] = -1;
							break;
						case 'R':
							rule[i][j][1] = +1;
							break;
						case 'A':
							rule[i][j][1] = 0;
							break;
						case 'B':
							rule[i][j][1] = -2;
							break;
					}
					rule[i][j][2] = nextS;
				}
				else {
					throwError('Invalid rule');
					return;
				}
			}
		}
		rules = rule;
		location.hash = JSON.stringify(rules);
		init();
		start();
	}
	
	function addColor() {
		var table = document.getElementsByTagName('table')[0];
		var cell = table.rows[0].cells[1];
		cell.setAttribute('colspan',(++cellColors)*3);
		
		var row = table.rows[1];
		cell = cE('th');
		cell.setAttribute('colspan',3);
		cell.appendChild(document.createTextNode(cellColors-1));
		row.appendChild(cell);
		
		row = table.rows[2];
		cell = cE('td');
		cell.appendChild(document.createTextNode('Write Color'));
		row.appendChild(cell);
		cell = cE('td');
		cell.appendChild(document.createTextNode('Turn direction'));
		row.appendChild(cell);
		cell = cE('td');
		cell.appendChild(document.createTextNode('Next ant state'));
		row.appendChild(cell);
		
		for (var j = 0; j < antStates; j++) {
			row = table.rows[j+3];
			for (var i =0; i<3; i++) {
				cell = cE('td');
				cell.setAttribute('contenteditable','true');
				if (j < antStates - 1) {
					row.appendChild(cell);
				}
				else {
					row.insertBefore(cell,row.lastChild);
				}
			}
		}
		
		row = table.rows[table.rows.length-1];
		cell = row.cells[1];
		cell.setAttribute('colspan',cellColors*3-3);
		
		if (cellColors == 2) {
			cell = cE('td');
			cell.setAttribute('colspan',3);
			var button = cE('button');
			button.appendChild(document.createTextNode('-'));
			button.addEventListener('click',removeColor);
			cell.appendChild(button);
			row.appendChild(cell);
		}
	}
	
	function addState() {
		var table = document.getElementsByTagName('table')[0];
		var cell = table.rows[3].cells[0];
		cell.setAttribute('rowspan',++antStates);
		
		if (antStates > 2) {
			var row = table.rows[rows.length-2];
			row.removeChild(row.lastChild);
		}
		
		row = cE('tr');
		 cell = cE('td');
		cell.appendChild(document.createTextNode(antStates-1));
		row.appendChild(cell);
		for (var j = 0; j < cellColors; j++) {
			cell = cE('td');
			cell.setAttribute('contenteditable','true');
			row.appendChild(cell);
			cell = cE('td');
			cell.setAttribute('contenteditable','true');
			row.appendChild(cell);
			cell = cE('td');
			cell.setAttribute('contenteditable','true');
			row.appendChild(cell);
		}
		
		cell = cE('td');
		var button = cE('button');
		button.appendChild(document.createTextNode('-'));
		button.addEventListener('click',removeState);
		cell.appendChild(button);
		row.appendChild(cell);
		
		table.childNodes[1].insertBefore(row,table.childNodes[1].lastChild);
	}
	
	function removeColor() {
		var table = document.getElementsByTagName('table')[0];
		var cell = table.rows[0].cells[1];
		cell.setAttribute('colspan',(--cellColors)*3);
		
		var row = table.rows[1];
		row.removeChild(row.cells[row.cells.length-1]);
		
		row = table.rows[2];
		for (var i = 0; i<3; i++) {
			row.removeChild(row.cells[row.cells.length-1]);
		}
		
		for (var j = 0; j < antStates; j++) {
			row = table.rows[j+3];
			for (var i =0; i<3; i++) {
				if (j < antStates - 1) {
					row.removeChild(row.cells[row.cells.length-1]);
				}
				else {
					row.removeChild(row.cells[row.cells.length-2]);
				}
			}
		}
		
		row = table.rows[table.rows.length-1];
		if (cellColors > 1) {
			cell = row.cells[1];
			cell.setAttribute('colspan',cellColors*3-3);
		}
		else {
			cell = row.cells[2];
			row.removeChild(cell);
		}
	}
	
	function removeState() {
		var table = document.getElementsByTagName('table')[0];
		var cell = table.rows[3].cells[0];
		cell.setAttribute('rowspan',--antStates);
		
		table.deleteRow(table.rows.length-2);
		
		if (antStates>1) {
			var row = table.rows[table.rows.length-2];
			cell = document.createElement('td');
			var button = cE('button');
			button.appendChild(document.createTextNode('-'));
			button.addEventListener('click',removeState);
			cell.appendChild(button);
			row.appendChild(cell);
		}
	}
	
	function randRule() {
		stop();
		cellColors = Math.ceil(Math.random()*4)+1;//We need at least two cell colors
		antStates = Math.ceil(Math.random()*5);
		rules = [];
		for (var i = 0; i < antStates; i++) {
			rules[i] = [];
			for (var j = 0; j < cellColors; j++) {
				rules[i][j] = [Math.floor(Math.random()*cellColors), Math.floor(Math.random()*4)-2, Math.floor(Math.random()*antStates)];
			}
		}
		makeTable(rules);
		location.hash = JSON.stringify(rules);
		init(false);
		start();
	}
	//Movement functions
	function scroll(event) {
		var delta;
		if (event.wheelDelta) {
			delta = event.wheelDelta / 60;
		} else if (event.detail) {
			delta = -event.detail / 2;
		}
		if (gridSize + delta >= 1  && gridSize + delta <50) {
			gridSize += delta;
		}
		gridW = Math.floor(cw/gridSize);
		gridH = Math.floor(ch/gridSize);
		return false;
	}
	
	function dragEnter(event) {
		$('tutorial').addEventListener('mousemove',dragF,false);
		//canvas.style.cursor = "pointer";// !!!!!!!!!!!!!!!!!!
		drag = {
			startX:event.clientX,
			startY:event.clientY,
			topY:top,
			leftX:left
		};
		DragColor = setTimeout(function() { DragColor = false;},300);
	}
	
	function dragExit(event) {
		$('tutorial').removeEventListener('mousemove',dragF,false);
		if (DragColor) {
			changeColor(event);
		}
	}
	
	function dragF(event) {
		top = drag.topY - Math.floor((event.clientY - drag.startY)/gridSize);
		left = drag.leftX + Math.floor((event.clientX - drag.startX)/gridSize);
	}
	
	function changeColor(event) {
		var canvas = $('tutorial');
		var x = Math.floor((event.clientX-canvas.offsetLeft)/gridSize);
		var y = Math.floor((event.clientY-canvas.offsetTop)/gridSize);
		var color = grid.get(x-left,y+top);
		color++;
		color = color % cellColors;
		grid.set(x-left,y+top,color);
	}	
	
	function resize(event) {
		var canvas = $('tutorial');
		cw = canvas.width = window.innerWidth-30;
		ch = canvas.height = window.innerHeight-70;
		gridW = Math.floor(canvas.width/gridSize);
		gridH = Math.floor(canvas.height/gridSize);
		top = Math.floor(ant.y -gridH/2);
		left = Math.floor(ant.x - gridW/2);
	}
	
	//Misc functions
	
	
	function isArray(o) {
	  return Object.prototype.toString.call(o) === '[object Array]';
	}

	function throwError(error) {
		console.log(error);
	}
	
	function $(el) {
		return document.getElementById(el);
	}
	function cE(el) {
		return document.createElement(el);
	}
})();