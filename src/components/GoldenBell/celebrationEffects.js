import applauseUrl from "../../assets/tieng_vo_tay.mp3";

const applauseBuffers = new WeakMap();
let applauseData;

const loadApplause = () => {
  if (!applauseData) {
    applauseData = fetch(applauseUrl)
      .then((response) => {
        if (!response.ok) throw new Error("Không tải được tiếng vỗ tay");
        return response.arrayBuffer();
      })
      .catch((error) => {
        applauseData = undefined;
        throw error;
      });
  }
  return applauseData;
};

export const prepareApplause = (context) => {
  if (!applauseBuffers.has(context)) {
    const buffer = loadApplause()
      // Decoding can detach the buffer; keep the shared download intact.
      .then((data) => context.decodeAudioData(data.slice(0)))
      .catch((error) => {
        applauseBuffers.delete(context);
        throw error;
      });
    applauseBuffers.set(context, buffer);
  }
  return applauseBuffers.get(context);
};

export const playApplause = (context) => {
  if (!context || context.state !== "running") return () => {};
  let cancelled = false;
  let source;
  void prepareApplause(context).then((buffer) => {
    if (cancelled || context.state !== "running") return;
    source = context.createBufferSource();
    source.buffer = buffer;
    source.connect(context.destination);
    source.onended = () => source.disconnect();
    source.start();
  }).catch(() => {});

  return () => {
    cancelled = true;
    if (source) {
      source.stop();
      source.disconnect();
    }
  };
};

export const launchFireworks = (canvas, duration = 7500) => {
  const context = canvas.getContext("2d");
  if (!context) return () => {};
  const colors = ["#facc15", "#fb7185", "#38bdf8", "#a78bfa", "#4ade80", "#ffffff"];
  const particles = [];
  let frame;
  let lastBurst = -500;
  let previousTime;
  const startedAt = performance.now();
  const resize = () => {
    const scale = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = window.innerWidth * scale;
    canvas.height = window.innerHeight * scale;
    context.setTransform(scale, 0, 0, scale, 0, 0);
  };
  resize();
  window.addEventListener("resize", resize);

  const draw = (now) => {
    const elapsed = now - startedAt;
    const step = Math.min((now - (previousTime || now)) / 16.67, 2);
    previousTime = now;
    context.clearRect(0, 0, window.innerWidth, window.innerHeight);

    if (elapsed < duration - 1800 && elapsed - lastBurst > 420) {
      lastBurst = elapsed;
      const x = window.innerWidth * (0.1 + Math.random() * 0.8);
      const y = window.innerHeight * (0.08 + Math.random() * 0.45);
      const color = colors[Math.floor(Math.random() * colors.length)];
      for (let i = 0; i < 75; i += 1) {
        const angle = (Math.PI * 2 * i) / 75;
        const speed = 1.5 + Math.random() * 5;
        particles.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
          life: 1, color, radius: 1 + Math.random() * 2 });
      }
    }

    for (let i = particles.length - 1; i >= 0; i -= 1) {
      const particle = particles[i];
      particle.x += particle.vx * step;
      particle.y += particle.vy * step;
      particle.vy += 0.035 * step;
      particle.life -= 0.012 * step;
      if (particle.life <= 0) {
        particles.splice(i, 1);
        continue;
      }
      context.globalAlpha = particle.life;
      context.fillStyle = particle.color;
      context.beginPath();
      context.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
      context.fill();
    }
    context.globalAlpha = 1;
    if (elapsed < duration) frame = requestAnimationFrame(draw);
  };
  frame = requestAnimationFrame(draw);

  return () => {
    cancelAnimationFrame(frame);
    window.removeEventListener("resize", resize);
    context.clearRect(0, 0, window.innerWidth, window.innerHeight);
  };
};
