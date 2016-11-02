

//===============================================================================
// Firbase:
function updateFirebase(ref, game) {
  cleanForFirebase(game);
  ref.set(game);
}
function cleanForFirebase(object) {
  for (var key in object) {
    if (key.indexOf("$") > -1) {
      delete object[key];
    } else if (typeof object[key] === 'object') {
      cleanForFirebase(object[key]);
    }
  }
}

function setUpGame($scope, ref, createNewGame) {
  if (firebase.auth().currentUser) {
    $scope.uid = firebase.auth().currentUser.uid;
  } else {
    firebase.auth().onAuthStateChanged(function(user) {
      if (user) {
        $scope.uid = user.uid;
      } else {
        // No user is signed in.
      }
    });
  }

  ref.once('value').then(function(snapshot) {
    if (!snapshot.val()) {
      game = createNewGame();
    } else {
      console.log("Existing game.");
      game = snapshot.val();
    }
    $scope.game = game;
    // console.log(game);
    if(!$scope.$$phase) {
      $scope.$apply();
    }
  }).catch(function(error) {
    console.log(error);
  });
}

function keepGameSynced($scope) {
  gameRef.on('value', function(snapshot) {
    game = snapshot.val();
    $scope.game = game;
    if(!$scope.$$phase) {
      $scope.$apply();
    }
  });
}

//===============================================================================
// Mobile:
function getCoordinates(e) {
  if (e.clientX !== undefined) {
    return {
      x: e.clientX,
      y: e.clientY,
    };
  } else {
    return {
      x: e.originalEvent.touches[0].pageX,
      y: e.originalEvent.touches[0].pageY,
    };
  }
}


//===============================================================================
// Cookies:
function setCookie(cname, cvalue) {
    var d = new Date();
    d.setTime(d.getTime() + (1000*24*60*60*1000));
    var expires = "expires="+d.toUTCString();
    document.cookie = cname + "=" + cvalue + "; " + expires;
}
function setCookieJSON(cname, cvalue) {
    var d = new Date();
    d.setTime(d.getTime() + (1000*24*60*60*1000));
    var expires = "expires="+d.toUTCString();
    document.cookie = cname + "=" + JSON.stringify(cvalue) + "; " + expires;
}
function getCookieBoolean(cname) {
  return getCookie(cname) === 'true';
}
function getCookieInt(cname) {
  return parseInt(getCookie(cname));
}
function getCookieFloat(cname) {
  return parseFloat(getCookie(cname));
}
function getCookieJSON(cname) {
  var cookie = getCookie(cname);
  if (cookie == "0") {
    return false;
  }
  return JSON.parse(cookie);
}
function getCookie(cname) {
    var name = cname + "=";
    var ca = document.cookie.split(';');
    for(var i=0; i<ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0)==' ') c = c.substring(1);
        if (c.indexOf(name) === 0) return c.substring(name.length, c.length);
    }
    return "0";
}


//===============================================================================
// Randomness:
function randInt(n) {
  return Math.floor(Math.random() * n);
}

function randomElement(items) {
  return items[randInt(items.length)];
}

function randomSubarray(arr, size) {
    var shuffled = arr.slice(0), i = arr.length, min = i - size, temp, index;
    while (i-- > min) {
        index = Math.floor((i + 1) * Math.random());
        temp = shuffled[index];
        shuffled[index] = shuffled[i];
        shuffled[i] = temp;
    }
    return shuffled.slice(min);
}

function shuffle(o){
    for(var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
    return o;
}

function coinflip() {
  return Math.random() > 0.5;
}

function uuid() {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }
  return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
    s4() + '-' + s4() + s4() + s4();
}

Array.prototype.randomElement = function() {
  return this[randInt(this.length)];
}

Array.prototype.randomSubarray = function(size) {
    var shuffled = this.slice(0), i = this.length, min = i - size, temp, index;
    while (i-- > min) {
        index = Math.floor((i + 1) * Math.random());
        temp = shuffled[index];
        shuffled[index] = shuffled[i];
        shuffled[i] = temp;
    }
    return shuffled.slice(min);
}


//===============================================================================
// Methods for Primatives:
Number.prototype.mod = function(n) {
  return ((this % n) + n) % n;
};
String.prototype.capitalize = function() {
  return this.charAt(0).toUpperCase() + this.slice(1);
};


//===============================================================================
// Misc:


function millisToString(millis) {
    var totalSeconds = Math.floor(millis / 1000);
    var minutes = Math.floor(totalSeconds / 60);
    var seconds = totalSeconds % 60;
    seconds = seconds >= 10 ? seconds : '0' + seconds;
    return minutes + ":" + seconds;
}

// From: http://stackoverflow.com/questions/24597634/how-to-generate-an-array-of-alphabet-in-jquery
function genCharArray(charA, charZ) {
    var a = [], i = charA.charCodeAt(0), j = charZ.charCodeAt(0);
    for (; i <= j; ++i) {
        a.push(String.fromCharCode(i));
    }
    return a;
}

