// ==========================================
// CONFIGURACIÓN BACKEND Y COMUNIDAD (MÓDULO 4)
// Puedes cambiar los enlaces ("url") fácilmente aquí cuando gustes.
// ==========================================
const APPS_SCRIPT_URL = "AQUI_VA_TU_URL_DE_APPS_SCRIPT";

// LISTAS EDITABLES PARA COMUNIDAD
const COMMUNITY_SPACES = [
  { title: "Recién diagnosticados", icon: "🌱", url: "#" },
  { title: "Jóvenes", icon: "⚡", url: "#" },
  { title: "Mayores de 50", icon: "🍷", url: "#" },
  { title: "Mujeres", icon: "✨", url: "#" },
  { title: "Hombres", icon: "🤝", url: "#" },
  { title: "Personas Trans", icon: "🦋", url: "#" },
  { title: "Familiares", icon: "🏡", url: "#" },
  { title: "Cuidadores", icon: "🛡️", url: "#" }
];

const COMMUNITY_EVENTS = [
  { title: "Jornadas", icon: "📋", url: "#" },
  { title: "Talleres", icon: "🎨", url: "#" },
  { title: "Actividades", icon: "🚀", url: "#" },
  { title: "Charlas", icon: "🎙️", url: "#" },
  { title: "Grupos presenciales", icon: "🫂", url: "#" }
];

const STORAGE_KEY = 'chavihtxs_full_user_v2';
const DOSES_KEY = 'chavihtxs_dose_history_v2';

let userProfile = null;
let doseHistory = {};

document.addEventListener('DOMContentLoaded', () => {
  loadState();
  renderCommunityModules();
  checkDoseNotificationTime();
});

// ROUTER CLIENTE PARA NAVEGAR ENTRE MÓDULOS
function navigateTo(viewId, btn) {
  document.querySelectorAll('.page-view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  
  document.getElementById(viewId).classList.add('active');
  if (btn) btn.classList.add('active');
}

// CARGA DE ESTADO DESDE LOCALSTORAGE
function loadState() {
  const savedProfile = localStorage.getItem(STORAGE_KEY);
  const savedDoses = localStorage.getItem(DOSES_KEY);

  if (savedDoses) doseHistory = JSON.parse(savedDoses);

  if (savedProfile) {
    userProfile = JSON.parse(savedProfile);
    if (!userProfile.medicalAppointments) userProfile.medicalAppointments = [];
    if (!userProfile.refillAppointments) userProfile.refillAppointments = [];
    
    document.getElementById('onboarding-modal').classList.add('hidden');
    renderDashboard();
  } else {
    document.getElementById('onboarding-modal').classList.remove('hidden');
  }
}

// MANEJO DEL FORMULARIO DE INICIO
function handleOnboardingSubmit(event) {
  event.preventDefault();
  userProfile = {
    nickname: document.getElementById('input-nickname').value.trim(),
    treatment: document.getElementById('input-treatment').value,
    medName: document.getElementById('input-med-name').value.trim(),
    extraBottles: parseInt(document.getElementById('input-extra-bottles').value) || 0,
    currentStock: parseInt(document.getElementById('input-current-stock').value) || 30,
    startDate: document.getElementById('input-start-date').value,
    viralLoad: document.getElementById('input-viral-load').value.trim() || 'I=I',
    cd4: document.getElementById('input-cd4').value || '--',
    doseTime: '09:00 AM',
    doctorNotes: '',
    medicalAppointments: [],
    refillAppointments: []
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(userProfile));
  document.getElementById('onboarding-modal').classList.add('hidden');
  renderDashboard();

  sendToAppsScript('saveOnboarding', userProfile);
}

// RENDERIZADO GENERAL DE LA APP
function renderDashboard() {
  if (!userProfile) return;

  // Módulo 1: Inicio
  document.getElementById('user-nickname-display').innerText = userProfile.nickname;
  document.getElementById('treatment-title-display').innerText = `MI ${userProfile.treatment}`;
  document.getElementById('status-badge-text').innerText = `STATUS ${userProfile.viralLoad}`;
  document.getElementById('cd4-display').innerText = userProfile.cd4;
  document.getElementById('med-name-display').innerText = userProfile.medName;

  // Módulo 2: Tratamiento
  document.getElementById('mod2-med-name').innerText = userProfile.medName;
  document.getElementById('mod2-dose-time').innerText = userProfile.doseTime || '09:00 AM';
  document.getElementById('count-bottles').innerText = userProfile.extraBottles;

  const stockActual = localStorage.getItem('count_pills') || userProfile.currentStock;
  document.getElementById('stock-count-display').innerText = stockActual;
  document.getElementById('count-pills').innerText = stockActual;

  const alertBox = document.getElementById('empty-bottle-alert');
  if (parseInt(stockActual, 10) <= 0) {
  alertBox.style.display = 'block';
  } else {
  alertBox.style.display = 'none';
  }

  // Cálculo de racha
  const totalDays = calculateTotalDays();
  document.getElementById('streak-time-display').innerText = formatTimeFromDays(totalDays);

  checkTodayDoseStatus();
  renderAppointments();
  checkUpcomingAppointments();
  renderConsultationNotes();
}

function calculateTotalDays() {
  if (!userProfile || !userProfile.startDate) return 0;
  const [sYear, sMonth, sDay] = userProfile.startDate.split('-').map(Number);
  const startMidnight = new Date(sYear, sMonth - 1, sDay);
  const now = new Date();
  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffTime = Math.max(0, todayMidnight - startMidnight);
  return Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1;
}

function formatTimeFromDays(totalDays) {
  if (totalDays <= 0) return '0 días';
  const years = Math.floor(totalDays / 365);
  const remainingDays = totalDays % 365;
  const months = Math.floor(remainingDays / 30);
  const days = remainingDays % 30;

  let parts = [];
  if (years > 0) parts.push(`${years} ${years === 1 ? 'año' : 'años'}`);
  if (months > 0) parts.push(`${months} ${months === 1 ? 'mes' : 'meses'}`);
  if (days > 0 || parts.length === 0) parts.push(`${days} ${days === 1 ? 'día' : 'días'}`);
  return parts.join(' ');
}

// RENDERIZAR BOTONES EDITABLES DE COMUNIDAD (MÓDULO 4)
function renderCommunityModules() {
  const spacesContainer = document.getElementById('spaces-grid-container');
  if (spacesContainer) {
    spacesContainer.innerHTML = COMMUNITY_SPACES.map(space => `
      <a href="${space.url}" class="community-btn-card" target="_blank">
        <span class="c-icon">${space.icon}</span>
        <span class="c-title">${space.title}</span>
      </a>
    `).join('');
  }

  const eventsContainer = document.getElementById('events-grid-container');
  if (eventsContainer) {
    eventsContainer.innerHTML = COMMUNITY_EVENTS.map(ev => `
      <a href="${ev.url}" class="community-btn-card" target="_blank">
        <span class="c-icon">${ev.icon}</span>
        <span class="c-title">${ev.title}</span>
      </a>
    `).join('');
  }
}

function openVihvitasAction() {
  alert("❤️‍🔥 ¡VIHVITAS Y COLEANDO!\n\nPróximamente abriremos este espacio de chats comunitarios, círculos de apoyo y encuentros presenciales de la familia DEO ARM. ¡Mantente atentx!");
}

// RENDER DE CITAS (Módulos 1 y 2)
function renderAppointments() {
  const medContainer = document.getElementById('medical-list-container');
  if (!userProfile.medicalAppointments || userProfile.medicalAppointments.length === 0) {
    medContainer.innerHTML = '<p class="text-gray-12">No tienes citas médicas programadas.</p>';
  } else {
    medContainer.innerHTML = userProfile.medicalAppointments.map((app, idx) => `
      <div class="flex-between" style="margin-bottom: 8px;">
        <div>
          <div class="text-bold-16">${app.date}</div>
          <div class="text-gray-12">${app.place || 'Consulta Médica'}</div>
        </div>
        <div style="display: flex; gap: 8px; align-items: center;">
          <button class="btn-icon" title="Añadir a mi calendario" onclick="downloadCalendarEvent('Cita Médica TAR', '${app.date}', '${app.place || 'Consulta Médica'}')">
            <i class="fa-solid fa-calendar-plus" style="color: var(--cream);"></i>
          </button>
          <button class="btn-icon" onclick="deleteAppointment('medical', ${idx})"><i class="fa-solid fa-trash" style="color:#ef4444;"></i></button>
        </div>
      </div>
    `).join('');
  }

  const refillContainer = document.getElementById('refill-list-container');
  if (!userProfile.refillAppointments || userProfile.refillAppointments.length === 0) {
    refillContainer.innerHTML = '<p class="text-gray-12">No tienes citas de resurtido registradas.</p>';
  } else {
    refillContainer.innerHTML = userProfile.refillAppointments.map((app, idx) => `
      <div class="flex-between" style="margin-bottom: 8px;">
        <div>
          <div class="text-bold-16">${app.date}</div>
          <div class="text-gray-12">${app.place || 'Clínica / Farmacia'}</div>
        </div>
        <div style="display: flex; gap: 8px; align-items: center;">
          <button class="btn-icon" title="Añadir a mi calendario" onclick="downloadCalendarEvent('Resurtido de Medicamento', '${app.date}', '${app.place || 'Clínica / Farmacia'}')">
            <i class="fa-solid fa-calendar-plus" style="color: var(--cream);"></i>
          </button>
          <button class="btn-icon" onclick="deleteAppointment('refill', ${idx})"><i class="fa-solid fa-trash" style="color:#ef4444;"></i></button>
        </div>
      </div>
    `).join('');
  }
}

// AGREGAR Y ELIMINAR CITAS
function addMedicalAppointment() {
  const date = prompt("Fecha de la cita médica (Ej. 15 de Octubre - 10:00 AM):");
  if (!date) return;
  const place = prompt("Lugar o Clínica (Opcional):") || "Consulta General";

  if (!userProfile.medicalAppointments) userProfile.medicalAppointments = [];
  userProfile.medicalAppointments.push({ date, place });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(userProfile));
  renderDashboard();
}

function addRefillAppointment() {
  const date = prompt("Fecha de resurtido de medicamentos (Ej. 01 de Noviembre):");
  if (!date) return;
  const place = prompt("Lugar de entrega (Opcional):") || "Farmacia / Clínica";

  if (!userProfile.refillAppointments) userProfile.refillAppointments = [];
  userProfile.refillAppointments.push({ date, place });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(userProfile));
  renderDashboard();
}

function deleteAppointment(type, index) {
  if (type === 'medical') {
    userProfile.medicalAppointments.splice(index, 1);
  } else {
    userProfile.refillAppointments.splice(index, 1);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(userProfile));
  renderDashboard();
}

// ACCIONES Y EVENTOS
function markDoseTaken() {
  const todayStr = new Date().toISOString().split('T')[0];
  if (doseHistory[todayStr]) return;

  doseHistory[todayStr] = true;
  localStorage.setItem(DOSES_KEY, JSON.stringify(doseHistory));

  if (userProfile.currentStock > 0) {
    userProfile.currentStock -= 1;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(userProfile));
  }

  renderDashboard();
  sendToAppsScript('takeDose', { nickname: userProfile.nickname });
}

function checkTodayDoseStatus() {
  const todayStr = new Date().toISOString().split('T')[0];
  const btn = document.getElementById('btn-dosis');
  const btnText = document.getElementById('btn-dosis-text');

  if (doseHistory[todayStr]) {
    btn.classList.add('done');
    btnText.innerText = "¡TOMADA!";
  } else {
    btn.classList.remove('done');
    btnText.innerText = "DOSIS LISTA";
  }
}

function editDoseTime() {
  const newTime = prompt("Editar hora de toma:", userProfile.doseTime);
  if (newTime) {
    userProfile.doseTime = newTime;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(userProfile));
    renderDashboard();
  }
}

function addFullBottle() {
  userProfile.extraBottles += 1;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(userProfile));
  renderDashboard();
  sendToAppsScript('updateInventory', { nickname: userProfile.nickname, extraBottles: userProfile.extraBottles, currentStock: userProfile.currentStock });
}

function resetPillCount() {
  userProfile.currentStock = 30;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(userProfile));
  renderDashboard();
}

function openNewBottle() {
  if (userProfile.extraBottles > 0) userProfile.extraBottles -= 1;
  userProfile.currentStock = 30;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(userProfile));
  renderDashboard();
}

function promptUpdateCD4() {
  const val = prompt("Nuevo dato de CD4:", userProfile.cd4);
  if (val) {
    userProfile.cd4 = val;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(userProfile));
    renderDashboard();
  }
}

// PETICIONES AL BACKEND
function sendToAppsScript(action, payload) {
  if (!APPS_SCRIPT_URL || APPS_SCRIPT_URL === "AQUI_VA_TU_URL_DE_APPS_SCRIPT") return;

  fetch(APPS_SCRIPT_URL, {
    method: 'POST',
    mode: 'no-cors',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: action, payload: payload })
  }).catch(err => console.error("Error conectando con Apps Script:", err));
}
/* =================================================_
   CHAVIHTXS PWA - LÓGICA PRINCIPAL, TRATAMIENTO E INVENTARIO
   ================================================= */

document.addEventListener('DOMContentLoaded', () => {
  initializeAppState();
  initEventListeners();
  requestNotificationPermission();
  checkMedicalAppointments();
});

// 1. INICIALIZACIÓN DE ESTADOS Y LOCALSTORAGE
function initializeAppState() {
  if (!localStorage.getItem('count_bottles')) {
    localStorage.setItem('count_bottles', '1');
  }
  if (!localStorage.getItem('count_pills')) {
    localStorage.setItem('count_pills', '30');
  }
  if (!localStorage.getItem('dose_time')) {
    localStorage.setItem('dose_time', '09:00');
  }
  if (!localStorage.getItem('medical_appointments')) {
    localStorage.setItem('medical_appointments', JSON.stringify([]));
  }

  updateUIInventory();
  updateUIDoseTime();
}

function initEventListeners() {
  const resetBtn = document.getElementById('btn-reset-pills');
  if (resetBtn) {
    resetBtn.removeAttribute('onclick');
    resetBtn.addEventListener('click', resetPillCount);
  }
}

// 2. SOLICITAR PERMISOS DE NOTIFICACIÓN
function requestNotificationPermission() {
  if ("Notification" in window && Notification.permission === "default") {
    Notification.requestPermission().then(permission => {
      if (permission === "granted") {
        console.log("Permisos de notificación concedidos.");
      }
    });
  }
}

// 3. LÓGICA DE NOTIFICACIÓN DE LA PRÓXIMA TOMA
function scheduleDoseNotification(doseTimeStr) {
  if (!doseTimeStr) return;
  
  // Limpiar formato si incluye AM/PM
  const cleanTime = doseTimeStr.replace(/\s?[AP]M/i, '');
  const [hours, minutes] = cleanTime.split(':');
  
  const now = new Date();
  const targetTime = new Date();
  
  targetTime.setHours(parseInt(hours, 10));
  targetTime.setMinutes(parseInt(minutes, 10));
  targetTime.setSeconds(0);

  if (targetTime <= now) {
    targetTime.setDate(targetTime.getDate() + 1);
  }

  const timeToWait = targetTime.getTime() - now.getTime();

  setTimeout(() => {
    if (Notification.permission === "granted") {
      const title = '¡Es hora de tu tratamiento, bb! 💊';
      const body = 'Es momento de tomar tu pastilla correspondiente a tu próxima toma.';
      
      if (navigator.serviceWorker && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'SHOW_NOTIFICATION',
          title: title,
          body: body
        });
      } else {
        new Notification(title, { body: body, icon: '/icon-192.png' });
      }
    }
    scheduleDoseNotification(doseTimeStr);
  }, timeToWait);
}

// 4. ALERTAS ANTICIPADAS PARA CITAS MÉDICAS (MÍNIMO 2 DÍAS ANTES)
function checkMedicalAppointments() {
  const appointments = JSON.parse(localStorage.getItem('medical_appointments') || '[]');
  const now = new Date();

  appointments.forEach(app => {
    const appDate = new Date(app.date);
    const diffTime = appDate.getTime() - now.getTime();
    const diffDays = diffTime / (1000 * 3600 * 24);

    // Disparar aviso preventivo exacto cuando falten entre 2 y 1.9 días
    if (diffDays <= 2 && diffDays > 1.9) {
      if (Notification.permission === "granted") {
        const title = 'Recordatorio de Cita Médica 🩺';
        const body = 'Tienes una cita médica en 2 días. Recuerda revisar tus notas y apuntes previos.';

        if (navigator.serviceWorker && navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({
            type: 'SHOW_NOTIFICATION',
            title: title,
            body: body
          });
        } else {
          new Notification(title, { body: body, icon: '/icon-192.png' });
        }
      }
    }
  });
}

// 5. GESTIÓN DE INVENTARIO: BOTÓN "RESET PASTILLAS"
function resetPillCount() {
  let currentBottles = parseInt(localStorage.getItem('count_bottles') || '1', 10);
  let currentPills = 30; // Forzamos a 30

  // Al dar reset: Resta -1 al frasco extra y regresa a 30 pastillas el frasco actual
  if (currentBottles > 0) {
    currentBottles -= 1;
  }

  // Guardamos en el almacenamiento local
  localStorage.setItem('count_bottles', currentBottles);
  localStorage.setItem('count_pills', currentPills);

  // Actualizamos la interfaz general del inventario
  updateUIInventory();

  // FORZAR LA ACTUALIZACIÓN EN AMBOS MÓDULOS DE LA PWA
  const esquemaInicioEl = document.getElementById('stock-count-display'); // Esquema Actual (Inicio)
  const frascoActualEl = document.getElementById('count-pills');         // Pastillas Frasco Actual (Tratamiento)

  if (esquemaInicioEl) esquemaInicioEl.innerText = currentPills;
  if (frascoActualEl) frascoActualEl.innerText = currentPills;

  const emptyAlert = document.getElementById('empty-bottle-alert');
  if (emptyAlert) {
    emptyAlert.style.display = 'none';
  }
}

// Funciones auxiliares adicionales de la PWA
function addFullBottle() {
  let currentBottles = parseInt(localStorage.getItem('count_bottles') || '0', 10);
  currentBottles += 1;
  localStorage.setItem('count_bottles', currentBottles);
  updateUIInventory();
}

function openNewBottle() {
  resetPillCount();
}

function editDoseTime() {
  const currentVal = localStorage.getItem('dose_time') || "09:00";
  const newTime = prompt("Ingresa la nueva hora de tu toma (Formato HH:MM):", currentVal);
  if (newTime && /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(newTime)) {
    localStorage.setItem('dose_time', newTime);
    updateUIDoseTime();
  } else if (newTime) {
    alert("Formato no válido. Usa HH:MM (ej. 09:00)");
  }
}

function updateUIInventory() {
  const bottlesEl = document.getElementById('count-bottles');
  const pillsEl = document.getElementById('count-pills');

  if (bottlesEl) bottlesEl.innerText = localStorage.getItem('count_bottles');
  if (pillsEl) pillsEl.innerText = localStorage.getItem('count_pills');
}

function updateUIDoseTime() {
  const doseTime = localStorage.getItem('dose_time');
  const doseTimeDisplay = document.getElementById('mod2-dose-time');
  if (doseTimeDisplay) {
    doseTimeDisplay.innerText = doseTime;
  }
  scheduleDoseNotification(doseTime);
}

function promptUpdatePills() {
  const current = localStorage.getItem('count_pills') || '30';
  const val = prompt("¿Cuántas pastillas te quedan exactamente?", current);
  
  if (val !== null && !isNaN(val) && val.trim() !== "") {
    const newPills = parseInt(val, 10);
    
    // 1. Guardar en localStorage para 'Pastillas Frasco Actual'
    localStorage.setItem('count_pills', newPills);

    // 2. Si manejas la estructura userProfile, actualizarla y guardarla también
    if (typeof userProfile !== 'undefined' && userProfile) {
      userProfile.currentStock = newPills;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(userProfile));
    }

    // 3. Actualizar la interfaz en ambos módulos
    updateUIInventory();
    
    const esquemaInicioEl = document.getElementById('stock-count-display');
    if (esquemaInicioEl) esquemaInicioEl.innerText = newPills;

    const countPillsEl = document.getElementById('count-pills');
    if (countPillsEl) countPillsEl.innerText = newPills;
  }
}

function markDoseTaken() {
  const todayStr = new Date().toISOString().split('T')[0]; // Fecha actual YYYY-MM-DD
  const lastTakenDate = localStorage.getItem('last_dose_date');
  let currentStreak = parseInt(localStorage.getItem('dose_streak') || '0', 10);
  let currentPills = parseInt(localStorage.getItem('count_pills') || '30', 10);

  // Evitar sumar doble si ya la marcó hoy
  if (lastTakenDate === todayStr) {
    alert("¡Ya registraste tu dosis de hoy, bb! Vas excelente.");
    return;
  }

  // Comprobar si fue racha continua o se rompió
  if (lastTakenDate) {
    const lastDate = new Date(lastTakenDate);
    const currentDate = new Date(todayStr);
    const diffTime = currentDate - lastDate;
    const diffDays = diffTime / (1000 * 3600 * 24);

    if (diffDays === 1) {
      // Tomada al día siguiente continuo: Sube racha
      currentStreak += 1;
    } else if (diffDays > 1) {
      // Se pasó más de un día: Se reinicia la racha a 1
      currentStreak = 1;
    }
  } else {
    // Primer registro de la vida
    currentStreak = 1;
  }

  // Descontar una pastilla del stock actual
  if (currentPills > 0) {
    currentPills -= 1;
  }

  // Guardar en localStorage (¡Aquí estaba la llave mal puesta antes!)
  localStorage.setItem('last_dose_date', todayStr);
  localStorage.setItem('dose_streak', currentStreak);
  localStorage.setItem('count_pills', currentPills);

  // Actualizar la interfaz visualmente
  updateUIStreak();
  updateUIInventory();

  // Sincronizar ambos elementos en pantalla (Inicio y Tratamiento)
  const esquemaInicioEl = document.getElementById('stock-count-display');
  const frascoActualEl = document.getElementById('count-pills');

  if (esquemaInicioEl) esquemaInicioEl.innerText = currentPills;
  if (frascoActualEl) frascoActualEl.innerText = currentPills;

  // Cambiar estado visual del botón temporalmente
  const btnText = document.getElementById('btn-dosis-text');
  if (btnText) {
    btnText.innerText = "¡DOSIS REGISTRADA!";
    setTimeout(() => { btnText.innerText = "DOSIS LISTA"; }, 3000);
  }
}

// Función para pintar la racha en la pantalla
function updateUIStreak() {
  const streakDisplay = document.getElementById('streak-time-display');
  const streakDays = localStorage.getItem('dose_streak') || '0';
  if (streakDisplay) {
    streakDisplay.innerText = `${streakDays} ${streakDays == 1 ? 'día' : 'días'}`;
  }
}

function mostrarAvisoActualizacion() {
  // Creamos el elemento del banner dinámicamente
  const banner = document.createElement('div');
  banner.innerHTML = "⚡ Chavihtxs actualizado: Seguimos metiéndole galleta al código.";
  banner.style.cssText = `
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: #171717;
    color: #fff;
    padding: 10px 20px;
    border-radius: 8px;
    font-size: 14px;
    z-index: 10000;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    border-left: 4px solid #8b0000; /* Tu toque de acento */
  `;
  
  document.body.appendChild(banner);

  // Se quita solito después de 4 segundos
  setTimeout(() => {
    banner.remove();
  }, 4000);
}

// Función para verificar y lanzar notificaciones de citas próximas (ej. 2 días antes)
function checkUpcomingAppointments() {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Combinar citas médicas y de resurtido
  const allAppointments = [
    ...(userProfile.medicalAppointments || []).map(a => ({ ...a, type: 'Cita Médica' })),
    ...(userProfile.refillAppointments || []).map(a => ({ ...a, type: 'Cita de Resurtido' }))
  ];

  allAppointments.forEach(app => {
    if (!app.date) return;
    
    // Asumiendo formato de fecha YYYY-MM-DD o DD/MM/YYYY
    const [year, month, day] = app.date.split('-').map(Number);
    const appDate = new Date(year, month - 1, day);
    appDate.setHours(0, 0, 0, 0);

    const diffTime = appDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // Si faltan 2 días o 1 día para la cita
    if (diffDays === 2 || diffDays === 1) {
      if (navigator.serviceWorker && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'SHOW_NOTIFICATION',
          title: `Recordatorio: ${app.type}`,
          body: `Tienes una ${app.type.toLowerCase()} programada para el ${app.date} en ${app.place || 'tu clínica'}.`
        });
      }
    }
  });
}

function downloadCalendarEvent(title, dateStr, place) {
  // Extrae la parte de la fecha si viene en formato texto o timestamp
  // Reemplaza caracteres para obtener una fecha limpia en formato YYYYMMDD
  let cleanDate = dateStr.split(' ')[0].replace(/-/g, '').replace(/\//g, '');

  // Si no hay año o es una fecha en texto como "31 de Agosto", usa el año actual
  if (cleanDate.length < 8) {
    const today = new Date();
    const currentYear = today.getFullYear();
    // Intenta formatear la fecha a un objeto Date válido
    const parsedDate = new Date(`${dateStr} ${currentYear}`);
    if (!isNaN(parsedDate)) {
      cleanDate = parsedDate.toISOString().split('T')[0].replace(/-/g, '');
    } else {
      cleanDate = today.toISOString().split('T')[0].replace(/-/g, '');
    }
  }
  
  // Construye la URL de Google Calendar
  const url = `https://calendar.google.com/calendar/render?action=TEMPLATE` +
              `&text=${encodeURIComponent('📌 ' + title)}` +
              `&dates=${cleanDate}/${cleanDate}` +
              `&details=${encodeURIComponent('Recordatorio de salud guardado desde CHAVIHTXS PWA')}` +
              `&location=${encodeURIComponent(place || 'Clínica')}`;
  
  // Abre la app o la web del calendario
  window.open(url, '_blank');
}

// 1. RENDERIZAR NOTAS
function renderConsultationNotes() {
  const notesContainer = document.getElementById('notes-list-container');
  if (!notesContainer) return;

  if (!userProfile.consultationNotes) {
    userProfile.consultationNotes = [];
  }

  if (userProfile.consultationNotes.length === 0) {
    notesContainer.innerHTML = '<p class="text-gray-12" style="font-style: italic;">No tienes notas guardadas.</p>';
  } else {
    notesContainer.innerHTML = userProfile.consultationNotes.map((note, idx) => `
      <div class="flex-between" style="background: rgba(255, 255, 255, 0.03); padding: 8px 10px; border-radius: 8px; margin-bottom: 6px; border: 1px solid rgba(255,255,255,0.05);">
        <div class="text-14" style="color: #fff; word-break: break-word; padding-right: 8px;">${note}</div>
        <button class="btn-icon" onclick="deleteConsultationNote(${idx})" title="Eliminar nota">
          <i class="fa-solid fa-trash" style="color: #ef4444;"></i>
        </button>
      </div>
    `).join('');
  }
}

// 2. AGREGAR NOTA
function addConsultationNote() {
  const input = document.getElementById('consultation-note-input');
  const noteText = input.value.trim();

  if (!noteText) return;

  if (!userProfile.consultationNotes) {
    userProfile.consultationNotes = [];
  }

  userProfile.consultationNotes.push(noteText);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(userProfile)); // ✅ Guarda en tu localStorage
  input.value = '';
  renderConsultationNotes();
}

// 3. ELIMINAR NOTA
function deleteConsultationNote(index) {
  if (userProfile.consultationNotes && userProfile.consultationNotes[index] !== undefined) {
    userProfile.consultationNotes.splice(index, 1);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(userProfile)); // ✅ Guarda en tu localStorage
    renderConsultationNotes();
  }
}

// ==========================================
// REVISOR AUTOMÁTICO DE HORA DE TOMA
// ==========================================
function checkDoseNotificationTime() {
  if (!userProfile || !userProfile.doseTime) return;

  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();

  // Convierte la hora actual al formato HH:MM AM/PM
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const formattedHours = hours % 12 || 12;
  const padHours = String(formattedHours).padStart(2, '0');
  const padMinutes = String(minutes).padStart(2, '0');
  const currentTimeString = `${padHours}:${padMinutes} ${ampm}`;

  // Verifica si hoy ya se tomó la dosis
  const todayKey = now.toISOString().split('T')[0];
  const takenToday = doseHistory[todayKey];

  // Si coincide la hora y no se ha tomado hoy
  if (currentTimeString === userProfile.doseTime && !takenToday) {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('⏰ ¡Hora de tu tratamiento!', {
        body: `Hola ${userProfile.nickname || 'amiga'}, es hora de tomar tu dosis de ${userProfile.medName}.`,
        icon: 'icon-192.png',
        tag: 'dose-reminder',
        renotify: true
      });
    }
  }
}

// Revisa la hora cada 30 segundos
setInterval(checkDoseNotificationTime, 30000);

// ==========================================
// ALARMA RECURRENTE EN CALENDARIO (.ICS)
// Compatibilidad para formatos HH:MM y HH:MM AM/PM
// ==========================================
function downloadDoseCalendarEvent() {
  if (!userProfile || !userProfile.doseTime) {
    alert("Primero configura tu hora de toma en el perfil.");
    return;
  }

  let hours = 9;
  let minutes = 0;
  const rawTime = userProfile.doseTime.trim();

  // Detecta si incluye AM/PM
  if (rawTime.toUpperCase().includes('AM') || rawTime.toUpperCase().includes('PM')) {
    const [time, modifier] = rawTime.split(' ');
    const parts = time.split(':');
    hours = parseInt(parts[0], 10);
    minutes = parseInt(parts[1], 10);

    if (modifier.toUpperCase() === 'PM' && hours < 12) hours += 12;
    if (modifier.toUpperCase() === 'AM' && hours === 12) hours = 0;
  } else {
    // Formato 24 horas "HH:MM"
    const parts = rawTime.split(':');
    hours = parseInt(parts[0], 10);
    minutes = parseInt(parts[1], 10);
  }

  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  
  const startTime = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}T${pad(hours)}${pad(minutes)}00`;
  
  const icsData = 
`BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//CHAVIHTXS//Tratamiento//ES
BEGIN:VEVENT
SUMMARY:⏰ Tomar ${userProfile.medName || 'medicamento'}
DESCRIPTION:Hola ${userProfile.nickname || 'amigx'}, hora de tu dosis diaria.
DTSTART:${startTime}
DTEND:${startTime}
RRULE:FREQ=DAILY
BEGIN:VALARM
TRIGGER:PT0M
ACTION:DISPLAY
DESCRIPTION:Recordatorio
END:VALARM
END:VEVENT
END:VCALENDAR`;

  const blob = new Blob([icsData], { type: 'text/calendar;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'recordatorio_tratamiento.ics';
  link.click();
  URL.revokeObjectURL(link.href);
}

// Abrir enlace de PrEP a domicilio (VIHVE LIBRE)
function openPrepLink() {
  // Reemplaza esta URL con la liga directa al formulario/sitio de VIHVE LIBRE para PrEP
  const vihveLibreUrl = 'https://vihvelibre.org/'; 
  
  window.open(vihveLibreUrl, '_blank', 'noopener,noreferrer');
}
