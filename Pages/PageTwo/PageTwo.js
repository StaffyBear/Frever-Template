export function init() {
  const cards = document.querySelectorAll('[data-page="page-two"] .list-card');
  cards.forEach((card, index) => {
    card.style.setProperty("--entry-order", String(index));
  });
}
