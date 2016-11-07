

var app = angular.module('dbg', ['ngRoute', 'ngMaterial', 'material.svgAssetsCache']);
app.config(['$routeProvider', function($routeProvider) {
  $routeProvider
  .when("/", {
      templateUrl : "/main.htm",
  })
  .when("/startswith", {
      // template : "Starts with..."
      templateUrl : "/startswith/startswith.htm",
      controller: "StartsWithController",
  });
}]);
app.config(function($mdThemingProvider) {
  $mdThemingProvider.theme('default')
    .primaryPalette('indigo')
    .accentPalette('purple')
    .dark();
});

app.service('GameInfoService', function($location, $routeParams, FirebaseService) {
  var js = this;
  js.gameInfo = {};

  js.createGame = function(gameType) {
    FirebaseService.waitUntilInitialized(function() {
      var id = uuid();
      $location.search('id', id);
      var location = FirebaseService.location;
      js.gameInfo = {
        id: id,
        location: {
          lat: location.lat,
          long: location.long,
        },
        type: gameType,
        timestamp: firebase.database.ServerValue.TIMESTAMP,
        // participants: [FirebaseService.getBasicInfo()],
      }
      FirebaseService.myRef.child("currentGame").set(js.gameInfo);

      var approxLat = approximateCoordinate(location.lat);
      var approxLong = approximateCoordinate(location.long);
      FirebaseService.locationsRef.child(approxLat).child(approxLong).child(id).set(true);

      FirebaseService.gamesRef.child(id).set(js.gameInfo);
      js.gameRef = FirebaseService.gamesRef.child(id).child("game");

      console.log("Created new " + gameType + " game: " + id);
    });
  };

  js.setUpOrJoinGame = function($scope, createNewGame) {
    FirebaseService.waitUntilInitialized(function() {
      setGameRef();
      if (!js.gameRef) {
        js.createGame($location.url());
      }
      js.gameRef.once('value').then(function(snapshot) {
        if (!snapshot.val()) {
          game = createNewGame();
        } else {
          console.log("Joining game.");
          game = snapshot.val();
        }
        var myUid = FirebaseService.getUid();
        game.participants = game.participants || {}
        game.participants[myUid] = FirebaseService.getBasicInfo();
        console.log(game);
        js.gameInfo.game = game;
        js.save();
        $scope.uid = myUid;
        keepGameSynced($scope);
      }).catch(function(error) {
        console.log(error);
      });
    });
  };

  js.save = function(game) {
    cleanForFirebase(js.gameInfo.game);
    js.gameRef.set(js.gameInfo.game);
  };
  function cleanForFirebase(object) {
    for (var key in object) {
      if (key.indexOf("$") > -1) {
        delete object[key];
      } else if (typeof object[key] === 'object') {
        cleanForFirebase(object[key]);
      }
    }
  }

  function keepGameSynced($scope) {
    js.gameRef.on('value', function(snapshot) {
      js.gameInfo.game = snapshot.val();
      $scope.game = js.gameInfo.game;
      if(!$scope.$$phase) {
        $scope.$apply();
      }
    });
  }

  function setGameRef() {
    if ($routeParams.id) {
      js.gameRef = FirebaseService.gamesRef.child($routeParams.id).child("game");
    }    
  }
});

app.service('FirebaseService', function() {
  var fire = this;
  fire.waitingFunctions = [];

  config = {
    apiKey: "AIzaSyDapzX5nBl8EAJSBJX3GIoiiN0Yy2svEYY",
    authDomain: "digital-board-games.firebaseapp.com",
    databaseURL: "https://digital-board-games.firebaseio.com",
    storageBucket: "digital-board-games.appspot.com",
    messagingSenderId: "596786999591"
  };
  firebase.initializeApp(config);

  var provider = new firebase.auth.GoogleAuthProvider();
  provider.addScope('https://www.googleapis.com/auth/plus.login');

  firebase.auth().onAuthStateChanged(function(user) {
    if (user) {
      setUpAfterAuth();
    } else {
      signIn();
    }
  });

  function signIn() {
    firebase.auth().signInWithRedirect(provider).then(setUpAfterAuth)
      .catch(function(error) {
        console.log(error);
      });
  }

  function setUpAfterAuth() {
    fire.me = firebase.auth().currentUser;
    fire.myRef = firebase.database().ref("users").child(fire.me.uid);
    fire.myRef.child("name").set(fire.me.displayName);

    fire.locationsRef = firebase.database().ref("locations");
    fire.gamesRef = firebase.database().ref("games");

    setMyLocation(function() {
      for (var i = 0; i < fire.waitingFunctions.length; i++) {
        fire.waitingFunctions[i]();
      }
      fire.waitingFunctions = [];
    });
  }

  function setMyLocation(callback) {
    navigator.geolocation.getCurrentPosition(function(position) {
      fire.location = {
        lat: Math.round(position.coords.latitude * 1e9),
        long: Math.round(position.coords.longitude * 1e9),
      };
      fire.myRef.child("location").set(fire.location);
      callback();
    });
  }

  fire.waitUntilInitialized = function(callback) {
    if (firebase.auth().currentUser) {
      callback()
    } else {
      console.log("Waiting for firebase...");
      fire.waitingFunctions.push(callback);
    }
  };

  fire.getUid = function() {
    return fire.me.uid;
  };

  fire.getBasicInfo = function() {
    return {
      uid: fire.me.uid,
      name: fire.me.displayName,
      email: fire.me.email,
      pic: fire.me.photoURL,
    }
  }
});


app.controller('DBGController', function(
    $scope, $location, $timeout, GameInfoService, FirebaseService) {

  var js = $scope;
  js.closeGames = [];
  js.currentGames = [];
  FirebaseService.waitUntilInitialized(findLocalGames);

  js.startNewGame = function(gameType) {
    $location.url(gameType);
    GameInfoService.createGame(gameType);
  };

  js.joinGame = function(gameId, gameType) {
    $location.url(gameType);
    $location.search('id', gameId);
  };

  js.leaveGame = function() {
    GameInfoService.gameRef.child("participants").child(FirebaseService.getUid())
      .set(null);
    $location.url("");
    findLocalGames();
  }

  window.onbeforeunload = function(event) {
    js.leaveGame();  
  };

  function findLocalGames() {
    var location = FirebaseService.location;
    var approxLat = approximateCoordinate(location.lat);
    var approxLong = approximateCoordinate(location.long);
    var myGridSquareRef = FirebaseService.locationsRef.child(approxLat).child(approxLong);
    myGridSquareRef.once('value').then(function(snapshot) {
      js.closeGames = [];
      for (var id in snapshot.val()) {
        getGameInfo(id, function(gameInfo) {
          js.closeGames.push(gameInfo);

          // TODO sort by recency.
          if(!js.$$phase) {
            js.$apply();
          }
        });
      }

    });
  }

  function getGameInfo(gameId, callback) {
    FirebaseService.gamesRef.child(gameId).once('value').then(function(snapshot) {
      callback(snapshot.val());
    }).catch(function(error) {
      console.log(error);
    });
  }

  function getGameUrl(game) {
    console.log("/" + game.type + "/" + game.type + ".html");
    return "/" + game.type + "/" + game.type + ".html";
  }

});

function approximateCoordinate(coord) {
  return Math.round(coord / 1e7);
};

app.controller('NavController', function($scope, $mdSidenav) {
  $scope.openLeftMenu = function() {
    $mdSidenav('left').open();
  };
  $scope.closeLeftMenu = function() {
    $mdSidenav('left').close();
  };
});
