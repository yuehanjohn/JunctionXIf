// Scene 2 — Product showcase. 30s.
// Flow: City in/out -> search -> cheapest firm -> If home insurance view ->
// checklist tick -> confetti. 1920x1080. Warm paper palette.
(function () {
  const ease = (x) => x < 0 ? 0 : x > 1 ? 1 : x * x * (3 - 2 * x);
  const clamp01 = (x) => x < 0 ? 0 : x > 1 ? 1 : x;
  const seg = (t, a, b) => clamp01((t - a) / (b - a));

  // palette
  const C = {
    paper: "#f5efe4", card: "#fdfaf4", ink: "#3a3226", muted: "#8a7d68",
    line: "#e2d8c4", accent: "#e8956d", ifred: "#c8102e", green: "#5f9e6e",
    blue: "#4a7ba6", shadow: "rgba(90,70,45,0.08)"
  };

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
  }

  function shadowOn(ctx, blur, dy) {
    ctx.shadowColor = "rgba(90,70,45,0.14)";
    ctx.shadowBlur = blur;
    ctx.shadowOffsetY = dy;
  }
  function shadowOff(ctx) {
    ctx.shadowColor = "transparent"; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
  }

  function cursor(ctx, x, y, scale, click) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.fillStyle = "#3a3226";
    ctx.beginPath();
    ctx.moveTo(0, 0); ctx.lineTo(0, 26); ctx.lineTo(7, 19); ctx.lineTo(11, 28);
    ctx.lineTo(15, 26); ctx.lineTo(11, 17); ctx.lineTo(19, 17);
    ctx.closePath(); ctx.fill();
    if (click > 0) {
      ctx.strokeStyle = "rgba(58,50,38," + (1 - click) + ")";
      ctx.lineWidth = 2;
      const r = 14 + click * 22;
      ctx.beginPath(); ctx.arc(4, 4, r, 0, 7); ctx.stroke();
    }
    ctx.restore();
  }

  // animated text typing
  function typing(ctx, text, x, y, reveal, font, color) {
    ctx.font = font; ctx.fillStyle = color; ctx.textAlign = "left";
    const n = Math.floor(text.length * reveal);
    ctx.fillText(text.slice(0, n), x, y);
    if (reveal < 1 && Math.floor(t_global * 3) % 2 === 0) {
      ctx.fillText("|", x + ctx.measureText(text.slice(0, n)).width + 2, y);
    }
  }

  let t_global = 0;

  function draw(ctx, t, W, H) {
    t_global = t;
    // background
    ctx.fillStyle = C.paper;
    ctx.fillRect(0, 0, W, H);

    // browser window
    const bx = 160, by = 110, bw = 1600, bh = 860;
    shadowOn(ctx, 40, 18);
    ctx.fillStyle = "#fdfaf4";
    roundRect(ctx, bx, by, bw, bh, 18); ctx.fill();
    shadowOff(ctx);
    // title bar
    ctx.fillStyle = "#ece3d0";
    roundRect(ctx, bx, by, bw, 56, [18, 18, 0, 0]); ctx.fill();
    ctx.fillStyle = "#d4c5a5";
    [[bx + 34, by + 28, "#e08a72"], [bx + 64, by + 28, "#e8c060"], [bx + 94, by + 28, "#a0c080"]].forEach(([cx, cy, col]) => {
      ctx.fillStyle = col;
      ctx.beginPath(); ctx.arc(cx, cy, 8, 0, 7); ctx.fill();
    });
    ctx.fillStyle = C.muted;
    ctx.font = "500 20px 'Segoe UI', sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("Soft Landing — mover comparison & If insurance", bx + 130, by + 35);

    // ---- content ----
    ctx.save();
    ctx.beginPath(); roundRect(ctx, bx, by + 56, bw, bh - 56, [0, 0, 18, 18]); ctx.clip();

    // header logo
    ctx.fillStyle = C.ifred;
    roundRect(ctx, bx + 40, by + 92, 56, 56, 12); ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.font = "700 32px Georgia";
    ctx.textAlign = "center";
    ctx.fillText("If", bx + 68, by + 130);

    ctx.fillStyle = C.ink;
    ctx.font = "600 28px 'Segoe UI', sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("Soft Landing", bx + 116, by + 130);

    // phase 1: search form (0-9s)
    const searchFade = 1 - seg(t, 9.5, 10.5);  // fades out after 9.5s
    if (searchFade > 0) {
      ctx.globalAlpha = searchFade;
      const fy = by + 220;
      // card
      shadowOn(ctx, 24, 10);
      ctx.fillStyle = C.card;
      roundRect(ctx, bx + 180, fy, bw - 360, 240, 16); ctx.fill();
      shadowOff(ctx);
      ctx.strokeStyle = C.line; ctx.lineWidth = 2; ctx.stroke();

      // from field
      ctx.fillStyle = C.muted; ctx.font = "500 18px 'Segoe UI'";
      ctx.fillText("MOVING FROM", bx + 220, fy + 42);
      ctx.fillStyle = "#fff";
      roundRect(ctx, bx + 220, fy + 58, 420, 52, 10); ctx.fill();
      ctx.strokeStyle = seg(t, 1, 2) > 0 ? C.blue : C.line;
      ctx.stroke();
      const fromReveal = seg(t, 1.2, 2.8);
      typing(ctx, "Helsinki", bx + 240, fy + 92, fromReveal, "400 26px 'Segoe UI'", C.ink);

      // to field
      ctx.fillText("MOVING TO", bx + 700, fy + 42);
      ctx.fillStyle = "#fff";
      roundRect(ctx, bx + 700, fy + 58, 420, 52, 10); ctx.fill();
      ctx.strokeStyle = seg(t, 3, 4) > 0 ? C.blue : C.line;
      ctx.stroke();
      const toReveal = seg(t, 3.2, 4.8);
      typing(ctx, "Tampere", bx + 720, fy + 92, toReveal, "400 26px 'Segoe UI'", C.ink);

      // search button
      const btnIn = seg(t, 5, 6);
      const btnHover = seg(t, 6, 6.8);
      const btnClick = seg(t, 7.8, 8.1);
      const press = 1 - btnClick * 0.6;
      ctx.save();
      ctx.translate(bx + 1200 + 100 * btnIn, fy + 58);
      ctx.scale(press, press);
      shadowOn(ctx, 18, 6);
      ctx.fillStyle = C.accent;
      roundRect(ctx, 0, 0, 260, 52, 10); ctx.fill();
      shadowOff(ctx);
      ctx.fillStyle = "#fff";
      ctx.font = "600 24px 'Segoe UI'";
      ctx.textAlign = "center";
      ctx.fillText("Search", 130, 34);
      ctx.restore();

      // mouse cursor moving from bottom right to button then clicking
      const cx0 = bx + 1500, cy0 = by + 800;
      const cx1 = bx + 1200 + 130, cy1 = fy + 84;
      const m1 = ease(seg(t, 5.5, 6.6));
      const mx = cx0 + (cx1 - cx0) * m1;
      const my = cy0 + (cy1 - cy0) * m1;
      cursor(ctx, mx, my, 1.4, btnClick > 0 ? btnClick : 0);
      ctx.globalAlpha = 1;
    }

    // phase 2: results (9.5-20s)
    const resIn = seg(t, 9.8, 11.2);
    const resOut = seg(t, 18.5, 19.5);
    const resAlpha = Math.min(resIn, 1 - resOut);
    if (resAlpha > 0) {
      ctx.globalAlpha = resAlpha;
      const ry = by + 220 - (1 - resIn) * 60;
      // heading
      ctx.fillStyle = C.ink;
      ctx.font = "600 30px 'Segoe UI'";
      ctx.textAlign = "left";
      ctx.fillText("13 moving firms · Helsinki → Tampere", bx + 200, ry + 30);
      ctx.fillStyle = C.muted;
      ctx.font = "400 20px 'Segoe UI'";
      ctx.fillText("Cheapest total, fixed quotes — sorted by price", bx + 200, ry + 62);

      // three mover cards
      const movers = [
        { name: "Kyyti-Muutot Oy", price: "€590", tag: "cheapest", x: bx + 200, w: 400 },
        { name: "Pohjolan Siirto", price: "€640", tag: "", x: bx + 620, w: 400 },
        { name: "Suomen Muuttoveljet", price: "€710", tag: "", x: bx + 1040, w: 400 },
      ];
      movers.forEach((m, i) => {
        const cy = ry + 100 + i * 130;
        const cardIn = ease(seg(t, 11 + i * 0.5, 12 + i * 0.5));
        const isCheapest = i === 0;
        const hover = isCheapest ? ease(seg(t, 14.5, 15.5)) : 0;
        const selected = isCheapest ? seg(t, 16, 16.4) : 0;
        const px = m.x + (1 - cardIn) * 80;
        ctx.save();
        ctx.globalAlpha = resAlpha * cardIn;
        shadowOn(ctx, 20, 8);
        ctx.fillStyle = selected ? "#f0f7ee" : C.card;
        roundRect(ctx, px, cy, m.w, 110, 14); ctx.fill();
        shadowOff(ctx);
        ctx.strokeStyle = selected ? C.green : (isCheapest && hover ? C.accent : C.line);
        ctx.lineWidth = selected ? 4 : 2;
        ctx.stroke();

        // rank
        ctx.fillStyle = isCheapest ? C.green : C.muted;
        ctx.font = "700 22px 'Segoe UI'";
        ctx.fillText((i + 1).toString(), px + 28, cy + 44);
        // name
        ctx.fillStyle = C.ink;
        ctx.font = "600 24px 'Segoe UI'";
        ctx.fillText(m.name, px + 70, cy + 44);
        // rating
        ctx.fillStyle = "#e8b44c";
        ctx.font = "400 18px 'Segoe UI'";
        ctx.fillText("★ 4." + (7 - i) + " · damage rate " + (1.2 + i * 1.4).toFixed(1) + "%", px + 70, cy + 74);
        // price
        ctx.fillStyle = isCheapest ? C.green : C.ink;
        ctx.font = "700 34px 'Segoe UI'";
        ctx.textAlign = "right";
        ctx.fillText(m.price, px + m.w - 30, cy + 55);
        ctx.textAlign = "left";
        if (m.tag) {
          ctx.fillStyle = C.green;
          ctx.font = "600 16px 'Segoe UI'";
          ctx.fillText("CHEAPEST", px + 240, cy + 30);
        }
        ctx.restore();
      });

      // cursor to cheapest card book button
      const bookX = movers[0].x + movers[0].w - 70;
      const bookY = ry + 100 + 55;
      const m2 = ease(seg(t, 15.2, 16.2));
      const bookClick = seg(t, 16.8, 17.1);
      cursor(ctx, bookX + (1 - m2) * 200, bookY, 1.4, bookClick > 0 ? bookClick : 0);

      ctx.globalAlpha = 1;
    }

    // phase 3: insurance view (19.5-24.5s)
    const insIn = seg(t, 19.8, 21.2);
    const insOut = seg(t, 23.5, 24.5);
    const insAlpha = Math.min(insIn, 1 - insOut);
    if (insAlpha > 0) {
      ctx.globalAlpha = insAlpha;
      const iy = by + 220 - (1 - insIn) * 60;
      shadowOn(ctx, 24, 10);
      ctx.fillStyle = C.card;
      roundRect(ctx, bx + 200, iy, bw - 400, 320, 16); ctx.fill();
      shadowOff(ctx);
      ctx.strokeStyle = C.line; ctx.lineWidth = 2; ctx.stroke();

      // calculating spinner
      const calcT = seg(t, 20, 22);
      if (calcT < 1) {
        ctx.strokeStyle = C.blue; ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.arc(bx + 340, iy + 80, 24, t * 4, t * 4 + 4.2);
        ctx.stroke();
        ctx.fillStyle = C.ink;
        ctx.font = "500 26px 'Segoe UI'";
        ctx.fillText("Calculating best home insurance…", bx + 400, iy + 88);
      } else {
        // result
        ctx.fillStyle = C.ifred;
        roundRect(ctx, bx + 240, iy + 30, 64, 64, 14); ctx.fill();
        ctx.fillStyle = "#fff";
        ctx.font = "700 38px Georgia";
        ctx.textAlign = "center";
        ctx.fillText("If", bx + 272, iy + 74);
        ctx.textAlign = "left";
        ctx.fillStyle = C.ink;
        ctx.font = "600 28px 'Segoe UI'";
        ctx.fillText("If Vahinkovakuutus — Home Insurance", bx + 330, iy + 60);
        ctx.fillStyle = C.green;
        ctx.font = "700 26px 'Segoe UI'";
        ctx.fillText("Best match", bx + 330, iy + 94);
        // premium breakdown
        ctx.fillStyle = C.muted;
        ctx.font = "400 20px 'Segoe UI'";
        const lines = [
          ["Home type: apartment", "+ €2.10"],
          ["Build year: 2014", "+ €1.40"],
          ["Deductible: €500", "− €0.60"],
        ];
        lines.forEach(([l, v], i) => {
          ctx.fillText(l, bx + 240, iy + 150 + i * 34);
          ctx.textAlign = "right";
          ctx.fillText(v, bx + 700, iy + 150 + i * 34);
          ctx.textAlign = "left";
        });
        ctx.strokeStyle = C.line; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(bx + 240, iy + 262); ctx.lineTo(bx + 700, iy + 262); ctx.stroke();
        ctx.fillStyle = C.ink;
        ctx.font = "700 28px 'Segoe UI'";
        ctx.fillText("Monthly premium", bx + 240, iy + 298);
        ctx.fillStyle = C.ifred;
        ctx.font = "700 36px 'Segoe UI'";
        ctx.textAlign = "right";
        ctx.fillText("€9.80/mo", bx + 700, iy + 300);
        ctx.textAlign = "left";
      }
      ctx.globalAlpha = 1;
    }

    // phase 4: checklist (24.5-28.5s)
    const clIn = seg(t, 24.8, 26.2);
    const clAlpha = clIn;
    if (clAlpha > 0) {
      ctx.globalAlpha = clAlpha;
      const ly = by + 220 - (1 - clIn) * 60;
      ctx.fillStyle = C.ink;
      ctx.font = "600 30px 'Segoe UI'";
      ctx.fillText("Moving checklist — 3 days out", bx + 200, ly + 30);
      const items = [
        { label: "DVV muuttoilmoitus", done: true },
        { label: "Posti mail forwarding", done: true },
        { label: "Electricity contract", done: false },
        { label: "Moving-elevator booking", done: false },
        { label: "Fragile-item packing", done: false },
      ];
      items.forEach((it, i) => {
        const iy = ly + 70 + i * 74;
        const tickT = it.done ? 1 : seg(t, 25.5 + i * 0.35, 25.9 + i * 0.35);
        // box
        ctx.fillStyle = "#fff";
        roundRect(ctx, bx + 200, iy, 40, 40, 8); ctx.fill();
        ctx.strokeStyle = tickT > 0 ? C.green : C.line;
        ctx.lineWidth = 3; ctx.stroke();
        if (tickT > 0) {
          ctx.strokeStyle = C.green; ctx.lineWidth = 5; ctx.lineCap = "round";
          ctx.beginPath();
          ctx.moveTo(bx + 210, iy + 20);
          ctx.lineTo(bx + 218, iy + 30);
          ctx.lineTo(bx + 234, iy + 10);
          ctx.stroke();
        }
        // strike-through on tick
        ctx.fillStyle = tickT > 0 ? C.muted : C.ink;
        ctx.font = "500 26px 'Segoe UI'";
        ctx.fillText(it.label, bx + 270, iy + 28);
        if (tickT > 0) {
          const sw = ctx.measureText(it.label).width * tickT;
          ctx.strokeStyle = C.muted; ctx.lineWidth = 3;
          ctx.beginPath(); ctx.moveTo(bx + 270, iy + 20); ctx.lineTo(bx + 270 + sw, iy + 20); ctx.stroke();
        }
      });
      ctx.globalAlpha = 1;
    }

    // ---- confetti (28.5-30s) ----
    const cf = seg(t, 28.5, 30);
    if (cf > 0) {
      const seedRand = (i, k) => {
        const x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453;
        return x - Math.floor(x);
      };
      for (let i = 0; i < 120; i++) {
        const angle = seedRand(i, 1) * Math.PI * 2;
        const speed = 200 + seedRand(i, 2) * 700;
        const prog = ease(cf);
        const px = W / 2 + Math.cos(angle) * speed * prog;
        const py = H / 2 + Math.sin(angle) * speed * prog + prog * prog * 500;
        const alpha = 1 - seg(t, 29.3, 30);
        const colors = [C.accent, C.ifred, C.green, C.blue, "#e8b44c"];
        ctx.globalAlpha = Math.max(0, alpha);
        ctx.fillStyle = colors[i % 5];
        ctx.save();
        ctx.translate(px, py);
        ctx.rotate(t * 6 + i);
        const s = 8 + seedRand(i, 3) * 10;
        ctx.fillRect(-s / 2, -s / 2, s, s * (0.4 + seedRand(i, 4)));
        ctx.restore();
        ctx.globalAlpha = 1;
      }
    }

    ctx.restore();

    // bottom progress bar (product brand bar)
    ctx.fillStyle = C.line;
    ctx.fillRect(bx, by + bh - 6, bw, 6);
    ctx.fillStyle = C.ifred;
    ctx.fillRect(bx, by + bh - 6, bw * (t / 30), 6);

    // subtle vignette
    const vg = ctx.createRadialGradient(W / 2, H / 2, 600, W / 2, H / 2, 1400);
    vg.addColorStop(0, "rgba(0,0,0,0)");
    vg.addColorStop(1, "rgba(120,80,40,0.10)");
    ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
  }
  window.SCENE = { draw, duration: 30 };
})();
