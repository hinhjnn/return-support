(() => {
  const menu = document.querySelector('#site-menu');
  const opener = document.querySelector('.menu-button');
  if (!menu || !opener || typeof menu.showModal !== 'function') return;
  opener.hidden = false;
  opener.addEventListener('click', () => {
    menu.showModal();
    opener.setAttribute('aria-expanded', 'true');
    document.body.classList.add('menu-open');
  });
  menu.querySelector('.menu-close').addEventListener('click', () => menu.close());
  menu.addEventListener('close', () => {
    opener.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('menu-open');
  });
  menu.querySelectorAll('a').forEach(link => link.addEventListener('click', () => menu.close()));
})();
