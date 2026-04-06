const STORAGE_KEY = "buwai-studio-data-v2";
const LEGACY_STORAGE_KEY = "buwai-studio-data-v1";
const SESSION_KEY = "buwai-studio-session-v2";
const ACTIVE_HOURS = 72;

const createId = () =>
  globalThis.crypto?.randomUUID?.() ??
  `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;

const nowIso = () => new Date().toISOString();

const createDefaultAdmin = () => ({
  id: createId(),
  fullName: "Buwai Studio Yönetici",
  username: "admin",
  password: "Buwai2026!",
  age: "24",
  contact: "Discord: buwai",
  role: "admin",
  createdAt: nowIso(),
  lastSeen: nowIso(),
});

const defaultState = {
  settings: {
    brandName: "Buwai Studio",
    heroTitle: "Script Kodlama Merkezi",
    heroText:
      "FiveM, MTA ve Minecraft için eğitimlerini, script kodlarını ve müşteri taleplerini tek merkezden yönet.",
    heroImage:
      "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1400&q=80",
    aboutTitle: "Neler Yapıyorum?",
    aboutText:
      "FiveM, MTA ve Minecraft için özel script geliştirme, eğitim hazırlama, satış yönetimi ve müşteri taleplerini tek sistem üzerinden topluyorum.",
    aboutImage:
      "https://images.unsplash.com/photo-1526379095098-d400fd0bf935?auto=format&fit=crop&w=1200&q=80",
    developerName: "Buwai_jr",
    developerRole: "Geliştirici",
    developerImage:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=1000&q=80",
    educationImage:
      "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80",
    storeImage:
      "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1200&q=80",
  },
  announcements: [
    {
      id: createId(),
      title: "Buwai Studio açıldı",
      body: "Yeni eğitim videoları, script kodları ve duyurular bu alandan paylaşılacak.",
      createdAt: nowIso(),
    },
  ],
  users: [createDefaultAdmin()],
  education: {
    categories: [
      {
        id: createId(),
        name: "FiveM Sunucu Kurulumu",
        description: "Kurulum, temel ayarlar ve optimizasyon adımları.",
        videos: [
          {
            id: createId(),
            title: "FiveM kurulum temelleri",
            url: "https://www.youtube.com/watch?v=M7lc1UVf-VE",
            description: "Kurulum mantığını adım adım anlatan başlangıç videosu.",
          },
          {
            id: createId(),
            title: "FiveM optimizasyon düzeni",
            url: "https://www.youtube.com/watch?v=ysz5S6PUM-U",
            description: "Performans tarafını toparlayan eğitim videosu.",
          },
        ],
      },
      {
        id: createId(),
        name: "Minecraft Script Yapısı",
        description: "Sunucu düzeni, paketleme ve temel mantık.",
        videos: [
          {
            id: createId(),
            title: "Minecraft script düzeni",
            url: "https://www.youtube.com/watch?v=aqz-KE-bpKQ",
            description: "Dosya yapısına ve içerik düzenine giriş.",
          },
        ],
      },
    ],
  },
  store: {
    products: [
      {
        id: createId(),
        name: "FiveM Job System",
        game: "FiveM",
        type: "Meslek Scripti",
        price: 1250,
        isFree: false,
        image:
          "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1200&q=80",
        summary: "Görev tabanlı, panel destekli meslek sistemi.",
        description:
          "Meslek paneli, ödül mantığı, kolay düzenlenebilir yapı ve rol akışı ile gelir.",
      },
      {
        id: createId(),
        name: "MTA HUD Pack",
        game: "MTA",
        type: "Arayüz Scripti",
        price: 0,
        isFree: true,
        image:
          "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=1200&q=80",
        summary: "Sade, hızlı ve modern HUD paketi.",
        description:
          "Performans dostu görünüm, okunaklı alanlar ve düzenli kullanıcı deneyimi sunar.",
      },
      {
        id: createId(),
        name: "Minecraft Market Core",
        game: "Minecraft",
        type: "Ekonomi Scripti",
        price: 890,
        isFree: false,
        image:
          "https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?auto=format&fit=crop&w=1200&q=80",
        summary: "Market, ekonomi ve yönetim çekirdeği.",
        description:
          "Sunucu marketi, para döngüsü, yönetici kontrol alanı ve temiz dosya yapısı içerir.",
      },
    ],
  },
  requests: [],
  carts: {},
};

const cloneDefaultState = () => JSON.parse(JSON.stringify(defaultState));

function mergeState(rawState) {
  const base = cloneDefaultState();
  const merged = {
    ...base,
    ...rawState,
    settings: { ...base.settings, ...(rawState.settings ?? {}) },
    announcements: Array.isArray(rawState.announcements)
      ? rawState.announcements
      : Array.isArray(rawState.settings?.publicMessages)
        ? rawState.settings.publicMessages
        : base.announcements,
    users: Array.isArray(rawState.users) ? rawState.users : base.users,
    education: {
      ...base.education,
      ...(rawState.education ?? {}),
      categories: Array.isArray(rawState.education?.categories)
        ? rawState.education.categories
        : base.education.categories,
    },
    store: {
      ...base.store,
      ...(rawState.store ?? {}),
      products: Array.isArray(rawState.store?.products)
        ? rawState.store.products
        : base.store.products,
    },
    requests: Array.isArray(rawState.requests) ? rawState.requests : base.requests,
    carts: rawState.carts && typeof rawState.carts === "object" ? rawState.carts : base.carts,
  };

  if (!merged.users.some((user) => user.role === "admin")) {
    merged.users.unshift(createDefaultAdmin());
  }

  return merged;
}

function loadState() {
  const current = localStorage.getItem(STORAGE_KEY);
  if (current) {
    try {
      return mergeState(JSON.parse(current));
    } catch (error) {
      console.error(error);
    }
  }

  const legacy = localStorage.getItem(LEGACY_STORAGE_KEY);
  if (legacy) {
    try {
      const parsedLegacy = JSON.parse(legacy);
      return mergeState({
        settings: parsedLegacy.settings,
        announcements: parsedLegacy.settings?.publicMessages ?? [],
        education: parsedLegacy.education,
        store: parsedLegacy.store,
        requests: parsedLegacy.requests,
        carts: parsedLegacy.cart?.length ? { guest: parsedLegacy.cart } : {},
      });
    } catch (error) {
      console.error(error);
    }
  }

  return cloneDefaultState();
}

let state = loadState();
let sessionUserId = localStorage.getItem(SESSION_KEY);

if (sessionUserId && !state.users.some((user) => user.id === sessionUserId)) {
  sessionUserId = "";
  localStorage.removeItem(SESSION_KEY);
}

const ui = {
  route: "home",
  authMode: "login",
  editor: null,
  selectedProductId: null,
  selectedCategoryId: state.education.categories[0]?.id ?? null,
  selectedVideoId: state.education.categories[0]?.videos[0]?.id ?? null,
};

const views = {
  home: document.getElementById("homeView"),
  hub: document.getElementById("hubView"),
  education: document.getElementById("educationView"),
  store: document.getElementById("storeView"),
  announcements: document.getElementById("announcementsView"),
  dashboard: document.getElementById("dashboardView"),
};

const brandNameLabel = document.getElementById("brandNameLabel");
const heroTitle = document.getElementById("heroTitle");
const heroText = document.getElementById("heroText");
const heroVisual = document.getElementById("heroVisual");
const aboutTitle = document.getElementById("aboutTitle");
const aboutText = document.getElementById("aboutText");
const aboutVisual = document.getElementById("aboutVisual");
const developerName = document.getElementById("developerName");
const developerRole = document.getElementById("developerRole");
const developerVisual = document.getElementById("developerVisual");
const educationVisual = document.getElementById("educationVisual");
const storeVisual = document.getElementById("storeVisual");
const educationSidebar = document.getElementById("educationSidebar");
const videoPreview = document.getElementById("videoPreview");
const videoTitle = document.getElementById("videoTitle");
const videoDescription = document.getElementById("videoDescription");
const videoList = document.getElementById("videoList");
const productGrid = document.getElementById("productGrid");
const announcementList = document.getElementById("announcementList");
const statsGrid = document.getElementById("statsGrid");
const securityPanel = document.getElementById("securityPanel");
const usersPanel = document.getElementById("usersPanel");
const requestPanel = document.getElementById("requestPanel");
const contentPanel = document.getElementById("contentPanel");
const settingsForm = document.getElementById("settingsForm");
const openCartButton = document.getElementById("openCartButton");
const openAuthButton = document.getElementById("openAuthButton");
const cartCount = document.getElementById("cartCount");
const authModal = document.getElementById("authModal");
const authModalBody = document.getElementById("authModalBody");
const productModal = document.getElementById("productModal");
const productModalBody = document.getElementById("productModalBody");
const cartModal = document.getElementById("cartModal");
const cartModalBody = document.getElementById("cartModalBody");
const editorModal = document.getElementById("editorModal");
const editorModalBody = document.getElementById("editorModalBody");
const toastStack = document.getElementById("toastStack");

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function saveSession() {
  if (sessionUserId) localStorage.setItem(SESSION_KEY, sessionUserId);
  else localStorage.removeItem(SESSION_KEY);
}

function showToast(message, type = "info") {
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.textContent = message;
  toastStack.appendChild(toast);
  setTimeout(() => {
    toast.remove();
  }, 3200);
}

function getCurrentUser() {
  return state.users.find((user) => user.id === sessionUserId) ?? null;
}

function isAdmin() {
  return getCurrentUser()?.role === "admin";
}

function touchCurrentUser() {
  const currentUser = getCurrentUser();
  if (!currentUser) return;
  currentUser.lastSeen = nowIso();
  saveState();
}

function getActiveUserCount() {
  const limit = ACTIVE_HOURS * 60 * 60 * 1000;
  return state.users.filter((user) => {
    if (!user.lastSeen) return false;
    return Date.now() - new Date(user.lastSeen).getTime() <= limit;
  }).length;
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatPrice(product) {
  return product.isFree
    ? "Ücretsiz"
    : `${Number(product.price || 0).toLocaleString("tr-TR")} TL`;
}

function getCartKey() {
  return sessionUserId || "guest";
}

function getCurrentCart() {
  return state.carts[getCartKey()] ?? [];
}

function setCurrentCart(cartItems) {
  state.carts[getCartKey()] = cartItems;
  saveState();
}

function getCartProducts() {
  return getCurrentCart()
    .map((productId) => state.store.products.find((product) => product.id === productId))
    .filter(Boolean);
}

function syncSelection() {
  const categories = state.education.categories;
  if (!categories.length) {
    ui.selectedCategoryId = null;
    ui.selectedVideoId = null;
    return;
  }

  if (!categories.some((category) => category.id === ui.selectedCategoryId)) {
    ui.selectedCategoryId = categories[0].id;
  }

  const selectedCategory = getSelectedCategory();
  if (!selectedCategory?.videos.some((video) => video.id === ui.selectedVideoId)) {
    ui.selectedVideoId = selectedCategory?.videos[0]?.id ?? null;
  }
}

function getSelectedCategory() {
  return state.education.categories.find((category) => category.id === ui.selectedCategoryId) ?? null;
}

function getSelectedVideo() {
  return getSelectedCategory()?.videos.find((video) => video.id === ui.selectedVideoId) ?? null;
}

function getSelectedProduct() {
  return state.store.products.find((product) => product.id === ui.selectedProductId) ?? null;
}

function getYouTubeId(url = "") {
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([^&]+)/,
    /(?:youtu\.be\/)([^?]+)/,
    /(?:youtube\.com\/embed\/)([^?]+)/,
  ];
  const match = patterns.map((pattern) => url.match(pattern)).find(Boolean);
  return match?.[1] ?? "";
}

function isYouTubeUrl(url = "") {
  return Boolean(getYouTubeId(url));
}

function isDirectVideoUrl(url = "") {
  return /\.(mp4|webm|ogg)$/i.test(url);
}

function getVideoThumbnail(url = "") {
  const youtubeId = getYouTubeId(url);
  if (youtubeId) return `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`;
  return "https://placehold.co/900x600/09111d/EFF4FC?text=Video";
}

function getYouTubeEmbedUrl(url = "") {
  const youtubeId = getYouTubeId(url);
  if (!youtubeId) return "";
  const origin =
    window.location.protocol === "file:" ? "http://localhost" : window.location.origin;
  return `https://www.youtube-nocookie.com/embed/${youtubeId}?rel=0&origin=${encodeURIComponent(origin)}`;
}

function openModal(modalElement) {
  modalElement.classList.remove("hidden");
}

function closeModal(modalElement) {
  modalElement.classList.add("hidden");
}

function setRoute(route) {
  const nextRoute = route === "dashboard" && !isAdmin() ? "home" : route;
  ui.route = nextRoute;

  Object.entries(views).forEach(([key, element]) => {
    element.classList.toggle("active", key === nextRoute);
  });

  document.querySelectorAll(".topnav .nav-link").forEach((button) => {
    button.classList.toggle("active", button.dataset.route === nextRoute);
  });
}

function renderTopbar() {
  const currentUser = getCurrentUser();
  const adminVisible = isAdmin();

  document.querySelectorAll(".admin-only").forEach((element) => {
    element.classList.toggle("hidden", !adminVisible);
  });

  brandNameLabel.textContent = state.settings.brandName;
  openAuthButton.textContent = currentUser ? `${currentUser.fullName.split(" ")[0]} hesabı` : "Oturum Aç";
  cartCount.textContent = String(getCurrentCart().length);

  if (!adminVisible && ui.route === "dashboard") setRoute("home");
}

function renderHome() {
  heroTitle.textContent = state.settings.heroTitle;
  heroText.textContent = state.settings.heroText;
  heroVisual.style.backgroundImage = `url("${state.settings.heroImage}")`;
  aboutTitle.textContent = state.settings.aboutTitle;
  aboutText.textContent = state.settings.aboutText;
  aboutVisual.style.backgroundImage = `url("${state.settings.aboutImage}")`;
  developerName.textContent = state.settings.developerName;
  developerRole.textContent = state.settings.developerRole;
  developerVisual.style.backgroundImage = `url("${state.settings.developerImage}")`;
  educationVisual.style.backgroundImage = `url("${state.settings.educationImage}")`;
  storeVisual.style.backgroundImage = `url("${state.settings.storeImage}")`;
}

function renderEducation() {
  syncSelection();
  const categories = state.education.categories;

  educationSidebar.innerHTML = `
    <div class="panel-heading">
      <div>
        <h3>Oynatma listeleri</h3>
        <p class="muted">Ders başlıklarını soldan seç.</p>
      </div>
    </div>
    ${
      categories.length
        ? categories
            .map(
              (category) => `
                <button
                  class="category-button ${category.id === ui.selectedCategoryId ? "active" : ""}"
                  data-action="selectCategory"
                  data-category-id="${category.id}"
                  type="button"
                >
                  <strong>${escapeHtml(category.name)}</strong>
                  <div class="muted">${escapeHtml(category.description)}</div>
                  <small>${category.videos.length} video</small>
                </button>
              `,
            )
            .join("")
        : `<div class="empty-state">Henüz liste yok.</div>`
    }
  `;

  const selectedVideo = getSelectedVideo();
  if (!selectedVideo) {
    videoPreview.innerHTML = `<div class="video-empty">Henüz seçili video yok.</div>`;
    videoTitle.textContent = "Bir video seç";
    videoDescription.textContent = "Burada izleme alanı görünecek.";
    videoList.innerHTML = `<div class="empty-state">Video bulunamadı.</div>`;
    return;
  }

  videoTitle.textContent = selectedVideo.title;
  videoDescription.textContent = selectedVideo.description;

  if (isDirectVideoUrl(selectedVideo.url)) {
    videoPreview.innerHTML = `<video controls src="${escapeHtml(selectedVideo.url)}"></video>`;
  } else if (isYouTubeUrl(selectedVideo.url)) {
    videoPreview.innerHTML = `
      <div class="video-cover-preview">
        <img src="${escapeHtml(getVideoThumbnail(selectedVideo.url))}" alt="${escapeHtml(selectedVideo.title)}" />
        <div class="video-cover-overlay">
          <span class="status-pill">Kapak Önizlemesi</span>
          <button
            class="primary-button"
            data-action="openExternalVideo"
            data-video-url="${escapeHtml(selectedVideo.url)}"
            type="button"
          >
            Videoyu Aç
          </button>
        </div>
      </div>
    `;
  } else {
    videoPreview.innerHTML = `<div class="video-empty">Bu bağlantı yerleşik oynatıcı için uygun görünmüyor.</div>`;
  }

  videoList.innerHTML = getSelectedCategory()?.videos.length
    ? getSelectedCategory().videos
        .map(
          (video) => `
            <article class="video-item ${video.id === ui.selectedVideoId ? "active" : ""}">
              <div class="video-thumb">
                <img src="${escapeHtml(getVideoThumbnail(video.url))}" alt="${escapeHtml(video.title)}" />
              </div>
              <div>
                <button
                  class="link-button"
                  data-action="playVideo"
                  data-video-id="${video.id}"
                  type="button"
                >
                  <strong>${escapeHtml(video.title)}</strong>
                </button>
                <p class="muted">${escapeHtml(video.description)}</p>
              </div>
              ${
                isAdmin()
                  ? `
                    <div class="card-actions">
                      <button
                        class="secondary-button"
                        data-action="editVideo"
                        data-video-id="${video.id}"
                        type="button"
                      >
                        Düzenle
                      </button>
                      <button
                        class="danger-button"
                        data-action="deleteVideo"
                        data-video-id="${video.id}"
                        type="button"
                      >
                        Sil
                      </button>
                    </div>
                  `
                  : ""
              }
            </article>
          `,
        )
        .join("")
    : `<div class="empty-state">Bu listede video yok.</div>`;
}

function renderStore() {
  productGrid.innerHTML = state.store.products.length
    ? state.store.products
        .map(
          (product) => `
            <button
              class="product-card"
              data-action="openProduct"
              data-product-id="${product.id}"
              type="button"
            >
              <div class="product-cover-wrap">
                <img class="product-cover" src="${escapeHtml(product.image)}" alt="${escapeHtml(product.name)}" />
              </div>
              <div class="product-meta">
                <span class="tag">${escapeHtml(product.game)} / ${escapeHtml(product.type)}</span>
                <span class="price-pill">${formatPrice(product)}</span>
              </div>
              <h3>${escapeHtml(product.name)}</h3>
              <p class="muted">${escapeHtml(product.summary)}</p>
            </button>
          `,
        )
        .join("")
    : `<div class="empty-state">Henüz ürün yok.</div>`;
}

function renderAnnouncements() {
  announcementList.innerHTML = state.announcements.length
    ? state.announcements
        .slice()
        .reverse()
        .map(
          (announcement) => `
            <article class="announcement-card">
              <div class="panel-heading">
                <div>
                  <h3>${escapeHtml(announcement.title)}</h3>
                  <p class="muted">${new Date(announcement.createdAt).toLocaleString("tr-TR")}</p>
                </div>
              </div>
              <p>${escapeHtml(announcement.body)}</p>
            </article>
          `,
        )
        .join("")
    : `<div class="empty-state">Henüz duyuru yok.</div>`;
}

function renderDashboard() {
  if (!isAdmin()) return;

  const pendingRequests = state.requests.filter((request) => request.status === "Beklemede").length;
  settingsForm.brandName.value = state.settings.brandName;
  settingsForm.heroTitle.value = state.settings.heroTitle;
  settingsForm.heroText.value = state.settings.heroText;
  settingsForm.heroImage.value = state.settings.heroImage;
  settingsForm.aboutTitle.value = state.settings.aboutTitle;
  settingsForm.aboutText.value = state.settings.aboutText;
  settingsForm.aboutImage.value = state.settings.aboutImage;
  settingsForm.developerName.value = state.settings.developerName;
  settingsForm.developerRole.value = state.settings.developerRole;
  settingsForm.developerImage.value = state.settings.developerImage;
  settingsForm.educationImage.value = state.settings.educationImage;
  settingsForm.storeImage.value = state.settings.storeImage;

  statsGrid.innerHTML = `
    <article class="stats-card">
      <span class="eyebrow">Kayıtlı Kullanıcı</span>
      <strong>${state.users.length}</strong>
      <p class="muted">Kayıt olmuş toplam hesap sayısı</p>
    </article>
    <article class="stats-card">
      <span class="eyebrow">Aktif Kullanıcı</span>
      <strong>${getActiveUserCount()}</strong>
      <p class="muted">Son ${ACTIVE_HOURS} saatte görülen hesaplar</p>
    </article>
    <article class="stats-card">
      <span class="eyebrow">Bekleyen Talep</span>
      <strong>${pendingRequests}</strong>
      <p class="muted">Yanıt veya onay bekleyen siparişler</p>
    </article>
    <article class="stats-card">
      <span class="eyebrow">Toplam Ürün</span>
      <strong>${state.store.products.length}</strong>
      <p class="muted">Mağaza alanındaki ürün sayısı</p>
    </article>
  `;

  securityPanel.innerHTML = `
    <div class="panel-heading">
      <div>
        <h3>Güvenlik</h3>
        <p class="muted">Yönetici şifresi ve oturum güvenliği</p>
      </div>
    </div>
    <div class="account-summary">
      <strong>${escapeHtml(getCurrentUser()?.fullName ?? "")}</strong>
      <p class="muted">Varsayılan yönetici girişi: kullanıcı adı <strong>admin</strong>, şifre <strong>Buwai2026!</strong></p>
    </div>
    <form class="form-stack" id="securityForm">
      <label>
        <span>Mevcut Şifre</span>
        <input name="currentPassword" type="password" required />
      </label>
      <label>
        <span>Yeni Şifre</span>
        <input name="newPassword" type="password" minlength="6" required />
      </label>
      <label>
        <span>Yeni Şifre Tekrar</span>
        <input name="confirmPassword" type="password" minlength="6" required />
      </label>
      <button class="primary-button" type="submit">Şifreyi Güncelle</button>
    </form>
  `;

  usersPanel.innerHTML = `
    <div class="panel-heading">
      <div>
        <h3>Kullanıcılar</h3>
        <p class="muted">Kayıtlı hesap ve son görülme bilgileri</p>
      </div>
    </div>
    <div class="stack-list">
      ${state.users
        .map(
          (user) => `
            <article class="user-card">
              <div class="user-meta">
                <div>
                  <strong>${escapeHtml(user.fullName)}</strong>
                  <p class="muted">@${escapeHtml(user.username)} • ${user.role === "admin" ? "Yönetici" : "Kullanıcı"}</p>
                </div>
                <span class="status-pill">
                  ${Date.now() - new Date(user.lastSeen ?? user.createdAt).getTime() <= ACTIVE_HOURS * 60 * 60 * 1000 ? "Aktif" : "Pasif"}
                </span>
              </div>
              <p class="muted">İletişim: ${escapeHtml(user.contact)}</p>
              <p class="muted">Son görülme: ${new Date(user.lastSeen ?? user.createdAt).toLocaleString("tr-TR")}</p>
            </article>
          `,
        )
        .join("")}
    </div>
  `;

  requestPanel.innerHTML = `
    <div class="panel-heading">
      <div>
        <h3>Talep Kutusu</h3>
        <p class="muted">Bu alan yalnızca yöneticiye görünür.</p>
      </div>
    </div>
    <div class="stack-list">
      ${
        state.requests.length
          ? state.requests
              .map(
                (request) => `
                  <article class="request-card">
                    <div class="panel-heading">
                      <div>
                        <strong>${escapeHtml(request.fullName)}</strong>
                        <p class="muted">${new Date(request.createdAt).toLocaleString("tr-TR")}</p>
                      </div>
                      <span class="status-pill">${escapeHtml(request.status)}</span>
                    </div>
                    <p><strong>İletişim:</strong> ${escapeHtml(request.contact)}</p>
                    <p><strong>Yaş:</strong> ${escapeHtml(request.age)}</p>
                    <p><strong>Ürünler:</strong> ${escapeHtml(request.items.join(", "))}</p>
                    <p><strong>Not:</strong> ${escapeHtml(request.note || "-")}</p>
                    ${request.adminReply ? `<p><strong>Yönetici Yanıtı:</strong> ${escapeHtml(request.adminReply)}</p>` : ""}
                    <div class="request-actions">
                      <button class="status-button" data-action="approveRequest" data-request-id="${request.id}" type="button">Onayla</button>
                      <button class="secondary-button" data-action="replyRequest" data-request-id="${request.id}" type="button">Yanıtla</button>
                      <button class="danger-button" data-action="deleteRequest" data-request-id="${request.id}" type="button">Sil</button>
                    </div>
                  </article>
                `,
              )
              .join("")
          : `<div class="empty-state">Henüz sipariş talebi yok.</div>`
      }
    </div>
  `;

  contentPanel.innerHTML = `
    <div class="panel-heading">
      <div>
        <h3>İçerik Yönetimi</h3>
        <p class="muted">Liste, video, ürün ve duyuruları buradan yönet.</p>
      </div>
      <div class="card-actions">
        <button class="secondary-button" data-action="openEditor" data-editor="category" type="button">Liste Ekle</button>
        <button class="secondary-button" data-action="openEditor" data-editor="video" type="button">Video Ekle</button>
        <button class="secondary-button" data-action="openEditor" data-editor="product" type="button">Ürün Ekle</button>
        <button class="secondary-button" data-action="openEditor" data-editor="announcement" type="button">Duyuru Ekle</button>
      </div>
    </div>
    <div class="stack-list">
      ${state.education.categories
        .map(
          (category) => `
            <article class="content-card">
              <div class="panel-heading">
                <div>
                  <strong>${escapeHtml(category.name)}</strong>
                  <p class="muted">${escapeHtml(category.description)}</p>
                </div>
                <div class="card-actions">
                  <button class="secondary-button" data-action="editCategory" data-category-id="${category.id}" type="button">Düzenle</button>
                  <button class="danger-button" data-action="deleteCategory" data-category-id="${category.id}" type="button">Sil</button>
                </div>
              </div>
              <p class="muted">${category.videos.length} video içeriyor</p>
            </article>
          `,
        )
        .join("")}
      ${state.store.products
        .map(
          (product) => `
            <article class="content-card">
              <div class="panel-heading">
                <div>
                  <strong>${escapeHtml(product.name)}</strong>
                  <p class="muted">${escapeHtml(product.game)} / ${escapeHtml(product.type)}</p>
                </div>
                <div class="card-actions">
                  <button class="secondary-button" data-action="editProduct" data-product-id="${product.id}" type="button">Düzenle</button>
                  <button class="danger-button" data-action="deleteProduct" data-product-id="${product.id}" type="button">Sil</button>
                </div>
              </div>
            </article>
          `,
        )
        .join("")}
      ${state.announcements
        .map(
          (announcement) => `
            <article class="content-card">
              <div class="panel-heading">
                <div>
                  <strong>${escapeHtml(announcement.title)}</strong>
                  <p class="muted">${new Date(announcement.createdAt).toLocaleDateString("tr-TR")}</p>
                </div>
                <div class="card-actions">
                  <button class="secondary-button" data-action="editAnnouncement" data-announcement-id="${announcement.id}" type="button">Düzenle</button>
                  <button class="danger-button" data-action="deleteAnnouncement" data-announcement-id="${announcement.id}" type="button">Sil</button>
                </div>
              </div>
            </article>
          `,
        )
        .join("")}
    </div>
  `;
}

function renderAuthModal() {
  const currentUser = getCurrentUser();
  if (currentUser) {
    authModalBody.innerHTML = `
      <h2>Oturum Bilgileri</h2>
      <div class="account-summary">
        <strong>${escapeHtml(currentUser.fullName)}</strong>
        <p class="muted">@${escapeHtml(currentUser.username)} • ${currentUser.role === "admin" ? "Yönetici" : "Kullanıcı"}</p>
        <p class="muted">İletişim: ${escapeHtml(currentUser.contact)}</p>
        <p class="muted">Sepet ve sipariş formları bilgilerinizle otomatik dolar.</p>
      </div>
      <div class="card-actions">
        ${isAdmin() ? `<button class="secondary-button" data-route="dashboard" type="button">Yönetim Paneli</button>` : ""}
        <button class="danger-button" data-action="logout" type="button">Çıkış Yap</button>
      </div>
    `;
    return;
  }

  authModalBody.innerHTML = `
    <h2>Oturum Yönetimi</h2>
    <div class="auth-tabs">
      <button class="auth-tab ${ui.authMode === "login" ? "active" : ""}" data-action="switchAuthMode" data-mode="login" type="button">Giriş Yap</button>
      <button class="auth-tab ${ui.authMode === "register" ? "active" : ""}" data-action="switchAuthMode" data-mode="register" type="button">Kayıt Ol</button>
    </div>

    <form class="form-stack ${ui.authMode === "login" ? "" : "hidden"}" id="loginForm">
      <label>
        <span>Kullanıcı Adı</span>
        <input name="username" required />
      </label>
      <label>
        <span>Şifre</span>
        <input name="password" type="password" required />
      </label>
      <button class="primary-button" type="submit">Oturum Aç</button>
    </form>

    <form class="form-stack ${ui.authMode === "register" ? "" : "hidden"}" id="registerForm">
      <label>
        <span>Ad Soyad</span>
        <input name="fullName" required />
      </label>
      <label>
        <span>Kullanıcı Adı</span>
        <input name="username" required />
      </label>
      <div class="form-row">
        <label>
          <span>Yaş</span>
          <input name="age" required />
        </label>
        <label>
          <span>İletişim</span>
          <input name="contact" required placeholder="Discord veya DM" />
        </label>
      </div>
      <label>
        <span>Şifre</span>
        <input name="password" type="password" minlength="6" required />
      </label>
      <label>
        <span>Şifre Tekrar</span>
        <input name="confirmPassword" type="password" minlength="6" required />
      </label>
      <button class="primary-button" type="submit">Kayıt Ol</button>
    </form>
  `;
}

function renderProductModal() {
  const selectedProduct = getSelectedProduct();
  if (!selectedProduct) {
    productModalBody.innerHTML = "";
    return;
  }

  productModalBody.innerHTML = `
    <div class="product-detail">
      <div class="product-detail-visual">
        <img class="product-cover" src="${escapeHtml(selectedProduct.image)}" alt="${escapeHtml(selectedProduct.name)}" />
      </div>
      <div class="form-stack">
        <span class="tag">${escapeHtml(selectedProduct.game)} / ${escapeHtml(selectedProduct.type)}</span>
        <h2>${escapeHtml(selectedProduct.name)}</h2>
        <span class="price-pill">${formatPrice(selectedProduct)}</span>
        <p>${escapeHtml(selectedProduct.description)}</p>
        <p class="muted">${escapeHtml(selectedProduct.summary)}</p>
        <button class="primary-button" data-action="addToCart" data-product-id="${selectedProduct.id}" type="button">Sepete Ekle</button>
      </div>
    </div>
  `;
}

function renderCartModal() {
  const cartProducts = getCartProducts();
  const currentUser = getCurrentUser();

  if (!cartProducts.length) {
    cartModalBody.innerHTML = `
      <h2>Sepet</h2>
      <div class="empty-state">Sepetiniz şu anda boş.</div>
    `;
    return;
  }

  const total = cartProducts.reduce(
    (sum, product) => sum + (product.isFree ? 0 : Number(product.price || 0)),
    0,
  );

  cartModalBody.innerHTML = `
    <h2>Sepet</h2>
    <div class="stack-list">
      ${cartProducts
        .map(
          (product) => `
            <article class="content-card">
              <div class="panel-heading">
                <div>
                  <strong>${escapeHtml(product.name)}</strong>
                  <p class="muted">${escapeHtml(product.game)} / ${escapeHtml(product.type)}</p>
                </div>
                <div class="card-actions">
                  <span class="price-pill">${formatPrice(product)}</span>
                  <button class="danger-button" data-action="removeFromCart" data-product-id="${product.id}" type="button">Sil</button>
                </div>
              </div>
            </article>
          `,
        )
        .join("")}
    </div>
    <div class="account-summary">
      <strong>Toplam: ${total.toLocaleString("tr-TR")} TL</strong>
      <p class="muted">İletişim ile satış akışı bu formdan başlar.</p>
    </div>
    ${
      currentUser
        ? `
          <form class="form-stack" id="checkoutForm">
            <label>
              <span>Ad Soyad</span>
              <input name="fullName" value="${escapeHtml(currentUser.fullName)}" required />
            </label>
            <div class="form-row">
              <label>
                <span>Yaş</span>
                <input name="age" value="${escapeHtml(currentUser.age)}" required />
              </label>
              <label>
                <span>İletişim</span>
                <input name="contact" value="${escapeHtml(currentUser.contact)}" required />
              </label>
            </div>
            <label>
              <span>Ek Not</span>
              <textarea name="note" rows="4" placeholder="Özel isteklerini yazabilirsin"></textarea>
            </label>
            <button class="primary-button" type="submit">Talebi Gönder</button>
          </form>
        `
        : `
          <div class="helper-card">
            İsim ve iletişim bilgilerinin otomatik dolması için önce oturum açman gerekir.
          </div>
          <button class="primary-button" data-action="openAuthFromCart" type="button">Oturum Aç</button>
        `
    }
  `;
}

function findVideoById(videoId) {
  for (const category of state.education.categories) {
    const video = category.videos.find((item) => item.id === videoId);
    if (video) return { category, video };
  }
  return null;
}

function renderEditorModal() {
  if (!ui.editor || !isAdmin()) {
    editorModalBody.innerHTML = "";
    return;
  }

  const { type, id } = ui.editor;

  if (type === "category") {
    const category = state.education.categories.find((item) => item.id === id);
    editorModalBody.innerHTML = `
      <h2>${category ? "Liste Düzenle" : "Liste Ekle"}</h2>
      <form class="form-stack" id="categoryEditorForm">
        <input type="hidden" name="id" value="${escapeHtml(category?.id ?? "")}" />
        <label>
          <span>Liste Adı</span>
          <input name="name" value="${escapeHtml(category?.name ?? "")}" required />
        </label>
        <label>
          <span>Açıklama</span>
          <textarea name="description" rows="4" required>${escapeHtml(category?.description ?? "")}</textarea>
        </label>
        <button class="primary-button" type="submit">Kaydet</button>
      </form>
    `;
  }

  if (type === "video") {
    const record = findVideoById(id);
    const video = record?.video;
    editorModalBody.innerHTML = `
      <h2>${video ? "Video Düzenle" : "Video Ekle"}</h2>
      <form class="form-stack" id="videoEditorForm">
        <input type="hidden" name="id" value="${escapeHtml(video?.id ?? "")}" />
        <label>
          <span>Liste</span>
          <select name="categoryId" required>
            ${state.education.categories
              .map(
                (category) => `
                  <option value="${category.id}" ${category.id === (record?.category?.id ?? ui.selectedCategoryId) ? "selected" : ""}>
                    ${escapeHtml(category.name)}
                  </option>
                `,
              )
              .join("")}
          </select>
        </label>
        <label>
          <span>Video Başlığı</span>
          <input name="title" value="${escapeHtml(video?.title ?? "")}" required />
        </label>
        <label>
          <span>Video URL</span>
          <input name="url" value="${escapeHtml(video?.url ?? "")}" required />
        </label>
        <label>
          <span>Açıklama</span>
          <textarea name="description" rows="4" required>${escapeHtml(video?.description ?? "")}</textarea>
        </label>
        <button class="primary-button" type="submit">Kaydet</button>
      </form>
    `;
  }

  if (type === "product") {
    const product = state.store.products.find((item) => item.id === id);
    editorModalBody.innerHTML = `
      <h2>${product ? "Ürün Düzenle" : "Ürün Ekle"}</h2>
      <form class="form-stack" id="productEditorForm">
        <input type="hidden" name="id" value="${escapeHtml(product?.id ?? "")}" />
        <label>
          <span>Ürün Adı</span>
          <input name="name" value="${escapeHtml(product?.name ?? "")}" required />
        </label>
        <div class="form-row">
          <label>
            <span>Oyun</span>
            <input name="game" value="${escapeHtml(product?.game ?? "")}" required />
          </label>
          <label>
            <span>Tür</span>
            <input name="type" value="${escapeHtml(product?.type ?? "")}" required />
          </label>
        </div>
        <div class="form-row">
          <label>
            <span>Fiyat</span>
            <input name="price" value="${escapeHtml(String(product?.price ?? 0))}" required />
          </label>
          <label>
            <span>Görsel URL</span>
            <input name="image" value="${escapeHtml(product?.image ?? "")}" required />
          </label>
        </div>
        <label>
          <span>Kısa Özet</span>
          <textarea name="summary" rows="3" required>${escapeHtml(product?.summary ?? "")}</textarea>
        </label>
        <label>
          <span>Detaylı Açıklama</span>
          <textarea name="description" rows="5" required>${escapeHtml(product?.description ?? "")}</textarea>
        </label>
        <button class="primary-button" type="submit">Kaydet</button>
      </form>
    `;
  }

  if (type === "announcement") {
    const announcement = state.announcements.find((item) => item.id === id);
    editorModalBody.innerHTML = `
      <h2>${announcement ? "Duyuru Düzenle" : "Duyuru Ekle"}</h2>
      <form class="form-stack" id="announcementEditorForm">
        <input type="hidden" name="id" value="${escapeHtml(announcement?.id ?? "")}" />
        <label>
          <span>Başlık</span>
          <input name="title" value="${escapeHtml(announcement?.title ?? "")}" required />
        </label>
        <label>
          <span>İçerik</span>
          <textarea name="body" rows="5" required>${escapeHtml(announcement?.body ?? "")}</textarea>
        </label>
        <button class="primary-button" type="submit">Kaydet</button>
      </form>
    `;
  }

  if (type === "requestReply") {
    const request = state.requests.find((item) => item.id === id);
    editorModalBody.innerHTML = `
      <h2>Talebe Yanıt Yaz</h2>
      <form class="form-stack" id="requestReplyForm">
        <input type="hidden" name="id" value="${escapeHtml(request?.id ?? "")}" />
        <p class="muted">${escapeHtml(request?.fullName ?? "")} için yönetici notu yaz.</p>
        <label>
          <span>Yanıt</span>
          <textarea name="reply" rows="5" required>${escapeHtml(request?.adminReply ?? "")}</textarea>
        </label>
        <button class="primary-button" type="submit">Yanıtı Kaydet</button>
      </form>
    `;
  }
}

function openEditor(type, id = "") {
  ui.editor = { type, id };
  renderEditorModal();
  openModal(editorModal);
}

function closeEditor() {
  ui.editor = null;
  renderEditorModal();
  closeModal(editorModal);
}

function mergeGuestCartIntoUser(userId) {
  const guestCart = state.carts.guest ?? [];
  if (!guestCart.length) return;
  const userCart = state.carts[userId] ?? [];
  state.carts[userId] = [...new Set([...userCart, ...guestCart])];
  delete state.carts.guest;
}

function renderAll() {
  renderTopbar();
  renderHome();
  renderEducation();
  renderStore();
  renderAnnouncements();
  renderDashboard();
  renderAuthModal();
  renderProductModal();
  renderCartModal();
  renderEditorModal();
  setRoute(ui.route);
}

document.addEventListener("click", (event) => {
  const routeButton = event.target.closest("[data-route]");
  if (routeButton) {
    setRoute(routeButton.dataset.route);
    if (routeButton.dataset.route === "dashboard" && getCurrentUser()) {
      closeModal(authModal);
    }
    return;
  }

  const closeButton = event.target.closest("[data-close]");
  if (closeButton) {
    const targetModal = document.getElementById(closeButton.dataset.close);
    if (targetModal === editorModal) closeEditor();
    else closeModal(targetModal);
    return;
  }

  const actionButton = event.target.closest("[data-action]");
  if (!actionButton) return;
  const action = actionButton.dataset.action;

  if (action === "switchAuthMode") {
    ui.authMode = actionButton.dataset.mode;
    renderAuthModal();
  }

  if (action === "selectCategory") {
    ui.selectedCategoryId = actionButton.dataset.categoryId;
    ui.selectedVideoId = getSelectedCategory()?.videos[0]?.id ?? null;
    renderEducation();
  }

  if (action === "playVideo") {
    ui.selectedVideoId = actionButton.dataset.videoId;
    renderEducation();
  }

  if (action === "openProduct") {
    ui.selectedProductId = actionButton.dataset.productId;
    renderProductModal();
    openModal(productModal);
  }

  if (action === "addToCart") {
    const cart = getCurrentCart();
    if (!cart.includes(actionButton.dataset.productId)) {
      cart.push(actionButton.dataset.productId);
      setCurrentCart(cart);
      renderAll();
    }
    closeModal(productModal);
    openModal(cartModal);
  }

  if (action === "removeFromCart") {
    const nextCart = getCurrentCart().filter((productId) => productId !== actionButton.dataset.productId);
    setCurrentCart(nextCart);
    renderAll();
  }

  if (action === "openAuthFromCart") {
    ui.authMode = "login";
    renderAuthModal();
    closeModal(cartModal);
    openModal(authModal);
  }

  if (action === "logout") {
    sessionUserId = "";
    saveSession();
    if (ui.route === "dashboard") setRoute("home");
    renderAll();
    closeModal(authModal);
  }

  if (action === "openExternalVideo") {
    window.open(actionButton.dataset.videoUrl, "_blank", "noopener");
  }

  if (action === "openEditor" && isAdmin()) openEditor(actionButton.dataset.editor);
  if (action === "editCategory" && isAdmin()) openEditor("category", actionButton.dataset.categoryId);
  if (action === "editVideo" && isAdmin()) openEditor("video", actionButton.dataset.videoId);
  if (action === "editProduct" && isAdmin()) openEditor("product", actionButton.dataset.productId);
  if (action === "editAnnouncement" && isAdmin()) {
    openEditor("announcement", actionButton.dataset.announcementId);
  }
  if (action === "replyRequest" && isAdmin()) openEditor("requestReply", actionButton.dataset.requestId);

  if (action === "deleteCategory" && isAdmin()) {
    state.education.categories = state.education.categories.filter(
      (category) => category.id !== actionButton.dataset.categoryId,
    );
    saveState();
    syncSelection();
    renderAll();
  }

  if (action === "deleteVideo" && isAdmin()) {
    state.education.categories = state.education.categories.map((category) => ({
      ...category,
      videos: category.videos.filter((video) => video.id !== actionButton.dataset.videoId),
    }));
    saveState();
    syncSelection();
    renderAll();
  }

  if (action === "deleteProduct" && isAdmin()) {
    state.store.products = state.store.products.filter((product) => product.id !== actionButton.dataset.productId);
    saveState();
    renderAll();
  }

  if (action === "deleteAnnouncement" && isAdmin()) {
    state.announcements = state.announcements.filter(
      (announcement) => announcement.id !== actionButton.dataset.announcementId,
    );
    saveState();
    renderAll();
  }

  if (action === "approveRequest" && isAdmin()) {
    const request = state.requests.find((item) => item.id === actionButton.dataset.requestId);
    if (request) request.status = "Onaylandı";
    saveState();
    setRoute("dashboard");
    renderAll();
  }

  if (action === "deleteRequest" && isAdmin()) {
    state.requests = state.requests.filter((item) => item.id !== actionButton.dataset.requestId);
    saveState();
    setRoute("dashboard");
    renderAll();
  }
});

document.addEventListener("submit", (event) => {
  if (event.target === settingsForm) {
    event.preventDefault();
    const formData = new FormData(settingsForm);
    state.settings.brandName = String(formData.get("brandName"));
    state.settings.heroTitle = String(formData.get("heroTitle"));
    state.settings.heroText = String(formData.get("heroText"));
    state.settings.heroImage = String(formData.get("heroImage"));
    state.settings.aboutTitle = String(formData.get("aboutTitle"));
    state.settings.aboutText = String(formData.get("aboutText"));
    state.settings.aboutImage = String(formData.get("aboutImage"));
    state.settings.developerName = String(formData.get("developerName"));
    state.settings.developerRole = String(formData.get("developerRole"));
    state.settings.developerImage = String(formData.get("developerImage"));
    state.settings.educationImage = String(formData.get("educationImage"));
    state.settings.storeImage = String(formData.get("storeImage"));
    saveState();
    renderAll();
    showToast("Site ayarları güncellendi.", "success");
  }

  if (event.target.id === "securityForm") {
    event.preventDefault();
    const formData = new FormData(event.target);
    const currentUser = getCurrentUser();
    const currentPassword = String(formData.get("currentPassword"));
    const newPassword = String(formData.get("newPassword"));
    const confirmPassword = String(formData.get("confirmPassword"));

    if (!currentUser || currentUser.password !== currentPassword) {
      showToast("Mevcut şifre hatalı.", "error");
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast("Yeni şifre tekrar alanı eşleşmiyor.", "error");
      return;
    }

    currentUser.password = newPassword;
    saveState();
    event.target.reset();
    renderDashboard();
    showToast("Yönetici şifresi güncellendi.", "success");
  }

  if (event.target.id === "loginForm") {
    event.preventDefault();
    const formData = new FormData(event.target);
    const username = String(formData.get("username")).trim().toLowerCase();
    const password = String(formData.get("password"));
    const user = state.users.find(
      (item) => item.username.toLowerCase() === username && item.password === password,
    );

    if (!user) {
      showToast("Kullanıcı adı veya şifre hatalı.", "error");
      return;
    }

    sessionUserId = user.id;
    user.lastSeen = nowIso();
    mergeGuestCartIntoUser(user.id);
    saveState();
    saveSession();
    renderAll();
    closeModal(authModal);
    showToast("Oturum açıldı.", "success");
  }

  if (event.target.id === "registerForm") {
    event.preventDefault();
    const formData = new FormData(event.target);
    const fullName = String(formData.get("fullName")).trim();
    const username = String(formData.get("username")).trim();
    const age = String(formData.get("age")).trim();
    const contact = String(formData.get("contact")).trim();
    const password = String(formData.get("password"));
    const confirmPassword = String(formData.get("confirmPassword"));

    if (password !== confirmPassword) {
      showToast("Şifre tekrar alanı eşleşmiyor.", "error");
      return;
    }

    if (username.toLowerCase() === "admin") {
      ui.authMode = "login";
      renderAuthModal();
      showToast("admin kullanıcı adı yönetici hesabına ait. Giriş Yap bölümünü kullan.", "info");
      return;
    }

    if (state.users.some((user) => user.username.toLowerCase() === username.toLowerCase())) {
      showToast("Bu kullanıcı adı zaten kayıtlı.", "error");
      return;
    }

    const newUser = {
      id: createId(),
      fullName,
      username,
      age,
      contact,
      password,
      role: "user",
      createdAt: nowIso(),
      lastSeen: nowIso(),
    };

    state.users.push(newUser);
    sessionUserId = newUser.id;
    mergeGuestCartIntoUser(newUser.id);
    saveState();
    saveSession();
    renderAll();
    closeModal(authModal);
    showToast("Kayıt tamamlandı ve oturum açıldı.", "success");
  }

  if (event.target.id === "checkoutForm") {
    event.preventDefault();
    const formData = new FormData(event.target);
    const items = getCartProducts().map((product) => product.name);
    const total = getCartProducts().reduce(
      (sum, product) => sum + (product.isFree ? 0 : Number(product.price || 0)),
      0,
    );

    state.requests.unshift({
      id: createId(),
      userId: getCurrentUser()?.id ?? "",
      fullName: String(formData.get("fullName")),
      age: String(formData.get("age")),
      contact: String(formData.get("contact")),
      note: String(formData.get("note") ?? ""),
      items,
      total,
      status: "Beklemede",
      adminReply: "",
      createdAt: nowIso(),
    });

    if (getCurrentUser()) {
      getCurrentUser().fullName = String(formData.get("fullName"));
      getCurrentUser().age = String(formData.get("age"));
      getCurrentUser().contact = String(formData.get("contact"));
      getCurrentUser().lastSeen = nowIso();
    }

    setCurrentCart([]);
    saveState();
    renderAll();
    closeModal(cartModal);
    showToast("Talebiniz alındı. Yönetici en kısa sürede dönüş yapacak.", "success");
  }

  if (event.target.id === "categoryEditorForm" && isAdmin()) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const id = String(formData.get("id"));
    const payload = {
      id: id || createId(),
      name: String(formData.get("name")),
      description: String(formData.get("description")),
      videos: id ? state.education.categories.find((item) => item.id === id)?.videos ?? [] : [],
    };

    if (id) {
      state.education.categories = state.education.categories.map((category) =>
        category.id === id ? payload : category,
      );
    } else {
      state.education.categories.push(payload);
      ui.selectedCategoryId = payload.id;
    }

    saveState();
    closeEditor();
    renderAll();
  }

  if (event.target.id === "videoEditorForm" && isAdmin()) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const id = String(formData.get("id"));
    const categoryId = String(formData.get("categoryId"));
    const payload = {
      id: id || createId(),
      title: String(formData.get("title")),
      url: String(formData.get("url")),
      description: String(formData.get("description")),
    };

    state.education.categories = state.education.categories.map((category) => ({
      ...category,
      videos: category.videos.filter((video) => video.id !== id),
    }));

    state.education.categories = state.education.categories.map((category) =>
      category.id === categoryId
        ? { ...category, videos: [...category.videos, payload] }
        : category,
    );

    ui.selectedCategoryId = categoryId;
    ui.selectedVideoId = payload.id;
    saveState();
    closeEditor();
    renderAll();
  }

  if (event.target.id === "productEditorForm" && isAdmin()) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const id = String(formData.get("id"));
    const price = Number(formData.get("price"));
    const payload = {
      id: id || createId(),
      name: String(formData.get("name")),
      game: String(formData.get("game")),
      type: String(formData.get("type")),
      price,
      isFree: price === 0,
      image: String(formData.get("image")),
      summary: String(formData.get("summary")),
      description: String(formData.get("description")),
    };

    if (id) {
      state.store.products = state.store.products.map((product) =>
        product.id === id ? payload : product,
      );
    } else {
      state.store.products.unshift(payload);
    }

    saveState();
    closeEditor();
    renderAll();
  }

  if (event.target.id === "announcementEditorForm" && isAdmin()) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const id = String(formData.get("id"));
    const payload = {
      id: id || createId(),
      title: String(formData.get("title")),
      body: String(formData.get("body")),
      createdAt: id
        ? state.announcements.find((announcement) => announcement.id === id)?.createdAt ?? nowIso()
        : nowIso(),
    };

    if (id) {
      state.announcements = state.announcements.map((announcement) =>
        announcement.id === id ? payload : announcement,
      );
    } else {
      state.announcements.push(payload);
    }

    saveState();
    closeEditor();
    renderAll();
  }

  if (event.target.id === "requestReplyForm" && isAdmin()) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const id = String(formData.get("id"));
    const request = state.requests.find((item) => item.id === id);
    if (request) {
      request.adminReply = String(formData.get("reply"));
      request.status = "Yanıtlandı";
    }
    saveState();
    closeEditor();
    setRoute("dashboard");
    renderAll();
  }
});

openCartButton.addEventListener("click", () => {
  renderCartModal();
  openModal(cartModal);
});

openAuthButton.addEventListener("click", () => {
  renderAuthModal();
  openModal(authModal);
});

touchCurrentUser();
renderAll();
setRoute("home");
