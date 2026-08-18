let currentRole = 'customer';
let products = [];
let searchQuery = "";

// Initialize application state from localStorage or initial data
window.onload = () => {
  const savedData = localStorage.getItem('alfa_rope_inventory');
  products = savedData ? JSON.parse(savedData) : INITIAL_PRODUCTS;
  
  // Inject company information into header
  document.getElementById('companyName').innerText = COMPANY_CONFIG.name;
  document.getElementById('companyDetails').innerText = 
    `${COMPANY_CONFIG.address} | Call: ${COMPANY_CONFIG.phone} | Instagram: @${COMPANY_CONFIG.instagram}`;
  
  renderApp();
};

function saveState() {
  localStorage.setItem('alfa_rope_inventory', JSON.stringify(products));
  renderApp();
}

function switchRole(role) {
  currentRole = role;
  renderApp();
}

function handleSearch() {
  searchQuery = document.getElementById('searchInput').value.toLowerCase();
  renderApp();
}

function renderApp() {
  const metricsSection = document.getElementById('metricsSection');
  const addItemBtn = document.getElementById('addItemBtn');
  const customerView = document.getElementById('customerView');
  const adminView = document.getElementById('adminView');

  // Filter products by search query
  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery) ||
    p.category.toLowerCase().includes(searchQuery) ||
    p.diameter.toLowerCase().includes(searchQuery)
  );

  // Role permissions
  if (currentRole === 'customer') {
    metricsSection.style.display = 'none';
    addItemBtn.style.display = 'none';
    customerView.style.display = 'grid';
    adminView.style.display = 'none';
    renderCustomerGrid(filteredProducts);
  } else {
    metricsSection.style.display = 'grid';
    addItemBtn.style.display = 'block';
    customerView.style.display = 'none';
    adminView.style.display = 'block';
    renderMetrics();
    renderAdminTable(filteredProducts);
  }
}

// Storefront cards for Customers
function renderCustomerGrid(items) {
  const container = document.getElementById('customerView');
  if (items.length === 0) {
    container.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: var(--text-muted);">No products match your search.</p>`;
    return;
  }
  container.innerHTML = items.map(p => `
    <div class="product-card">
      <img src="${p.image}" alt="${p.name}" onerror="this.src='https://via.placeholder.com/300x200?text=Alfa+Ropes'">
      <div class="product-body">
        <div>
          <span class="badge">${p.category} (${p.diameter})</span>
          <h3 style="font-size: 1.1rem; margin-bottom: 0.5rem;">${p.name}</h3>
          <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 1rem;">${p.description}</p>
        </div>
        <div>
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 0.8rem;">
            <strong style="font-size: 1.3rem; color: var(--primary);">${COMPANY_CONFIG.currency}${p.price} <span style="font-size:0.8rem; color:var(--text-muted);">/ ${p.unit}</span></strong>
            <span class="stock-tag ${p.quantity > 50 ? 'in-stock' : 'low-stock'}">${p.quantity > 0 ? `In Stock (${p.quantity})` : 'Out of Stock'}</span>
          </div>
          <button class="btn" style="width:100%;" onclick="orderViaWhatsApp('${p.name}', '${p.diameter}')">Enquire on WhatsApp</button>
        </div>
      </div>
    </div>
  `).join('');
}

// Table view for Admin and Owner
function renderAdminTable(items) {
  const tbody = document.getElementById('adminTableBody');
  tbody.innerHTML = items.map(p => `
    <tr>
      <td><img src="${p.image}" class="table-img" onerror="this.src='https://via.placeholder.com/48?text=Rope'"></td>
      <td><strong>${p.name}</strong><br><small style="color:var(--text-muted);">${p.diameter}</small></td>
      <td><span class="badge">${p.category}</span></td>
      <td>
        <input type="number" min="0" value="${p.quantity}" style="width: 80px; padding: 4px;" onchange="inlineUpdateStock('${p.id}', this.value)">
      </td>
      <td>
        <input type="number" min="1" step="0.5" value="${p.price}" style="width: 80px; padding: 4px;" onchange="inlineUpdatePrice('${p.id}', this.value)">
      </td>
      <td>
        <button class="btn btn-secondary" style="padding: 4px 8px; font-size: 0.8rem;" onclick="editProduct('${p.id}')">Edit</button>
        <button class="btn btn-danger" style="padding: 4px 8px; font-size: 0.8rem;" onclick="deleteProduct('${p.id}')">Delete</button>
      </td>
    </tr>
  `).join('');
}

// Metrics computation
function renderMetrics() {
  const container = document.getElementById('metricsSection');
  const totalItems = products.length;
  const totalStockUnits = products.reduce((sum, p) => sum + Number(p.quantity), 0);
  const inventoryValuation = products.reduce((sum, p) => sum + (Number(p.quantity) * Number(p.price)), 0);

  let html = `
    <div class="metric-card">
      <h4>Catalog Items</h4>
      <div class="value">${totalItems}</div>
    </div>
    <div class="metric-card">
      <h4>Total Stock Units</h4>
      <div class="value">${totalStockUnits.toLocaleString()}</div>
    </div>
  `;

  // Owner gets access to business valuation and margins
  if (currentRole === 'owner') {
    html += `
      <div class="metric-card">
        <h4>Total Inventory Value</h4>
        <div class="value" style="color: var(--primary);">${COMPANY_CONFIG.currency}${inventoryValuation.toLocaleString()}</div>
      </div>
      <div class="metric-card">
        <h4>Owner Status</h4>
        <div class="value" style="color: var(--success); font-size: 1.1rem; padding-top: 0.5rem;">Master Privileges Active</div>
      </div>
    `;
  }
  container.innerHTML = html;
}

// Direct quick update helpers
function inlineUpdateStock(id, newQty) {
  const p = products.find(i => i.id === id);
  if (p) { p.quantity = parseInt(newQty) || 0; saveState(); }
}

function inlineUpdatePrice(id, newPrice) {
  const p = products.find(i => i.id === id);
  if (p) { p.price = parseFloat(newPrice) || 0; saveState(); }
}

// Photo file processing
function handleImageFile(input) {
  const file = input.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      document.getElementById('productImageBase64').value = e.target.result;
    };
    reader.readAsDataURL(file);
  }
}

// Modal Handlers
function openProductModal() {
  document.getElementById('productForm').reset();
  document.getElementById('productId').value = '';
  document.getElementById('productImageBase64').value = '';
  document.getElementById('modalTitle').innerText = 'Add New Rope Item';
  document.getElementById('productModal').style.display = 'flex';
}

function closeProductModal() {
  document.getElementById('productModal').style.display = 'none';
}

function editProduct(id) {
  const p = products.find(i => i.id === id);
  if (!p) return;
  
  document.getElementById('productId').value = p.id;
  document.getElementById('productName').value = p.name;
  document.getElementById('productCategory').value = p.category;
  document.getElementById('productDiameter').value = p.diameter;
  document.getElementById('productPrice').value = p.price;
  document.getElementById('productQty').value = p.quantity;
  document.getElementById('productDesc').value = p.description;
  document.getElementById('productImageBase64').value = p.image;
  
  document.getElementById('modalTitle').innerText = 'Edit Product Details';
  document.getElementById('productModal').style.display = 'flex';
}

function saveProduct(e) {
  e.preventDefault();
  const id = document.getElementById('productId').value;
  const imageVal = document.getElementById('productImageBase64').value || 'https://via.placeholder.com/300x200?text=Alfa+Ropes';

  const productData = {
    id: id || 'ALFA-' + Date.now().toString().slice(-4),
    name: document.getElementById('productName').value,
    category: document.getElementById('productCategory').value,
    diameter: document.getElementById('productDiameter').value,
    price: parseFloat(document.getElementById('productPrice').value),
    unit: 'Kg',
    quantity: parseInt(document.getElementById('productQty').value),
    description: document.getElementById('productDesc').value,
    image: imageVal
  };

  if (id) {
    const index = products.findIndex(p => p.id === id);
    products[index] = productData;
  } else {
    products.push(productData);
  }

  saveState();
  closeProductModal();
}

function deleteProduct(id) {
  if (confirm("Are you sure you want to remove this product from inventory?")) {
    products = products.filter(p => p.id !== id);
    saveState();
  }
}

function orderViaWhatsApp(name, diameter) {
  const msg = encodeURIComponent(`Hello Alfa Rope Suppliers, I am interested in placing an order for: ${name} (${diameter}). Please share available stock and bulk quotes.`);
  window.open(`https://wa.me/918555838852?text=${msg}`, '_blank');
}
