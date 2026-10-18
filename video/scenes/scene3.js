// Scene 3 — woman cycling mountain road; falls at 8s; If logo punchline. 13s.
(function () {
  const ease = (x) => x < 0 ? 0 : x > 1 ? 1 : x * x * (3 - 2 * x);
  const clamp01 = (x) => x < 0 ? 0 : x > 1 ? 1 : x;
  const seg = (t, a, b) => clamp01((t - a) / (b - a));

  function logoImg() { return window.ASSETS && window.ASSETS.logo; }

  function draw(ctx, t, W, H) {
    const crash = seg(t, 8, 9);        // 0..1 fall progress
    const rideT = t;                   // scroll phase while riding

    // ---- sky ----
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, "#bfe0ee");
    sky.addColorStop(0.6, "#e8ecda");
    sky.addColorStop(1, "#f5efe4");
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);

    // sun
    let g = ctx.createRadialGradient(500, 200, 30, 500, 200, 380);
    g.addColorStop(0, "rgba(255,236,190,0.95)");
    g.addColorStop(1, "rgba(255,236,190,0)");
    ctx.fillStyle = g; ctx.fillRect(0, 0, 1100, 700);

    // ---- mountains (parallax) ----
    const drift1 = (rideT * 14) % 1200;
    const drift2 = (rideT * 30) % 1400;
    function ridge(color, base, amp, phase, seed) {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(-1400 + phase, base);
      for (let x = -1400 + phase; x < 2200; x += 240) {
        const k = Math.sin((x + seed) * 0.004) * amp + Math.sin((x + seed) * 0.011) * amp * 0.4;
        ctx.lineTo(x, base - k);
      }
      ctx.lineTo(2200, H); ctx.lineTo(-1400, H); ctx.closePath(); ctx.fill();
    }
    ridge("#c6d5c9", 560, 130, -drift1, 300);
    ridge("#9fb8a8", 660, 170, -drift2, 900);

    // ---- road band ----
    ctx.save();
    ctx.translate(0, 0);
    ctx.rotate(-0.06);
    ctx.fillStyle = "#e2d3b4";
    ctx.fillRect(-200, 820 - t * 0, 2400, 320);
    ctx.restore();
    // road surface
    ctx.fillStyle = "#b7a887";
    ctx.beginPath();
    ctx.moveTo(-100, 860); ctx.quadraticCurveTo(960, 780, 2020, 880);
    ctx.lineTo(2020, 1080); ctx.lineTo(-100, 1080); ctx.closePath(); ctx.fill();
    // center dashes scrolling
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(-100, 860); ctx.quadraticCurveTo(960, 780, 2020, 880);
    ctx.lineTo(2020, 1080); ctx.lineTo(-100, 1080); ctx.closePath();
    ctx.clip();
    ctx.fillStyle = "#efe5cd";
    const dashP = (rideT * 420) % 220;
    for (let x = -300 - dashP; x < 2200; x += 220) {
      ctx.save();
      ctx.translate(x, 985);
      ctx.rotate(-0.043);
      ctx.fillRect(0, 0, 110, 14);
      ctx.restore();
    }
    ctx.restore();

    // guardrail posts
    ctx.fillStyle = "#8d7c62";
    const postP = (rideT * 420) % 260;
    for (let x = -200 - postP; x < 2100; x += 260) {
      ctx.save();
      ctx.translate(x, 800);
      ctx.rotate(-0.043);
      ctx.fillRect(0, 0, 16, 70);
      ctx.restore();
    }

    // ---- bike + woman ----
    ctx.save();
    const bx = 820, by = 880;
    if (crash === 0) {
      ctx.translate(bx, by + Math.sin(t * 6) * 4);
    } else {
      // fall: slide right-down, rotate
      const e = ease(crash);
      ctx.translate(bx + e * 520, by + e * e * 420);
      ctx.rotate(e * 1.15);
    }
    const wheelR = 64;
    const spin = crash === 0 ? rideT * 9 : rideT * 9 + crash * 3;
    function wheel(wx, wy) {
      ctx.strokeStyle = "#3a3226"; ctx.lineWidth = 10;
      ctx.beginPath(); ctx.arc(wx, wy, wheelR, 0, 7); ctx.stroke();
      ctx.strokeStyle = "#5a5040"; ctx.lineWidth = 3;
      for (let i = 0; i < 6; i++) {
        const a = spin + i * Math.PI / 3;
        ctx.beginPath();
        ctx.moveTo(wx, wy);
        ctx.lineTo(wx + Math.cos(a) * wheelR * 0.82, wy + Math.sin(a) * wheelR * 0.82);
        ctx.stroke();
      }
    }
    wheel(-120, 0); wheel(120, 0);
    // frame
    ctx.strokeStyle = "#7a3b2e"; ctx.lineWidth = 12; ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-120, 0); ctx.lineTo(-30, -96); ctx.lineTo(96, -96);
    ctx.moveTo(-30, -96); ctx.lineTo(30, 0); ctx.lineTo(120, 0);
    ctx.moveTo(-30, -96); ctx.lineTo(-64, -160);
    ctx.stroke();
    // handlebar
    ctx.beginPath(); ctx.moveTo(-64, -160); ctx.lineTo(-96, -178); ctx.stroke();
    // seat
    ctx.fillStyle = "#3a3226";
    ctx.beginPath(); ctx.roundRect(-58, -172, 56, 14, 7); ctx.fill();

    // ---- woman ----
    const bob = crash === 0 ? Math.sin(t * 6) * 3 : 0;
    // legs to pedal
    const pedalA = spin;
    ctx.strokeStyle = "#b86a4e"; ctx.lineWidth = 15; ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-34, -110 + bob);
    ctx.lineTo(30 + Math.cos(pedalA) * 26, Math.sin(pedalA) * 26 - 6);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-34, -110 + bob);
    ctx.lineTo(30 + Math.cos(pedalA + Math.PI) * 26, Math.sin(pedalA + Math.PI) * 26 - 6);
    ctx.stroke();
    // dress body
    ctx.fillStyle = "#c96f52";
    ctx.beginPath();
    ctx.moveTo(-52, -96 + bob);
    ctx.quadraticCurveTo(-10, -116 + bob, 8, -170 + bob);
    ctx.lineTo(36, -166 + bob);
    ctx.quadraticCurveTo(30, -100 + bob, 60, -84 + bob);
    ctx.closePath(); ctx.fill();
    // scarf flowing
    ctx.strokeStyle = "#e8b47a"; ctx.lineWidth = 9;
    ctx.beginPath();
    ctx.moveTo(6, -172 + bob);
    ctx.quadraticCurveTo(-70 - crash * 60, -150 + bob + Math.sin(t * 5) * 14, -150 - crash * 140, -120 + bob + Math.sin(t * 5) * 20);
    ctx.stroke();
    // head
    ctx.fillStyle = "#eab892";
    ctx.beginPath(); ctx.arc(24, -206 + bob, 26, 0, 7); ctx.fill();
    // hair bun
    ctx.fillStyle = "#4a3826";
    ctx.beginPath(); ctx.arc(44, -212 + bob, 13, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.arc(16, -224 + bob, 20, Math.PI * 0.9, Math.PI * 2.2); ctx.fill();
    // straw hat
    ctx.save();
    ctx.translate(24, -224 + bob);
    ctx.rotate(-0.12 + Math.sin(t * 3) * 0.03 - crash * 0.5);
    ctx.fillStyle = "#e5cf9e";
    ctx.beginPath(); ctx.ellipse(0, 0, 62, 14, 0, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.arc(0, -8, 30, Math.PI, 0); ctx.fill();
    ctx.fillStyle = "#b89a64";
    ctx.fillRect(-30, -12, 60, 7);
    ctx.restore();

    // hat flies off during fall
    if (crash > 0.35) {
      const he = ease(seg(t, 8.35, 9.4));
      ctx.save();
      ctx.translate(bx + 60 + he * 300, by - 380 - he * 160);
      ctx.rotate(he * 2.4);
      ctx.fillStyle = "#e5cf9e";
      ctx.beginPath(); ctx.ellipse(0, 0, 58, 13, 0, 0, 7); ctx.fill();
      ctx.beginPath(); ctx.arc(0, -8, 27, Math.PI, 0); ctx.fill();
      ctx.restore();
    }
    ctx.restore();

    // motion streaks while falling
    if (crash > 0) {
      ctx.strokeStyle = "rgba(255,255,255," + (0.5 * (1 - crash)) + ")";
      ctx.lineWidth = 6;
      for (let i = 0; i < 7; i++) {
        const yy = 700 + i * 60;
        ctx.beginPath();
        ctx.moveTo(1400 - i * 90, yy);
        ctx.lineTo(1560 - i * 90, yy + 40);
        ctx.stroke();
      }
    }

    // ---- punchline overlay 9-13s ----
    const ov = seg(t, 9, 9.8);
    if (ov > 0) {
      ctx.fillStyle = "rgba(245,239,228," + ov + ")";
      ctx.fillRect(0, 0, W, H);
      const ls = seg(t, 9.5, 10.3);
      const logo = logoImg();
      const lscale = 1.9 * (0.9 + 0.1 * ease(ls));
      const lw = 180 * lscale, lh = 180 * lscale;
      const lx = W / 2 - lw / 2, ly = 300;
      if (ls > 0) {
        ctx.globalAlpha = Math.min(1, ls * 1.6);
        if (logo) ctx.drawImage(logo, lx, ly, lw, lh);
        else {
          ctx.fillStyle = "#c8102e";
          ctx.beginPath(); ctx.roundRect(lx, ly, lw, lh, 24); ctx.fill();
          ctx.fillStyle = "#fff";
          ctx.font = "700 120px Georgia";
          ctx.textAlign = "center"; ctx.textBaseline = "middle";
          ctx.fillText("If", W / 2, ly + lh / 2);
        }
        ctx.globalAlpha = 1;
      }
      const qs = seg(t, 10.2, 11);
      if (qs > 0) {
        ctx.globalAlpha = qs;
        ctx.fillStyle = "#3a3226";
        ctx.font = "500 84px Georgia";
        ctx.textAlign = "center";
        ctx.fillText("if only you had if..", W / 2, 700);
        ctx.globalAlpha = 1;
      }
    }
  }
  window.SCENE = { draw, duration: 13 };
})();
