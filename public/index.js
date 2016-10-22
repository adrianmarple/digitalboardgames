var config = {
  apiKey: "AIzaSyDapzX5nBl8EAJSBJX3GIoiiN0Yy2svEYY",
  authDomain: "digital-board-games.firebaseapp.com",
  databaseURL: "https://digital-board-games.firebaseio.com",
  storageBucket: "digital-board-games.appspot.com",
  messagingSenderId: "596786999591"
};
firebase.initializeApp(config);

angular.module('dbg', [])
  .controller('DBGController', function($scope) {
  
  var js = $scope;
  js.me = null;
  js.myLocation = null;
  js.closeGames = [];
  var myRef, locationsRef, gamesRef;


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
    firebase.auth().signInWithPopup(provider).then(setUpAfterAuth)
      .catch(function(error) {
        console.log(error);
      });
  }

  var me, myRef, locationsRef, myLocation;
  function setUpAfterAuth() {
    js.me = firebase.auth().currentUser;
    myRef = firebase.database().ref("users").child(js.me.uid);
    myRef.child("name").set(js.me.displayName);

    locationsRef = firebase.database().ref("locations");
    gamesRef = firebase.database().ref("games");

    setMyLocation(function() {
      findLocalGames();
      // startNewGame("test");
    });
  }

  function setMyLocation(callback) {
    navigator.geolocation.getCurrentPosition(function(position) {
      js.myLocation = {
        lat: position.coords.latitude * 1e9,
        long: position.coords.longitude * 1e9,
      };
      myRef.child("location").set(js.myLocation);

      if (callback) {
        callback();
      }
    });
  }

  js.test = test;
  function test() {
    console.log("test");
  }

  js.startNewGame = startNewGame;
  function startNewGame(gameType) {
    var gameInfo = {
      id: uuid(),
      location: {
        lat: js.myLocation.lat,
        long: js.myLocation.long,
      },
      type: gameType,
      timestamp: firebase.database.ServerValue.TIMESTAMP,
    }
    myRef.child("currentGame").set(gameInfo);
    var approxLat = approximateCoordinate(js.myLocation.lat);
    var approxLong = approximateCoordinate(js.myLocation.long);
    locationsRef.child(approxLat).child(approxLong).child(gameInfo.id).set(true);
    gamesRef.child(gameInfo.id).set(gameInfo);
    console.log("Created new " + gameType + " game.");
  }

  function findLocalGames() {
    var approxLat = approximateCoordinate(js.myLocation.lat);
    var approxLong = approximateCoordinate(js.myLocation.long);
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

});


function approximateCoordinate(coord) {
  return Math.floor(coord / 1e7);
}