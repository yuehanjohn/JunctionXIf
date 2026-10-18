// Scene 6 — scenic mountainside, flowers, parallax. 16s.
// "Life is precious." (0-6) -> "But it doesn't have to be that serious" (6-11) -> If logo (11-16).
(function () {
  const ease = (x) => x < 0 ? 0 : x > 1 ? 1 : x * x * (3 - 2 * x);
  const clamp01 = (x) => x < 0 ? 0 : x > 1 ? 1 : x;
  const seg = (t, a, b) => clamp01((t - a) / (b - a));

  function logoImg() { return window.ASSETS && window.ASSETS.logo; }

  function flower(ctx, x, y, s, petalColor, sway) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(sway);
    // stem
    ctx.strokeStyle = "#5a7a4e"; ctx.lineWidth = 4 * s;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(6 * s, -30 * s, 0, -60 * s);
    ctx.stroke();
    // leaves
    ctx.fillStyle = "#6a8a5e";
    ctx.beginPath(); ctx.ellipse(8 * s, -28 * s, 10 * s, 4 * s, -0.5, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.ellipse(-8 * s, -42 * s, 9 * s, 4 * s, 0.5, 0, 7); ctx.fill();
    // petals
    ctx.fillStyle = petalColor;
    for (let i = 0; i < 6; i++) {
      const a = i * Math.PI / 3;
      ctx.beginPath();
      ctx.ellipse(Math.cos(a) * 11 * s, -60 * s + Math.sin(a) * 11 * s, 9 * s, 6 * s, a, 0, 7);
      ctx.fill();
    }
    // center
    ctx.fillStyle = "#e8b44c";
    ctx.beginPath(); ctx.arc(0, -60 * s, 6 * s, 0, 7); ctx.fill();
    ctx.restore();
  }

  function draw(ctx, t, W, H) {
    // sky
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, "#a8d4e6");
    sky.addColorStop(0.5, "#d8e8cc");
    sky.addColorStop(1, "#f0e8d4");
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);

    // sun glow
    let g = ctx.createRadialGradient(1500, 180, 30, 1500, 180, 420);
    g.addColorStop(0, "rgba(255,240,200,0.9)");
    g.addColorStop(1, "rgba(255,240,200,0)");
    ctx.fillStyle = g; ctx.fillRect(1000, 0, 920, 800);

    // distant ridges parallax
    const p1 = t * 16, p2 = t * 34, p3 = t * 58;
    ctx.fillStyle = "#b6c9b4";
    ctx.beginPath();
    ctx.moveTo(-100, 640);
    ctx.quadraticCurveTo(300 + Math.sin(1) * 100, 460, 700, 580);
    ctx.quadraticCurveTo(1100, 680, 1500, 540);
    ctx.quadraticCurveTo(1800, 440, 2020, 560);
    ctx.lineTo(2020, H); ctx.lineTo(-100, H); ctx.closePath(); ctx.fill();

    ctx.fillStyle = "#93ac8e";
    ctx.beginPath();
    ctx.moveTo(-100, 720);
    ctx.quadraticCurveTo(400 - p1 * 0.2, 580, 800, 700);
    ctx.quadraticCurveTo(1200, 800, 1600, 660);
    ctx.lineTo(2020, 700);
    ctx.lineTo(2020, H); ctx.lineTo(-100, H); ctx.closePath(); ctx.fill();

    ctx.fillStyle = "#6f8f68";
    ctx.beginPath();
    ctx.moveTo(-100, 800);
    ctx.quadraticCurveTo(500 - p1 * 0.5, 700, 1000, 810);
    ctx.quadraticCurveTo(1500, 900, 2020, 780);
    ctx.lineTo(2020, H); ctx.lineTo(-100, H); ctx.closePath(); ctx.fill();

    // foreground meadow
    ctx.fillStyle = "#587850";
    ctx.beginPath();
    ctx.moveTo(-100, 900);
    ctx.quadraticCurveTo(400 - p2 * 0.3, 830, 900, 920);
    ctx.quadraticCurveTo(1400, 1000, 2020, 880);
    ctx.lineTo(2020, H); ctx.lineTo(-100, H); ctx.closePath(); ctx.fill();

    // mid flowers (slow parallax)
    const swayM = Math.sin(t * 2.2) * 0.06;
    flower(ctx, 260 - (p2 * 0.4) % 300, 850, 1.3, "#e88a9a", swayM);
    flower(ctx, 700 - (p2 * 0.4) % 400, 880, 1.1, "#f0c260", swayM * 1.2);
    flower(ctx, 1300 - (p2 * 0.4) % 350, 860, 1.4, "#d478a8", swayM);
    flower(ctx, 1750 - (p2 * 0.4) % 450, 900, 1.0, "#e88a9a", swayM * 1.1);

    // foreground flowers (fast parallax, larger)
    const swayF = Math.sin(t * 2.8) * 0.09;
    flower(ctx, 100 - (p3 * 0.8) % 500, 1060, 2.2, "#e86a7a", swayF);
    flower(ctx, 600 - (p3 * 0.8) % 600, 1090, 2.6, "#f0b040", swayF * 1.2);
    flower(ctx, 1100 - (p3 * 0.8) % 550, 1070, 2.3, "#c86ab8", swayF);
    flower(ctx, 1700 - (p3 * 0.8) % 650, 1100, 2.5, "#e8a0c0", swayF * 1.3);
    flower(ctx, 1950 - (p3 * 0.8) % 480, 1080, 2.0, "#f0d060", swayF);

    // drifting petals
    for (let i = 0; i < 14; i++) {
      const px = ((i * 241 + t * (80 + (i % 4) * 40)) % 2200) - 140;
      const py = 700 + ((i * 137 + t * (30 + (i % 3) * 20)) % 500);
      ctx.fillStyle = "rgba(240,180,190,0.65)";
      ctx.beginPath();
      ctx.ellipse(px, py, 8, 5, t * 2 + i, 0, 7);
      ctx.fill();
    }

    // butterflies
    function butterfly(x, y, flap, hue) {
      ctx.save(); ctx.translate(x, y);
      const w = Math.abs(Math.sin(flap)) * 0.9 + 0.1;
      ctx.fillStyle = hue;
      ctx.save(); ctx.scale(w, 1);
      ctx.beginPath(); ctx.ellipse(-9, 0, 11, 7, 0.3, 0, 7); ctx.fill();
      ctx.beginPath(); ctx.ellipse(9, 0, 11, 7, -0.3, 0, 7); ctx.fill();
      ctx.restore();
      ctx.fillStyle = "#3a3226";
      ctx.beginPath(); ctx.ellipse(0, 0, 3, 8, 0, 0, 7); ctx.fill();
      ctx.restore();
    }
    butterfly(900 + Math.sin(t * 0.9) * 260, 480 + Math.sin(t * 1.7) * 60, t * 10, "rgba(240,200,80,0.9)");
    butterfly(1400 + Math.sin(t * 0.7 + 2) * 200, 560 + Math.cos(t * 1.3) * 50, t * 9, "rgba(230,140,160,0.9)");

    // ---- text ----
    const s1 = seg(t, 0.8, 1.8);
    const s1out = seg(t, 5.2, 6.0);
    const a1 = Math.min(s1, 1 - s1out);
    if (a1 > 0) {
      ctx.globalAlpha = a1;
      ctx.fillStyle = "#3a3226";
      ctx.font = "600 88px Georgia";
      ctx.textAlign = "center";
      ctx.fillText("Life is precious.", W / 2, 300);
      ctx.globalAlpha = 1;
    }

    const s2 = seg(t, 6.2, 7.2);
    const s2out = seg(t, 10.2, 11.0);
    const a2 = Math.min(s2, 1 - s2out);
    if (a2 > 0) {
      ctx.globalAlpha = a2;
      ctx.fillStyle = "#3a3226";
      ctx.font = "italic 600 72px Georgia";
      ctx.textAlign = "center";
      ctx.fillText("But it doesn't have to be that serious", W / 2, 420);
      ctx.globalAlpha = 1;
    }

    // logo
    const ls = seg(t, 11.2, 12.2);
    if (ls > 0) {
      const logo = logoImg();
      const lscale = 1.7 * (0.9 + 0.1 * ease(ls));
      const lw = 180 * lscale, lh = 180 * lscale;
      ctx.globalAlpha = Math.min(1, ls * 1.6);
      if (logo) ctx.drawImage(logo, W / 2 - lw / 2, 580, lw, lh);
      else {
        ctx.fillStyle = "#c8102e";
        ctx.beginPath(); ctx.roundRect(W / 2 - lw / 2, 580, lw, lh, 24); ctx.fill();
        ctx.fillStyle = "#fff"; ctx.font = "700 110px Georgia";
        ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText("If", W / 2, 580 + lh / 2);
        ctx.textBaseline = "alphabetic";
      }
      ctx.globalAlpha = 1;
    }

    // gentle vignette
    const vg = ctx.createRadialGradient(W / 2, H / 2, 500, W / 2, H / 2, 1300);
    vg.addColorStop(0, "rgba(0,0,0,0)");
    vg.addColorStop(1, "rgba(80,110,70,0.18)");
    ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
  }
  window.SCENE = { draw, duration: 16 };
})();
