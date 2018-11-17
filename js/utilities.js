
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

function drawArc(ctx, centerX, centerY, radius, startAngle, endAngle)
{
	ctx.beginPath();
	ctx.arc(centerX, centerY, radius, startAngle, endAngle);
	ctx.stroke();
}

function drawPieSlice(ctx,centerX, centerY, radius, startAngle, endAngle, color ){
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(centerX,centerY);
    ctx.arc(centerX, centerY, radius, startAngle, endAngle);
    ctx.closePath();
    ctx.fill();
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
	var tileid = tile.attr('id');
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

function getPartyName(pIndex)
{
	if (pIndex == -1) return 'multipartisan';
	return parties[pIndex].partyName;
}

function getDistrictName(pIndex)
{
	if (pIndex == -1) return 'multipartisan';
	return parties[pIndex].districtName;
}

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
