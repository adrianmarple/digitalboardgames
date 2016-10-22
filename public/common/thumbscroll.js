/* Copyright Adrian Marple
 * 
 * Let the scroll area be given by a rectangle of width w and height h
 * If the offset of a thumb image is given by real number x,
 * the mid point is placed at f(x) and its height is given by g(x).
 * These values are governed by the following equations:
 *		r = h/w
 *		f(x) = w/(1 + e^ax)
 *		g(x) = he^(-bx^2)
 *		g(.5) = 2f(.5) - w
 * where e is Euler's number.
 *
 * Since w is given, this leave two degrees of freedom.
 * These are specified here.
 */
var b = .2;
var r = .3;
var G = .1;
var dampening = .85;
var alpha = .75;
var V_coef = 20;

var click_thresh = 5;

var moving = false;
var click;
var startX;
var prevX;
var prevY;
var prevTime;
var active_thumbscroll;

$(document).ready(function() {
	//initialization
	$('.thumbscroll').data('offset', 0);
	$('.thumbscroll').data('V', 0);
	//$('.thumbscroll').css('position', 'relative');
	$('.thumb').each(function(i, elem) {
		var $imgs = $(this).find('img');
		var cursor = 'default';
		if($(this).find('a').length > 0)
			cursor = 'pointer';
			
		if($imgs.length > 0) {
			$(this).prepend(
				'<div class="thumbimg" style="' +
					'position: fixed;' +
					'background-position: center;' +
					'background-size: contain;' +
					'background-repeat: no-repeat;' +
					'background-image: url(' + $imgs[0].src + ');' +
					'cursor: ' + cursor + ';' +
				'"> </div>'
			);
		}
	});
	
	resize();
	
	//event handlers for scrolling
	$(window).on('touchstart mousedown', function(e) {
		XY = getCoordinates(e); X = XY[0]; Y = XY[1];

		$('.thumbscroll').each(function(i, t) {
			var rect = this.getBoundingClientRect();
			var w = rect.right - rect.left;
			var h = w*r;
			if(rect.left <= X && rect.right > X &&
			   rect.top  <= Y && rect.top+h > Y) {
				
				$active_thumbscroll = $(t);
				$(t).addClass('active');
				moving = true;
				click = true;
				startX = X;
				prevX = X;
				prevY = Y;
				prevTime = Date.now();
				$(t).data('V', 0);
			}
		});
		return !moving;
	});

	$(window).on('touchend mouseup', function(e) {
		X = prevX;
		Y = prevY;
		if(typeof $active_thumbscroll === 'undefined')
			return;
		
		$active_thumbscroll.removeClass('active');
		if(click) {
			var $thumbimgs = $active_thumbscroll.find('.thumbimg');
			$thumbimgs.sort(function(a, b) {
				return $(a).css('z-index') - $(b).css('z-index');
			});
			
			$thumbimgs.each(function(i, elem) {
				var rect = this.getBoundingClientRect();
				if(rect.left <= X && rect.right  > X &&
				   rect.top  <= Y && rect.bottom > Y) {
					
					var $a = $(this).parent().find('a');
					if($a.length > 0)
						window.location.href = $a.attr('href');
				}
			});
		}
		else if(moving){
			$t = $active_thumbscroll;
			$t.data('V', $t.data('V')*.8);
			continueMoving($t);
		}
		moving = false;
	});

	$(window).on('touchmove mousemove', function(e) {
		XY = getCoordinates(e); X = XY[0]; Y = XY[1];
		if(moving) {
			var $t = $active_thumbscroll;
			diff = prevX - X;
			time_diff = 1.0*Math.max(1, Date.now() - prevTime)
			s = Math.pow(alpha, time_diff)
			$t.data('V', s*$t.data('V') + (1-s)*diff/time_diff);

			prevTime = Date.now();
			prevX = X;
			prevY = Y;
			if(startX - X > click_thresh || X - startX > click_thresh)
				click = false;
			
			$t.data('offset', $t.data('offset') + diff/(r * $t.width()));			
			render($t);
		}
		return !moving;
	});
	$(window).resize(resize);
});

function resize() {
	$('.thumbscroll').each(function(i, thumbscroll) {
		var w = $(this).width();
		$(this).data('min_h', w*r*1.35);
		$(this).find('.thumb').css({
			'position': 'absolute',
			'text-align': 'center',
			'width': w,
			'top': w*r
		});
		
		render($(this));
	});
}

function continueMoving($t) {
	$t.data('t', Date.now());
	(function move() {
		var num = $t.find('.thumb').length;
		var offset = $t.data('offset');
		if (offset < 0)
			d = offset;
		else if (offset > num-1)
			d = offset - (num-1);
		else
			d = (offset+.5) % 1.0 - .5;
		now = Date.now();
		dt = (now - $t.data('t')) / 30;
		$t.data('t', now);
		var V = ($t.data('V') - dt*d*G) * Math.pow(dampening, dt);
		$t.data('V', V);
		$t.data('offset', $t.data('offset') + dt*V_coef*V/(r * $t.width()));
		render($t);
		if ((Math.abs(V) > .02 || Math.abs(d) > .02) &&
			!$t.hasClass('active'))
			setTimeout(move, 30);
	})();
}

function render($thumbscroll) {
	if ($thumbscroll.length == 0)
		return

	var $thumbs = $thumbscroll.find('.thumb');
	var offset = $thumbscroll.data('offset');
	var min_h = $thumbscroll.data('min_h');
	var w = $thumbscroll.width();
	var h = w*r;
	var a = -2 * Math.log(2/(1 + r*(Math.exp(b/-4))) - 1);
	
	//Display the description of the thumb with focus (if any)
	//thumbscroll.find('p').hide();
	$active_thumb = $thumbscroll.find('.thumb.active');
	offset += .5;
	if(offset >= 0 && offset < $thumbs.length) {
		$thumb = $($thumbs[Math.floor(offset)])
		if ($thumb[0] != $active_thumb[0]) {
			$active_thumb.find('*').hide();
			$active_thumb.removeClass('active');
			$thumb.find('*').show();
			$thumb.addClass('active');
			$imgs = $thumb.find('img');
			if($imgs.length > 0)
				$($imgs[0]).hide();
			
			//$thumbscroll.height(Math.max(min_h, h + $thumb.outerHeight(true)));
		}
	}
	//else
	//	$thumbscroll.height(min_h);
	offset -= .5;

	//Render each thumb image appropriately
	$thumbs.each(function(index, elem) {
		var x = offset - index;
		var f = w/(1 + Math.exp(a*x));
		var g = h * Math.exp(-b*x*x);
		var zindex;
		if(.5 < x)
			zindex = index;
		else
			zindex = 2*$thumbs.length - index;
		$(this).find('.thumbimg').css({
			'width':  g,
			'height': g,
			'bottom': 200 + (h - g)/2,
			'left': 20 + f - g/2,
			'z-index': zindex,
			'display': 'block'
		});
	});
}

function getCoordinates(event) {
	if(event.clientX === undefined)
		return [event.originalEvent.pageX, event.originalEvent.pageY];
	else
		return [event.clientX, event.clientY]
}