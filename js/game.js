

function game() {
	undoStack = [];
	$('#undoButton').prop("disabled", true);

	var currentTurnPartyName = parties[currentTurn].partyName;
	var currentTurnPartyColor = parties[currentTurn].partyColor;
	$('#currentTurnLabel')
		.html(currentTurnPartyName + "'s Turn")
		.css("color", currentTurnPartyColor)
		;

	DrawDistricts();

	if (playerVsAi && currentMove > 0 && currentTurn >= numberOfPlayers) {
		var intervalId = setInterval(function () {
			// while (playerVsAi && currentTurn > 0 && currentMove > 0) {
			if (currentMove == 0 || currentTurn < numberOfPlayers || !aiMove()) {
				clearInterval(intervalId);
				endTurn();
			}
		}, 1000);
	}

	return true;
}

function performMove(startinfo, endinfo) {
	var d1 = startinfo.d;
	var d2 = endinfo.d;
	$this = $('#' + getTileName(endinfo.x, endinfo.y));
	grid[endinfo.y][endinfo.x].district = d1;

	// update district colors
	// var p1 = startinfo.p;
	// var p2 = endinfo.p;
	$this.removeClass('district' + d2);
	$this.addClass('district' + d1);

	// update district borders
	updateTileBordersFromInfo(endinfo);
	updateTileBordersFromInfo(startinfo);
	getTileNeighborsFromInfo(endinfo).forEach(t => updateTileBorders(t));
	getTileNeighborsFromInfo(startinfo).forEach(t => updateTileBorders(t));

	// update district voter counts
	updateDistrictCounts();
	updateRepCounts(); // piechart
	updateVoterCounts(endinfo.d);
	updateVoterCounts(startinfo.d);
	updateMoveCounter();

	// set css background-color of whole district at once
	updateDistricts(startinfo.d);
	updateDistricts(endinfo.d);

	$('#undoButton').prop("disabled", undoStack.length == 0);
}

function undo() {
	if (undoStack.length > 0) {
		var lastMove = undoStack.pop();
		// reverse move by swapping location but keeping party/district
		var startinfo = { x: lastMove.endinfo.x, y: lastMove.endinfo.y, d: lastMove.startinfo.d, p: lastMove.startinfo.p };
		var endinfo = { x: lastMove.startinfo.x, y: lastMove.startinfo.y, d: lastMove.endinfo.d, p: lastMove.endinfo.p };

		// reset available moves borders
		var neighborInfos = arrayMerge(getTileNeighborsFromInfo(startinfo), getTileNeighborsFromInfo(endinfo)).map(function (n) {
			return getTileInfo(n);
		});
		neighborInfos.forEach(function (info, index) {
			updateTileBordersFromInfo(info);
		});
		neighborInfos.forEach(function (info, index) {
			if (info.d == startinfo.d)
				enableDistrictOutlines(info.d, startinfo.d == endinfo.d);
		});

		enableDistrictOutlines(startinfo.d, false);
		enableDistrictOutlines(endinfo.d, false);

		currentMove++;
		performMove(endinfo, startinfo);

		if (mouseoverDistrict == startinfo.d) enableDistrictOutlines(startinfo.d, true);
		if (mouseoverDistrict == endinfo.d) enableDistrictOutlines(endinfo.d, true);
	}
}

function DrawDistricts() {
	var tileSize = getTileSize();

	grid.forEach(function (row, y) {
		row.forEach(function (cell, x) {
			var d = grid[y][x].district;
			if (typeof districts[d] === 'undefined') {
				debugger;
				return;
			}
			var p = districts[d].party;

			var tile = $('#' + getTileName(x, y));

			tile
				.addClass('district' + d)
				.css("background-color", p == -1 ? '#EEEEEE' : parties[p].districtColor)
				;

			// updateTileBorders(tile);
			updateTileBordersFromInfo({ x: x, y: y, d: d, p: p });
		});
	});

	// highlight district's voronoi nodes
	// districtNodes.forEach( function(node, index)
	// {
	// 	var x = node.x;
	// 	var y = node.y;
	// 	var tile = $('#' + getTileName(x, y));
	// 	tile.addClass('districtNode');
	// });

	voters.forEach(function (voter, index) {
		var x = voter.x;
		var y = voter.y;
		var partyColor = getPartyColor(voter.party);
		var tileName = getTileName(x, y);
		var tile = $('#' + tileName);
		$('#' + tileName + '-voter').remove();

		tile.append($('<div id="' + tileName + '-voter"></div>')
			.addClass('voter')
			.height(tileSize - (4 * outlineWidth)) //
			.width(tileSize - (4 * outlineWidth)) // - 2
			.css("background-color", partyColor)
		);
	});

	updateRepCounts();
}

// currently only updates the piechart, text labels later
function updateRepCounts() {
	var pieData = {};
	districts.forEach(function (district, index) {
		var districtPartyName = getPartyName(district.party);
		var districtPartyColor = getPartyColor(district.party);

		if (typeof pieData[districtPartyName] === 'undefined') {
			pieData[districtPartyName] = {}
			pieData[districtPartyName].count = 0;
			pieData[districtPartyName].color = districtPartyColor;
		}
		pieData[districtPartyName].count++;
	});
	drawChart("canvas", pieData);
}

function updateTileBorders(tile) {
	var info = getTileInfo(tile);
	updateTileBordersFromInfo(info);
}

function updateTileBordersFromInfo(info) {
	var tile = $('#' + getTileName(info.x, info.y));
	var x = info.x;
	var y = info.y;
	var d = info.d;

	if (y > 0 && grid[y - 1][x].district != d)
		tile.addClass('topBorder');
	else
		tile.removeClass('topBorder');
	if (y < h - 1 && grid[y + 1][x].district != d)
		tile.addClass('bottomBorder');
	else
		tile.removeClass('bottomBorder');

	if (x > 0 && grid[y][x - 1].district != d)
		tile.addClass('leftBorder');
	else
		tile.removeClass('leftBorder');

	if (x < w - 1 && grid[y][x + 1].district != d)
		tile.addClass('rightBorder');
	else
		tile.removeClass('rightBorder');
}

function updateVoterCounts(districtIndex) {
	parties.forEach(function (party, index) {
		var count = 0;
		if (typeof districtCounts[districtIndex] !== 'undefined' && typeof districtCounts[districtIndex][index] !== 'undefined')
			count = districtCounts[districtIndex][index];
		$('#party-' + index + '-votercount').html(count);
	});

	$('#districtLabel').html(districtIndex + nth(districtIndex) + ' District');
}

function enableDistrictOutlines(districtIndex, enable) {
	var dname = '.district' + districtIndex;
	if (enable) {
		$('.topBorder' + dname).addClass('topOutline');
		$('.bottomBorder' + dname).addClass('bottomOutline');
		$('.leftBorder' + dname).addClass('leftOutline');
		$('.rightBorder' + dname).addClass('rightOutline');
	} else {
		$(dname).removeClass('topOutline bottomOutline leftOutline rightOutline');
	}
}

// set css background-color of whole district at once
function updateDistricts(d) {
	if (d == -1) return;
	var p = districts[d].party;
	$('.district' + d).css("background-color", p >= 0 ? parties[p].districtColor : "#EEEEEE");
}

function updateDistrictCounts() {
	// voter count per party per district
	// districtCounts = numberOfDistricts * [ parties.length * [] ]
	districtCounts = Array.apply(null, Array(numberOfDistricts)).map(function (d, i) {
		return Array.apply(null, Array(parties.length)).map(function (p, j) {
			return 0;
		});
	});

	for (var p = 0; p < voters.length; p++) {
		var x = voters[p].x;
		var y = voters[p].y;
		var party = voters[p].party;
		var district = grid[y][x].district;

		districtCounts[district][party]++;
	}

	districts = [];
	for (var i = 0; i < districtCounts.length; i++) {
		var biggerParty = -1;
		var biggerPartyCount = -1;
		if (typeof districtCounts[i] !== 'undefined') {
			for (var j = 0; j < districtCounts[i].length; j++) {
				if (districtCounts[i][j] == biggerPartyCount)
					biggerParty = -1;
				if (districtCounts[i][j] > biggerPartyCount) {
					biggerPartyCount = districtCounts[i][j];
					biggerParty = j;
				}
			}
		}
		districts[i] = { party: biggerParty };
	}
}

function updateMoveCounter() {
	$('#moveCounter').html(currentMove);
}

function CalculateDistricts() {
	// crappy voronoi
	for (var y1 = 0; y1 < h; y1++) {
		for (var x1 = 0; x1 < w; x1++) {
			var minDistance = w + h;
			for (var i = 0; i < districtNodes.length; i++) {
				var x2 = districtNodes[i].x;
				var y2 = districtNodes[i].y;
				var d = Math.abs(x1 - x2) + Math.abs(y1 - y2); // manhattan distance
				if (d < minDistance) {
					minDistance = d;
					grid[y1][x1].district = i;
				}
			}
		}
	}

	updateDistrictCounts();
}

var currentTurn = 0;
function endTurn() {
	// cycle party index
	currentTurn++;
	if (currentTurn >= parties.length)
		currentTurn = 0;

	// reset number of moves
	currentMove = movesPerTurn;
	updateMoveCounter();

	// stop moveCounter blinker
	blinkTimers.forEach(bt => clearInterval(bt));

	// restart game loop
	return game();
}
