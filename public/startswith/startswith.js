


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
    "Book",
    "Movie",
    "Game",
    "City",
    "Office Supply",
    "Company",
    "Body Part",
    "Animal",
    "Language",
  ];
  var POSSIBLE_STARTING_LETTERS = [
    "A",
    "B",
    "C",
    "D",
    "E",
    "F",
    "G",
    "H",
    "I",
    "J",
    "K",
    "L",
    "M",
    "N",
    "P",
    "R",
    "S",
    "T",
    "W",
    "X or O",
    "Q or Z",
    "U or V",
  ];
  var CATEGORIES_PER_ROUND = 10;
  var ROUND_DURATION = 1 * 60 * 1000;

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
    $scope.game.isBetweenRounds = true;
    update();
  }

  $scope.calculateRoundScore = function() {
    try {
      var categories = $scope.game.rounds[0].categories
    } catch(err) {
      return 0;
    }
    var score = 0;
    for (var i = 0; i < categories.length; i++) {
      try {
        var entry = $scope.game.rounds[0][$scope.uid][categories[i]].entry;
      } catch(err) { continue; }
      if ($scope.game.rounds[0][$scope.uid][categories[i]].isInvalid) {
        continue;
      }

      var startingLetter = $scope.game.rounds[0].startingLetter;
      score += entry.toUpperCase().split(" ").filter(function(word) {
        return word[0] == startingLetter[0] ||
            word[0] == startingLetter[startingLetter.length - 1];
      }).length;
    }

    if (!$scope.game.rounds[0][$scope.uid]) {
      $scope.game.rounds[0][$scope.uid] = {};
    }
    $scope.game.rounds[0][$scope.uid].score = score;
    
    return score;
  };
  $scope.calculateTotalScore = function() {
    if (!$scope.game || !$scope.game.rounds) {
      return 0;
    }
    return $scope.game.rounds.reduce(function(value, round) {
      try {
        return value + round[$scope.uid].score;
      } catch(err) {
        return value;
      }
    }, 0);
  }

  $scope.update = update;
  function update() { updateFirebase(gameRef, $scope.game); }
});
