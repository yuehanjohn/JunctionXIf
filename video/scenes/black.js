// Interlude — pure black screen for the "and since we have time left" VO.
(function () {
  function draw(ctx, t, W, H) {
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, W, H);
  }
  window.SCENE = { draw, duration: 4 };
})();
