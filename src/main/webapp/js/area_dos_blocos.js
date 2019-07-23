/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */



$(document).on('click', '.more', function () {
    $(".buttons").fadeOut(125);
    $(this).toggleClass('open');
    $('#iconMore').toggleClass('fas fa-angle-double-right');
    //$('.buttons').toggleClass('open');
    // p/ esq <i class="fas fa-angle-double-left"></i>
});

$(document).on('click', '.open', function () {
    $(".buttons").fadeIn(125);
    $(this).toggleClass('close');
	$('#iconMore').toggleClass('fas fa-angle-double-left');
    //$('.buttons').toggleClass('open');
    // p/ esq <i class="fas fa-angle-double-left"></i>
});
