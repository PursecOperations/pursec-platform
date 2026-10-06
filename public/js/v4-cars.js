// PURSEC v4 — siluetas propias (SVG) de cada tipo de coche. Sin fotos ni logos de nadie.
(function () {
  "use strict";
  var n = 0;
  function wheel(cx, cy, r, g) {
    return '<g><circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="#0B0715"/>' +
      '<circle cx="' + cx + '" cy="' + cy + '" r="' + (r * 0.62) + '" fill="none" stroke="url(#' + g + 'r)" stroke-width="' + (r * 0.12) + '"/>' +
      '<circle cx="' + cx + '" cy="' + cy + '" r="' + (r * 0.16) + '" fill="#C9A7FF" opacity=".7"/>' +
      '<circle cx="' + cx + '" cy="' + cy + '" r="' + (r - 2) + '" fill="none" stroke="rgba(201,167,255,.18)" stroke-width="2"/></g>';
  }
  var BODY = {
    open: function (g, a) {
      return wheel(130, 148, 38, g) + wheel(470, 146, 42, g) +
        '<path d="M24 152h96l4-10H30z" fill="url(#' + g + 'b)"/><rect x="20" y="128" width="8" height="28" rx="2" fill="url(#' + g + 'b)"/>' +
        '<path d="M40 146C80 140 140 132 196 124L262 110C284 102 314 96 340 96L362 90C384 86 402 90 412 98L478 102L522 110L540 126L544 150L474 150L178 150L60 152Z" fill="url(#' + g + 'b)"/>' +
        '<path d="M196 124L262 110C284 102 314 96 340 96" fill="none" stroke="rgba(247,240,255,.75)" stroke-width="2.5" stroke-linecap="round"/>' +
        '<path d="M362 90L376 64H400L412 98" fill="url(#' + g + 'b)"/>' +
        '<path d="M296 98C312 72 356 70 380 90" fill="none" stroke="#120B22" stroke-width="7" stroke-linecap="round"/>' +
        '<path d="M520 112V66H582V80H530V114Z" fill="url(#' + g + 'b)"/><rect x="570" y="58" width="12" height="78" rx="3" fill="url(#' + g + 'b)"/>' +
        '<path d="M250 140H460" stroke="' + a + '" stroke-width="5" stroke-linecap="round"/>';
    },
    fe: function (g, a) {
      return BODY.open(g, a) +
        '<path d="M80 150C84 110 172 104 184 134L188 150Z" fill="url(#' + g + 'b)" opacity=".95"/><path d="M92 132C112 116 160 116 176 132" fill="none" stroke="rgba(247,240,255,.6)" stroke-width="2"/>';
    },
    indy: function (g, a) {
      return BODY.open(g, a) +
        '<path d="M292 98C302 68 348 62 378 84" fill="none" stroke="rgba(201,167,255,.85)" stroke-width="5" stroke-linecap="round"/>' +
        '<path d="M296 96C310 74 346 70 372 86L366 94C344 82 316 84 302 98Z" fill="rgba(201,167,255,.25)"/>';
    },
    proto: function (g, a) {
      return wheel(140, 148, 38, g) + wheel(462, 146, 40, g) +
        '<path d="M26 146C40 120 90 108 120 106C150 104 170 116 186 134H408C420 112 446 102 470 104C494 106 512 120 520 136L566 134L572 148L554 152L30 154Z" fill="url(#' + g + 'b)"/>' +
        '<path d="M186 134C220 92 262 72 320 70C370 70 400 92 420 120" fill="url(#' + g + 'b)"/>' +
        '<path d="M232 108C256 84 292 76 330 78L344 104Z" fill="#120B22"/>' +
        '<path d="M330 72C380 74 440 84 520 92L538 120L440 112Z" fill="url(#' + g + 'b)"/>' +
        '<path d="M520 92V64H586V78H532V116Z" fill="url(#' + g + 'b)"/>' +
        '<path d="M60 128C100 114 150 112 180 130" fill="none" stroke="rgba(247,240,255,.55)" stroke-width="2.5"/>' +
        '<path d="M200 142H420" stroke="' + a + '" stroke-width="5" stroke-linecap="round"/>';
    },
    gt: function (g, a) {
      return wheel(148, 146, 40, g) + wheel(460, 146, 40, g) +
        '<path d="M30 140C34 120 70 112 104 108C124 106 140 104 160 100L236 76C280 64 340 62 390 72L454 90C500 98 540 106 560 118L566 140L552 152H40Z" fill="url(#' + g + 'b)"/>' +
        '<path d="M250 80C290 70 340 70 378 78L410 96H234Z" fill="#120B22"/>' +
        '<path d="M318 74V96" stroke="url(#' + g + 'b)" stroke-width="4"/>' +
        '<path d="M520 98L534 70H588V82H544L536 106Z" fill="url(#' + g + 'b)"/>' +
        '<path d="M104 108C170 98 220 88 250 80" fill="none" stroke="rgba(247,240,255,.6)" stroke-width="2.5"/>' +
        '<path d="M196 130H410" stroke="' + a + '" stroke-width="6" stroke-linecap="round"/>';
    },
    bike: function (g, a) {
      return wheel(160, 140, 52, g) + wheel(438, 140, 52, g) +
        '<path d="M150 108C178 72 232 58 284 60L330 66C360 70 382 82 398 100L452 108L470 122L404 128L330 132L248 138L210 128Z" fill="url(#' + g + 'b)"/>' +
        '<path d="M180 92C200 70 230 62 250 64L246 86Z" fill="#120B22"/>' +
        '<path d="M240 58C262 34 300 26 330 34C350 40 360 52 358 64L300 66Z" fill="url(#' + g + 'b)"/>' +
        '<circle cx="322" cy="30" r="20" fill="url(#' + g + 'b)"/><path d="M308 26H340" stroke="#120B22" stroke-width="7" stroke-linecap="round"/>' +
        '<path d="M330 66L392 112" stroke="rgba(201,167,255,.7)" stroke-width="10" stroke-linecap="round"/>' +
        '<path d="M160 140L230 104M438 140L392 104" stroke="#2A1F3D" stroke-width="7"/>' +
        '<path d="M210 112C260 100 320 98 380 106" fill="none" stroke="' + a + '" stroke-width="5" stroke-linecap="round"/>';
    }
  };
  function car(type, accent) {
    var g = "pc" + (++n), a = accent || "#A855F7";
    var t = BODY[type] ? type : "open";
    return '<svg class="carsvg" viewBox="0 0 600 200" role="img" aria-hidden="true"><defs>' +
      '<linearGradient id="' + g + 'b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#E7D8FF"/><stop offset=".35" stop-color="#B98BFF"/><stop offset="1" stop-color="#5B21B6"/></linearGradient>' +
      '<linearGradient id="' + g + 'r" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#C9A7FF"/><stop offset="1" stop-color="#4C1D95"/></linearGradient>' +
      '<radialGradient id="' + g + 's" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="rgba(168,85,247,.55)"/><stop offset="1" stop-color="rgba(168,85,247,0)"/></radialGradient>' +
      '</defs><ellipse cx="300" cy="186" rx="280" ry="12" fill="url(#' + g + 's)"/>' + BODY[t](g, a) + '</svg>';
  }
  window.PS = window.PS || {};
  window.PS.car = car;
})();
