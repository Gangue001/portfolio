// Keep navigation available without JavaScript; enhance it on small screens.
const menuButton = document.querySelector('.menu-toggle');
const navigation = document.querySelector('#navigation');
const mobileViewport = window.matchMedia('(max-width: 700px)');

function setMenu(open) {
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.textContent = open ? 'Close' : 'Menu';
  navigation.hidden = !open;
}

function syncNavigation() {
  menuButton.hidden = !mobileViewport.matches;
  setMenu(!mobileViewport.matches);
}

menuButton.addEventListener('click', () => {
  setMenu(menuButton.getAttribute('aria-expanded') !== 'true');
});
navigation.addEventListener('click', (event) => {
  if (event.target.closest('a') && mobileViewport.matches) setMenu(false);
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && mobileViewport.matches && !navigation.hidden) {
    setMenu(false);
    menuButton.focus();
  }
});
mobileViewport.addEventListener('change', syncNavigation);
syncNavigation();
document.querySelector('#year').textContent = new Date().getFullYear();


// Native dialog provides keyboard focus management and Escape-to-close support.
const imageDialog = document.querySelector('#image-dialog');
const dialogImage = document.querySelector('#dialog-image');
document.querySelectorAll('.image-zoom').forEach((button) => {
  button.addEventListener('click', () => {
    dialogImage.src = button.dataset.image;
    dialogImage.alt = button.dataset.caption;
    document.querySelector('#dialog-caption').textContent = button.dataset.caption;
    imageDialog.showModal();
  });
});
document.querySelector('.dialog-close').addEventListener('click', () => imageDialog.close());
imageDialog.addEventListener('click', (event) => {
  const rect = imageDialog.getBoundingClientRect();
  if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) imageDialog.close();
});
