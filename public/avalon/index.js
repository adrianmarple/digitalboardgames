
app.controller('AvalonController', function(
  $scope, $interval, GameInfoService, FirebaseService) {
  
  var MINIMUM_TEAM_SIZE = 5;
  var TOTAL_ATTEMPTS = 3;
  var QUEST_PROGRESSIONS = {
    2: [1, 2, 1],
    5: [2, 3, 2, 3, 3],
    6: [2, 3, 4, 3, 4],
    7: [2, 3, 3, 4, 4],
    8: [3, 4, 4, 5, 5],
    9: [3, 4, 4, 5, 5],
    10: [3, 4, 4, 5, 5],
  };
  var ROLES = [
    "merlin",    // good
    "assassin",  // evil
    "morgana",   // evil
    "percival",  // good
    "knight",    // good
    "knight",    // good
    "oberon",    // evil
    "knight",    // good
    "knight",    // good
    "minion",    // evil
  ];

  var ROLE_ALIGNMENT = {
    merlin: "good",
    morgana: "evil",
    percival: "good",
    assassin: "evil",
    knight: "good",
    minion: "evil",
    oberon: "good", // but really evil
  };

  GameInfoService.setUpOrJoinGame($scope, createNewGame);

  function createNewGame() {
    console.log("Creating new game.");

    var game = {
      quests: false,
      roles: false,
      team: false,
      teamSize: 0,
      finalized: false,
      areAllVotesIn: false,
      questing: false,
      outcomes: false,
      outcome: false,
      assassination: false,
      victory: false,
      attemptsLeft: TOTAL_ATTEMPTS,
    };
    return game;
  }

  $scope.visible = true;
  $scope.outcomeChoices = generateOutcomes();
  function generateOutcomes() {
    if (coinFlip()) {
      return ["succeed", "fail"];
    } else {
      return ["fail", "succeed"];
    }
  }


  $scope.canSeeEvil = defaultTo(function(uid) {
    if (!$scope.visible) {
      return false;
    }
    var myRole = $scope.game.roles[$scope.uid];
    return $scope.uid == uid || myRole == "merlin" || $scope.ROLE_ALIGNMENT[myRole] == "evil";
  }, false);
  $scope.apparentRole = defaultTo(function(uid) {
    if ($scope.game.finalized && $scope.game.votes[uid] != undefined) {
      if (areAllVotesIn()) {
        return $scope.game.votes[uid] ? "accept" : "reject";
      } else {
        return "qmark";
      }
    }

    if (!$scope.visible) {
      return;
    }
    var role = $scope.game.roles[uid];
    var myRole = $scope.game.roles[$scope.uid];
    if (uid == $scope.uid) {
      return myRole;
    }
    if (myRole == "percival" && (role == "merlin" || role == "morgana")) {
      return "merlin";
    }
  });
  $scope.apparentAlignment = defaultTo(function(uid) {
    var role = $scope.game.roles[uid];
    if (role == "oberon" && uid == $scope.uid) {
      return "evil";
    }
    return ROLE_ALIGNMENT[role];
  });

  // Game just started: assign roles
  $scope.assignRoles = function() {
    if (!canAssignRoles()) {
      return;
    }
    var playerCount = Object.size($scope.game.participants);
    $scope.game.quests = [];
    for (var i = 0; i < QUEST_PROGRESSIONS[playerCount].length; i++) {
      $scope.game.quests.push({
        outcome: "pending",
        participantCount: QUEST_PROGRESSIONS[playerCount][i],
      });
    }


    var roles = ROLES.slice(0, Object.size($scope.game.participants));
    roles = shuffle(roles);

    $scope.game.roles = {};
    $scope.game.participantList = [];

    var i = 0;
    for (var uid in $scope.game.participants) {
      $scope.game.roles[uid] = roles[i];
      $scope.game.participantList.push($scope.game.participants[uid]);
      i += 1;
    }
    $scope.game.participantList = shuffle($scope.game.participantList);

    $scope.game.captain = $scope.game.participantList[0].uid;
    $scope.game.quest = 0;

    update();
  };
  var canAssignRoles = defaultTo(function() {
    return Object.size($scope.game.participants) >= MINIMUM_TEAM_SIZE;
  }, false);
  $scope.canAssignRoles = canAssignRoles;

  // Team building phase

  $scope.toggleTeamMember = defaultTo(function(uid) {
    if ($scope.game.assassination) {
      if ($scope.game.roles[$scope.uid] == 'assassin') {
        if ($scope.game.roles[uid] == "merlin") {
          $scope.game.victory = "evil";
        } else {
          $scope.game.victory = "good";
        }
        $scope.game.assassination = false;
        update();
      }
      return;
    }

    if ($scope.game.captain != $scope.uid || $scope.game.finalized) {
      return;
    }
    $scope.game.team = $scope.game.team || {};
    $scope.game.team[uid] = !$scope.game.team[uid];
    $scope.game.teamSize = 0;
    for (var uid in $scope.game.team) {
      if ($scope.game.team[uid]) {
        $scope.game.teamSize += 1;
      }
    }

    update();
  });
  var isTeamReady = defaultTo(function() {
    return $scope.game.teamSize == $scope.game.quests[$scope.game.quest].participantCount
  }, false);
  $scope.isTeamReady = isTeamReady;
    
  $scope.setTeam = function() {
    if (!isTeamReady()) {
      return;
    }
    $scope.game.finalized = true;
    update();
  }

  // Vote on proposed team
  $scope.vote = function(vote) {
    $scope.game.votes = $scope.game.votes || {};
    $scope.game.votes[$scope.uid] = vote;    
    $scope.game.areAllVotesIn = areAllVotesIn();
    update();

    $scope.outcomeChoices = generateOutcomes();
  }
  function areAllVotesIn() {
    for (var uid in $scope.game.participants) {
      if ($scope.game.votes[uid] == undefined) {
        return false;
      }
    }
    return true;
  };

  $scope.voteContinue = function() {
    var accepts = 0, rejects = 0;
    for (var uid in $scope.game.votes) {
      if ($scope.game.votes[uid]) {
        accepts += 1;
      } else {
        rejects += 1;
      }
    }
    $scope.game.votes = false;
    $scope.game.areAllVotesIn = false;
    advanceCaptain();
    if (accepts > rejects) {
      $scope.game.questing = true;
    } else {
      $scope.game.team = false;
      $scope.game.teamSize = 0;
      $scope.game.finalized = false;

      $scope.game.attemptsLeft -= 1;
      if ($scope.game.attemptsLeft <= 0) {
        $scope.game.quests[$scope.game.quest].outcome = "evil";
        $scope.questContinue();
      }
    }
    update();
  };
  function advanceCaptain() {
    var participantUids = $scope.game.participantList.map(function(p) { return p.uid});
    var captainIndex = participantUids.indexOf($scope.game.captain);
    $scope.game.captain = participantUids[(captainIndex + 1) % participantUids.length];
  }

  // Go on quest
  $scope.quest = function(outcome) {
    $scope.game.outcomes = $scope.game.outcomes || {};
    $scope.game.outcomes[$scope.uid] = outcome;

    if (isQuestDone()) {
      var failCount = 0;
      for (var uid in $scope.game.outcomes) {
        if ($scope.game.outcomes[uid] == "fail") {
          failCount += 1;
        }
      }
      var questOutcome = failCount == 0 || 
        ($scope.game.quest == 3 && 
         $scope.game.quests[3].participantCount > 3 &&
         failCount == 1);
      $scope.game.questOutcome = questOutcome ? "good" : "evil";
      $scope.game.quests[$scope.game.quest].outcome = $scope.game.questOutcome;
    }

    var outcomes = [];
    for (var uid in $scope.game.outcomes) {
      outcomes.push($scope.game.outcomes[uid] + uid);
    }
    outcomes = outcomes.shuffle();
    outcomes.push(outcomes.length);
    $scope.game.outcomeList = outcomes;

    update();
  };

  var isQuestDone = defaultTo(function() {
    if (!$scope.game.team) {
      return false;
    }
    for (var uid in $scope.game.team) {
      if ($scope.game.team[uid] && $scope.game.outcomes[uid] == undefined) {
        return false;
      }
    }
    return true;
  }, false);
  $scope.isQuestDone = isQuestDone;

  $scope.questContinue = function() {
    $scope.game.team = false;
    $scope.game.outcomes = false;
    $scope.game.outcome = false;
    $scope.game.teamSize = 0;
    $scope.game.finalized = false;
    $scope.game.quest += 1;
    $scope.game.questing = false;
    $scope.game.attemptsLeft = TOTAL_ATTEMPTS;
    if (didGoodWinQuests() || didEvilWinQuests()) {
      triggerEndgame();
    }
    update();
  };

  function didGoodWinQuests() {
    return $scope.game.quests.length / 2 < getQuestCount("good");
  }
  function didEvilWinQuests() {
    return $scope.game.quests.length / 2 <= getQuestCount("evil");
  }
  function getQuestCount(type) {
    var count = 0;
    for (var i = 0; i < $scope.game.quests.length; i++) {
      if ($scope.game.quests[i].outcome == type) {
        count += 1;
      }
    }
    return count;
  }

  // End game
  function triggerEndgame() {
    if (didGoodWinQuests()) {
      $scope.game.assassination = true;
    } else {
      $scope.game.victory = "evil";
    }
  }

  $scope.setUpNewGame = function() {
    angular.merge($scope.game, createNewGame());
    update();
  }

  $scope.update = update;
  function update() { GameInfoService.save(); }
});
