
// Something functional for now
// Order of conditions:
// 	1: Try to flip any undecided districts
//		a: Shrink to exclude other-party voters
//		b: Expand to include same-party voters
//	2: Try to flip other-party districts to undecided
//	3: If still no move found, getTileNeighbors of all borderVoterTiles
//		a: Increment lookAhead counter, upto some max N
//		b: Go to Step 1

function aiMove() {
	var borderVoterTiles = $('.voter').parent().filter(function() {
		return $(this).hasAnyClass('topBorder bottomBorder leftBorder rightBorder');
	});

	var startinfo;
	var endinfo;
	var aiMoveDecided = false;

	// try to flip undecided districts first, since they only require one move
	borderVoterTiles.each(function(index, voterTile) {
		var voterTileInfo = getTileInfo([voterTile]);
		var voterInfo = getVoterInfo(voterTile);

		// shrink to exclude other-party voters neighboring undecided districts
		if (voterTileInfo.p == -1 && voterInfo.p != currentTurn) {
			var districtVoters = districtCounts[voterTileInfo.d][currentTurn];
			var neighbors = getTileNeighborsFromInfo(voterTileInfo);
			neighbors.forEach(function(neighbor, j) {
				var neighborInfo = getTileInfo(neighbor);
				if (neighborInfo.d == voterTileInfo.d) return true; // filter out same district
				if (neighborInfo.p == -1) return true; // filter out other undecided districts
				// var neighborVoterCounts = districtCounts[neighborInfo.d];
				// var neighborCurrentPartyCount = neighborVoterCounts[currentTurn];
				// var neighborVoterCountsMax = arrayMax(neighborVoterCounts);
				// if (neighborCurrentPartyCount != neighborVoterCountsMax) return true; // filter out other-party districts if they are winning, not undecided
				
				// neighborVoterCounts.sort();
				// if (neighborVoterCounts.length > 1 && neighborVoterCounts[0] < neighborVoterCounts[1] + 2) return true;

				startinfo = neighborInfo;
				endinfo = voterTileInfo;
				aiMoveDecided = true;
				return false;
			});
		}

		// expand to include same-party voters inside other-party districts
		if (!aiMoveDecided && voterTileInfo.p != -1 && voterInfo.p == currentTurn) {
			var districtVoters = districtCounts[voterTileInfo.d][currentTurn];
			var neighbors = getTileNeighborsFromInfo(voterTileInfo);
			neighbors.forEach(function(neighbor, j) {
				var neighborInfo = getTileInfo(neighbor);
				if (neighborInfo.d == voterTileInfo.d) return true; // filter out same district
				if (neighborInfo.p != -1) return true; // filter out other undecided districts
				// var neighborVoterCounts = districtCounts[neighborInfo.d];
				// var neighborCurrentPartyCount = neighborVoterCounts[currentTurn];
				// var neighborVoterCountsMax = arrayMax(neighborVoterCounts);
				// if (neighborCurrentPartyCount != neighborVoterCountsMax) return true; // filter out other-party districts if they are winning, not undecided
				
				// neighborVoterCounts.sort();
				// if (neighborVoterCounts.length > 1 && neighborVoterCounts[0] < neighborVoterCounts[1] + 2) return true;

				startinfo = neighborInfo;
				endinfo = voterTileInfo;
				aiMoveDecided = true;
				return false;
			});
		}

		if (aiMoveDecided) {
			for (var i = 0; i < undoStack.length; i++) {
				var lastMove = undoStack[i];
				if (lastMove.endinfo.x == endinfo.x && lastMove.endinfo.y == endinfo.y) {
					aiMoveDecided = false;
					debugger;
					break;
				}
			}
		}

		return !aiMoveDecided;
	});

	if (!aiMoveDecided) {
		return false;
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


function aiMove2() {
	var borderVoterTiles = $('.voter').parent().filter(function() {
		return $(this).hasAnyClass('topBorder bottomBorder leftBorder rightBorder');
	});

	var startinfo;
	var endinfo;
	var aiMoveDecided = false;
	var moveChoices = [];

	borderVoterTiles.each(function(index, voterTile) {
		var voterTileInfo = getTileInfo([voterTile]);
		var voterInfo = getVoterInfo(voterTile);

		var neighbors = getTileNeighborsFromInfo(voterTileInfo);
		neighbors.forEach(function(neighbor, j) {
			var neighborInfo = getTileInfo(neighbor);
			if (neighborInfo.d == voterTileInfo.d) return true; // filter out same district

			for (var i = 0; i < undoStack.length; i++) {
				var lastMove = undoStack[i];
				if (lastMove.endinfo.x == voterTileInfo.x && lastMove.endinfo.y == voterTileInfo.y) {
					return true;
				}
			}

			var score = 1; // Golf scoring

			// If flips same-party district to undecided, +1 score

			// If flips undecided party to other-party, +2 score

			// Add difference in voters to score
			

			moveChoices.push({ startinfo:neighborInfo, endinfo: voterTileInfo, score: score});
		});
	});

	if (moveChoices.length == 0) {
		return false;
	}

	// var r = Math.floor(Math.random() * moveChoices.length);
	// startinfo = moveChoices[r].startinfo;
	// endinfo = moveChoices[r].endinfo;

	moveChoices.sort(function(a, b) { return a.score - b.score; });
	startinfo = moveChoices[0].startinfo;
	endinfo = moveChoices[0].endinfo;

	debugger;

	enableDistrictOutlines(startinfo.d, false);
	enableDistrictOutlines(endinfo.d, false);

	undoStack.push({ startinfo: startinfo, endinfo: endinfo });
	currentMove--;
	performMove(startinfo, endinfo);

	enableDistrictOutlines(endinfo.d, true);
	setTimeout(function() { enableDistrictOutlines(endinfo.d, false); }, 1000);

	return true;
}