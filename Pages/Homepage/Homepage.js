export function init({ navigate }) {
  const page = document.querySelector('[data-page="home"]');
  const handler = event => {
    const button = event.target.closest("[data-open-page]");
    if (button) navigate(button.dataset.openPage);
  };

  page?.addEventListener("click", handler);
  return () => page?.removeEventListener("click", handler);
}
