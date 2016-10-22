
$(document).ready(function() {
  var DURATION = 500;
  var VELOCITY_THRESHOLD = 0.5;
  var position = 0;
  
  var startX = false;
  var startTime = 0;
  var moved = false;
  $("#active-panes").on("touchstart mousedown", function(e) {
    e.preventDefault();
    startX = getCoordinates(e).x;
    startTime = new Date().getTime();
  });
  $("#active-panes").on("touchmove mousemove", function(e) {
    e.preventDefault();
    if (startTime !== 0) {
      var currentTime = new Date().getTime();
      var dt = currentTime - startTime;
      var dx = startX - getCoordinates(e).x;
      var v = dx / dt;
      if (v > VELOCITY_THRESHOLD) {
        moved = true;
        move(1);
        startTime = 0;
      } else if (v < -VELOCITY_THRESHOLD) {
        moved = true;
        move(-1);
        startTime = 0;
      }
    }
  });
  $("#active-panes").on("touchend mouseup", function(e) {
    e.preventDefault();
    if (moved) {
      e.stopPropagation();
    }
    startTime = 0;
    moved = false;
  });
  $("html").keydown(function(e) {
    if (e.which === 37) {
      move(-1);
    }
    if (e.which === 39) {
      move(1);
    }
  });
  
  var moveLock = false;
  function move(direction) {
    var n = $("#active-panes .pane").length;
    if (moveLock) {
      return;
    }
    moveLock = true;
    var $currentPane = getPane(position);
    var nextPosition = (position + direction).mod(n);
    var $nextPane = getPane(nextPosition);
    var width = window.innerWidth;
    $nextPane.css("left", width * direction);
    $nextPane.show();
    $currentPane.animate({
      left: -width * direction
    }, DURATION, function() {
      $currentPane.hide();
      moveLock = false;
    });
    $nextPane.animate({left: 0}, DURATION);
    
    position = nextPosition;
    if (didChangePanes !== undefined) {
      didChangePanes();
    }
  }
  
  function getPane(index) {
    return $("#active-panes .pane:nth-child(" + (index + 1) + ")");
  }
  
  function resize() {
    $(".pane").width(window.innerWidth);
  }
  window.onresize = resize;
  resize();
});
