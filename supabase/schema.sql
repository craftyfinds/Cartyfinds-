// CartyFinds_ storefront starter. Replace sample catalog and WhatsApp number before launch.
const WHATSAPP_NUMBER = ""; // Example: "919876543210" (country code + number, digits only)

let supabase = null;
if (window.CARTYFINDS_CONFIG && window.CARTYFINDS_CONFIG.SUPABASE_URL && window.CARTYFINDS_CONFIG.SUPABASE_PUBLISHABLE_KEY) {
  supabase = window.supabase.createClient(
    window.CARTYFINDS_CONFIG.SUPABASE_URL,
    window.CARTYFINDS_CONFIG.SUPABASE_PUBLISHABLE_KEY
  );
}

const SAMPLE_PRODUCTS = [
  {id:1,name:"2 in 1 Manual Hand Juicer",category:"Home & Kitchen",price:299,oldPrice:499,discount:40,rating:"4.3",reviews:"2.4K",image:"images/hand-juicer.svg",description:"A compact manual citrus juicer for everyday kitchen use. Sample product content—replace with verified supplier details."},
  {id:2,name:"Dish Soap Dispenser + Sponge Holder",category:"Home & Kitchen",price:299,oldPrice:459,discount:35,rating:"4.2",reviews:"1.8K",image:"images/soap-holder.svg",description:"Keep your sink area neat with a handy soap and sponge organizer. Sample product content—verify specifications before listing."},
  {id:3,name:"LPG Cylinder Trolley",category:"Home & Kitchen",price:399,oldPrice:699,discount:45,rating:"4.0",reviews:"1.2K",image:"images/cylinder-trolley.svg",description:"A rolling trolley concept for moving household cylinders. Check weight rating and safety information with your supplier."},
  {id:4,name:"Multi Layer Storage Box",category:"Storage & Organizers",price:349,oldPrice:499,discount:30,rating:"4.4",reviews:"3.1K",image:"images/storage-organizer.svg",description:"Multi-level storage for household items. Sample listing; replace measurements, material, and price with actual details."},
  {id:5,name:"Adjustable Mobile Phone Stand",category:"Mobile Accessories",price:149,oldPrice:249,discount:40,rating:"4.1",reviews:"860",image:"images/phone-stand.svg",description:"A compact stand concept for hands-free viewing. Confirm compatibility and materials before publishing."},
  {id:6,name:"Everyday Gadget Organizer",category:"Electronics",price:249,oldPrice:399,discount:38,rating:"4.2",reviews:"720",image:"images/gadget-organizer.svg",description:"An organizer for small everyday accessories. Sample listing; replace with your actual supplier information."},
  {id:7,name:"Beauty Essentials Organizer",category:"Beauty & Personal Care",price:329,oldPrice:499,discount:34,rating:"4.4",reviews:"1.1K",image:"images/beauty-organizer.svg",description:"A countertop organizer concept for beauty and personal care items. Verify actual dimensions and product contents."},
  {id:8,name:"Travel Pouch Set",category:"Fashion & Accessories",price:199,oldPrice:299,discount:33,rating:"4.0",reviews:"540",image:"images/travel-pouch.svg",description:"Reusable pouches for organizing travel essentials. Replace the sample image and details with actual product data."}
];

const normalizeId = (value) => String(value ?? "");
let products = [...SAMPLE_PRODUCTS];

const $ = (selector) => document.querySelector(selector);
const productGrid = $("#productGrid");
const cartDrawer = $("#cartDrawer");
const overlay = $("#overlay");
let activeCategory = "All";
let searchTerm = "";

function readStoredArray(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(value) ? value : [];
  } catch (error) {
    console.warn(`Could not read ${key}; starting fresh.`, error);
    return [];
  }
}
function safeStore(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); }
  catch (error) { console.warn(`Storage unavailable for ${key}.`, error); }
}
let cart = readStoredArray("cartyfinds_cart").filter(row => row && row.qty > 0).map(row => ({id: normalizeId(row.id), qty:Number(row.qty)}));
let wishlist = readStoredArray("cartyfinds_wishlist").map(v => normalizeId(v)).filter(Boolean);

function money(amount) { return "₹" + Number(amount).toLocaleString("en-IN"); }
function escapeHTML(value) { return String(value).replace(/[&<>\"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])); }

async function loadProductsFromSupabase() {
  if (!supabase) return;
  try {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("published", true)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Supabase product load error:", error);
      return;
    }
    if (!data || !data.length) return;

    products = data.map((p, index) => ({
      id: normalizeId(p.id || `local-${index + 1}`),
      name: p.title || "Untitled Product",
      category: p.category || "Other",
      price: Number(p.price || 0),
      oldPrice: p.compare_at_price ? Number(p.compare_at_price) : Number(p.price || 0) * 1.2,
      discount: p.compare_at_price ? Math.max(0, Math.round((1 - Number(p.price || 0) / Number(p.compare_at_price || p.price || 1)) * 100)) : 0,
      rating: p.rating || "4.0",
      reviews: p.reviews || "0",
      image: p.image_url || "images/placeholder.svg",
      description: p.description || ""
    }));

    renderProducts();
  } catch (err) {
    console.error("Could not load products from Supabase", err);
  }
}

function visibleProducts() {
  let list = products.filter(p => (activeCategory === "All" || p.category === activeCategory || (activeCategory === "Home & Kitchen" && p.category === "Storage & Organizers")) &&
    (p.name.toLowerCase().includes(searchTerm) || p.category.toLowerCase().includes(searchTerm)));
  const sort = $("#sortSelect").value;
  if (sort === "price-low") list.sort((a,b) => a.price-b.price);
  if (sort === "price-high") list.sort((a,b) => b.price-a.price);
  if (sort === "name") list.sort((a,b) => a.name.localeCompare(b.name));
  return list;
}
function renderProducts() {
  const list = visibleProducts();
  $("#activeFilter").textContent = activeCategory !== "All" ? `Showing: ${activeCategory}` : "";
  $("#noResults").hidden = list.length !== 0;
  productGrid.innerHTML = list.map(p => `
    <article class="product-card">
      <div class="product-image-wrap" data-detail="${normalizeId(p.id)}" tabindex="0" role="button" aria-label="View ${escapeHTML(p.name)}">
        <img src="${p.image}" alt="${escapeHTML(p.name)}" loading="lazy">
        <span class="discount-badge">${p.discount}% OFF</span>
        <button class="wish-button ${wishlist.includes(normalizeId(p.id))?"active":""}" data-wish="${normalizeId(p.id)}" aria-label="Toggle wishlist">${wishlist.includes(normalizeId(p.id))?"♥":"♡"}</button>
      </div>
      <div class="product-info">
        <h3 class="product-name" data-detail="${normalizeId(p.id)}">${escapeHTML(p.name)}</h3>
        <div class="rating"><span>★</span> ${p.rating} <span style="color:#697381">(${p.reviews})</span></div>
        <div class="price-line"><strong class="price">${money(p.price)}</strong><span class="old-price">${money(p.oldPrice)}</span></div>
        <button class="add-button" data-add="${normalizeId(p.id)}">🛒 &nbsp; Add to Cart</button>
      </div>
    </article>`).join("");
}
function saveCart() { safeStore("cartyfinds_cart", cart); renderCart(); }
function addToCart(id) {
  const itemId = normalizeId(id);
  const item = cart.find(row => normalizeId(row.id) === itemId);
  if (item) item.qty += 1; else cart.push({id:itemId,qty:1});
  saveCart();
  $("#cartCount").textContent = cart.reduce((sum,row) => sum + row.qty, 0);
}
function renderCart() {
  const count = cart.reduce((sum,row) => sum + row.qty, 0);
  $("#cartCount").textContent = count;
  const rows = cart.map(row => ({...row,product:products.find(p => normalizeId(p.id) === normalizeId(row.id))})).filter(row => row.product);
  if (!rows.length) $("#cartItems").innerHTML = '<div class="empty-cart"><div style="font-size:44px">🛒</div><h3>Your cart is empty</h3><p>Find something you love and add it here.</p></div>';
  else $("#cartItems").innerHTML = rows.map(row => `<div class="cart-row">
    <img src="${row.product.image}" alt="">
    <div><h3>${escapeHTML(row.product.name)}</h3><p>${money(row.product.price)}</p><div class="qty-controls"><button data-qty="${normalizeId(row.id)}" data-delta="-1" aria-label="Decrease quantity">−</button><span>${row.qty}</span><button data-qty="${normalizeId(row.id)}" data-delta="1" aria-label="Increase quantity">+</button></div><button class="remove-item" data-remove="${normalizeId(row.id)}">Remove</button></div>
    <b>${money(row.product.price * row.qty)}</b>
  </div>`).join("");
  const subtotal = rows.reduce((sum,row) => sum + row.product.price * row.qty, 0);
  $("#cartSubtotal").textContent = money(subtotal);
  $("#checkoutButton").disabled = !rows.length;
  $("#checkoutNote").textContent = WHATSAPP_NUMBER ? "Order details will open in WhatsApp for confirmation." : "Demo cart only. Set WHATSAPP_NUMBER in script.js to enable WhatsApp checkout.";
}
function openCart() { cartDrawer.classList.add("open");overlay.classList.add("open");cartDrawer.setAttribute("aria-hidden","false"); }
function closeCart() { cartDrawer.classList.remove("open");overlay.classList.remove("open");cartDrawer.setAttribute("aria-hidden","true"); }
function openProduct(id) {
  const itemId = normalizeId(id);
  const p = products.find(item => normalizeId(item.id) === itemId); if(!p) return;
  $("#productDetail").innerHTML = `<div class="detail-layout"><img src="${p.image}" alt="${escapeHTML(p.name)}"><div><p class="eyebrow">${escapeHTML(p.category)}</p><h2>${escapeHTML(p.name)}</h2><div class="rating"><span>★</span> ${p.rating} (${p.reviews}) <small>Sample rating</small></div><strong class="price">${money(p.price)}</strong> <span class="old-price">${money(p.oldPrice)}</span><p>${escapeHTML(p.description)}</p><p><small>Demo listing: verify all product details, ratings and pricing before publishing.</small></p><button class="primary-button" data-add="${normalizeId(p.id)}">Add to Cart</button></div></div>`;
  $("#productDialog").showModal();
}
function setCategory(category) {
  activeCategory = category;
  document.querySelectorAll(".category-tile").forEach(tile => tile.classList.toggle("selected", tile.dataset.categoryLink === category));
  renderProducts();
}
productGrid.addEventListener("click", e => {
  const add = e.target.closest("[data-add]");
  const wish = e.target.closest("[data-wish]");
  const detail = e.target.closest("[data-detail]");
  if (add) { addToCart(add.dataset.add); add.textContent = "✓ Added"; setTimeout(() => { if (add.isConnected) add.innerHTML = "🛒 &nbsp; Add to Cart"; }, 900); }
  if (wish) { const id = normalizeId(wish.dataset.wish); wishlist = wishlist.includes(id) ? wishlist.filter(x => x !== id) : [...wishlist, id]; safeStore("cartyfinds_wishlist", wishlist); renderProducts(); }
  if (detail && !wish) openProduct(detail.dataset.detail);
});
productGrid.addEventListener("keydown", e => { if ((e.key === "Enter" || e.key === " ") && e.target.matches("[data-detail]")) { e.preventDefault(); openProduct(e.target.dataset.detail); } });
$("#productDetail").addEventListener("click", e => { const add = e.target.closest("[data-add]"); if (add) { addToCart(add.dataset.add); $("#productDialog").close(); openCart(); } });
$("#cartItems").addEventListener("click", e => {
  const qty = e.target.closest("[data-qty]");
  const remove = e.target.closest("[data-remove]");
  if (qty) {
    const id = normalizeId(qty.dataset.qty);
    const row = cart.find(r => normalizeId(r.id) === id);
    if (row) {
      row.qty += Number(qty.dataset.delta);
      if (row.qty <= 0) cart = cart.filter(r => normalizeId(r.id) !== id);
      saveCart();
    }
  }
  if (remove) {
    const id = normalizeId(remove.dataset.remove);
    cart = cart.filter(r => normalizeId(r.id) !== id);
    saveCart();
  }
});
$("#cartButton").addEventListener("click", openCart); $("#closeCart").addEventListener("click", closeCart); overlay.addEventListener("click", closeCart);
$("#searchForm").addEventListener("submit", e => { e.preventDefault(); searchTerm = $("#searchInput").value.trim().toLowerCase(); renderProducts(); $("#products").scrollIntoView({behavior:"smooth"}); });
$("#searchInput").addEventListener("input", () => { searchTerm = $("#searchInput").value.trim().toLowerCase(); renderProducts(); });
$("#sortSelect").addEventListener("change", renderProducts);
document.querySelectorAll("[data-category-link]").forEach(link => link.addEventListener("click", e => { e.preventDefault(); setCategory(link.dataset.categoryLink); $("#products").scrollIntoView({behavior:"smooth"}); $(".dropdown-panel").classList.remove("open"); }));
$("#categoryMenu").addEventListener("click", () => $(".dropdown-panel").classList.toggle("open"));
$("#viewAll").addEventListener("click", () => setCategory("All"));
$("#menuToggle").addEventListener("click", () => { const nav = $("#mainNav"), open = nav.classList.toggle("open"); $("#menuToggle").setAttribute("aria-expanded", String(open)); });
$("#accountBtn").addEventListener("click", () => $("#accountDialog").showModal());
$("#closeAccountDialog").addEventListener("click", () => $("#accountDialog").close()); $("#accountOk").addEventListener("click", () => $("#accountDialog").close());
$("#closeProductDialog").addEventListener("click", () => $("#productDialog").close());
$("#newsletterForm").addEventListener("submit", e => { e.preventDefault(); const email = $("#emailInput").value.trim(); if (!email) return; $("#newsletterMessage").textContent = "Thanks! Newsletter signup UI is ready; connect an email service to store subscriptions."; $("#emailInput").value = ""; });

async function createOrderInSupabase(orderObj) {
  if (!supabase) return { error: "Supabase not configured" };
  try {
    const { data, error } = await supabase.from("orders").insert([orderObj]).select().single();
    return { data, error };
  } catch (err) {
    return { error: err };
  }
}

$("#checkoutButton").addEventListener("click", async () => {
  if (!cart.length) return;

  const rows = cart.map(row => {
    const p = products.find(x => normalizeId(x.id) === normalizeId(row.id));
    return { product_id: p ? normalizeId(p.id) : normalizeId(row.id), title: p ? p.name : "Item", qty: row.qty, unit_price: p ? p.price : 0, line_total: p ? p.price * row.qty : 0 };
  });
  const subtotal = rows.reduce((sum, row) => sum + row.line_total, 0);
  const total = subtotal;

  if (supabase) {
    const orderObj = {
      customer_name: "Guest",
      customer_email: "",
      customer_phone: "",
      shipping_address: {},
      items: rows,
      subtotal,
      shipping_fee: 0,
      total,
      payment_method: WHATSAPP_NUMBER ? "whatsapp" : "cod",
      payment_status: "pending",
      status: "new"
    };
    const { data, error } = await createOrderInSupabase(orderObj);
    if (error) {
      $("#checkoutNote").textContent = "Could not save order to Supabase: " + (error.message || error);
      console.error(error);
      return;
    }

    cart = [];
    saveCart();
    $("#checkoutNote").textContent = "Order saved to the admin dashboard. " + (data && data.order_number ? `Reference: ${data.order_number}` : "");
    if (WHATSAPP_NUMBER) {
      const message = `Hello CartyFinds! I would like to enquire about this order:\n${rows.map(r => `${r.title} x ${r.qty} = ${money(r.line_total)}`).join("\n")}\nSubtotal: ${money(total)}\nPlease confirm stock, shipping and final payment details.`;
      window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`, "_blank", "noopener");
    }
    return;
  }

  if (!WHATSAPP_NUMBER) { $("#checkoutNote").textContent = "Checkout is not configured yet. Add your WhatsApp number to script.js. No order has been placed."; return; }
  if (!/^\d{8,15}$/.test(WHATSAPP_NUMBER)) { alert("Please check the WhatsApp number in script.js. Use country code and digits only."); return; }
  const lines = cart.map(row => { const p = products.find(x => normalizeId(x.id) === normalizeId(row.id)); return `${p ? p.name : "Item"} x ${row.qty} = ${money((p ? p.price : 0) * row.qty)}`; });
  const message = `Hello CartyFinds! I would like to enquire about this order:\n${lines.join("\n")}\nSubtotal: ${money(total)}\nPlease confirm stock, shipping and final payment details.`;
  window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`, "_blank", "noopener");
});

// Meesho URL import helper: no automatic scraping; static sites cannot bypass marketplace CORS/permissions.
const IMPORT_KEY = "cartyfinds_import_drafts_v1";
let importedDrafts = JSON.parse(localStorage.getItem(IMPORT_KEY) || "[]");
function persistImportedDrafts(){ localStorage.setItem(IMPORT_KEY, JSON.stringify(importedDrafts)); }
function renderImportedDrafts(){
  const host = $("#importedDraftList"); if(!host) return;
  if(!importedDrafts.length){host.innerHTML='<p class="empty-drafts">No imported drafts yet.</p>';return;}
  host.innerHTML = importedDrafts.map((p,i) => `<article class="draft-row"><div><b>${escapeHTML(p.name)}</b><small>${escapeHTML(p.category)} · ${money(p.price)}${p.stock === "" ? " · Stock unknown" : ` · Stock: ${escapeHTML(p.stock)}`}</small><small><a href="${escapeHTML(p.sourceUrl)}" target="_blank" rel="noopener noreferrer">Open source listing ↗</a></small></div><button type="button" data-remove-draft="${i}" class="secondary-button">Remove</button></article>`).join("");
}
const importForm = $("#meeshoImportForm");
if(importForm){
  importForm.addEventListener("submit", e => {
    e.preventDefault();
    const input = $("#meeshoUrl"), status = $("#importStatus");
    try {
      const u = new URL(input.value.trim());
      if (u.protocol !== "https:" || !/(^|\.)meesho\.com$/i.test(u.hostname) || !/\/p\//.test(u.pathname)) throw new Error("Enter a valid public https://www.meesho.com/.../p/... product URL.");
      status.textContent = "URL format looks valid. Product details were not fetched automatically; please enter and verify the fields below.";
      status.classList.add("success-status");
    } catch(err) { status.textContent = err.message || "Please enter a valid Meesho product URL."; status.classList.remove("success-status"); }
  });
  $("#saveImportedProduct").addEventListener("click", () => {
    const status = $("#saveImportStatus");
    const url = $("#meeshoUrl").value.trim();
    let parsed; try { parsed = new URL(url); } catch { status.textContent = "First enter a valid Meesho product URL and press Check URL."; return; }
    if (parsed.protocol !== "https:" || !/(^|\.)meesho\.com$/i.test(parsed.hostname) || !/\/p\//.test(parsed.pathname)) { status.textContent = "Please use a public Meesho product-page URL."; return; }
    const name = $("#importName").value.trim();
    const category = $("#importCategory").value;
    const cost = Number($("#importCost").value);
    const price = Number($("#importPrice").value);
    const description = $("#importDescription").value.trim();
    const imageUrl = $("#importImage").value.trim();
    if (!name || !description || !Number.isFinite(cost) || cost <= 0 || !Number.isFinite(price) || price <= 0) { status.textContent = "Complete all required fields with valid positive prices."; return; }
    if (imageUrl && !$("#imagePermission").checked) { status.textContent = "Confirm permission to use the image, or remove the image URL."; return; }
    if (imageUrl) { try { const im = new URL(imageUrl); if (im.protocol !== "https:") throw 0; } catch { status.textContent = "Image URL must be a valid HTTPS URL."; return; } }
    const stockValue = $("#importStock").value;
    const draft = {id: Date.now(), name, category, cost, price, profitEstimate: price - cost, description, sourceUrl: parsed.href, imageUrl, variants: $("#importVariants").value.trim(), stock: stockValue, createdAt: new Date().toISOString()};
    importedDrafts.unshift(draft);
    try { persistImportedDrafts(); renderImportedDrafts(); status.textContent = `Saved “${name}” as a local draft. It has not been published to the live shop.`; importForm.reset(); $("#importStatus").textContent = "Paste another public Meesho product URL."; $("#importStatus").classList.remove("success-status"); }
    catch { importedDrafts.shift(); status.textContent = "Could not save: browser storage may be full or disabled."; }
  });
  $("#importedDraftList").addEventListener("click", e => { const b = e.target.closest("[data-remove-draft]"); if (!b) return; importedDrafts.splice(Number(b.dataset.removeDraft), 1); persistImportedDrafts(); renderImportedDrafts(); });
  $("#exportImportedProducts").addEventListener("click", () => { const blob = new Blob([JSON.stringify(importedDrafts, null, 2)], { type: "application/json" }); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = "cartyfinds-meesho-product-drafts.json"; a.click(); URL.revokeObjectURL(url); });
  renderImportedDrafts();
}

$("#year").textContent = new Date().getFullYear();
renderProducts();
renderCart();
loadProductsFromSupabase();
