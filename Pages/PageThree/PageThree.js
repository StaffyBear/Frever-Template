export function init() {
  const values = document.querySelectorAll('[data-page="page-three"] .summary-card strong');
  values.forEach(value => value.setAttribute("aria-label", `${value.textContent} sample items`));
}
