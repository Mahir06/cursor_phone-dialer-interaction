/**
 * App logic: dial pad inside #app (phone mockup).
 */

const layout = [
  { digit: "1", sub: "" },
  { digit: "2", sub: "abc" },
  { digit: "3", sub: "def" },
  { digit: "4", sub: "ghi" },
  { digit: "5", sub: "jkl" },
  { digit: "6", sub: "mno" },
  { digit: "7", sub: "pqrs" },
  { digit: "8", sub: "tuv" },
  { digit: "9", sub: "wxyz" },
  { digit: "*", sub: "" },
  { digit: "0", sub: "+" },
  { digit: "#", sub: "" },
];

const LONG_PRESS_MS = 480;

function createDialPad() {
  const grid = document.getElementById("dial-grid");
  const display = document.getElementById("dial-display");
  const displayWrap = document.getElementById("dial-display-wrap");
  const backBtn = document.getElementById("dial-backspace");
  if (!grid || !display || !displayWrap || !backBtn) return;

  let buffer = "";

  function sync() {
    display.textContent = buffer;
    backBtn.disabled = buffer.length === 0;
  }

  function appendChar(ch) {
    buffer += ch;
    sync();
  }

  function backspace() {
    buffer = buffer.slice(0, -1);
    sync();
  }

  function clearAll() {
    buffer = "";
    sync();
    displayWrap.classList.remove("is-clearing");
    void displayWrap.offsetWidth;
    displayWrap.classList.add("is-clearing");
  }

  backBtn.addEventListener("click", () => {
    if (buffer.length) backspace();
  });

  let swipeStartX = 0;
  let swipeTracking = false;

  displayWrap.addEventListener(
    "touchstart",
    (e) => {
      if (e.touches.length !== 1) return;
      swipeStartX = e.touches[0].clientX;
      swipeTracking = true;
    },
    { passive: true },
  );

  displayWrap.addEventListener(
    "touchmove",
    (e) => {
      if (!swipeTracking || e.touches.length !== 1) return;
      const dx = e.touches[0].clientX - swipeStartX;
      if (dx < -56) {
        swipeTracking = false;
        clearAll();
      }
    },
    { passive: true },
  );

  displayWrap.addEventListener("touchend", () => {
    swipeTracking = false;
  });

  layout.forEach(({ digit, sub }) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "dial-key";
    btn.setAttribute("aria-label", sub ? `Digit ${digit} ${sub}` : `Digit ${digit}`);

    const num = document.createElement("span");
    num.textContent = digit;
    btn.appendChild(num);

    if (sub) {
      const s = document.createElement("span");
      s.className = "dial-key-sub";
      s.textContent = sub;
      btn.appendChild(s);
    }

    let longPressTimer = null;
    let longPressFired = false;

    const addRipple = (clientX, clientY) => {
      const rect = btn.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;
      const ripple = document.createElement("span");
      ripple.className = "ripple";
      const size = Math.max(rect.width, rect.height);
      ripple.style.width = ripple.style.height = `${size}px`;
      ripple.style.left = `${x - size / 2}px`;
      ripple.style.top = `${y - size / 2}px`;
      btn.appendChild(ripple);
      ripple.addEventListener("animationend", () => ripple.remove());
    };

    const flashPress = () => {
      btn.classList.add("is-pressed");
      window.setTimeout(() => btn.classList.remove("is-pressed"), 120);
    };

    btn.addEventListener("pointerdown", (e) => {
      if (e.button !== 0 && e.pointerType === "mouse") return;
      btn.setPointerCapture(e.pointerId);
      addRipple(e.clientX, e.clientY);
      flashPress();

      longPressFired = false;
      if (digit === "0") {
        longPressTimer = window.setTimeout(() => {
          longPressTimer = null;
          longPressFired = true;
          appendChar("+");
        }, LONG_PRESS_MS);
      }
    });

    btn.addEventListener("pointerup", () => {
      if (digit === "0") {
        if (longPressTimer != null) {
          window.clearTimeout(longPressTimer);
          longPressTimer = null;
        }
        if (!longPressFired) appendChar("0");
        return;
      }
      appendChar(digit);
    });

    btn.addEventListener("pointercancel", () => {
      if (longPressTimer != null) {
        window.clearTimeout(longPressTimer);
        longPressTimer = null;
      }
      longPressFired = false;
    });

    grid.appendChild(btn);
  });

  sync();
}

document.addEventListener("DOMContentLoaded", createDialPad);
