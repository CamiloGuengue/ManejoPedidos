// Datos mockeados (persisten en localStorage)
let users = JSON.parse(localStorage.getItem('users')) || [
  { id: 1, name: 'Juan Pérez', email: 'juan@email.com', role: 'user', pass: '123' },
  { id: 2, name: 'Admin', email: 'admin@email.com', role: 'admin', pass: 'admin' }
];

let menu = JSON.parse(localStorage.getItem('menu')) || [
  { id: 1, name: 'Hamburguesa', price: 15, category: 'Principal' },
  { id: 2, name: 'Pizza', price: 20, category: 'Principal' },
  { id: 3, name: 'Ensalada', price: 8, category: 'Entrada' },
  { id: 4, name: 'Coca Cola', price: 3, category: 'Bebida' }
];

let orders = JSON.parse(localStorage.getItem('orders')) || [];
let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
let cart = [];

// Guardar en localStorage
function saveData() {
  localStorage.setItem('users', JSON.stringify(users));
  localStorage.setItem('menu', JSON.stringify(menu));
  localStorage.setItem('orders', JSON.stringify(orders));
  if (currentUser) localStorage.setItem('currentUser', JSON.stringify(currentUser));
}

// Render Navbar dinámico
function renderNavbar() {
  const navLinks = document.getElementById('navLinks');
  navLinks.innerHTML = '';
  if (!currentUser) return;

  const links = currentUser.role === 'admin' 
    ? ['Menú', 'Mis Pedidos', 'Admin Panel', 'Perfil', 'Logout']
    : ['Menú', 'Mis Pedidos', 'Perfil', 'Logout'];

  links.forEach(link => {
    const a = document.createElement('a');
    a.className = 'nav-link';
    a.textContent = link;
    a.href = '#';
    a.onclick = () => showView(link.replace(' ', '').toLowerCase());
    navLinks.appendChild(a);
  });
}

// Mostrar vistas por rol
function showView(view) {
  const main = document.getElementById('mainContent');
  main.innerHTML = '';

  switch (view) {
    case 'menú':
      renderMenu();
      break;
    case 'mypedidos':
    case 'adminpanel':
      renderOrders(view === 'adminpanel');
      break;
    case 'perfil':
      renderProfile();
      break;
    case 'logout':
      logout();
      break;
  }
  renderNavbar();
}

// Login
document.getElementById('loginBtn').addEventListener('click', () => {
  const email = document.getElementById('loginEmail').value;
  const pass = document.getElementById('loginPass').value;
  const user = users.find(u => u.email === email && u.pass === pass);
  if (user) {
    currentUser = user;
    saveData();
    showView('menú');
  } else {
    alert('Credenciales inválidas. Prueba: juan@email.com/123 o admin@email.com/admin');
  }
});

// Render Menú + Carrito
function renderMenu() {
  const main = document.getElementById('mainContent');
  main.innerHTML = `
    <h2>🍔 Menú del Restaurante</h2>
    <div class="row" id="menuList"></div>
    ${currentUser.role !== 'admin' ? '<button class="btn btn-success mt-3" data-bs-toggle="modal" data-bs-target="#orderModal">🛒 Ver Carrito</button>' : ''}
  `;
  const menuList = document.getElementById('menuList');
  menu.filter(item => !cart.some(c => c.id === item.id)).forEach(item => {  // Solo no agregados
    const col = document.createElement('div');
    col.className = 'col-md-4 mb-4';
    col.innerHTML = `
      <div class="card product-card">
        <div class="card-body">
          <h5>${item.name}</h5>
          <p>${item.category} - $${item.price}</p>
          ${currentUser.role !== 'admin' ? `<button class="btn btn-primary add-to-cart" data-id="${item.id}">Agregar</button>` : ''}
        </div>
      </div>
    `;
    menuList.appendChild(col);
  });

  // Event listeners agregar
  document.querySelectorAll('.add-to-cart').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = parseInt(e.target.dataset.id);
      const item = menu.find(m => m.id === id);
      cart.push({ ...item, qty: 1 });
      updateCartUI();
      e.target.textContent = '✓ Agregado';
    });
  });
}

// Actualizar Carrito UI
function updateCartUI() {
  document.getElementById('cartItems').innerHTML = cart.map(item => 
    `<div>${item.name} x${item.qty} - $${item.price * item.qty}</div>`
  ).join('');
  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  document.getElementById('cartTotal').textContent = `$${total}`;
}

// Confirmar Pedido
document.getElementById('confirmOrder').addEventListener('click', () => {
  if (cart.length === 0) return alert('Carrito vacío');
  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const order = {
    id: Date.now(),
    userId: currentUser.id,
    items: [...cart],
    total,
    status: 'pendiente',
    createdAt: new Date().toISOString()
  };
  orders.push(order);
  saveData();
  cart = [];
  bootstrap.Modal.getInstance(document.getElementById('orderModal')).hide();
  alert('Pedido creado!');
  showView('mypedidos');
});

// Render Pedidos (user o admin)
function renderOrders(isAdmin = false) {
  const userOrders = isAdmin ? orders : orders.filter(o => o.userId === currentUser.id);
  const main = document.getElementById('mainContent');
  main.innerHTML = `<h2>${isAdmin ? '📋 Todos los Pedidos' : '📦 Mis Pedidos'}</h2>
    <div class="row" id="ordersList">
      ${userOrders.map(order => `
        <div class="col-md-6 mb-3">
          <div class="card">
            <div class="card-header d-flex justify-content-between">
              Pedido #${order.id} 
              <span class="badge badge-status status-${order.status}">${order.status.toUpperCase()}</span>
            </div>
            <div class="card-body">
              <p>Items: ${order.items.map(i => i.name).join(', ')}</p>
              <p>Total: $${order.total}</p>
              <small>${new Date(order.createdAt).toLocaleString()}</small>
              ${isAdmin ? `<button class="btn btn-sm btn-warning mt-2 change-status" data-id="${order.id}">Cambiar Estado</button>` : ''}
            </div>
          </div>
        </div>
      `).join('')}
    </div>`;

  if (isAdmin) {
    document.querySelectorAll('.change-status').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = parseInt(e.target.dataset.id);
        const order = orders.find(o => o.id === id);
        const statuses = ['pendiente', 'preparando', 'listos', 'entregado'];
        const currentIdx = statuses.indexOf(order.status);
        order.status = statuses[(currentIdx + 1) % statuses.length];
        saveData();
        showView('adminpanel');
      });
    });
  }
}

// Perfil
function renderProfile() {
  const totalSpent = orders.filter(o => o.userId === currentUser.id)
    .reduce((sum, o) => sum + o.total, 0);
  const orderCount = orders.filter(o => o.userId === currentUser.id).length;
  document.getElementById('mainContent').innerHTML = `
    <div class="card shadow">
      <div class="card-body text-center">
        <h2>👤 ${currentUser.name}</h2>
        <p>Email: ${currentUser.email}</p>
        <span class="badge bg-${currentUser.role === 'admin' ? 'danger' : 'primary'}">${currentUser.role.toUpperCase()}</span>
        <hr>
        <p>Pedidos realizados: ${orderCount}</p>
        <p>Total gastado: $${totalSpent}</p>
      </div>
    </div>
  `;
}

// Logout
function logout() {
  currentUser = null;
  localStorage.removeItem('currentUser');
  document.getElementById('mainContent').innerHTML = document.getElementById('loginView').outerHTML;
  document.getElementById('loginView').remove();
}

// Init
if (currentUser) {
  showView('menú');
} else {
  renderNavbar();
}
