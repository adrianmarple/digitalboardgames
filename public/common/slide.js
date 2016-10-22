

$(document).ready(function() {
  $('.slide').css({
    display: "none",
    position: "absolute",
    width: "100%",
    height: "100%",
  });
  $('.default').show();
  
	$('.slide-btn').click(function() {
		set_slide($(this).attr('slide'));
	});
});

function set_slide(id) {
	console.log('Setting slide to ' + id);
	$cur_slide = $('.slide.active');
	if ($cur_slide.attr('id') == id)
		return;
	$cur_slide.removeClass('active');
	$('#'+id).addClass('active');
	$('#'+id).css('opacity', 0.001);
	$('#'+id).show();
	if ($cur_slide.length > 0)
		$cur_slide.fadeOut(1000, function() {
			window.scrollTo(0,0);
			render($("#"+id.replace("Slide", "")));
			$('#'+id).animate({opacity: 1},1000);
			$('#'+id).show();
		});
	else {
		window.scrollTo(0,0);
		setTimeout(function() {
			$('#'+id).animate({opacity: 1},1000);
			$('#'+id).show();
		}, 1000);
	}
}