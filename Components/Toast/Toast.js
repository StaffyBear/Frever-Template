let timeoutId = null;

export function showToast(message, type = "default") {
  const region = document.querySelector("#toast-region");
  if (!region) return;

  clearTimeout(timeoutId);
  region.innerHTML = `<div class="toast toast-${type}" role="status">${message}</div>`;
  timeoutId = window.setTimeout(() => {
    region.innerHTML = "";
  }, 2600);
}
