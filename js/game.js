

function game()
{
	var currentTurnPartyName = titleCaseWord(parties[currentTurn].partyName);
	$('#currentTurnLabel')
		.html(currentTurnPartyName + "'s Turn")
		.css("color", currentTurnPartyName)
	;
	// CalculateDistricts();
	DrawDistricts();

	return true;
}

function DrawDistricts()
{
	var width = window.innerWidth / (w + 3);
	var height = window.innerHeight / (h + 3);
	var size = width < height ? width : height;

	grid.forEach( function (row, y)
	{
		row.forEach( function (cell, x)
		{
			var d = grid[y][x].district;
			if (typeof districts[d] === 'undefined')
			{
				debugger;
				return;
			}
			var p = districts[d].party;

			var tile = $('#' + getTileName(x, y));

			var districtName = '#EEEEEE';
			if (p >= 0)
				districtName = parties[p].districtName;

			tile
				.addClass('district' + d)
				.css("background-color", districtName)
			;

			updateTileBorders(tile);
		});
	});

	// districtNodes.forEach( function(node, index)
	// {
	// 	var x = node.x;
	// 	var y = node.y;
	// 	var tile = $('#' + getTileName(x, y));
	// 	tile.addClass('districtNode');
	// });

	voters.forEach( function (voter, index)
	{
		var x = voter.x;
		var y = voter.y;
		var partyName = parties[voter.party].partyName;
		var tileName = getTileName(x, y);
		var tile = $('#' + tileName);
		$('#' + tileName + '-voter').remove();
			// .empty()
			// .addClass(party)
			// .html('<ul><li></li></ul>')
		tile.append($('<div id="' + tileName + '-voter"></div>')
			.addClass(partyName)
			.height(size - 2)
			.width(size - 2)
		);
	});

	updateRepCounts();
}

// currently only updates the piechart, text labels later
function updateRepCounts()
{
	var pieData = {};
	var pieColors = [];
	districts.forEach( function(district, index)
	{
		if (district.party == -1 || typeof parties[district.party] === 'undefined')
			return;

		var districtPartyName = parties[district.party].partyName;

		if (typeof pieData[districtPartyName] === 'undefined')
		{
			pieData[districtPartyName] = 0;
			pieColors.push(districtPartyName);
		}

		pieData[districtPartyName]++;
	});
	// debugger;
	drawChart("canvas", pieData, pieColors);
}

function updateTileBorders(tile)
{
	// var tile = $('#' + getTileName(x, y));
	var info = getTileInfo(tile);
	var x = info.x;
	var y = info.y;
	// var d = grid[y][x].district;
	var d = info.d;

	// tile.removeClass('topBorder bottomBorder leftBorder rightBorder');
	if (y > 0 && grid[y-1][x].district != d)
		tile.addClass('topBorder');
	else
		tile.removeClass('topBorder');

	if (y < h-1 && grid[y+1][x].district != d)
		tile.addClass('bottomBorder');
	else
		tile.removeClass('bottomBorder');

	if (x > 0 && grid[y][x-1].district != d)
		tile.addClass('leftBorder');
	else
		tile.removeClass('leftBorder');

	if (x < w-1 && grid[y][x+1].district != d)
		tile.addClass('rightBorder');
	else
		tile.removeClass('rightBorder');
}

var mouseoverDistrict = -1;
function updateVoterCounts(tile, force)
{
	force = force || false;
	var info = getTileInfo(tile);
	var x = info.x;
	var y = info.y;

	// var districtIndex = grid[y][x].district;
	var districtIndex = info.d;
	if (!force && mouseoverDistrict == districtIndex) return;

	// set css background-color of whole district at once
	updateDistricts(districtIndex);
	updateDistricts(mouseoverDistrict);

	mouseoverDistrict = districtIndex;

	parties.forEach( function(party, index)
	{
		var count = 0;
		if (typeof districtCounts[districtIndex][index] !== 'undefined')
			count = districtCounts[districtIndex][index];
		$('#' + party.partyName + '-votercount')
			.html('<h1>' + count + '</h1>' + titleCaseWord(party.partyName) + ' Voters')
		;
	});

	$('#districtLabel').html(districtIndex + nth(districtIndex) + ' District');

}

// set css background-color of whole district at once
function updateDistricts(d)
{
	if (d == -1) return;
	var backgroundColor = "#EEEEEE";
	var p = districts[d].party;
	if (p >= 0)
		backgroundColor = parties[p].districtName;
	$('.district' + d).css("background-color", backgroundColor);
}

function updateDistrictCounts()
{
	// voter count per party per district
	districtCounts = [];
	for (var p = 0; p < voters.length; p++)
	{
		var x = voters[p].x;
		var y = voters[p].y;
		var party = voters[p].party;
		var district = grid[y][x].district;

		if (typeof districtCounts[district] === 'undefined')
			districtCounts[district] = [];
		if (typeof districtCounts[district][party] === 'undefined')
			districtCounts[district][party] = 0;

		districtCounts[district][party]++;
	}

	districts = [];
	for (var i = 0; i < districtCounts.length; i++)
	{
		var biggerParty = -1;
		var biggerPartyCount = -1;
		if (typeof districtCounts[i] !== 'undefined')
		{
			for (var j = 0; j < districtCounts[i].length; j++)
			{
				if (districtCounts[i][j] == biggerPartyCount)
					biggerParty = -1;
				if(districtCounts[i][j] > biggerPartyCount)
				{
					biggerPartyCount = districtCounts[i][j];
					biggerParty = j;
				}
			}
		}
		districts[i] = { party: biggerParty };
	}
}

function tileClick(tile)
{

}

function updateMoveCounter()
{
	$('#moveCounter').html(currentMove);
}

function CalculateDistricts()
{
	// crappy voronoi
	for (var y1 = 0; y1 < h; y1++)
	{
		for (var x1 = 0; x1 < w; x1++)
		{
			// districtCounts[i].push([]);
			var minDistance = w + h;
			for (var i = 0; i < districtNodes.length; i++)
			{
				var x2 = districtNodes[i].x;
				var y2 = districtNodes[i].y;
				var d = Math.abs(x1 - x2) + Math.abs(y1 - y2); // manhattan distance
				if (d < minDistance)
				{
					minDistance = d;
					grid[y1][x1].district = i;
					// districtCounts[i][];
				}
			}
		}
	}

	updateDistrictCounts();

	// debugger;


}

var currentTurn = 0;
function endTurn()
{
	// cycle party index
	currentTurn++;
	if (currentTurn >= parties.length)
		currentTurn = 0;

	// reset number of moves
	currentMove = movesPerTurn;
	updateMoveCounter();

	// restart game loop
	game();
}
