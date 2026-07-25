let root = null;
let backdrop = null;
let previousFocus = null;
let mounted = false;
let activeOnClose = null;

async function fetchText(path) {
  const response = await fetch(path, { cache: "no-store" });
  if (!response.ok) throw new Error(`Could not load ${path}`);
  return response.text();
}

function getFocusableElements() {
  if (!backdrop) return [];
  return [...backdrop.querySelectorAll(
    'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'
  )].filter(element => !element.hasAttribute("hidden"));
}

function handleKeydown(event) {
  if (!backdrop || backdrop.hidden) return;

  if (event.key === "Escape") {
    event.preventDefault();
    Modal.close("dismiss");
    return;
  }

  if (event.key !== "Tab") return;
  const focusable = getFocusableElements();
  if (!focusable.length) return;

  const first = focusable[0];
  const last = focusable[focusable.length - 1];

  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

async function ensureMounted() {
  if (mounted) return;

  root = document.querySelector("#modal-root");
  if (!root) throw new Error("Modal root was not found.");

  root.innerHTML = await fetchText("./Components/Modal/Modal.html");
  backdrop = root.querySelector("[data-modal-backdrop]");

  backdrop.addEventListener("click", event => {
    if (event.target === backdrop || event.target.closest("[data-modal-close]")) {
      Modal.close("dismiss");
    }
  });

  document.addEventListener("keydown", handleKeydown);
  mounted = true;
}

export const Modal = {
  async open({ title, content, onClose = null }) {
    await ensureMounted();

    if (!backdrop.hidden) Modal.close("replaced");

    previousFocus = document.activeElement;
    activeOnClose = typeof onClose === "function" ? onClose : null;
    backdrop.querySelector("[data-modal-title]").textContent = title;
    const contentRoot = backdrop.querySelector("[data-modal-content]");
    const panel = document.createElement("div");
    panel.className = "modal-panel";
    panel.innerHTML = content;
    contentRoot.replaceChildren(panel);
    backdrop.hidden = false;
    document.body.classList.add("modal-open");

    requestAnimationFrame(() => {
      const focusable = getFocusableElements();
      (focusable[0] ?? backdrop.querySelector(".modal-dialog"))?.focus?.();
    });

    return panel;
  },

  close(reason = "dismiss") {
    if (!backdrop || backdrop.hidden) return;

    const onClose = activeOnClose;
    activeOnClose = null;
    backdrop.hidden = true;
    backdrop.querySelector("[data-modal-content]").replaceChildren();
    document.body.classList.remove("modal-open");
    previousFocus?.focus?.();
    previousFocus = null;

    try {
      onClose?.(reason);
    } catch (error) {
      console.warn("Modal close handler failed", error);
    }
  }
};
