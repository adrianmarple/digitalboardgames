


app.controller('StartsWithController', function($scope, $interval) {

  var POSSIBLE_CATEGORIES = [
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
  var POSSIBLE_STARTING_LETTERS = [
    "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "p", "r", "s", "t", "w",
  ];
  var CATEGORIES_PER_ROUND = 10;
  var ROUND_DURATION = 1 * 10 * 1000;

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
      startingLetter: POSSIBLE_STARTING_LETTERS.randomElement(),
      categories: POSSIBLE_CATEGORIES.randomSubarray(CATEGORIES_PER_ROUND),
      startTime: new Date().getTime(),
      timeExpired: false,
    }
    $scope.game.rounds.unshift(round);
    $scope.game.isBetweenRounds = false;
    update();
  };

  // $scope.latestRound = function() {
  //   if (!$scope.game || $scope.game.rounds.length == 0) {
  //     return {};
  //   }
  //   return $scope.game.rounds[$scope.game.rounds.length - 1];
  // };

  $scope.timerString = "";
  var setTimerString = function() {
    if (!$scope.game || !$scope.game.rounds[0]) {
      $scope.timerString = "";
      return;
    }
    var timeElapsed = new Date().getTime() - $scope.game.rounds[0].startTime;
    if (timeElapsed > ROUND_DURATION) {
      $scope.timerString = "";
      $scope.game.rounds[0].timeExpired = true;
    } else {
      $scope.timerString = millisToString(ROUND_DURATION - timeElapsed);
    }
  };
  $interval(setTimerString, 100);

  $scope.setScore = function() {
    if (!$scope.game.rounds[0][$scope.uid]) {
      $scope.game.rounds[0][$scope.uid] = {};
    }
    $scope.game.rounds[0][$scope.uid].score = $scope.calculateScore();
    $scope.game.isBetweenRounds = true;
    update();
  }

  $scope.calculateScore = function() {
    return 0;
  };

  function update() { updateFirebase(gameRef, $scope.game); }
});