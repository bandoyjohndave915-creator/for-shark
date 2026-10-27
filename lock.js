// Interactive six-digit push-button lock. This is a visual entrance, not secure authentication.
(() => {
  const CORRECT_CODE = "091725";
  const gate = document.getElementById("lock-gate");
  const lock = document.getElementById("physical-lock");
  const keypad = document.getElementById("lock-keypad");
  const slots = [...document.querySelectorAll(".digit-slot")];
  const status = document.getElementById("lock-status");
  const feedback = document.getElementById("gate-feedback");
  if (!gate || !lock || !keypad || !status || !feedback) return;

  let entered = "";
  let busy = false;
  document.body.classList.add("locked");

  // Short mechanical click, generated locally so no sound file or network request is needed.
  function clickSound(freq = 520, duration = 0.035, volume = 0.025) {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(volume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(); osc.stop(ctx.currentTime + duration);
      osc.onended = () => ctx.close();
    } catch (_) { /* Audio is optional; the lock still works without it. */ }
  }

  function renderSlots() {
    slots.forEach((slot, index) => {
      const filled = index < entered.length;
      slot.textContent = filled ? "•" : "";
      slot.classList.toggle("filled", filled);
    });
    status.textContent = entered.length ? `${entered.length} / 6` : "READY";
  }

  function pressButton(button) {
    if (busy) return;
    button.classList.add("is-pressed");
    window.setTimeout(() => button.classList.remove("is-pressed"), 110);
    clickSound(button.dataset.action === "enter" ? 680 : 460 + Math.random() * 100);
  }

  function clearCode(message = "Code cleared. Try again.") {
    entered = "";
    renderSlots();
    feedback.textContent = message;
  }

  function unlock() {
    busy = true;
    gate.classList.remove("is-wrong");
    gate.classList.add("is-unlocking");
    status.textContent = "UNLOCKED";
    feedback.textContent = "Click. The lock is open.";
    clickSound(760, .09, .045);
    window.setTimeout(() => clickSound(940, .12, .035), 180);
    window.setTimeout(() => {
      gate.classList.add("is-hidden");
      document.body.classList.remove("locked");
      window.setTimeout(() => gate.remove(), 700);
    }, 1050);
  }

  function submitCode() {
    if (busy || entered.length !== 6) {
      if (!busy) feedback.textContent = "Enter all six digits first.";
      return;
    }
    if (entered === CORRECT_CODE) {
      unlock();
      return;
    }
    gate.classList.remove("is-wrong");
    // Restart the shake animation reliably.
    void lock.offsetWidth;
    gate.classList.add("is-wrong");
    status.textContent = "TRY AGAIN";
    feedback.textContent = "That combination didn't work. Try again.";
    clickSound(180, .12, .035);
    window.setTimeout(() => {
      gate.classList.remove("is-wrong");
      clearCode("Try another combination when you're ready.");
    }, 650);
  }

  keypad.addEventListener("click", event => {
    const button = event.target.closest("button");
    if (!button || busy) return;
    pressButton(button);
    if (button.dataset.digit !== undefined) {
      if (entered.length < 6) {
        entered += button.dataset.digit;
        renderSlots();
        feedback.textContent = entered.length === 6 ? "Six digits entered. Press enter." : "Keep going…";
      }
      return;
    }
    if (button.dataset.action === "clear") {
      clearCode("Code cleared. Try again.");
    } else if (button.dataset.action === "enter") {
      submitCode();
    }
  });

  document.addEventListener("keydown", event => {
    if (busy || !document.getElementById("lock-gate")) return;
    if (/^[0-9]$/.test(event.key)) {
      if (entered.length < 6) { entered += event.key; renderSlots(); clickSound(); }
      event.preventDefault();
    } else if (event.key === "Backspace") {
      entered = entered.slice(0, -1); renderSlots(); feedback.textContent = "Keep going…";
      event.preventDefault();
    } else if (event.key === "Escape") {
      clearCode("Code cleared.");
    } else if (event.key === "Enter") {
      submitCode();
    }
  });

  renderSlots();
})();
