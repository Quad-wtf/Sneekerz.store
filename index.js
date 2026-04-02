// EmailJS Credentials
const PUBLIC_KEY  = "lUwINsHZXKP3xq0Ml";
const SERVICE_ID  = "service_35p6c3j";
const TEMPLATE_ID = "template_kwl12qn";

emailjs.init(PUBLIC_KEY);

// Product Thumbnail Injection
// For each .img div that has data-images, build a thumb strip below it.
document.querySelectorAll('.img[data-images]').forEach(imgDiv => {
  const images = imgDiv.dataset.images.split('|').map(s => s.trim()).filter(Boolean);
  if (images.length < 2) return;

  // Find the nearest .thumb-strip sibling
  const strip = imgDiv.parentElement.querySelector('.thumb-strip');
  if (!strip) return;

  const mainImg = imgDiv.querySelector('img');
  images.forEach((src, i) => {
    const t = document.createElement('img');
    t.src = src;
    t.alt = `Podgląd ${i + 1}`;
    t.className = 'thumb' + (i === 0 ? ' active' : '');
    t.onclick = (e) => {
      e.stopPropagation();
      // Swap main image
      mainImg.src = src;
      strip.querySelectorAll('.thumb').forEach(th => th.classList.remove('active'));
      t.classList.add('active');
      // Update data attribute so lightbox knows current image
      imgDiv.dataset.currentIndex = i;
    };
    strip.appendChild(t);
  });
  imgDiv.dataset.currentIndex = 0;
});

// Ligthbox
let lbImages  = [];
let lbIndex   = 0;

function openLightbox(imgDiv) {
  const mainImg = imgDiv.querySelector('img');
  const rawImages = imgDiv.dataset.images
    ? imgDiv.dataset.images.split('|').map(s => s.trim()).filter(Boolean)
    : [mainImg.src];

  lbImages = rawImages;

  // Start at whichever thumbnail was active
  lbIndex = parseInt(imgDiv.dataset.currentIndex || '0', 10);

  renderLightbox();
  document.getElementById('lightbox').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeLightbox() {
  document.getElementById('lightbox').classList.remove('open');
  document.body.style.overflow = '';
}

function showCartPopup(msg) {
  let popup = document.getElementById('cart-popup');

  if (!popup) {
    popup = document.createElement('div');
    popup.id = 'cart-popup';
    popup.className = 'cart-popup';
    document.body.appendChild(popup);
  }

  popup.textContent = msg;
  popup.classList.add('show');

  setTimeout(() => {
    popup.classList.remove('show');
  }, 1800);
}

function handleLbOverlayClick(e) {
  if (e.target === document.getElementById('lightbox')) closeLightbox();
}

function renderLightbox() {
  const img     = document.getElementById('lb-img');
  const caption = document.getElementById('lb-caption');
  const counter = document.getElementById('lb-counter');
  const thumbs  = document.getElementById('lb-thumbs');
  const prevBtn = document.getElementById('lb-prev');
  const nextBtn = document.getElementById('lb-next');

  const multi = lbImages.length > 1;

  // Update main image with fade
  img.classList.add('fade');
  setTimeout(() => {
    img.src = lbImages[lbIndex];
    img.alt = `Zdjęcie ${lbIndex + 1}`;
    img.classList.remove('fade');
  }, 180);

  caption.textContent = `Zdjęcie ${lbIndex + 1} z ${lbImages.length}`;
  counter.textContent = multi ? `${lbIndex + 1} / ${lbImages.length}` : '';
  counter.className   = multi ? '' : 'hidden';
  prevBtn.className   = 'lb-arrow' + (multi ? '' : ' hidden');
  nextBtn.className   = 'lb-arrow' + (multi ? '' : ' hidden');

  // Thumbnail strip
  thumbs.innerHTML = '';
  if (multi) {
    lbImages.forEach((src, i) => {
      const t = document.createElement('img');
      t.src = src;
      t.alt = `Miniatura ${i + 1}`;
      t.className = 'lb-thumb' + (i === lbIndex ? ' active' : '');
      t.onclick = () => { lbIndex = i; renderLightbox(); };
      thumbs.appendChild(t);
    });
  }
}

function lbShift(dir) {
  lbIndex = (lbIndex + dir + lbImages.length) % lbImages.length;
  renderLightbox();
}

// Keyboard navigation for lightbox
document.addEventListener('keydown', e => {
  const lb = document.getElementById('lightbox');
  if (!lb.classList.contains('open')) {
    if (e.key === 'Escape') closeCheckout();
    return;
  }
  if (e.key === 'Escape')       closeLightbox();
  if (e.key === 'ArrowLeft')    lbShift(-1);
  if (e.key === 'ArrowRight')   lbShift(+1);
});

// Routing
function route() {
  const page = location.hash.replace('#', '') || 'shop';
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const active = document.getElementById(page);
  if (active) active.classList.add('active');
}
window.addEventListener('hashchange', route);
window.addEventListener('load', route);

// Cart
const cart = [];

function addToCart(name, price) {
  cart.push({ name, price });
  updateCart();

    showCartPopup(`Dodano do koszyka: ${name}`);
}

function updateCart() {
  const list     = document.getElementById('cart-items');
  const totalEl  = document.getElementById('cart-total');
  const countEl  = document.getElementById('cart-count');
  const checkBtn = document.getElementById('checkout-btn');

  list.innerHTML = '';
  let total = 0;

  cart.forEach(item => {
    total += item.price;
    const li = document.createElement('li');
    li.innerHTML = `<span>${item.name}</span><span>${item.price.toFixed(2)} BŻ</span>`;
    list.appendChild(li);
  });

  totalEl.textContent = total.toFixed(2);
  countEl.textContent = cart.length;
  checkBtn.disabled   = cart.length === 0;
}

// Checkout modal
function openCheckout() {
  if (cart.length === 0) return;

  const summaryEl = document.getElementById('modal-summary');
  let html = '';
  let total = 0;
  cart.forEach(item => {
    total += item.price;
    html += `<div class="summary-row"><span>${item.name}</span><span>${item.price.toFixed(2)} BŻ</span></div>`;
  });
  html += `<div class="summary-total"><span>Razem</span><span>${total.toFixed(2)} BŻ</span></div>`;
  summaryEl.innerHTML = html;

  document.getElementById('modal-overlay').classList.add('open');
  document.body.style.overflow = 'hidden';
  hideToast();
  document.getElementById('order-name').focus();
}

function closeCheckout() {
  document.getElementById('modal-overlay').classList.remove('open');
  document.body.style.overflow = '';
}

function handleOverlayClick(e) {
  if (e.target === document.getElementById('modal-overlay')) closeCheckout();
}

function submitOrder() {
  const captcha = grecaptcha.getResponse();
  if (!captcha) {
    showToast('error', 'Potwierdź, że nie jesteś robotem.');
    return;
  }
  const name    = document.getElementById('order-name').value.trim();
  const email   = document.getElementById('order-email').value.trim();
  const btn     = document.getElementById('modal-submit-btn');
  const spinner = document.getElementById('modal-spinner');
  const btnText = document.getElementById('modal-btn-text');

  if (!name)  { showToast('error', 'Wpisz swoje imię i nazwisko.'); return; }
  if (!email || !email.includes('@')) { showToast('error', 'Wpisz poprawny adres e-mail.'); return; }

  const productLines = cart.map(i => `${i.name} — ${i.price.toFixed(2)} BŻ`).join('\n');
  const total = cart.reduce((s, i) => s + i.price, 0).toFixed(2);

  btn.disabled = true;
  btnText.textContent = 'Wysyłanie…';
  spinner.style.display = 'block';
  hideToast();

  emailjs.send(SERVICE_ID, TEMPLATE_ID, {
    from_name: name,
    from_email: email,
    products:   productLines,
      sum:        total
  })
  .then(() => {
  showToast('success', `Zamówienie złożone! Potwierdzenie wysłano na ${email}.`);
  btnText.textContent = 'WYŚLIJ ZAMÓWIENIE';
  spinner.style.display = 'none';
  btn.disabled = false;
  cart.length = 0;
  updateCart();
  setTimeout(closeCheckout, 2800);
  })
  .catch(err => {
    console.error(err);
    showToast('error', 'Błąd wysyłki. Sprawdź dane EmailJS.');
    btnText.textContent = 'WYŚLIJ ZAMÓWIENIE';
    spinner.style.display = 'none';
    btn.disabled = false;
   });
}

function showToast(type, msg) {
   const t = document.getElementById('modal-toast');
   t.className = `modal-toast ${type} show`;
   document.getElementById('modal-toast-msg').textContent = msg;
}

function hideToast() {
   document.getElementById('modal-toast').className = 'modal-toast';
}
