
var w = 50;
var h = 30;
var scale = 2;
var density = 0.3;
var numberOfDistricts = 30;
var numberOfParties = 2;
var movesPerTurn = 5;
var borderWidth = 1;
var outlineWidth = 3;
var districts = [];
var districtNodes = [];
var grid = [];
var parties = [
	// { partyName: "grey", weight: 0, districtName: "silver", hoverColor: "lightgrey" },
	{ partyName: "red", weight: 1, districtName: "pink", hoverColor: "lightcoral", borderColor: "palevioletred" },
	{ partyName: "blue", weight: 1, districtName: "lightblue", hoverColor: "dodgerblue", borderColor: "skyblue" },
	{ partyName: "green", weight: 0.33, districtName: "palegreen", hoverColor: "lightgreen", borderColor: "chartreuse" }
];
var voters = [];
var districtCounts = [];
var isDragging = false;
var dragStartTile = null;
var mouseoverDistrict = -1;
var currentMove = movesPerTurn;
var blinkTimers = [];
var blinkCount;
var blinkInterval = 125;
var undoStack = [];

function main() {
	$('.container').hide();

	updateMoveCounter();

	$('#widthSlider').on('input propertychange', function(e) {
		var valueChanged = false;

	    if (e.type=='propertychange') {
	        valueChanged = e.originalEvent.propertyName=='value';
	    } else {
	        valueChanged = true;
	    }
	    if (valueChanged) {
	        w = Number($(this).val());
			$('#widthLabel').html(w);
	    }
	});
	$('#heightSlider').on('input propertychange', function(e) {
		var valueChanged = false;

	    if (e.type=='propertychange') {
	        valueChanged = e.originalEvent.propertyName=='value';
	    } else {
	        valueChanged = true;
	    }
	    if (valueChanged) {
	        h = Number($(this).val());
			$('#heightLabel').html(h);
	    }
	});
	$('#voterSlider').on('input propertychange', function(e) {
		var valueChanged = false;

	    if (e.type=='propertychange') {
	        valueChanged = e.originalEvent.propertyName=='value';
	    } else {
	        valueChanged = true;
	    }
	    if (valueChanged) {
	        density = Number($(this).val()) / 100.0;
			$('#votersLabel').html(Math.round(density * 100) + '%');
	    }
	});
	$('#districtSlider').on('input propertychange', function(e) {
		var valueChanged = false;

	    if (e.type=='propertychange') {
	        valueChanged = e.originalEvent.propertyName=='value';
	    } else {
	        valueChanged = true;
	    }
	    if (valueChanged) {
	        numberOfDistricts = Number($(this).val());
			$('#districtCountLabel').html(numberOfDistricts);
	    }
	});
	$('#partySlider').on('input propertychange', function(e) {
		var valueChanged = false;

	    if (e.type=='propertychange') {
	        valueChanged = e.originalEvent.propertyName=='value';
	    } else {
	        valueChanged = true;
	    }
	    if (valueChanged) {
	        numberOfParties = Number($(this).val());
			$('#partiesLabel').html(numberOfParties);
	    }
	});

	$('#menuStart').click( function() {
		init();
	});

	$('#mainMenuButton').click( function() {
		window.location.reload();
	});

	$('#endTurnButton')
		.click( function() {
			endTurn();
		})
	;

	$('#undoButton')
		.click( function() {
			undo();
		})
	;

}

function init() {
	$('.gameMenu').hide();
	$('.container').show();

	if (numberOfParties == 1) {
		$("body").prepend('<div id="bigbrother"><h1>BIG BROTHER IS WATCHING</h1></div>');
		// need to shrink window.innerHeight by $('#bigbrother').height()
	}

	initpartycounts();
	initboard();
	initnodes(numberOfDistricts);
	initvoters(density);

	CalculateDistricts();
	game();
}

function drawChart(canvasId, pieData, pieColors) {
	var myCanvas = document.getElementById(canvasId);
	myCanvas.width = 100;
	myCanvas.height = 100;

	var ctx = myCanvas.getContext("2d");

	var myPiechart = new Piechart({
		canvas:myCanvas,
		data:pieData,
		colors:pieColors,
		doughnutHoleSize:0.75,
		doughnutHoleColor:"lightgrey"
	});
	myPiechart.draw();
}

function initboard() {
	var tileSize = getTileSize();

 	grid = [];
	var c = $('#tiles');
	for (var y = 0; y < h; y++) {
		var s = $('<section class="row">');
		s.height(tileSize + (2 * borderWidth));
		s.css({ margin: "0 auto", display: "table" });
		c.append(s);

		grid[y] = [];

		for (var x = 0; x < w; x++)	{
			var tile = $('<div id="' + getTileName(x, y) + '"></div>');

			tile
				.css({ float: "left" })
				.height(tileSize)
				.width(tileSize)
				.addClass("fadeOut")
				.bind('dragstart', function (event) { event.preventDefault() })
				.mouseover( function() {
					var info = getTileInfo($(this));
					
					// different district
					if (mouseoverDistrict != info.d && dragStartTile == null) {
						// set css background-color of whole district at once
						updateDistricts(info.d);
						updateDistricts(mouseoverDistrict);
					
						// thicker outline around current district
						enableDistrictOutlines(info.d, true);
						enableDistrictOutlines(mouseoverDistrict, false);

						mouseoverDistrict = info.d;

						updateVoterCounts(info.d);
					}

					// hovercolor only on border tiles
					if ($(this).hasAnyClass('topBorder bottomBorder leftBorder rightBorder')) {
						if (isDragging && dragStartTile != null)
							info = getTileInfo(dragStartTile);
						var hoverColor = 'lightgrey';
						if (info.p >= 0) hoverColor = parties[info.p].hoverColor;
						$(this).removeClass('fadeOut').addClass('fadeIn');
						$(this).css('background-color', hoverColor);
					}
				})
				.mouseleave( function() {
					var info = getTileInfo($(this));
					var districtName = '#EEEEEE';
					if (info.p >= 0) districtName = parties[info.p].districtName;
					$(this).removeClass('fadeIn').addClass('fadeOut');
					$(this).css('background-color', districtName);
				})
				.mousedown( function() {
					isDragging = false;
					dragStartTile = $(this);
					var info = getTileInfo($(this));

					// show available moves
					if (currentMove > 0) {
						var neighbors = getTileNeighbors(dragStartTile);
						neighbors.forEach( function(neighbor, index) {
							if (getTileInfo(neighbor).d != info.d) // don't add borders inside same district
								neighbor.addClass("topBorder bottomBorder leftBorder rightBorder");
						});
					}
				})
				.mousemove( function() {
					isDragging = true;
				})
				.mouseup( function() {
					var wasDragging = isDragging;
					var $this = $(this);
					var startinfo = getTileInfo(dragStartTile);
					var endinfo = getTileInfo($this);

					// reset available moves borders
					var neighborInfos = arrayMerge(getTileNeighbors(dragStartTile), getTileNeighbors($(this))).map( function(n) {
						return getTileInfo(n);
					});
					neighborInfos.forEach( function(info, index) {
						updateTileBordersFromInfo(info);
					});
					neighborInfos.forEach( function(info, index) {
						if (info.d == startinfo.d)
							enableDistrictOutlines(info.d, startinfo.d == endinfo.d);
					});

					if (currentMove == 0) {
						var moveCounter = $('#moveCounter');
						blinkCount = 5;
						blinkTimers.forEach(bt => clearInterval(bt));
						blinkTimers.push(setInterval(function() {
							setTimeout(function() {
								moveCounter.hide();
								setTimeout(function() {
									moveCounter.show();
									blinkCount--;
									if (blinkCount == 0)
										blinkTimers.forEach(bt => clearInterval(bt));
								}, blinkInterval);
							}, blinkInterval);
						}, blinkInterval * 2));
					}
					else if (wasDragging) {

						// only allow expanding to directly adjacent tiles
						var neighbors = getTileNeighbors($this);
						var isNeighbor = false;
						neighbors.forEach( function(neighbor, index) {
							var neighborInfo = getTileInfo(neighbor);
							if (neighborInfo.x == startinfo.x && neighborInfo.y == startinfo.y) {
								isNeighbor = true;
								return;
							}
						});

						if (isNeighbor && startinfo.d != endinfo.d) {
							undoStack.push({ startinfo: startinfo, endinfo: endinfo });

							currentMove--;
							performMove(startinfo, endinfo);
							enableDistrictOutlines(startinfo.d, true);
							enableDistrictOutlines(endinfo.d, false);
						}
					
					}

					isDragging = false;
					dragStartTile = null;
				})
			;

			s.append(tile);

			grid[y][x] = { district: -1	};
		}
		c.append('</section>');
	}
}

function initvoters(density) {
	var partyWeightSum = 0;
	parties.forEach(p => partyWeightSum += p.weight);

	// add all district nodes as voters
	// this ensures all districts have at least one voter
	districtNodes.forEach( function(districtNode, index) {
		var x = districtNode.x;
		var y = districtNode.y;
		var r = Math.random() * partyWeightSum;
		addVoter(x, y, r);
	});

	var z = (w * h * density) - districtNodes.length;
	for (var i = 0; i < z; i++) {
		var x = -1, y = -1;
		var found = voters.length == 0;
		do {
			// alert('initvoters' + i + '/' + voters.length);
			x = clamp(Math.floor(randn_bm(0, w * scale, 1) - w/scale), 0, w - 1);
			y = clamp(Math.floor(randn_bm(0, h * scale, 1) - h/scale), 0, h - 1);

			// make sure a voter doesn't aready live there
			// (only YOU can prevent voter fraud!)
			found = false;
			for (var j = 0; j < voters.length; j++) {
				if (voters[j].x == x && voters[j].y == y) {
					found = true;
					break;
				}
			}
		} while(found);

		var r = Math.random() * partyWeightSum;

		addVoter(x, y, r);
	}
}

function addVoter(x, y, r) {
	// var color = "";
	for (var j = 0; j < parties.length; j++) {
		if (r > parties[j].weight)
			r -= parties[j].weight;
		else {
			// color = parties[j].name;
			voters.push({ x: x, y: y, party:j });
			break;
		}
	}
}

function initnodes(numberOfDistricts) {
	for (var i = 0; i < numberOfDistricts; i++) {
		var x = -1, y = -1;
		var found = districtNodes.length == 0;
		do {
			// alert('initnodes' + i + '/' + districtNodes.length);
			x = clamp(Math.floor(Math.random() * w), 0, w - 1);
			y = clamp(Math.floor(Math.random() * h), 0, h - 1);

			// make sure no node already exists here
			found = false;
			for (var j = 0; j < districtNodes.length; j++) {
				if (districtNodes[j].x == x && districtNodes[j].y == y) {
					found = true;
					break;
				}
			}
		} while (found);

		districtNodes.push({ x: x, y: y });
	}
}

function initpartycounts() {
	parties = parties.slice(0, numberOfParties);
	var representativesCountDiv = $("#representativesCount");
	parties.forEach( function(party, index) {
		representativesCountDiv.append($('<span id="' + party.partyName + '-votercount"></span><br/>'));
	});
}

window.onload = main;
