"use client";

import { useEffect, useRef } from "react";

const PALETTE = {
  indigo: [20, 24, 58],
  ultramarine: [44, 62, 132],
  cobalt: [76, 113, 184],
  sky: [150, 184, 222],
  acid: [187, 211, 48],
  leaf: [91, 145, 52],
  yellow: [239, 185, 22],
  orange: [228, 104, 18],
  bone: [224, 213, 169],
};

const FILAMENT_COLORS = [
  PALETTE.ultramarine,
  PALETTE.ultramarine,
  PALETTE.cobalt,
  PALETTE.cobalt,
  PALETTE.sky,
  PALETTE.acid,
  PALETTE.acid,
  PALETTE.leaf,
  PALETTE.yellow,
  PALETTE.yellow,
  PALETTE.orange,
  PALETTE.bone,
];

const WASH_COLORS = [
  PALETTE.ultramarine,
  PALETTE.cobalt,
  PALETTE.leaf,
  PALETTE.acid,
  PALETTE.yellow,
  PALETTE.orange,
];

const clamp = (value, min, max) =>
  Math.max(min, Math.min(max, value));

const randomFrom = (array) =>
  array[Math.floor(Math.random() * array.length)];

function createParticle(kind) {
  return {
    kind,
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    age: 0,
    life: 0,
    seed: Math.random() * Math.PI * 2,
    color:
      kind === "wash"
        ? randomFrom(WASH_COLORS)
        : randomFrom(FILAMENT_COLORS),
    width: 1,
    alpha: 1,
    accent: Math.random() > 0.76,
  };
}

export default function IrisTorrent({
  className = "",
  style = {},
  filamentCount = 950,
  washCount = 105,
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
      alpha: false,
      desynchronized: true,
    });

    if (!ctx) return undefined;

    let width = 1;
    let height = 1;
    let dpr = 1;
    let frame = 0;
    let previousTime = performance.now();

    let filaments = [];
    let washes = [];

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const pointer = {
      x: 0,
      y: 0,
      previousX: 0,
      previousY: 0,
      vx: 0,
      vy: 0,
      activity: 0,
      down: false,
    };

    function resetParticle(particle, anywhere = false, time = 0) {
      if (anywhere) {
        particle.x = Math.random() * width;
        particle.y = Math.random() * height;
      } else {
        /*
         * Most particles enter through broad moving source bands,
         * creating dense rivers instead of evenly scattered dust.
         */
        const source = Math.floor(Math.random() * 8);
        const broadJitter =
          particle.kind === "wash" ? 90 : 48;

        const sourceWaveA = Math.sin(
          time * 0.17 + source * 1.73
        );
        const sourceWaveB = Math.cos(
          time * 0.11 + source * 2.21
        );

        if (source === 0 || source === 1) {
          particle.x =
            width *
              (0.14 +
                source * 0.48 +
                sourceWaveA * 0.09) +
            (Math.random() - 0.5) * broadJitter;

          particle.y = -30;
        } else if (source === 2 || source === 3) {
          particle.x = -30;

          particle.y =
            height *
              (0.2 +
                (source - 2) * 0.48 +
                sourceWaveB * 0.08) +
            (Math.random() - 0.5) * broadJitter;
        } else if (source === 4 || source === 5) {
          particle.x = width + 30;

          particle.y =
            height *
              (0.18 +
                (source - 4) * 0.52 +
                sourceWaveA * 0.08) +
            (Math.random() - 0.5) * broadJitter;
        } else {
          particle.x =
            width *
              (0.25 +
                (source - 6) * 0.48 +
                sourceWaveB * 0.08) +
            (Math.random() - 0.5) * broadJitter;

          particle.y = height + 30;
        }
      }

      particle.vx = (Math.random() - 0.5) * 16;
      particle.vy = (Math.random() - 0.5) * 16;
      particle.age = 0;

      if (particle.kind === "wash") {
        particle.life = 7 + Math.random() * 9;
        particle.width = 9 + Math.random() * 20;
        particle.alpha = 0.014 + Math.random() * 0.026;
      } else {
        particle.life = 4.5 + Math.random() * 8;
        particle.width = 1.25 + Math.random() * 3.7;
        particle.alpha = 0.1 + Math.random() * 0.26;
      }

      particle.color =
        particle.kind === "wash"
          ? randomFrom(WASH_COLORS)
          : randomFrom(FILAMENT_COLORS);

      particle.accent = Math.random() > 0.76;
    }

    function fillBackground() {
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = 1;
      ctx.fillStyle = "#101631";
      ctx.fillRect(0, 0, width, height);
    }

    function resize() {
      const rect = root.getBoundingClientRect();

      width = Math.max(2, rect.width);
      height = Math.max(2, rect.height);
      dpr = Math.min(window.devicePixelRatio || 1, 1.6);

      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      const areaScale = clamp(
        Math.sqrt((width * height) / (300 * 400)),
        0.72,
        1.45
      );

      const motionDensity = reducedMotion ? 0.46 : 1;

      filaments = Array.from(
        {
          length: Math.round(
            filamentCount * areaScale * motionDensity
          ),
        },
        () => {
          const particle = createParticle("filament");
          resetParticle(particle, true);
          return particle;
        }
      );

      washes = Array.from(
        {
          length: Math.round(
            washCount * areaScale * motionDensity
          ),
        },
        () => {
          const particle = createParticle("wash");
          resetParticle(particle, true);
          return particle;
        }
      );

      fillBackground();
    }

    function turbulenceEnergy(time) {
      /*
       * Long calm intervals with shorter, irregular surges.
       * The two sharp pulses do not peak at the same cadence.
       */
      const breathing =
        0.5 + 0.5 * Math.sin(time * 0.23 - 0.8);

      const burstA = Math.pow(
        Math.max(0, Math.sin(time * 0.31 + 1.4)),
        7
      );

      const burstB = Math.pow(
        Math.max(0, Math.sin(time * 0.17 - 2.1)),
        11
      );

      return clamp(
        0.22 +
          breathing * 0.22 +
          burstA * 0.76 +
          burstB * 0.52,
        0.18,
        1.25
      );
    }

    function getLargeVortices(time) {
      const unit = Math.min(width, height);

      /*
       * Large and partly off-canvas.
       * They bend rivers instead of producing visible circular cells.
       */
      return [
        {
          x:
            width *
            (-0.08 + Math.sin(time * 0.09) * 0.16),
          y:
            height *
            (0.28 + Math.cos(time * 0.12) * 0.1),
          radius: unit * 0.92,
          spin: 0.74,
        },
        {
          x:
            width *
            (1.08 + Math.cos(time * 0.08 + 1.9) * 0.14),
          y:
            height *
            (0.48 + Math.sin(time * 0.11) * 0.13),
          radius: unit * 0.88,
          spin: -0.82,
        },
        {
          x:
            width *
            (0.45 + Math.sin(time * 0.07 + 3.2) * 0.2),
          y:
            height *
            (1.12 + Math.cos(time * 0.1) * 0.1),
          radius: unit * 0.82,
          spin: 0.65,
        },
      ];
    }

    function sampleFlow(x, y, time, seed, energy, vortices) {
      const nx = x / width;
      const ny = y / height;

      /*
       * Domain-warped, multi-scale flow.
       * Large waves create broad streams;
       * smaller waves fray their edges.
       */
      const warpX =
        Math.sin(ny * 7.2 + time * 0.19) +
        Math.sin((nx + ny) * 4.4 - time * 0.13) * 0.7;

      const warpY =
        Math.cos(nx * 6.4 - time * 0.17) +
        Math.sin((nx - ny) * 5.1 + time * 0.11) * 0.72;

      const largeAngle =
        Math.sin(
          (nx * 2.1 + warpY * 0.12) * Math.PI * 2 +
            time * 0.12
        ) *
          1.22 +
        Math.cos(
          (ny * 2.55 + warpX * 0.11) * Math.PI * 2 -
            time * 0.1
        ) *
          1.06;

      const middleAngle =
        Math.sin(
          (nx + ny) * Math.PI * 5.1 +
            time * 0.31 +
            seed
        ) * 0.58;

      const fineAngle =
        Math.cos(
          (nx * 1.8 - ny * 2.3) * Math.PI * 6.5 -
            time * 0.46 +
            seed * 1.7
        ) *
        0.2 *
        energy;

      const angle =
        largeAngle + middleAngle + fineAngle;

      const broadSpeed =
        34 +
        energy * 72 +
        Math.sin(
          nx * 8.2 -
            ny * 5.7 +
            time * 0.43 +
            seed
        ) *
          12;

      let fx = Math.cos(angle) * broadSpeed;
      let fy = Math.sin(angle) * broadSpeed;

      /*
       * Open prevailing currents prevent closed loops.
       */
      fx +=
        13 +
        Math.sin(ny * Math.PI * 3.2 + time * 0.16) *
          (12 + energy * 11);

      fy +=
        9 +
        Math.cos(nx * Math.PI * 2.7 - time * 0.14) *
          (10 + energy * 9);

      for (const vortex of vortices) {
        const dx = x - vortex.x;
        const dy = y - vortex.y;
        const distanceSquared = dx * dx + dy * dy;
        const distance = Math.sqrt(distanceSquared) + 0.001;

        const falloff = Math.exp(
          -distanceSquared /
            (2 * vortex.radius * vortex.radius)
        );

        const tangential =
          vortex.spin *
          falloff *
          (44 + energy * 45) *
          intensity;

        fx += (-dy / distance) * tangential;
        fy += (dx / distance) * tangential;
      }

      /*
       * Local instability during energetic phases.
       */
      fx +=
        Math.sin(y * 0.026 + time * 1.1 + seed) *
        energy *
        15;

      fy +=
        Math.cos(x * 0.023 - time * 0.93 - seed) *
        energy *
        15;

      if (interactive && pointer.activity > 0.002) {
        const dx = x - pointer.x;
        const dy = y - pointer.y;
        const distanceSquared = dx * dx + dy * dy;
        const distance = Math.sqrt(distanceSquared) + 0.001;
        const radius = Math.min(width, height) * 0.34;

        const falloff =
          Math.exp(
            -distanceSquared / (2 * radius * radius)
          ) * pointer.activity;

        /*
         * Pointer movement pushes and folds the flow;
         * holding introduces stronger local rotation.
         */
        fx += pointer.vx * 4.5 * falloff;
        fy += pointer.vy * 4.5 * falloff;

        const swirl =
          (pointer.down ? 110 : 45) *
          falloff *
          intensity;

        fx += (-dy / distance) * swirl;
        fy += (dx / distance) * swirl;
      }

      return { fx, fy };
    }

    function drawWashSegment(particle, x1, y1, x2, y2, alpha) {
      const [r, g, b] = particle.color;

      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = `rgb(${r}, ${g}, ${b})`;
      ctx.lineWidth = particle.width;

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }

    function drawFilamentSegment(
      particle,
      x1,
      y1,
      x2,
      y2,
      alpha,
      energy
    ) {
      const [r, g, b] = particle.color;

      /*
       * Wide translucent body gives the filament pigment mass.
       */
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = alpha * 0.22;
      ctx.strokeStyle = `rgb(${r}, ${g}, ${b})`;
      ctx.lineWidth =
        particle.width * (1.8 + energy * 0.28);

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();

      /*
       * Saturated central stroke.
       */
      ctx.globalCompositeOperation = "screen";
      ctx.globalAlpha = alpha;
      ctx.lineWidth = particle.width;
      ctx.strokeStyle = `rgb(${r}, ${g}, ${b})`;

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();

      /*
       * Thin highlight only on selected strands.
       */
      if (particle.accent && energy > 0.34) {
        const hr = clamp(r + 28, 0, 255);
        const hg = clamp(g + 25, 0, 255);
        const hb = clamp(b + 20, 0, 255);

        ctx.globalAlpha = alpha * 0.38;
        ctx.lineWidth = Math.max(0.45, particle.width * 0.28);
        ctx.strokeStyle = `rgb(${hr}, ${hg}, ${hb})`;

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }
    }

    function updateParticle(
      particle,
      delta,
      time,
      energy,
      vortices
    ) {
      const previousX = particle.x;
      const previousY = particle.y;

      const field = sampleFlow(
        particle.x,
        particle.y,
        time,
        particle.seed,
        energy,
        vortices
      );

      const responsiveness =
        particle.kind === "wash"
          ? 1.15 + energy * 0.55
          : 2.1 + energy * 1.7;

      const response =
        1 - Math.exp(-delta * responsiveness);

      particle.vx += (field.fx - particle.vx) * response;
      particle.vy += (field.fy - particle.vy) * response;

      const maximumVelocity =
        particle.kind === "wash"
          ? 105 + energy * 65
          : 145 + energy * 105;

      const velocity = Math.hypot(
        particle.vx,
        particle.vy
      );

      if (velocity > maximumVelocity) {
        const scale = maximumVelocity / velocity;
        particle.vx *= scale;
        particle.vy *= scale;
      }

      particle.x += particle.vx * delta;
      particle.y += particle.vy * delta;
      particle.age += delta;
      particle.life -= delta;

      const fadeIn = clamp(particle.age / 1.05, 0, 1);
      const fadeOut = clamp(particle.life / 1.5, 0, 1);
      const lifeAlpha = fadeIn * fadeOut;

      const speedAlpha = clamp(
        Math.hypot(particle.vx, particle.vy) / 95,
        0.34,
        1
      );

      const alpha =
        particle.alpha * lifeAlpha * speedAlpha;

      if (particle.kind === "wash") {
        drawWashSegment(
          particle,
          previousX,
          previousY,
          particle.x,
          particle.y,
          alpha
        );
      } else {
        drawFilamentSegment(
          particle,
          previousX,
          previousY,
          particle.x,
          particle.y,
          alpha,
          energy
        );
      }

      const outside =
        particle.x < -70 ||
        particle.x > width + 70 ||
        particle.y < -70 ||
        particle.y > height + 70;

      if (outside || particle.life <= 0) {
        resetParticle(particle, false, time);
      }
    }

    function render(now) {
      const rawDelta = clamp(
        (now - previousTime) / 1000,
        0.001,
        0.035
      );

      previousTime = now;

      const motionScale =
        speed * (reducedMotion ? 0.38 : 1);

      const delta = rawDelta * motionScale;
      const time = now * 0.001 * motionScale;
      const energy = reducedMotion
        ? 0.28
        : turbulenceEnergy(time);

      const vortices = getLargeVortices(time);

      /*
       * Slow fading preserves broad masses and flowing history.
       * It is a plain indigo repaint—not a geometric gradient.
       */
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = 1;
      ctx.fillStyle = `rgba(
        13,
        18,
        43,
        ${0.034 + energy * 0.025}
      )`;
      ctx.fillRect(0, 0, width, height);

      /*
       * Broad pigment masses first.
       */
      for (const particle of washes) {
        updateParticle(
          particle,
          delta,
          time,
          energy,
          vortices
        );
      }

      /*
       * Dense colored fibres over the wash.
       */
      for (const particle of filaments) {
        updateParticle(
          particle,
          delta,
          time,
          energy,
          vortices
        );
      }

      pointer.activity *= Math.pow(
        pointer.down ? 0.99 : 0.945,
        rawDelta * 60
      );

      pointer.vx *= 0.86;
      pointer.vy *= 0.86;

      frame = requestAnimationFrame(render);
    }

    function updatePointer(event) {
      if (!interactive) return;

      const rect = root.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      pointer.previousX = pointer.x;
      pointer.previousY = pointer.y;

      pointer.x = x;
      pointer.y = y;

      pointer.vx = clamp(
        x - pointer.previousX,
        -30,
        30
      );

      pointer.vy = clamp(
        y - pointer.previousY,
        -30,
        30
      );

      pointer.activity = clamp(
        pointer.activity + 0.2,
        0,
        1.15
      );
    }

    function handlePointerDown(event) {
      updatePointer(event);
      pointer.down = true;
      pointer.activity = 1.15;
    }

    function handlePointerUp() {
      pointer.down = false;
    }

    const observer = new ResizeObserver(resize);
    observer.observe(root);

    root.addEventListener("pointermove", updatePointer);
    root.addEventListener(
      "pointerdown",
      handlePointerDown
    );
    root.addEventListener(
      "pointerleave",
      handlePointerUp
    );
    window.addEventListener(
      "pointerup",
      handlePointerUp
    );

    resize();
    frame = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();

      root.removeEventListener(
        "pointermove",
        updatePointer
      );
      root.removeEventListener(
        "pointerdown",
        handlePointerDown
      );
      root.removeEventListener(
        "pointerleave",
        handlePointerUp
      );
      window.removeEventListener(
        "pointerup",
        handlePointerUp
      );
    };
  }, [
    filamentCount,
    washCount,
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
        background: "#101631",
        boxShadow: `
          0 22px 54px rgba(7, 9, 24, 0.24),
          inset 0 0 0 1px rgba(232, 224, 193, 0.07)
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
          boxShadow: `
            inset 0 0 70px rgba(4, 7, 25, 0.22),
            inset 0 0 0 1px rgba(255,255,255,0.025)
          `,
        }}
      />
    </div>
  );
}