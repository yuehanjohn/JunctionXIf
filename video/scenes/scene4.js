// Scene 4 — woman ascending to heaven with wings. 7s. Ethereal.
(function () {
  const ease = (x) => x < 0 ? 0 : x > 1 ? 1 : x * x * (3 - 2 * x);
  const clamp01 = (x) => x < 0 ? 0 : x > 1 ? 1 : x;
  const seg = (t, a, b) => clamp01((t - a) / (b - a));

  function cloud(x, y, s, alpha) {
    const g = ctx.createRadialGradient(x, y, s * 0.2, x, y, s);
    g.addColorStop(0, "rgba(255,255,255," + alpha + ")");
    g.addColorStop(0.6, "rgba(255,250,240," + alpha * 0.6 + ")");
    g.addColorStop(1, "rgba(255,250,240,0)");
    ctx.fillStyle = g;
    ctx.fillRect(x - s, y - s, s * 2, s * 2);
  }

  function draw(ctx, t, W, H) {
    const asc = t / 7;
    // heaven gradient
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, "#fdf8ec");
    sky.addColorStop(0.5, "#f3e6c8");
    sky.addColorStop(1, "#e7d6b8");
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);

    // divine light beam
    const beam = ctx.createLinearGradient(960, -100, 960, 1100);
    beam.addColorStop(0, "rgba(255,240,200,0.9)");
    beam.addColorStop(1, "rgba(255,240,200,0)");
    ctx.fillStyle = beam;
    ctx.beginPath();
    ctx.moveTo(700, -100); ctx.lineTo(1220, -100);
    ctx.lineTo(1700, 1100); ctx.lineTo(220, 1100); ctx.closePath(); ctx.fill();

    // clouds parallax
    const drift = t * 40;
    cloud(((t * 26) % 2200) - 200, 880, 220, 0.55);
    cloud(1700 - ((t * 18) % 1900), 950, 260, 0.5);
    cloud(((t * 12) % 1600) - 300, 180, 300, 0.35);
    cloud(1500 - ((t * 22) % 2100), 240, 240, 0.3);
    cloud(((t * 8) % 1400) - 200, 500, 340, 0.22);
    cloud(1300 - ((t * 15) % 1700), 620, 300, 0.25);

    // ---- woman ----
    const rise = ease(asc) * 560;
    const wy = 820 - rise;          // she rises through frame
    const flap = Math.sin(t * 4.2);
    ctx.save();
    ctx.translate(960, wy);
    const sway = Math.sin(t * 1.4) * 12;
    ctx.translate(sway, 0);
    ctx.rotate(Math.sin(t * 1.1) * 0.03);

    // glow halo behind
    let hg = ctx.createRadialGradient(0, -40, 10, 0, -40, 340);
    hg.addColorStop(0, "rgba(255,252,235,0.95)");
    hg.addColorStop(0.5, "rgba(255,245,215,0.45)");
    hg.addColorStop(1, "rgba(255,245,215,0)");
    ctx.fillStyle = hg;
    ctx.fillRect(-360, -400, 720, 720);

    // wings
    function wing(side) {
      const s = side; // -1 left, 1 right
      ctx.save();
      ctx.scale(s, 1);
      ctx.rotate(flap * 0.14);
      const wg = ctx.createLinearGradient(0, 0, 220, -80);
      wg.addColorStop(0, "rgba(255,255,255,0.98)");
      wg.addColorStop(1, "rgba(240,235,245,0.35)");
      ctx.fillStyle = wg;
      ctx.beginPath();
      ctx.moveTo(30, -60);
      ctx.quadraticCurveTo(150, -160, 250, -120);
      ctx.quadraticCurveTo(200, -40, 240, 30);
      ctx.quadraticCurveTo(140, 40, 30, -10);
      ctx.closePath(); ctx.fill();
      // feathers
      ctx.strokeStyle = "rgba(200,190,220,0.5)"; ctx.lineWidth = 3;
      for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        ctx.moveTo(40 + i * 8, -40 + i * 10);
        ctx.quadraticCurveTo(140 + i * 12, -80 + i * 20, 230 - i * 8, -60 + i * 22);
        ctx.stroke();
      }
      ctx.restore();
    }
    wing(-1); wing(1);

    // dress
    ctx.fillStyle = "#fdf8ef";
    ctx.beginPath();
    ctx.moveTo(-46, 40);
    ctx.quadraticCurveTo(0, 20, 46, 40);
    ctx.quadraticCurveTo(80, 190, 40, 320);
    ctx.quadraticCurveTo(0, 340, -40, 320);
    ctx.quadraticCurveTo(-80, 190, -46, 40);
    ctx.closePath(); ctx.fill();
    // sash
    ctx.fillStyle = "#e8c98e";
    ctx.fillRect(-46, 120, 92, 14);
    // arms open, palms up
    ctx.strokeStyle = "#eab892"; ctx.lineWidth = 13; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(-34, 60); ctx.quadraticCurveTo(-90, 40, -118, 8); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(34, 60); ctx.quadraticCurveTo(90, 40, 118, 8); ctx.stroke();
    ctx.fillStyle = "#eab892";
    ctx.beginPath(); ctx.arc(-124, 2, 10, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.arc(124, 2, 10, 0, 7); ctx.fill();
    // head
    ctx.fillStyle = "#eab892";
    ctx.beginPath(); ctx.arc(0, 0, 30, 0, 7); ctx.fill();
    // serene closed eyes
    ctx.strokeStyle = "#6b5440"; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(-10, -2, 5, Math.PI * 0.15, Math.PI * 0.85); ctx.stroke();
    ctx.beginPath(); ctx.arc(10, -2, 5, Math.PI * 0.15, Math.PI * 0.85); ctx.stroke();
    // hair + straw hat remnant
    ctx.fillStyle = "#4a3826";
    ctx.beginPath(); ctx.arc(0, -8, 30, Math.PI * 1.05, Math.PI * 1.95); ctx.fill();
    ctx.beginPath(); ctx.arc(26, -16, 12, 0, 7); ctx.fill();
    // halo ring
    ctx.strokeStyle = "rgba(255,240,180,0.95)"; ctx.lineWidth = 7;
    ctx.beginPath(); ctx.ellipse(0, -62, 52, 16, 0, 0, 7); ctx.stroke();
    ctx.restore();

    // rising sparkle motes
    for (let i = 0; i < 26; i++) {
      const px = (i * 173.3) % 1920;
      const py = ((t * (60 + (i % 5) * 30)) + i * 97) % 1200;
      const a = 0.35 + 0.3 * Math.sin(t * 2 + i);
      ctx.fillStyle = "rgba(255,246,210," + a + ")";
      ctx.beginPath(); ctx.arc(px, 1150 - py, 3 + (i % 3), 0, 7); ctx.fill();
    }

    // vignette
    const vg = ctx.createRadialGradient(W / 2, H / 2, 480, W / 2, H / 2, 1300);
    vg.addColorStop(0, "rgba(0,0,0,0)");
    vg.addColorStop(1, "rgba(160,130,90,0.20)");
    ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
  }
  window.SCENE = { draw, duration: 7 };
})();
