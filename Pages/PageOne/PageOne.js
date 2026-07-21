export function init() {
  const page = document.querySelector('[data-page="page-one"]');
  const button = page?.querySelector("[data-counter-button]");
  const value = page?.querySelector("[data-counter-value]");
  let count = 0;

  const increment = () => {
    count += 1;
    value.textContent = String(count);
  };

  button?.addEventListener("click", increment);
  return () => button?.removeEventListener("click", increment);
}
