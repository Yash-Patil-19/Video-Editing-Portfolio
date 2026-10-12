const filters = [...document.querySelectorAll('[data-filter]')];
const cards = [...document.querySelectorAll('.project-card')];
filters.forEach(button => button.addEventListener('click', () => {
  filters.forEach(item => item.classList.toggle('active', item === button));
  const selected = button.dataset.filter;
  cards.forEach(card => card.classList.toggle('hidden', selected !== 'all' && card.dataset.category !== selected));
}));
const projectDialog = document.getElementById('project-dialog');
document.querySelectorAll('.project-open').forEach(button => button.addEventListener('click', () => {
  const card = button.closest('.project-card');
  document.getElementById('dialog-title').textContent = card.dataset.title;
  document.getElementById('dialog-type').textContent = card.dataset.type;
  document.getElementById('dialog-desc').textContent = card.dataset.desc;
  projectDialog.showModal();
}));
const reelDialog = document.getElementById('reel-dialog');
document.querySelector('[data-reel]').addEventListener('click', () => reelDialog.showModal());
document.querySelectorAll('.dialog-close').forEach(button => button.addEventListener('click', () => button.closest('dialog').close()));
[projectDialog, reelDialog].forEach(dialog => dialog.addEventListener('click', event => {
  const rect = dialog.getBoundingClientRect();
  if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
}));
const menuToggle = document.querySelector('.menu-toggle');
const nav = document.querySelector('.nav-links');
menuToggle.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  menuToggle.setAttribute('aria-expanded', String(open));
});
nav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
  nav.classList.remove('open'); menuToggle.setAttribute('aria-expanded', 'false');
}));
document.getElementById('year').textContent = new Date().getFullYear();
const revealObserver = new IntersectionObserver(entries => entries.forEach(entry => {
  if (entry.isIntersecting) { entry.target.classList.add('reveal'); revealObserver.unobserve(entry.target); }
}), {threshold: .08});
document.querySelectorAll('.section-heading, .project-card, .service-row, .process-card, .about-art, .about-copy').forEach(el => revealObserver.observe(el));
