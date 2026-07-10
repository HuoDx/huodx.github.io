"use client";

import { useEffect, useRef } from "react";

/*
 * Palette extracted from the visual relationships in the painting:
 * vermilion, cadmium orange, acid green, sap green,
 * cobalt/slate blue, warm bone, and near-black indigo.
 */
const PALETTE = [
  [232, 82, 16],   // vermilion
  [244, 145, 10],  // cadmium orange
  [186, 194, 48],  // acid yellow-green
  [116, 143, 47],  // olive / sap green
  [63, 86, 133],   // cobalt slate
  [111, 137, 174], // steel blue
  [163, 180, 200], // pale blue
  [226, 214, 166], // warm bone
];

const COLOR_POOL = [
  0,
  1, 1,
  2, 2,
  3,
  4, 4, 4,
  5, 5, 5,
  6, 6,
  7,
];

const clamp = (value, min, max) =>
  Math.max(min, Math.min(max, value));

const randomColor = () =>
  PALETTE[
    COLOR_POOL[Math.floor(Math.random() * COLOR_POOL.length)]
  ];

export default function VortexWindow({
  className = "",
  style = {},
  particleCount = 900,
  speed = 1,
  intensity = 1,
  interactive = true,
}) {
  const rootRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;

    if (!root || !canvas) return undefined;

    const ctx = canvas.getContext("2d", {
      alpha: true,
      desynchronized: true,
    });

    if (!ctx) return undefined;

    let width = 1;
    let height = 1;
    let dpr = 1;
    let animationFrame = 0;
    let previousTime = performance.now();
    let particles = [];

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const pointer = {
      x: 0,
      y: 0,
      previousX: 0,
      previousY: 0,
      activity: 0,
      spin: 1,
      down: false,
    };

    function resetParticle(particle, anywhere = false) {
      if (anywhere) {
        particle.x = Math.random() * width;
        particle.y = Math.random() * height;
      } else {
        const edge = Math.floor(Math.random() * 4);

        if (edge === 0) {
          particle.x = Math.random() * width;
          particle.y = -12;
        } else if (edge === 1) {
          particle.x = width + 12;
          particle.y = Math.random() * height;
        } else if (edge === 2) {
          particle.x = Math.random() * width;
          particle.y = height + 12;
        } else {
          particle.x = -12;
          particle.y = Math.random() * height;
        }
      }

      particle.vx = (Math.random() - 0.5) * 8;
      particle.vy = (Math.random() - 0.5) * 8;
      particle.age = 0;
      particle.life = 5 + Math.random() * 10;
      particle.maxLife = particle.life;
      particle.color = randomColor();
      particle.opacity = 0.16 + Math.random() * 0.52;
      particle.width = 0.35 + Math.random() * 1.15;
      particle.seed = Math.random() * Math.PI * 2;
      particle.highlight = Math.random() > 0.88;
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
        0.7,
        1.35
      );

      const motionScale = reducedMotion ? 0.38 : 1;
      const targetCount = Math.round(
        particleCount * areaScale * motionScale
      );

      particles = Array.from({ length: targetCount }, () => {
        const particle = {};
        resetParticle(particle, true);
        return particle;
      });

      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = "#0b0d18";
      ctx.fillRect(0, 0, width, height);
    }

    function getVortices(time) {
      const unit = Math.min(width, height);

      return [
        {
          x:
            width *
            (0.28 +
              Math.sin(time * 0.37) * 0.075 +
              Math.cos(time * 0.13) * 0.025),
          y:
            height *
            (0.18 + Math.cos(time * 0.29) * 0.045),
          radius: unit * 0.38,
          spin: 1.08,
          color: PALETTE[5],
        },
        {
          x:
            width *
            (0.69 + Math.cos(time * 0.31 + 1.7) * 0.085),
          y:
            height *
            (0.39 + Math.sin(time * 0.23 + 0.8) * 0.055),
          radius: unit * 0.32,
          spin: -1.15,
          color: PALETTE[2],
        },
        {
          x:
            width *
            (0.34 + Math.sin(time * 0.27 + 2.4) * 0.1),
          y:
            height *
            (0.64 + Math.cos(time * 0.19 + 1.2) * 0.055),
          radius: unit * 0.35,
          spin: -0.92,
          color: PALETTE[1],
        },
        {
          x:
            width *
            (0.72 + Math.cos(time * 0.34 + 3.2) * 0.075),
          y:
            height *
            (0.82 + Math.sin(time * 0.24 + 2.1) * 0.04),
          radius: unit * 0.3,
          spin: 1.16,
          color: PALETTE[4],
        },
        {
          x:
            width *
            (0.5 + Math.sin(time * 0.17 + 4.4) * 0.055),
          y:
            height *
            (0.51 + Math.cos(time * 0.21 + 3.1) * 0.035),
          radius: unit * 0.22,
          spin: 0.64,
          color: PALETTE[0],
        },
      ];
    }

    function sampleField(x, y, time, vortices, particleSeed) {
      let fx = 0;
      let fy = 0;

      for (const vortex of vortices) {
        const dx = x - vortex.x;
        const dy = y - vortex.y;
        const distanceSquared = dx * dx + dy * dy;
        const distance = Math.sqrt(distanceSquared) + 0.001;

        const falloff = Math.exp(
          -distanceSquared /
            (2 * vortex.radius * vortex.radius)
        );

        const ring =
          0.36 +
          0.64 *
            Math.min(1, distance / (vortex.radius * 0.82));

        const tangential =
          vortex.spin *
          falloff *
          ring *
          118 *
          intensity;

        const inward =
          falloff *
          (8 + Math.sin(time * 0.8 + vortex.x) * 2.5) *
          intensity;

        fx += (-dy / distance) * tangential;
        fy += (dx / distance) * tangential;

        fx += (-dx / distance) * inward;
        fy += (-dy / distance) * inward;
      }

      /*
       * Low-frequency interference field.
       * This breaks up mathematically perfect circles and makes the
       * trails feel more like dragged paint or viscous fluid.
       */
      const interference =
        Math.sin(x * 0.013 + time * 0.68) +
        Math.cos(y * 0.011 - time * 0.47) +
        Math.sin((x + y) * 0.007 + time * 0.21) * 0.8;

      fx +=
        Math.cos(interference * 1.85 + time * 0.14) *
        14 *
        intensity;

      fy +=
        Math.sin(interference * 1.7 - time * 0.11) *
        13 *
        intensity;

      fx += Math.cos(time * 1.1 + particleSeed) * 2.8;
      fy += Math.sin(time * 0.9 - particleSeed * 1.3) * 2.8;

      /*
       * Interactive local vortex.
       * Move: stir the field.
       * Hold: reverse and tighten it.
       */
      if (interactive && pointer.activity > 0.002) {
        const dx = x - pointer.x;
        const dy = y - pointer.y;
        const distanceSquared = dx * dx + dy * dy;
        const distance = Math.sqrt(distanceSquared) + 0.001;
        const pointerRadius = Math.min(width, height) * 0.33;

        const falloff =
          Math.exp(
            -distanceSquared /
              (2 * pointerRadius * pointerRadius)
          ) * pointer.activity;

        const direction = pointer.down ? -1 : 1;
        const swirl =
          145 *
          falloff *
          pointer.spin *
          direction *
          intensity;

        const radial = pointer.down
          ? -38 * falloff
          : 7 * falloff;

        fx += (-dy / distance) * swirl;
        fy += (dx / distance) * swirl;

        fx += (dx / distance) * radial;
        fy += (dy / distance) * radial;
      }

      /*
       * A tiny vertical bias keeps the composition flowing
       * through the tall 3:4 frame.
       */
      fy += 3.5;

      return { fx, fy };
    }

    function drawAtmosphere(vortices) {
      ctx.save();
      ctx.globalCompositeOperation = "screen";

      vortices.forEach((vortex, index) => {
        const [r, g, b] = vortex.color;
        const glowRadius = vortex.radius * 1.15;

        const gradient = ctx.createRadialGradient(
          vortex.x,
          vortex.y,
          0,
          vortex.x,
          vortex.y,
          glowRadius
        );

        gradient.addColorStop(
          0,
          `rgba(${r}, ${g}, ${b}, ${
            index === 4 ? 0.035 : 0.055
          })`
        );
        gradient.addColorStop(
          0.48,
          `rgba(${r}, ${g}, ${b}, 0.018)`
        );
        gradient.addColorStop(
          1,
          `rgba(${r}, ${g}, ${b}, 0)`
        );

        ctx.fillStyle = gradient;
        ctx.fillRect(
          vortex.x - glowRadius,
          vortex.y - glowRadius,
          glowRadius * 2,
          glowRadius * 2
        );
      });

      ctx.restore();
    }

    function drawDarkCores(vortices) {
      ctx.save();
      ctx.globalCompositeOperation = "source-over";

      vortices.forEach((vortex, index) => {
        if (index === 1 || index === 3) return;

        const coreRadius = vortex.radius * 0.34;

        const gradient = ctx.createRadialGradient(
          vortex.x,
          vortex.y,
          0,
          vortex.x,
          vortex.y,
          coreRadius
        );

        gradient.addColorStop(
          0,
          index === 4
            ? "rgba(4, 5, 12, 0.24)"
            : "rgba(5, 6, 14, 0.15)"
        );
        gradient.addColorStop(1, "rgba(5, 6, 14, 0)");

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(
          vortex.x,
          vortex.y,
          coreRadius,
          0,
          Math.PI * 2
        );
        ctx.fill();
      });

      ctx.restore();
    }

    function render(now) {
      const rawDelta = Math.min(
        0.035,
        Math.max(0.001, (now - previousTime) / 1000)
      );

      previousTime = now;

      const motionScale =
        speed * (reducedMotion ? 0.34 : 1);

      const delta = rawDelta * motionScale;
      const time = now * 0.001 * motionScale;
      const vortices = getVortices(time);

      /*
       * A translucent repaint instead of a full clear produces
       * the long, viscous trails.
       */
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = 1;
      ctx.fillStyle = reducedMotion
        ? "rgba(10, 12, 22, 0.17)"
        : "rgba(10, 12, 22, 0.074)";
      ctx.fillRect(0, 0, width, height);

      drawAtmosphere(vortices);

      ctx.globalCompositeOperation = "lighter";

      for (const particle of particles) {
        const previousX = particle.x;
        const previousY = particle.y;

        const { fx, fy } = sampleField(
          particle.x,
          particle.y,
          time,
          vortices,
          particle.seed
        );

        const response = 1 - Math.exp(-delta * 2.65);

        particle.vx += (fx - particle.vx) * response;
        particle.vy += (fy - particle.vy) * response;

        let velocity = Math.hypot(
          particle.vx,
          particle.vy
        );

        const maximumVelocity = 185 * intensity;

        if (velocity > maximumVelocity) {
          const scale = maximumVelocity / velocity;
          particle.vx *= scale;
          particle.vy *= scale;
          velocity = maximumVelocity;
        }

        particle.x += particle.vx * delta;
        particle.y += particle.vy * delta;
        particle.age += delta;
        particle.life -= delta;

        const fadeIn = clamp(particle.age / 0.9, 0, 1);
        const fadeOut = clamp(particle.life / 1.4, 0, 1);
        const lifeFade = fadeIn * fadeOut;

        const velocityAlpha = clamp(
          velocity / 125,
          0.22,
          1
        );

        const [r, g, b] = particle.color;

        ctx.globalAlpha =
          particle.opacity *
          lifeFade *
          velocityAlpha;

        ctx.strokeStyle = `rgb(${r}, ${g}, ${b})`;
        ctx.lineWidth =
          particle.width +
          (particle.highlight ? 0.55 : 0);

        ctx.beginPath();
        ctx.moveTo(previousX, previousY);
        ctx.lineTo(particle.x, particle.y);
        ctx.stroke();

        if (
          particle.highlight &&
          velocity > 68 &&
          Math.random() > 0.985
        ) {
          ctx.globalAlpha *= 0.65;
          ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
          ctx.beginPath();
          ctx.arc(
            particle.x,
            particle.y,
            particle.width * 1.25,
            0,
            Math.PI * 2
          );
          ctx.fill();
        }

        const outside =
          particle.x < -35 ||
          particle.x > width + 35 ||
          particle.y < -35 ||
          particle.y > height + 35;

        if (outside || particle.life <= 0) {
          resetParticle(particle, false);
        }
      }

      ctx.globalAlpha = 1;
      drawDarkCores(vortices);

      pointer.activity *= Math.pow(
        pointer.down ? 0.993 : 0.955,
        rawDelta * 60
      );

      animationFrame = requestAnimationFrame(render);
    }

    function updatePointer(event) {
      if (!interactive) return;

      const rect = root.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      const dx = x - pointer.x;
      const dy = y - pointer.y;

      pointer.previousX = pointer.x;
      pointer.previousY = pointer.y;
      pointer.x = x;
      pointer.y = y;

      if (Math.abs(dx) + Math.abs(dy) > 1.5) {
        const nextSpin = Math.sign(dx - dy * 0.72);
        if (nextSpin !== 0) pointer.spin = nextSpin;
      }

      pointer.activity = Math.min(
        1.15,
        pointer.activity + 0.24
      );
    }

    function handlePointerDown(event) {
      if (!interactive) return;

      updatePointer(event);
      pointer.down = true;
      pointer.activity = 1.2;
    }

    function handlePointerUp() {
      pointer.down = false;
      pointer.activity = Math.max(
        pointer.activity,
        0.8
      );
    }

    function handlePointerLeave() {
      pointer.down = false;
    }

    const observer = new ResizeObserver(resize);
    observer.observe(root);

    root.addEventListener("pointermove", updatePointer);
    root.addEventListener(
      "pointerdown",
      handlePointerDown
    );
    window.addEventListener("pointerup", handlePointerUp);
    root.addEventListener(
      "pointerleave",
      handlePointerLeave
    );

    resize();
    animationFrame = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrame);
      observer.disconnect();

      root.removeEventListener(
        "pointermove",
        updatePointer
      );
      root.removeEventListener(
        "pointerdown",
        handlePointerDown
      );
      window.removeEventListener(
        "pointerup",
        handlePointerUp
      );
      root.removeEventListener(
        "pointerleave",
        handlePointerLeave
      );
    };
  }, [
    particleCount,
    speed,
    intensity,
    interactive,
  ]);

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
        cursor: interactive ? "crosshair" : "default",
        touchAction: "pan-y",
        background: `
          radial-gradient(
            circle at 72% 18%,
            rgba(177, 190, 50, 0.16),
            transparent 37%
          ),
          radial-gradient(
            circle at 18% 82%,
            rgba(240, 127, 9, 0.15),
            transparent 38%
          ),
          radial-gradient(
            circle at 82% 72%,
            rgba(72, 95, 143, 0.21),
            transparent 46%
          ),
          linear-gradient(
            155deg,
            #11131f 0%,
            #1c2034 48%,
            #0b0d17 100%
          )
        `,
        boxShadow: `
          0 28px 70px rgba(6, 7, 13, 0.30),
          inset 0 0 0 1px rgba(229, 220, 183, 0.11),
          inset 0 0 80px rgba(0, 0, 0, 0.28)
        `,
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

      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background: `
            linear-gradient(
              180deg,
              rgba(8, 9, 16, 0.23) 0%,
              transparent 19%,
              transparent 76%,
              rgba(8, 9, 16, 0.42) 100%
            )
          `,
          boxShadow:
            "inset 0 0 0 1px rgba(235, 227, 196, 0.08)",
        }}
      />

      <div
        style={{
          position: "absolute",
          top: 17,
          left: 18,
          display: "flex",
          alignItems: "center",
          gap: 8,
          color: "rgba(231, 223, 196, 0.68)",
          fontFamily:
            "ui-monospace, SFMono-Regular, Menlo, Monaco, monospace",
          fontSize: 9,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          pointerEvents: "none",
        }}
      >
        <span
          style={{
            width: 5,
            height: 5,
            borderRadius: "50%",
            background: "#b8c43d",
            boxShadow:
              "0 0 12px rgba(184, 196, 61, 0.9)",
          }}
        />
        Fluid field / 03
      </div>

      <div
        style={{
          position: "absolute",
          right: 17,
          bottom: 16,
          color: "rgba(231, 223, 196, 0.45)",
          fontFamily:
            "ui-monospace, SFMono-Regular, Menlo, Monaco, monospace",
          fontSize: 8,
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          writingMode: "vertical-rl",
          transform: "rotate(180deg)",
          pointerEvents: "none",
        }}
      >
        Move · hold
      </div>

      <div
        style={{
          position: "absolute",
          left: 18,
          bottom: 18,
          width: 34,
          height: 1,
          background:
            "linear-gradient(90deg, #e9830b, rgba(233, 131, 11, 0))",
          pointerEvents: "none",
        }}
      />
    </div>
  );
}