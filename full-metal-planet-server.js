var http = require('http');
var url = require('url');
var queryString = require('querystring');

var fmpConstants = require('fmp-constants');
var referee = require('referee');
var player = require('player');
var piece = require('piece');

var ProcessAction = function(playerAction) {
	var actionReport;
	// console.log('Input playerAction: ' + JSON.stringify(playerAction));
	switch (playerAction.actionType.value) {
		case fmpConstants.PLAYER_ACTION_TYPE.MOVE.value:
			JSON.stringify(referee.validateMove(playerAction));
			actionReport = {
				success: false,
				errorMessages: ['Déplacement pas encore implémenté côté serveur']
			}
			break;
		case fmpConstants.PLAYER_ACTION_TYPE.LOAD.value:
			// return referee.validateLoad(playerAction);
			actionReport = {
				success: false,
				errorMessages: ['Chargement pas encore implémenté côté serveur']
			}
			break;
		case fmpConstants.PLAYER_ACTION_TYPE.UNLOAD.value:
			// return referee.validateUnload(playerAction);
			actionReport = {
				success: false,
				errorMessages: ['Déchargement pas encore implémenté côté serveur']
			}
			break;
		case fmpConstants.PLAYER_ACTION_TYPE.ATTACK.value:
			// return referee.validateAttack(playerAction);
			actionReport = {
				success: false,
				errorMessages: ['Attaque pas encore implémentée côté serveur']
			}
			break;
		case fmpConstants.PLAYER_ACTION_TYPE.END_OF_TURN.value:
			actionReport =  { success: true };
			break;
		default:
			console.log('Unknow playerAction: ' + JSON.stringify(playerAction));
			actionReport = {
				success: false, 
				errorMessages: ['Unknow playerActionType: ' + playerAction.actionType.value]
			}
			break;
	}
	return actionReport;
}

var ProcessResponse = function(actionReport, response) {
	response.writeHead(200, {"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"});
	if (actionReport != null) {
		console.log('actionReport: ' + JSON.stringify(actionReport));
		response.write(JSON.stringify(actionReport));
	} else {
		console.log('No action report to send...');
	}
  	response.end();
}

var RequestListener = function(request, response) {
	var operation = url.parse(request.url).pathname;
	console.log('operation: ' + operation);
	if (request.method == 'POST'
		&& operation == '/init') {
		console.log('/init operation called');
		request.on('data', function (data) {
			console.log(JSON.stringify(data));
		});
		request.on('end', function () {
			var randomCurrentMaree = Math.floor((Math.random() * 3));
			var randomNextMaree = Math.floor((Math.random() * 3));
			var datas = {
				tour: 0,
				tourPlayer: 0,
				tourPoints: 15,
				currentMaree: fmpConstants.MAREES[randomCurrentMaree],
				nextMaree: fmpConstants.MAREES[randomNextMaree],
				players: [
					// C'est très important que l'id des joueurs suive l'ordre de 
					// l'index du tableau car on les indexe par l'id ensuite
					// TODO N'utiliser que l'id comme identifiant
					new player.Player(0, 'Damien'),
					new player.Player(1, 'Noémie')
				],
				pieces: [
					new piece.Piece(1, fmpConstants.PIECE_TYPE.TANK, 2, 9), 
					new piece.Piece(1, fmpConstants.PIECE_TYPE.TANK, 3, 9), 
					// new Piece(2, 1, PIECE_TYPE.TANK, 2, 8), 
					new piece.Piece(0, fmpConstants.PIECE_TYPE.TANK, 5, 9), 
					new piece.Piece(0, fmpConstants.PIECE_TYPE.TANK, 6, 9), 
					new piece.Piece(0, fmpConstants.PIECE_TYPE.TANK, 6, 8), 
					new piece.Piece(0, fmpConstants.PIECE_TYPE.TANK, 7, 8),
					new piece.Piece(0, fmpConstants.PIECE_TYPE.TANK, 7, 7),
					new piece.Piece(1, fmpConstants.PIECE_TYPE.TANK, 33, 11),
					new piece.Piece(1, fmpConstants.PIECE_TYPE.TANK, 34, 12), 
					new piece.Piece(1, fmpConstants.PIECE_TYPE.TANK, 34, 13),
					new piece.Piece(0, fmpConstants.PIECE_TYPE.BARGE, 7, 9, fmpConstants.ORIENTATION.SO),
					new piece.Piece(1, fmpConstants.PIECE_TYPE.BARGE, 33, 12, fmpConstants.ORIENTATION.SO)
				]
			};
			// console.log('Partie datas: ' + JSON.stringify(datas));
			ProcessResponse(datas, response);
			return;
		});
	} else if (request.method == 'POST'
		&& operation == '/validate') {
		var body = '';
		request.on('data', function (data) {
			body += data; // body = body + data
			// 1e6 === 1 * Math.pow(10, 6) === 1 * 1000000 ~~~ 1MB
			if (body.length > 1e6) {
				// FLOOD ATTACK OR FAULTY CLIENT, NUKE REQUEST
				console.log('Potential flood request aborted');
				request.connection.destroy();
				return;
			}
        });
        request.on('end', function () {
        	console.log('playerAction: ' + body);
			var playerAction = JSON.parse(body);
            var actionReport = ProcessAction(playerAction);
            ProcessResponse(actionReport, response);
            return;
		});
	} else {
		response.writeHead(413, {"Content-Type": "application/json"});
	  	response.end();
	  	return;
	}
}

var server = http.createServer(RequestListener);
server.on('close', function() { // On écoute l'évènement close
    console.log('Bye bye !');
})
server.listen(8080);
