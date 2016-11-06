


app.controller('StartsWithController', function(
  $scope, $interval, GameInfoService, FirebaseService) {

  var CATEGORIES_PER_ROUND = 10;
  var ROUND_DURATION = 2 * 60 * 1000;

  var gameRef = firebase.database().ref("games/idgoeshere/game");

  GameInfoService.setUpGame($scope, createNewStartsWithGame);

  function createNewStartsWithGame() {
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
    if (!$scope.game.rounds){
      $scope.game.rounds = [];
    }

    $scope.game.rounds.unshift(round);
    $scope.game.isBetweenRounds = false;
    update();
  };


  $scope.timerString = "";
  var setTimerString = function() {
    if (!$scope.game || !$scope.game.rounds || !$scope.game.rounds[0]) {
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
        if (!entry) {
          continue;
        }
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
  function update() { GameInfoService.save(); }
});


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
  "Someone Famous",
  "Saying",
  "Book",
  "Movie",
  "TV Show",
  "Game",
  "City",
  "Office Supply",
  "Company",
  "Body Part",
  "Flying Animal",
  "Land Animal",
  "Ocean Dweller",
  "Language",
  "Drink",
  "Fictional Place",
  "Title or Honorific",
  "Something Cold",
  "Something Hot",
  "Something Sticky",
  "Something Soft",
  "Something Hard",
  "Something Disposable",
  "Something Priceless",
  "Something Smelly",
  "Something Scary",
  "Something Bright",
  "Something Black",
  "Something Red",
  "Something Blue",
  "Something Green",
  "Something White",
  "Digital Service",
  "Insect",
  "Plant or Fungus",
  "Mammal",
  "Bird",
  "Reptile or Amphibian",
  "Fad",
  "Type of Weather",
  "Hobby",
  "Acronym",
  "Hobby",
  "Electronic Device",
  "Car Part",
  "Athlete",
  "Four-letter Word",
  "Tool",
  "Term of Endearment",
  "School Subject",
  "Musical Instrument",
  "Something Heart-pounding",
  "Nickname",
  "College or University",
  "Item you can see right now",
  "Measurement Term",
  "Capital",
  "Candy",
  "Sports Equipment",
  "Spice or Herb",
  "Allergy",
  "Restaurant",
  "Fruit",
  "Weapon",
  "Toy",
  "Something Round",
  "Something with Corners",
  "Halloween Costume",
  "Song",
  "Villain or Monster",
  "Word Associated with Money",
  "Vegetable",
  "Occupation",
  "Cartoon Character",
  "Personality Trait",
  "Something Scientific",
  "Something Astronomical",
  "Something Mathematical",
  "Sound",
  "Something that comes in Pairs",
  "Something with Claws",
  "Something Loud",
  "Word with double letters",
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
  "I or Y",
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
