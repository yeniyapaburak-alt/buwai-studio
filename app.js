const STORAGE_KEY = "buwai-studio-data-v3";
const LEGACY_KEYS = ["buwai-studio-data-v2", "buwai-studio-data-v1"];
const SESSION_KEY = "buwai-studio-session-v3";
const ACTIVE_HOURS = 72;
const MAX_CHAT_MESSAGES = 5;
const MUTE_HOURS = 1;
const BAN_HOURS = 24;

const createId = () =>
  globalThis.crypto?.randomUUID?.() ??
  `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;

const nowIso = () => new Date().toISOString();
const addHoursToIso = (hours) => new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();

const escapeMap = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

function escapeHtml(value = "") {
  return String(value ?? "").replace(/[&<>"']/g, (match) => escapeMap[match]);
}

function slugify(value = "") {
  return (
    String(value)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "dosya"
  );
}

function generateAccessCode(seed = "buwai") {
  const prefix = (slugify(seed).replace(/-/g, "").slice(0, 4) || "BW").toUpperCase();
  const stamp = Date.now().toString(36).slice(-4).toUpperCase();
  const randomPart = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `${prefix}-${stamp}-${randomPart}`;
}

function formatDateTime(value) {
  if (!value) return "-";
  return new Date(value).toLocaleString("tr-TR");
}

function formatPrice(valueOrProduct) {
  const value =
    typeof valueOrProduct === "number"
      ? Number(valueOrProduct || 0)
      : valueOrProduct?.isFree
        ? 0
        : Number(valueOrProduct?.price || 0);

  return value === 0 ? "Ücretsiz" : `${value.toLocaleString("tr-TR")} TL`;
}

function isDirectVideoUrl(url = "") {
  return /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(url);
}

function isYouTubeUrl(url = "") {
  return /(youtube\.com|youtu\.be)/i.test(url);
}

function getYouTubeId(url = "") {
  const match = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([a-zA-Z0-9_-]{6,})/,
  );
  return match ? match[1] : "";
}

function getYouTubeEmbedUrl(url = "") {
  const id = getYouTubeId(url);
  if (!id) return "";
  return `https://www.youtube-nocookie.com/embed/${id}?rel=0&modestbranding=1`;
}

function getVideoThumbnail(url = "", customCover = "") {
  if (customCover) return customCover;
  const youtubeId = getYouTubeId(url);
  if (youtubeId) return `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`;
  return "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80";
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error || new Error("Dosya okunamadı."));
    reader.readAsDataURL(file);
  });
}

function createDefaultAdmin() {
  return {
    id: createId(),
    fullName: "Buwai Studio Yönetici",
    username: "admin",
    password: "Buwai2026!",
    age: "24",
    contact: "Discord: buwai",
    role: "admin",
    createdAt: nowIso(),
    lastSeen: nowIso(),
  };
}

function createVideo(overrides = {}) {
  return {
    id: overrides.id || createId(),
    title: overrides.title || "Yeni video",
    url: overrides.url || "",
    cover: overrides.cover || "",
    description: overrides.description || "",
    views: Number(overrides.views || 0),
    likes: Array.isArray(overrides.likes)
      ? overrides.likes
      : Array.isArray(overrides.likedBy)
        ? overrides.likedBy
        : [],
    comments: Array.isArray(overrides.comments)
      ? overrides.comments.map((comment) => ({
          id: comment.id || createId(),
          userId: comment.userId || "",
          fullName: comment.fullName || "Ziyaretçi",
          text: comment.text || "",
          createdAt: comment.createdAt || nowIso(),
        }))
      : [],
    createdAt: overrides.createdAt || nowIso(),
  };
}

function createProduct(overrides = {}) {
  const price = Number(overrides.price || 0);
  return {
    id: overrides.id || createId(),
    name: overrides.name || "Yeni ürün",
    game: overrides.game || "FiveM",
    type: overrides.type || "Script",
    price,
    isFree: overrides.isFree ?? price === 0,
    image:
      overrides.image ||
      "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1200&q=80",
    summary: overrides.summary || "",
    description: overrides.description || "",
    delivery: {
      enabled: Boolean(overrides.delivery?.enabled),
      accessCode: overrides.delivery?.accessCode || overrides.accessCode || "",
      fileName: overrides.delivery?.fileName || overrides.downloadFileName || "",
      fileDataUrl: overrides.delivery?.fileDataUrl || overrides.downloadFileData || "",
      fileUrl: overrides.delivery?.fileUrl || overrides.downloadUrl || "",
      note: overrides.delivery?.note || "",
    },
  };
}

function createGroup(overrides = {}) {
  return {
    id: overrides.id || createId(),
    name: overrides.name || "Yeni grup",
    description: overrides.description || "",
    adminOnly: Boolean(overrides.adminOnly),
    joinCode: overrides.joinCode || "",
    allowedUserIds: Array.isArray(overrides.allowedUserIds) ? overrides.allowedUserIds : [],
    mutedUsers:
      overrides.mutedUsers && typeof overrides.mutedUsers === "object" ? overrides.mutedUsers : {},
    bannedUsers:
      overrides.bannedUsers && typeof overrides.bannedUsers === "object" ? overrides.bannedUsers : {},
    messages: Array.isArray(overrides.messages)
      ? overrides.messages
          .map((message) => ({
            id: message.id || createId(),
            userId: message.userId || "",
            fullName: message.fullName || "Kullanıcı",
            text: message.text || "",
            createdAt: message.createdAt || nowIso(),
          }))
          .slice(-MAX_CHAT_MESSAGES)
      : [],
    createdAt: overrides.createdAt || nowIso(),
  };
}

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
      body: "Yeni eğitim videoları, script kodları ve site mesajları bu alandan paylaşılacak.",
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
          createVideo({
            title: "FiveM kurulum temelleri",
            url: "https://www.youtube.com/watch?v=M7lc1UVf-VE",
            description: "Kurulum mantığını adım adım anlatan başlangıç videosu.",
          }),
          createVideo({
            title: "FiveM optimizasyon düzeni",
            url: "https://www.youtube.com/watch?v=ysz5S6PUM-U",
            description: "Performans tarafını toparlayan eğitim videosu.",
          }),
        ],
      },
      {
        id: createId(),
        name: "Minecraft Script Yapısı",
        description: "Sunucu düzeni, paketleme ve temel mantık.",
        videos: [
          createVideo({
            title: "Minecraft script düzeni",
            url: "https://www.youtube.com/watch?v=aqz-KE-bpKQ",
            description: "Dosya yapısına ve içerik düzenine giriş.",
          }),
        ],
      },
    ],
  },
  store: {
    products: [
      createProduct({
        name: "FiveM Job System",
        game: "FiveM",
        type: "Meslek Scripti",
        price: 1250,
        image:
          "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1200&q=80",
        summary: "Görev tabanlı, panel destekli meslek sistemi.",
        description:
          "Meslek paneli, ödül mantığı, kolay düzenlenebilir yapı ve rol akışı ile gelir.",
      }),
      createProduct({
        name: "MTA HUD Pack",
        game: "MTA",
        type: "Arayüz Scripti",
        price: 0,
        image:
          "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=1200&q=80",
        summary: "Sade, hızlı ve modern HUD paketi.",
        description: "Performans dostu görünüm, okunaklı alanlar ve düzenli kullanıcı deneyimi sunar.",
      }),
      createProduct({
        name: "Minecraft Market Core",
        game: "Minecraft",
        type: "Ekonomi Scripti",
        price: 890,
        image:
          "https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?auto=format&fit=crop&w=1200&q=80",
        summary: "Market, ekonomi ve yönetim çekirdeği.",
        description:
          "Sunucu marketi, para döngüsü, yönetici kontrol alanı ve temiz dosya yapısı içerir.",
      }),
    ],
  },
  requests: [],
  carts: {},
  downloadUnlocks: {},
  chat: {
    groups: [
      createGroup({
        name: "Kod Yardımlaşma",
        description: "Genel soru, cevap ve destek konuşmaları burada akar.",
      }),
      createGroup({
        name: "Yönetici Odası",
        description: "Sadece yöneticilere açık dahili alan.",
        adminOnly: true,
      }),
    ],
  },
};

const cloneDefaultState = () => JSON.parse(JSON.stringify(defaultState));

function mergeState(rawState = {}) {
  const base = cloneDefaultState();
  const rawAnnouncements = Array.isArray(rawState.announcements)
    ? rawState.announcements
    : Array.isArray(rawState.settings?.publicMessages)
      ? rawState.settings.publicMessages
      : base.announcements;

  const merged = {
    settings: {
      ...base.settings,
      ...(rawState.settings || {}),
    },
    announcements: rawAnnouncements.map((announcement) => ({
      id: announcement.id || createId(),
      title: announcement.title || "Yeni duyuru",
      body: announcement.body || announcement.message || "",
      createdAt: announcement.createdAt || nowIso(),
    })),
    users: Array.isArray(rawState.users)
      ? rawState.users.map((user) => ({
          id: user.id || createId(),
          fullName: user.fullName || user.name || "Kullanıcı",
          username: user.username || `kullanici-${Math.random().toString(16).slice(2, 7)}`,
          password: user.password || "123456",
          age: user.age || "",
          contact: user.contact || "",
          role: user.role === "admin" ? "admin" : "user",
          createdAt: user.createdAt || nowIso(),
          lastSeen: user.lastSeen || user.createdAt || nowIso(),
        }))
      : base.users,
    education: {
      categories: Array.isArray(rawState.education?.categories)
        ? rawState.education.categories.map((category) => ({
            id: category.id || createId(),
            name: category.name || "Yeni liste",
            description: category.description || "",
            videos: Array.isArray(category.videos) ? category.videos.map(createVideo) : [],
          }))
        : base.education.categories,
    },
    store: {
      products: Array.isArray(rawState.store?.products)
        ? rawState.store.products.map(createProduct)
        : base.store.products,
    },
    requests: Array.isArray(rawState.requests)
      ? rawState.requests.map((request) => ({
          id: request.id || createId(),
          userId: request.userId || "",
          fullName: request.fullName || "",
          age: request.age || "",
          contact: request.contact || "",
          note: request.note || "",
          items: Array.isArray(request.items) ? request.items : [],
          total: Number(request.total || 0),
          status: request.status || "Beklemede",
          adminReply: request.adminReply || "",
          createdAt: request.createdAt || nowIso(),
          approvedAt: request.approvedAt || "",
          deliveryCodes:
            request.deliveryCodes && typeof request.deliveryCodes === "object" ? request.deliveryCodes : {},
        }))
      : [],
    carts:
      rawState.carts && typeof rawState.carts === "object" ? rawState.carts : base.carts,
    downloadUnlocks:
      rawState.downloadUnlocks && typeof rawState.downloadUnlocks === "object"
        ? rawState.downloadUnlocks
        : {},
    chat: {
      groups: Array.isArray(rawState.chat?.groups)
        ? rawState.chat.groups.map(createGroup)
        : base.chat.groups,
    },
  };

  if (!merged.users.some((user) => user.role === "admin")) {
    merged.users.unshift(createDefaultAdmin());
  }

  if (!merged.chat.groups.length) {
    merged.chat.groups = base.chat.groups;
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

  for (const key of LEGACY_KEYS) {
    const legacy = localStorage.getItem(key);
    if (!legacy) continue;
    try {
      return mergeState(JSON.parse(legacy));
    } catch (error) {
      console.error(error);
    }
  }

  return cloneDefaultState();
}

let state = loadState();
let sessionUserId = localStorage.getItem(SESSION_KEY) || "";

if (sessionUserId && !state.users.some((user) => user.id === sessionUserId)) {
  sessionUserId = "";
  localStorage.removeItem(SESSION_KEY);
}

const defaultAccordionState = {
  requests: true,
  users: false,
  security: false,
  settings: false,
  categories: false,
  videos: false,
  products: true,
  announcements: false,
  groups: false,
};

const ui = {
  route: "home",
  authMode: "login",
  editor: null,
  selectedProductId: state.store.products[0]?.id || "",
  selectedCategoryId: state.education.categories[0]?.id || "",
  selectedVideoId: state.education.categories[0]?.videos[0]?.id || "",
  selectedGroupId: state.chat.groups.find((group) => !group.adminOnly)?.id || state.chat.groups[0]?.id || "",
  activeAccordion: { ...defaultAccordionState },
  activeMessageMenuId: "",
  inspectedUserId: "",
  cartNoticeText: "",
};

const views = {
  home: document.getElementById("homeView"),
  hub: document.getElementById("hubView"),
  education: document.getElementById("educationView"),
  store: document.getElementById("storeView"),
  cart: document.getElementById("cartView"),
  messages: document.getElementById("messagesView"),
  announcements: document.getElementById("announcementsView"),
  dashboard: document.getElementById("dashboardView"),
};

const topbar = document.getElementById("topbar");
const menuToggleButton = document.getElementById("menuToggleButton");
const brandNameLabel = document.getElementById("brandNameLabel");
const openAuthButton = document.getElementById("openAuthButton");
const cartCount = document.getElementById("cartCount");
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
const educationCategoryStrip = document.getElementById("educationCategoryStrip");
const videoFrame = document.getElementById("videoFrame");
const videoTitle = document.getElementById("videoTitle");
const videoMetaNumbers = document.getElementById("videoMetaNumbers");
const likeVideoButton = document.getElementById("likeVideoButton");
const videoSummary = document.getElementById("videoSummary");
const videoCommentFormWrap = document.getElementById("videoCommentFormWrap");
const videoComments = document.getElementById("videoComments");
const suggestedVideoList = document.getElementById("suggestedVideoList");
const productGrid = document.getElementById("productGrid");
const cartNotice = document.getElementById("cartNotice");
const cartItems = document.getElementById("cartItems");
const cartSummary = document.getElementById("cartSummary");
const downloadAccessPanel = document.getElementById("downloadAccessPanel");
const checkoutPanel = document.getElementById("checkoutPanel");
const announcementList = document.getElementById("announcementList");
const chatHeader = document.getElementById("chatHeader");
const chatNotice = document.getElementById("chatNotice");
const chatMessages = document.getElementById("chatMessages");
const chatComposerWrap = document.getElementById("chatComposerWrap");
const groupList = document.getElementById("groupList");
const statsGrid = document.getElementById("statsGrid");
const requestsAccordionBody = document.getElementById("requestsAccordionBody");
const usersAccordionBody = document.getElementById("usersAccordionBody");
const securityAccordionBody = document.getElementById("securityAccordionBody");
const settingsAccordionBody = document.getElementById("settingsAccordionBody");
const categoriesAccordionBody = document.getElementById("categoriesAccordionBody");
const videosAccordionBody = document.getElementById("videosAccordionBody");
const productsAccordionBody = document.getElementById("productsAccordionBody");
const announcementsAccordionBody = document.getElementById("announcementsAccordionBody");
const groupsAccordionBody = document.getElementById("groupsAccordionBody");
const authModal = document.getElementById("authModal");
const authModalBody = document.getElementById("authModalBody");
const productModal = document.getElementById("productModal");
const productModalBody = document.getElementById("productModalBody");
const editorModal = document.getElementById("editorModal");
const editorModalBody = document.getElementById("editorModalBody");
const userModal = document.getElementById("userModal");
const userModalBody = document.getElementById("userModalBody");
const toastStack = document.getElementById("toastStack");

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function saveSession() {
  if (sessionUserId) localStorage.setItem(SESSION_KEY, sessionUserId);
  else localStorage.removeItem(SESSION_KEY);
}

function getCurrentUser() {
  return state.users.find((user) => user.id === sessionUserId) || null;
}

function getIdentityKey() {
  return sessionUserId || "guest-browser";
}

function isAdmin() {
  return getCurrentUser()?.role === "admin";
}

function findUser(userId = "") {
  return state.users.find((user) => user.id === userId) || null;
}

function findProduct(productId = "") {
  return state.store.products.find((product) => product.id === productId) || null;
}

function findProductFromRequestItem(item) {
  return state.store.products.find((product) => product.id === item || product.name === item) || null;
}

function findCategory(categoryId = "") {
  return state.education.categories.find((category) => category.id === categoryId) || null;
}

function findVideo(videoId = "") {
  for (const category of state.education.categories) {
    const video = category.videos.find((item) => item.id === videoId);
    if (video) return video;
  }
  return null;
}

function findVideoCategory(videoId = "") {
  return state.education.categories.find((category) =>
    category.videos.some((video) => video.id === videoId),
  );
}

function findGroup(groupId = "") {
  return state.chat.groups.find((group) => group.id === groupId) || null;
}

function findRequest(requestId = "") {
  return state.requests.find((request) => request.id === requestId) || null;
}

function getCurrentCartKey() {
  return sessionUserId || "guest";
}

function getCurrentCart() {
  return Array.isArray(state.carts[getCurrentCartKey()]) ? state.carts[getCurrentCartKey()] : [];
}

function setCurrentCart(items) {
  state.carts[getCurrentCartKey()] = [...new Set(items)];
  saveState();
}

function getCartProducts() {
  return getCurrentCart().map(findProduct).filter(Boolean);
}

function getCartTotal() {
  return getCartProducts().reduce((sum, product) => sum + (product.isFree ? 0 : Number(product.price || 0)), 0);
}

function mergeGuestCartIntoUser(userId) {
  const guestItems = Array.isArray(state.carts.guest) ? state.carts.guest : [];
  if (!guestItems.length) return;
  const targetItems = Array.isArray(state.carts[userId]) ? state.carts[userId] : [];
  state.carts[userId] = [...new Set([...targetItems, ...guestItems])];
  delete state.carts.guest;
}

function getActiveUserCount() {
  return state.users.filter((user) => {
    const lastSeen = new Date(user.lastSeen || user.createdAt).getTime();
    return Date.now() - lastSeen <= ACTIVE_HOURS * 60 * 60 * 1000;
  }).length;
}

function getRequestProducts(request) {
  return (request.items || []).map(findProductFromRequestItem).filter(Boolean);
}

function getRequestItemLabels(request) {
  return (request.items || []).map((item) => findProductFromRequestItem(item)?.name || String(item));
}

function getLatestRequestForCurrentUser() {
  const currentUser = getCurrentUser();
  if (!currentUser) return null;
  return (
    state.requests
      .filter((request) => request.userId === currentUser.id)
      .slice()
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0] || null
  );
}

function getApprovedProductsForCurrentUser() {
  const currentUser = getCurrentUser();
  if (!currentUser) return [];
  const approvedProducts = [];

  state.requests
    .filter((request) => request.userId === currentUser.id && request.status === "Onaylandı")
    .forEach((request) => {
      getRequestProducts(request).forEach((product) => {
        if (!product.delivery.enabled) return;
        if (!approvedProducts.some((item) => item.id === product.id)) {
          approvedProducts.push(product);
        }
      });
    });

  return approvedProducts;
}

function getApprovedDeliveriesForCurrentUser() {
  const currentUser = getCurrentUser();
  if (!currentUser) return [];

  return state.requests
    .filter((request) => request.userId === currentUser.id && request.status === "Onaylandı")
    .slice()
    .sort((a, b) => new Date(b.approvedAt || b.createdAt) - new Date(a.approvedAt || a.createdAt))
    .flatMap((request) =>
      getRequestProducts(request)
        .filter((product) => product.delivery.enabled)
        .map((product) => ({
          key: `${request.id}:${product.id}`,
          requestId: request.id,
          product,
          approvedAt: request.approvedAt || request.createdAt,
          code: request.deliveryCodes?.[product.id] || product.delivery.accessCode || "",
        })),
    );
}

function getUserUnlocks(userId = "") {
  if (!userId) return {};
  if (!state.downloadUnlocks[userId] || typeof state.downloadUnlocks[userId] !== "object") {
    state.downloadUnlocks[userId] = {};
  }
  return state.downloadUnlocks[userId];
}

function cleanupGroupRestrictions(group) {
  let changed = false;

  ["mutedUsers", "bannedUsers"].forEach((key) => {
    Object.entries(group[key] || {}).forEach(([userId, until]) => {
      if (!until || new Date(until).getTime() <= Date.now()) {
        delete group[key][userId];
        changed = true;
      }
    });
  });

  return changed;
}

function getGroupMuteUntil(group, userId = "") {
  if (!userId) return "";
  cleanupGroupRestrictions(group);
  return group.mutedUsers?.[userId] || "";
}

function getGroupBanUntil(group, userId = "") {
  if (!userId) return "";
  cleanupGroupRestrictions(group);
  return group.bannedUsers?.[userId] || "";
}

function hasGroupAccess(group, userId = "") {
  if (group.adminOnly) return isAdmin();
  if (!group.joinCode) return true;
  if (isAdmin()) return true;
  if (!userId) return false;
  return (group.allowedUserIds || []).includes(userId);
}

function ensureSelections() {
  if (!findCategory(ui.selectedCategoryId)) {
    ui.selectedCategoryId = state.education.categories[0]?.id || "";
  }

  const activeCategory = findCategory(ui.selectedCategoryId);
  if (!activeCategory?.videos.some((video) => video.id === ui.selectedVideoId)) {
    ui.selectedVideoId = activeCategory?.videos[0]?.id || "";
  }

  if (!findProduct(ui.selectedProductId)) {
    ui.selectedProductId = state.store.products[0]?.id || "";
  }

  const visibleGroups = state.chat.groups.filter((group) => !group.adminOnly || isAdmin());
  if (!visibleGroups.some((group) => group.id === ui.selectedGroupId)) {
    ui.selectedGroupId = visibleGroups[0]?.id || "";
  }
}

function isMobileLayout() {
  return window.matchMedia("(max-width: 860px)").matches;
}

function closeTopbarMenu() {
  topbar.classList.remove("menu-open");
  menuToggleButton.setAttribute("aria-expanded", "false");
}

function toggleTopbarMenu() {
  const nextOpen = !topbar.classList.contains("menu-open");
  topbar.classList.toggle("menu-open", nextOpen);
  menuToggleButton.setAttribute("aria-expanded", String(nextOpen));
}

function openModal(modal) {
  modal.classList.remove("hidden");
}

function closeModal(modal) {
  modal.classList.add("hidden");
}

function closeEditor() {
  ui.editor = null;
  editorModalBody.innerHTML = "";
  closeModal(editorModal);
}

function openEditor(type, id = "") {
  ui.editor = { type, id };
  renderEditorModal();
  openModal(editorModal);
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

function touchCurrentUser() {
  const currentUser = getCurrentUser();
  if (!currentUser) return;
  currentUser.lastSeen = nowIso();
  saveState();
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

  closeTopbarMenu();
  ui.activeMessageMenuId = "";
}

function triggerDownload(href, fileName) {
  const anchor = document.createElement("a");
  anchor.href = href;
  anchor.download = fileName;
  anchor.target = "_blank";
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}

function renderTopbar() {
  const currentUser = getCurrentUser();
  const adminVisible = isAdmin();

  document.querySelectorAll(".admin-only").forEach((element) => {
    element.classList.toggle("hidden", !adminVisible);
  });

  brandNameLabel.textContent = state.settings.brandName;
  openAuthButton.textContent = currentUser ? `${currentUser.fullName.split(" ")[0]} / Hesabım` : "Oturum Aç";
  cartCount.textContent = String(getCurrentCart().length);

  if (!adminVisible && ui.route === "dashboard") {
    ui.route = "home";
  }
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
  ensureSelections();
  const currentUser = getCurrentUser();
  const selectedVideo = findVideo(ui.selectedVideoId);
  const selectedCategory = findCategory(ui.selectedCategoryId);

  educationCategoryStrip.innerHTML = state.education.categories.length
    ? state.education.categories
        .map(
          (category) => `
            <button
              class="category-chip ${category.id === ui.selectedCategoryId ? "active" : ""}"
              data-action="selectCategory"
              data-category-id="${category.id}"
              type="button"
            >
              ${escapeHtml(category.name)} (${category.videos.length})
            </button>
          `,
        )
        .join("")
    : `<div class="empty-state">Henüz liste yok.</div>`;

  if (!selectedVideo || !selectedCategory) {
    videoFrame.innerHTML = `<div class="empty-state">Henüz seçili video yok.</div>`;
    videoTitle.textContent = "Bir video seç";
    videoMetaNumbers.innerHTML = "";
    likeVideoButton.classList.remove("active");
    videoSummary.innerHTML = `<p class="muted">Video bilgileri burada görünür.</p>`;
    videoCommentFormWrap.innerHTML = "";
    videoComments.innerHTML = `<div class="empty-state">Henüz yorum yok.</div>`;
    suggestedVideoList.innerHTML = `<div class="empty-state">Gösterilecek video bulunamadı.</div>`;
    return;
  }

  const embedUrl = getYouTubeEmbedUrl(selectedVideo.url);

  if (isYouTubeUrl(selectedVideo.url) && embedUrl) {
    videoFrame.innerHTML = `
      <iframe
        src="${escapeHtml(embedUrl)}"
        title="${escapeHtml(selectedVideo.title)}"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowfullscreen
        loading="lazy"
      ></iframe>
    `;
  } else if (isDirectVideoUrl(selectedVideo.url)) {
    videoFrame.innerHTML = `<video controls src="${escapeHtml(selectedVideo.url)}"></video>`;
  } else {
    videoFrame.innerHTML = `<img src="${escapeHtml(getVideoThumbnail(selectedVideo.url, selectedVideo.cover))}" alt="${escapeHtml(selectedVideo.title)}" />`;
  }

  const likes = Array.isArray(selectedVideo.likes) ? selectedVideo.likes.length : 0;
  const comments = Array.isArray(selectedVideo.comments) ? selectedVideo.comments.length : 0;
  const liked = (selectedVideo.likes || []).includes(getIdentityKey());

  videoTitle.textContent = selectedVideo.title;
  videoMetaNumbers.innerHTML = `
    <span class="metric-pill">${Number(selectedVideo.views || 0).toLocaleString("tr-TR")} görüntüleme</span>
    <span class="metric-pill">${likes.toLocaleString("tr-TR")} beğeni</span>
    <span class="metric-pill">${comments.toLocaleString("tr-TR")} yorum</span>
    <span class="metric-pill">${escapeHtml(selectedCategory.name)}</span>
  `;
  likeVideoButton.textContent = liked ? `Beğenildi · ${likes}` : `Beğen · ${likes}`;
  likeVideoButton.classList.toggle("active", liked);

  videoSummary.innerHTML = `
    <div class="panel-heading">
      <div>
        <h3>${escapeHtml(selectedVideo.title)}</h3>
        <p class="muted">${formatDateTime(selectedVideo.createdAt)}</p>
      </div>
      <a class="secondary-button" href="${escapeHtml(selectedVideo.url)}" target="_blank" rel="noopener">Bağlantıyı Aç</a>
    </div>
    <p>${escapeHtml(selectedVideo.description || "Bu video için açıklama eklenmemiş.")}</p>
  `;

  videoCommentFormWrap.innerHTML = currentUser
    ? `
        <form class="comment-form" id="videoCommentForm">
          <label>
            <span>Yorum yaz</span>
            <textarea name="comment" rows="3" required></textarea>
          </label>
          <button class="primary-button" type="submit">Yorumu Gönder</button>
        </form>
      `
    : `
        <div class="warning-banner">
          <strong>Yorum için oturum aç.</strong>
          <p class="muted">Yorum yapman için giriş yapman gerekiyor.</p>
          <button class="secondary-button" data-action="openAuthPrompt" data-mode="login" type="button">Oturum Aç</button>
        </div>
      `;

  videoComments.innerHTML = selectedVideo.comments.length
    ? selectedVideo.comments
        .slice()
        .reverse()
        .map(
          (comment) => `
            <article class="comment-card">
              <div class="panel-heading">
                <div>
                  <strong>${escapeHtml(comment.fullName)}</strong>
                  <p class="muted">${formatDateTime(comment.createdAt)}</p>
                </div>
              </div>
              <p>${escapeHtml(comment.text)}</p>
            </article>
          `,
        )
        .join("")
    : `<div class="empty-state">Henüz yorum yok.</div>`;

  suggestedVideoList.innerHTML = selectedCategory.videos.length
    ? selectedCategory.videos
        .map(
          (video) => `
            <button
              class="playlist-item ${video.id === selectedVideo.id ? "active" : ""}"
              data-action="playVideo"
              data-video-id="${video.id}"
              type="button"
            >
              <img class="playlist-thumb" src="${escapeHtml(getVideoThumbnail(video.url, video.cover))}" alt="${escapeHtml(video.title)}" />
              <div class="form-stack">
                <strong>${escapeHtml(video.title)}</strong>
                <p class="muted">${escapeHtml(video.description)}</p>
                <span class="muted">${Number(video.views || 0).toLocaleString("tr-TR")} görüntüleme</span>
              </div>
            </button>
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
            <article class="product-card">
              <button class="product-hit" data-action="openProduct" data-product-id="${product.id}" type="button">
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
              <div class="product-actions-row">
                <button class="primary-button" data-action="quickAddToCart" data-product-id="${product.id}" type="button">
                  Sepete Ekle
                </button>
                ${
                  product.delivery.enabled
                    ? `<span class="delivery-badge">Kod ile teslim</span>`
                    : `<span class="tag">Manuel teslim</span>`
                }
              </div>
            </article>
          `,
        )
        .join("")
    : `<div class="empty-state">Henüz ürün yok.</div>`;
}

function renderCart() {
  const cartProducts = getCartProducts();
  const currentUser = getCurrentUser();
  const latestRequest = getLatestRequestForCurrentUser();
  const approvedDeliveries = getApprovedDeliveriesForCurrentUser();
  const total = getCartTotal();

  if (ui.cartNoticeText) {
    cartNotice.innerHTML = `
      <div class="success-banner">
        <strong>${escapeHtml(ui.cartNoticeText)}</strong>
        <p class="muted">Size en yakın sürede ulaşacağız.</p>
      </div>
    `;
  } else if (latestRequest) {
    cartNotice.innerHTML = `
      <div class="${latestRequest.status === "Onaylandı" ? "success-banner" : "warning-banner"}">
        <strong>Son talep durumu: ${escapeHtml(latestRequest.status)}</strong>
        <p class="muted">${formatDateTime(latestRequest.createdAt)}</p>
        ${
          latestRequest.adminReply
            ? `<p>${escapeHtml(latestRequest.adminReply)}</p>`
            : `<p class="muted">Yönetici henüz ek not bırakmadı.</p>`
        }
      </div>
    `;
  } else {
    cartNotice.innerHTML = "";
  }

  cartItems.innerHTML = cartProducts.length
    ? cartProducts
        .map(
          (product) => `
            <article class="cart-item">
              <img class="cart-item-cover" src="${escapeHtml(product.image)}" alt="${escapeHtml(product.name)}" />
              <div class="form-stack">
                <div class="panel-heading">
                  <div>
                    <strong>${escapeHtml(product.name)}</strong>
                    <p class="muted">${escapeHtml(product.game)} / ${escapeHtml(product.type)}</p>
                  </div>
                  <span class="price-pill">${formatPrice(product)}</span>
                </div>
                <p>${escapeHtml(product.summary)}</p>
                <div class="inline-actions">
                  <button class="secondary-button" data-action="openProduct" data-product-id="${product.id}" type="button">Özeti Aç</button>
                  <button class="danger-button" data-action="removeFromCart" data-product-id="${product.id}" type="button">Kaldır</button>
                </div>
              </div>
            </article>
          `,
        )
        .join("")
    : `<div class="empty-state">Sepetin şu an boş.</div>`;

  cartSummary.innerHTML = `
    <div class="panel-heading">
      <div>
        <h3>Sepetim</h3>
        <p class="muted">Talep, ödeme görüşmesi ve teslim kodu akışı burada yönetilir.</p>
      </div>
    </div>
    <div class="summary-row">
      <span>Ürün Sayısı</span>
      <strong>${cartProducts.length}</strong>
    </div>
    <div class="summary-row">
      <span>Ara Toplam</span>
      <strong>${total.toLocaleString("tr-TR")} TL</strong>
    </div>
    <div class="summary-row">
      <span>Teslim</span>
      <strong>DM ile</strong>
    </div>
    <div class="summary-row">
      <span>Toplam</span>
      <strong>${total.toLocaleString("tr-TR")} TL</strong>
    </div>
    <button class="secondary-button" data-route="store" type="button">Kodlara Dön</button>
  `;

  if (!currentUser) {
    downloadAccessPanel.innerHTML = `
      <div class="panel-heading">
        <div>
          <h3>Kod Alanı</h3>
          <p class="muted">Onaylanan ürünlerde verilen teslim kodu burada açılır.</p>
        </div>
      </div>
      <div class="warning-banner">
        <strong>Kod alanı için giriş yap.</strong>
        <p class="muted">Onaylanan ürün dosyalarını görmek için hesabınla giriş yapman gerekir.</p>
        <button class="secondary-button" data-action="openAuthPrompt" data-mode="login" type="button">Oturum Aç</button>
      </div>
    `;
  } else {
    const unlocks = getUserUnlocks(currentUser.id);

    downloadAccessPanel.innerHTML = `
      <div class="panel-heading">
        <div>
          <h3>Teslim Kodları</h3>
          <p class="muted">Yönetici siparişi onaylayınca verdiği kod buradan doğrulanır.</p>
        </div>
      </div>
      ${
        approvedDeliveries.length
          ? approvedDeliveries
              .map(
                (delivery) => `
                  <div class="unlock-card">
                    <div class="summary-row">
                      <strong>${escapeHtml(delivery.product.name)}</strong>
                      <span class="tag">${escapeHtml(delivery.product.delivery.fileName || "Dosya hazır")}</span>
                    </div>
                    <p class="muted">Onay: ${formatDateTime(delivery.approvedAt)}</p>
                    <p class="muted">${escapeHtml(delivery.product.delivery.note || "Yönetici sana ilettiği teslim kodunu buraya gireceksin.")}</p>
                    ${
                      unlocks[delivery.product.id]
                        ? `
                            <button class="primary-button" data-action="downloadProduct" data-product-id="${delivery.product.id}" type="button">
                              İndirme Butonu
                            </button>
                          `
                        : `
                            <form class="code-form" data-form="unlockProduct" data-product-id="${delivery.product.id}">
                              <label>
                                <span>Kod Yazma Yeri</span>
                                <input name="accessCode" placeholder="Verilen kodu gir" required />
                              </label>
                              <button class="primary-button" type="submit">Kodu Aç</button>
                            </form>
                          `
                    }
                  </div>
                `,
              )
              .join("")
          : `<div class="empty-state">Onaylanmış teslim kodu bekleyen ürün görünmüyor.</div>`
      }
    `;
  }

  checkoutPanel.innerHTML = cartProducts.length
    ? currentUser
      ? `
          <div class="panel-heading">
            <div>
              <h3>Talebi İlet</h3>
              <p class="muted">Ödeme sonrası yönetici seninle DM üzerinden görüşür.</p>
            </div>
          </div>
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
              <span>Not</span>
              <textarea name="note" rows="4" placeholder="İsteğe bağlı not"></textarea>
            </label>
            <button class="primary-button" type="submit">Talebi İlet</button>
          </form>
        `
      : `
          <div class="warning-banner">
            <strong>Talep için oturum aç.</strong>
            <p class="muted">Sepetteki ürünleri talebe dönüştürmek için giriş yapman gerekiyor.</p>
            <button class="primary-button" data-action="openAuthPrompt" data-mode="login" type="button">Oturum Aç</button>
          </div>
        `
    : `
        <div class="empty-state">Talep alanı, sepete ürün eklendiğinde burada görünür.</div>
      `;
}

function renderAnnouncements() {
  announcementList.innerHTML = state.announcements.length
    ? state.announcements
        .slice()
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .map(
          (announcement) => `
            <article class="panel-card">
              <div class="panel-heading">
                <div>
                  <h3>${escapeHtml(announcement.title)}</h3>
                  <p class="muted">${formatDateTime(announcement.createdAt)}</p>
                </div>
              </div>
              <p>${escapeHtml(announcement.body)}</p>
            </article>
          `,
        )
        .join("")
    : `<div class="empty-state">Henüz site mesajı yok.</div>`;
}

function renderMessages() {
  const currentUser = getCurrentUser();
  let changed = false;
  state.chat.groups.forEach((group) => {
    if (cleanupGroupRestrictions(group)) changed = true;
  });
  if (changed) saveState();

  const visibleGroups = state.chat.groups.filter((group) => !group.adminOnly || isAdmin());
  const selectedGroup = findGroup(ui.selectedGroupId);

  groupList.innerHTML = visibleGroups.length
    ? visibleGroups
        .map((group) => {
          const lastMessage = group.messages[group.messages.length - 1];
          const accessible = hasGroupAccess(group, currentUser?.id || "");
          return `
            <button
              class="group-item ${group.id === ui.selectedGroupId ? "active" : ""}"
              data-action="openGroup"
              data-group-id="${group.id}"
              type="button"
            >
              <div class="group-meta">
                <strong>${escapeHtml(group.name)}</strong>
                <span class="tag">${group.adminOnly ? "Yönetici" : group.joinCode ? "Şifreli" : "Açık"}</span>
              </div>
              <p class="muted">${escapeHtml(group.description)}</p>
              <span class="muted">
                ${accessible ? "Sohbete girilebilir" : "Önce grup kodu gerekir"}
                ${lastMessage ? ` · Son mesaj ${formatDateTime(lastMessage.createdAt)}` : ""}
              </span>
            </button>
          `;
        })
        .join("")
    : `<div class="empty-state">Henüz grup yok.</div>`;

  if (!selectedGroup) {
    chatHeader.innerHTML = `<div class="empty-state">Seçili grup yok.</div>`;
    chatNotice.innerHTML = "";
    chatMessages.innerHTML = `<div class="empty-state">Grup seçildiğinde konuşmalar burada görünür.</div>`;
    chatComposerWrap.innerHTML = "";
    return;
  }

  const userId = currentUser?.id || "";
  const muteUntil = getGroupMuteUntil(selectedGroup, userId);
  const banUntil = getGroupBanUntil(selectedGroup, userId);
  const hasAccess = hasGroupAccess(selectedGroup, userId);

  chatHeader.innerHTML = `
    <div class="chat-header">
      <div class="chat-header-row">
        <div>
          <h3>${escapeHtml(selectedGroup.name)}</h3>
          <p class="muted">${escapeHtml(selectedGroup.description)}</p>
        </div>
        ${
          isAdmin()
            ? `<button class="secondary-button" data-action="editGroup" data-group-id="${selectedGroup.id}" type="button">Grubu Düzenle</button>`
            : ""
        }
      </div>
      <div class="chat-badge-row">
        <span class="status-pill">${selectedGroup.adminOnly ? "Yönetici Grubu" : "Kullanıcı Grubu"}</span>
        ${selectedGroup.joinCode ? `<span class="status-pill">Şifreli</span>` : `<span class="status-pill">Şifresiz</span>`}
        <span class="status-pill">${selectedGroup.messages.length}/${MAX_CHAT_MESSAGES} mesaj</span>
      </div>
    </div>
  `;

  if (selectedGroup.adminOnly && !isAdmin()) {
    chatNotice.innerHTML = `
      <div class="warning-banner">
        <strong>Bu grup sadece yöneticilere ait.</strong>
        <p class="muted">Kilidi olan gruplar yöneticiye aittir.</p>
      </div>
    `;
    chatMessages.innerHTML = `<div class="empty-state">Bu alana giriş iznin yok.</div>`;
    chatComposerWrap.innerHTML = "";
    return;
  }

  if (selectedGroup.joinCode && !hasAccess) {
    chatNotice.innerHTML = `
      <div class="warning-banner">
        <strong>Bu grup şifreli.</strong>
        <p class="muted">Gruba girmek için yönetici tarafından verilen kodu yaz.</p>
      </div>
    `;
    chatMessages.innerHTML = `<div class="empty-state">Kod girildiğinde mesajlar burada açılır.</div>`;
    chatComposerWrap.innerHTML = currentUser
      ? `
          <form class="chat-compose" id="groupAccessForm">
            <input type="hidden" name="groupId" value="${escapeHtml(selectedGroup.id)}" />
            <label>
              <span>Grup Kodu</span>
              <input name="joinCode" placeholder="Grup şifresi" required />
            </label>
            <button class="primary-button" type="submit">Gruba Gir</button>
          </form>
        `
      : `
          <div class="warning-banner">
            <strong>Önce oturum aç.</strong>
            <p class="muted">Şifreli gruba giriş için hesabınla giriş yapman gerekir.</p>
            <button class="secondary-button" data-action="openAuthPrompt" data-mode="login" type="button">Oturum Aç</button>
          </div>
        `;
    return;
  }

  if (!currentUser) {
    chatNotice.innerHTML = `
      <div class="warning-banner">
        <strong>Mesaj için oturum aç.</strong>
        <p class="muted">Grup konuşmalarına yazmak için hesabınla giriş yapman gerekir.</p>
      </div>
    `;
  } else if (banUntil) {
    chatNotice.innerHTML = `
      <div class="warning-banner">
        <strong>Yasaklandın.</strong>
        <p class="muted">Bu grupta ${formatDateTime(banUntil)} tarihine kadar mesaj gönderemezsin.</p>
      </div>
    `;
  } else if (muteUntil) {
    chatNotice.innerHTML = `
      <div class="warning-banner">
        <strong>Mutelendin.</strong>
        <p class="muted">Bu grupta ${formatDateTime(muteUntil)} tarihine kadar mesaj gönderemezsin.</p>
      </div>
    `;
  } else {
    chatNotice.innerHTML = `
      <div class="success-banner">
        <strong>Mesaj kutusu hazır.</strong>
        <p class="muted">Yeni mesaj eklendikçe sadece son ${MAX_CHAT_MESSAGES} mesaj tutulur.</p>
      </div>
    `;
  }

  chatMessages.innerHTML = selectedGroup.messages.length
    ? selectedGroup.messages
        .map((message) => {
          const own = message.userId && message.userId === currentUser?.id;
          return `
            <article class="message-card ${own ? "own" : ""}">
              <div class="message-head">
                <button class="message-author" data-action="inspectUser" data-user-id="${message.userId}" type="button">
                  ${escapeHtml(message.fullName)}
                </button>
                <span class="message-time">${formatDateTime(message.createdAt)}</span>
                ${
                  isAdmin()
                    ? `
                        <button
                          class="message-menu-toggle"
                          data-action="toggleMessageMenu"
                          data-message-id="${message.id}"
                          type="button"
                        >
                          ⋯
                        </button>
                      `
                    : ""
                }
              </div>
              <p>${escapeHtml(message.text)}</p>
              ${
                isAdmin() && ui.activeMessageMenuId === message.id
                  ? `
                      <div class="message-menu">
                        <button class="secondary-button" data-action="inspectUser" data-user-id="${message.userId}" type="button">Kullanıcıya Git</button>
                        <button class="status-button" data-action="muteMessageAuthor" data-group-id="${selectedGroup.id}" data-user-id="${message.userId}" type="button">1 Saat Sustur</button>
                        <button class="danger-button" data-action="banMessageAuthor" data-group-id="${selectedGroup.id}" data-user-id="${message.userId}" type="button">24 Saat Banla</button>
                        <button class="danger-button" data-action="deleteMessage" data-group-id="${selectedGroup.id}" data-message-id="${message.id}" type="button">Mesajı Sil</button>
                      </div>
                    `
                  : ""
              }
            </article>
          `;
        })
        .join("")
    : `<div class="empty-state">Bu grupta henüz mesaj yok.</div>`;

  if (!currentUser) {
    chatComposerWrap.innerHTML = `
      <div class="warning-banner">
        <strong>Mesaj yazmak için giriş yap.</strong>
        <button class="secondary-button" data-action="openAuthPrompt" data-mode="login" type="button">Oturum Aç</button>
      </div>
    `;
    return;
  }

  if (banUntil) {
    chatComposerWrap.innerHTML = `<div class="empty-state">Yasak süresi bitene kadar mesaj alanı kapalı.</div>`;
    return;
  }

  chatComposerWrap.innerHTML = `
    <form class="chat-compose" id="messageForm">
      <input type="hidden" name="groupId" value="${escapeHtml(selectedGroup.id)}" />
      <label>
        <span>Mesaj</span>
        <textarea name="message" rows="3" placeholder="${muteUntil ? "Susturulduğun için mesaj gönderemezsin." : "Mesajını yaz"}" ${muteUntil ? "disabled" : ""} required></textarea>
      </label>
      <button class="primary-button" type="submit" ${muteUntil ? "disabled" : ""}>Mesaj Gönder</button>
    </form>
  `;
}

function renderDashboard() {
  if (!isAdmin()) return;

  document.querySelectorAll("[data-accordion-card]").forEach((card) => {
    card.classList.toggle("open", Boolean(ui.activeAccordion[card.dataset.accordionCard]));
  });

  statsGrid.innerHTML = `
    <article class="stats-card">
      <span class="eyebrow">Kayıtlı Kullanıcı</span>
      <strong>${state.users.length}</strong>
      <p class="muted">Toplam hesap sayısı</p>
    </article>
    <article class="stats-card">
      <span class="eyebrow">Aktif Kullanıcı</span>
      <strong>${getActiveUserCount()}</strong>
      <p class="muted">Son ${ACTIVE_HOURS} saatte görülen hesaplar</p>
    </article>
    <article class="stats-card">
      <span class="eyebrow">Bekleyen Talep</span>
      <strong>${state.requests.filter((request) => request.status === "Beklemede").length}</strong>
      <p class="muted">Yanıt bekleyen siparişler</p>
    </article>
    <article class="stats-card">
      <span class="eyebrow">Toplam Ürün</span>
      <strong>${state.store.products.length}</strong>
      <p class="muted">Mağaza ürün sayısı</p>
    </article>
    <article class="stats-card">
      <span class="eyebrow">Mesaj Grubu</span>
      <strong>${state.chat.groups.length}</strong>
      <p class="muted">Yönetilen grup sayısı</p>
    </article>
  `;

  requestsAccordionBody.innerHTML = state.requests.length
    ? state.requests
        .slice()
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .map(
          (request) => `
            <article class="request-card">
              <div class="panel-heading">
                <div>
                  <strong>${escapeHtml(request.fullName)}</strong>
                  <p class="muted">${formatDateTime(request.createdAt)}</p>
                </div>
                <span class="status-pill">${escapeHtml(request.status)}</span>
              </div>
              <p><strong>İletişim:</strong> ${escapeHtml(request.contact)}</p>
              <p><strong>Yaş:</strong> ${escapeHtml(request.age)}</p>
              <p><strong>Ürünler:</strong> ${escapeHtml(getRequestItemLabels(request).join(", "))}</p>
              <p><strong>Toplam:</strong> ${formatPrice(Number(request.total || 0))}</p>
              <p><strong>Not:</strong> ${escapeHtml(request.note || "-")}</p>
              ${request.adminReply ? `<p><strong>Yönetici Yanıtı:</strong> ${escapeHtml(request.adminReply)}</p>` : ""}
              ${
                request.status === "Onaylandı" && Object.keys(request.deliveryCodes || {}).length
                  ? `
                      <div class="delivery-code-list">
                        ${Object.entries(request.deliveryCodes)
                          .map(([productId, code]) => {
                            const product = findProduct(productId);
                            return `
                              <p><strong>${escapeHtml(product?.name || productId)} teslim kodu:</strong> ${escapeHtml(code)}</p>
                            `;
                          })
                          .join("")}
                      </div>
                    `
                  : ""
              }
              <div class="inline-actions">
                <button class="status-button" data-action="approveRequest" data-request-id="${request.id}" type="button">Onayla</button>
                <button class="secondary-button" data-action="replyRequest" data-request-id="${request.id}" type="button">Yanıtla</button>
                <button class="danger-button" data-action="deleteRequest" data-request-id="${request.id}" type="button">Sil</button>
              </div>
            </article>
          `,
        )
        .join("")
    : `<div class="empty-state">Henüz talep yok.</div>`;

  usersAccordionBody.innerHTML = `
    <div class="stack-list">
      ${state.users
        .slice()
        .sort((a, b) => new Date(b.lastSeen || b.createdAt) - new Date(a.lastSeen || a.createdAt))
        .map(
          (user) => `
            <article class="user-card">
              <div class="panel-heading">
                <div>
                  <strong>${escapeHtml(user.fullName)}</strong>
                  <p class="muted">@${escapeHtml(user.username)} · ${user.role === "admin" ? "Yönetici" : "Kullanıcı"}</p>
                </div>
                <span class="status-pill">${Date.now() - new Date(user.lastSeen || user.createdAt).getTime() <= ACTIVE_HOURS * 60 * 60 * 1000 ? "Aktif" : "Pasif"}</span>
              </div>
              <p><strong>İletişim:</strong> ${escapeHtml(user.contact || "-")}</p>
              <p><strong>Son Görülme:</strong> ${formatDateTime(user.lastSeen || user.createdAt)}</p>
              <div class="inline-actions">
                <button class="secondary-button" data-action="inspectUser" data-user-id="${user.id}" type="button">Profili Aç</button>
              </div>
            </article>
          `,
        )
        .join("")}
    </div>
  `;

  securityAccordionBody.innerHTML = `
    <div class="account-summary">
      <strong>${escapeHtml(getCurrentUser()?.fullName || "")}</strong>
      <p class="muted">Şifre ve güvenlik ayarlarını bu bölümden düzenleyebilirsin.</p>
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

  settingsAccordionBody.innerHTML = `
    <form class="form-stack" id="settingsForm">
      <label>
        <span>Marka Adı</span>
        <input name="brandName" value="${escapeHtml(state.settings.brandName)}" required />
      </label>
      <label>
        <span>Ana Başlık</span>
        <input name="heroTitle" value="${escapeHtml(state.settings.heroTitle)}" required />
      </label>
      <label>
        <span>Ana Açıklama</span>
        <textarea name="heroText" rows="4" required>${escapeHtml(state.settings.heroText)}</textarea>
      </label>
      <label>
        <span>Üst Görsel URL</span>
        <input name="heroImage" value="${escapeHtml(state.settings.heroImage)}" required />
      </label>
      <label>
        <span>Hakkında Başlığı</span>
        <input name="aboutTitle" value="${escapeHtml(state.settings.aboutTitle)}" required />
      </label>
      <label>
        <span>Hakkında Yazısı</span>
        <textarea name="aboutText" rows="4" required>${escapeHtml(state.settings.aboutText)}</textarea>
      </label>
      <label>
        <span>Hakkında Fotoğraf URL</span>
        <input name="aboutImage" value="${escapeHtml(state.settings.aboutImage)}" required />
      </label>
      <label>
        <span>Geliştirici Adı</span>
        <input name="developerName" value="${escapeHtml(state.settings.developerName)}" required />
      </label>
      <label>
        <span>Geliştirici Ünvanı</span>
        <input name="developerRole" value="${escapeHtml(state.settings.developerRole)}" required />
      </label>
      <label>
        <span>Geliştirici Fotoğraf URL</span>
        <input name="developerImage" value="${escapeHtml(state.settings.developerImage)}" required />
      </label>
      <label>
        <span>Eğitim Görseli URL</span>
        <input name="educationImage" value="${escapeHtml(state.settings.educationImage)}" required />
      </label>
      <label>
        <span>Kodlar Görseli URL</span>
        <input name="storeImage" value="${escapeHtml(state.settings.storeImage)}" required />
      </label>
      <button class="primary-button" type="submit">Ayarları Kaydet</button>
    </form>
  `;

  categoriesAccordionBody.innerHTML = `
    <div class="panel-heading">
      <div>
        <h3>Listeler</h3>
        <p class="muted">Video listelerini ayrı ayrı buradan yönet.</p>
      </div>
      <button class="secondary-button" data-action="openEditor" data-editor="category" type="button">Liste Ekle</button>
    </div>
    <div class="admin-card-list">
      ${
        state.education.categories.length
          ? state.education.categories
              .map(
                (category) => `
                  <article>
                    <div class="panel-heading">
                      <div>
                        <strong>${escapeHtml(category.name)}</strong>
                        <p class="muted">${escapeHtml(category.description)}</p>
                      </div>
                      <span class="status-pill">${category.videos.length} video</span>
                    </div>
                    <div class="inline-actions">
                      <button class="secondary-button" data-action="editCategory" data-category-id="${category.id}" type="button">Düzenle</button>
                      <button class="danger-button" data-action="deleteCategory" data-category-id="${category.id}" type="button">Sil</button>
                    </div>
                  </article>
                `,
              )
              .join("")
          : `<div class="empty-state">Henüz liste yok.</div>`
      }
    </div>
  `;

  const flattenedVideos = state.education.categories.flatMap((category) =>
    category.videos.map((video) => ({ category, video })),
  );

  videosAccordionBody.innerHTML = `
    <div class="panel-heading">
      <div>
        <h3>Videolar</h3>
        <p class="muted">YouTube benzeri akıştaki videoları buradan yönet.</p>
      </div>
      <button class="secondary-button" data-action="openEditor" data-editor="video" type="button">Video Ekle</button>
    </div>
    <div class="admin-card-list">
      ${
        flattenedVideos.length
          ? flattenedVideos
              .map(
                ({ category, video }) => `
                  <article>
                    <div class="panel-heading">
                      <div>
                        <strong>${escapeHtml(video.title)}</strong>
                        <p class="muted">${escapeHtml(category.name)} · ${Number(video.views || 0).toLocaleString("tr-TR")} görüntüleme</p>
                      </div>
                      <span class="status-pill">${video.comments.length} yorum</span>
                    </div>
                    <p>${escapeHtml(video.description)}</p>
                    <div class="inline-actions">
                      <button class="secondary-button" data-action="editVideo" data-video-id="${video.id}" type="button">Düzenle</button>
                      <button class="danger-button" data-action="deleteVideo" data-video-id="${video.id}" type="button">Sil</button>
                    </div>
                  </article>
                `,
              )
              .join("")
          : `<div class="empty-state">Henüz video yok.</div>`
      }
    </div>
  `;

  productsAccordionBody.innerHTML = `
    <div class="panel-heading">
      <div>
        <h3>Ürünler</h3>
        <p class="muted">Ürün, dosya ve teslim kodlarını ayrı ayrı yönet.</p>
      </div>
      <button class="secondary-button" data-action="openEditor" data-editor="product" type="button">Ürün Ekle</button>
    </div>
    <div class="admin-card-list">
      ${
        state.store.products.length
          ? state.store.products
              .map(
                (product) => `
                  <article>
                    <div class="panel-heading">
                      <div>
                        <strong>${escapeHtml(product.name)}</strong>
                        <p class="muted">${escapeHtml(product.game)} / ${escapeHtml(product.type)}</p>
                      </div>
                      <span class="price-pill">${formatPrice(product)}</span>
                    </div>
                    <p>${escapeHtml(product.summary)}</p>
                    <p class="muted">
                      ${
                        product.delivery.enabled
                          ? `Kod teslimi aktif · ${escapeHtml(product.delivery.fileName || product.delivery.fileUrl || "Dosya bekliyor")}`
                          : "Kod teslimi kapalı"
                      }
                    </p>
                    <div class="inline-actions">
                      <button class="secondary-button" data-action="editProduct" data-product-id="${product.id}" type="button">Düzenle</button>
                      <button class="danger-button" data-action="deleteProduct" data-product-id="${product.id}" type="button">Sil</button>
                    </div>
                  </article>
                `,
              )
              .join("")
          : `<div class="empty-state">Henüz ürün yok.</div>`
      }
    </div>
  `;

  announcementsAccordionBody.innerHTML = `
    <div class="panel-heading">
      <div>
        <h3>Duyurular</h3>
        <p class="muted">Yazdığın duyurular doğrudan site mesajlarına düşer.</p>
      </div>
      <button class="secondary-button" data-action="openEditor" data-editor="announcement" type="button">Duyuru Ekle</button>
    </div>
    <div class="admin-card-list">
      ${
        state.announcements.length
          ? state.announcements
              .slice()
              .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
              .map(
                (announcement) => `
                  <article>
                    <div class="panel-heading">
                      <div>
                        <strong>${escapeHtml(announcement.title)}</strong>
                        <p class="muted">${formatDateTime(announcement.createdAt)}</p>
                      </div>
                    </div>
                    <p>${escapeHtml(announcement.body)}</p>
                    <div class="inline-actions">
                      <button class="secondary-button" data-action="editAnnouncement" data-announcement-id="${announcement.id}" type="button">Düzenle</button>
                      <button class="danger-button" data-action="deleteAnnouncement" data-announcement-id="${announcement.id}" type="button">Sil</button>
                    </div>
                  </article>
                `,
              )
              .join("")
          : `<div class="empty-state">Henüz duyuru yok.</div>`
      }
    </div>
  `;

  groupsAccordionBody.innerHTML = `
    <div class="panel-heading">
      <div>
        <h3>Mesaj Grupları</h3>
        <p class="muted">WhatsApp benzeri grup kutularını buradan düzenle.</p>
      </div>
      <button class="secondary-button" data-action="openEditor" data-editor="group" type="button">Grup Ekle</button>
    </div>
    <div class="admin-card-list">
      ${
        state.chat.groups.length
          ? state.chat.groups
              .map(
                (group) => `
                  <article>
                    <div class="panel-heading">
                      <div>
                        <strong>${escapeHtml(group.name)}</strong>
                        <p class="muted">${escapeHtml(group.description)}</p>
                      </div>
                      <span class="status-pill">${group.adminOnly ? "Yönetici" : group.joinCode ? "Şifreli" : "Açık"}</span>
                    </div>
                    <p class="muted">${group.messages.length}/${MAX_CHAT_MESSAGES} mesaj tutuluyor.</p>
                    <div class="inline-actions">
                      <button class="secondary-button" data-action="editGroup" data-group-id="${group.id}" type="button">Düzenle</button>
                      <button class="danger-button" data-action="deleteGroup" data-group-id="${group.id}" type="button">Sil</button>
                    </div>
                  </article>
                `,
              )
              .join("")
          : `<div class="empty-state">Henüz grup yok.</div>`
      }
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
        <p class="muted">@${escapeHtml(currentUser.username)} · ${currentUser.role === "admin" ? "Yönetici" : "Kullanıcı"}</p>
        <p class="muted">İletişim: ${escapeHtml(currentUser.contact)}</p>
      </div>
      <div class="inline-actions">
        ${isAdmin() ? `<button class="secondary-button" data-route="dashboard" type="button">Yönetime Git</button>` : ""}
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
          <input name="contact" placeholder="Discord veya DM" required />
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
  const product = findProduct(ui.selectedProductId);
  if (!product) {
    productModalBody.innerHTML = "";
    return;
  }

  productModalBody.innerHTML = `
    <div class="product-detail">
      <div class="product-detail-visual">
        <img class="product-cover" src="${escapeHtml(product.image)}" alt="${escapeHtml(product.name)}" />
      </div>
      <div class="form-stack">
        <span class="tag">${escapeHtml(product.game)} / ${escapeHtml(product.type)}</span>
        <h2>${escapeHtml(product.name)}</h2>
        <span class="price-pill">${formatPrice(product)}</span>
        <p>${escapeHtml(product.description)}</p>
        <p class="muted">${escapeHtml(product.summary)}</p>
        ${
          product.delivery.enabled
            ? `<p class="muted">Kod sistemi aktif. Ürün onaylandıktan sonra yönetici tarafından verilen kodla indirme açılır.</p>`
            : `<p class="muted">Teslim bu ürün için manuel ilerler.</p>`
        }
        <button class="primary-button" data-action="quickAddToCart" data-product-id="${product.id}" type="button">Sepete Ekle</button>
      </div>
    </div>
  `;
}

function renderEditorModal() {
  if (!ui.editor) {
    editorModalBody.innerHTML = "";
    return;
  }

  const { type, id } = ui.editor;

  if (type === "category") {
    const category = findCategory(id);
    editorModalBody.innerHTML = `
      <h2>${category ? "Liste Düzenle" : "Liste Ekle"}</h2>
      <form class="form-stack" id="categoryEditorForm">
        <input type="hidden" name="id" value="${escapeHtml(category?.id || "")}" />
        <label>
          <span>Liste Adı</span>
          <input name="name" value="${escapeHtml(category?.name || "")}" required />
        </label>
        <label>
          <span>Açıklama</span>
          <textarea name="description" rows="4" required>${escapeHtml(category?.description || "")}</textarea>
        </label>
        <button class="primary-button" type="submit">Kaydet</button>
      </form>
    `;
    return;
  }

  if (type === "video") {
    const video = findVideo(id);
    const categoryId = video ? findVideoCategory(id)?.id || ui.selectedCategoryId : ui.selectedCategoryId;
    editorModalBody.innerHTML = `
      <h2>${video ? "Video Düzenle" : "Video Ekle"}</h2>
      <form class="form-stack" id="videoEditorForm">
        <input type="hidden" name="id" value="${escapeHtml(video?.id || "")}" />
        <label>
          <span>Liste</span>
          <select name="categoryId" required>
            ${state.education.categories
              .map(
                (category) => `
                  <option value="${category.id}" ${category.id === categoryId ? "selected" : ""}>
                    ${escapeHtml(category.name)}
                  </option>
                `,
              )
              .join("")}
          </select>
        </label>
        <label>
          <span>Video Adı</span>
          <input name="title" value="${escapeHtml(video?.title || "")}" required />
        </label>
        <label>
          <span>Video URL</span>
          <input name="url" value="${escapeHtml(video?.url || "")}" required />
        </label>
        <label>
          <span>Kapak URL</span>
          <input name="cover" value="${escapeHtml(video?.cover || "")}" />
        </label>
        <label>
          <span>Açıklama</span>
          <textarea name="description" rows="4" required>${escapeHtml(video?.description || "")}</textarea>
        </label>
        <button class="primary-button" type="submit">Kaydet</button>
      </form>
    `;
    return;
  }

  if (type === "product") {
    const product = findProduct(id);
    editorModalBody.innerHTML = `
      <h2>${product ? "Ürün Düzenle" : "Ürün Ekle"}</h2>
      <form class="form-stack" id="productEditorForm">
        <input type="hidden" name="id" value="${escapeHtml(product?.id || "")}" />
        <div class="form-row">
          <label>
            <span>Ürün Adı</span>
            <input name="name" value="${escapeHtml(product?.name || "")}" required />
          </label>
          <label>
            <span>Oyun</span>
            <input name="game" value="${escapeHtml(product?.game || "")}" required />
          </label>
        </div>
        <div class="form-row">
          <label>
            <span>Tür</span>
            <input name="type" value="${escapeHtml(product?.type || "")}" required />
          </label>
          <label>
            <span>Fiyat</span>
            <input name="price" type="number" min="0" value="${Number(product?.price || 0)}" required />
          </label>
        </div>
        <label>
          <span>Ürün Görseli URL</span>
          <input name="image" value="${escapeHtml(product?.image || "")}" required />
        </label>
        <label>
          <span>Kısa Özet</span>
          <textarea name="summary" rows="3" required>${escapeHtml(product?.summary || "")}</textarea>
        </label>
        <label>
          <span>Detaylı Açıklama</span>
          <textarea name="description" rows="5" required>${escapeHtml(product?.description || "")}</textarea>
        </label>
        <label class="checkbox-row">
          <input name="deliveryEnabled" type="checkbox" ${product?.delivery.enabled ? "checked" : ""} />
          <span>Kod ile indirme sistemi aktif olsun</span>
        </label>
        <div class="form-row">
          <label>
            <span>Varsayılan Kod</span>
            <input name="accessCode" value="${escapeHtml(product?.delivery.accessCode || "")}" placeholder="Boşsa onay sırasında otomatik üretilir" />
          </label>
          <label>
            <span>İndirme URL</span>
            <input name="fileUrl" value="${escapeHtml(product?.delivery.fileUrl || "")}" placeholder="İsteğe bağlı dış bağlantı" />
          </label>
        </div>
        <label>
          <span>Kod Dosyası Yükle</span>
          <input name="downloadFile" type="file" />
        </label>
        ${product?.delivery.fileName ? `<p class="muted">Mevcut dosya: ${escapeHtml(product.delivery.fileName)}</p>` : ""}
        <label>
          <span>Kod Alanı Notu</span>
          <textarea name="deliveryNote" rows="3">${escapeHtml(product?.delivery.note || "")}</textarea>
        </label>
        <button class="primary-button" type="submit">Kaydet</button>
      </form>
    `;
    return;
  }

  if (type === "announcement") {
    const announcement = state.announcements.find((item) => item.id === id);
    editorModalBody.innerHTML = `
      <h2>${announcement ? "Duyuru Düzenle" : "Duyuru Ekle"}</h2>
      <form class="form-stack" id="announcementEditorForm">
        <input type="hidden" name="id" value="${escapeHtml(announcement?.id || "")}" />
        <label>
          <span>Başlık</span>
          <input name="title" value="${escapeHtml(announcement?.title || "")}" required />
        </label>
        <label>
          <span>Mesaj</span>
          <textarea name="body" rows="5" required>${escapeHtml(announcement?.body || "")}</textarea>
        </label>
        <button class="primary-button" type="submit">Kaydet</button>
      </form>
    `;
    return;
  }

  if (type === "group") {
    const group = findGroup(id);
    editorModalBody.innerHTML = `
      <h2>${group ? "Grup Düzenle" : "Grup Ekle"}</h2>
      <form class="form-stack" id="groupEditorForm">
        <input type="hidden" name="id" value="${escapeHtml(group?.id || "")}" />
        <label>
          <span>Grup Adı</span>
          <input name="name" value="${escapeHtml(group?.name || "")}" required />
        </label>
        <label>
          <span>Açıklama</span>
          <textarea name="description" rows="4" required>${escapeHtml(group?.description || "")}</textarea>
        </label>
        <label class="checkbox-row">
          <input name="adminOnly" type="checkbox" ${group?.adminOnly ? "checked" : ""} />
          <span>Bu grup sadece yöneticilere açık olsun</span>
        </label>
        <label>
          <span>Grup Şifresi</span>
          <input name="joinCode" value="${escapeHtml(group?.joinCode || "")}" placeholder="Boş bırakırsan açık grup olur" />
        </label>
        <button class="primary-button" type="submit">Kaydet</button>
      </form>
    `;
    return;
  }

  if (type === "requestReply") {
    const request = findRequest(id);
    editorModalBody.innerHTML = `
      <h2>Talebe Yanıt Yaz</h2>
      <form class="form-stack" id="requestReplyForm">
        <input type="hidden" name="id" value="${escapeHtml(request?.id || "")}" />
        <p class="muted">${escapeHtml(request?.fullName || "")} için yönetici notu yaz.</p>
        <label>
          <span>Yanıt</span>
          <textarea name="reply" rows="5" required>${escapeHtml(request?.adminReply || "")}</textarea>
        </label>
        <button class="primary-button" type="submit">Yanıtı Kaydet</button>
      </form>
    `;
  }
}

function renderUserModal() {
  const user = findUser(ui.inspectedUserId);
  const group = findGroup(ui.selectedGroupId);
  if (!user) {
    userModalBody.innerHTML = "";
    return;
  }

  const muteUntil = group ? getGroupMuteUntil(group, user.id) : "";
  const banUntil = group ? getGroupBanUntil(group, user.id) : "";

  userModalBody.innerHTML = `
    <h2>Kullanıcı Bilgileri</h2>
    <div class="user-profile-card">
      <strong>${escapeHtml(user.fullName)}</strong>
      <p class="muted">@${escapeHtml(user.username)} · ${user.role === "admin" ? "Yönetici" : "Kullanıcı"}</p>
      <p><strong>İletişim:</strong> ${escapeHtml(user.contact || "-")}</p>
      <p><strong>Yaş:</strong> ${escapeHtml(user.age || "-")}</p>
      <p><strong>Son Görülme:</strong> ${formatDateTime(user.lastSeen || user.createdAt)}</p>
      ${
        group
          ? `
              <p><strong>Grup Susturma:</strong> ${muteUntil ? formatDateTime(muteUntil) : "Yok"}</p>
              <p><strong>Grup Yasak:</strong> ${banUntil ? formatDateTime(banUntil) : "Yok"}</p>
            `
          : ""
      }
    </div>
    ${
      isAdmin() && group && user.role !== "admin"
        ? `
            <div class="inline-actions">
              <button class="status-button" data-action="muteUser" data-group-id="${group.id}" data-user-id="${user.id}" type="button">1 Saat Sustur</button>
              <button class="danger-button" data-action="banUser" data-group-id="${group.id}" data-user-id="${user.id}" type="button">24 Saat Banla</button>
              <button class="secondary-button" data-action="clearUserPenalty" data-group-id="${group.id}" data-user-id="${user.id}" type="button">Cezayı Temizle</button>
            </div>
          `
        : ""
    }
  `;
}

function renderAll() {
  ensureSelections();
  renderTopbar();
  renderHome();
  renderEducation();
  renderStore();
  renderCart();
  renderMessages();
  renderAnnouncements();
  renderDashboard();
  renderAuthModal();
  renderProductModal();
  renderEditorModal();
  renderUserModal();
  setRoute(ui.route);
}

function addProductToCart(productId) {
  const cart = getCurrentCart();
  ui.cartNoticeText = "";
  if (!cart.includes(productId)) {
    cart.push(productId);
    setCurrentCart(cart);
    showToast("Ürün sepete eklendi.", "success");
  } else {
    showToast("Bu ürün zaten sepetinde.", "info");
  }
}

function selectVideo(videoId) {
  if (ui.selectedVideoId === videoId) return;
  ui.selectedVideoId = videoId;
  const video = findVideo(videoId);
  if (video) {
    video.views = Number(video.views || 0) + 1;
    saveState();
  }
}

function handleUserPenalty(action, groupId, userId) {
  const group = findGroup(groupId);
  if (!group || !isAdmin() || !userId) return;

  if (action === "mute") {
    group.mutedUsers[userId] = addHoursToIso(MUTE_HOURS);
    delete group.bannedUsers[userId];
    showToast("Kullanıcı 1 saat susturuldu.", "success");
  }

  if (action === "ban") {
    group.bannedUsers[userId] = addHoursToIso(BAN_HOURS);
    delete group.mutedUsers[userId];
    showToast("Kullanıcı 24 saat banlandı.", "success");
  }

  if (action === "clear") {
    delete group.mutedUsers[userId];
    delete group.bannedUsers[userId];
    showToast("Kullanıcı cezası temizlendi.", "success");
  }

  saveState();
  renderAll();
}

document.addEventListener("click", (event) => {
  if (event.target.closest("#menuToggleButton")) {
    toggleTopbarMenu();
    return;
  }

  const routeButton = event.target.closest("[data-route]");
  if (routeButton) {
    setRoute(routeButton.dataset.route);
    if (!authModal.classList.contains("hidden")) closeModal(authModal);
    if (!productModal.classList.contains("hidden")) closeModal(productModal);
    if (!editorModal.classList.contains("hidden")) closeEditor();
    if (!userModal.classList.contains("hidden")) closeModal(userModal);
    return;
  }

  const closeButton = event.target.closest("[data-close]");
  if (closeButton) {
    const modal = document.getElementById(closeButton.dataset.close);
    if (modal === editorModal) closeEditor();
    else closeModal(modal);
    return;
  }

  const actionButton = event.target.closest("[data-action]");
  if (!actionButton) return;
  const action = actionButton.dataset.action;

  if (action === "openAuthPrompt") {
    ui.authMode = actionButton.dataset.mode || "login";
    renderAuthModal();
    openModal(authModal);
    return;
  }

  if (action === "switchAuthMode") {
    ui.authMode = actionButton.dataset.mode;
    renderAuthModal();
    return;
  }

  if (action === "selectCategory") {
    ui.selectedCategoryId = actionButton.dataset.categoryId;
    ui.selectedVideoId = findCategory(ui.selectedCategoryId)?.videos[0]?.id || "";
    renderEducation();
    return;
  }

  if (action === "playVideo") {
    selectVideo(actionButton.dataset.videoId);
    renderEducation();
    return;
  }

  if (action === "toggleVideoLike") {
    const video = findVideo(ui.selectedVideoId);
    if (!video) return;
    const identity = getIdentityKey();
    const alreadyLiked = video.likes.includes(identity);
    video.likes = alreadyLiked
      ? video.likes.filter((item) => item !== identity)
      : [...video.likes, identity];
    saveState();
    renderEducation();
    return;
  }

  if (action === "openProduct") {
    ui.selectedProductId = actionButton.dataset.productId;
    renderProductModal();
    openModal(productModal);
    return;
  }

  if (action === "quickAddToCart") {
    addProductToCart(actionButton.dataset.productId);
    if (!productModal.classList.contains("hidden") && actionButton.closest("#productModal")) {
      closeModal(productModal);
      setRoute("cart");
    }
    renderAll();
    return;
  }

  if (action === "removeFromCart") {
    const nextItems = getCurrentCart().filter((productId) => productId !== actionButton.dataset.productId);
    setCurrentCart(nextItems);
    renderAll();
    return;
  }

  if (action === "downloadProduct") {
    const product = findProduct(actionButton.dataset.productId);
    if (!product) return;
    const href = product.delivery.fileDataUrl || product.delivery.fileUrl;
    if (!href) {
      showToast("Bu ürün için indirilecek dosya eklenmemiş.", "error");
      return;
    }
    triggerDownload(href, product.delivery.fileName || `${slugify(product.name)}.zip`);
    return;
  }

  if (action === "openGroup") {
    ui.selectedGroupId = actionButton.dataset.groupId;
    ui.activeMessageMenuId = "";
    setRoute("messages");
    renderMessages();
    return;
  }

  if (action === "toggleMessageMenu") {
    ui.activeMessageMenuId =
      ui.activeMessageMenuId === actionButton.dataset.messageId ? "" : actionButton.dataset.messageId;
    renderMessages();
    return;
  }

  if (action === "deleteMessage" && isAdmin()) {
    const group = findGroup(actionButton.dataset.groupId);
    if (!group) return;
    group.messages = group.messages.filter((message) => message.id !== actionButton.dataset.messageId);
    ui.activeMessageMenuId = "";
    saveState();
    renderMessages();
    return;
  }

  if (action === "muteMessageAuthor" && isAdmin()) {
    handleUserPenalty("mute", actionButton.dataset.groupId, actionButton.dataset.userId);
    return;
  }

  if (action === "banMessageAuthor" && isAdmin()) {
    handleUserPenalty("ban", actionButton.dataset.groupId, actionButton.dataset.userId);
    return;
  }

  if (action === "inspectUser") {
    const targetUser = findUser(actionButton.dataset.userId);
    if (!targetUser) {
      showToast("Bu kullanıcı bilgisi bulunamadı.", "error");
      return;
    }
    ui.inspectedUserId = targetUser.id;
    renderUserModal();
    openModal(userModal);
    return;
  }

  if (action === "muteUser" && isAdmin()) {
    handleUserPenalty("mute", actionButton.dataset.groupId, actionButton.dataset.userId);
    renderUserModal();
    return;
  }

  if (action === "banUser" && isAdmin()) {
    handleUserPenalty("ban", actionButton.dataset.groupId, actionButton.dataset.userId);
    renderUserModal();
    return;
  }

  if (action === "clearUserPenalty" && isAdmin()) {
    handleUserPenalty("clear", actionButton.dataset.groupId, actionButton.dataset.userId);
    renderUserModal();
    return;
  }
});

document.addEventListener("click", (event) => {
  if (!isMobileLayout()) return;
  if (!topbar.classList.contains("menu-open")) return;
  if (event.target.closest(".topbar")) return;
  closeTopbarMenu();
});

document.addEventListener("click", (event) => {
  const actionButton = event.target.closest("[data-action]");
  if (!actionButton) return;
  const action = actionButton.dataset.action;

  if (action === "toggleAccordion") {
    const key = actionButton.dataset.key;
    ui.activeAccordion[key] = !ui.activeAccordion[key];
    renderDashboard();
    return;
  }

  if (action === "openEditor" && isAdmin()) {
    openEditor(actionButton.dataset.editor);
    return;
  }

  if (action === "editCategory" && isAdmin()) {
    openEditor("category", actionButton.dataset.categoryId);
    return;
  }

  if (action === "editVideo" && isAdmin()) {
    openEditor("video", actionButton.dataset.videoId);
    return;
  }

  if (action === "editProduct" && isAdmin()) {
    openEditor("product", actionButton.dataset.productId);
    return;
  }

  if (action === "editAnnouncement" && isAdmin()) {
    openEditor("announcement", actionButton.dataset.announcementId);
    return;
  }

  if (action === "editGroup" && isAdmin()) {
    openEditor("group", actionButton.dataset.groupId);
    return;
  }

  if (action === "replyRequest" && isAdmin()) {
    openEditor("requestReply", actionButton.dataset.requestId);
    return;
  }

  if (action === "approveRequest" && isAdmin()) {
    const request = findRequest(actionButton.dataset.requestId);
    if (!request) return;
    const wasApproved = request.status === "Onaylandı";
    request.status = "Onaylandı";
    request.approvedAt = nowIso();
    request.deliveryCodes = request.deliveryCodes && typeof request.deliveryCodes === "object" ? request.deliveryCodes : {};
    getRequestProducts(request).forEach((product) => {
      if (!product.delivery.enabled) return;
      if (!wasApproved || !request.deliveryCodes[product.id]) {
        request.deliveryCodes[product.id] = product.delivery.accessCode || generateAccessCode(product.name);
      }
    });
    saveState();
    renderAll();
    showToast("Talep onaylandı.", "success");
    return;
  }

  if (action === "deleteRequest" && isAdmin()) {
    state.requests = state.requests.filter((request) => request.id !== actionButton.dataset.requestId);
    saveState();
    renderAll();
    showToast("Talep silindi.", "success");
    return;
  }

  if (action === "deleteCategory" && isAdmin()) {
    state.education.categories = state.education.categories.filter(
      (category) => category.id !== actionButton.dataset.categoryId,
    );
    ensureSelections();
    saveState();
    renderAll();
    showToast("Liste silindi.", "success");
    return;
  }

  if (action === "deleteVideo" && isAdmin()) {
    state.education.categories = state.education.categories.map((category) => ({
      ...category,
      videos: category.videos.filter((video) => video.id !== actionButton.dataset.videoId),
    }));
    ensureSelections();
    saveState();
    renderAll();
    showToast("Video silindi.", "success");
    return;
  }

  if (action === "deleteProduct" && isAdmin()) {
    state.store.products = state.store.products.filter((product) => product.id !== actionButton.dataset.productId);
    ensureSelections();
    saveState();
    renderAll();
    showToast("Ürün silindi.", "success");
    return;
  }

  if (action === "deleteAnnouncement" && isAdmin()) {
    state.announcements = state.announcements.filter(
      (announcement) => announcement.id !== actionButton.dataset.announcementId,
    );
    saveState();
    renderAll();
    showToast("Duyuru silindi.", "success");
    return;
  }

  if (action === "deleteGroup" && isAdmin()) {
    state.chat.groups = state.chat.groups.filter((group) => group.id !== actionButton.dataset.groupId);
    ensureSelections();
    saveState();
    renderAll();
    showToast("Grup silindi.", "success");
    return;
  }

  if (action === "logout") {
    sessionUserId = "";
    saveSession();
    if (ui.route === "dashboard") ui.route = "home";
    renderAll();
    closeModal(authModal);
  }
});

document.addEventListener("submit", async (event) => {
  const form = event.target;

  if (form.id === "loginForm") {
    event.preventDefault();
    const formData = new FormData(form);
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
    closeModal(authModal);
    ui.cartNoticeText = "";
    renderAll();
    showToast("Oturum açıldı.", "success");
    return;
  }

  if (form.id === "registerForm") {
    event.preventDefault();
    const formData = new FormData(form);
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
    closeModal(authModal);
    renderAll();
    showToast("Kayıt tamamlandı ve oturum açıldı.", "success");
    return;
  }

  if (form.id === "videoCommentForm") {
    event.preventDefault();
    const currentUser = getCurrentUser();
    const selectedVideo = findVideo(ui.selectedVideoId);
    if (!currentUser || !selectedVideo) return;

    const commentText = String(new FormData(form).get("comment")).trim();
    if (!commentText) return;

    selectedVideo.comments.push({
      id: createId(),
      userId: currentUser.id,
      fullName: currentUser.fullName,
      text: commentText,
      createdAt: nowIso(),
    });

    currentUser.lastSeen = nowIso();
    saveState();
    form.reset();
    renderEducation();
    showToast("Yorum eklendi.", "success");
    return;
  }

  if (form.dataset.form === "unlockProduct") {
    event.preventDefault();
    const currentUser = getCurrentUser();
    if (!currentUser) {
      showToast("Kod açmak için oturum açmalısın.", "error");
      return;
    }

    const product = findProduct(form.dataset.productId);
    if (!product) return;

    const approvedDeliveries = getApprovedDeliveriesForCurrentUser();
    if (!approvedDeliveries.some((item) => item.product.id === product.id)) {
      showToast("Bu ürün henüz onaylanmamış.", "error");
      return;
    }

    const inputCode = String(new FormData(form).get("accessCode")).trim();
    const codeMatched = approvedDeliveries.some(
      (delivery) => delivery.product.id === product.id && delivery.code === inputCode,
    );

    if (!inputCode || !codeMatched) {
      showToast("Girilen kod hatalı.", "error");
      return;
    }

    const unlocks = getUserUnlocks(currentUser.id);
    unlocks[product.id] = true;
    saveState();
    renderCart();
    showToast("Kod doğrulandı. İndirme açıldı.", "success");
    return;
  }

  if (form.id === "checkoutForm") {
    event.preventDefault();
    const currentUser = getCurrentUser();
    if (!currentUser) return;

    const formData = new FormData(form);
    const products = getCartProducts();
    if (!products.length) {
      showToast("Sepette ürün yok.", "error");
      return;
    }

    currentUser.fullName = String(formData.get("fullName")).trim();
    currentUser.age = String(formData.get("age")).trim();
    currentUser.contact = String(formData.get("contact")).trim();
    currentUser.lastSeen = nowIso();

    state.requests.unshift({
      id: createId(),
      userId: currentUser.id,
      fullName: currentUser.fullName,
      age: currentUser.age,
      contact: currentUser.contact,
      note: String(formData.get("note") || "").trim(),
      items: products.map((product) => product.id),
      total: getCartTotal(),
      status: "Beklemede",
      adminReply: "",
      createdAt: nowIso(),
      approvedAt: "",
      deliveryCodes: {},
    });

    setCurrentCart([]);
    ui.cartNoticeText = "Talebin iletildi.";
    saveState();
    renderAll();
    showToast("Talep gönderildi.", "success");
    return;
  }

  if (form.id === "groupAccessForm") {
    event.preventDefault();
    const currentUser = getCurrentUser();
    if (!currentUser) return;

    const formData = new FormData(form);
    const group = findGroup(String(formData.get("groupId")));
    const joinCode = String(formData.get("joinCode")).trim();

    if (!group) return;
    if (joinCode !== group.joinCode) {
      showToast("Grup şifresi yanlış.", "error");
      return;
    }

    if (!group.allowedUserIds.includes(currentUser.id)) {
      group.allowedUserIds.push(currentUser.id);
    }
    saveState();
    renderMessages();
    showToast("Gruba giriş yapıldı.", "success");
    return;
  }

  if (form.id === "messageForm") {
    event.preventDefault();
    const currentUser = getCurrentUser();
    if (!currentUser) return;

    const formData = new FormData(form);
    const group = findGroup(String(formData.get("groupId")));
    if (!group) return;

    const muteUntil = getGroupMuteUntil(group, currentUser.id);
    const banUntil = getGroupBanUntil(group, currentUser.id);
    if (muteUntil || banUntil) {
      showToast("Bu grupta şu an mesaj gönderemezsin.", "error");
      return;
    }

    const text = String(formData.get("message")).trim();
    if (!text) return;

    group.messages = [
      ...group.messages,
      {
        id: createId(),
        userId: currentUser.id,
        fullName: currentUser.fullName,
        text,
        createdAt: nowIso(),
      },
    ].slice(-MAX_CHAT_MESSAGES);

    currentUser.lastSeen = nowIso();
    saveState();
    form.reset();
    renderMessages();
    showToast("Mesaj gönderildi.", "success");
    return;
  }

  if (form.id === "securityForm") {
    event.preventDefault();
    const formData = new FormData(form);
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
    form.reset();
    renderDashboard();
    showToast("Yönetici şifresi güncellendi.", "success");
    return;
  }

  if (form.id === "settingsForm") {
    event.preventDefault();
    const formData = new FormData(form);
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
    return;
  }

  if (form.id === "categoryEditorForm" && isAdmin()) {
    event.preventDefault();
    const formData = new FormData(form);
    const id = String(formData.get("id"));
    const payload = {
      id: id || createId(),
      name: String(formData.get("name")),
      description: String(formData.get("description")),
      videos: id ? findCategory(id)?.videos || [] : [],
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
    showToast("Liste kaydedildi.", "success");
    return;
  }

  if (form.id === "videoEditorForm" && isAdmin()) {
    event.preventDefault();
    const formData = new FormData(form);
    const id = String(formData.get("id"));
    const categoryId = String(formData.get("categoryId"));
    const payload = createVideo({
      id: id || createId(),
      title: String(formData.get("title")),
      url: String(formData.get("url")),
      cover: String(formData.get("cover") || ""),
      description: String(formData.get("description")),
      views: id ? findVideo(id)?.views || 0 : 0,
      likes: id ? findVideo(id)?.likes || [] : [],
      comments: id ? findVideo(id)?.comments || [] : [],
      createdAt: id ? findVideo(id)?.createdAt || nowIso() : nowIso(),
    });

    state.education.categories = state.education.categories.map((category) => ({
      ...category,
      videos: category.videos.filter((video) => video.id !== id),
    }));

    state.education.categories = state.education.categories.map((category) =>
      category.id === categoryId ? { ...category, videos: [...category.videos, payload] } : category,
    );

    ui.selectedCategoryId = categoryId;
    ui.selectedVideoId = payload.id;
    saveState();
    closeEditor();
    renderAll();
    showToast("Video kaydedildi.", "success");
    return;
  }

  if (form.id === "productEditorForm" && isAdmin()) {
    event.preventDefault();
    const formData = new FormData(form);
    const id = String(formData.get("id"));
    const existing = findProduct(id);
    const file = form.querySelector('input[name="downloadFile"]').files?.[0];
    let fileDataUrl = existing?.delivery.fileDataUrl || "";
    let fileName = existing?.delivery.fileName || "";

    if (file) {
      try {
        fileDataUrl = await readFileAsDataUrl(file);
        fileName = file.name;
      } catch (error) {
        console.error(error);
        showToast("Kod dosyası okunamadı.", "error");
        return;
      }
    }

    const payload = createProduct({
      id: id || createId(),
      name: String(formData.get("name")),
      game: String(formData.get("game")),
      type: String(formData.get("type")),
      price: Number(formData.get("price")),
      image: String(formData.get("image")),
      summary: String(formData.get("summary")),
      description: String(formData.get("description")),
      delivery: {
        enabled: formData.get("deliveryEnabled") === "on",
        accessCode: String(formData.get("accessCode") || "").trim(),
        fileName,
        fileDataUrl,
        fileUrl: String(formData.get("fileUrl") || "").trim(),
        note: String(formData.get("deliveryNote") || "").trim(),
      },
    });

    if (id) {
      state.store.products = state.store.products.map((product) => (product.id === id ? payload : product));
    } else {
      state.store.products.unshift(payload);
    }

    saveState();
    closeEditor();
    renderAll();
    showToast("Ürün kaydedildi.", "success");
    return;
  }

  if (form.id === "announcementEditorForm" && isAdmin()) {
    event.preventDefault();
    const formData = new FormData(form);
    const id = String(formData.get("id"));
    const payload = {
      id: id || createId(),
      title: String(formData.get("title")),
      body: String(formData.get("body")),
      createdAt: id
        ? state.announcements.find((announcement) => announcement.id === id)?.createdAt || nowIso()
        : nowIso(),
    };

    if (id) {
      state.announcements = state.announcements.map((announcement) =>
        announcement.id === id ? payload : announcement,
      );
    } else {
      state.announcements.unshift(payload);
    }

    saveState();
    closeEditor();
    renderAll();
    showToast("Duyuru site mesajlarına düştü.", "success");
    return;
  }

  if (form.id === "groupEditorForm" && isAdmin()) {
    event.preventDefault();
    const formData = new FormData(form);
    const id = String(formData.get("id"));
    const existing = findGroup(id);
    const payload = createGroup({
      id: id || createId(),
      name: String(formData.get("name")),
      description: String(formData.get("description")),
      adminOnly: formData.get("adminOnly") === "on",
      joinCode: String(formData.get("joinCode") || "").trim(),
      allowedUserIds: existing?.allowedUserIds || [],
      mutedUsers: existing?.mutedUsers || {},
      bannedUsers: existing?.bannedUsers || {},
      messages: existing?.messages || [],
      createdAt: existing?.createdAt || nowIso(),
    });

    if (id) {
      state.chat.groups = state.chat.groups.map((group) => (group.id === id ? payload : group));
    } else {
      state.chat.groups.unshift(payload);
      ui.selectedGroupId = payload.id;
    }

    saveState();
    closeEditor();
    renderAll();
    showToast("Grup kaydedildi.", "success");
    return;
  }

  if (form.id === "requestReplyForm" && isAdmin()) {
    event.preventDefault();
    const formData = new FormData(form);
    const request = findRequest(String(formData.get("id")));
    if (!request) return;

    request.adminReply = String(formData.get("reply"));
    if (request.status !== "Onaylandı") {
      request.status = "Yanıtlandı";
    }
    saveState();
    closeEditor();
    renderAll();
    showToast("Yanıt kaydedildi.", "success");
  }
});

openAuthButton.addEventListener("click", () => {
  renderAuthModal();
  openModal(authModal);
});

window.addEventListener("resize", () => {
  if (!isMobileLayout()) closeTopbarMenu();
});

[authModal, productModal, editorModal, userModal].forEach((modal) => {
  modal.addEventListener("click", (event) => {
    if (event.target === modal) {
      if (modal === editorModal) closeEditor();
      else closeModal(modal);
    }
  });
});

touchCurrentUser();
renderAll();
