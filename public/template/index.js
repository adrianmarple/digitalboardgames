
app.controller('[[gameName]]', function(
  $scope, $interval, GameInfoService, FirebaseService) {


  GameInfoService.setUpOrJoinGame($scope, createNewGame);

  function createNewGame() {
    console.log("Creating new game.");

    // TODO fill in initialized game here.

    var game = {
    };
    return game;
  }


  $scope.update = update;
  function update() { GameInfoService.save(); }
});
