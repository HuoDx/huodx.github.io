"use client";

import { useEffect, useRef } from "react";

const VERTEX_SHADER = `
  attribute vec2 a_position;
  varying vec2 v_uv;

  void main() {
    v_uv = a_position * 0.5 + 0.5;
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`;

const FRAGMENT_SHADER = `
  precision highp float;

  varying vec2 v_uv;

  uniform vec2 u_resolution;
  uniform float u_time;
  uniform vec2 u_mouse;
  uniform float u_mouseActivity;
  uniform float u_motion;
  uniform float u_intensity;

  float hash21(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  float noise2(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);

    f = f * f * (3.0 - 2.0 * f);

    float a = hash21(i);
    float b = hash21(i + vec2(1.0, 0.0));
    float c = hash21(i + vec2(0.0, 1.0));
    float d = hash21(i + vec2(1.0, 1.0));

    return mix(
      mix(a, b, f.x),
      mix(c, d, f.x),
      f.y
    );
  }

  float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.5;

    mat2 rotation = mat2(
       0.80,  0.60,
      -0.60,  0.80
    );

    for (int i = 0; i < 5; i++) {
      value += amplitude * noise2(p);
      p = rotation * p * 2.03 + 8.7;
      amplitude *= 0.50;
    }

    return value;
  }

  mat2 rotate2d(float angle) {
    float s = sin(angle);
    float c = cos(angle);

    return mat2(
      c, -s,
      s,  c
    );
  }

  vec3 saturateColor(vec3 color, float amount) {
    float luma = dot(
      color,
      vec3(0.299, 0.587, 0.114)
    );

    return mix(
      vec3(luma),
      color,
      1.0 + amount
    );
  }

  /*
   * A continuous, deliberately saturated pigment spectrum.
   *
   * No white and no near-white colors:
   * indigo -> ultramarine -> cobalt -> teal ->
   * green -> chartreuse -> yellow -> orange.
   */
  vec3 irisPalette(float t) {
    t = clamp(t, 0.0, 1.0);

    vec3 indigo =
      vec3(0.025, 0.035, 0.150);

    vec3 ultramarine =
      vec3(0.055, 0.135, 0.560);

    vec3 cobalt =
      vec3(0.140, 0.390, 0.850);

    vec3 cerulean =
      vec3(0.060, 0.570, 0.720);

    vec3 teal =
      vec3(0.025, 0.410, 0.330);

    vec3 sapGreen =
      vec3(0.170, 0.570, 0.105);

    vec3 chartreuse =
      vec3(0.680, 0.820, 0.045);

    vec3 cadmiumYellow =
      vec3(0.970, 0.720, 0.015);

    vec3 cadmiumOrange =
      vec3(0.950, 0.285, 0.018);

    if (t < 0.12) {
      return mix(
        indigo,
        ultramarine,
        smoothstep(0.0, 0.12, t)
      );
    }

    if (t < 0.25) {
      return mix(
        ultramarine,
        cobalt,
        smoothstep(0.12, 0.25, t)
      );
    }

    if (t < 0.38) {
      return mix(
        cobalt,
        cerulean,
        smoothstep(0.25, 0.38, t)
      );
    }

    if (t < 0.50) {
      return mix(
        cerulean,
        teal,
        smoothstep(0.38, 0.50, t)
      );
    }

    if (t < 0.63) {
      return mix(
        teal,
        sapGreen,
        smoothstep(0.50, 0.63, t)
      );
    }

    if (t < 0.75) {
      return mix(
        sapGreen,
        chartreuse,
        smoothstep(0.63, 0.75, t)
      );
    }

    if (t < 0.88) {
      return mix(
        chartreuse,
        cadmiumYellow,
        smoothstep(0.75, 0.88, t)
      );
    }

    return mix(
      cadmiumYellow,
      cadmiumOrange,
      smoothstep(0.88, 1.0, t)
    );
  }

  void main() {
    vec2 uv = v_uv;

    float aspect =
      u_resolution.x /
      max(u_resolution.y, 1.0);

    vec2 p = uv - 0.5;
    p.x *= aspect;

    float t = u_time * u_motion;

    /*
     * Slow breathing plus occasional broad surges.
     */
    float breath =
      0.5 +
      0.5 * sin(t * 0.21 - 0.6);

    float surgeA = pow(
      max(0.0, sin(t * 0.29 + 1.4)),
      8.0
    );

    float surgeB = pow(
      max(0.0, sin(t * 0.16 - 2.2)),
      12.0
    );

    float energy = clamp(
      0.18 +
      breath * 0.18 +
      surgeA * 0.62 +
      surgeB * 0.38,
      0.16,
      1.0
    );

    /*
     * Broad pointer deformation.
     */
    vec2 mouse = u_mouse - 0.5;
    mouse.x *= aspect;

    vec2 mouseDelta = p - mouse;
    float mouseDistance =
      length(mouseDelta);

    float mouseInfluence =
      exp(
        -mouseDistance *
        mouseDistance *
        4.2
      ) *
      u_mouseActivity;

    float mouseRotation =
      mouseInfluence *
      (0.16 + energy * 0.28) *
      u_intensity;

    p =
      mouse +
      rotate2d(mouseRotation) *
      (p - mouse);

    p +=
      normalize(mouseDelta + vec2(0.001)) *
      mouseInfluence *
      0.025;

    /*
     * Low-frequency domain warp.
     * Large-scale movement, not noisy little islands.
     */
    vec2 q;

    q.x = fbm(
      p * vec2(1.10, 0.84) +
      vec2(
        t * 0.020,
        -t * 0.014
      )
    );

    q.y = fbm(
      p * vec2(0.88, 1.18) +
      vec2(
        -t * 0.016,
        t * 0.012
      ) +
      6.3
    );

    vec2 warpedP =
      p +
      (q - 0.5) *
      (0.52 + energy * 0.30) *
      u_intensity;

    vec2 r;

    r.x = fbm(
      warpedP * 1.34 +
      q * 1.25 +
      vec2(
        t * 0.013,
        t * 0.008
      ) +
      11.0
    );

    r.y = fbm(
      warpedP * 1.22 -
      q * 1.10 +
      vec2(
        -t * 0.010,
        t * 0.014
      ) +
      18.0
    );

    warpedP +=
      (r - 0.5) *
      (0.18 + energy * 0.22) *
      u_intensity;

    /*
     * Broad directional shear during energetic moments.
     */
    float shear =
      sin(
        warpedP.y * 3.6 +
        r.x * 3.2 -
        t * 0.12
      );

    warpedP.x +=
      shear *
      energy *
      0.070 *
      u_intensity;

    /*
     * Three large flowing phases.
     * They span the entire palette instead of assigning
     * one pigment to one isolated region.
     */
    float phaseA =
      warpedP.x * 2.45 +
      warpedP.y * 0.92 +
      q.x * 2.10 -
      t * 0.050;

    float phaseB =
      -warpedP.x * 1.35 +
      warpedP.y * 2.65 +
      r.y * 2.25 +
      t * 0.041;

    float phaseC =
      warpedP.x * 1.85 -
      warpedP.y * 2.05 +
      q.y * 1.80 -
      t * 0.033;

    float paletteA =
      0.5 +
      0.5 *
      sin(
        phaseA +
        sin(phaseB) * 0.38
      );

    float paletteB =
      0.5 +
      0.5 *
      sin(
        phaseB +
        sin(phaseC) * 0.42 +
        1.15
      );

    float paletteC =
      0.5 +
      0.5 *
      sin(
        phaseC +
        sin(phaseA) * 0.34 +
        2.25
      );

    vec3 colorA =
      irisPalette(paletteA);

    vec3 colorB =
      irisPalette(paletteB);

    vec3 colorC =
      irisPalette(paletteC);

    /*
     * Broad, slowly varying blend fields.
     * No hard region borders.
     */
    float blendAB =
      smoothstep(
        0.22,
        0.78,
        fbm(
          warpedP * 1.18 +
          vec2(4.0, -7.0)
        )
      );

    float blendC =
      smoothstep(
        0.50,
        0.80,
        fbm(
          warpedP * 1.42 +
          vec2(-9.0, 5.0)
        )
      );

    vec3 color =
      mix(
        colorA,
        colorB,
        0.26 + blendAB * 0.42
      );

    color =
      mix(
        color,
        colorC,
        blendC * 0.30
      );

    /*
     * Three restrained accent families.
     * They are broad color pressure, not separate blobs.
     */
    float warmPressure =
      smoothstep(
        0.53,
        0.79,
        fbm(
          warpedP * 1.32 +
          vec2(14.0, -4.0)
        )
      );

    float greenPressure =
      smoothstep(
        0.50,
        0.80,
        fbm(
          warpedP * 1.27 +
          vec2(-5.0, 13.0)
        )
      );

    float bluePressure =
      smoothstep(
        0.49,
        0.81,
        fbm(
          warpedP * 1.24 +
          vec2(7.0, 16.0)
        )
      );

    vec3 cadmiumOrange =
      vec3(0.950, 0.285, 0.018);

    vec3 acidGreen =
      vec3(0.650, 0.820, 0.040);

    vec3 cobalt =
      vec3(0.100, 0.330, 0.820);

    color = mix(
      color,
      cadmiumOrange,
      warmPressure * 0.25
    );

    color = mix(
      color,
      acidGreen,
      greenPressure * 0.20
    );

    color = mix(
      color,
      cobalt,
      bluePressure * 0.19
    );

    /*
     * Broad depth modulation.
     * This replaces outlines and contour channels.
     */
    float depth =
      fbm(
        warpedP * 1.05 +
        q * 0.75 +
        vec2(
          -t * 0.008,
          t * 0.006
        )
      );

    color *=
      0.68 +
      depth * 0.48;

    /*
     * Subtle directional paint texture.
     * No glowing lines and no white ridges.
     */
    float textureNoise =
      fbm(
        warpedP * 6.2 +
        q * 2.4
      );

    float brushDirection =
      0.5 +
      0.5 *
      sin(
        warpedP.x * 11.0 +
        warpedP.y * 16.0 +
        textureNoise * 3.0
      );

    color *=
      0.88 +
      textureNoise * 0.14 +
      brushDirection * 0.055;

    /*
     * Strong pigment saturation without brightness blowout.
     */
    color =
      saturateColor(
        color,
        0.28
      );

    /*
     * Keep the lower range deep while preserving vivid pigment.
     * There is intentionally no Reinhard-style tone mapping here.
     */
    color =
      pow(
        clamp(color, 0.0, 1.0),
        vec3(0.92)
      );

    /*
     * Very mild edge depth only.
     */
    vec2 edgeUv =
      uv * (1.0 - uv);

    float edge =
      pow(
        edgeUv.x *
        edgeUv.y *
        16.0,
        0.10
      );

    color *=
      mix(
        0.88,
        1.02,
        edge
      );

    gl_FragColor =
      vec4(
        clamp(color, 0.0, 1.0),
        1.0
      );
  }
`;

function compileShader(gl, type, source) {
  const shader = gl.createShader(type);

  if (!shader) {
    throw new Error(
      "Unable to create WebGL shader."
    );
  }

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (
    !gl.getShaderParameter(
      shader,
      gl.COMPILE_STATUS
    )
  ) {
    const info =
      gl.getShaderInfoLog(shader);

    gl.deleteShader(shader);

    throw new Error(
      `Shader compilation failed: ${
        info || "Unknown error"
      }`
    );
  }

  return shader;
}

function createProgram(gl) {
  const vertexShader = compileShader(
    gl,
    gl.VERTEX_SHADER,
    VERTEX_SHADER
  );

  const fragmentShader = compileShader(
    gl,
    gl.FRAGMENT_SHADER,
    FRAGMENT_SHADER
  );

  const program =
    gl.createProgram();

  if (!program) {
    throw new Error(
      "Unable to create WebGL program."
    );
  }

  gl.attachShader(
    program,
    vertexShader
  );

  gl.attachShader(
    program,
    fragmentShader
  );

  gl.linkProgram(program);

  gl.deleteShader(vertexShader);
  gl.deleteShader(fragmentShader);

  if (
    !gl.getProgramParameter(
      program,
      gl.LINK_STATUS
    )
  ) {
    const info =
      gl.getProgramInfoLog(program);

    gl.deleteProgram(program);

    throw new Error(
      `WebGL program linking failed: ${
        info || "Unknown error"
      }`
    );
  }

  return program;
}

export default function IrisPigmentField({
  className = "",
  style = {},
  speed = 0.88,
  intensity = 1.28,
  interactive = true,
}) {
  const rootRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;

    if (!root || !canvas) {
      return undefined;
    }

    const gl = canvas.getContext(
      "webgl",
      {
        alpha: false,
        antialias: false,
        depth: false,
        stencil: false,
        preserveDrawingBuffer: false,
        powerPreference:
          "high-performance",
      }
    );

    if (!gl) {
      root.dataset.webglUnavailable =
        "true";

      return undefined;
    }

    let program;

    try {
      program = createProgram(gl);
    } catch (error) {
      console.error(error);

      root.dataset.webglUnavailable =
        "true";

      return undefined;
    }

    const positionLocation =
      gl.getAttribLocation(
        program,
        "a_position"
      );

    const resolutionLocation =
      gl.getUniformLocation(
        program,
        "u_resolution"
      );

    const timeLocation =
      gl.getUniformLocation(
        program,
        "u_time"
      );

    const mouseLocation =
      gl.getUniformLocation(
        program,
        "u_mouse"
      );

    const mouseActivityLocation =
      gl.getUniformLocation(
        program,
        "u_mouseActivity"
      );

    const motionLocation =
      gl.getUniformLocation(
        program,
        "u_motion"
      );

    const intensityLocation =
      gl.getUniformLocation(
        program,
        "u_intensity"
      );

    const buffer =
      gl.createBuffer();

    gl.bindBuffer(
      gl.ARRAY_BUFFER,
      buffer
    );

    /*
     * Full-screen triangle.
     */
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([
        -1, -1,
         3, -1,
        -1,  3,
      ]),
      gl.STATIC_DRAW
    );

    gl.useProgram(program);

    gl.enableVertexAttribArray(
      positionLocation
    );

    gl.vertexAttribPointer(
      positionLocation,
      2,
      gl.FLOAT,
      false,
      0,
      0
    );

    const reducedMotion =
      window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;

    const pointer = {
      x: 0.5,
      y: 0.5,
      targetX: 0.5,
      targetY: 0.5,
      activity: 0,
      targetActivity: 0,
      down: false,
    };

    let width = 1;
    let height = 1;
    let animationFrame = 0;

    const startTime =
      performance.now();

    function resize() {
      const rect =
        root.getBoundingClientRect();

      width = Math.max(
        2,
        rect.width
      );

      height = Math.max(
        2,
        rect.height
      );

      /*
       * Caps render resolution to keep the hero lightweight.
       */
      const dpr = Math.min(
        window.devicePixelRatio || 1,
        1.75
      );

      const renderWidth =
        Math.round(width * dpr);

      const renderHeight =
        Math.round(height * dpr);

      if (
        canvas.width !== renderWidth ||
        canvas.height !== renderHeight
      ) {
        canvas.width = renderWidth;
        canvas.height = renderHeight;
      }

      canvas.style.width =
        `${width}px`;

      canvas.style.height =
        `${height}px`;

      gl.viewport(
        0,
        0,
        renderWidth,
        renderHeight
      );
    }

    function render(now) {
      pointer.x +=
        (
          pointer.targetX -
          pointer.x
        ) * 0.075;

      pointer.y +=
        (
          pointer.targetY -
          pointer.y
        ) * 0.075;

      pointer.activity +=
        (
          pointer.targetActivity -
          pointer.activity
        ) * 0.06;

      pointer.targetActivity *=
        pointer.down
          ? 0.997
          : 0.965;

      const elapsed =
        (now - startTime) / 1000;

      gl.useProgram(program);

      gl.uniform2f(
        resolutionLocation,
        canvas.width,
        canvas.height
      );

      gl.uniform1f(
        timeLocation,
        elapsed
      );

      gl.uniform2f(
        mouseLocation,
        pointer.x,
        1 - pointer.y
      );

      gl.uniform1f(
        mouseActivityLocation,
        pointer.activity
      );

      gl.uniform1f(
        motionLocation,
        speed *
          (
            reducedMotion
              ? 0.25
              : 1
          )
      );

      gl.uniform1f(
        intensityLocation,
        intensity
      );

      gl.drawArrays(
        gl.TRIANGLES,
        0,
        3
      );

      animationFrame =
        requestAnimationFrame(render);
    }

    function updatePointer(event) {
      if (!interactive) return;

      const rect =
        root.getBoundingClientRect();

      pointer.targetX = Math.max(
        0,
        Math.min(
          1,
          (
            event.clientX -
            rect.left
          ) / rect.width
        )
      );

      pointer.targetY = Math.max(
        0,
        Math.min(
          1,
          (
            event.clientY -
            rect.top
          ) / rect.height
        )
      );

      pointer.targetActivity =
        Math.min(
          1,
          pointer.targetActivity +
            0.22
        );
    }

    function handlePointerDown(event) {
      if (!interactive) return;

      updatePointer(event);

      pointer.down = true;
      pointer.targetActivity = 1;
    }

    function handlePointerUp() {
      pointer.down = false;
    }

    function handlePointerLeave() {
      pointer.down = false;

      pointer.targetActivity *=
        0.72;
    }

    const observer =
      new ResizeObserver(resize);

    observer.observe(root);

    root.addEventListener(
      "pointermove",
      updatePointer
    );

    root.addEventListener(
      "pointerdown",
      handlePointerDown
    );

    root.addEventListener(
      "pointerleave",
      handlePointerLeave
    );

    window.addEventListener(
      "pointerup",
      handlePointerUp
    );

    resize();

    animationFrame =
      requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(
        animationFrame
      );

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
        handlePointerLeave
      );

      window.removeEventListener(
        "pointerup",
        handlePointerUp
      );

      if (buffer) {
        gl.deleteBuffer(buffer);
      }

      gl.deleteProgram(program);
    };
  }, [
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
        aspectRatio: "1 / 1",
        overflow: "hidden",
        isolation: "isolate",
        borderRadius: "20px",
        background:
          "linear-gradient(145deg, #101538, #080d24)",
        ...style,
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          inset: 0,
          display: "block",
          width: "100%",
          height: "100%",
        }}
      />

      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          boxShadow: `
            inset 0 0 0 1px rgba(255, 255, 255, 0.025),
            inset 0 0 44px rgba(3, 5, 18, 0.08)
          `,
        }}
      />
    </div>
  );
}