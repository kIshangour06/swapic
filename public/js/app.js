// ===== GLOBAL STATE =====
const API = '/api';
let state = {
  user: null,
  token: null,
  socket: null,
  currentPage: 'home',
  currentConversation: null,
  notifications: [],
  searchTimer: null,
  currentItemPage: 1,
  currentListingType: 'all',
  allItems: []
};

// ===== INIT =====
document.addEventListener('DOMContentLoaded', async () => {
  const savedToken = localStorage.getItem('barter_token');
  if (savedToken) {
    state.token = savedToken;
    await fetchCurrentUser();
  }
  showPage('home');
  loadHomeItems();
});

// ===== SOCKET.IO =====
function initSocket() {
  if (state.socket) return;
  state.socket = io({ auth: { token: state.token } });

  state.socket.on('connect', () => console.log('Socket connected'));
  state.socket.on('notification', (notif) => {
    state.notifications.unshift(notif);
    updateNotifBadge(state.notifications.filter(n => !n.read).length);
    showToast(notif.title, notif.message.substring(0, 60), 'info');
  });
  state.socket.on('new_message', ({ message, conversationId }) => {
    if (state.currentConversation === conversationId) {
      appendMessage(message, false);
    }
    fetchUnreadCount();
  });
  state.socket.on('user_online', ({ userId }) => updateUserOnlineStatus(userId, true));
  state.socket.on('user_offline', ({ userId }) => updateUserOnlineStatus(userId, false));
  state.socket.on('typing', ({ username, isTyping, conversationId }) => {
    if (state.currentConversation === conversationId) {
      const el = document.getElementById('typing-indicator');
      if (el) el.textContent = isTyping ? `${username} is typing...` : '';
    }
  });
}

// ===== AUTH =====
function switchAuthTab(tab) {
  const loginTab = document.getElementById('tab-auth-login');
  const regTab = document.getElementById('tab-auth-register');
  const loginView = document.getElementById('view-auth-login');
  const regView = document.getElementById('view-auth-register');

  if (tab === 'register') {
    loginTab?.classList.remove('active');
    regTab?.classList.add('active');
    loginView?.classList.add('hidden');
    regView?.classList.remove('hidden');
  } else {
    regTab?.classList.remove('active');
    loginTab?.classList.add('active');
    regView?.classList.add('hidden');
    loginView?.classList.remove('hidden');
  }
}

async function handleDedicatedLogin(e) {
  e.preventDefault();
  const btn = document.getElementById('dedicated-login-btn');
  btn.textContent = 'Connecting...'; btn.disabled = true;
  const email = document.getElementById('dedicated-login-email').value;
  const password = document.getElementById('dedicated-login-password').value;

  const res = await apiCall('POST', '/auth/login', { email, password });
  btn.textContent = 'Sign In to BarterHub'; btn.disabled = false;
  if (res.success) {
    state.token = res.token;
    state.user = res.user;
    localStorage.setItem('barter_token', res.token);
    updateUI();
    initSocket();
    fetchNotifications();
    fetchUnreadCount();
    showToast('Welcome back!', `Hello ${res.user.username} 👋`, 'success');
    document.getElementById('dedicated-login-form').reset();
    showPage('home');
    setTimeout(() => showServiceIntentModal(), 400);
  } else {
    showToast('Login failed', res.message, 'error');
  }
}

async function handleDedicatedRegister(e) {
  e.preventDefault();
  const btn = document.getElementById('dedicated-reg-btn');
  btn.textContent = 'Creating account...'; btn.disabled = true;
  const data = {
    username: document.getElementById('dedicated-reg-username').value,
    email: document.getElementById('dedicated-reg-email').value,
    password: document.getElementById('dedicated-reg-password').value,
    location: document.getElementById('dedicated-reg-location').value
  };

  const res = await apiCall('POST', '/auth/register', data);
  btn.textContent = 'Create Free Account'; btn.disabled = false;
  if (res.success) {
    state.token = res.token;
    state.user = res.user;
    localStorage.setItem('barter_token', res.token);
    updateUI();
    initSocket();
    showToast('Welcome to BarterHub Europa!', `Account created for ${res.user.username} 🎉`, 'success');
    document.getElementById('dedicated-register-form').reset();
    showPage('home');
    setTimeout(() => showServiceIntentModal(), 400);
  } else {
    const msg = res.errors ? res.errors.map(err => err.msg).join(', ') : res.message;
    showToast('Registration failed', msg, 'error');
  }
}

async function login(e) {
  e.preventDefault();
  const btn = document.getElementById('login-btn');
  btn.textContent = 'Signing in...'; btn.disabled = true;
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;

  const res = await apiCall('POST', '/auth/login', { email, password });
  btn.textContent = 'Sign In'; btn.disabled = false;
  if (res.success) {
    state.token = res.token;
    state.user = res.user;
    localStorage.setItem('barter_token', res.token);
    hideModal('login-modal');
    updateUI();
    initSocket();
    fetchNotifications();
    fetchUnreadCount();
    showToast('Welcome back!', `Hello ${res.user.username} 👋`, 'success');
    document.getElementById('login-form').reset();
    setTimeout(() => showServiceIntentModal(), 400);
  } else {
    showToast('Login failed', res.message, 'error');
  }
}

async function register(e) {
  e.preventDefault();
  const btn = document.getElementById('register-btn');
  btn.textContent = 'Creating account...'; btn.disabled = true;
  const data = {
    username: document.getElementById('reg-username').value,
    email: document.getElementById('reg-email').value,
    password: document.getElementById('reg-password').value,
    location: document.getElementById('reg-location').value
  };

  const res = await apiCall('POST', '/auth/register', data);
  btn.textContent = 'Create Account'; btn.disabled = false;
  if (res.success) {
    state.token = res.token;
    state.user = res.user;
    localStorage.setItem('barter_token', res.token);
    hideModal('register-modal');
    updateUI();
    initSocket();
    showToast('Welcome to BarterHub!', `Account created for ${res.user.username} 🎉`, 'success');
    document.getElementById('register-form').reset();
    setTimeout(() => showServiceIntentModal(), 400);
  } else {
    const msg = res.errors ? res.errors.map(err => err.msg).join(', ') : res.message;
    showToast('Registration failed', msg, 'error');
  }
}

async function logout() {
  await apiCall('POST', '/auth/logout');
  state.token = null;
  state.user = null;
  state.socket?.disconnect();
  state.socket = null;
  localStorage.removeItem('barter_token');
  updateUI();
  showPage('home');
  closeAvatarMenu();
  showToast('Signed out', 'See you next time!', 'info');
}

async function fetchCurrentUser() {
  const res = await apiCall('GET', '/auth/me');
  if (res.success) {
    state.user = res.user;
    updateUI();
    initSocket();
    fetchNotifications();
    fetchUnreadCount();
  } else {
    state.token = null;
    localStorage.removeItem('barter_token');
  }
}

function updateUI() {
  const loggedIn = !!state.user;
  document.getElementById('guest-actions').classList.toggle('hidden', loggedIn);
  document.getElementById('user-actions').classList.toggle('hidden', !loggedIn);
  document.getElementById('nav-my-items').style.display = loggedIn ? '' : 'none';
  const navFav = document.getElementById('nav-favorites');
  if (navFav) navFav.style.display = loggedIn ? '' : 'none';
  document.getElementById('nav-trades').style.display = loggedIn ? '' : 'none';
  document.getElementById('nav-chat').style.display = loggedIn ? '' : 'none';

  if (loggedIn) {
    document.getElementById('nav-username').textContent = state.user.username;
    const avatar = document.getElementById('nav-avatar');
    avatar.src = state.user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(state.user.username)}&background=6c63ff&color=fff`;

    // Settings page
    const sa = document.getElementById('settings-avatar');
    if (sa) sa.src = state.user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(state.user.username)}&background=6c63ff&color=fff`;
    const su = document.getElementById('settings-username');
    if (su) su.value = state.user.username;
    const sl = document.getElementById('settings-location');
    if (sl) sl.value = state.user.location || '';
    const sb = document.getElementById('settings-bio');
    if (sb) sb.value = state.user.bio || '';
  }
}

// ===== NAVIGATION & SERVICE MODES =====
function showServiceIntentModal() {
  showModal('service-intent-modal');
}

function promptServiceChoice() {
  if (!state.user) {
    showToast('Sign In Required', 'Please sign in or join to create listings across Europe.', 'info');
    showPage('login');
    return;
  }
  showServiceIntentModal();
}

function startServiceListing(mode) {
  hideModal('service-intent-modal');
  showModal('post-item-modal');
  selectListingType(mode);
  showToast('Mode Selected 🇪🇺', `Ready to create your ${mode.toUpperCase()} listing!`, 'info');
}

function browseServiceMode(mode) {
  hideModal('service-intent-modal');
  showPage('browse');
  const pillBtn = document.querySelector(`#browse-type-pills .pill-${mode}`) || 
                  document.querySelector('#browse-type-pills .type-pill');
  setListingTypeFilter(mode, pillBtn);
}

function chooseServiceMode(mode) {
  startServiceListing(mode);
}

async function quickLogin(email) {
  showToast('Connecting...', `Signing in demo user...`, 'info');
  const res = await apiCall('POST', '/auth/login', { email, password: 'password123' });
  if (res.success) {
    state.token = res.token;
    state.user = res.user;
    localStorage.setItem('barter_token', res.token);
    updateUI();
    initSocket();
    fetchNotifications();
    fetchUnreadCount();
    showToast('Demo Connected! 🇪🇺', `Welcome back, ${res.user.username}!`, 'success');
    if (state.currentPage === 'home') loadHomeItems();
    else if (state.currentPage === 'browse') loadItems();
    else if (state.currentPage === 'favorites') loadFavorites();
    else if (state.currentPage === 'trades') loadTrades('all');
    else if (state.currentPage === 'profile') loadProfile(res.user._id);
    else showPage('home');
    setTimeout(() => showServiceIntentModal(), 400);
  } else {
    showToast('Demo Login Failed', res.message, 'error');
  }
}

async function loadFavorites() {
  if (!state.user) return showPage('login');
  const grid = document.getElementById('favorites-grid');
  if (grid) grid.innerHTML = '<div class="loading-skeleton"></div>'.repeat(3);
  const res = await apiCall('GET', '/items/user/favorites');
  if (!grid) return;
  if (res.success && res.items.length) {
    grid.innerHTML = res.items.map(renderItemCard).join('');
  } else {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1">
      <div class="empty-state-icon">❤️</div>
      <h3>No saved favorites yet</h3>
      <p>Click the heart icon on any European listing to save it here!</p>
      <button class="btn btn-primary" onclick="showPage('browse')">Explore Listings</button>
    </div>`;
  }
}

function showPage(page, subTab) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));

  if (page === 'login') {
    if (state.user) {
      showToast('Already signed in', `You are signed in as ${state.user.username}`, 'info');
      showPage('home');
      return;
    }
    const loginPageEl = document.getElementById('page-login');
    if (loginPageEl) loginPageEl.classList.add('active');
    state.currentPage = 'login';
    if (subTab === 'register') switchAuthTab('register');
    else switchAuthTab('login');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    closeAvatarMenu();
    return;
  }

  const el = document.getElementById(`page-${page}`);
  if (el) el.classList.add('active');
  state.currentPage = page;

  if (page === 'browse') loadItems();
  if (page === 'favorites') loadFavorites();
  if (page === 'my-items') loadMyItems();
  if (page === 'trades') loadTrades('all');
  if (page === 'chat') loadConversations();
  if (page === 'profile') loadProfile(state.user?._id);
  if (page === 'settings') updateUI();

  window.scrollTo({ top: 0, behavior: 'smooth' });
  closeAvatarMenu();
}

function browseCat(cat) {
  showPage('browse');
  document.getElementById('filter-category').value = cat;
  loadItems();
}

// ===== ITEMS =====
async function loadHomeItems() {
  const res = await apiCall('GET', '/items?limit=8&sort=newest');
  const grid = document.getElementById('home-items-grid');
  if (!grid) return;
  if (res.success && res.items.length) {
    grid.innerHTML = res.items.map(renderItemCard).join('');
  } else {
    grid.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📦</div><h3>No items yet</h3><p>Be the first to post an item!</p></div>';
  }
}

function setListingTypeFilter(type, btn) {
  state.currentListingType = type;
  document.querySelectorAll('#browse-type-pills .type-pill').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  const dropdown = document.getElementById('filter-listing-type');
  if (dropdown) dropdown.value = type;
  state.currentItemPage = 1;
  loadItems();
}

function syncListingTypeDropdown(val) {
  state.currentListingType = val;
  document.querySelectorAll('#browse-type-pills .type-pill').forEach(b => {
    const text = b.textContent.toLowerCase();
    if (val === 'all' && text.includes('all')) b.classList.add('active');
    else if (val === 'barter' && text.includes('barter')) b.classList.add('active');
    else if (val === 'sell' && text.includes('sale')) b.classList.add('active');
    else if (val === 'rent' && text.includes('rent')) b.classList.add('active');
    else b.classList.remove('active');
  });
  state.currentItemPage = 1;
  loadItems();
}

function selectListingType(type) {
  const hiddenInput = document.getElementById('item-listing-type');
  if (hiddenInput) hiddenInput.value = type;

  const optBarter = document.getElementById('opt-barter');
  const optSell = document.getElementById('opt-sell');
  const optRent = document.getElementById('opt-rent');

  optBarter?.classList.toggle('selected', type === 'barter');
  optSell?.classList.toggle('selected', type === 'sell');
  optRent?.classList.toggle('selected', type === 'rent');

  const barterGroup = document.getElementById('field-barter-group');
  const sellGroup = document.getElementById('field-sell-group');
  const rentGroup = document.getElementById('field-rent-group');

  if (barterGroup) barterGroup.classList.toggle('hidden', type !== 'barter');
  if (sellGroup) sellGroup.classList.toggle('hidden', type !== 'sell');
  if (rentGroup) rentGroup.classList.toggle('hidden', type !== 'rent');
}

async function loadItems() {
  const search = document.getElementById('search-input')?.value || '';
  const category = document.getElementById('filter-category')?.value || 'All';
  const condition = document.getElementById('filter-condition')?.value || 'All';
  const sort = document.getElementById('filter-sort')?.value || 'newest';
  const location = document.getElementById('filter-location')?.value || 'all';
  const minVal = document.getElementById('filter-min-val')?.value || '';
  const maxVal = document.getElementById('filter-max-val')?.value || '';
  const page = state.currentItemPage || 1;

  let query = `?limit=12&page=${page}&sort=${sort}`;
  if (search) query += `&search=${encodeURIComponent(search)}`;
  if (category !== 'All') query += `&category=${encodeURIComponent(category)}`;
  if (condition !== 'All') query += `&condition=${encodeURIComponent(condition)}`;
  if (location && location !== 'all') query += `&location=${encodeURIComponent(location)}`;
  if (minVal) query += `&minValue=${encodeURIComponent(minVal)}`;
  if (maxVal) query += `&maxValue=${encodeURIComponent(maxVal)}`;
  if (state.currentListingType && state.currentListingType !== 'all') {
    query += `&listingType=${encodeURIComponent(state.currentListingType)}`;
  }

  const grid = document.getElementById('browse-items-grid');
  if (grid) grid.innerHTML = '<div class="loading-skeleton"></div>'.repeat(6);

  const res = await apiCall('GET', `/items${query}`);
  if (!grid) return;

  const countEl = document.getElementById('items-count');
  if (countEl) countEl.textContent = res.success ? `${res.pagination.total} items found` : '';

  if (res.success && res.items.length) {
    grid.innerHTML = res.items.map(renderItemCard).join('');
    renderPagination(res.pagination);
  } else {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><div class="empty-state-icon">🔍</div><h3>No items found</h3><p>Try different filters or be the first to post!</p></div>`;
    document.getElementById('pagination').innerHTML = '';
  }
}

function renderPagination({ page, pages }) {
  const el = document.getElementById('pagination');
  if (!el || pages <= 1) { if (el) el.innerHTML = ''; return; }
  let html = '';
  if (page > 1) html += `<button class="page-btn" onclick="goToPage(${page-1})">← Prev</button>`;
  for (let i = Math.max(1, page-2); i <= Math.min(pages, page+2); i++) {
    html += `<button class="page-btn ${i===page?'active':''}" onclick="goToPage(${i})">${i}</button>`;
  }
  if (page < pages) html += `<button class="page-btn" onclick="goToPage(${page+1})">Next →</button>`;
  el.innerHTML = html;
}

function goToPage(page) {
  state.currentItemPage = page;
  loadItems();
  window.scrollTo({ top: 200, behavior: 'smooth' });
}

function debounceSearch() {
  clearTimeout(state.searchTimer);
  state.currentItemPage = 1;
  state.searchTimer = setTimeout(loadItems, 400);
}

function clearFilters() {
  document.getElementById('search-input').value = '';
  document.getElementById('filter-category').value = 'All';
  document.getElementById('filter-condition').value = 'All';
  document.getElementById('filter-sort').value = 'newest';
  const loc = document.getElementById('filter-location'); if (loc) loc.value = 'all';
  const minV = document.getElementById('filter-min-val'); if (minV) minV.value = '';
  const maxV = document.getElementById('filter-max-val'); if (maxV) maxV.value = '';
  if (document.getElementById('filter-listing-type')) document.getElementById('filter-listing-type').value = 'all';
  state.currentListingType = 'all';
  document.querySelectorAll('#browse-type-pills .type-pill').forEach((b, i) => b.classList.toggle('active', i === 0));
  state.currentItemPage = 1;
  loadItems();
}

async function loadMyItems() {
  if (!state.user) return;
  const res = await apiCall('GET', `/items?owner=${state.user._id}&limit=50`);
  const grid = document.getElementById('my-items-grid');
  if (!grid) return;
  if (res.success && res.items.length) {
    grid.innerHTML = `<div style="max-width:1280px;margin:0 auto;padding:0 24px 64px;display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:20px">${res.items.map(item => renderItemCard(item, true)).join('')}</div>`;
  } else {
    grid.innerHTML = `<div class="empty-state"><div class="empty-state-icon">📦</div><h3>No items yet</h3><p>Post your first item to start trading!</p><button class="btn btn-primary" onclick="showModal('post-item-modal')">+ Post Item</button></div>`;
  }
}

function renderItemCard(item, isOwner = false) {
  const owner = item.owner;
  const initials = owner?.username ? owner.username[0].toUpperCase() : '?';
  const avatarSrc = owner?.avatar
    ? owner.avatar
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(owner?.username||'?')}&background=6c63ff&color=fff&size=40`;

  const imgContent = item.images?.length
    ? `<img src="${item.images[0]}" alt="${escHtml(item.title)}" onerror="this.parentNode.innerHTML='📦'" />`
    : getCategoryEmoji(item.category);

  const stars = owner?.rating?.average ? renderStars(owner.rating.average) : '';

  const ownerControls = isOwner ? `
    <div style="display:flex;gap:6px;margin-top:10px">
      <button class="btn btn-ghost btn-sm" onclick="event.stopPropagation();deleteItem('${item._id}')">🗑 Delete</button>
      <span class="badge-cond" style="padding:6px 10px">${item.status}</span>
    </div>` : '';

  const type = item.listingType || 'barter';
  let typeBadge = '';
  let priceDisplay = '';

  if (type === 'sell') {
    typeBadge = `<span class="badge-type badge-type-sell">🏷️ For Sale</span>`;
    priceDisplay = `<span class="item-card-price-tag price-sell">₹${(item.price || item.estimatedValue || 0).toLocaleString('en-IN')}</span>`;
  } else if (type === 'rent') {
    typeBadge = `<span class="badge-type badge-type-rent">⏱️ Rent</span>`;
    priceDisplay = `<span class="item-card-price-tag price-rent">₹${(item.rentPrice || 0).toLocaleString('en-IN')}/${item.rentPeriod || 'day'}</span>`;
  } else {
    typeBadge = `<span class="badge-type badge-type-barter">🔄 Barter</span>`;
    priceDisplay = item.estimatedValue ? `<span class="item-value">~₹${Number(item.estimatedValue).toLocaleString('en-IN')}</span>` : `<span class="badge-cond">Swap</span>`;
  }

  return `
    <div class="item-card" onclick="viewItem('${item._id}')">
      <div class="item-card-img">${imgContent}</div>
      <div class="item-card-body">
        <div class="item-card-title">${escHtml(item.title)}</div>
        <div class="item-card-meta">
          ${typeBadge}
          <span class="badge-cat">${item.category}</span>
          <span class="badge-cond">${item.condition}</span>
        </div>
        <div class="item-card-desc">${escHtml(item.description)}</div>
        ${ownerControls}
      </div>
      <div class="item-card-footer">
        <div class="item-card-owner">
          <img src="${avatarSrc}" class="avatar-xs" alt="${escHtml(owner?.username||'?')}" onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(owner?.username||'?')}&background=b85d19&color=fff&size=40'"/>
          <span>${escHtml(owner?.username || 'Unknown')}</span>
          ${stars}
        </div>
        ${priceDisplay}
      </div>
    </div>`;
}

async function viewItem(id) {
  const res = await apiCall('GET', `/items/${id}`);
  if (!res.success) return showToast('Error', 'Could not load item', 'error');
  const item = res.item;
  const owner = item.owner;

  const images = item.images?.length ? item.images : [];
  const mainImg = images[0] || null;
  const thumbs = images.map((img, i) =>
    `<img src="${img}" class="thumb ${i===0?'active':''}" alt="thumb" onclick="switchMainImage('${img}', this)" />`
  ).join('');

  const avatarSrc = owner.avatar
    ? owner.avatar
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(owner.username)}&background=b85d19&color=fff&size=80`;

  const isOwner = state.user && state.user._id === owner._id;
  const isLiked = state.user && item.likes?.includes(state.user._id);

  const type = item.listingType || 'barter';
  let typeBanner = '';
  let actionPrimaryBtn = '';

  const formattedPrice = (item.price || item.estimatedValue || 0).toLocaleString('en-IN');
  const formattedRent = (item.rentPrice || 0).toLocaleString('en-IN');
  const formattedDeposit = (item.deposit || 0).toLocaleString('en-IN');
  const formattedEstVal = (item.estimatedValue || 0).toLocaleString('en-IN');

  if (type === 'sell') {
    typeBanner = `
      <div class="type-notice-banner notice-sell">
        <div>
          <span style="font-size:11px;font-weight:700;text-transform:uppercase;color:#15803d;display:block">🏷️ Item For Direct Sale</span>
          <strong style="font-size:24px;color:#15803d">₹${formattedPrice} INR</strong>
          <p style="margin:2px 0 0;font-size:13px;color:var(--text-muted)">Available for purchase across India with escrow protection</p>
        </div>
        <span class="badge-type badge-type-sell">For Sale</span>
      </div>`;
    actionPrimaryBtn = !isOwner && state.user
      ? `<button class="btn btn-primary btn-xl" style="background:#15803d;border-color:#15803d" onclick="buyItemPrompt('${owner._id}', '${item._id}', '${escHtml(item.title)}', '${formattedPrice}')">⚡ Contact to Buy (₹${formattedPrice})</button>`
      : !state.user
      ? `<button class="btn btn-primary btn-xl" onclick="showPage('login')">Sign in to Buy</button>`
      : `<button class="btn btn-ghost" onclick="showModal('post-item-modal')">✏️ Edit Listing</button>`;
  } else if (type === 'rent') {
    typeBanner = `
      <div class="type-notice-banner notice-rent">
        <div>
          <span style="font-size:11px;font-weight:700;text-transform:uppercase;color:#b45309;display:block">⏱️ Available For Rent</span>
          <strong style="font-size:24px;color:#b45309">₹${formattedRent} / ${item.rentPeriod || 'day'}</strong>
          <p style="margin:2px 0 0;font-size:13px;color:var(--text-muted)">Security Deposit: ₹${formattedDeposit}</p>
        </div>
        <span class="badge-type badge-type-rent">For Rent</span>
      </div>`;
    actionPrimaryBtn = !isOwner && state.user
      ? `<button class="btn btn-primary btn-xl" style="background:#b45309;border-color:#b45309" onclick="rentItemPrompt('${owner._id}', '${item._id}', '${escHtml(item.title)}', '${formattedRent}', '${item.rentPeriod || 'day'}')">⏱️ Rent This Item</button>`
      : !state.user
      ? `<button class="btn btn-primary btn-xl" onclick="showPage('login')">Sign in to Rent</button>`
      : `<button class="btn btn-ghost" onclick="showModal('post-item-modal')">✏️ Edit Listing</button>`;
  } else {
    typeBanner = `
      <div class="type-notice-banner notice-barter">
        <div>
          <span style="font-size:11px;font-weight:700;text-transform:uppercase;color:var(--primary);display:block">🔄 Barter / Swap Listing</span>
          <strong style="font-size:18px;color:var(--text)">Trade For Goods or Services</strong>
          <p style="margin:2px 0 0;font-size:13px;color:var(--text-muted)">Exchange what you have with this Indian trader</p>
        </div>
        <span class="badge-type badge-type-barter">Barter Trade</span>
      </div>`;
    actionPrimaryBtn = !isOwner && state.user
      ? `<button class="btn btn-primary btn-xl" onclick="openTradeModal('${owner._id}', '${item._id}')">🤝 Propose Trade</button>`
      : !state.user
      ? `<button class="btn btn-primary btn-xl" onclick="showPage('login')">Sign in to Trade</button>`
      : `<button class="btn btn-ghost" onclick="showModal('post-item-modal')">✏️ Edit Listing</button>`;
  }

  const chatBtn = !isOwner && state.user
    ? `<button class="btn btn-ghost" onclick="startChat('${owner._id}')">💬 Message Owner</button>`
    : '';

  document.getElementById('item-detail-content').innerHTML = `
    <div class="item-detail-container">
      <a href="#" class="back-btn" onclick="history.back()">← Back</a>
      ${typeBanner}
      <div class="item-detail-grid">
        <div class="item-images-gallery">
          <div class="main-image" id="main-image">
            ${mainImg ? `<img src="${mainImg}" alt="${escHtml(item.title)}" id="main-img-el"/>` : `<span style="font-size:80px">${getCategoryEmoji(item.category)}</span>`}
          </div>
          ${images.length > 1 ? `<div class="thumb-row">${thumbs}</div>` : ''}
        </div>
        <div class="item-detail-info">
          <h1 class="item-detail-title">${escHtml(item.title)}</h1>
          <div class="item-detail-badges">
            <span class="badge-cat">${item.category}</span>
            <span class="badge-cond">${item.condition}</span>
          </div>
          <p class="item-detail-desc">${escHtml(item.description)}</p>
          <div class="item-detail-meta">
            <div class="meta-item">
              <small>${type === 'sell' ? 'Price' : type === 'rent' ? 'Rental Rate' : 'Estimated Value'}</small>
              <span style="font-weight:700;color:var(--primary)">
                ${type === 'sell' ? '₹'+formattedPrice : type === 'rent' ? '₹'+formattedRent+'/'+(item.rentPeriod||'day') : (item.estimatedValue ? '₹'+formattedEstVal : 'Trade')}
              </span>
            </div>
            <div class="meta-item">
              <small>Views</small>
              <span>${item.views} 👁</span>
            </div>
            <div class="meta-item">
              <small>Posted</small>
              <span>${timeAgo(item.createdAt)}</span>
            </div>
            <div class="meta-item">
              <small>Likes</small>
              <span>${item.likes?.length || 0} ❤️</span>
            </div>
          </div>
          ${type === 'barter' && item.lookingFor ? `
          <div class="looking-for-box">
            <strong>🔍 Looking For (Exchange Wishlist)</strong>
            <p>${escHtml(item.lookingFor)}</p>
          </div>` : ''}
          <div class="owner-card">
            <div class="owner-avatar">
              <img src="${avatarSrc}" alt="${escHtml(owner.username)}" style="width:100%;height:100%;border-radius:50%;object-fit:cover" onerror="this.style.display='none'"/>
            </div>
            <div class="owner-info">
              <div class="owner-name">${escHtml(owner.username)}</div>
              <div class="owner-stats">
                <span>${renderStars(owner.rating?.average || 0)} (${owner.rating?.count || 0})</span>
                <span>·</span>
                <span>${owner.completedTrades || 0} deals</span>
                ${owner.location ? `<span>· 📍 ${escHtml(owner.location)}</span>` : ''}
              </div>
            </div>
            <button class="btn btn-ghost btn-sm" onclick="viewProfile('${owner._id}')">View Profile</button>
          </div>
          <div class="trade-actions">
            ${actionPrimaryBtn}
            ${chatBtn}
            ${state.user ? `<button class="btn btn-ghost" onclick="toggleLike('${item._id}', this)">${isLiked?'❤️':'🤍'} ${item.likes?.length||0}</button>` : ''}
          </div>
        </div>
      </div>
    </div>`;

  showPage('item-detail');
}

function buyItemPrompt(ownerId, itemId, title, price) {
  startChat(ownerId);
  setTimeout(() => {
    const input = document.getElementById('chat-input');
    if (input) {
      input.value = `Namaste! I would like to purchase "${title}" for ₹${price}. Can we arrange collection or shipping?`;
      input.focus();
    }
  }, 350);
}

function rentItemPrompt(ownerId, itemId, title, rate, period) {
  startChat(ownerId);
  setTimeout(() => {
    const input = document.getElementById('chat-input');
    if (input) {
      input.value = `Namaste! I am interested in renting "${title}" at ₹${rate}/${period}. When is it available?`;
      input.focus();
    }
  }, 350);
}

function switchMainImage(src, thumb) {
  const mainEl = document.getElementById('main-img-el');
  if (mainEl) mainEl.src = src;
  document.querySelectorAll('.thumb').forEach(t => t.classList.remove('active'));
  thumb.classList.add('active');
}

async function toggleLike(itemId, btn) {
  const res = await apiCall('POST', `/items/${itemId}/like`);
  if (res.success) {
    btn.textContent = `${res.liked ? '❤️' : '🤍'} ${res.likesCount}`;
  }
}

async function postItem(e) {
  e.preventDefault();
  if (!state.user) return showModal('login-modal');

  const btn = document.getElementById('post-item-btn');
  btn.textContent = 'Posting...'; btn.disabled = true;

  const formData = new FormData();
  formData.append('title', document.getElementById('item-title').value);
  formData.append('description', document.getElementById('item-description').value);
  formData.append('category', document.getElementById('item-category').value);
  formData.append('condition', document.getElementById('item-condition').value);
  formData.append('estimatedValue', document.getElementById('item-value').value || '0');
  
  // Listing Type & Pricing
  const listingType = document.getElementById('item-listing-type')?.value || 'barter';
  formData.append('listingType', listingType);
  formData.append('price', document.getElementById('item-price')?.value || '0');
  formData.append('rentPrice', document.getElementById('item-rent-price')?.value || '0');
  formData.append('rentPeriod', document.getElementById('item-rent-period')?.value || 'day');
  formData.append('deposit', document.getElementById('item-deposit')?.value || '0');
  formData.append('lookingFor', document.getElementById('item-looking-for')?.value || '');
  formData.append('tags', document.getElementById('item-tags').value);

  const files = document.getElementById('item-images').files;
  for (let f of files) formData.append('images', f);

  const res = await apiCallForm('POST', '/items', formData);
  btn.textContent = 'Post Listing'; btn.disabled = false;

  if (res.success) {
    hideModal('post-item-modal');
    document.getElementById('post-item-form').reset();
    selectListingType('barter');
    document.getElementById('image-previews').innerHTML = '';
    showToast('Listing Posted! 🎉', `"${res.item.title}" is now live as ${listingType.toUpperCase()}`, 'success');
    loadHomeItems();
    if (state.currentPage === 'browse') loadItems();
  } else {
    showToast('Error', res.message || 'Failed to post item', 'error');
  }
}

async function deleteItem(id) {
  if (!confirm('Delete this item?')) return;
  const res = await apiCall('DELETE', `/items/${id}`);
  if (res.success) {
    showToast('Deleted', 'Item removed', 'info');
    loadMyItems();
  } else {
    showToast('Error', res.message, 'error');
  }
}

function previewImages(e) {
  const preview = document.getElementById('image-previews');
  preview.innerHTML = '';
  Array.from(e.target.files).slice(0, 5).forEach(file => {
    const reader = new FileReader();
    reader.onload = ev => {
      const img = document.createElement('img');
      img.src = ev.target.result;
      preview.appendChild(img);
    };
    reader.readAsDataURL(file);
  });
}

// ===== TRADES =====
let currentTradeFilter = 'all';

async function loadTrades(status) {
  currentTradeFilter = status;
  const query = status !== 'all' ? `?status=${status}` : '';
  const res = await apiCall('GET', `/trades${query}`);
  const list = document.getElementById('trades-list');
  if (!list) return;

  if (!res.success || !res.trades.length) {
    list.innerHTML = `<div class="empty-state"><div class="empty-state-icon">🤝</div><h3>No trades yet</h3><p>Browse items and propose a trade!</p><button class="btn btn-primary" onclick="showPage('browse')">Browse Items</button></div>`;
    return;
  }

  list.innerHTML = res.trades.map(trade => renderTradeCard(trade)).join('');
}

function filterTrades(status, btn) {
  document.querySelectorAll('.trade-tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  loadTrades(status);
}

function renderTradeCard(trade) {
  const isProposer = state.user?._id === trade.proposer?._id;
  const other = isProposer ? trade.receiver : trade.proposer;
  const myItems = isProposer ? trade.offeredItems : trade.requestedItems;
  const theirItems = isProposer ? trade.requestedItems : trade.offeredItems;

  const renderItems = items => (items || []).map(item => {
    const img = item.images?.[0]
      ? `<img src="${item.images[0]}" alt="${escHtml(item.title)}" onerror="this.src=''">`
      : `<div style="width:64px;height:64px;background:var(--bg-card2);border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:28px">${getCategoryEmoji(item.category)}</div>`;
    return `<div class="trade-item-thumb">${img}<span>${escHtml(item.title)}</span></div>`;
  }).join('');

  // Escrow progress stages
  let stage = 1;
  if (trade.status === 'accepted') stage = 2;
  else if (trade.status === 'in_escrow') stage = 3;
  else if (trade.status === 'completed') stage = 4;
  else if (['rejected', 'cancelled'].includes(trade.status)) stage = 0;

  const stepperHtml = stage > 0 ? `
    <div class="escrow-stepper">
      <div class="escrow-step ${stage >= 1 ? 'completed' : ''} ${stage === 1 ? 'current' : ''}">
        <div class="step-circle">${stage > 1 ? '✓' : '1'}</div>
        <div class="step-label">Proposal</div>
      </div>
      <div class="step-connector ${stage >= 2 ? 'active' : ''}"></div>
      <div class="escrow-step ${stage >= 2 ? 'completed' : ''} ${stage === 2 ? 'current' : ''}">
        <div class="step-circle">${stage > 2 ? '✓' : '2'}</div>
        <div class="step-label">Agreed</div>
      </div>
      <div class="step-connector ${stage >= 3 ? 'active' : ''}"></div>
      <div class="escrow-step ${stage >= 3 ? 'completed' : ''} ${stage === 3 ? 'current' : ''}">
        <div class="step-circle">${stage > 3 ? '✓' : '3'}</div>
        <div class="step-label">Escrow Handover</div>
      </div>
      <div class="step-connector ${stage >= 4 ? 'active' : ''}"></div>
      <div class="escrow-step ${stage >= 4 ? 'completed' : ''} ${stage === 4 ? 'current' : ''}">
        <div class="step-circle">${stage === 4 ? '✓' : '4'}</div>
        <div class="step-label">Completed</div>
      </div>
    </div>` : '';

  let actions = '';
  if (trade.status === 'pending') {
    if (!isProposer) {
      actions += `<button class="btn btn-success btn-sm" onclick="respondTrade('${trade._id}','accept')">✅ Accept Proposal</button>`;
      actions += `<button class="btn btn-danger btn-sm" onclick="respondTrade('${trade._id}','reject')">❌ Reject</button>`;
    } else {
      actions += `<button class="btn btn-ghost btn-sm" onclick="respondTrade('${trade._id}','cancel')">Cancel</button>`;
    }
  }
  if (trade.status === 'accepted') {
    actions += `<button class="btn btn-warning btn-sm" onclick="updateEscrow('${trade._id}','start')">🛡️ Start Escrow Handover</button>`;
    actions += `<button class="btn btn-primary btn-sm" onclick="respondTrade('${trade._id}','complete')">✅ Complete Deal</button>`;
    actions += `<button class="btn btn-ghost btn-sm" onclick="respondTrade('${trade._id}','cancel')">Cancel</button>`;
  }
  if (trade.status === 'in_escrow') {
    const hasMyConfirmation = isProposer ? !!trade.proposerConfirmedAt : !!trade.receiverConfirmedAt;
    if (!hasMyConfirmation) {
      actions += `<button class="btn btn-success btn-sm" onclick="updateEscrow('${trade._id}','confirm')">📦 Confirm Item Sent / Received</button>`;
    } else {
      actions += `<span class="badge-status-confirmed">✓ You confirmed handover</span>`;
    }
    actions += `<button class="btn btn-primary btn-sm" onclick="respondTrade('${trade._id}','complete')">✅ Release Escrow & Finish</button>`;
    actions += `<button class="btn btn-ghost btn-sm" onclick="respondTrade('${trade._id}','cancel')">Cancel</button>`;
  }
  if (trade.status === 'completed') {
    const myRated = isProposer ? trade.rating?.proposerRating : trade.rating?.receiverRating;
    if (!myRated) {
      actions += `<button class="btn btn-warning btn-sm" onclick="openRatingModal('${trade._id}')">⭐ Rate Indian Trader</button>`;
    } else {
      actions += `<span style="font-size:13px;color:var(--gold)">⭐ You rated: ${myRated}/5</span>`;
    }
  }

  const otherAvatarSrc = other?.avatar
    ? other.avatar
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(other?.username||'?')}&background=6c63ff&color=fff&size=40`;

  return `
    <div class="trade-card">
      <div class="trade-card-header">
        <div class="trade-participants">
          <img src="${otherAvatarSrc}" class="avatar-xs" alt="${escHtml(other?.username||'?')}" onerror="this.style.display='none'"/>
          Trade with <strong>${escHtml(other?.username || 'Unknown')}</strong>
          <span style="color:var(--text-muted);font-weight:400;font-size:12px">· ${timeAgo(trade.createdAt)}</span>
        </div>
        <span class="trade-status status-${trade.status}">${trade.status.replace('_', ' ').toUpperCase()}</span>
      </div>
      ${stepperHtml}
      <div class="trade-items">
        <div>
          <div class="trade-section-title">You offer</div>
          <div class="trade-items-group">${renderItems(myItems)}</div>
        </div>
        <div class="trade-arrow">⇄</div>
        <div>
          <div class="trade-section-title">You receive</div>
          <div class="trade-items-group">${renderItems(theirItems)}</div>
        </div>
      </div>
      ${trade.message ? `<p style="margin-top:12px;font-size:13px;color:var(--text-muted);font-style:italic">"${escHtml(trade.message)}"</p>` : ''}
      ${trade.escrowNotes ? `<div class="escrow-notice">🛡️ Escrow Note: ${escHtml(trade.escrowNotes)}</div>` : ''}
      <div class="trade-actions-row">${actions}</div>
    </div>`;
}

async function updateEscrow(tradeId, action) {
  const notes = action === 'start' ? prompt('Add an escrow handover note (e.g. tracking number, carrier, meet-up details):') : '';
  const res = await apiCall('PUT', `/trades/${tradeId}/escrow`, { action, notes: notes || '' });
  if (res.success) {
    showToast('Escrow Updated! 🛡️', res.message, 'success');
    loadTrades(currentTradeFilter);
  } else {
    showToast('Error', res.message, 'error');
  }
}

async function respondTrade(id, action) {
  const actionMap = { accept: 'accept', reject: 'reject', cancel: 'cancel', complete: 'complete' };
  const res = await apiCall('PUT', `/trades/${id}/${actionMap[action]}`);
  if (res.success) {
    showToast('Trade updated!', `Trade ${action}ed`, 'success');
    loadTrades(currentTradeFilter);
  } else {
    showToast('Error', res.message, 'error');
  }
}

async function openTradeModal(ownerId, requestedItemId) {
  if (!state.user) return showModal('login-modal');

  // Get user's available items
  const myRes = await apiCall('GET', `/items?owner=${state.user._id}&limit=50`);
  const theirRes = await apiCall('GET', `/items?owner=${ownerId}&limit=50`);

  const myItems = myRes.items?.filter(i => i.status === 'available') || [];
  const theirItems = theirRes.items?.filter(i => i.status === 'available') || [];

  const renderSelectItems = (items, type) => items.map(item => {
    const img = item.images?.[0]
      ? `<img src="${item.images[0]}" alt="${escHtml(item.title)}" onerror="this.style.display='none'">`
      : `<span style="font-size:24px">${getCategoryEmoji(item.category)}</span>`;
    const preSelected = type === 'requested' && item._id === requestedItemId ? 'selected' : '';
    return `<div class="trade-item-option ${preSelected}" onclick="toggleTradeItem(this, '${item._id}', '${type}')" data-id="${item._id}" data-type="${type}">${img}<span>${escHtml(item.title)}</span></div>`;
  }).join('');

  document.getElementById('trade-modal-content').innerHTML = `
    <div style="margin-bottom:16px">
      <div class="trade-section-title">Your items to offer (select one or more)</div>
      ${myItems.length ? `<div class="trade-item-select" id="offered-items">${renderSelectItems(myItems, 'offered')}</div>` : '<p style="color:var(--text-muted);font-size:14px">You have no available items. <a href="#" onclick="showModal(\'post-item-modal\')">Post one!</a></p>'}
    </div>
    <div class="trade-sep">⇄</div>
    <div style="margin-bottom:16px">
      <div class="trade-section-title">Their items you want (select one or more)</div>
      ${theirItems.length ? `<div class="trade-item-select" id="requested-items">${renderSelectItems(theirItems, 'requested')}</div>` : '<p style="color:var(--text-muted);font-size:14px">No available items from this user</p>'}
    </div>
    <div class="form-group">
      <label>Message (optional)</label>
      <textarea id="trade-message" class="input" rows="2" placeholder="Add a note to your proposal..." maxlength="500"></textarea>
    </div>
    <button class="btn btn-primary btn-full" onclick="submitTrade('${ownerId}')">🤝 Send Trade Proposal</button>`;

  showModal('trade-modal');
}

function toggleTradeItem(el, id, type) {
  el.classList.toggle('selected');
}

async function submitTrade(receiverId) {
  const offeredIds = [...document.querySelectorAll('#offered-items .selected')].map(el => el.dataset.id);
  const requestedIds = [...document.querySelectorAll('#requested-items .selected')].map(el => el.dataset.id);
  const message = document.getElementById('trade-message')?.value || '';

  if (!offeredIds.length) return showToast('Error', 'Select at least one item to offer', 'error');
  if (!requestedIds.length) return showToast('Error', 'Select at least one item to request', 'error');

  const res = await apiCall('POST', '/trades', {
    receiverId, offeredItemIds: offeredIds, requestedItemIds: requestedIds, message
  });

  if (res.success) {
    hideModal('trade-modal');
    showToast('Trade Sent! 🤝', 'Your proposal has been sent', 'success');
    showPage('trades');
  } else {
    showToast('Error', res.message, 'error');
  }
}

// ===== RATINGS =====
function openRatingModal(tradeId) {
  let selectedRating = 0;
  document.getElementById('rating-modal-content').innerHTML = `
    <div class="star-rating" id="star-rating">
      ${[1,2,3,4,5].map(n => `<button class="star-btn" onclick="selectStar(${n})" id="star-${n}">★</button>`).join('')}
    </div>
    <div class="form-group">
      <label>Review (optional)</label>
      <textarea id="rating-review" class="input" rows="3" placeholder="Share your experience..." maxlength="300"></textarea>
    </div>
    <button class="btn btn-primary btn-full" onclick="submitRating('${tradeId}')">Submit Rating</button>`;
  showModal('rating-modal');
}

function selectStar(n) {
  for (let i = 1; i <= 5; i++) {
    const el = document.getElementById(`star-${i}`);
    if (el) el.classList.toggle('active', i <= n);
  }
  window._selectedRating = n;
}

async function submitRating(tradeId) {
  const rating = window._selectedRating;
  const review = document.getElementById('rating-review')?.value || '';
  if (!rating) return showToast('Error', 'Please select a rating', 'error');

  const res = await apiCall('POST', `/trades/${tradeId}/rate`, { rating, review });
  if (res.success) {
    hideModal('rating-modal');
    showToast('Rating submitted! ⭐', 'Thank you for your feedback', 'success');
    loadTrades(currentTradeFilter);
  } else {
    showToast('Error', res.message, 'error');
  }
}

// ===== CHAT =====
async function loadConversations() {
  const res = await apiCall('GET', '/chat/conversations');
  const list = document.getElementById('conversations-list');
  if (!list) return;

  if (!res.success || !res.conversations.length) {
    list.innerHTML = '<div class="notif-empty">No conversations yet</div>';
    return;
  }

  list.innerHTML = res.conversations.map(conv => {
    const other = conv.participants.find(p => p._id !== state.user._id);
    if (!other) return '';
    const avatarSrc = other.avatar
      ? other.avatar
      : `https://ui-avatars.com/api/?name=${encodeURIComponent(other.username)}&background=6c63ff&color=fff&size=80`;
    const lastMsg = conv.lastMessage?.content || 'Start a conversation...';
    return `
      <div class="conv-item" onclick="openConversation('${conv._id}', '${other._id}', '${escHtml(other.username)}', '${avatarSrc}')" id="conv-${conv._id}">
        <div class="conv-avatar">
          <img src="${avatarSrc}" style="width:44px;height:44px;border-radius:50%;object-fit:cover" alt="${escHtml(other.username)}" />
          ${other.isOnline ? '<div class="online-dot"></div>' : ''}
        </div>
        <div class="conv-info">
          <div class="conv-name">${escHtml(other.username)}</div>
          <div class="conv-last">${escHtml(lastMsg.substring(0,40))}</div>
        </div>
      </div>`;
  }).join('');
}

async function openConversation(convId, userId, username, avatarSrc) {
  state.currentConversation = convId;

  document.querySelectorAll('.conv-item').forEach(el => el.classList.remove('active'));
  const convEl = document.getElementById(`conv-${convId}`);
  if (convEl) convEl.classList.add('active');

  state.socket?.emit('join_conversation', convId);

  const res = await apiCall('GET', `/chat/conversations/${convId}/messages`);
  const messages = res.success ? res.messages : [];

  document.getElementById('chat-main').innerHTML = `
    <div class="chat-header">
      <img src="${avatarSrc}" style="width:40px;height:40px;border-radius:50%;object-fit:cover" />
      <div>
        <div style="font-weight:600;font-size:15px">${escHtml(username)}</div>
        <div class="typing-indicator" id="typing-indicator"></div>
      </div>
    </div>
    <div class="chat-messages" id="chat-messages">
      ${messages.map(m => renderMessage(m)).join('')}
    </div>
    <div class="chat-input-area">
      <input type="text" class="chat-input" id="chat-input-field" placeholder="Type a message..." onkeypress="handleChatKeypress(event, '${convId}')" oninput="sendTyping('${convId}')" />
      <button class="send-btn" onclick="sendMessage('${convId}')">➤</button>
    </div>`;

  scrollChatBottom();
  fetchUnreadCount();
}

function renderMessage(msg) {
  const isSent = msg.sender._id === state.user?._id || msg.sender === state.user?._id;
  return `
    <div class="message-group">
      <div class="message-bubble ${isSent ? 'sent' : 'received'}">${escHtml(msg.content)}</div>
      <div class="message-meta ${isSent ? 'sent' : ''}">${timeAgo(msg.createdAt)}</div>
    </div>`;
}

function appendMessage(msg, sent = true) {
  const container = document.getElementById('chat-messages');
  if (!container) return;
  const div = document.createElement('div');
  div.className = 'message-group';
  div.innerHTML = `<div class="message-bubble ${sent ? 'sent' : 'received'}">${escHtml(msg.content)}</div>
    <div class="message-meta ${sent ? 'sent' : ''}">${timeAgo(msg.createdAt)}</div>`;
  container.appendChild(div);
  scrollChatBottom();
}

async function sendMessage(convId) {
  const input = document.getElementById('chat-input-field');
  const content = input?.value?.trim();
  if (!content) return;
  input.value = '';

  const res = await apiCall('POST', `/chat/conversations/${convId}/messages`, { content });
  if (res.success) {
    appendMessage(res.message, true);
    state.socket?.emit('send_message', { conversationId: convId, content });
  }
}

function handleChatKeypress(e, convId) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage(convId);
  }
}

let typingTimeout;
function sendTyping(convId) {
  state.socket?.emit('typing', { conversationId: convId, isTyping: true });
  clearTimeout(typingTimeout);
  typingTimeout = setTimeout(() => {
    state.socket?.emit('typing', { conversationId: convId, isTyping: false });
  }, 1500);
}

function scrollChatBottom() {
  const el = document.getElementById('chat-messages');
  if (el) el.scrollTop = el.scrollHeight;
}

async function startChat(userId) {
  if (!state.user) return showModal('login-modal');
  const res = await apiCall('POST', '/chat/conversations', { userId });
  if (res.success) {
    showPage('chat');
    setTimeout(() => loadConversations(), 100);
    const conv = res.conversation;
    const other = conv.participants.find(p => p._id !== state.user._id);
    const avatarSrc = other?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(other?.username||'?')}&background=6c63ff&color=fff`;
    setTimeout(() => openConversation(conv._id, other?._id, other?.username || 'User', avatarSrc), 300);
  }
}

async function fetchUnreadCount() {
  if (!state.user) return;
  const res = await apiCall('GET', '/chat/unread');
  if (res.success) {
    const badge = document.getElementById('unread-badge');
    if (badge) {
      badge.textContent = res.count;
      badge.classList.toggle('hidden', res.count === 0);
    }
  }
}

// ===== NOTIFICATIONS =====
async function fetchNotifications() {
  if (!state.user) return;
  const res = await apiCall('GET', '/notifications?limit=15');
  if (res.success) {
    state.notifications = res.notifications;
    updateNotifBadge(res.unreadCount);
    renderNotifications();
  }
}

function updateNotifBadge(count) {
  const badge = document.getElementById('notif-badge');
  if (badge) {
    badge.textContent = count;
    badge.classList.toggle('hidden', count === 0);
  }
}

function renderNotifications() {
  const list = document.getElementById('notification-list');
  if (!list) return;
  if (!state.notifications.length) {
    list.innerHTML = '<div class="notif-empty">🔔 No notifications yet</div>';
    return;
  }
  list.innerHTML = state.notifications.map(n => `
    <div class="notif-item ${n.read ? '' : 'unread'}" onclick="markNotifRead('${n._id}')">
      <div class="notif-icon">${getNotifIcon(n.type)}</div>
      <div class="notif-body">
        <div class="notif-title">${escHtml(n.title)}</div>
        <div class="notif-msg">${escHtml(n.message)}</div>
        <div class="notif-time">${timeAgo(n.createdAt)}</div>
      </div>
    </div>`).join('');
}

async function markNotifRead(id) {
  await apiCall('PUT', `/notifications/${id}/read`);
  const notif = state.notifications.find(n => n._id === id);
  if (notif) notif.read = true;
  const unread = state.notifications.filter(n => !n.read).length;
  updateNotifBadge(unread);
  renderNotifications();
}

async function markAllRead() {
  await apiCall('PUT', '/notifications/read-all');
  state.notifications.forEach(n => n.read = true);
  updateNotifBadge(0);
  renderNotifications();
}

function toggleNotifications() {
  const panel = document.getElementById('notification-panel');
  const overlay = document.getElementById('notif-overlay');
  panel.classList.toggle('hidden');
  overlay.classList.toggle('hidden');
  if (!panel.classList.contains('hidden')) {
    fetchNotifications();
  }
}

function closeNotifications() {
  document.getElementById('notification-panel').classList.add('hidden');
  document.getElementById('notif-overlay').classList.add('hidden');
}

document.getElementById('notif-overlay')?.addEventListener('click', closeNotifications);
document.getElementById('mark-all-read-btn')?.addEventListener('click', markAllRead);

// ===== PROFILE =====
async function loadProfile(userId) {
  if (!userId) return;
  const res = await apiCall('GET', `/users/${userId}`);
  if (!res.success) return;

  const user = res.user;
  const items = res.items;
  const isMe = state.user && state.user._id === userId;
  const avatarSrc = user.avatar
    ? user.avatar
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(user.username)}&background=6c63ff&color=fff&size=200`;

  document.getElementById('profile-content').innerHTML = `
    <div class="profile-container">
      <div class="profile-header">
        <img src="${avatarSrc}" class="profile-avatar" alt="${escHtml(user.username)}" onerror="this.style.display='none'"/>
        <div class="profile-info">
          <div class="profile-username">${escHtml(user.username)}</div>
          ${user.location ? `<div class="profile-location">📍 ${escHtml(user.location)}</div>` : ''}
          ${user.bio ? `<div class="profile-bio">${escHtml(user.bio)}</div>` : ''}
          <div class="profile-stats-row">
            <div class="profile-stat">
              <div class="profile-stat-value">${renderStars(user.rating?.average||0)} ${user.rating?.average||'—'}</div>
              <div class="profile-stat-label">Rating (${user.rating?.count||0})</div>
            </div>
            <div class="profile-stat">
              <div class="profile-stat-value">${user.completedTrades||0}</div>
              <div class="profile-stat-label">Trades Done</div>
            </div>
            <div class="profile-stat">
              <div class="profile-stat-value">${items.length}</div>
              <div class="profile-stat-label">Items Listed</div>
            </div>
            <div class="profile-stat">
              <div class="profile-stat-value">${formatDate(user.joinedAt)}</div>
              <div class="profile-stat-label">Member Since</div>
            </div>
          </div>
        </div>
        <div class="profile-actions">
          ${isMe ? `<button class="btn btn-ghost" onclick="showPage('settings')">✏️ Edit Profile</button>` :
            `<button class="btn btn-ghost" onclick="startChat('${user._id}')">💬 Message</button>`}
        </div>
      </div>
      <h3 style="margin-bottom:20px;font-family:var(--font-heading)">Available Items (${items.length})</h3>
      ${items.length ? `<div class="items-grid" style="margin-bottom:48px">${items.map(i => renderItemCard(i)).join('')}</div>` :
        `<div class="empty-state" style="margin-bottom:48px"><div class="empty-state-icon">📦</div><h3>No items listed</h3></div>`}
      
      <div class="profile-reviews-section">
        <h3 style="margin-bottom:16px;font-family:var(--font-heading)">European Trade Reviews & Reputation (${user.rating?.count || 0})</h3>
        <div id="profile-reviews-list"><div class="loading-skeleton" style="height:80px"></div></div>
      </div>
    </div>`;

  // Fetch reviews asynchronously
  fetchProfileReviews(userId);
}

async function fetchProfileReviews(userId) {
  const container = document.getElementById('profile-reviews-list');
  if (!container) return;
  const res = await apiCall('GET', `/users/${userId}/reviews`);
  if (res.success && res.reviews.length) {
    container.innerHTML = res.reviews.map(r => `
      <div class="review-card">
        <div class="review-header">
          <div style="display:flex;align-items:center;gap:10px">
            <img src="${r.reviewer?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(r.reviewer?.username||'?')}&background=6c63ff&color=fff`}" class="avatar-xs" alt="${escHtml(r.reviewer?.username||'')}" onerror="this.style.display='none'"/>
            <div>
              <strong>${escHtml(r.reviewer?.username || 'Indian Trader')}</strong>
              <div style="font-size:12px;color:var(--text-muted)">${r.reviewer?.location || 'India 🇮🇳'} · ${timeAgo(r.createdAt)}</div>
            </div>
          </div>
          <div class="review-rating">${renderStars(r.rating)} <span style="font-weight:700;color:var(--gold)">${r.rating}/5</span></div>
        </div>
        ${r.review ? `<p class="review-comment">"${escHtml(r.review)}"</p>` : ''}
      </div>
    `).join('');
  } else {
    container.innerHTML = '<div class="review-empty">🌟 No written reviews yet for this trader. Completed trades are protected by Swapic IN escrow.</div>';
  }
}

function viewProfile(userId) {
  state._viewProfileId = userId;
  document.getElementById('profile-content').innerHTML = '<div class="empty-state"><div class="empty-state-icon">⌛</div></div>';
  showPage('profile');
  loadProfile(userId);
}

// ===== SETTINGS =====
function previewAvatar(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    document.getElementById('settings-avatar').src = ev.target.result;
  };
  reader.readAsDataURL(file);
}

async function updateProfile(e) {
  e.preventDefault();
  const formData = new FormData();
  formData.append('username', document.getElementById('settings-username').value);
  formData.append('location', document.getElementById('settings-location').value);
  formData.append('bio', document.getElementById('settings-bio').value);
  const avatarFile = document.getElementById('avatar-file').files[0];
  if (avatarFile) formData.append('avatar', avatarFile);

  const res = await apiCallForm('PUT', '/users/profile/update', formData);
  if (res.success) {
    state.user = res.user;
    updateUI();
    showToast('Profile Updated! ✅', 'Your changes have been saved', 'success');
  } else {
    showToast('Error', res.message, 'error');
  }
}

function updateUserOnlineStatus(userId, online) {
  // Could update UI to reflect online status
}

// ===== MODAL HELPERS =====
function showModal(id) {
  document.getElementById(id)?.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function hideModal(id) {
  document.getElementById(id)?.classList.add('hidden');
  document.body.style.overflow = '';
}

function switchModal(from, to) {
  hideModal(from);
  showModal(to);
}

// Close modal on overlay click
document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', e => {
    if (e.target === overlay) {
      overlay.classList.add('hidden');
      document.body.style.overflow = '';
    }
  });
});

// ===== AVATAR MENU =====
function toggleAvatarMenu() {
  document.getElementById('avatar-dropdown')?.classList.toggle('hidden');
}

function closeAvatarMenu() {
  document.getElementById('avatar-dropdown')?.classList.add('hidden');
}

document.addEventListener('click', e => {
  const menu = document.querySelector('.avatar-menu');
  if (menu && !menu.contains(e.target)) closeAvatarMenu();
});

// ===== TOAST NOTIFICATIONS =====
function showToast(title, msg, type = 'info') {
  const container = document.getElementById('toast-container');
  const icons = { success: '✅', error: '❌', info: 'ℹ️' };
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span class="toast-icon">${icons[type]||'ℹ️'}</span><div><strong>${escHtml(title)}</strong>${msg ? `<div style="font-size:12px;color:var(--text-muted);margin-top:2px">${escHtml(msg)}</div>` : ''}</div>`;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 4200);
}

// ===== API HELPERS =====
async function apiCall(method, path, body) {
  try {
    const opts = {
      method,
      headers: { 'Content-Type': 'application/json' }
    };
    if (state.token) opts.headers['Authorization'] = `Bearer ${state.token}`;
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(`${API}${path}`, opts);
    return await res.json();
  } catch (err) {
    console.error('API error:', err);
    return { success: false, message: 'Network error' };
  }
}

async function apiCallForm(method, path, formData) {
  try {
    const opts = { method, headers: {}, body: formData };
    if (state.token) opts.headers['Authorization'] = `Bearer ${state.token}`;
    const res = await fetch(`${API}${path}`, opts);
    return await res.json();
  } catch (err) {
    console.error('API error:', err);
    return { success: false, message: 'Network error' };
  }
}

// ===== UTILITY FUNCTIONS =====
function escHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const now = new Date();
  const diff = (now - d) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff/60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff/3600)}h ago`;
  if (diff < 2592000) return `${Math.floor(diff/86400)}d ago`;
  return d.toLocaleDateString();
}

function formatDate(dateStr) {
  if (!dateStr) return 'Unknown';
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

function renderStars(avg) {
  const full = Math.round(avg);
  return '★'.repeat(full) + '☆'.repeat(5 - full);
}

function getCategoryEmoji(cat) {
  const map = {
    Electronics:'📱', Clothing:'👗', Books:'📚', Furniture:'🛋️',
    Sports:'⚽', Toys:'🧸', Music:'🎵', Art:'🎨',
    Vehicles:'🚗', Tools:'🔧', Kitchen:'🍳', Jewelry:'💎',
    Garden:'🌱', Health:'💊', Other:'📦'
  };
  return map[cat] || '📦';
}

function getNotifIcon(type) {
  const map = {
    trade_proposal:'🤝', trade_accepted:'🎉', trade_rejected:'❌',
    trade_completed:'✅', trade_cancelled:'🚫', new_message:'💬',
    item_liked:'❤️', rating_received:'⭐', system:'📢'
  };
  return map[type] || '🔔';
}
