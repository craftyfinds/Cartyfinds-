// CartyFinds_ storefront starter. Replace sample catalog and WhatsApp number before launch.
const WHATSAPP_NUMBER = ""; // Example: "919876543210" (country code + number, digits only)

const products = [
  {id:1,name:"2 in 1 Manual Hand Juicer",category:"Home & Kitchen",price:299,oldPrice:499,discount:40,rating:"4.3",reviews:"2.4K",image:"images/hand-juicer.svg",description:"A compact manual citrus juicer for everyday kitchen use. Sample product content—replace with verified supplier details."},
  {id:2,name:"Dish Soap Dispenser + Sponge Holder",category:"Home & Kitchen",price:299,oldPrice:459,discount:35,rating:"4.2",reviews:"1.8K",image:"images/soap-holder.svg",description:"Keep your sink area neat with a handy soap and sponge organizer. Sample product content—verify specifications before listing."},
  {id:3,name:"LPG Cylinder Trolley",category:"Home & Kitchen",price:399,oldPrice:699,discount:45,rating:"4.0",reviews:"1.2K",image:"images/cylinder-trolley.svg",description:"A rolling trolley concept for moving household cylinders. Check weight rating and safety information with your supplier."},
  {id:4,name:"Multi Layer Storage Box",category:"Storage & Organizers",price:349,oldPrice:499,discount:30,rating:"4.4",reviews:"3.1K",image:"images/storage-organizer.svg",description:"Multi-level storage for household items. Sample listing; replace measurements, material, and price with actual details."},
  {id:5,name:"Adjustable Mobile Phone Stand",category:"Mobile Accessories",price:149,oldPrice:249,discount:40,rating:"4.1",reviews:"860",image:"images/phone-stand.svg",description:"A compact stand concept for hands-free viewing. Confirm compatibility and materials before publishing."},
  {id:6,name:"Everyday Gadget Organizer",category:"Electronics",price:249,oldPrice:399,discount:38,rating:"4.2",reviews:"720",image:"images/gadget-organizer.svg",description:"An organizer for small everyday accessories. Sample listing; replace with your actual supplier information."},
  {id:7,name:"Beauty Essentials Organizer",category:"Beauty & Personal Care",price:329,oldPrice:499,discount:34,rating:"4.4",reviews:"1.1K",image:"images/beauty-organizer.svg",description:"A countertop organizer concept for beauty and personal care items. Verify actual dimensions and product contents."},
  {id:8,name:"Travel Pouch Set",category:"Fashion & Accessories",price:199,oldPrice:299,discount:33,rating:"4.0",reviews:"540",image:"images/travel-pouch.svg",description:"Reusable pouches for organizing travel essentials. Replace the sample image and details with actual product data."}
];

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
let cart = readStoredArray("cartyfinds_cart").filter(row => row && Number.isInteger(Number(row.id)) && Number(row.qty) > 0).map(row => ({id:Number(row.id),qty:Number(row.qty)}));
let wishlist = readStoredArray("cartyfinds_wishlist").map(Number).filter(Number.isFinite);

function money(amount) { return "₹" + Number(amount).toLocaleString("en-IN"); }
function escapeHTML(value) { return String(value).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])); }

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
      <div class="product-image-wrap" data-detail="${p.id}" tabindex="0" role="button" aria-label="View ${escapeHTML(p.name)}">
        <img src="${p.image}" alt="${escapeHTML(p.name)}" loading="lazy">
        <span class="discount-badge">${p.discount}% OFF</span>
        <button class="wish-button ${wishlist.includes(p.id)?"active":""}" data-wish="${p.id}" aria-label="Toggle wishlist">${wishlist.includes(p.id)?"♥":"♡"}</button>
      </div>
      <div class="product-info">
        <h3 class="product-name" data-detail="${p.id}">${escapeHTML(p.name)}</h3>
        <div class="rating"><span>★</span> ${p.rating} <span style="color:#697381">(${p.reviews})</span></div>
        <div class="price-line"><strong class="price">${money(p.price)}</strong><span class="old-price">${money(p.oldPrice)}</span></div>
        <button class="add-button" data-add="${p.id}">🛒 &nbsp; Add to Cart</button>
      </div>
    </article>`).join("");
}
function saveCart() { safeStore("cartyfinds_cart", cart); renderCart(); }
function addToCart(id) {
  const item = cart.find(row => row.id === id);
  if (item) item.qty += 1; else cart.push({id,qty:1});
  saveCart();
  $("#cartCount").textContent = cart.reduce((sum,row) => sum+row.qty,0);
}
function renderCart() {
  const count = cart.reduce((sum,row) => sum+row.qty,0);
  $("#cartCount").textContent = count;
  const rows = cart.map(row => ({...row,product:products.find(p=>p.id===row.id)})).filter(row=>row.product);
  if (!rows.length) $("#cartItems").innerHTML = '<div class="empty-cart"><div style="font-size:44px">🛒</div><h3>Your cart is empty</h3><p>Find something you love and add it here.</p></div>';
  else $("#cartItems").innerHTML = rows.map(row=>`<div class="cart-row">
    <img src="${row.product.image}" alt="">
    <div><h3>${escapeHTML(row.product.name)}</h3><p>${money(row.product.price)}</p><div class="qty-controls"><button data-qty="${row.id}" data-delta="-1" aria-label="Decrease quantity">−</button><span>${row.qty}</span><button data-qty="${row.id}" data-delta="1" aria-label="Increase quantity">+</button></div><button class="remove-item" data-remove="${row.id}">Remove</button></div>
    <b>${money(row.product.price*row.qty)}</b>
  </div>`).join("");
  const subtotal = rows.reduce((sum,row)=>sum+row.product.price*row.qty,0);
  $("#cartSubtotal").textContent = money(subtotal);
  $("#checkoutButton").disabled = !rows.length;
  $("#checkoutNote").textContent = WHATSAPP_NUMBER ? "Order details will open in WhatsApp for confirmation." : "Demo cart only. Set WHATSAPP_NUMBER in script.js to enable WhatsApp checkout.";
}
function openCart() { cartDrawer.classList.add("open");overlay.classList.add("open");cartDrawer.setAttribute("aria-hidden","false"); }
function closeCart() { cartDrawer.classList.remove("open");overlay.classList.remove("open");cartDrawer.setAttribute("aria-hidden","true"); }
function openProduct(id) {
  const p=products.find(item=>item.id===id); if(!p)return;
  $("#productDetail").innerHTML=`<div class="detail-layout"><img src="${p.image}" alt="${escapeHTML(p.name)}"><div><p class="eyebrow">${escapeHTML(p.category)}</p><h2>${escapeHTML(p.name)}</h2><div class="rating"><span>★</span> ${p.rating} (${p.reviews}) <small>Sample rating</small></div><strong class="price">${money(p.price)}</strong> <span class="old-price">${money(p.oldPrice)}</span><p>${escapeHTML(p.description)}</p><p><small>Demo listing: verify all product details, ratings and pricing before publishing.</small></p><button class="primary-button" data-add="${p.id}">Add to Cart</button></div></div>`;
  $("#productDialog").showModal();
}
function setCategory(category) {
  activeCategory = category;
  document.querySelectorAll(".category-tile").forEach(tile=>tile.classList.toggle("selected",tile.dataset.categoryLink===category));
  renderProducts();
}
productGrid.addEventListener("click",e=>{
  const add=e.target.closest("[data-add]");const wish=e.target.closest("[data-wish]");const detail=e.target.closest("[data-detail]");
  if(add){addToCart(Number(add.dataset.add));add.textContent="✓ Added";setTimeout(()=>{if(add.isConnected)add.innerHTML="🛒 &nbsp; Add to Cart";},900);}
  if(wish){const id=Number(wish.dataset.wish);wishlist=wishlist.includes(id)?wishlist.filter(x=>x!==id):[...wishlist,id];safeStore("cartyfinds_wishlist",wishlist);renderProducts();}
  if(detail&&!wish)openProduct(Number(detail.dataset.detail));
});
productGrid.addEventListener("keydown",e=>{if((e.key==="Enter"||e.key===" ")&&e.target.matches("[data-detail]")){e.preventDefault();openProduct(Number(e.target.dataset.detail));}});
$("#productDetail").addEventListener("click",e=>{const add=e.target.closest("[data-add]");if(add){addToCart(Number(add.dataset.add));$("#productDialog").close();openCart();}});
$("#cartItems").addEventListener("click",e=>{
  const qty=e.target.closest("[data-qty]");const remove=e.target.closest("[data-remove]");
  if(qty){const id=Number(qty.dataset.qty),row=cart.find(r=>r.id===id);if(row){row.qty+=Number(qty.dataset.delta);if(row.qty<=0)cart=cart.filter(r=>r.id!==id);saveCart();}}
  if(remove){cart=cart.filter(r=>r.id!==Number(remove.dataset.remove));saveCart();}
});
$("#cartButton").addEventListener("click",openCart);$("#closeCart").addEventListener("click",closeCart);overlay.addEventListener("click",closeCart);
$("#searchForm").addEventListener("submit",e=>{e.preventDefault();searchTerm=$("#searchInput").value.trim().toLowerCase();renderProducts();$("#products").scrollIntoView({behavior:"smooth"});});
$("#searchInput").addEventListener("input",()=>{searchTerm=$("#searchInput").value.trim().toLowerCase();renderProducts();});
$("#sortSelect").addEventListener("change",renderProducts);
document.querySelectorAll("[data-category-link]").forEach(link=>link.addEventListener("click",e=>{e.preventDefault();setCategory(link.dataset.categoryLink);$("#products").scrollIntoView({behavior:"smooth"});$(".dropdown-panel").classList.remove("open");}));
$("#categoryMenu").addEventListener("click",()=>$(".dropdown-panel").classList.toggle("open"));
$("#viewAll").addEventListener("click",()=>setCategory("All"));
$("#menuToggle").addEventListener("click",()=>{const nav=$("#mainNav"),open=nav.classList.toggle("open");$("#menuToggle").setAttribute("aria-expanded",String(open));});
$("#accountBtn").addEventListener("click",()=>$("#accountDialog").showModal());
$("#closeAccountDialog").addEventListener("click",()=>$("#accountDialog").close());$("#accountOk").addEventListener("click",()=>$("#accountDialog").close());
$("#closeProductDialog").addEventListener("click",()=>$("#productDialog").close());
$("#newsletterForm").addEventListener("submit",e=>{e.preventDefault();const email=$("#emailInput").value.trim();if(!email)return;$("#newsletterMessage").textContent="Thanks! Newsletter signup UI is ready; connect an email service to store subscriptions.";$("#emailInput").value="";});
$("#checkoutButton").addEventListener("click",()=>{
  if(!cart.length)return;
  if(!WHATSAPP_NUMBER){$("#checkoutNote").textContent="Checkout is not configured yet. Add your WhatsApp number to script.js. No order has been placed.";return;}
  if(!/^\d{8,15}$/.test(WHATSAPP_NUMBER)){alert("Please check the WhatsApp number in script.js. Use country code and digits only.");return;}
  const lines=cart.map(row=>{const p=products.find(x=>x.id===row.id);return `${p.name} x ${row.qty} = ${money(p.price*row.qty)}`;});
  const total=cart.reduce((sum,row)=>sum+products.find(p=>p.id===row.id).price*row.qty,0);
  const message=`Hello CartyFinds! I would like to enquire about this order:\n${lines.join("\n")}\nSubtotal: ${money(total)}\nPlease confirm stock, shipping and final payment details.`;
  window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`,"_blank","noopener");
});
$("#year").textContent=new Date().getFullYear();
renderProducts();renderCart();
