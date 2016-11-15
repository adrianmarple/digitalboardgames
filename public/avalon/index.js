
app.controller('AvalonController', function(
  $scope, $interval, GameInfoService, FirebaseService) {

  GameInfoService.setUpOrJoinGame($scope, createNewGame);

  function createNewGame() {
    console.log("Creating new game.");

    // TODO fill in initialized game here.

    var game = {
      quests: [
        // {outcome: "pending", participantCount: 1},
        // {outcome: "pending", participantCount: 2},
        // {outcome: "pending", participantCount: 1},
        {outcome: "pending", participantCount: 2},
        {outcome: "pending", participantCount: 3},
        {outcome: "pending", participantCount: 2},
        {outcome: "pending", participantCount: 3},
        {outcome: "pending", participantCount: 3},
      ],
      roles: false,
      team: false,
      teamSize: 0,
      finalized: false,
      areAllVotesIn: false,
      questing: false,
      outcomes: false,
      outcome: false,
      isQuestDone: false,
      assassination: false,
      victory: false,
    };
    return game;
  }
  $scope.visible = true;

  var ROLES = [
    "merlin",
    "assassin",
    "mordred",
    "percival",
    "knight",
    "knight",
    "minion",
  ];
  $scope.ROLE_ALIGNMENT = {
    merlin: "good",
    mordred: "evil",
    percival: "good",
    assassin: "evil",
    knight: "good",
    minion: "evil",
  };

  $scope.canSeeEvil = defaultTo(function() {
    if (!$scope.visible) {
      return false;
    }
    var myRole = $scope.game.roles[$scope.uid];
    return myRole == "merlin" || $scope.ROLE_ALIGNMENT[myRole] == "evil";
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
    if (myRole == "percival" && (role == "merlin" || role == "mordred")) {
      return "merlin";
    }
  });

  // Game just started: assign roles
  $scope.assignRoles = function() {
    if (!canAssignRoles()) {
      return;
    }
    var roles = ROLES.slice(0, Object.size($scope.game.participants));
    roles = shuffle(roles);

    $scope.game.roles = {};

    var i = 0;
    for (var id in $scope.game.participants) {
      $scope.game.roles[id] = roles[i];
      i += 1;
    }

    // $scope.game.captain = Object.keys($scope.game.participants).randomElement();
    $scope.game.captain = Object.keys($scope.game.participants)[1];
    $scope.game.quest = 0;

    update();
  };
  var canAssignRoles = defaultTo(function() {
    return Object.size($scope.game.participants) >= 5;
  }, false);
  $scope.canAssignRoles = canAssignRoles;

  // Team building phase
  var isTeamReady = defaultTo(function() {
    var questSize = $scope.game.quests[$scope.game.quest].participantCount;
    return $scope.game.teamSize == questSize;
  }, false);
  $scope.isTeamReady = isTeamReady;

  $scope.toggleTeamMember = defaultTo(function(uid) {
    if ($scope.game.assassination) {
      if ($scope.game.roles[uid] == "merlin") {
        $scope.game.victory = "evil";
      } else {
        $scope.game.victory = "good";
      }
      $scope.game.assassination = false;
      update();
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
    console.log($scope.game.teamSize);
    update();
  });
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
  }
  $scope.generateOutcomes = function() {
    if (coinFlip()) {
      return ["succeed", "fail"];
    } else {
      return ["fail", "succeed"];
    }
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
      // TODO keep track of number of failures to agree.
    }
    update();
  };
  function advanceCaptain() {
    var participantUids = Object.keys($scope.game.participants);
    var captainIndex = participantUids.indexOf($scope.game.captain);
    $scope.game.captain = participantUids[(captainIndex + 1) % participantUids.length];
  }

  // Go on quest
  $scope.quest = function(outcome) {
    $scope.game.outcomes = $scope.game.outcomes || {};
    $scope.game.outcomes[$scope.uid] = outcome;
    $scope.game.isQuestDone = isQuestDone();

    if (isQuestDone()) {
      var questOutcome = true;
      for (var uid in $scope.game.outcomes) {
        console.log($scope.game.outcomes[uid] == "succeed");
        questOutcome = questOutcome && $scope.game.outcomes[uid] == "succeed";
      }
      $scope.game.questOutcome = questOutcome ? "good" : "evil";
      $scope.game.quests[$scope.game.quest].outcome = $scope.game.questOutcome;
    }
    update();
  };

  function isQuestDone() {
    for (var uid in $scope.game.team) {
      if ($scope.game.outcomes[uid] == undefined) {
        return false;
      }
    }
    return true;
  };
  $scope.getOutcomes = defaultTo(function() {
    var outcomes = [];
    for (var uid in $scope.game.outcomes) {
      outcomes.push($scope.game.outcomes[uid] + uid);
    }
    return outcomes.shuffle();
  }, []);

  $scope.questContinue = function() {
    $scope.game.team = false;
    $scope.game.outcomes = false;
    $scope.game.outcome = false;
    $scope.game.teamSize = 0;
    $scope.game.finalized = false;
    $scope.game.quest += 1;
    $scope.game.questing = false;
    $scope.game.isQuestDone = false;
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
