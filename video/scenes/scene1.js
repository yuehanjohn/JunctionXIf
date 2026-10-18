// Scene 1 — man moving out, tears, waves goodbye. 13s. Warm-paper palette.
(function () {
  const ease = (x) => x < 0 ? 0 : x > 1 ? 1 : x * x * (3 - 2 * x);
  const clamp01 = (x) => x < 0 ? 0 : x > 1 ? 1 : x;
  const seg = (t, a, b) => clamp01((t - a) / (b - a));

  function draw(ctx, t, W, H) {
    ctx.save();
    // sky
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, "#ffe2be");
    sky.addColorStop(0.55, "#f7e8d0");
    sky.addColorStop(1, "#f5efe4");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);

    // sun glow
    const sunY = 260 - seg(t, 0, 13) * 20;
    let g = ctx.createRadialGradient(1450, sunY, 30, 1450, sunY, 420);
    g.addColorStop(0, "rgba(255,205,140,0.95)");
    g.addColorStop(0.4, "rgba(255,214,160,0.45)");
    g.addColorStop(1, "rgba(255,214,160,0)");
    ctx.fillStyle = g;
    ctx.fillRect(900, 0, 1020, 900);

    // camera push-in
    const zoom = 1 + 0.10 * ease(seg(t, 0, 13));
    const cx = 960, cy = 640;
    ctx.translate(cx, cy);
    ctx.scale(zoom, zoom);
    ctx.translate(-cx, -cy);

    // far hills
    ctx.fillStyle = "#ecd9b8";
    ctx.beginPath();
    ctx.moveTo(-100, 700);
    ctx.quadraticCurveTo(400, 540, 900, 660);
    ctx.quadraticCurveTo(1400, 760, 2020, 640);
    ctx.lineTo(2020, 1080); ctx.lineTo(-100, 1080); ctx.closePath(); ctx.fill();

    ctx.fillStyle = "#dfc7a0";
    ctx.beginPath();
    ctx.moveTo(-100, 780);
    ctx.quadraticCurveTo(500, 660, 1000, 740);
    ctx.quadraticCurveTo(1500, 810, 2020, 700);
    ctx.lineTo(2020, 1080); ctx.lineTo(-100, 1080); ctx.closePath(); ctx.fill();

    // ground
    ctx.fillStyle = "#cdb592";
    ctx.fillRect(-100, 800, 2120, 380);
    // road
    ctx.fillStyle = "#c2ab85";
    ctx.beginPath();
    ctx.moveTo(-100, 1080); ctx.lineTo(2020, 1080);
    ctx.lineTo(2020, 940); ctx.lineTo(-100, 990); ctx.closePath(); ctx.fill();
    // road dashes
    ctx.fillStyle = "#efe5cd";
    for (let i = 0; i < 6; i++) {
      const x = 60 + i * 340;
      ctx.fillRect(x, 1005 + i * 8, 120, 10);
    }

    // ---- house ----
    const hx = 260, hy = 330;
    // body
    ctx.fillStyle = "#cdb99e";
    ctx.fillRect(hx, hy + 130, 700, 340);
    // roof
    ctx.fillStyle = "#7d6a55";
    ctx.beginPath();
    ctx.moveTo(hx - 40, hy + 140);
    ctx.lineTo(hx + 350, hy - 10);
    ctx.lineTo(hx + 740, hy + 140);
    ctx.closePath(); ctx.fill();
    // chimney
    ctx.fillStyle = "#8d7860";
    ctx.fillRect(hx + 520, hy + 20, 62, 110);
    ctx.fillRect(hx + 512, hy + 12, 78, 16);
    // door + frame
    ctx.fillStyle = "#a89178";
    ctx.fillRect(hx + 300, hy + 320, 150, 150);
    ctx.fillStyle = "#77573e";
    ctx.fillRect(hx + 308, hy + 328, 134, 142);
    ctx.fillStyle = "#efe5cd";
    ctx.beginPath(); ctx.arc(hx + 424, hy + 400, 7, 0, 7); ctx.fill();
    // windows with warm light
    const winGlow = ctx.createLinearGradient(0, hy + 180, 0, hy + 300);
    winGlow.addColorStop(0, "#ffd98f");
    winGlow.addColorStop(1, "#f7c97e");
    ctx.fillStyle = winGlow;
    ctx.fillRect(hx + 90, hy + 190, 130, 120);
    ctx.fillRect(hx + 480, hy + 190, 130, 120);
    ctx.strokeStyle = "#a89178"; ctx.lineWidth = 12;
    ctx.strokeRect(hx + 90, hy + 190, 130, 120);
    ctx.strokeRect(hx + 480, hy + 190, 130, 120);
    ctx.beginPath();
    ctx.moveTo(hx + 155, hy + 190); ctx.lineTo(hx + 155, hy + 310);
    ctx.moveTo(hx + 90, hy + 250); ctx.lineTo(hx + 220, hy + 250);
    ctx.moveTo(hx + 545, hy + 190); ctx.lineTo(hx + 545, hy + 310);
    ctx.moveTo(hx + 480, hy + 250); ctx.lineTo(hx + 610, hy + 250);
    ctx.lineWidth = 6; ctx.stroke();

    // ---- moving boxes ----
    function box(x, y, s) {
      ctx.fillStyle = "#d9c39c";
      ctx.fillRect(x, y, s, s * 0.8);
      ctx.strokeStyle = "#b79e75"; ctx.lineWidth = 5;
      ctx.strokeRect(x, y, s, s * 0.8);
      ctx.beginPath();
      ctx.moveTo(x + s / 2, y); ctx.lineTo(x + s / 2, y + s * 0.8);
      ctx.moveTo(x, y + s * 0.4); ctx.lineTo(x + s, y + s * 0.4);
      ctx.stroke();
    }
    box(hx + 480, hy + 400, 110);
    box(hx + 575, hy + 400, 90);
    box(hx + 500, hy + 322, 96);

    // ---- man ----
    const mx = hx + 660, my = hy + 360;
    const breathe = Math.sin(t * 1.6) * 2.5;
    const wave = seg(t, 6, 6.6);          // raise arm at 6s
    const waveAng = wave * (0.5 + 0.22 * Math.sin((t - 6) * 5.2));
    // shadow
    ctx.fillStyle = "rgba(90,70,45,0.18)";
    ctx.beginPath(); ctx.ellipse(mx + 8, my + 130, 60, 14, 0, 0, 7); ctx.fill();
    // legs
    ctx.strokeStyle = "#4a3c2c"; ctx.lineWidth = 16; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(mx - 14, my + 60); ctx.lineTo(mx - 18, my + 122); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(mx + 14, my + 60); ctx.lineTo(mx + 20, my + 122); ctx.stroke();
    // body (coat)
    ctx.fillStyle = "#5c4a35";
    ctx.beginPath();
    ctx.roundRect(mx - 34, my - 20 + breathe, 68, 90, 24);
    ctx.fill();
    // head
    ctx.fillStyle = "#e5b98f";
    ctx.beginPath(); ctx.arc(mx, my - 52 + breathe, 30, 0, 7); ctx.fill();
    // hair
    ctx.fillStyle = "#3d3020";
    ctx.beginPath(); ctx.arc(mx, my - 58 + breathe, 30, Math.PI * 1.05, Math.PI * 2.05); ctx.fill();
    // eye (looking back -> to the left, viewer side)
    ctx.fillStyle = "#3d3020";
    ctx.beginPath(); ctx.arc(mx - 12, my - 54 + breathe, 3.4, 0, 7); ctx.fill();
    // sorrowful brow
    ctx.strokeStyle = "#3d3020"; ctx.lineWidth = 3.4;
    ctx.beginPath(); ctx.moveTo(mx - 20, my - 64 + breathe); ctx.lineTo(mx - 6, my - 60 + breathe); ctx.stroke();
    // tear rolls down from 2s
    const tear = seg(t, 2, 6.5);
    if (tear > 0 && tear < 1) {
      ctx.fillStyle = "rgba(150,190,230,0.85)";
      ctx.beginPath();
      ctx.ellipse(mx - 14, my - 48 + tear * 26 + breathe, 4, 6.4, 0, 0, 7);
      ctx.fill();
    }
    // far arm holding strap of a bag
    ctx.strokeStyle = "#5c4a35"; ctx.lineWidth = 14;
    ctx.beginPath(); ctx.moveTo(mx + 24, my - 6 + breathe); ctx.lineTo(mx + 44, my + 52 + breathe); ctx.stroke();
    // waving arm
    ctx.save();
    ctx.translate(mx - 26, my - 4 + breathe);
    ctx.rotate(-waveAng);
    ctx.strokeStyle = "#5c4a35"; ctx.lineWidth = 14; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -66); ctx.stroke();
    // hand
    ctx.fillStyle = "#e5b98f";
    ctx.beginPath(); ctx.arc(0, -74, 11, 0, 7); ctx.fill();
    ctx.restore();
    // bag on ground
    ctx.fillStyle = "#8d6f4e";
    ctx.beginPath(); ctx.roundRect(mx + 30, my + 92, 74, 40, 10); ctx.fill();
    ctx.strokeStyle = "#6b5438"; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(mx + 40, my + 92);
    ctx.quadraticCurveTo(mx + 67, my + 60, mx + 94, my + 92); ctx.stroke();

    // gentle warm vignette
    const vg = ctx.createRadialGradient(W / 2, H / 2, 500, W / 2, H / 2, 1200);
    vg.addColorStop(0, "rgba(0,0,0,0)");
    vg.addColorStop(1, "rgba(120,80,40,0.22)");
    ctx.fillStyle = vg; ctx.fillRect(-200, -200, W + 400, H + 400);

    ctx.restore();

    // fade-out to paper at the very end
    const fade = seg(t, 12.4, 13);
    if (fade > 0) {
      ctx.fillStyle = "rgba(245,239,228," + fade + ")";
      ctx.fillRect(0, 0, W, H);
    }
  }
  window.SCENE = { draw, duration: 13 };
})();
