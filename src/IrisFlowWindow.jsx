"use client";

import { useEffect, useRef } from "react";

/**
 * Palette reconstructed from your Van Gogh irises detail:
 * deep indigo, ultramarine, cobalt, pale blue,
 * acid yellow-green, sap green, cadmium yellow, warm orange.
 */
const PALETTE = [
  [18, 22, 58],    // deep indigo
  [39, 58, 120],   // ultramarine
  [92, 130, 196],  // cobalt blue
  [164, 191, 225], // pale blue
  [185, 214, 60],  // acid yellow-green
  [106, 153, 58],  // sap / olive green
  [234, 188, 34],  // cadmium yellow
  [226, 121, 28],  // orange
];

const COLOR_WEIGHTS = [
  0, 0,
  1, 1, 1,
  2, 2, 2,
  3,
  4, 4,
  5, 5,
  6, 6,
  7,
];

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
const lerp = (a, b, t) => a + (b - a) * t;

function pickColor() {
  return PALETTE[
    COLOR_WEIGHTS[Math.floor(Math.random() * COLOR_WEIGHTS.length)]
  ];
}

function smoothPulse(t) {
  // calm -> surge -> calm
  return 0.5 + 0.5 * Math.sin(t);
}

export default function IrisFlowWindow({
  className = "",
  style = {},
  particleCount = 620,
  speed = 1,
  intensity = 1,
  interactive = true,
  showChrome = false,
}) {
  const rootRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    if (!root || !canvas) return;

    const ctx = canvas.getContext("2d", {
      alpha: true,
      desynchronized: true,
    });
    if (!ctx) return;

    let width = 1;
    let height = 1;
    let dpr = 1;
    let raf = 0;
    let previousTime = performance.now();
    let particles = [];

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const pointer = {
      x: 0,
      y: 0,
      active: 0,
      down: false,
    };

    function resetParticle(p, anywhere = false) {
      if (anywhere) {
        p.x = Math.random() * width;
        p.y = Math.random() * height;
      } else {
        // respawn near edges so the whole panel stays alive
        const side = Math.floor(Math.random() * 4);
        if (side === 0) {
          p.x = Math.random() * width;
          p.y = -20;
        } else if (side === 1) {
          p.x = width + 20;
          p.y = Math.random() * height;
        } else if (side === 2) {
          p.x = Math.random() * width;
          p.y = height + 20;
        } else {
          p.x = -20;
          p.y = Math.random() * height;
        }
      }

      p.vx = (Math.random() - 0.5) * 8;
      p.vy = (Math.random() - 0.5) * 8;

      p.age = 0;
      p.life = 4 + Math.random() * 7;
      p.maxLife = p.life;

      p.seed = Math.random() * Math.PI * 2;
      p.color = pickColor();

      // Thicker / more painterly ribbons
      p.width = 1.0 + Math.random() * 1.8;
      p.opacity = 0.16 + Math.random() * 0.28;
      p.accent = Math.random() > 0.8;
    }

    function resize() {
      const rect = root.getBoundingClientRect();
      width = Math.max(2, rect.width);
      height = Math.max(2, rect.height);

      dpr = Math.min(window.devicePixelRatio || 1, 1.8);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      const areaScale = clamp(
        Math.sqrt((width * height) / (300 * 400)),
        0.75,
        1.35
      );

      const motionScale = reducedMotion ? 0.42 : 1;
      const count = Math.round(
        particleCount * areaScale * motionScale
      );

      particles = Array.from({ length: count }, () => {
        const p = {};
        resetParticle(p, true);
        return p;
      });

      paintBase();
    }

    function paintBase() {
      // cleaner, less industrial, more deep-paint atmosphere
      const bg = ctx.createLinearGradient(0, 0, width, height);
      bg.addColorStop(0, "#0f1635");
      bg.addColorStop(0.38, "#13214a");
      bg.addColorStop(0.72, "#152244");
      bg.addColorStop(1, "#0d1430");

      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, width, height);

      // subtle color wash, but no dirty round glows
      ctx.globalAlpha = 0.09;
      const wash1 = ctx.createLinearGradient(0, 0, width, height * 0.7);
      wash1.addColorStop(0, "rgba(180,214,60,0.9)");
      wash1.addColorStop(0.3, "rgba(226,121,28,0.18)");
      wash1.addColorStop(0.65, "rgba(92,130,196,0.32)");
      wash1.addColorStop(1, "rgba(18,22,58,0)");

      ctx.fillStyle = wash1;
      ctx.fillRect(0, 0, width, height);

      ctx.globalAlpha = 1;
    }

    function getVortices(time, energy) {
      const unit = Math.min(width, height);

      return [
        {
          x: width * (0.25 + Math.sin(time * 0.22) * 0.06),
          y: height * (0.22 + Math.cos(time * 0.18) * 0.04),
          radius: unit * (0.28 + energy * 0.04),
          spin: 1.05,
        },
        {
          x: width * (0.72 + Math.cos(time * 0.19 + 1.2) * 0.06),
          y: height * (0.34 + Math.sin(time * 0.21 + 0.7) * 0.05),
          radius: unit * (0.25 + energy * 0.05),
          spin: -1.1,
        },
        {
          x: width * (0.33 + Math.sin(time * 0.17 + 2.0) * 0.07),
          y: height * (0.70 + Math.cos(time * 0.15 + 1.7) * 0.04),
          radius: unit * (0.29 + energy * 0.04),
          spin: -0.92,
        },
        {
          x: width * (0.78 + Math.cos(time * 0.2 + 3.4) * 0.05),
          y: height * (0.77 + Math.sin(time * 0.18 + 2.9) * 0.05),
          radius: unit * (0.24 + energy * 0.03),
          spin: 1.15,
        },
        {
          x: width * 0.53,
          y: height * 0.52,
          radius: unit * (0.16 + energy * 0.02),
          spin: 0.55,
        },
      ];
    }

    function sampleField(x, y, time, energy, vortices, seed) {
      let fx = 0;
      let fy = 0;

      for (const v of vortices) {
        const dx = x - v.x;
        const dy = y - v.y;
        const d2 = dx * dx + dy * dy;
        const d = Math.sqrt(d2) + 0.001;

        const falloff = Math.exp(-d2 / (2 * v.radius * v.radius));

        const tangential =
          v.spin *
          (65 + energy * 85) *
          falloff *
          (0.45 + Math.min(1, d / (v.radius * 0.9))) *
          intensity;

        const inward =
          (8 + energy * 16) * falloff * intensity;

        fx += (-dy / d) * tangential;
        fy += (dx / d) * tangential;

        fx += (-dx / d) * inward;
        fy += (-dy / d) * inward;
      }

      // Broad painterly interference, less "tech", more "flow mass"
      fx +=
        Math.sin(y * 0.012 + time * 0.8 + seed) *
          (10 + energy * 9) +
        Math.cos((x + y) * 0.007 - time * 0.43) *
          (9 + energy * 6);

      fy +=
        Math.cos(x * 0.011 - time * 0.72 - seed) *
          (11 + energy * 8) +
        Math.sin((x - y) * 0.007 + time * 0.35) *
          (8 + energy * 7);

      // A gentle vertical sweep to fit the tall 3:4 format
      fy += 4.5 + energy * 2.5;

      if (interactive && pointer.active > 0.002) {
        const dx = x - pointer.x;
        const dy = y - pointer.y;
        const d2 = dx * dx + dy * dy;
        const d = Math.sqrt(d2) + 0.001;
        const radius = Math.min(width, height) * 0.28;
        const falloff =
          Math.exp(-d2 / (2 * radius * radius)) * pointer.active;

        const swirl = (pointer.down ? 120 : 72) * falloff;
        const pull = (pointer.down ? -28 : -8) * falloff;

        fx += (-dy / d) * swirl + (dx / d) * pull;
        fy += (dx / d) * swirl + (dy / d) * pull;
      }

      return { fx, fy };
    }

    function drawPainterlyStroke(x1, y1, x2, y2, color, width, alpha, energy, accent) {
      const [r, g, b] = color;

      // underpaint: soft wider body
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = alpha * 0.26;
      ctx.strokeStyle = `rgb(${r}, ${g}, ${b})`;
      ctx.lineWidth = width * (1.95 + energy * 0.35);
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();

      // main ribbon
      ctx.globalAlpha = alpha;
      ctx.lineWidth = width * (1.05 + energy * 0.2);
      ctx.strokeStyle = `rgb(${r}, ${g}, ${b})`;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();

      // highlight on some strokes
      if (accent) {
        const hr = clamp(r + 22, 0, 255);
        const hg = clamp(g + 22, 0, 255);
        const hb = clamp(b + 16, 0, 255);

        ctx.globalAlpha = alpha * 0.42;
        ctx.lineWidth = width * 0.44;
        ctx.strokeStyle = `rgb(${hr}, ${hg}, ${hb})`;
        ctx.beginPath();
        ctx.moveTo(
          lerp(x1, x2, 0.1),
          lerp(y1, y2, 0.1)
        );
        ctx.lineTo(
          lerp(x1, x2, 0.96),
          lerp(y1, y2, 0.96)
        );
        ctx.stroke();
      }
    }

    function render(now) {
      const rawDelta = Math.min(
        0.035,
        Math.max(0.001, (now - previousTime) / 1000)
      );
      previousTime = now;

      const motionScale = speed * (reducedMotion ? 0.38 : 1);
      const delta = rawDelta * motionScale;
      const time = now * 0.001 * motionScale;

      // slow breathing between calm and turbulent
      const energy = reducedMotion
        ? 0.28
        : 0.25 + 0.75 * smoothPulse(time * 0.42);

      const vortices = getVortices(time, energy);

      /**
       * translucent repaint:
       * low alpha = longer trails / calmer
       * slightly higher alpha during surge = more churning
       */
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = 1;
      ctx.fillStyle = `rgba(12, 16, 40, ${0.045 + energy * 0.04})`;
      ctx.fillRect(0, 0, width, height);

      for (const p of particles) {
        const px = p.x;
        const py = p.y;

        const { fx, fy } = sampleField(
          p.x,
          p.y,
          time,
          energy,
          vortices,
          p.seed
        );

        const response = 1 - Math.exp(-delta * (2.2 + energy * 1.8));

        p.vx += (fx - p.vx) * response;
        p.vy += (fy - p.vy) * response;

        const maxV = 120 + energy * 90;
        let velocity = Math.hypot(p.vx, p.vy);

        if (velocity > maxV) {
          const s = maxV / velocity;
          p.vx *= s;
          p.vy *= s;
          velocity = maxV;
        }

        p.x += p.vx * delta;
        p.y += p.vy * delta;

        p.age += delta;
        p.life -= delta;

        const fadeIn = clamp(p.age / 0.85, 0, 1);
        const fadeOut = clamp(p.life / 1.2, 0, 1);
        const lifeFade = fadeIn * fadeOut;

        const alpha =
          p.opacity *
          lifeFade *
          clamp(velocity / 65, 0.38, 1.05);

        drawPainterlyStroke(
          px,
          py,
          p.x,
          p.y,
          p.color,
          p.width,
          alpha,
          energy,
          p.accent
        );

        const outside =
          p.x < -40 ||
          p.x > width + 40 ||
          p.y < -40 ||
          p.y > height + 40;

        if (outside || p.life <= 0) {
          resetParticle(p, false);
        }
      }

      // light color glaze during energetic moments
      if (energy > 0.62) {
        ctx.globalCompositeOperation = "screen";
        ctx.globalAlpha = 0.035 + (energy - 0.62) * 0.05;

        const glaze = ctx.createLinearGradient(0, 0, width, height);
        glaze.addColorStop(0, "rgba(185,214,60,0.7)");
        glaze.addColorStop(0.28, "rgba(226,121,28,0.45)");
        glaze.addColorStop(0.55, "rgba(92,130,196,0.55)");
        glaze.addColorStop(1, "rgba(18,22,58,0)");

        ctx.fillStyle = glaze;
        ctx.fillRect(0, 0, width, height);
      }

      pointer.active *= Math.pow(pointer.down ? 0.992 : 0.95, rawDelta * 60);

      raf = requestAnimationFrame(render);
    }

    function updatePointer(event) {
      if (!interactive) return;
      const rect = root.getBoundingClientRect();
      pointer.x = event.clientX - rect.left;
      pointer.y = event.clientY - rect.top;
      pointer.active = Math.min(1.1, pointer.active + 0.18);
    }

    function onDown(e) {
      updatePointer(e);
      pointer.down = true;
      pointer.active = 1.1;
    }

    function onUp() {
      pointer.down = false;
    }

    const observer = new ResizeObserver(resize);
    observer.observe(root);

    root.addEventListener("pointermove", updatePointer);
    root.addEventListener("pointerdown", onDown);
    root.addEventListener("pointerleave", onUp);
    window.addEventListener("pointerup", onUp);

    resize();
    raf = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      root.removeEventListener("pointermove", updatePointer);
      root.removeEventListener("pointerdown", onDown);
      root.removeEventListener("pointerleave", onUp);
      window.removeEventListener("pointerup", onUp);
    };
  }, [particleCount, speed, intensity, interactive]);

  return (
    <div
      ref={rootRef}
      className={className}
      aria-hidden="true"
      style={{
        position: "relative",
        width: "100%",
        aspectRatio: "3 / 4",
        overflow: "hidden",
        isolation: "isolate",
        borderRadius: "18px",
        background: `
          linear-gradient(
            150deg,
            #11193b 0%,
            #13224c 45%,
            #0f1737 100%
          )
        `,
        boxShadow: `
          0 20px 50px rgba(9, 12, 24, 0.22),
          inset 0 0 0 1px rgba(240, 232, 205, 0.07),
          inset 0 0 80px rgba(0, 0, 0, 0.12)
        `,
        cursor: interactive ? "default" : "default",
        ...style,
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          display: "block",
        }}
      />

      {/* subtle finishing glaze */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background: `
            linear-gradient(
              180deg,
              rgba(255,255,255,0.03) 0%,
              rgba(255,255,255,0.00) 20%,
              rgba(0,0,0,0.05) 100%
            )
          `,
        }}
      />

      {showChrome && (
        <>
          <div
            style={{
              position: "absolute",
              top: 16,
              left: 18,
              color: "rgba(238, 230, 203, 0.68)",
              fontFamily:
                "ui-monospace, SFMono-Regular, Menlo, Monaco, monospace",
              fontSize: 10,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              pointerEvents: "none",
            }}
          >
            Iris field
          </div>

          <div
            style={{
              position: "absolute",
              left: 18,
              bottom: 18,
              width: 36,
              height: 1,
              background:
                "linear-gradient(90deg, rgba(234,188,34,0.9), rgba(234,188,34,0))",
              pointerEvents: "none",
            }}
          />
        </>
      )}
    </div>
  );
}