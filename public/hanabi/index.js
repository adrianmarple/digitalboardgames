
app.controller('HanabiController', function(
  $scope, $timeout, $interval, GameInfoService, FirebaseService) {
  
  var MINIMUM_TEAM_SIZE = 2;
  var DECK = [];
  var COLORS = ["white", "green", "blue", "purple", "red"];
  var numberCount = [3, 2, 2, 2, 1];
  for (var i = 0; i < COLORS.length; i++) {
    for (var j = 0; j < numberCount.length; j++) {
      for (var k = 0; k < numberCount[j]; k++) {
        DECK.push({
          color: COLORS[i],
          number: j + 1,
        });
      }
    }
  }

  $scope.COLORS = COLORS;

  GameInfoService.setUpOrJoinGame($scope, createNewGame);

  function createNewGame() {
    console.log("Creating new game.");

    var game = {
      tableaux: false,
      hands: false,
    };
    return game;
  }

  // Game just started: assign roles
  $scope.deal = function() {
    if (!canDeal()) {
      return;
    }

    var tableaux = {};
    for (var i = 0; i < COLORS.length; i++) {
      tableaux[COLORS[i]] = 0;
    }
    $scope.game.tableaux = tableaux;
    $scope.game.cluesLeft = 8;
    $scope.game.lives = 3;
    $scope.game.gameOver = false;
    $scope.game.history = false;
    $scope.game.previousAction = "";
    $scope.game.wasExplosion = false;

    var playerCount = Object.size($scope.game.participants);
    var handSize = playerCount > 3 ? 4 : 5;

    $scope.game.deck = angular.copy(DECK).shuffle();
    $scope.game.deckPosition = 0;
    $scope.game.hands = {};
    $scope.game.participantList = [];
    for (var uid in $scope.game.participants) {
      $scope.game.hands[uid] = [];
      for (var i = 0; i < handSize; i++) {
        $scope.game.hands[uid].push($scope.game.deck.pop());
      }
      $scope.game.participantList.push($scope.game.participants[uid]);
    }
    $scope.game.participantList = shuffle($scope.game.participantList);

    $scope.game.turn = $scope.game.participantList[0].uid;

    update();
  };
  var canDeal = defaultTo(function() {
    return Object.size($scope.game.participants) >= MINIMUM_TEAM_SIZE;
  }, false);
  $scope.canDeal = canDeal;


  $scope.didTapClue = function() {
    $scope.clueing = !$scope.clueing;
    $scope.playing = false;
    $scope.discarding = false;
  };
  $scope.didTapPlay = function() {
    $scope.clueing = false;
    $scope.playing = !$scope.playing;
    $scope.discarding = false;
  };
  $scope.didTapDiscard = function() {
    $scope.clueing = false;
    $scope.playing = false;
    $scope.discarding = !$scope.discarding;
  };

  $scope.didTapPlayer = function(uid) {
    if (!$scope.clueing) {
      return;
    }
    if ($scope.cluee == uid) {
      $scope.cluee = false;
    } else {
      $scope.cluee = uid;
    }
  };

  $scope.didTapCard = function(index) {
    var myHand = $scope.game.hands[$scope.uid];
    var card = myHand[index];
    var type = "";

    if ($scope.playing) {
      success = $scope.game.tableaux[card.color] + 1 == card.number
      if (success) {
        $scope.game.tableaux[card.color] += 1;
        if (card.number == 5) {
          $scope.game.cluesLeft += 1;
        }
        if ($scope.score() == 25) {
          $scope.game.gameOver = true;
        }
      } else {
        $scope.game.lives -= 1;
        if ($scope.game.lives <= 0) {
          $scope.game.gameOver = true;
        }
      }


      var previousAction = $scope.game.participants[$scope.uid].shortName;
      if (success) {
        previousAction += " played a ";
      } else {
        previousAction += " exploded a ";
      }
      previousAction += card.color + " " + card.number;
      $scope.game.previousAction = previousAction;
      $scope.game.wasExplosion = !success;
      $scope.playing = false;
      var type = success ? "play" : "explosion";
    }
    else if ($scope.discarding) {
      $scope.game.cluesLeft += 1;

      var previousAction = $scope.game.participants[$scope.uid].shortName;
      previousAction += " discarded a " + card.color + " " + card.number;
      $scope.game.previousAction = previousAction;
      $scope.game.wasExplosion = false;
      $scope.discarding = false;
      var type = "discard";
    } else {
      return;
    }

    var historyEntry = [];
    for (var i = 0; i < myHand.length; i++) {
      var cardHistory = {
        type: type,
        color: false,
        number: false,
      };
      if (i == index) {
        cardHistory.color = myHand[i].color;
        cardHistory.number = myHand[i].number;
      }
      historyEntry.push(cardHistory);
    }
    addToHistory($scope.uid, historyEntry, index);
    update();
  }

  $scope.toggleHistory = function(uid) {
    if ($scope.historyTarget == uid) {
      $scope.historyTarget = "";
    } else {
      $scope.historyTarget = uid;
    }
  };

  $scope.giveClue = function(type, value) {
    var clueeHand = $scope.game.hands[$scope.cluee];
    var historyEntry = [];
    for (var i = 0; i < clueeHand.length; i++) {
      var cardHistory = {
        type: "clue",
        color: false,
        number: false,
      };
      if (clueeHand[i][type] == value) {
        cardHistory[type] = value;
      }
      historyEntry.push(cardHistory);
    }
    addToHistory($scope.cluee, historyEntry, false);

    var previousAction = $scope.game.participants[$scope.uid].shortName;
    previousAction += " revealed ";
    previousAction += $scope.game.participants[$scope.cluee].shortName;
    previousAction += "'s " + value + " cards";
    $scope.game.previousAction = previousAction;
    $scope.game.wasExplosion = false;

    $scope.game.cluesLeft -= 1;

    $scope.cluee = null;
    $scope.clueing = false;

    update();
  };


  $scope.continue = function() {
    var index = $scope.game.previousEvent.index;
    if (index) {
      var hand = $scope.game.hands[$scope.game.turn];
      if ($scope.game.deckPosition < $scope.game.deck.length) {
        hand[index] = $scope.game.deck[$scope.game.deckPosition];
        $scope.game.deckPosition += 1;
      } else {
        console.log("No more deck");
        hand[index] = {
          color: "absent",
        };
      }
    }

    $scope.game.previousAction = "";
    advancePlayer();
    if (isPlayerMissingCard($scope.game.turn)) {
      $scope.game.gameOver = true;
    }
    update();
  };

  function addToHistory(uid, event, index) {
    $scope.game.previousEvent = {
      uid: uid,
      event: angular.copy(event),
      index: index,
    };
    $scope.game.history = $scope.game.history || {};
    $scope.game.history[uid] = $scope.game.history[uid] || [];
    $scope.game.history[uid].unshift(event);
  }

  $scope.clueeHasCard = defaultTo(function(type, value) {
    var hand = $scope.game.hands[$scope.cluee];
    for (var i = 0; i < hand.length; i++) {
      if (hand[i][type] == value) {
        return true;
      }
    }
    return false;
  }, false);

  $scope.isPlayerDisabled = function(uid) {
    if ($scope.uid == uid) {
      return $scope.clueing;
    } else {
      return $scope.playing || $scope.discarding;
    }
  };

  $scope.isSelectedCardColor = defaultTo(function(uid, index) {
    if (!$scope.game.previousAction || uid != $scope.game.previousEvent.uid) {
      return;
    }
    var eventCard = $scope.game.previousEvent.event[index];
    if (eventCard.color) {
      return true;
    }
  }, false);
  $scope.isSelectedCardNumber = defaultTo(function(uid, index) {
    if (!$scope.game.previousAction || uid != $scope.game.previousEvent.uid) {
      return;
    }
    var eventCard = $scope.game.previousEvent.event[index];
    if (eventCard.number) {
      return true;
    }
  }, false);
  $scope.isSelectedCard = function(uid, index) {
    return $scope.isSelectedCardColor(uid, index) ||
        $scope.isSelectedCardNumber(uid, index);
  };

  function advancePlayer() {
    var participantUids = $scope.game.participantList.map(function(p) { return p.uid });
    var captainIndex = participantUids.indexOf($scope.game.turn);
    $scope.game.turn = participantUids[(captainIndex + 1) % participantUids.length];
  }

  function isPlayerMissingCard(uid) {
    var hand = $scope.game.hands[uid];
    for (var i = 0; i < hand.length; i++) {
      if (hand[i].type == "absent") {
        return true;
      }
    }
    return false;
  }


  $scope.score = defaultTo(function() {
    var score = 0;
    for (var color in $scope.game.tableaux) {
      score += $scope.game.tableaux[color];
    }
    return score;
  }, false);

  $scope.update = update;
  function update() { GameInfoService.save(); }
});
