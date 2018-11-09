
var w = 50;
var h = 50;
var scale = 2;
var density = 0.2;
var numberOfDistricts = 10;
var numberOfParties = 2;
var movesPerTurn = 5;
var districts = [];
var districtNodes = [];
var grid = [];
var parties = [
	// { partyName: "grey", weight: 0, districtName: "silver", hoverColor: "lightgrey" },
	{ partyName: "red", weight: 1, districtName: "pink", hoverColor: "lightcoral" },
	{ partyName: "blue", weight: 1, districtName: "lightblue", hoverColor: "dodgerblue" },
	{ partyName: "green", weight: 0.5, districtName: "palegreen", hoverColor: "lightgreen" }
];
var voters = [];
var districtCounts = [];
var isDragging = false;
var dragStartTile = null;
var currentMove = movesPerTurn;
var blinkTimers = [];
var blinkCount;
var blinkInterval = 125;

function main()
{
	$('.container').hide();

	updateMoveCounter();

	$('#widthSlider').on('input propertychange', function(e)
	{
		var valueChanged = false;

	    if (e.type=='propertychange') {
	        valueChanged = e.originalEvent.propertyName=='value';
	    } else {
	        valueChanged = true;
	    }
	    if (valueChanged) {
	        w = Number($(this).val());
	    }
	});
	$('#heightSlider').on('input propertychange', function(e)
	{
		var valueChanged = false;

	    if (e.type=='propertychange') {
	        valueChanged = e.originalEvent.propertyName=='value';
	    } else {
	        valueChanged = true;
	    }
	    if (valueChanged) {
	        h = Number($(this).val());
	    }
	});
	$('#voterSlider').on('input propertychange', function(e)
	{
		var valueChanged = false;

	    if (e.type=='propertychange') {
	        valueChanged = e.originalEvent.propertyName=='value';
	    } else {
	        valueChanged = true;
	    }
	    if (valueChanged) {
	        density = Number($(this).val()) / 100.0;
	    }
	});
	$('#districtSlider').on('input propertychange', function(e)
	{
		var valueChanged = false;

	    if (e.type=='propertychange') {
	        valueChanged = e.originalEvent.propertyName=='value';
	    } else {
	        valueChanged = true;
	    }
	    if (valueChanged) {
	        numberOfDistricts = Number($(this).val());
	    }
	});
	$('#partySlider').on('input propertychange', function(e)
	{
		var valueChanged = false;

	    if (e.type=='propertychange') {
	        valueChanged = e.originalEvent.propertyName=='value';
	    } else {
	        valueChanged = true;
	    }
	    if (valueChanged) {
	        numberOfParties = Number($(this).val());
	    }
	});

	$('#menuStart').click( function()
	{
		init();
	});

	$('#mainMenuButton').click( function()
	{
		window.location.reload();
	});

	$('#endTurnButton')
		// .disable()
		.click( function()
		{
			endTurn();
		})
	;
}

function init()
{
	$('.gameMenu').hide();
	$('.container').show();


	initpartycounts();
	initboard();
	initnodes(numberOfDistricts);
	initvoters(density);
	// updateVoterCounts($(getTileName(0,0)));

	CalculateDistricts();
	game();
}

function drawChart(canvasId, pieData, pieColors)
{
	var myCanvas = document.getElementById(canvasId);
	myCanvas.width = 100;
	myCanvas.height = 100;

	var ctx = myCanvas.getContext("2d");

	var myPiechart = new Piechart(
	{
		canvas:myCanvas,
		data:pieData,
		colors:pieColors,
		doughnutHoleSize:0.75,
		doughnutHoleColor:"lightgrey"
	});
	myPiechart.draw();
}

function initboard()
{
	var width = window.innerWidth / (w + 3);
	var height = window.innerHeight / (h + 3);
	var size = width < height ? width : height;

 	grid = [];
	var c = $('#tiles');
	for (var y = 0; y < h; y++)
	{
		var s = $('<section class="row">');
		s.height(size + 1);
		s.css({ margin: "0 auto", display: "table" });
		c.append(s);

		grid[y] = [];

		for (var x = 0; x < w; x++)
		{
			var tile = $('<div id="' + getTileName(x, y) + '"></div>');

			tile
				.css({ float: "left" })
				.height(size)
				.width(size)
				.mouseover( function() {
					var info = getTileInfo($(this));
					var hoverColor = 'lightgrey';
					if (info.p >= 0) hoverColor = parties[info.p].hoverColor;
					$(this).removeClass('fadeOut').addClass('fadeIn');
					$(this).css('background-color', hoverColor);
					updateVoterCounts($(this));
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
				})
				.mousemove( function() {
					isDragging = true;
				})
				.mouseup( function() {
				 	var wasDragging = isDragging;
					if (currentMove == 0)
					{
						var moveCounter = $('#moveCounter');
						blinkCount = 5;
						blinkTimers.forEach(bt => clearInterval(bt));
						blinkTimers.push(setInterval(function()
						{
							setTimeout(function()
							{
								moveCounter.hide();
								setTimeout(function()
								{
									moveCounter.show();
									blinkCount--;
									if (blinkCount == 0)
										blinkTimers.forEach(bt => clearInterval(bt));
								}, blinkInterval);
							}, blinkInterval);
						}, blinkInterval * 2));
					}
					else if (wasDragging) {
						var $this = $(this);
						var startinfo = getTileInfo(dragStartTile);
						var endinfo = getTileInfo($this);

						if (Math.abs(startinfo.x - endinfo.x) > 1 || Math.abs(startinfo.y - endinfo.y) > 1)
							return;

						// var d1 = grid[startinfo.y][startinfo.x].district;
						// var d2 = grid[endinfo.y][endinfo.x].district;
						var d1 = startinfo.d;
						var d2 = endinfo.d;

						if (d1 == d2) return;
						grid[endinfo.y][endinfo.x].district = d1;

						// update district colors
						// var p1 = districts[d1].party >= 0 ? parties[districts[d1].party].districtName : 'multipartisan';
						// var p2 = districts[d2].party >= 0 ? parties[districts[d2].party].districtName : 'multipartisan';
						var p1 = startinfo.p;
						var p2 = endinfo.p;
						// $(this).removeClass();
						// $(this).removeClass(p2);
						// $(this).addClass(p1);
						// $(this).attr("class", 'district' + d1);
						$this.removeClass('district' + d2);
						$this.addClass('district' + d1);

						// update district borders
						getTileNeighbors($this).forEach(t => updateTileBorders(t));
						getTileNeighbors(dragStartTile).forEach(t => updateTileBorders(t));

						// update district voter counts
						updateDistrictCounts();
						updateRepCounts(); // piechart
						// updateVoterCounts(dragStartTile, true);
						// alert('updateVoterCounts');
						updateVoterCounts($this, true);

						currentMove--;
						updateMoveCounter();
					}
					isDragging = false;
					dragStartTile = null;

				})
				// .click( function() { tileClick($(this)); })
			;

			s.append(tile);

			grid[y][x] = { district: -1	};
		}
		c.append('</section>');
	}
}

function initvoters(density)
{
	var partyWeightSum = 0;
	parties.forEach(p => partyWeightSum += p.weight);

	// add all district nodes as voters
	// this ensures all districts have at least one voter
	districtNodes.forEach( function(districtNode, index)
	{
		var x = districtNode.x;
		var y = districtNode.y;
		var r = Math.random() * partyWeightSum;
		addVoter(x, y, r);
	});

	var z = (w * h * density) - districtNodes.length;
	for (var i = 0; i < z; i++)
	{
		var x = -1, y = -1;
		var found = voters.length == 0;
		do {
			// alert('initvoters' + i + '/' + voters.length);
			x = clamp(Math.floor(randn_bm(0, w * scale, 1) - w/scale), 0, w - 1);
			y = clamp(Math.floor(randn_bm(0, h * scale, 1) - h/scale), 0, h - 1);

			// make sure a voter doesn't aready live there
			// (only YOU can prevent voter fraud!)
			found = false;
			for (var j = 0; j < voters.length; j++)
			{
				if (voters[j].x == x && voters[j].y == y)
				{
					found = true;
					break;
				}
			}
		} while(found);

		var r = Math.random() * partyWeightSum;

		addVoter(x, y, r);
	}
}

function addVoter(x, y, r)
{
	// var color = "";
	for (var j = 0; j < parties.length; j++)
	{
		if (r > parties[j].weight)
			r -= parties[j].weight;
		else
		{
			// color = parties[j].name;
			voters.push({ x: x, y: y, party:j });
			break;
		}
	}
}

function initnodes(numberOfDistricts)
{
	for (var i = 0; i < numberOfDistricts; i++)
	{
		var x = -1, y = -1;
		var found = districtNodes.length == 0;
		do {
			// alert('initnodes' + i + '/' + districtNodes.length);
			x = clamp(Math.floor(Math.random() * w), 0, w - 1);
			y = clamp(Math.floor(Math.random() * h), 0, h - 1);

			// make sure no node already exists here
			found = false;
			for (var j = 0; j < districtNodes.length; j++)
			{
				if (districtNodes[j].x == x && districtNodes[j].y == y)
				{
					found = true;
					break;
				}
			}
		} while (found);

		districtNodes.push({ x: x, y: y });
	}
}

function initpartycounts()
{
	parties = parties.slice(0, numberOfParties);
	var representativesCountDiv = $("#representativesCount");
	parties.forEach( function(party, index)
	{
		representativesCountDiv.append($('<span id="' + party.partyName + '-votercount"></span><br/>'));
	});
}

window.onload = main;
