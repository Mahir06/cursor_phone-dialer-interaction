/**
 * Rotary dial: digits 0–9 CCW from 3 o'clock (0, 9, 8, …, 1). Orange marker fixed at 3 o'clock.
 */

const DIGITS_CCW = ["0", "9", "8", "7", "6", "5", "4", "3", "2", "1"];
const STEP_DEG = 36;
const COMMIT_MAX_DIST = 26;
const MIN_DRAG_DEG = 4;

function normDeg(d) {
  let x = d % 360;
  if (x < 0) x += 360;
  return x;
}

function circDistToZero(deg) {
  const n = normDeg(deg);
  return Math.min(n, 360 - n);
}

function pointerAngleDeg(cx, cy, clientX, clientY) {
  return (Math.atan2(clientY - cy, clientX - cx) * 180) / Math.PI;
}

function initRotaryDial() {
  const wheel = document.getElementById("rotary-wheel");
  const display = document.getElementById("rotary-display");
  const displayWrap = document.getElementById("rotary-display-wrap");
  const backBtn = document.getElementById("rotary-back");
  const clockEl = document.getElementById("rotary-status-time");
  if (!wheel || !display || !displayWrap || !backBtn) return;

  let buffer = "";
  let rotation = 0;
  let dragging = false;
  let lastPointerAngle = 0;
  let dragAccum = 0;

  DIGITS_CCW.forEach((digit, i) => {
    const hole = document.createElement("div");
    hole.className = "rotary-hole";
    hole.style.setProperty("--hole-a", `${i * STEP_DEG}deg`);
    hole.innerHTML = `<span class="rotary-hole-num">${digit}</span>`;
    wheel.appendChild(hole);
  });

  function syncDisplay() {
    display.textContent = buffer;
    backBtn.disabled = buffer.length === 0;
  }

  function digitAtMarker() {
    let best = -1;
    let bestD = 999;
    DIGITS_CCW.forEach((_, i) => {
      const world = normDeg(i * STEP_DEG + rotation);
      const d = circDistToZero(world);
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    });
    return { index: best, dist: bestD, digit: best >= 0 ? DIGITS_CCW[best] : null };
  }

  function commitIfNeeded() {
    wheel.classList.remove("rotary-wheel--dragging");
    const prevRot = rotation;
    if (dragAccum >= MIN_DRAG_DEG) {
      const { dist, digit } = digitAtMarker();
      if (dist <= COMMIT_MAX_DIST && digit != null) {
        buffer += digit;
        syncDisplay();
      }
    }
    dragAccum = 0;
    rotation = 0;
    const snap = Math.round(prevRot / 360) * 360;
    const delta = snap - prevRot;
    if (Math.abs(delta) < 0.01) {
      wheel.style.setProperty("--rot", "0deg");
      return;
    }
    const finishSnap = () => {
      wheel.classList.add("rotary-wheel--instant");
      wheel.style.setProperty("--rot", "0deg");
      void wheel.offsetWidth;
      wheel.classList.remove("rotary-wheel--instant");
    };
    let fallback = 0;
    const onEnd = (e) => {
      if (e.target !== wheel || e.propertyName !== "transform") return;
      wheel.removeEventListener("transitionend", onEnd);
      window.clearTimeout(fallback);
      finishSnap();
    };
    wheel.addEventListener("transitionend", onEnd);
    fallback = window.setTimeout(() => {
      wheel.removeEventListener("transitionend", onEnd);
      finishSnap();
    }, 700);
    requestAnimationFrame(() => {
      wheel.style.setProperty("--rot", `${snap}deg`);
    });
  }

  backBtn.addEventListener("click", () => {
    if (buffer.length) {
      buffer = buffer.slice(0, -1);
      syncDisplay();
    }
  });

  let swipeX0 = 0;
  let swipeOn = false;
  displayWrap.addEventListener("touchstart", (e) => {
    if (e.touches.length === 1) {
      swipeX0 = e.touches[0].clientX;
      swipeOn = true;
    }
  }, { passive: true });
  displayWrap.addEventListener("touchmove", (e) => {
    if (!swipeOn || e.touches.length !== 1) return;
    if (e.touches[0].clientX - swipeX0 < -48) {
      buffer = "";
      syncDisplay();
      swipeOn = false;
    }
  }, { passive: true });
  displayWrap.addEventListener("touchend", () => {
    swipeOn = false;
  });

  let captureId = null;

  wheel.addEventListener("pointerdown", (e) => {
    if (e.button !== 0 && e.pointerType === "mouse") return;
    e.preventDefault();
    const r = wheel.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    dragging = true;
    wheel.classList.add("rotary-wheel--dragging");
    lastPointerAngle = pointerAngleDeg(cx, cy, e.clientX, e.clientY);
    dragAccum = 0;
    captureId = e.pointerId;
    wheel.setPointerCapture(captureId);
  });

  wheel.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    const r = wheel.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    const a = pointerAngleDeg(cx, cy, e.clientX, e.clientY);
    let delta = a - lastPointerAngle;
    if (delta > 180) delta -= 360;
    if (delta < -180) delta += 360;
    lastPointerAngle = a;
    rotation += delta;
    dragAccum += Math.abs(delta);
    wheel.style.setProperty("--rot", `${rotation}deg`);
  });

  wheel.addEventListener("pointerup", () => {
    if (!dragging) return;
    dragging = false;
    if (captureId != null) {
      try {
        wheel.releasePointerCapture(captureId);
      } catch {
        /* ignore */
      }
      captureId = null;
    }
    commitIfNeeded();
  });

  wheel.addEventListener("pointercancel", () => {
    if (!dragging) return;
    dragging = false;
    if (captureId != null) {
      try {
        wheel.releasePointerCapture(captureId);
      } catch {
        /* ignore */
      }
      captureId = null;
    }
    commitIfNeeded();
  });

  function tickClock() {
    const d = new Date();
    const h = d.getHours();
    const m = d.getMinutes();
    const t = `${((h + 11) % 12) + 1}:${m.toString().padStart(2, "0")}`;
    if (clockEl) clockEl.textContent = t;
  }
  tickClock();
  setInterval(tickClock, 30_000);

  syncDisplay();
  wheel.classList.add("rotary-wheel--instant");
  wheel.style.setProperty("--rot", "0deg");
  void wheel.offsetWidth;
  wheel.classList.remove("rotary-wheel--instant");
}

document.addEventListener("DOMContentLoaded", initRotaryDial);
