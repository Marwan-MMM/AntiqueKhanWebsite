// script.js - plain JS for hamburger overlay, fade transitions, and shop category filters
document.addEventListener("DOMContentLoaded", () => {
    // ==========================================
    // PAGE FADE NAVIGATION (smooth transitions between pages)
    // ==========================================
    const pageWrapper = document.getElementById("page-wrapper");
    document.querySelectorAll("a").forEach(link => {
        // Skip external links, mailto, anchors, or new tab links
        if (
            !link.href ||
            link.target === "_blank" ||
            link.href.startsWith("mailto:") ||
            link.getAttribute("href").startsWith("#")
        )
            return;

        // Intercept only same-origin navigations
        link.addEventListener("click", e => {
            const href = link.getAttribute("href");
            if (!href || (href.startsWith("http") && !href.includes(location.host))) return;

            e.preventDefault();
            pageWrapper.classList.add("fade-out");
            setTimeout(() => {
                window.location.href = href;
            }, 280);
        });
    });

    // ==========================================
    // HAMBURGER OVERLAY MENU (for both index & shop)
    // ==========================================
    const toggles = document.querySelectorAll(".menu-toggle");
    toggles.forEach(toggle => {
        const nav = toggle.closest(".navbar");
        const overlay = nav.querySelector(".nav-overlay");
        const backdrop = overlay ? overlay.querySelector(".overlay-backdrop") : null;
        const closeBtn = overlay ? overlay.querySelector(".overlay-close") : null;

        const openOverlay = () => {
            overlay.classList.add("active");
            toggle.classList.add("open");
            overlay.setAttribute("aria-hidden", "false");
            document.body.style.overflow = "hidden"; // Lock scroll when menu open
        };

        const closeOverlay = () => {
            overlay.classList.remove("active");
            toggle.classList.remove("open");
            overlay.setAttribute("aria-hidden", "true");
            document.body.style.overflow = ""; // Unlock scroll
        };

        toggle.addEventListener("click", () => {
            if (!overlay.classList.contains("active")) openOverlay();
            else closeOverlay();
        });

        // Close menu on backdrop or close button click
        if (backdrop) backdrop.addEventListener("click", closeOverlay);
        if (closeBtn) closeBtn.addEventListener("click", closeOverlay);

        // Close menu on ESC key
        document.addEventListener("keydown", e => {
            if (e.key === "Escape" && overlay.classList.contains("active")) closeOverlay();
        });

        // Close overlay when clicking a link inside
        if (overlay) {
            overlay.querySelectorAll("a").forEach(a => a.addEventListener("click", closeOverlay));
        }
    });

    // ==========================================
    // ACCESSIBILITY: ALLOW ENTER/SPACE ON MENU TOGGLE
    // ==========================================
    document.querySelectorAll(".menu-toggle").forEach(btn => {
        btn.addEventListener("keydown", e => {
            if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                btn.click();
            }
        });
    });

    // ==========================================
    // CATEGORY FILTERING (Shop Page)
    // ==========================================
    const categoryLabels = document.querySelectorAll(".top-content label");
    const photos = document.querySelectorAll(".photo-gallery .pic");

    // Define text-to-class mapping for your existing structure
    const categoryMap = {
        "All Photos": "all",
        "Furniture": "Furniture",
        "Kitchenware": "Kitchenware",
        "Clocks": "Clocks",
        "Glassware": "Glassware",
        "Lighting": "Lighting",
        "Wall Arts & Mirrors": "Mirrors",
        "Art & Décor": "Vases"
    };

    // If both labels and photos exist on the page
    if (categoryLabels.length && photos.length) {
        categoryLabels.forEach(label => {
            label.addEventListener("click", () => {
                const categoryText = label.textContent.trim();
                const category = categoryMap[categoryText] || "all";

                // Highlight the active label
                categoryLabels.forEach(l => l.classList.remove("active"));
                label.classList.add("active");

                // Show/hide matching photos
                photos.forEach(photo => {
                    const show = category === "all" || photo.classList.contains(category);
                    if (show) {
                        photo.classList.remove("hide");
                        photo.style.display = "block";
                    } else {
                        photo.classList.add("hide");
                        setTimeout(() => { photo.style.display = "none"; }, 400); // match transition
                    }

                });
            });
        });

        // Auto-activate "All Photos" on page load
        const allLabel = Array.from(categoryLabels).find(l => l.textContent.trim() === "All Photos");
        if (allLabel) {
            allLabel.classList.add("active");
            photos.forEach(photo => (photo.style.display = "block"));
        }
    }

    // ==========================================
    // TOUCH MOMENTUM (for smoother mobile horizontal scrolls)
    // ==========================================
    // CSS already uses `-webkit-overflow-scrolling: touch`, so no JS needed here.
});

/* ===== Product modal logic - human comments included =====
   Append this to script.js after your existing DOMContentLoaded handlers.
   It listens for clicks on product tiles (photo-gallery .pic and featured-card).
   It pulls product info from window.PRODUCT_DATA and populates the modal.
*/
(function () {
  // helper: safe query
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  // modal nodes
  const modal = document.getElementById('product-modal');
  const panel = modal && $('.modal-panel', modal);
  const backdrop = modal && $('.modal-backdrop', modal);
  const btnClose = modal && $('.modal-close', modal);
  const mainImg = modal && document.getElementById('pm-main-img');
  const thumbsRow = modal && document.getElementById('pm-thumbs');
  const titleEl = modal && document.getElementById('pm-title');
  const priceEl = modal && document.getElementById('pm-price');
  const descEl = modal && document.getElementById('pm-desc');
  const qtyEl = modal && document.getElementById('pm-qty');
  const addBtn = modal && document.getElementById('pm-add');

  if (!modal) return; // nothing to do if modal not present

  // open modal helper
  function openModal() {
    modal.classList.add('show');
    modal.setAttribute('aria-hidden', 'false');
    // accessibility: focus inside
    panel && panel.focus();
    document.body.style.overflow = 'hidden';
  }

  // close modal helper
  function closeModal() {
    modal.classList.remove('show');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    // small cleanup
    thumbsRow && (thumbsRow.innerHTML = '');
  }

  // find product id from clicked element:
  // prefer data-id attribute, else parse anchor href ?id=...
  function findProductId(el) {
    if (!el) return null;
    const byData = el.closest('[data-id]')?.getAttribute('data-id');
    if (byData) return byData;
    // if clicked inside anchor like product.html?id=SkySofa
    const anchor = el.closest('a[href*="?id="]');
    if (anchor) {
      const url = new URL(anchor.getAttribute('href'), location.href);
      return url.searchParams.get('id');
    }
    // try alt or filename fallback (not reliable but a safety)
    const img = el.querySelector('img') || el;
    if (img && img.src) {
      // try last filename without extension
      const parts = img.src.split('/').pop().split('.')[0];
      return parts || null;
    }
    return null;
  }

  // populate modal for a product object
  function populateModal(product) {
    if (!product) return;
    titleEl.textContent = product.title || product.id;
    priceEl.textContent = (product.currency ? product.currency + ' ' : '') + (product.price || '');
    descEl.textContent = product.longDescription || '';
    qtyEl.value = 1;

    // main image and thumbs
    const imgs = product.images && product.images.length ? product.images : [(product.images || product.image || '')];
    if (imgs.length) {
      mainImg.src = imgs[0];
      mainImg.alt = product.title || '';
      // thumbnails
      thumbsRow.innerHTML = '';
      imgs.forEach((src, i) => {
        const t = document.createElement('img');
        t.src = src;
        t.alt = product.title + ' photo ' + (i + 1);
        t.dataset.src = src;
        if (i === 0) t.classList.add('active');
        // click to switch
        t.addEventListener('click', () => {
          // swap main image
          mainImg.src = src;
          // active thumb
          $$('.modal-thumbs img', thumbsRow).forEach(im => im.classList.remove('active'));
          t.classList.add('active');
        });
        thumbsRow.appendChild(t);
      });
    } else {
      mainImg.src = '';
      thumbsRow.innerHTML = '';
    }

    // attach add-to-cart handler ephemeral reference
    addBtn.onclick = () => {
      const qty = Math.max(1, parseInt(qtyEl.value) || 1);
      addToCart(product.id, qty);
      // small feedback: button text flash
      const old = addBtn.textContent;
      addBtn.textContent = 'Added ✓';
      setTimeout(() => addBtn.textContent = old, 900);
    };
  }

  // cart helpers (localStorage)
  function getCart() {
    try {
      const raw = localStorage.getItem('cart');
      return raw ? JSON.parse(raw) : [];
    } catch (e) { return []; }
  }
  function saveCart(cart) {
    localStorage.setItem('cart', JSON.stringify(cart));
  }
  function addToCart(productId, qty) {
    const product = window.PRODUCT_DATA?.[productId];
    if (!product) {
      console.warn('Product not found for cart add:', productId);
      return;
    }
    const cart = getCart();
    const idx = cart.findIndex(i => i.id === productId);
    if (idx >= 0) cart[idx].qty += qty;
    else cart.push({ id: productId, title: product.title, price: product.price, currency: product.currency, qty });
    saveCart(cart);
    // for debugging, you can console.log(cart) or show small toast later
    console.log('Cart now:', cart);
  }

  // click listeners: product tiles and featured cards
  function attachOpenHandlers() {
    // any .photo-gallery .pic
    $$('.photo-gallery .pic').forEach(el => {
      el.addEventListener('click', (e) => {
        const id = findProductId(e.target) || el.getAttribute('data-id');
        const product = window.PRODUCT_DATA?.[id];
        if (!id || !product) {
          console.warn('No product data for', id);
          return;
        }
        populateModal(product);
        openModal();
      });
    });

    // featured cards (they are anchors)
    $$('.featured-card').forEach(a => {
      a.addEventListener('click', (e) => {
        e.preventDefault(); // avoid navigation since modal opens
        const id = a.getAttribute('href')?.split('id=')[1] || a.getAttribute('data-id');
        const product = window.PRODUCT_DATA?.[id];
        if (!id || !product) {
          console.warn('No product data for', id);
          return;
        }
        populateModal(product);
        openModal();
      });
    });
  }

  // close bindings
  btnClose.addEventListener('click', closeModal);
  backdrop.addEventListener('click', (e) => {
    if (e.target.dataset.close !== undefined) closeModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('show')) closeModal();
  });

  // initialization: attach handlers and try to auto-wire missing data-id from anchors
  function autoWireDataIds() {
    // if .pic has an <a href="product.html?id=SkySofa">, copy id into data-id
    $$('.photo-gallery .pic').forEach(pic => {
      if (!pic.getAttribute('data-id')) {
        const anchor = pic.querySelector('a[href*="?id="]');
        if (anchor) {
          try {
            const url = new URL(anchor.getAttribute('href'), location.href);
            const id = url.searchParams.get('id');
            if (id) pic.setAttribute('data-id', id);
          } catch (err) { /* ignore */ }
        } else {
          // fallback: try to derive from image filename
          const img = pic.querySelector('img');
          if (img && img.src) {
            const name = img.src.split('/').pop().split('.')[0];
            if (name) pic.setAttribute('data-id', name);
          }
        }
      }
    });

    // also ensure featured-cards have data-id if they use href
    $$('.featured-card').forEach(a => {
      if (!a.getAttribute('data-id')) {
        const href = a.getAttribute('href') || '';
        if (href.includes('?id=')) {
          const id = href.split('id=')[1];
          if (id) a.setAttribute('data-id', id);
        }
      }
    });
  }

  // run
  autoWireDataIds();
  attachOpenHandlers();
})();
