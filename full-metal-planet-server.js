var http = require('http');
var url = require('url');
var queryString = require('querystring');

var fmpConstants = require('fmp-constants').fmpConstants;
// var referee = require('referee');
var Player = require('player').Player;
var Piece = require('piece').Piece;
var plateau = require('plateau').getPlateau();
var tools = require('tools').tools;
var fmpCaseService = require('case').fmpCaseService;
var Partie = require('partie').Partie;
var Referee = require('referee').Referee;
var Engine = require('engine').Engine;
var partie = null;
var referee = null;
var engine = null;

var ProcessAction = function(playerAction) {
	if (partie == null) {
		console.log('ERREUR: Impossible de traiter les actions tant qu\'une partie n\'est pas créée. http://localhost:8080/init');
		return null;
	}
	console.log('current player: ' + JSON.stringify(partie.getPlayer()));

	var actionReport = referee.validatePlayerAction(playerAction, null);
	if (actionReport.success) {
		engine.applyPlayerAction(playerAction);
	}
	return actionReport;
}

var ProcessPartieInitialisation = function() {
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
			new Player(0, 'Damien'),
			new Player(1, 'Noémie')
		],
		pieces: [
			new Piece(1, fmpConstants.PIECE_TYPE.TANK, 2, 9), 
			new Piece(1, fmpConstants.PIECE_TYPE.TANK, 3, 9), 
			// new Piece(2, 1, PIECE_TYPE.TANK, 2, 8), 
			new Piece(0, fmpConstants.PIECE_TYPE.TANK, 5, 9), 
			new Piece(0, fmpConstants.PIECE_TYPE.TANK, 6, 9), 
			new Piece(0, fmpConstants.PIECE_TYPE.TANK, 6, 8), 
			new Piece(0, fmpConstants.PIECE_TYPE.TANK, 7, 8),
			new Piece(0, fmpConstants.PIECE_TYPE.TANK, 7, 7),
			new Piece(1, fmpConstants.PIECE_TYPE.TANK, 33, 11),
			new Piece(1, fmpConstants.PIECE_TYPE.TANK, 34, 12), 
			new Piece(1, fmpConstants.PIECE_TYPE.TANK, 34, 13),
			new Piece(0, fmpConstants.PIECE_TYPE.BARGE, 7, 9, fmpConstants.ORIENTATION.SO),
			new Piece(1, fmpConstants.PIECE_TYPE.BARGE, 33, 12, fmpConstants.ORIENTATION.SO)
		]
	};
	partie = new Partie(fmpConstants, datas, plateau, tools, fmpCaseService);
	referee = new Referee(fmpConstants, partie, tools);
    engine = new Engine(fmpConstants, partie, tools);
	console.log('partie: ' + JSON.stringify(partie.getPlayer()));
	return datas;
}

var ProcessResponse = function(object, response) {
	response.writeHead(200, {"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"});
	if (object != null) {
		console.log('response: ' + JSON.stringify(object));
		response.write(JSON.stringify(object));
	} else {
		console.log('No response to send...');
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
			var datas = ProcessPartieInitialisation();
			console.log('partie datas: ' + JSON.stringify(datas));
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

var initPartie = function() {
	
}

var server = http.createServer(RequestListener);
server.on('close', function() { // On écoute l'évènement close
    console.log('Bye bye !');
})
server.listen(8080);
