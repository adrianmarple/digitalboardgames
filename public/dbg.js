var config = {
  apiKey: "AIzaSyDapzX5nBl8EAJSBJX3GIoiiN0Yy2svEYY",
  authDomain: "digital-board-games.firebaseapp.com",
  databaseURL: "https://digital-board-games.firebaseio.com",
  storageBucket: "digital-board-games.appspot.com",
  messagingSenderId: "596786999591"
};
firebase.initializeApp(config);

var me, myLocation, myRef, locationsRef, gamesRef;

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
  me = firebase.auth().currentUser;
  myRef = firebase.database().ref("users").child(me.uid);
  myRef.child("name").set(me.displayName);

  locationsRef = firebase.database().ref("locations");
  gamesRef = firebase.database().ref("games");

  setMyLocation();
}

function setMyLocation() {
  navigator.geolocation.getCurrentPosition(function(position) {
    myLocation = {
      lat: position.coords.latitude * 1e9,
      long: position.coords.longitude * 1e9,
    };
    myRef.child("location").set(myLocation);
  });
}

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

app.controller('DBGController', function($scope, $timeout) {
  
  var js = $scope;
  js.closeGames = [];
  js.currentGames = [];
  $timeout(findLocalGames, 1000);

  js.startNewGame = startNewGame;
  function startNewGame(gameType) {
    var gameInfo = {
      id: uuid(),
      location: {
        lat: myLocation.lat,
        long: myLocation.long,
      },
      type: gameType,
      timestamp: firebase.database.ServerValue.TIMESTAMP,
    }
    myRef.child("currentGame").set(gameInfo);
    var approxLat = approximateCoordinate(myLocation.lat);
    var approxLong = approximateCoordinate(myLocation.long);
    locationsRef.child(approxLat).child(approxLong).child(gameInfo.id).set(true);
    gamesRef.child(gameInfo.id).set(gameInfo);
    console.log("Created new " + gameType + " game.");

    window.href = "/" + gameType;
  }

  function findLocalGames() {
    var approxLat = approximateCoordinate(myLocation.lat);
    var approxLong = approximateCoordinate(myLocation.long);
    locationsRef.child(approxLat).child(approxLong).once('value').then(function(snapshot) {
      js.closeGames = [];
      for (var id in snapshot.val()) {
        getGameInfo(id, function(gameInfo) {
          js.closeGames.push(gameInfo);

          // TODO sort by proximity.
          if(!js.$$phase) {
            js.$apply();
          }
        });
      }

    });
  }

  function getGameInfo(gameId, callback) {
    gamesRef.child(gameId).once('value').then(function(snapshot) {
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
  return Math.floor(coord / 1e7);
};

app.controller('NavController', function($scope, $mdSidenav) {
  $scope.openLeftMenu = function() {
    $mdSidenav('left').open();
  };
  $scope.closeLeftMenu = function() {
    $mdSidenav('left').close();
  };
});
