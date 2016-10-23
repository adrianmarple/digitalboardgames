


app.controller('StartsWithController', function($scope) {

	var possibleCategories = [
		"Country or State",
		"Sports Team",
		"Food",
		"Car",
		"Color",
		"Piece of Clothing",
		"Material",
		"Shape",
		"Band",
		"Fictional Character",
		"Historical Figure",
		"Idiom",
	];
	var CATEGORIES_PER_ROUND = 10;
	var ROUND_DURATION = 5 * 60 * 1000;

	var gameRef = firebase.database().ref("games/idgoeshere/game");


	setUpGame($scope, gameRef, createNewGame);

	function createNewGame() {
		console.log("Creating new game.");
		var game = {
			rounds: [],
			isBetweenRounds: true,
		};
		return game;
	}

	$scope.startRound = function() {
		var round = {
			categories: possibleCategories.randomSubarray(CATEGORIES_PER_ROUND),
			startTime: new Date().getTime(),
		}
		$scope.game.rounds.push(round);
		$scope.game.isBetweenRounds = false;
		update(gameRef, $scope.game);
	};

	$scope.latestRound = function() {
		if (!$scope.game || $scope.game.rounds.length == 0) {
			return {};
		}
		return $scope.game.rounds[$scope.game.rounds.length - 1];
	};
});