import { useState, useEffect, useRef, useCallback } from "react";

const COVER_SIZE_MIN = 140;
const COVER_SIZE_MAX = 190;
const SPEED_MIN = 18;
const SPEED_MAX = 42;
const MARGIN = 100;
const MIN_DISTANCE = 180;
const OPACITY_MIN = 0.38;
const OPACITY_MAX = 0.5;
const COVER_COUNT_DESKTOP = 18;
const COVER_COUNT_MOBILE = 10;

function randomIn(a, b) {
  return a + Math.random() * (b - a);
}

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** Generate initial positions spread across viewport with minimal overlap. */
function generateInitialCovers(imageList, width, height) {
  const covers = [];
  const count = width < 768 ? COVER_COUNT_MOBILE : COVER_COUNT_DESKTOP;
  const cols = width < 768 ? 3 : 5;
  const rows = Math.ceil(count / cols);
  const cellW = width / cols;
  const cellH = height / rows;
  const jitter = 0.35;

  for (let i = 0; i < count; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols) % rows;
    const size = Math.round(randomIn(COVER_SIZE_MIN, COVER_SIZE_MAX));
    const baseX = (col + 0.5) * cellW - size / 2;
    const baseY = (row + 0.5) * cellH - size / 2;
    const x = baseX + randomIn(-cellW * jitter, cellW * jitter);
    const y = baseY + randomIn(-cellH * jitter, cellH * jitter);
    const angle = randomIn(0, Math.PI * 2);
    const speed = randomIn(SPEED_MIN, SPEED_MAX);
    covers.push({
      id: `cover-${i}-${Date.now()}`,
      src: imageList[i % imageList.length],
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size,
      opacity: randomIn(OPACITY_MIN, OPACITY_MAX),
    });
  }
  return covers;
}

/** Respawn a cover at an edge; velocity points inward. Avoid spawning on top of others. */
function respawnAtEdge(cover, imageList, width, height, otherPositions) {
  const size = cover.size;
  const edge = Math.floor(Math.random() * 4);
  let x, y, vx, vy;
  const speed = randomIn(SPEED_MIN, SPEED_MAX);

  for (let attempt = 0; attempt < 12; attempt++) {
    if (edge === 0) {
      x = randomIn(-size, width + size);
      y = -size - MARGIN - randomIn(0, 80);
      vx = randomIn(-0.3, 0.3) * speed;
      vy = randomIn(0.4, 1) * speed;
    } else if (edge === 1) {
      x = width + MARGIN + randomIn(0, 80);
      y = randomIn(-size, height + size);
      vx = -randomIn(0.4, 1) * speed;
      vy = randomIn(-0.3, 0.3) * speed;
    } else if (edge === 2) {
      x = randomIn(-size, width + size);
      y = height + MARGIN + randomIn(0, 80);
      vx = randomIn(-0.3, 0.3) * speed;
      vy = -randomIn(0.4, 1) * speed;
    } else {
      x = -size - MARGIN - randomIn(0, 80);
      y = randomIn(-size, height + size);
      vx = randomIn(0.4, 1) * speed;
      vy = randomIn(-0.3, 0.3) * speed;
    }

    let tooClose = false;
    for (let i = 0; i < otherPositions.length; i++) {
      const p = otherPositions[i];
      const dx = (p.x + p.size / 2) - (x + size / 2);
      const dy = (p.y + p.size / 2) - (y + size / 2);
      if (Math.sqrt(dx * dx + dy * dy) < MIN_DISTANCE) {
        tooClose = true;
        break;
      }
    }
    if (!tooClose) break;
  }

  return {
    ...cover,
    src: pickRandom(imageList),
    x,
    y,
    vx,
    vy,
  };
}

/** True when cover is fully off-screen (with margin). */
function isOffScreen(x, y, size, width, height) {
  return (
    x + size < -MARGIN ||
    x > width + MARGIN ||
    y + size < -MARGIN ||
    y > height + MARGIN
  );
}

export function useFloatingCovers(imageList) {
  const [covers, setCovers] = useState([]);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const positionsRef = useRef([]);
  const elementRefs = useRef([]);
  const coversRef = useRef([]);
  const imageListRef = useRef(imageList);
  const rafRef = useRef(null);
  const lastTimeRef = useRef(0);

  coversRef.current = covers;
  imageListRef.current = imageList;

  useEffect(() => {
    const onResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      setDimensions({ width: w, height: h });
      if (coversRef.current.length === 0) return;
      setCovers((prev) => {
        const next = prev.map((c) => ({ ...c }));
        positionsRef.current = next.map((c) => ({ x: c.x, y: c.y, size: c.size }));
        return next;
      });
    };

    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (dimensions.width === 0 || dimensions.height === 0 || imageList.length === 0)
      return;
    const initial = generateInitialCovers(
      imageList,
      dimensions.width,
      dimensions.height
    );
    setCovers(initial);
    positionsRef.current = initial.map((c) => ({
      x: c.x,
      y: c.y,
      size: c.size,
    }));
    lastTimeRef.current = 0;
  }, [dimensions.width, dimensions.height, imageList.length]);

  useEffect(() => {
    if (covers.length === 0) return;
    const W = dimensions.width;
    const H = dimensions.height;
    if (W <= 0 || H <= 0) return;

    const tick = (time) => {
      const dt = lastTimeRef.current ? Math.min(time - lastTimeRef.current, 100) : 16;
      lastTimeRef.current = time;
      const sec = dt / 1000;
      const current = coversRef.current;
      const pos = positionsRef.current;
      const elts = elementRefs.current;
      let recycled = false;
      const updates = [];

      for (let i = 0; i < current.length; i++) {
        const c = current[i];
        pos[i].x += c.vx * sec;
        pos[i].y += c.vy * sec;
        pos[i].size = c.size;

        if (elts[i]) {
          elts[i].style.left = `${pos[i].x}px`;
          elts[i].style.top = `${pos[i].y}px`;
        }

        if (isOffScreen(pos[i].x, pos[i].y, c.size, W, H)) {
          const others = pos
            .map((p, j) => (j === i ? null : { x: p.x, y: p.y, size: current[j].size }))
            .filter(Boolean);
          const respawned = respawnAtEdge(
            { ...c, x: pos[i].x, y: pos[i].y },
            imageListRef.current,
            W,
            H,
            others
          );
          updates.push({ i, respawned });
          pos[i].x = respawned.x;
          pos[i].y = respawned.y;
          recycled = true;
        }
      }

      if (recycled && updates.length > 0) {
        setCovers((prev) => {
          const next = [...prev];
          updates.forEach(({ i, respawned }) => {
            next[i] = {
              ...next[i],
              id: `${next[i].id}-r${Date.now()}`,
              src: respawned.src,
              x: respawned.x,
              y: respawned.y,
              vx: respawned.vx,
              vy: respawned.vy,
            };
          });
          return next;
        });
        updates.forEach(({ i, respawned }) => {
          positionsRef.current[i].x = respawned.x;
          positionsRef.current[i].y = respawned.y;
        });
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [covers.length, dimensions.width, dimensions.height]);

  const setRef = useCallback((i, el) => {
    if (!elementRefs.current) elementRefs.current = [];
    elementRefs.current[i] = el;
  }, []);

  return { covers, setRef };
}
