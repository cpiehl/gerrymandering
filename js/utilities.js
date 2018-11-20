
function getTileName(x, y)
{
	return 'tile-' + x + '-' + y;
}

function sleep(ms)
{
  return new Promise(resolve => setTimeout(resolve, ms));
}

function clamp(n, min, max)
{
  return Math.min(Math.max(n, min), max);
}

function titleCaseWord(txt)
{
    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
}

function randn_bm()
{
  var u = 0, v = 0;
  while(u === 0) u = Math.random(); //Converting [0,1) to (0,1)
  while(v === 0) v = Math.random();
  let num = Math.sqrt( -2.0 * Math.log( u ) ) * Math.cos( 2.0 * Math.PI * v );
  num = num / 10.0 + 0.5; // Translate to 0 -> 1
  if (num > 1 || num < 0) return randn_bm(); // resample between 0 and 1
  return num;
}

function randn_bm(min, max, skew)
{
  var u = 0, v = 0;
  while(u === 0) u = Math.random(); //Converting [0,1) to (0,1)
  while(v === 0) v = Math.random();
  let num = Math.sqrt( -2.0 * Math.log( u ) ) * Math.cos( 2.0 * Math.PI * v );

  num = num / 10.0 + 0.5; // Translate to 0 -> 1
  if (num > 1 || num < 0) num = randn_bm(min, max, skew); // resample between 0 and 1 if out of range
  num = Math.pow(num, skew); // Skew
  num *= max - min; // Stretch to fill range
  num += min; // offset to min
  return num;
}

function drawChart(canvasId, pieData) {
	var myCanvas = document.getElementById(canvasId);
	myCanvas.width = 100;
	myCanvas.height = 100;

	var myPiechart = new Piechart({
		canvas:myCanvas,
		data:pieData,
		doughnutHoleSize:0.75,
		doughnutHoleColor:"lightgrey"
	});
	myPiechart.draw();
}


function hsv2rgb(h, s, v) {
	var i = ~~(h * 6);
	var f = h * 6 - i;
	var p = v * (1 - s);
	var q = v * (1 - f * s);
	var t = v * (1 - (1 - f) * s);
	v = ~~(255 * v);
	p = ~~(255 * p);
	q = ~~(255 * q);
	t = ~~(255 * t);
	switch (i % 6) {
		case 0: return [v, t, p];
		case 1: return [q, v, p];
		case 2: return [p, v, t];
		case 3: return [p, q, v];
		case 4: return [t, p, v];
		case 5: return [v, p, q];
	}
}

function hsl2rgb(h, s, l) {
	var r, g, b;
  
	if (s == 0) {
	  r = g = b = l; // achromatic
	} else {
		function hue2rgb(p, q, t) {
			if (t < 0) t += 1;
			if (t > 1) t -= 1;
			if (t < 1/6) return p + (q - p) * 6 * t;
			if (t < 1/2) return q;
			if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
			return p;
		}

		var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
		var p = 2 * l - q;

		r = hue2rgb(p, q, h + 1/3);
		g = hue2rgb(p, q, h);
		b = hue2rgb(p, q, h - 1/3);
	}
  
	return [ r * 255, g * 255, b * 255 ];
  }

function rgb2css(rgb) {
	var r = ('00' + Math.round(rgb[0]).toString(16)).slice(-2);
	var g = ('00' + Math.round(rgb[1]).toString(16)).slice(-2);
	var b = ('00' + Math.round(rgb[2]).toString(16)).slice(-2);
	return '#' + r + g + b;
}

function rgbSaturation(rgb, sat) {
	var mat = saturatemat(ident, sat);
	return [mat[0][0], mat[1][1], mat[2][2]];
}

function nth(d) {
	if(d>3 && d<21) return 'th'; // thanks kennebec
	var digit = d;
	while (digit >= 10) digit = digit % 10;
	switch (digit) {
	    case 1:  return "st";
	    case 2:  return "nd";
	    case 3:  return "rd";
	    default: return "th";
	}
}

function getTileInfo(tile)
{
	// var tileid = tile.attr('id');
	var tileid = tile[0].id;
	var tileidsplit = tileid.split('-');
	var x = Number(tileidsplit[1]);
	var y = Number(tileidsplit[2]);
	var d = grid[y][x].district;
	var p = districts[d].party;
	return { x: x, y: y, d: d, p: p };
}

function getTileNeighbors(tile)
{
	var info = getTileInfo(tile);
	return getTileNeighborsFromInfo(info);
}

function getTileNeighborsFromInfo(info) {
	var tiles = [];
	if (info.x > 0) tiles.push($('#' + getTileName(info.x - 1, info.y)));
	if (info.y > 0) tiles.push($('#' + getTileName(info.x, info.y - 1)));
	if (info.x < w - 1) tiles.push($('#' + getTileName(info.x + 1, info.y)));
	if (info.y < h - 1) tiles.push($('#' + getTileName(info.x, info.y + 1)));

	return tiles;
}

function getPartyName(pIndex) {
	return pIndex == -1 ? 'Undecided' : parties[pIndex].partyName;
}

function getPartyColor(pIndex) {
	return pIndex == -1 ? '#EEEEEE' : parties[pIndex].partyColor;
}

function getDistrictColor(pIndex) {
	return pIndex == -1 ? '#EEEEEE' : parties[pIndex].districtColor;
}

function getVoterInfo(tile) {
	// only two weeks and i've already created voter ids...
	var voterid = $(tile).find('.voter')[0].id;
	var voteridsplit = voterid.split('-');
	var x = Number(voteridsplit[1]);
	var y = Number(voteridsplit[2]);
	var d = grid[y][x].district;
	var p = voters[grid[y][x].voter].party;
	return { x: x, y: y, d: d, p: p };
}

// function getDistrictVoters(d) {
// 	var districtVoters = [];
// 	for(var i = 0; i < parties.length; i++)
// 		districtVoters.push(0);
// 	voters.forEach( function(voter, index) {
// 		districtVoters[voter.party]++;
// 	});
// 	return districtVoters;
// }

$.fn.hasAnyClass = function() {
    for (var i = 0; i < arguments.length; i++) {
        var classes = arguments[i].split(" ");
        for (var j = 0; j < classes.length; j++) {
            if (this.hasClass(classes[j])) {
                return true;
            }
        }
    }
    return false;
}

function arrayMax(arr) {
	return arr.reduce(function(a, b) {
		return Math.max(a, b);
	});
}

function arrayMerge(a, b) {
	return a.concat(b.filter(function (item) {
	    return a.indexOf(item) < 0;
	}));
}

function getTileSize() {
	var tileWidth = ((window.innerWidth - 15) / w) - (2 * borderWidth);
	var tileHeight = ((window.innerHeight - 15) / h) - (2 * borderWidth);
	return (tileWidth < tileHeight ? tileWidth : tileHeight) - (2 * outlineWidth);
}
