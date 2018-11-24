

function aiMove() {

	var scoreDebug = false;

	// $('.voter').html('');
	var borderVoterTiles = $('.voter').parent().filter(function() {
		$(this).find('span').remove();
		return $(this).hasAnyClass('topBorder bottomBorder leftBorder rightBorder');
	});

	var startinfo;
	var endinfo;
	var moveChoices = [];

	borderVoterTiles.each(function(index, voterTile) {
		this.voterTileInfo = getTileInfo([voterTile]);
		this.voterInfo = getVoterInfo(voterTile);
		this.voterScore = getDistrictScore(this.voterTileInfo, this.voterInfo.p);

		var neighbors = getTileNeighborsFromInfo(this.voterTileInfo);
		neighbors.forEach(function(neighbor, j) {
			var neighborInfo = getTileInfo(neighbor);
			if (neighborInfo.d == this.voterTileInfo.d) return true; // filter out same district

			// try to prevent getting stuck in a loop
			for (var i = 0; i < undoStack.length; i++) {
				var lastMove = undoStack[i];
				if (lastMove.endinfo.x == this.voterTileInfo.x && lastMove.endinfo.y == this.voterTileInfo.y) {
					return true; // continue forEach
				}
			}

			var score = getDistrictScore(neighborInfo, this.voterInfo.p);
			var compositeScore = score - this.voterScore;
			
			moveChoices.push({ startinfo:neighborInfo, endinfo: this.voterTileInfo, score: compositeScore });
		}, this);
	});

	if (moveChoices.length == 0) {
		return false;
	}

	// randomly choose from the top scoring choices
	moveChoices.sort(function(a, b) { return b.score - a.score; });
	var bestScore = moveChoices[0].score;
	moveChoices = moveChoices.filter( function(choice) {
		return choice.score == bestScore;
	});

	if (scoreDebug) {
		moveChoices.forEach( function (choice, index) {
			var tile = $('#' + getTileName(choice.endinfo.x, choice.endinfo.y));
			tile.find('span').remove();
			tile.append($('<span>' + choice.score.toFixed(1) + '</span>'));
			tile.find('.voter').css('border', 'solid 2px black');
		});
	}

	debugger;
	
	if (moveChoices.length == 0) {
		return false;
	}

	var randomIndex = Math.floor(rand()*moveChoices.length);
	startinfo = moveChoices[randomIndex].startinfo;
	endinfo = moveChoices[randomIndex].endinfo;

	if (scoreDebug) {
		moveChoices.forEach( function (choice, index) {
			var tile = $('#' + getTileName(choice.endinfo.x, choice.endinfo.y));
			tile.find('.voter').css('border', '');
			tile.find('span').remove();
		});
	}

	enableDistrictOutlines(startinfo.d, false);
	enableDistrictOutlines(endinfo.d, false);

	undoStack.push({ startinfo: startinfo, endinfo: endinfo });
	currentMove--;
	performMove(startinfo, endinfo);

	enableDistrictOutlines(endinfo.d, true);
	setTimeout(function() { enableDistrictOutlines(endinfo.d, false); }, 1000);

	return true;
}

// 
function getDistrictScore(tileInfo, pIndex) {
	var z = 10;
	var x = 0; // tied default value
	if (tileInfo.p == pIndex) { // winning district
		var max = 0;
		var next = 0;
		try {
			var sorted = districtCounts[tileInfo.d].slice(0);
			sorted.sort(function(a, b){return b-a}); // descending
			max = sorted[0]; // set this first
			next = sorted[1]; // if this fails, x = max - 0
		}
		catch (e) {}
		x = max - next; // differential to second place
	} else if (tileInfo.p != -1) { // losing district
		x = arrayMax(districtCounts[tileInfo.d]) - districtCounts[tileInfo.d][pIndex]; // differential from first place
	}

	var y = (x == 0 || x == NaN) ? z : (z / x);

	return (pIndex != currentTurn) ? 1-y : y;
}
