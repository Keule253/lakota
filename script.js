const RANKS = ['Häuptling', 'Schamane', '1. Krieger', 'Krieger', 'Heiler'];
const STATUSES = ['Wach', 'Schlafen'];

const PERMISSIONS = {
  'Häuptling': { hire: true, transfer: true, message: true, promote: true, sanction: true, fire: true, statusChange: true },
  'Schamane': { hire: false, transfer: true, message: true, promote: false, sanction: false, fire: false, statusChange: true },
  '1. Krieger': { hire: false, transfer: true, message: true, promote: false, sanction: false, fire: false, statusChange: true },
  'Krieger': { hire: false, transfer: true, message: true, promote: false, sanction: false, fire: false, statusChange: false },
  'Heiler': { hire: false, transfer: false, message: true, promote: false, sanction: false, fire: false, statusChange: false }
};

const STORAGE_KEYS = {
  employees: 'app_employees',
  currentUser: 'app_currentUser',
  inventory: 'app_inventory',
  inventoryCategories: 'app_inventoryCategories',
  todos: 'app_todos',
  todoCategories: 'app_todoCategories',
  reports: 'app_reports',
  logs: 'app_logs'
};

const loginPage = document.getElementById('loginPage');
const appPage = document.getElementById('appPage');
const loginForm = document.getElementById('loginForm');
const loginError = document.getElementById('loginError');
const currentUserName = document.getElementById('currentUserName');
const logoutButton = document.getElementById('logoutButton');
const statusSelect = document.getElementById('statusSelect');
const dashboardUserInfo = document.getElementById('dashboardUserInfo');
const employeeCount = document.getElementById('employeeCount');
const dashboardOnDutyCount = document.getElementById('dashboardOnDutyCount');
const dashboardOffDutyCount = document.getElementById('dashboardOffDutyCount');
const statusCounts = document.getElementById('statusCounts');
const dashboardRankBreakdown = document.getElementById('dashboardRankBreakdown');
const dashboardMessagePreview = document.getElementById('dashboardMessagePreview');
const dashboardActionsList = document.getElementById('dashboardActionsList');
const managementSummary = document.getElementById('managementSummary');
const employeeDetailActions = document.querySelector('.employee-detail-actions');
const updateSelectedStatusButton = document.getElementById('updateSelectedStatus');

const pages = Array.from(document.querySelectorAll('.content .page'));
const navButtons = Array.from(document.querySelectorAll('[data-page]')).filter((element) => element.tagName === 'BUTTON');
const logNavButtons = Array.from(document.querySelectorAll('[data-page="logPage"]'));
const topNav = document.getElementById('topNav');
const menuToggle = document.getElementById('menuToggle');
const closeTopNav = document.getElementById('closeTopNav');

let selectedRankFilter = '';
let selectedStatusFilter = '';
let selectedEmployeeSearch = '';
const employeeSelect = document.getElementById('employeeSelect');
const employeeSearch = document.getElementById('employeeSearch');
const employeeRankFilter = document.getElementById('employeeRankFilter');
const employeeStatusFilter = document.getElementById('employeeStatusFilter');
const clearEmployeeFilters = document.getElementById('clearEmployeeFilters');
const employeeList = document.getElementById('employeeList');

const hireForm = document.getElementById('hireForm');
const promoteForm = document.getElementById('promoteForm');
const messageForm = document.getElementById('messageForm');
const fireForm = document.getElementById('fireForm');
const hireName = document.getElementById('hireName');
const hireUsername = document.getElementById('hireUsername');
const hirePassword = document.getElementById('hirePassword');
const hireRank = document.getElementById('hireRank');
const promoteRank = document.getElementById('promoteRank');
const messageText = document.getElementById('messageText');
const notificationBell = document.getElementById('notificationBell');
const notificationPanel = document.getElementById('notificationPanel');
const notificationList = document.getElementById('notificationList');
const closeNotificationPanel = document.getElementById('closeNotificationPanel');
const accountPanel = document.getElementById('accountPanel');
const closeAccountPanel = document.getElementById('closeAccountPanel');
const accountUserName = document.getElementById('accountUserName');
const accountUserRank = document.getElementById('accountUserRank');
const accountUserStatus = document.getElementById('accountUserStatus');
const openDashboardPage = document.getElementById('openDashboardPage');
const messageRecipientType = document.getElementById('messageRecipientType');
const messageEmployeeFilter = document.getElementById('messageEmployeeFilter');
const messageEmployeeGroup = document.getElementById('messageEmployeeGroup');
const messageRecipientCount = document.getElementById('messageRecipientCount');
const selectedEmployeeStatus = document.getElementById('selectedEmployeeStatus');
const selectedEmployeeBadge = document.getElementById('selectedEmployeeBadge');
const selectedEmployeeInfo = document.getElementById('selectedEmployeeInfo');
const selectedEmployeeRank = document.getElementById('selectedEmployeeRank');
const selectedEmployeeDetails = document.getElementById('selectedEmployeeDetails');
const updateSelectedStatus = document.getElementById('updateSelectedStatus');

const reportUpload = document.getElementById('reportUpload');
const reportList = document.getElementById('reportList');
const logList = document.getElementById('logList');
const inventoryName = document.getElementById('inventoryName');
const inventoryQuantity = document.getElementById('inventoryQuantity');
const addInventoryItemButton = document.getElementById('addInventoryItem');
const inventoryList = document.getElementById('inventoryList');
const todoText = document.getElementById('todoText');
const todoPriority = document.getElementById('todoPriority');
const todoDueDate = document.getElementById('todoDueDate');
const addTodoItemButton = document.getElementById('addTodoItem');
const todoList = document.getElementById('todoList');
const clearStorage = document.getElementById('clearStorage');

let employees = [];
let currentUser = null;
let inventoryData = [];
let todoData = [];
let reportsData = [];
let logsData = [];
let inventoryCategories = [];
let todoCategories = [];
let selectedEmployeeId = null;

async function readStorage(key) {
  if (window.indexedDB) {
    try {
      const result = await dbGet(key);
      return result === undefined ? null : result;
    } catch (error) {
      console.warn('[db] readStorage fallback to localStorage', error);
    }
  }
  return JSON.parse(localStorage.getItem(key) || 'null');
}

async function writeStorage(key, value) {
  if (window.indexedDB) {
    try {
      await dbSet(key, value);
      return;
    } catch (error) {
      console.warn('[db] writeStorage fallback to localStorage', error);
    }
  }
  localStorage.setItem(key, JSON.stringify(value));
}

async function clearAllStorage() {
  if (window.indexedDB) {
    try {
      await dbClear();
    } catch (error) {
      console.warn('[db] clearAllStorage failed', error);
    }
  }
  localStorage.clear();
}

async function initializeData() {
  if (window.indexedDB) {
    try {
      await openAppDatabase();
    } catch (error) {
      console.warn('[db] IndexedDB opening failed', error);
    }
  }

  employees = (await readStorage(STORAGE_KEYS.employees) || []).map((employee) => {
    const normalizedEmployee = {
      ...employee,
      messages: (employee.messages || []).map((message) => ({
        id: message.id || generateId(),
        ...message
      })),
      status: employee.status === 'Im Dienst' ? 'Wach'
        : employee.status === 'Außer Dienst' || employee.status === 'Klingel' ? 'Schlafen'
        : employee.status || 'Schlafen',
      rank: employee.username && employee.username.toLowerCase() === 'admin' ? 'Häuptling'
        : RANKS.includes(employee.rank) ? employee.rank : 'Krieger',
      training: []
    };
    delete normalizedEmployee.station;
    return normalizedEmployee;
  });
  currentUser = await readStorage(STORAGE_KEYS.currentUser) || null;
  if (currentUser) {
    currentUser.status = currentUser.status === 'Im Dienst' ? 'Wach'
      : currentUser.status === 'Außer Dienst' || currentUser.status === 'Klingel' ? 'Schlafen'
      : currentUser.status || 'Schlafen';
    currentUser.rank = currentUser.username && currentUser.username.toLowerCase() === 'admin'
      ? 'Häuptling'
      : RANKS.includes(currentUser.rank) ? currentUser.rank : 'Krieger';
    currentUser.training = [];
    delete currentUser.station;
  }
  inventoryData = await readStorage(STORAGE_KEYS.inventory) || [];
  todoData = await readStorage(STORAGE_KEYS.todos) || [];
  inventoryCategories = await readStorage(STORAGE_KEYS.inventoryCategories) || ['Sonstiges'];
  todoCategories = await readStorage(STORAGE_KEYS.todoCategories) || ['Allgemein'];
  reportsData = await readStorage(STORAGE_KEYS.reports) || [];
  logsData = await readStorage(STORAGE_KEYS.logs) || [];

  console.log('[init] loaded employees from storage:', employees.length, employees.map(e => e.username));
  const hasAdmin = employees.some((employee) => employee.username === 'admin');
  if (!hasAdmin) {
    employees.push({
      id: generateId(),
      name: 'Admin Leitung',
      username: 'admin',
      password: 'admin',
      rank: 'Häuptling',
      status: 'Wach',
      training: [],
      sanctions: [],
      messages: []
    });
    await saveEmployees();
  }

  if (!inventoryData.length) {
    inventoryData = [{ id: generateId(), name: 'Notfallversorgung', quantity: 12, category: inventoryCategories[0] || 'Sonstiges' }];
    writeStorage(STORAGE_KEYS.inventory, inventoryData);
  }

  if (!todoData.length) {
    todoData = [{ id: generateId(), text: 'Erste Aufgabe hinzufügen', done: false, priority: 'Normal', dueDate: '', createdAt: new Date().toLocaleString(), folder: todoCategories[0] || 'Allgemein' }];
    writeStorage(STORAGE_KEYS.todos, todoData);
  }

  if (!reportsData.length) {
    reportsData = [];
    writeStorage(STORAGE_KEYS.reports, reportsData);
  }

  if (!logsData.length) {
    logsData = [];
    writeStorage(STORAGE_KEYS.logs, logsData);
  }

  // render debug panel if present
  setTimeout(renderDebugPanel, 60);
}

function saveInventoryCategories() {
  return writeStorage(STORAGE_KEYS.inventoryCategories, inventoryCategories);
}

function saveTodoCategories() {
  return writeStorage(STORAGE_KEYS.todoCategories, todoCategories);
}

function renderDebugPanel() {
  const debugText = document.getElementById('debugText');
  if (!debugText) return;
  try {
    const stored = {};
    Object.keys(localStorage).forEach(k => { stored[k] = localStorage.getItem(k); });
    const safeEmployees = employees.map(e => ({ id: e.id, username: e.username, name: e.name }));
    const info = {
      employees: safeEmployees,
      employeesCount: employees.length,
      currentUser: currentUser ? { id: currentUser.id, username: currentUser.username, name: currentUser.name } : null,
      indexedDBAvailable: !!window.indexedDB,
      localStorageKeys: Object.keys(localStorage)
    };
    debugText.textContent = JSON.stringify(info, null, 2);
  } catch (err) {
    debugText.textContent = 'Debug read error: ' + err.message;
  }
}

document.addEventListener('click', async (e) => {
  const t = e.target;
  if (t && t.id === 'recreateAdmin') {
    const has = employees.some(u => u.username === 'admin');
    if (!has) {
      employees.push({ id: generateId(), name: 'Admin Leitung', username: 'admin', password: 'admin', rank: 'Häuptling', status: 'Wach', training: [], sanctions: [], messages: [] });
      await saveEmployees();
    }
    renderDebugPanel();
    alert('Admin account recreated. Versuch erneut anzumelden: admin / admin');
  }
  if (t && t.id === 'clearAllStorage') {
    if (!confirm('Lokalen Speicher wirklich komplett löschen?')) return;
    await clearAllStorage();
    location.reload();
  }
});

function generateId() {
  return Math.random().toString(36).slice(2, 10);
}

// Avatar color seeder: deterministic gradient per name
function getAvatarColors(seed) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (h * 31 + seed.charCodeAt(i)) % 360;
  }
  const h1 = h;
  const h2 = (h + 28) % 360;
  return [`hsl(${h1} 68% 45%)`, `hsl(${h2} 70% 55%)`];
}

function buildAvatar(name) {
  const initials = (name || '').split(/\s+/).map(n => n[0] || '').slice(0, 2).join('').toUpperCase() || '—';
  const [c1, c2] = getAvatarColors(name || '');
  const style = `background: linear-gradient(135deg, ${c1}, ${c2}); color: #fff;`;
  return { initials, style };
}

function saveEmployees() {
  return writeStorage(STORAGE_KEYS.employees, employees);
}

function saveCurrentUser() {
  return writeStorage(STORAGE_KEYS.currentUser, currentUser);
}

function saveInventory() {
  return writeStorage(STORAGE_KEYS.inventory, inventoryData);
}

function saveTodos() {
  return writeStorage(STORAGE_KEYS.todos, todoData);
}

function saveReports() {
  return writeStorage(STORAGE_KEYS.reports, reportsData);
}

function saveLogs() {
  return writeStorage(STORAGE_KEYS.logs, logsData);
}

function saveAllData() {
  return Promise.all([
    saveEmployees(),
    saveCurrentUser(),
    saveInventory(),
    saveTodos(),
    saveInventoryCategories(),
    saveTodoCategories(),
    saveReports(),
    saveLogs()
  ]);
}

function canPerform(action) {
  if (!currentUser) return false;
  return PERMISSIONS[currentUser.rank]?.[action] || false;
}

function canViewEmployeeDetails(employee) {
  if (!currentUser || !employee) return false;
  if (currentUser.id === employee.id) return true;
  const currentRankIndex = RANKS.indexOf(currentUser.rank);
  const employeeRankIndex = RANKS.indexOf(employee.rank);
  return currentRankIndex <= employeeRankIndex;
}

function renderActionButtons() {
  document.getElementById('showHireForm').style.display = canPerform('hire') ? '' : 'none';
  document.getElementById('showMessageForm').style.display = canPerform('message') ? '' : 'none';
  document.getElementById('showPromoteForm').style.display = canPerform('promote') ? '' : 'none';
  document.getElementById('showFireForm').style.display = canPerform('fire') ? '' : 'none';
}

function showPage(pageId) {
  const currentPage = pages.find((page) => !page.classList.contains('hidden') && page.id !== pageId);
  const nextPage = pages.find((page) => page.id === pageId);

  if (currentPage && currentPage !== nextPage) {
    currentPage.classList.remove('active');
    currentPage.addEventListener('transitionend', function handleTransition() {
      currentPage.classList.add('hidden');
      currentPage.removeEventListener('transitionend', handleTransition);
    });
  }

  if (pageId === 'logPage' && currentUser?.rank !== 'Häuptling') {
    showPage('dashboardPage');
    return;
  }

  if (nextPage) {
    nextPage.classList.remove('hidden');
    requestAnimationFrame(() => nextPage.classList.add('active'));
  }

  navButtons.forEach((button) => button.classList.toggle('active', button.dataset.page === pageId));

  switch (pageId) {
    case 'dashboardPage':
      renderDashboard();
      break;
    case 'employeesPage':
      renderAllEmployeeViews();
      break;
    case 'inventoryPage':
      renderInventory();
      break;
    case 'todoPage':
      renderTodoList();
      break;
    case 'reportsPage':
      renderReports();
      break;
    case 'logPage':
      renderLogPage();
      break;
    default:
      break;
  }
}

function updateStatusOptions() {
  statusSelect.innerHTML = '';
  STATUSES.forEach((status) => {
    const option = document.createElement('option');
    option.value = status;
    option.textContent = status;
    statusSelect.appendChild(option);
  });
}

function renderDashboard() {
  employeeCount.textContent = `${employees.length}`;
  const onDuty = employees.filter((e) => e.status === 'Wach').length;
  const offDuty = employees.filter((e) => e.status === 'Schlafen').length;
  const statusSummary = `Wach: ${onDuty} | Schlafen: ${offDuty}`;
  statusCounts.textContent = statusSummary;

  if (dashboardOnDutyCount) dashboardOnDutyCount.textContent = onDuty;
  if (dashboardOffDutyCount) dashboardOffDutyCount.textContent = offDuty;

  if (dashboardRankBreakdown) {
    dashboardRankBreakdown.innerHTML = RANKS.map((rank) => {
      const count = employees.filter((employee) => employee.rank === rank).length;
      return `<div class="dashboard-stat-item"><span>${rank}</span><strong>${count}</strong></div>`;
    }).join('');
  }

  if (dashboardMessagePreview) {
    const messages = getCurrentUserMessages().slice(-1).reverse();
    if (messages.length) {
      dashboardMessagePreview.innerHTML = messages.map((message) => `
        <div class="dashboard-message-item">
          <div class="dashboard-message-content">
            <p>${message.text}</p>
            <span>${message.date}</span>
          </div>
          <button type="button" class="dashboard-message-delete" data-message-id="${message.id}" aria-label="Nachricht löschen">✕</button>
        </div>
      `).join('');
    } else {
      dashboardMessagePreview.innerHTML = '<p class="empty-state-text">Keine aktuellen Mitteilungen vorhanden.</p>';
    }
  }

  if (dashboardActionsList) {
    const actions = [];
    if (canPerform('hire')) actions.push({ key: 'hire', label: 'Hinzufügen' });
    if (canPerform('promote')) actions.push({ key: 'promote', label: 'Befördern / Degradieren' });
    if (canPerform('fire')) actions.push({ key: 'fire', label: 'Entfernen' });
    if (canPerform('message')) actions.push({ key: 'message', label: 'Nachricht senden' });
    if (actions.length) {
      dashboardActionsList.innerHTML = actions.map((action) => `
        <button type="button" class="dashboard-action-item" data-dashboard-action="${action.key}">
          ${action.label}
        </button>
      `).join('');
    } else {
      dashboardActionsList.innerHTML = '<p class="empty-state-text">Keine Schnellaktionen verfügbar.</p>';
    }
  }

  dashboardUserInfo.textContent = currentUser
    ? `${currentUser.name} • ${currentUser.rank}`
    : 'Keine Anmeldung';
  statusSelect.value = currentUser?.status || 'Wach';
}

function filterEmployees() {
  const rank = selectedRankFilter;
  const status = selectedStatusFilter;
  const search = selectedEmployeeSearch;
  return employees.filter((employee) => {
    const matchesRank = !rank || employee.rank === rank;
    const matchesStatus = !status || employee.status === status;
    const matchesSearch = !search || employee.name.toLowerCase().includes(search) || employee.username.toLowerCase().includes(search);
    return matchesRank && matchesStatus && matchesSearch;
  });
}

function renderEmployeeList() {
  const data = filterEmployees();
  employeeList.innerHTML = '';

  if (!data.length) {
    employeeList.innerHTML = '<div class="card empty-state"><p>Keine Mitglieder gefunden.</p></div>';
    return;
  }

  const cards = document.createElement('div');
  cards.className = 'employee-cards';

  sortByRank(data).forEach((employee) => {
    const card = document.createElement('article');
    card.className = 'employee-card';
    if (employee.id === selectedEmployeeId) {
      card.classList.add('selected');
    }
    const statusClass = `status-${employee.status.replace(/\s+/g, '').toLowerCase()}`;
    const rankText = employee.rank;
    const avatar = buildAvatar(employee.name);

    card.innerHTML = `
      <div class="employee-card-header">
        <div style="display:flex;align-items:center;gap:0.9rem;">
          <div class="avatar" style="${avatar.style}">${avatar.initials}</div>
          <div>
            <h3>${employee.name}</h3>
            <p>${rankText}</p>
          </div>
        </div>
        <div style="text-align:right;">
          <span class="status-pill ${statusClass}">${employee.status}</span>
        </div>
      </div>
    `;

    card.addEventListener('click', () => {
      selectedEmployeeId = employee.id;
      renderSelectedEmployeeInfo();
      renderEmployeeSelection();
      renderEmployeeList();
    });

    cards.appendChild(card);
  });

  employeeList.appendChild(cards);
}


function sortByRank(list) {
  return list.slice().sort((a, b) => {
    const aIndex = RANKS.indexOf(a.rank);
    const bIndex = RANKS.indexOf(b.rank);
    if (aIndex !== bIndex) return aIndex - bIndex;
    return a.name.localeCompare(b.name, 'de');
  });
}

function renderEmployeeSelection() {
  employeeSelect.innerHTML = '';
  const selected = employees.find((employee) => employee.id === selectedEmployeeId);
  sortByRank(employees).forEach((employee) => {
    const option = document.createElement('option');
    option.value = employee.id;
    option.textContent = `${employee.name} (${employee.rank})`;
    employeeSelect.appendChild(option);
  });
  if (!selected || !employees.some((employee) => employee.id === selectedEmployeeId)) {
    selectedEmployeeId = employees.length ? employees[0].id : null;
  }
  if (selectedEmployeeId) {
    employeeSelect.value = selectedEmployeeId;
  }
}

function renderSelectedEmployeeInfo() {
  const employee = getSelectedEmployee();
  if (!employee) {
    selectedEmployeeInfo.textContent = 'Wähle ein Mitglied, um Informationen zu sehen.';
    selectedEmployeeBadge.textContent = 'Status';
    selectedEmployeeBadge.className = 'status-pill status-wach';
    selectedEmployeeRank.textContent = '-';
    selectedEmployeeStatus.innerHTML = '';
    if (selectedEmployeeDetails) selectedEmployeeDetails.innerHTML = '';
    return;
  }
  const messagesCount = employee.messages?.length || 0;
  const sanctionsCount = employee.sanctions?.length || 0;
  const trainingCount = employee.training?.length || 0;
  selectedEmployeeInfo.textContent = employee.name;
  selectedEmployeeRank.textContent = employee.rank;
  selectedEmployeeBadge.textContent = employee.status;
  selectedEmployeeBadge.className = `status-pill status-${employee.status.replace(/\s+/g, '').toLowerCase()}`;

  if (selectedEmployeeDetails) {
    // Per user: do not show username or other fields here — keep details compact
    selectedEmployeeDetails.innerHTML = '';
  }

  const canChangeStatus = employee.id === currentUser?.id || canPerform('statusChange');
  if (canChangeStatus) {
    selectedEmployeeStatus.innerHTML = '';
    STATUSES.forEach((status) => {
      const option = document.createElement('option');
      option.value = status;
      option.textContent = status;
      selectedEmployeeStatus.appendChild(option);
    });
    selectedEmployeeStatus.value = employee.status;
    if (employeeDetailActions) employeeDetailActions.style.display = '';
  } else {
    selectedEmployeeStatus.innerHTML = '<option>Keine Berechtigung</option>';
    if (employeeDetailActions) employeeDetailActions.style.display = 'none';
  }
}

function renderEmployeeActionOptions() {
  [hireRank, promoteRank].forEach((select) => {
    select.innerHTML = '';
  });
  RANKS.forEach((rank) => {
    const option1 = document.createElement('option');
    option1.value = rank;
    option1.textContent = rank;
    hireRank.appendChild(option1);
    const option2 = document.createElement('option');
    option2.value = rank;
    option2.textContent = rank;
    promoteRank.appendChild(option2);
  });
}

function renderEmployeeFilters() {
  if (employeeRankFilter) {
    employeeRankFilter.innerHTML = '<option value="">Alle Ränge</option>';
    RANKS.forEach((rank) => {
      const option = document.createElement('option');
      option.value = rank;
      option.textContent = rank;
      employeeRankFilter.appendChild(option);
    });
  }

  if (employeeStatusFilter) {
    employeeStatusFilter.innerHTML = '<option value="">Alle Status</option>';
    STATUSES.forEach((status) => {
      const option = document.createElement('option');
      option.value = status;
      option.textContent = status;
      employeeStatusFilter.appendChild(option);
    });
  }
}

function renderMessageRecipientOptions() {
  messageEmployeeFilter.innerHTML = '';
  sortByRank(employees).forEach((employee) => {
    const option = document.createElement('option');
    option.value = employee.id;
    option.textContent = `${employee.name} (${employee.rank})`;
    messageEmployeeFilter.appendChild(option);
  });

  updateMessageTargetGroups();
}

function updateMessageTargetGroups() {
  const type = messageRecipientType.value;
  messageEmployeeGroup.classList.toggle('hidden', type !== 'single');
  updateMessageRecipientPreview();
}

function updateMessageRecipientPreview() {
  const type = messageRecipientType.value;
  if (type === 'single') {
    const employee = employees.find((employee) => employee.id === messageEmployeeFilter.value);
    messageRecipientCount.textContent = employee ? `Empfänger: ${employee.name}` : 'Empfänger: Kein Empfänger ausgewählt';
    return;
  }
  messageRecipientCount.textContent = `Empfänger: Alle Mitglieder (${employees.length})`;
}

function getCurrentUserMessages() {
  if (!currentUser) return [];
  const employee = employees.find((item) => item.id === currentUser.id);
  return employee?.messages || [];
}

function renderNotificationBell() {
  const messages = getCurrentUserMessages();
  const badge = document.getElementById('notificationCount');
  if (!badge) return;
  if (messages.length > 0) {
    badge.textContent = messages.length;
    badge.classList.remove('hidden');
  } else {
    badge.classList.add('hidden');
  }
}

function renderNotificationPanel() {
  if (!notificationList) return;
  notificationList.innerHTML = '';
  const messages = getCurrentUserMessages().slice().reverse();
  if (!messages.length) {
    const noMessage = document.createElement('div');
    noMessage.className = 'notification-empty';
    noMessage.textContent = 'Keine aktuellen Mitteilungen.';
    notificationList.appendChild(noMessage);
    return;
  }
  messages.forEach((message) => {
    const item = document.createElement('div');
    item.className = 'notification-item';
    item.innerHTML = `
      <div class="notification-item-content">
        <p>${message.text}</p>
        <span>${message.date}</span>
      </div>
      <button type="button" class="notification-mark-read" data-message-id="${message.id}">Als gelesen markieren</button>
    `;
    notificationList.appendChild(item);
  });
}

function removeCurrentUserMessage(messageId) {
  if (!currentUser) return;
  const employee = employees.find((item) => item.id === currentUser.id);
  if (!employee || !employee.messages) return;
  employee.messages = employee.messages.filter((message) => message.id !== messageId);
  saveEmployees();
  renderNotificationPanel();
  renderNotificationBell();
  renderDashboard();
}

function positionNotificationPanel() {
  if (!notificationPanel || !notificationBell) return;
  const rect = notificationBell.getBoundingClientRect();
  const panelWidth = Math.min(340, window.innerWidth - 32);
  const left = Math.min(Math.max(16, rect.right - panelWidth), window.innerWidth - panelWidth - 16);
  const top = Math.min(Math.max(16, rect.bottom + 10), window.innerHeight - 16);
  notificationPanel.style.left = `${left}px`;
  notificationPanel.style.top = `${top}px`;
}

function toggleNotificationPanel() {
  if (!notificationPanel) return;
  if (notificationPanel.classList.contains('hidden')) {
    positionNotificationPanel();
    renderNotificationPanel();
    notificationPanel.classList.remove('hidden');
    notificationPanel.classList.add('visible');
  } else {
    notificationPanel.classList.add('hidden');
    notificationPanel.classList.remove('visible');
  }
}

function positionAccountPanel() {
  if (!accountPanel || !currentUserName) return;
  const rect = currentUserName.getBoundingClientRect();
  const panelWidth = Math.min(340, window.innerWidth - 32);
  const left = Math.min(Math.max(16, rect.right - panelWidth), window.innerWidth - panelWidth - 16);
  const top = Math.min(Math.max(16, rect.bottom + 10), window.innerHeight - 16);
  accountPanel.style.left = `${left}px`;
  accountPanel.style.top = `${top}px`;
}

function toggleAccountPanel() {
  if (!accountPanel) return;
  if (accountPanel.classList.contains('hidden')) {
    positionAccountPanel();
    accountPanel.classList.remove('hidden');
    accountPanel.classList.add('visible');
  } else {
    accountPanel.classList.add('hidden');
    accountPanel.classList.remove('visible');
  }
}

function hideAccountPanel() {
  if (!accountPanel) return;
  accountPanel.classList.remove('visible');
  accountPanel.classList.add('hidden');
}

function getSelectedEmployee() {
  let employee = employees.find((employee) => employee.id === selectedEmployeeId);
  if (!employee && employeeSelect && employeeSelect.value) {
    employee = employees.find((employee) => employee.id === employeeSelect.value);
    if (employee) {
      selectedEmployeeId = employee.id;
    }
  }
  if (!employee && employees.length) {
    selectedEmployeeId = employees[0].id;
    employee = employees[0];
  }
  return employee;
}

function resetActionForms() {
  [hireForm, promoteForm, messageForm, fireForm].forEach((form) => form.classList.add('hidden'));
}

function showActionForm(formId) {
  const actionMap = {
    hireForm: 'hire',
    messageForm: 'message',
    promoteForm: 'promote',
    fireForm: 'fire'
  };

  const requiredPermission = actionMap[formId];
  if (!canPerform(requiredPermission)) {
    alert('Du hast dafür keine Berechtigung.');
    return;
  }

  const employee = getSelectedEmployee();
  if (!employee) {
    alert('Bitte zuerst ein Mitglied auswählen.');
    return;
  }
  renderSelectedEmployeeInfo();
  resetActionForms();
  populateActionForm(formId);
  document.getElementById(formId).classList.remove('hidden');
}

function populateActionForm(formId) {
  const employee = getSelectedEmployee();
  if (!employee) return;

  if (formId === 'promoteForm') {
    promoteRank.value = employee.rank;
  }

  if (formId === 'messageForm') {
    messageText.value = '';
    messageRecipientType.value = 'all';
    renderMessageRecipientOptions();
    updateMessageTargetGroups();
  }
}

function handleEmployeeSelection() {
  selectedEmployeeId = employeeSelect.value;
}

function handleHire() {
  const name = hireName.value.trim();
  const username = hireUsername.value.trim();
  const password = hirePassword.value.trim();
  const rank = hireRank.value;

  if (!name || !username || !password) {
    alert('Bitte Name, Benutzername und Passwort eingeben.');
    return;
  }

  if (employees.some((employee) => employee.username === username)) {
    alert('Dieser Benutzername ist bereits vergeben.');
    return;
  }

  const newEmployee = {
    id: generateId(),
    name,
    username,
    password,
    rank,
    status: 'Wach',
    createdAt: new Date().toLocaleString(),
    sanctions: [],
    messages: []
  };
  employees.push(newEmployee);
  selectedEmployeeId = newEmployee.id;
  addLogEntry('Mitglied eingestellt', `${name} (${rank})`);
  saveEmployees();
  renderAllEmployeeViews();
  resetActionForms();
  alert(`Neues Mitglied erfolgreich hinzugefügt. Benutzer: ${username}`);
  hireName.value = '';
  hireUsername.value = '';
  hirePassword.value = '';
}

function handlePromote() {
  const employee = getSelectedEmployee();
  if (!employee) {
    alert('Bitte zuerst ein Mitglied auswählen.');
    return;
  }
  const oldRank = employee.rank;
  employee.rank = promoteRank.value;
  addLogEntry('Rang geändert', `${employee.name} von ${oldRank} auf ${employee.rank}`);
  saveEmployees();
  renderAllEmployeeViews();
  resetActionForms();
  alert('Rang wurde angepasst.');
}

function handleSendMessage() {
  const message = messageText.value.trim();
  if (!message) {
    alert('Bitte eine Nachricht eingeben.');
    return;
  }

  const recipientType = messageRecipientType.value;
  let recipients = [];

  if (recipientType === 'single') {
    const selectedId = messageEmployeeFilter.value;
    const selectedEmployee = employees.find((employee) => employee.id === selectedId);
    if (selectedEmployee) recipients = [selectedEmployee];
  } else {
    recipients = employees.slice();
  }

  if (!recipients.length) {
    alert('Keine Empfänger gefunden.');
    return;
  }

  const sender = currentUser ? currentUser.name : 'System';
  recipients.forEach((employee) => {
    employee.messages = employee.messages || [];
    employee.messages.push({
      id: generateId(),
      text: `${sender}: ${message}`,
      date: new Date().toLocaleString(),
      sender
    });
  });

  addLogEntry('Mitteilung gesendet', `${recipients.length} Empfänger`);
  saveEmployees();
  renderAllEmployeeViews();
  resetActionForms();
  messageText.value = '';
  alert(`Mitteilung an ${recipients.length} Mitglieder gesendet.`);
}


function handleFire() {
  const employee = getSelectedEmployee();
  if (!employee) {
    alert('Bitte zuerst ein Mitglied auswählen.');
    return;
  }
  if (!confirm(`Möchtest du ${employee.name} wirklich entfernen?`)) {
    return;
  }
  addLogEntry('Mitglied entfernt', `${employee.name} (${employee.rank})`);
  employees = employees.filter((item) => item.id !== employee.id);
  if (currentUser?.id === employee.id) {
    currentUser = null;
    saveCurrentUser();
    appPage.classList.add('hidden');
    loginPage.classList.remove('hidden');
  }
  saveEmployees();
  renderAllEmployeeViews();
  resetActionForms();
  alert(`${employee.name} wurde erfolgreich entfernt.`);
}

function renderAllEmployeeViews() {
  renderEmployeeList();
  renderEmployeeSelection();
  renderEmployeeActionOptions();
  renderEmployeeFilters();
  renderMessageRecipientOptions();
  renderActionButtons();
  renderSelectedEmployeeInfo();
  renderNotificationBell();
  renderDashboard();
}

function renderReports() {
  reportList.innerHTML = '';
  reportsData.forEach((entry) => {
    const row = document.createElement('tr');
    const date = new Date(entry.uploadedAt).toLocaleString();
    row.innerHTML = `
      <td>${entry.name}</td>
      <td>${date}</td>
      <td>
        <a href="${entry.dataUrl}" download="${entry.name}">Herunterladen</a>
        <button class="danger">Löschen</button>
      </td>
    `;
    row.querySelector('button').addEventListener('click', () => deleteReport(entry.id));
    reportList.appendChild(row);
  });
}

function renderLogPage() {
  if (!logList) return;
  if (currentUser?.rank !== 'Häuptling') {
    logList.innerHTML = '<tr><td colspan="5">Nur Häuptling kann diese Seite sehen.</td></tr>';
    return;
  }
  logList.innerHTML = '';
  if (!logsData.length) {
    logList.innerHTML = '<tr><td colspan="5">Noch keine Log-Einträge vorhanden.</td></tr>';
    return;
  }
  logsData.slice().reverse().forEach((entry) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${entry.time}</td>
      <td>${entry.action}</td>
      <td>${entry.actor}</td>
      <td>${entry.details}</td>
      <td>
        <button type="button" class="log-delete danger" data-log-id="${entry.id}">Entfernen</button>
      </td>
    `;
    logList.appendChild(row);
  });
}

function deleteLogEntry(logId) {
  if (!confirm('Soll dieser Logeintrag wirklich entfernt werden?')) return;
  logsData = logsData.filter((entry) => entry.id !== logId);
  saveLogs();
  renderLogPage();
}

function deleteAllLogs() {
  if (!logsData.length) {
    alert('Es sind keine Logs zum Löschen vorhanden.');
    return;
  }
  if (!confirm('Alle Logs endgültig löschen?')) return;
  logsData = [];
  saveLogs();
  renderLogPage();
}

function addLogEntry(action, details) {
  const entry = {
    id: generateId(),
    time: new Date().toLocaleString(),
    actor: currentUser?.name || 'System',
    action,
    details
  };
  logsData.push(entry);
  saveLogs();
}

function updateLogNavVisibility() {
  if (!logNavButtons?.length) return;
  logNavButtons.forEach((button) => {
    button.classList.toggle('hidden', currentUser?.rank !== 'Häuptling');
  });
}

function renderInventory() {
  if (!inventoryList) return;
  inventoryList.innerHTML = '';
  if (!inventoryData.length) {
    inventoryList.innerHTML = '<p class="empty-state-text">Noch keine Lagerartikel vorhanden.</p>';
    return;
  }

  // ensure categories include any item categories
  inventoryData.forEach(i => { if (!i.category) i.category = 'Sonstiges'; if (!inventoryCategories.includes(i.category)) inventoryCategories.push(i.category); });
  saveInventoryCategories();

  const grouped = {};
  inventoryData.slice().sort((a, b) => (a.category || '').localeCompare(b.category)).forEach(item => {
    grouped[item.category] = grouped[item.category] || [];
    grouped[item.category].push(item);
  });

  Object.keys(grouped).sort().forEach((category) => {
    const groupItems = grouped[category].slice().sort((a, b) => b.quantity - a.quantity || a.name.localeCompare(b.name));
    const section = document.createElement('section');
    section.className = 'inventory-group';
    section.innerHTML = `
      <button type="button" class="group-header" aria-expanded="true">
        <span>${category}</span>
        <span class="group-count">(${groupItems.length})</span>
        <span class="group-toggle-icon">▾</span>
      </button>
      <div class="group-content"></div>
    `;
    const groupContent = section.querySelector('.group-content');
    const header = section.querySelector('.group-header');
    header.addEventListener('click', () => {
      const collapsed = section.classList.toggle('collapsed');
      header.setAttribute('aria-expanded', String(!collapsed));
      header.querySelector('.group-toggle-icon').textContent = collapsed ? '▸' : '▾';
    });
    groupItems.forEach((item) => {
      const row = document.createElement('div');
      row.className = 'inventory-item';
      row.innerHTML = `
        <div class="inventory-item-info">
          <div class="inventory-item-header">
            <strong>${item.name}</strong>
            <span class="inventory-quantity">${item.quantity} Stk.</span>
          </div>
        </div>
        <div class="inventory-actions">
          <button type="button" class="inventory-adjust" data-action="decrease" data-inventory-id="${item.id}" aria-label="Bestand verringern">-</button>
          <button type="button" class="inventory-adjust" data-action="increase" data-inventory-id="${item.id}" aria-label="Bestand erhöhen">+</button>
          <button type="button" class="dashboard-item-delete" data-inventory-id="${item.id}" aria-label="Löschen">✕</button>
        </div>
      `;
      groupContent.appendChild(row);
    });
    inventoryList.appendChild(section);
  });
}

function renderTodoList() {
  if (!todoList) return;
  todoList.innerHTML = '';
  if (!todoData.length) {
    todoList.innerHTML = '<p class="empty-state-text">Noch keine Aufgaben vorhanden.</p>';
    return;
  }

  // ensure folders exist on tasks
  todoData.forEach(t => { if (!t.folder) t.folder = 'Allgemein'; if (!todoCategories.includes(t.folder)) todoCategories.push(t.folder); });
  saveTodoCategories();

  const grouped = {};
  todoData.slice().forEach((task) => {
    grouped[task.folder] = grouped[task.folder] || [];
    grouped[task.folder].push(task);
  });

  Object.keys(grouped).sort().forEach((folder) => {
    const tasks = grouped[folder].slice().sort((a, b) => {
      if (a.done !== b.done) return a.done - b.done;
      const priorityOrder = { 'Hoch': 0, 'Normal': 1, 'Niedrig': 2 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) return priorityOrder[a.priority] - priorityOrder[b.priority];
      if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate);
      if (a.dueDate) return -1;
      if (b.dueDate) return 1;
      return 0;
    });

    const section = document.createElement('section');
    section.className = 'todo-group';
    section.innerHTML = `
      <button type="button" class="group-header" aria-expanded="true">
        <span>${folder}</span>
        <span class="group-count">(${tasks.length})</span>
        <span class="group-toggle-icon">▾</span>
      </button>
      <div class="group-content"></div>
    `;
    const groupContent = section.querySelector('.group-content');
    const header = section.querySelector('.group-header');
    header.addEventListener('click', () => {
      const collapsed = section.classList.toggle('collapsed');
      header.setAttribute('aria-expanded', String(!collapsed));
      header.querySelector('.group-toggle-icon').textContent = collapsed ? '▸' : '▾';
    });

    tasks.forEach((task) => {
      const row = document.createElement('div');
      row.className = 'todo-item-card';
      row.innerHTML = `
        <div class="todo-item-content">
          <label class="todo-item ${task.done ? 'todo-completed' : ''}">
            <input type="checkbox" ${task.done ? 'checked' : ''} data-todo-id="${task.id}" />
            <span>${task.text}</span>
          </label>
          <div class="todo-item-meta">
            <span class="todo-priority" data-priority="${task.priority}">${task.priority}</span>
            ${task.dueDate ? `<span>Fällig: ${task.dueDate}</span>` : ''}
          </div>
        </div>
        <button type="button" class="dashboard-item-delete" data-todo-id="${task.id}" aria-label="Löschen">✕</button>
      `;
      groupContent.appendChild(row);
    });

    todoList.appendChild(section);
  });
}

function addInventoryItem() {
  if (!inventoryName || !inventoryQuantity) return;
  const name = inventoryName.value.trim();
  const quantity = Math.max(1, parseInt(inventoryQuantity.value, 10) || 1);
  if (!name) {
    alert('Bitte einen Artikelnamen eingeben.');
    return;
  }
  // ask for category/folder (fallback to Sonstiges)
  let category = prompt('Ordner/Kategorie für diesen Artikel (leer = Sonstiges):', '');
  category = category ? category.trim() : '';
  if (!category) category = 'Sonstiges';
  if (!inventoryCategories.includes(category)) {
    inventoryCategories.push(category);
    saveInventoryCategories();
  }
  inventoryData.push({ id: generateId(), name, quantity, category });
  addLogEntry('Lagerartikel hinzugefügt', `${name} (${quantity})`);
  saveInventory();
  inventoryName.value = '';
  inventoryQuantity.value = '1';
  renderInventory();
}

function addTodoItem() {
  if (!todoText || !todoPriority || !todoDueDate) return;
  const text = todoText.value.trim();
  if (!text) {
    alert('Bitte eine Aufgabe eingeben.');
    return;
  }
  // ask for folder/category for this todo
  let folder = prompt('Ordner/Kategorie für diese Aufgabe (leer = Allgemein):', '');
  folder = folder ? folder.trim() : '';
  if (!folder) folder = 'Allgemein';
  if (!todoCategories.includes(folder)) {
    todoCategories.push(folder);
    saveTodoCategories();
  }
  todoData.unshift({
    id: generateId(),
    text,
    done: false,
    priority: todoPriority.value || 'Normal',
    dueDate: todoDueDate.value || '',
    createdAt: new Date().toLocaleString(),
    folder
  });
  addLogEntry('Aufgabe erstellt', `${text} (${todoPriority.value || 'Normal'})`);
  saveTodos();
  todoText.value = '';
  todoPriority.value = 'Normal';
  todoDueDate.value = '';
  renderTodoList();
}

function toggleTodoStatus(todoId) {
  const task = todoData.find((item) => item.id === todoId);
  if (!task) return;
  task.done = !task.done;
  addLogEntry(task.done ? 'Aufgabe abgeschlossen' : 'Aufgabe zurückgesetzt', task.text);
  saveTodos();
  renderTodoList();
}

function removeInventoryItem(itemId) {
  const item = inventoryData.find((entry) => entry.id === itemId);
  if (item) {
    addLogEntry('Lagerartikel entfernt', item.name);
  }
  inventoryData = inventoryData.filter((item) => item.id !== itemId);
  saveInventory();
  renderInventory();
}

function adjustInventoryQuantity(itemId, delta) {
  const item = inventoryData.find((entry) => entry.id === itemId);
  if (!item) return;
  item.quantity = Math.max(0, item.quantity + delta);
  if (item.quantity === 0) {
    if (confirm(`Menge für ${item.name} ist 0. Artikel löschen?`)) {
      addLogEntry('Lagerartikel gelöscht', item.name);
      removeInventoryItem(itemId);
      return;
    }
    item.quantity = 1;
  }
  addLogEntry('Lagerbestand angepasst', `${item.name} auf ${item.quantity}`);
  saveInventory();
  renderInventory();
}

function removeTodoItem(todoId) {
  const task = todoData.find((item) => item.id === todoId);
  if (task) {
    addLogEntry('Aufgabe entfernt', task.text);
  }
  todoData = todoData.filter((item) => item.id !== todoId);
  saveTodos();
  renderTodoList();
}

function deleteReport(reportId) {
  reportsData = reportsData.filter((entry) => entry.id !== reportId);
  saveReports();
  renderReports();
}

function handleReportUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    reportsData.push({
      id: generateId(),
      name: file.name,
      uploadedAt: Date.now(),
      dataUrl: reader.result
    });
    addLogEntry('Bericht hochgeladen', file.name);
    saveReports();
    renderReports();
    reportUpload.value = '';
  };
  reader.readAsDataURL(file);
}

function initializeAccountUI() {
  if (!currentUser) return;
  currentUserName.textContent = `${currentUser.name} (${currentUser.rank})`;
  if (accountUserName) accountUserName.textContent = currentUser.name;
  if (accountUserRank) accountUserRank.textContent = `Rang: ${currentUser.rank}`;
  if (accountUserStatus) accountUserStatus.textContent = `Status: ${currentUser.status || 'Unbekannt'}`;
  updateLogNavVisibility();
}

function renderAccountPanel() {
  if (!currentUser || !accountPanel) return;
  if (accountUserName) accountUserName.textContent = currentUser.name;
  if (accountUserRank) accountUserRank.textContent = `Rang: ${currentUser.rank}`;
  if (accountUserStatus) accountUserStatus.textContent = `Status: ${currentUser.status || 'Unbekannt'}`;
}

function updateLoginState() {
  if (currentUser) {
    loginPage.classList.add('hidden');
    appPage.classList.remove('hidden');
    initializeAccountUI();
    renderAllEmployeeViews();
    renderReports();
    updateLogNavVisibility();
    showPage('dashboardPage');
  } else {
    loginPage.classList.remove('hidden');
    appPage.classList.add('hidden');
  }
}

loginForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const username = document.getElementById('loginUsername').value.trim();
  const password = document.getElementById('loginPassword').value.trim();
  console.log('[login] attempt for username:', username);
  console.log('[login] available users:', employees.map(u => ({ username: u.username, id: u.id })));
  const employee = employees.find(
    (item) => item.username.toLowerCase() === username.toLowerCase() && item.password === password
  );
  if (!employee) {
    loginError.textContent = 'Ungültige Anmeldedaten.';
    return;
  }
  currentUser = employee;
  saveCurrentUser();
  loginError.textContent = '';
  updateLoginState();
});

function autoLoginAdmin() {
  let admin = employees.find(u => u.username && u.username.toLowerCase() === 'admin');
  if (!admin) {
    admin = { id: generateId(), name: 'Admin Leitung', username: 'admin', password: 'admin', rank: 'Häuptling', status: 'Wach', training: [], sanctions: [], messages: [] };
    employees.push(admin);
    saveEmployees();
  }
  currentUser = admin;
  saveCurrentUser();
  console.log('[debug] autoLoginAdmin -> logged in as', admin.username);
  updateLoginState();
}

const autoLoginBtn = document.getElementById('autoLoginDev');
if (autoLoginBtn) {
  autoLoginBtn.addEventListener('click', () => {
    autoLoginAdmin();
  });
}

logoutButton.addEventListener('click', () => {
  currentUser = null;
  saveCurrentUser();
  updateLoginState();
});

navButtons.forEach((button) => {
  button.addEventListener('click', () => {
    showPage(button.dataset.page);
    if (topNav) {
      topNav.classList.remove('visible');
      topNav.classList.add('hidden');
    }
  });
});

function positionTopNav() {
  if (!topNav || !menuToggle) return;
  const rect = menuToggle.getBoundingClientRect();
  const panelWidth = Math.min(280, window.innerWidth - 32);
  const left = Math.min(Math.max(16, rect.right - panelWidth), window.innerWidth - panelWidth - 16);
  const top = Math.min(rect.bottom + 10, window.innerHeight - topNav.offsetHeight - 16);
  topNav.style.left = `${left}px`;
  topNav.style.top = `${top}px`;
}

if (menuToggle) {
  menuToggle.addEventListener('click', (event) => {
    event.stopPropagation();
    if (!topNav) return;
    positionTopNav();
    topNav.classList.toggle('visible');
    topNav.classList.toggle('hidden', !topNav.classList.contains('visible'));
  });
}

if (closeTopNav) {
  closeTopNav.addEventListener('click', () => {
    if (!topNav) return;
    topNav.classList.remove('visible');
    topNav.classList.add('hidden');
  });
}

window.addEventListener('resize', () => {
  if (topNav && topNav.classList.contains('visible')) {
    positionTopNav();
  }
});

document.addEventListener('click', (event) => {
  if (topNav && !topNav.contains(event.target) && event.target !== menuToggle) {
    topNav.classList.remove('visible');
    topNav.classList.add('hidden');
  }
});

employeeSelect.addEventListener('change', () => {
  handleEmployeeSelection();
  renderSelectedEmployeeInfo();
});

messageRecipientType.addEventListener('change', updateMessageTargetGroups);
messageEmployeeFilter.addEventListener('change', updateMessageRecipientPreview);
if (employeeSearch) {
  employeeSearch.addEventListener('input', () => {
    selectedEmployeeSearch = employeeSearch.value.trim().toLowerCase();
    renderEmployeeList();
  });
}
if (employeeRankFilter) {
  employeeRankFilter.addEventListener('change', () => {
    selectedRankFilter = employeeRankFilter.value;
    renderEmployeeList();
  });
}
if (employeeStatusFilter) {
  employeeStatusFilter.addEventListener('change', () => {
    selectedStatusFilter = employeeStatusFilter.value;
    renderEmployeeList();
  });
}
if (clearEmployeeFilters) {
  clearEmployeeFilters.addEventListener('click', () => {
    selectedEmployeeSearch = '';
    selectedRankFilter = '';
    selectedStatusFilter = '';
    if (employeeSearch) employeeSearch.value = '';
    if (employeeRankFilter) employeeRankFilter.value = '';
    if (employeeStatusFilter) employeeStatusFilter.value = '';
    renderEmployeeList();
  });
}

notificationBell.addEventListener('click', (event) => {
  event.stopPropagation();
  toggleNotificationPanel();
});

if (currentUserName) {
  currentUserName.addEventListener('click', (event) => {
    event.stopPropagation();
    toggleAccountPanel();
  });
}

if (closeNotificationPanel) {
  closeNotificationPanel.addEventListener('click', () => {
    if (notificationPanel) {
      notificationPanel.classList.remove('visible');
      notificationPanel.classList.add('hidden');
    }
  });
}

if (closeAccountPanel) {
  closeAccountPanel.addEventListener('click', () => {
    if (accountPanel) {
      accountPanel.classList.remove('visible');
      accountPanel.classList.add('hidden');
    }
  });
}

if (openDashboardPage) {
  openDashboardPage.addEventListener('click', () => {
    showPage('dashboardPage');
    if (accountPanel) {
      accountPanel.classList.remove('visible');
      accountPanel.classList.add('hidden');
    }
  });
}

document.addEventListener('click', (event) => {
  const markReadButton = event.target.closest('.notification-mark-read');
  if (markReadButton) {
    event.stopPropagation();
    const messageId = markReadButton.dataset.messageId;
    removeCurrentUserMessage(messageId);
    return;
  }

  const dashboardDeleteButton = event.target.closest('.dashboard-message-delete');
  if (dashboardDeleteButton) {
    event.stopPropagation();
    const messageId = dashboardDeleteButton.dataset.messageId;
    removeCurrentUserMessage(messageId);
    return;
  }

  const inventoryAdjustButton = event.target.closest('.inventory-adjust');
  if (inventoryAdjustButton) {
    event.stopPropagation();
    const itemId = inventoryAdjustButton.dataset.inventoryId;
    const delta = inventoryAdjustButton.dataset.action === 'increase' ? 1 : -1;
    adjustInventoryQuantity(itemId, delta);
    return;
  }

  const closeFormButton = event.target.closest('[data-close-form]');
  if (closeFormButton) {
    event.stopPropagation();
    resetActionForms();
    return;
  }

  const listDeleteButton = event.target.closest('.dashboard-item-delete');
  if (listDeleteButton) {
    event.stopPropagation();
    const inventoryId = listDeleteButton.dataset.inventoryId;
    const todoId = listDeleteButton.dataset.todoId;
    if (inventoryId) {
      removeInventoryItem(inventoryId);
      return;
    }
    if (todoId) {
      removeTodoItem(todoId);
      return;
    }
  }

  const logDeleteButton = event.target.closest('.log-delete');
  if (logDeleteButton) {
    event.stopPropagation();
    deleteLogEntry(logDeleteButton.dataset.logId);
    return;
  }

  const todoCheckbox = event.target.closest('input[type="checkbox"][data-todo-id]');
  if (todoCheckbox) {
    const todoId = todoCheckbox.dataset.todoId;
    toggleTodoStatus(todoId);
    return;
  }

  if (notificationPanel && !notificationPanel.contains(event.target) && event.target !== notificationBell) {
    notificationPanel.classList.remove('visible');
    notificationPanel.classList.add('hidden');
  }

  if (accountPanel && !accountPanel.contains(event.target) && event.target !== currentUserName) {
    accountPanel.classList.remove('visible');
    accountPanel.classList.add('hidden');
  }
});

document.getElementById('showHireForm').addEventListener('click', () => showActionForm('hireForm'));
document.getElementById('showMessageForm').addEventListener('click', () => showActionForm('messageForm'));
document.getElementById('showPromoteForm').addEventListener('click', () => showActionForm('promoteForm'));
document.getElementById('showFireForm').addEventListener('click', () => showActionForm('fireForm'));

document.getElementById('hireEmployee').addEventListener('click', handleHire);
document.getElementById('sendMessage').addEventListener('click', handleSendMessage);
document.getElementById('promoteEmployee').addEventListener('click', handlePromote);
document.getElementById('fireEmployee').addEventListener('click', handleFire);
statusSelect.addEventListener('change', () => {
  if (!currentUser) return;
  currentUser.status = statusSelect.value;
  const employee = employees.find((item) => item.id === currentUser.id);
  if (employee) {
    employee.status = currentUser.status;
    saveEmployees();
    saveCurrentUser();
    renderDashboard();
    renderEmployeeList();
    initializeAccountUI();
  }
});

if (addInventoryItemButton) {
  addInventoryItemButton.addEventListener('click', addInventoryItem);
}
if (addTodoItemButton) {
  addTodoItemButton.addEventListener('click', addTodoItem);
}

const manageInventoryCategoriesBtn = document.getElementById('manageInventoryCategories');
const manageTodoCategoriesBtn = document.getElementById('manageTodoCategories');
if (manageInventoryCategoriesBtn) {
  manageInventoryCategoriesBtn.addEventListener('click', manageInventoryCategories);
}
if (manageTodoCategoriesBtn) {
  manageTodoCategoriesBtn.addEventListener('click', manageTodoCategories);
}
if (dashboardActionsList) {
  dashboardActionsList.addEventListener('click', (event) => {
    const actionButton = event.target.closest('[data-dashboard-action]');
    if (!actionButton) return;
    const action = actionButton.dataset.dashboardAction;
    showPage('employeesPage');
    if (action === 'hire') showActionForm('hireForm');
    if (action === 'promote') showActionForm('promoteForm');
    if (action === 'fire') showActionForm('fireForm');
    if (action === 'message') showActionForm('messageForm');
  });
}
const deleteAllLogsButton = document.getElementById('deleteAllLogs');
if (deleteAllLogsButton) {
  deleteAllLogsButton.addEventListener('click', deleteAllLogs);
}
function manageInventoryCategories() {
  const list = inventoryCategories.join(', ');
  const input = prompt(`Aktuelle Kategorien: ${list}

Gib neue Kategorien kommasepariert ein, oder schreibe "löschen:NAME" zum Entfernen.`, '');
  if (!input) return;
  const trimmed = input.trim();
  if (/^(löschen:|delete:)/i.test(trimmed)) {
    const name = trimmed.split(':')[1]?.trim();
    if (!name) { alert('Kein Kategoriename angegeben.'); return; }
    inventoryCategories = inventoryCategories.filter(c => c !== name);
    inventoryData.forEach(i => { if (i.category === name) i.category = inventoryCategories[0] || 'Sonstiges'; });
    saveInventoryCategories();
    saveInventory();
    renderInventory();
    alert(`Kategorie "${name}" entfernt.`);
    return;
  }
  const parts = trimmed.split(',').map(s => s.trim()).filter(Boolean);
  parts.forEach(p => { if (!inventoryCategories.includes(p)) inventoryCategories.push(p); });
  saveInventoryCategories();
  alert('Kategorien aktualisiert.');
  renderInventory();
}

function manageTodoCategories() {
  const list = todoCategories.join(', ');
  const input = prompt(`Aktuelle Kategorien: ${list}\n\nGib neue Kategorien kommasepariert ein, oder schreibe "löschen:NAME" zum Entfernen.`, '');
  if (!input) return;
  const trimmed = input.trim();
  if (/^(löschen:|delete:)/i.test(trimmed)) {
    const name = trimmed.split(':')[1]?.trim();
    if (!name) { alert('Kein Kategoriename angegeben.'); return; }
    todoCategories = todoCategories.filter(c => c !== name);
    // reassign tasks in deleted folder
    todoData.forEach(t => { if (t.folder === name) t.folder = todoCategories[0] || 'Allgemein'; });
    saveTodoCategories();
    saveTodos();
    renderTodoList();
    alert(`Kategorie "${name}" entfernt.`);
    return;
  }
  const parts = trimmed.split(',').map(s => s.trim()).filter(Boolean);
  parts.forEach(p => { if (!todoCategories.includes(p)) todoCategories.push(p); });
  saveTodoCategories();
  alert('Kategorien aktualisiert.');
  renderTodoList();
}

reportUpload.addEventListener('change', handleReportUpload);
updateSelectedStatus.addEventListener('click', () => {
  const employee = getSelectedEmployee();
  if (!employee) {
    alert('Bitte zuerst ein Mitglied auswählen.');
    return;
  }
  const oldStatus = employee.status;
  employee.status = selectedEmployeeStatus.value;
  if (oldStatus !== employee.status) {
    addLogEntry('Status geändert', `${employee.name} von ${oldStatus} auf ${employee.status}`);
  }
  saveEmployees();
  renderAllEmployeeViews();
  alert('Status des Mitglieds wurde gespeichert.');
});
if (clearStorage) {
  clearStorage.addEventListener('click', async () => {
    if (!confirm('Alle lokalen Daten wirklich zurücksetzen?')) return;
    await clearAllStorage();
    await initializeData();
    updateLoginState();
    renderInventory();
    renderTodoList();
    renderReports();
  });
}

window.addEventListener('beforeunload', () => {
  saveAllData();
});

async function startApp() {
  await initializeData();
  updateStatusOptions();
  initializeAccountUI();
  renderAllEmployeeViews();
  renderInventory();
  renderTodoList();
  renderReports();
  renderSelectedEmployeeInfo();
  updateLoginState();
}

startApp();
