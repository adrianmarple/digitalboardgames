
function copyTemplate(className) {
  var $copy = $(".template." + className).clone();
  $copy.removeClass("template");
  return $copy;
}

// From: http://stackoverflow.com/questions/24597634/how-to-generate-an-array-of-alphabet-in-jquery
function genCharArray(charA, charZ) {
    var a = [], i = charA.charCodeAt(0), j = charZ.charCodeAt(0);
    for (; i <= j; ++i) {
        a.push(String.fromCharCode(i));
    }
    return a;
}

//===============================================================================
// P2P:

// Global game state.
gameJSON = {};

identity = getCookieInt("identity");
identity = (identity === 0) ? Math.floor(Math.random() * (1 << 30)) : identity;
setCookie("identity", identity);

// Requires a function updateDisplay to be defined.
function setUpPusher(gameId) {
  channelName = window.location.search.replace("?", "");
  var pusher = new Pusher('f5a15ae956a92622ce16', {
    authTransport: 'jsonp',
    authEndpoint: 'https://arm-pusherauth.herokuapp.com/',
  });
  var channel = pusher.subscribe('private-' + channelName);
  
  channel.bind('pusher:subscription_succeeded', function() {
    channel.trigger('client-' + gameId + '-new-player', "" + identity);
    console.log("Success");
  });
  channel.bind('pusher:subscription_error', function() {
    console.log("Error");
  });
  channel.bind('client-' + gameId + '-update', function(data) {
    gameJSON = data;
    updateDisplay();
  });
  channel.bind('client-' + gameId + '-new-player', function(newPlayerId) {
    console.log("New player " + newPlayerId);
    channel.trigger('client-' + gameId + '-update', gameJSON);
  });
  
  // Global update function.
  update = function() {
    updateDisplay();
    channel.trigger('client-' + gameId + '-update', gameJSON);
  };
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


//===============================================================================
// Methods for Primatives:
Number.prototype.mod = function(n) {
  return ((this % n) + n) % n;
};
String.prototype.capitalize = function() {
  return this.charAt(0).toUpperCase() + this.slice(1);
};

// Closure
(function() {
  /**
   * Decimal adjustment of a number.
   *
   * @param {String}  type  The type of adjustment.
   * @param {Number}  value The number.
   * @param {Integer} exp   The exponent (the 10 logarithm of the adjustment base).
   * @returns {Number} The adjusted value.
   */
  function decimalAdjust(type, value, exp) {
    // If the exp is undefined or zero...
    if (typeof exp === 'undefined' || +exp === 0) {
      return Math[type](value);
    }
    value = +value;
    exp = +exp;
    // If the value is not a number or the exp is not an integer...
    if (isNaN(value) || !(typeof exp === 'number' && exp % 1 === 0)) {
      return NaN;
    }
    // Shift
    value = value.toString().split('e');
    value = Math[type](+(value[0] + 'e' + (value[1] ? (+value[1] - exp) : -exp)));
    // Shift back
    value = value.toString().split('e');
    return +(value[0] + 'e' + (value[1] ? (+value[1] + exp) : exp));
  }

  // Decimal round
  if (!Math.round10) {
    Math.round10 = function(value, exp) {
      return decimalAdjust('round', value, exp);
    };
  }
  // Decimal floor
  if (!Math.floor10) {
    Math.floor10 = function(value, exp) {
      return decimalAdjust('floor', value, exp);
    };
  }
  // Decimal ceil
  if (!Math.ceil10) {
    Math.ceil10 = function(value, exp) {
      return decimalAdjust('ceil', value, exp);
    };
  }
})();
