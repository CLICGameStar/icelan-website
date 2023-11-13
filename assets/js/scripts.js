function changeNav() {
  var nav = document.getElementById("main-nav");
  nav.classList.toggle("nav-active");
  var burger = document.getElementById("burger-menu");
  burger.classList.toggle("burger-highlight");
}

var counterSpeed = 1000;

function incEltNbr(id) {
  elt = document.getElementById(id);
  endNbr = Number(document.getElementById(id).innerHTML);
  incNbrRec(0, endNbr, elt);
}

function incNbrRec(i, endNbr, elt) {
  if (i <= endNbr) {
    elt.innerHTML = i;
    setTimeout(function() {
      incNbrRec(i + 1, endNbr, elt);
    }, counterSpeed / endNbr);
  }
}

incEltNbr("participant-counter");

incEltNbr("staff-counter");

incEltNbr("tournament-counter");

incEltNbr("animation-counter");
