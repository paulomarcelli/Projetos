// Tinta em WebGL, em dois passes:
// 1) simulação em meia resolução (ping-pong): o campo de tinta escorre num fluxo de ruído "curl",
//    espalha um pouco, evapora, e recebe os traços do cursor (cápsulas finas e respingos);
// 2) tela: o campo vira tinta de borda nítida; fora dela o canvas é transparente (aparece o nome chapado),
//    dentro, fundo preto e as letras infladas (uma imagem do Blender) tingidas de vermelho.

const MAX = 64;

const VERT = `#version 300 es
in vec2 p;
void main() { gl_Position = vec4(p, 0.0, 1.0); }`;

const COMMON = `
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
}`;

const SIM = `#version 300 es
precision highp float;
out vec4 outColor;
uniform sampler2D uPrev;
uniform vec2 uSim;      // px da simulação
uniform vec2 uCss;      // px CSS do canvas
uniform float uTime, uDt;
uniform vec4 uA[${MAX}];
uniform vec2 uR[${MAX}]; // raio (px CSS), força
uniform int uN;
${COMMON}
vec2 curl(vec2 p) {
  float e = 0.02;
  float n1 = noise(p + vec2(0, e)), n2 = noise(p - vec2(0, e));
  float n3 = noise(p + vec2(e, 0)), n4 = noise(p - vec2(e, 0));
  return vec2(n1 - n2, n4 - n3) / (2.0 * e);
}
float segDist(vec2 p, vec2 a, vec2 b) {
  vec2 pa = p - a, ba = b - a;
  float h = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-4), 0.0, 1.0);
  return length(pa - ba * h);
}
void main() {
  vec2 uv = gl_FragCoord.xy / uSim;
  vec2 p = vec2(uv.x, 1.0 - uv.y) * uCss;
  // escorre: fluxo curl lento (px CSS por segundo), em uv com y invertido
  vec2 f = curl(p * 0.006 + vec2(uTime * 0.05, -uTime * 0.04)) * 22.0;
  vec2 back = uv - vec2(f.x, -f.y) * uDt / uCss;
  vec2 px = 1.0 / uSim;
  float c = texture(uPrev, back).r;
  float n = (texture(uPrev, back + vec2(px.x, 0)).r + texture(uPrev, back - vec2(px.x, 0)).r
           + texture(uPrev, back + vec2(0, px.y)).r + texture(uPrev, back - vec2(0, px.y)).r) * 0.25;
  float v = mix(c, n, 0.18);
  // evapora: uma mancha leva ~0,9 s para recolher
  v *= exp(-uDt * 0.85);
  v = max(v - uDt * 0.08, 0.0);
  for (int i = 0; i < ${MAX}; i++) {
    if (i >= uN) break;
    float d = segDist(p, uA[i].xy, uA[i].zw);
    float r = uR[i].x;
    v = max(v, smoothstep(r, r * 0.35, d) * uR[i].y);
  }
  outColor = vec4(v, 0.0, 0.0, 1.0);
}`;

const SHOW = `#version 300 es
precision highp float;
out vec4 outColor;
uniform sampler2D uField;
uniform sampler2D uTex;
uniform vec2 uRes;
uniform float uDpr;
uniform vec4 uRect;
uniform float uHas;
${COMMON}
void main() {
  vec2 uvs = gl_FragCoord.xy / (uRes * uDpr);
  vec2 p = vec2(uvs.x, 1.0 - uvs.y) * uRes;
  float v = texture(uField, uvs).r;
  // borda de tinta: limiar com um pouco de ruído largo, sem granulado
  float th = 0.5 + (noise(p * 0.06) - 0.5) * 0.14;
  float aa = fwidth(v) * 0.9 + 1e-3;
  float ink = smoothstep(th - aa, th + aa, v);
  if (ink <= 0.0) { outColor = vec4(0.0); return; }
  vec3 col = vec3(0.055, 0.165, 0.278); // corpo da tinta: azul-marinho
  if (uHas > 0.5) {
    vec2 uv = (p - uRect.xy) / uRect.zw;
    if (uv.x >= 0.0 && uv.x <= 1.0 && uv.y >= 0.0 && uv.y <= 1.0) {
      vec4 t = texture(uTex, uv);
      vec3 c = t.a > 0.0 ? t.rgb / t.a : vec3(0.0);
      float L = dot(c, vec3(0.299, 0.587, 0.114));
      // rampa azul-bebê: sombra marinho, meio #A9D6F5, brilho branco
      vec3 ar = L < 0.5
        ? mix(vec3(0.03, 0.10, 0.20), vec3(0.663, 0.839, 0.961), smoothstep(0.0, 0.5, L))
        : mix(vec3(0.663, 0.839, 0.961), vec3(1.0, 1.0, 1.0), smoothstep(0.5, 1.0, L));
      col = mix(col, ar, t.a);
    }
  }
  outColor = vec4(col * ink, ink);
}`;

export function createInk(canvas) {
  const gl = canvas.getContext('webgl2', { premultipliedAlpha: true, antialias: false, alpha: true });
  if (!gl) return null;
  const float = !!gl.getExtension('EXT_color_buffer_float');

  const program = (frag) => {
    const sh = (type, src) => {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
      return s;
    };
    const p = gl.createProgram();
    gl.attachShader(p, sh(gl.VERTEX_SHADER, VERT));
    gl.attachShader(p, sh(gl.FRAGMENT_SHADER, frag));
    gl.bindAttribLocation(p, 0, 'p');
    gl.linkProgram(p);
    const u = new Proxy({}, { get: (c, k) => (c[k] ??= gl.getUniformLocation(p, k)) });
    return { p, u };
  };
  const sim = program(SIM);
  const show = program(SHOW);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

  const texture = () => {
    const t = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return t;
  };

  // campo da tinta (ping-pong)
  let fields = [], sw = 0, sh = 0;
  function makeFields() {
    for (const f of fields) { gl.deleteTexture(f.t); gl.deleteFramebuffer(f.fb); }
    fields = [0, 1].map(() => {
      const t = texture();
      if (float) gl.texImage2D(gl.TEXTURE_2D, 0, gl.R16F, sw, sh, 0, gl.RED, gl.HALF_FLOAT, null);
      else gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, sw, sh, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      const fb = gl.createFramebuffer();
      gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      return { t, fb };
    });
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }

  const img = texture();
  let has = 0;

  const A = new Float32Array(MAX * 4);
  const R = new Float32Array(MAX * 2);
  let w = 0, h = 0, dpr = 1;

  function resize() {
    dpr = Math.min(devicePixelRatio || 1, 2);
    w = canvas.clientWidth;
    h = canvas.clientHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    const k = Math.min(1, 900 / Math.max(w, h)); // a simulação não passa de ~900 px no lado maior
    sw = Math.max(2, Math.round(w * k));
    sh = Math.max(2, Math.round(h * k));
    makeFields();
  }
  resize();

  return {
    resize,
    setImage(image) {
      gl.bindTexture(gl.TEXTURE_2D, img);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
      has = 1;
    },
    // stamps: [{ax, ay, bx, by, r, s}] em px CSS
    step({ stamps, time, dt, rect }) {
      const n = Math.min(stamps.length, MAX);
      for (let i = 0; i < n; i++) {
        const s = stamps[i];
        A[i * 4] = s.ax; A[i * 4 + 1] = s.ay; A[i * 4 + 2] = s.bx ?? s.ax; A[i * 4 + 3] = s.by ?? s.ay;
        R[i * 2] = s.r; R[i * 2 + 1] = s.s ?? 1;
      }
      // 1) simulação
      gl.useProgram(sim.p);
      gl.bindFramebuffer(gl.FRAMEBUFFER, fields[1].fb);
      gl.viewport(0, 0, sw, sh);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, fields[0].t);
      gl.uniform1i(sim.u.uPrev, 0);
      gl.uniform2f(sim.u.uSim, sw, sh);
      gl.uniform2f(sim.u.uCss, w, h);
      gl.uniform1f(sim.u.uTime, time);
      gl.uniform1f(sim.u.uDt, dt);
      gl.uniform4fv(sim.u.uA, A);
      gl.uniform2fv(sim.u.uR, R);
      gl.uniform1i(sim.u.uN, n);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      fields.reverse();

      // 2) tela
      gl.useProgram(show.p);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, fields[0].t);
      gl.uniform1i(show.u.uField, 0);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, img);
      gl.uniform1i(show.u.uTex, 1);
      gl.uniform2f(show.u.uRes, w, h);
      gl.uniform1f(show.u.uDpr, dpr);
      gl.uniform4f(show.u.uRect, rect.x, rect.y, rect.w, rect.h);
      gl.uniform1f(show.u.uHas, has);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    },
  };
}
