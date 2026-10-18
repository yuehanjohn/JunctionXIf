// Scene 2 — Product showcase (MoveScanner & If Home Insurance).
// 100% Real Product Screens captured from running application.
// 30 seconds (0-30s), 1920x1080 @ 30fps.
(function () {
  const clamp01 = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);
  const seg = (t, a, b) => clamp01((t - a) / (b - a));
  const ease = (x) => (x < 0 ? 0 : x > 1 ? 1 : x * x * (3 - 2 * x));
  const easeOutCubic = (x) => (x < 0 ? 0 : x > 1 ? 1 : 1 - Math.pow(1 - x, 3));
  const easeInOutCubic = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);

  // Modern browser top chrome (height = 48px)
  function drawChrome(ctx, W, url) {
    const H_BAR = 48;
    // Chrome background (warm paper tint matching MoveScanner)
    ctx.fillStyle = "#efe7da";
    ctx.fillRect(0, 0, W, H_BAR);

    // Subtle bottom border
    ctx.fillStyle = "#ded3bf";
    ctx.fillRect(0, H_BAR - 1, W, 1);

    // macOS window dots
    const dots = [
      { x: 26, color: "#ff5f56" },
      { x: 46, color: "#ffbd2e" },
      { x: 66, color: "#27c93f" },
    ];
    for (const d of dots) {
      ctx.beginPath();
      ctx.arc(d.x, H_BAR / 2, 6, 0, Math.PI * 2);
      ctx.fillStyle = d.color;
      ctx.fill();
    }

    // URL bar pill
    const pillW = 660;
    const pillH = 30;
    const pillX = (W - pillW) / 2;
    const pillY = (H_BAR - pillH) / 2;

    ctx.fillStyle = "#fdfbf7";
    ctx.beginPath();
    ctx.roundRect(pillX, pillY, pillW, pillH, 7);
    ctx.fill();
    ctx.strokeStyle = "#dbd0be";
    ctx.lineWidth = 1;
    ctx.stroke();

    // Lock icon (HTTPS)
    ctx.save();
    ctx.translate(pillX + 16, pillY + 10);
    ctx.fillStyle = "#6b7280";
    ctx.fillRect(1, 4, 8, 7);
    ctx.beginPath();
    ctx.arc(5, 4, 3, Math.PI, 0);
    ctx.lineWidth = 1.4;
    ctx.strokeStyle = "#6b7280";
    ctx.stroke();
    ctx.restore();

    // URL text
    ctx.fillStyle = "#374151";
    ctx.font = "500 13px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(url, pillX + 34, pillY + pillH / 2);

    // Brand indicator on far right
    ctx.textAlign = "right";
    ctx.fillStyle = "#8a7b68";
    ctx.font = "600 12px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    ctx.fillText("MoveScanner · Live Demo", W - 28, H_BAR / 2);
  }

  // Smooth realistic mouse pointer with click ripple
  function drawCursor(ctx, x, y, scale = 1, click = 0) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);

    // Click pulse ring
    if (click > 0) {
      const pulseR = 10 + click * 32;
      const alpha = Math.max(0, 1 - click);
      ctx.beginPath();
      ctx.arc(0, 0, pulseR, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(0, 84, 240, ${alpha * 0.75})`;
      ctx.lineWidth = 2.5;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(0, 0, pulseR * 0.45, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(0, 84, 240, ${alpha * 0.22})`;
      ctx.fill();
    }

    // Shadow
    ctx.shadowColor = "rgba(0,0,0,0.25)";
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 4;

    // Dark cursor body with crisp white stroke
    ctx.fillStyle = "#1e1e1e";
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 1.5;

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, 24);
    ctx.lineTo(6.5, 18);
    ctx.lineTo(11.5, 27);
    ctx.lineTo(14.5, 25.5);
    ctx.lineTo(9.5, 16.5);
    ctx.lineTo(17.5, 16.5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  }

  // Typing helper on top of input fields
  function drawTypingText(ctx, text, x, y, progress, font = "400 15px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif") {
    ctx.font = font;
    ctx.fillStyle = "#1c1917";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    const chars = Math.floor(text.length * progress);
    const displayed = text.slice(0, chars);
    ctx.fillText(displayed, x, y);

    // Blinking cursor
    if (progress < 1 && Math.floor(Date.now() / 400) % 2 === 0) {
      const w = ctx.measureText(displayed).width;
      ctx.fillStyle = "#0054F0";
      ctx.fillRect(x + w + 2, y - 8, 2, 16);
    }
  }

  // Confetti particles matching soft-landing/app/plan/[id]/plan-tasks.tsx
  let CONFETTI = null;
  function getConfetti(W, H) {
    if (CONFETTI) return CONFETTI;
    const seedRand = (i, k) => {
      const x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453;
      return x - Math.floor(x);
    };
    const COLORS = ["#c2410c", "#0054F0", "#16a34a", "#eab308", "#db2777"];
    const cannons = [
      { x: W * 0.08, angle: 72, count: 85 },
      { x: W * 0.92, angle: 108, count: 85 },
      { x: W * 0.50, angle: 90, count: 90 },
    ];
    const pieces = [];
    let idx = 0;
    cannons.forEach((c) => {
      for (let i = 0; i < c.count; i++) {
        const r1 = seedRand(idx, 1);
        const r2 = seedRand(idx, 2);
        const r3 = seedRand(idx, 3);
        const r4 = seedRand(idx, 4);
        const r5 = seedRand(idx, 5);

        const angle = ((c.angle + (r1 - 0.5) * 46) * Math.PI) / 180;
        const speed = H * (0.65 + r2 * 0.55);
        const vx = Math.cos(angle) * speed;
        const vy = -Math.sin(angle) * speed;
        const size = 6 + r3 * 7;
        const ribbon = r4 > 0.75;
        const w = ribbon ? 4 : size;
        const h = ribbon ? 14 + r5 * 8 : size * 0.6;
        const color = COLORS[Math.floor(r1 * COLORS.length)];
        const spin = 540 + r2 * 900;
        const duration = 2.0 + r3 * 1.4;

        pieces.push({
          x0: c.x,
          y0: H - 8,
          vx,
          vy,
          w,
          h,
          color,
          spin,
          duration,
          isCircle: r5 > 0.6,
        });
        idx++;
      }
    });
    CONFETTI = pieces;
    return CONFETTI;
  }

  function drawConfetti(ctx, W, H, elapsed) {
    const pieces = getConfetti(W, H);
    pieces.forEach((p) => {
      const prog = Math.min(1, elapsed / p.duration);
      if (prog <= 0 || prog >= 1) return;

      // Arc trajectory: upward initial boost, gravity downward
      const px = p.x0 + p.vx * prog * 0.85;
      const py = p.y0 + p.vy * prog + 980 * prog * prog;
      const alpha = prog > 0.75 ? 1 - (prog - 0.75) / 0.25 : 1;

      ctx.save();
      ctx.translate(px, py);
      ctx.rotate((p.spin * prog * Math.PI) / 180);
      ctx.globalAlpha = Math.max(0, alpha);
      ctx.fillStyle = p.color;

      if (p.isCircle) {
        ctx.beginPath();
        ctx.arc(0, 0, p.w / 2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      }
      ctx.restore();
    });
  }

  // Main draw loop
  function draw(ctx, t, W, H) {
    const H_BAR = 48;
    const CONTENT_H = H - H_BAR; // 1032px

    // Fallback background
    ctx.fillStyle = "#f5efe4";
    ctx.fillRect(0, 0, W, H);

    const A = window.ASSETS || {};

    // =========================================================================
    // PHASE 1: Real Landing Page (0.0s - 6.0s)
    // =========================================================================
    if (t < 6.2) {
      const p1Alpha = 1 - seg(t, 5.7, 6.2);
      ctx.save();
      ctx.globalAlpha = p1Alpha;

      // Render real landing page
      const landingImg = A["01_landing_empty"];
      if (landingImg) {
        ctx.drawImage(landingImg, 0, H_BAR, W, CONTENT_H);
      }

      // Typing simulation in real inputs:
      // "Moving from": x = 972, y = 212 + 48 = 260, w = 511, h = 42
      // "Moving to":   x = 972, y = 296 + 48 = 344, w = 511, h = 42
      // "Compare now": x = 972, y = 486 + 48 = 534, w = 511, h = 56
      const fromTypeProg = seg(t, 1.1, 2.2);
      if (fromTypeProg > 0) {
        // Clear placeholder text after the pin icon
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(1006, 260 + 5, 450, 32);
        drawTypingText(ctx, "Helsinki", 1008, 260 + 21, fromTypeProg);
      }

      const toTypeProg = seg(t, 2.7, 3.8);
      if (toTypeProg > 0) {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(1006, 344 + 5, 450, 32);
        drawTypingText(ctx, "Tampere", 1008, 344 + 21, toTypeProg);
      }

      // Button hover & click
      const btnHover = seg(t, 4.8, 5.2);
      const btnClick = seg(t, 5.2, 5.5);
      if (btnClick > 0 && btnClick < 1) {
        // Subtle press overlay
        ctx.fillStyle = "rgba(255,255,255,0.15)";
        ctx.beginPath();
        ctx.roundRect(972, 534, 511, 56, 8);
        ctx.fill();
      }

      // Cursor movement:
      // Enters -> clicks From -> clicks To -> moves to Submit -> clicks Submit
      let cx = 1450, cy = 720;
      let cClick = 0;

      if (t < 1.0) {
        const m = easeInOutCubic(seg(t, 0.4, 0.95));
        cx = 1450 + (1040 - 1450) * m;
        cy = 720 + (281 - 720) * m;
      } else if (t < 2.5) {
        cx = 1040; cy = 281;
        cClick = seg(t, 0.95, 1.15);
      } else if (t < 2.7) {
        const m = easeInOutCubic(seg(t, 2.5, 2.7));
        cx = 1040;
        cy = 281 + (365 - 281) * m;
      } else if (t < 4.2) {
        cx = 1040; cy = 365;
        cClick = seg(t, 2.7, 2.9);
      } else if (t < 5.2) {
        const m = easeInOutCubic(seg(t, 4.2, 5.0));
        cx = 1040 + (1227 - 1040) * m;
        cy = 365 + (562 - 365) * m;
      } else {
        cx = 1227; cy = 562;
        cClick = seg(t, 5.2, 5.5);
      }

      drawCursor(ctx, cx, cy, 1.0, cClick);
      ctx.restore();
    }

    // =========================================================================
    // PHASE 2: Real Search Comparison & Choose Cheapest Crew (6.0s - 12.5s)
    // =========================================================================
    if (t >= 5.7 && t < 12.8) {
      const p2Alpha = Math.min(seg(t, 5.7, 6.2), 1 - seg(t, 12.4, 12.8));
      ctx.save();
      ctx.globalAlpha = p2Alpha;

      // Smooth camera scroll: 0 -> 260px down
      const scrollProgress = easeInOutCubic(seg(t, 7.8, 9.8));
      const scrollY = scrollProgress * 260;

      // Draw real search page with smooth vertical scroll
      const searchImg = A["search_fullpage"] || A["02_search_top"];
      if (searchImg) {
        // Draw slice from full page
        ctx.drawImage(
          searchImg,
          0, Math.round(scrollY), W, CONTENT_H,
          0, H_BAR, W, CONTENT_H
        );
      }

      // Cursor movement:
      // Glides over the weather strip -> hovers on Sisu Crew card -> clicks "Book for €523"
      let cx = 960, cy = 320;
      let cClick = 0;

      if (t < 7.8) {
        const m = easeInOutCubic(seg(t, 6.2, 7.6));
        cx = 700 + (1020 - 700) * m;
        cy = 280 + (290 - 280) * m;
      } else if (t < 11.2) {
        const m = easeInOutCubic(seg(t, 8.5, 10.8));
        cx = 1020 + (1379 - 1020) * m;
        cy = 290 + (657 - scrollY + H_BAR - 290) * m;
      } else {
        cx = 1379;
        cy = 657 - scrollY + H_BAR;
        cClick = seg(t, 11.6, 12.1);
      }

      // Highlight on "Book for €523" button during click
      if (cClick > 0) {
        ctx.fillStyle = "rgba(0, 84, 240, 0.15)";
        ctx.beginPath();
        ctx.roundRect(1272, 637 - scrollY + H_BAR, 215, 40, 6);
        ctx.fill();
      }

      drawCursor(ctx, cx, cy, 1.0, cClick);
      ctx.restore();
    }

    // =========================================================================
    // PHASE 3: Calculating Steps & If Home Insurance Reveal (12.5s - 21.3s)
    // =========================================================================
    if (t >= 12.4 && t < 21.6) {
      const p3Alpha = Math.min(seg(t, 12.4, 12.8), 1 - seg(t, 21.0, 21.6));
      ctx.save();
      ctx.globalAlpha = p3Alpha;

      if (t < 16.5) {
        // 3.1: Calculation states
        let calcImg = A["03_calc_step0"];
        let spinY = 175; // Step 0 (127 + 48)
        if (t >= 15.1) {
          calcImg = A["03_calc_step2"];
          spinY = 241; // Step 2 (193 + 48)
        } else if (t >= 13.8) {
          calcImg = A["03_calc_step1"];
          spinY = 208; // Step 1 (160 + 48)
        }

        if (calcImg) {
          ctx.drawImage(calcImg, 0, H_BAR, W, CONTENT_H);
        }

        // Animated rotating spinner over active step icon
        const spinAngle = t * 7;
        ctx.save();
        ctx.translate(449, spinY);
        ctx.rotate(spinAngle);
        ctx.beginPath();
        ctx.arc(0, 0, 8, 0, Math.PI * 1.5);
        ctx.strokeStyle = "#0054F0";
        ctx.lineWidth = 2.4;
        ctx.stroke();
        ctx.restore();

        // Cursor waiting comfortably
        drawCursor(ctx, 1100, 480, 1.0, 0);
      } else {
        // 3.2: Real If Home Insurance Panel
        const ifRise = easeOutCubic(seg(t, 16.5, 17.2));
        const dy = Math.round((1 - ifRise) * 35);

        const ifImg = A["04_if_panel"];
        if (ifImg) {
          ctx.drawImage(ifImg, 0, H_BAR + dy, W, CONTENT_H);
        }

        // Cursor hovers over deductible, then moves to "Open your checklist"
        let cx = 1100, cy = 480;
        let cClick = 0;

        if (t < 18.5) {
          const m = easeInOutCubic(seg(t, 17.2, 18.2));
          cx = 1100 + (1320 - 1100) * m;
          cy = 480 + (515 - 480) * m; // Deductible area
        } else if (t < 20.8) {
          const m = easeInOutCubic(seg(t, 18.8, 20.4));
          cx = 1320 + (550 - 1320) * m;
          cy = 515 + (830 - 515) * m; // CTA button "Found the best home insurance..."
        } else {
          cx = 550; cy = 830;
          cClick = seg(t, 20.8, 21.2);
        }

        drawCursor(ctx, cx, cy, 1.0, cClick);
      }

      ctx.restore();
    }

    // =========================================================================
    // PHASE 4: Real MovePlan Dashboard & 260-piece Confetti (21.0s - 30.0s)
    // =========================================================================
    if (t >= 21.0) {
      const p4Alpha = seg(t, 21.0, 21.6);
      ctx.save();
      ctx.globalAlpha = p4Alpha;

      // Select plan state image based on tasks checked
      let planImg = A["plan_4_done"];
      if (t >= 27.2) planImg = A["06_plan_all_done"] || A["plan_all_done_confetti"];
      else if (t >= 26.5) planImg = A["plan_7_done"];
      else if (t >= 25.7) planImg = A["plan_6_done"];
      else if (t >= 24.8) planImg = A["plan_5_done"];

      if (planImg) {
        ctx.drawImage(planImg, 0, H_BAR, W, CONTENT_H);
      }

      // Cursor clicks remaining tasks:
      // Task 4 (elevator): x = 445, y = 852
      let cx = 600, cy = 600;
      let cClick = 0;

      if (t < 24.2) {
        const m = easeInOutCubic(seg(t, 22.2, 24.0));
        cx = 900 + (445 - 900) * m;
        cy = 500 + (852 - 500) * m;
      } else if (t < 25.0) {
        cx = 445; cy = 852;
        cClick = seg(t, 24.6, 24.9);
      } else if (t < 25.8) {
        cx = 445; cy = 852;
        cClick = seg(t, 25.5, 25.8);
      } else if (t < 26.6) {
        cx = 445; cy = 852;
        cClick = seg(t, 26.3, 26.6);
      } else if (t < 27.5) {
        cx = 445; cy = 852;
        cClick = seg(t, 27.0, 27.4);
      } else {
        // Move cursor gracefully away during confetti celebration
        const m = easeOutCubic(seg(t, 27.5, 29.0));
        cx = 445 + (1600 - 445) * m;
        cy = 852 + (900 - 852) * m;
      }

      drawCursor(ctx, cx, cy, 1.0, cClick);

      // Confetti Cannon Explosion (27.2s - 30.0s)
      if (t >= 27.2) {
        const confettiElapsed = t - 27.2;
        drawConfetti(ctx, W, H, confettiElapsed);
      }

      ctx.restore();
    }

    // =========================================================================
    // Dynamic Browser Chrome (Always crisp on top layer)
    // =========================================================================
    let currentUrl = "https://movescanner.fi";
    if (t >= 21.3) {
      currentUrl = "https://movescanner.fi/plan/s-helsinki-tampere";
    } else if (t >= 6.0) {
      currentUrl = "https://movescanner.fi/search?from=Helsinki&to=Tampere";
    }
    drawChrome(ctx, W, currentUrl);
  }

  window.SCENE = { draw, duration: 30 };
})();
