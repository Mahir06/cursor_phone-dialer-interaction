/**
 * App logic lives here. The visible phone UI is the #app region in index.html.
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

function createDialPad() {
  const grid = document.getElementById("dial-grid");
  const display = document.getElementById("dial-display");
  if (!grid || !display) return;

  let buffer = "";

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

    const onPress = (clientX, clientY) => {
      buffer += digit === "+" ? "" : digit;
      display.textContent = buffer;

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

      btn.classList.add("is-pressed");
      window.setTimeout(() => btn.classList.remove("is-pressed"), 120);
    };

    btn.addEventListener("pointerdown", (e) => {
      if (e.button !== 0 && e.pointerType === "mouse") return;
      btn.setPointerCapture(e.pointerId);
      onPress(e.clientX, e.clientY);
    });

    grid.appendChild(btn);
  });
}

document.addEventListener("DOMContentLoaded", createDialPad);
