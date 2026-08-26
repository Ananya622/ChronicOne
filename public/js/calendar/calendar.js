/**
 * calendar.js
 * Calendar Heatmap & Day Details Controller for ChronicOne.
 * Page: public/calendar.html
 * 
 * Features:
 *   - DOM-rendered monthly GitHub-style heatmap grid
 *   - Dynamic month navigation (Previous / Next / Today)
 *   - Visual classification mapping (Full, Partial, Low, Missed, No Check-in)
 *   - Current day indicator ring
 *   - Hover tooltip for quick glance (Date + Adherence + Status)
 *   - Click-on-day complete details modal (Habit breakdown, notes, health/mood data)
 *   - Real-time monthly adherence statistics & supportive insights
 *   - Strictly scoped to currentUser's authentic LocalStorage history
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize Icons
  if (window.lucide) {
    lucide.createIcons();
  }

  // 2. Authentication Check
  const currentUser = typeof requireAuth === 'function' ? requireAuth() : null;
  if (!currentUser) return;

  // 3. Theme Synchronization Engine
  initThemeSwitcher();

  // 4. Initialize User Sidebar Details
  initSidebarUserInfo(currentUser);

  // 5. Initialize Calendar Heatmap & Day Details Engine
  initCalendar();
});

// =========================================================================
// 1. THEME SWITCHER & SIDEBAR SETUP
// =========================================================================
function initThemeSwitcher() {
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  const themeIcon = document.getElementById('themeIcon');
  const savedTheme = localStorage.getItem('auraTheme') || 'dark';

  if (savedTheme === 'light') {
    document.body.classList.add('light-theme');
    if (themeIcon) themeIcon.setAttribute('data-lucide', 'moon');
  } else {
    document.body.classList.remove('light-theme');
    if (themeIcon) themeIcon.setAttribute('data-lucide', 'sun');
  }
  if (window.lucide) lucide.createIcons();

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      const isLight = document.body.classList.toggle('light-theme');
      localStorage.setItem('auraTheme', isLight ? 'light' : 'dark');
      if (themeIcon) themeIcon.setAttribute('data-lucide', isLight ? 'moon' : 'sun');
      if (window.lucide) lucide.createIcons();
    });
  }

  // Mobile menu toggle
  const mobileMenuToggle = document.getElementById('mobileMenuToggle');
  const appSidebar = document.getElementById('appSidebar');
  if (mobileMenuToggle && appSidebar) {
    mobileMenuToggle.addEventListener('click', () => {
      appSidebar.classList.toggle('mobile-open');
    });
  }

  // Logout button
  const btnLogout = document.getElementById('btnLogout');
  if (btnLogout) {
    btnLogout.addEventListener('click', () => {
      if (typeof logoutUser === 'function') logoutUser();
    });
  }
}

function initSidebarUserInfo(currentUser) {
  const sidebarName = document.getElementById('sidebarUserName');
  const sidebarEmail = document.getElementById('sidebarUserEmail');
  const sidebarAvatar = document.getElementById('sidebarAvatar');
  if (sidebarName) sidebarName.textContent = currentUser.name;
  if (sidebarEmail) sidebarEmail.textContent = currentUser.email;
  if (sidebarAvatar) sidebarAvatar.textContent = typeof getUserInitials === 'function' ? getUserInitials(currentUser.name) : 'US';
}

// =========================================================================
// 2. CALENDAR HEATMAP ENGINE
// =========================================================================

// State
let calState = {
  year: new Date().getFullYear(),
  month: new Date().getMonth(), // 0 = Jan, 11 = Dec
  selectedDate: null
};

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const WEEKDAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function initCalendar() {
  // Navigation Button Handlers
  const btnPrevMonth = document.getElementById('btnPrevMonth');
  const btnNextMonth = document.getElementById('btnNextMonth');
  const btnTodayMonth = document.getElementById('btnTodayMonth');

  if (btnPrevMonth) {
    btnPrevMonth.addEventListener('click', () => {
      calState.month--;
      if (calState.month < 0) {
        calState.month = 11;
        calState.year--;
      }
      renderCalendar();
    });
  }

  if (btnNextMonth) {
    btnNextMonth.addEventListener('click', () => {
      calState.month++;
      if (calState.month > 11) {
        calState.month = 0;
        calState.year++;
      }
      renderCalendar();
    });
  }

  if (btnTodayMonth) {
    btnTodayMonth.addEventListener('click', () => {
      const now = new Date();
      calState.year = now.getFullYear();
      calState.month = now.getMonth();
      renderCalendar();
    });
  }

  // Day Details Modal Close Handlers
  const modalDayDetails = document.getElementById('modalDayDetails');
  const btnCloseDayDetails = document.getElementById('btnCloseDayDetails');

  if (btnCloseDayDetails) {
    btnCloseDayDetails.addEventListener('click', closeDayDetailsModal);
  }

  if (modalDayDetails) {
    modalDayDetails.addEventListener('click', (e) => {
      if (e.target === modalDayDetails) {
        closeDayDetailsModal();
      }
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modalDayDetails?.classList.contains('active')) {
      closeDayDetailsModal();
    }
  });

  // Render initial view
  renderCalendar();
}

/**
 * Main render function that regenerates the month grid and monthly summary
 */
function renderCalendar() {
  const currentUser = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
  if (!currentUser) return;

  const rawCheckIns = typeof getUserCheckIns === 'function' ? getUserCheckIns(currentUser) : [];
  const userHabits = typeof getEffectiveUserHabits === 'function' ? getEffectiveUserHabits(currentUser) : (currentUser.habits || []);

  // Update Month Header Label
  const monthDisplay = document.getElementById('currentMonthYearDisplay');
  if (monthDisplay) {
    monthDisplay.textContent = `${MONTH_NAMES[calState.month]} ${calState.year}`;
  }

  // 1. Render Weekday Labels (Mon - Sun)
  renderWeekdayHeaders();

  // 2. Render Grid Cells via DOM
  renderMonthGrid(calState.year, calState.month, rawCheckIns, userHabits);

  // 3. Render Monthly Analytics Summary
  renderMonthlySummary(calState.year, calState.month, rawCheckIns, userHabits);

  if (window.lucide) {
    lucide.createIcons();
  }
}

/**
 * Renders weekday header column row: Mon Tue Wed Thu Fri Sat Sun
 */
function renderWeekdayHeaders() {
  const container = document.getElementById('weekdayHeaderRow');
  if (!container) return;

  container.innerHTML = '';
  WEEKDAY_NAMES.forEach(dayName => {
    const cell = document.createElement('div');
    cell.className = 'weekday-header-cell';
    cell.textContent = dayName;
    container.appendChild(cell);
  });
}

/**
 * Formats a given year, month (0-indexed), and day into YYYY-MM-DD
 */
function formatDateKey(year, month, day) {
  const y = String(year);
  const m = String(month + 1).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Searches the user's check-ins array for a matching date string
 */
function getCheckInForDate(dateStr, checkIns, userHabits) {
  const raw = checkIns.find(c => c.date === dateStr);
  if (!raw) return null;
  return typeof normalizeCheckIn === 'function' ? normalizeCheckIn(raw, userHabits) : raw;
}

/**
 * Maps check-in classification to CSS class
 */
function getClassificationClass(classification) {
  if (!classification) return 'no-checkin';
  const upper = classification.toUpperCase();
  if (upper === 'FULL') return 'full';
  if (upper === 'PARTIAL') return 'partial';
  if (upper === 'LOW') return 'low';
  if (upper === 'MISSED') return 'missed';
  return 'no-checkin';
}

/**
 * Dynamically builds the day squares for the selected month
 */
function renderMonthGrid(year, month, rawCheckIns, userHabits) {
  const grid = document.getElementById('calendarDaysGrid');
  if (!grid) return;

  grid.innerHTML = '';

  const todayDateStr = typeof getTodayDate === 'function' ? getTodayDate() : new Date().toISOString().slice(0, 10);

  // Calculate month boundaries
  const daysInCurrentMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0=Sun, 1=Mon, ..., 6=Sat

  // Monday-first offset calculation (0 = Monday, 6 = Sunday)
  const startOffset = (firstDayOfWeek + 6) % 7;

  // 1. Render Padding Cells from Previous Month
  for (let p = startOffset - 1; p >= 0; p--) {
    const dayNum = daysInPrevMonth - p;
    const padCell = document.createElement('div');
    padCell.className = 'cal-day-cell padding-cell';
    padCell.innerHTML = `<span class="cal-day-number">${dayNum}</span>`;
    grid.appendChild(padCell);
  }

  // 2. Render Real Calendar Days for Current Month
  for (let d = 1; d <= daysInCurrentMonth; d++) {
    const dateStr = formatDateKey(year, month, d);
    const checkIn = getCheckInForDate(dateStr, rawCheckIns, userHabits);
    const classification = checkIn ? (checkIn.classification || checkIn.status) : null;
    const colorClass = getClassificationClass(classification);

    const cell = document.createElement('div');
    cell.className = `cal-day-cell ${colorClass}`;
    cell.setAttribute('data-date', dateStr);
    cell.setAttribute('tabindex', '0');
    cell.setAttribute('role', 'button');
    cell.setAttribute('aria-label', `View details for ${MONTH_NAMES[month]} ${d}, ${year}`);

    // Highlight today's date
    if (dateStr === todayDateStr) {
      cell.classList.add('is-today');
    }

    // Day content
    let tagText = '';
    if (classification === 'FULL') tagText = '100%';
    else if (classification === 'PARTIAL') tagText = `${Math.round((checkIn.dailyScore || 0.75) * 100)}%`;
    else if (classification === 'LOW') tagText = `${Math.round((checkIn.dailyScore || 0.25) * 100)}%`;
    else if (classification === 'MISSED') tagText = '0%';

    cell.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: flex-start; width: 100%;">
        <span class="cal-day-number">${d}</span>
      </div>
      <span class="cal-day-pill-tag">${tagText}</span>
    `;

    // 1. Hover/Focus Quick Tooltip Interaction
    setupCellTooltip(cell, dateStr, checkIn, d, month, year);

    // 2. Click Interaction -> Complete Day Details Modal
    cell.addEventListener('click', () => {
      openDayDetailsModal(dateStr, checkIn, d, month, year, userHabits);
    });

    cell.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openDayDetailsModal(dateStr, checkIn, d, month, year, userHabits);
      }
    });

    grid.appendChild(cell);
  }

  // 3. Render Trailing Padding Cells from Next Month to complete row (grid multiple of 7)
  const totalRendered = startOffset + daysInCurrentMonth;
  const remainingCells = (7 - (totalRendered % 7)) % 7;
  for (let n = 1; n <= remainingCells; n++) {
    const nextPadCell = document.createElement('div');
    nextPadCell.className = 'cal-day-cell padding-cell';
    nextPadCell.innerHTML = `<span class="cal-day-number">${n}</span>`;
    grid.appendChild(nextPadCell);
  }
}

/**
 * Floating Tooltip Interaction Engine (Preserved quick hover glance)
 */
function setupCellTooltip(cell, dateStr, checkIn, day, month, year) {
  const tooltip = document.getElementById('calFloatingTooltip');
  if (!tooltip) return;

  const readableDate = `${MONTH_NAMES[month]} ${day}, ${year}`;

  const showTooltip = (e) => {
    let statusDisplay = 'No check-in recorded';
    let adherenceDisplay = '--';
    let statusClass = 'color: var(--text-muted);';

    if (checkIn) {
      const cls = checkIn.classification || checkIn.status;
      const scorePct = Math.round((checkIn.dailyScore || 0) * 100);
      adherenceDisplay = `${scorePct}%`;

      if (cls === 'FULL') {
        statusDisplay = 'Full Adherence';
        statusClass = 'color: #34D399;';
      } else if (cls === 'PARTIAL') {
        statusDisplay = 'Partial Adherence';
        statusClass = 'color: #2DD4BF;';
      } else if (cls === 'LOW') {
        statusDisplay = 'Low Adherence';
        statusClass = 'color: #FBBF24;';
      } else if (cls === 'MISSED') {
        statusDisplay = 'Missed Routine';
        statusClass = 'color: #FB7185;';
      }
    }

    tooltip.innerHTML = `
      <div class="tooltip-date">${readableDate}</div>
      <div class="tooltip-row">
        <span>Adherence:</span>
        <strong style="color: var(--text-main);">${adherenceDisplay}</strong>
      </div>
      <div class="tooltip-row">
        <span>Status:</span>
        <strong style="${statusClass}">${statusDisplay}</strong>
      </div>
    `;

    // Position tooltip near cell
    const rect = cell.getBoundingClientRect();
    const tooltipWidth = 170;
    let left = rect.left + (rect.width / 2) - (tooltipWidth / 2);
    let top = rect.top - 65;

    // Prevent horizontal overflow
    if (left < 10) left = 10;
    if (left + tooltipWidth > window.innerWidth - 10) left = window.innerWidth - tooltipWidth - 10;
    if (top < 10) top = rect.bottom + 8;

    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;
    tooltip.classList.add('visible');
  };

  const hideTooltip = () => {
    tooltip.classList.remove('visible');
  };

  cell.addEventListener('mouseenter', showTooltip);
  cell.addEventListener('mouseleave', hideTooltip);
  cell.addEventListener('focus', showTooltip);
  cell.addEventListener('blur', hideTooltip);
}

// =========================================================================
// 3. COMPLETE DAY DETAILS MODAL ENGINE (Opens on Click)
// =========================================================================

function openDayDetailsModal(dateStr, checkIn, day, month, year, userHabits = []) {
  const modal = document.getElementById('modalDayDetails');
  const titleElem = document.getElementById('dayDetailsDateTitle');
  const contentElem = document.getElementById('dayDetailsContent');
  if (!modal || !contentElem) return;

  const currentUser = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
  const readableDate = `${MONTH_NAMES[month]} ${day}, ${year}`;
  if (titleElem) titleElem.textContent = readableDate;

  // Retrieve any authentic health readings and mood recorded on this specific date
  const allHealthRecords = typeof getUserHealthRecords === 'function' ? getUserHealthRecords(currentUser) : [];
  const dateHealthRecords = allHealthRecords.filter(r => r.date === dateStr);

  const allMoodRecords = typeof getUserMoodRecords === 'function' ? getUserMoodRecords(currentUser) : [];
  const dateMoodRecord = allMoodRecords.find(m => m.date === dateStr);

  // 1. IF CHECK-IN EXISTS FOR THIS DATE
  if (checkIn) {
    const classification = checkIn.classification || checkIn.status || 'FULL';
    const adherencePct = Math.round((checkIn.dailyScore !== undefined ? checkIn.dailyScore : 1) * 100);
    const habitsData = checkIn.habits || {};

    // Badge styling
    let badgeClass = 'stable';
    let statusLabel = 'Full Adherence';
    if (classification === 'PARTIAL') {
      badgeClass = 'warning';
      statusLabel = 'Partial Adherence';
    } else if (classification === 'LOW') {
      badgeClass = 'warning';
      statusLabel = 'Low Adherence';
    } else if (classification === 'MISSED') {
      badgeClass = 'recovery';
      statusLabel = 'Missed Routine';
    }

    // Habit breakdown HTML
    const habitKeys = Object.keys(habitsData).length > 0 ? Object.keys(habitsData) : userHabits;
    let habitsListHtml = '';

    if (habitKeys.length === 0) {
      habitsListHtml = `<div class="day-notes-empty">No habit details recorded.</div>`;
    } else {
      habitKeys.forEach(hId => {
        const meta = window.HABIT_CATALOG ? window.HABIT_CATALOG.find(h => h.id === hId) : null;
        const habitName = meta ? meta.name : (hId.charAt(0).toUpperCase() + hId.slice(1).replace('_', ' '));
        const habitIcon = meta ? meta.icon : '📌';
        const rawVal = habitsData[hId];

        let pctDisplay = 'Not recorded';
        let badgeStyleClass = '';

        if (rawVal !== undefined && rawVal !== null) {
          const numericPct = Math.round(Number(rawVal) * 100);
          pctDisplay = `${numericPct}%`;
          if (numericPct === 100) badgeStyleClass = 'full';
          else if (numericPct >= 50) badgeStyleClass = 'partial';
          else if (numericPct > 0) badgeStyleClass = 'low';
          else badgeStyleClass = 'missed';
        }

        habitsListHtml += `
          <div class="day-habit-row">
            <div class="day-habit-info">
              <span>${habitIcon}</span>
              <span>${habitName}</span>
            </div>
            <span class="day-habit-pct-badge ${badgeStyleClass}">${pctDisplay}</span>
          </div>
        `;
      });
    }

    // Health Biomarkers HTML (only if authentic records exist for dateStr)
    let healthSectionHtml = '';
    if (dateHealthRecords.length > 0) {
      let chipsHtml = '';
      dateHealthRecords.forEach(h => {
        const def = window.BIOMARKER_DEFINITIONS ? window.BIOMARKER_DEFINITIONS[h.type] : null;
        const name = def ? def.name : h.type;
        const icon = def ? def.icon : '🩺';
        chipsHtml += `
          <div class="day-chip-pill">
            <span class="day-chip-label">${icon} ${name}</span>
            <span class="day-chip-value">${h.value} ${h.unit || ''}</span>
          </div>
        `;
      });
      healthSectionHtml = `
        <div class="day-section-card">
          <div class="day-section-header">
            <i data-lucide="activity" style="width: 14px; height: 14px; color: var(--primary-teal);"></i>
            <span>Health Biomarkers</span>
          </div>
          <div class="day-chips-grid">${chipsHtml}</div>
        </div>
      `;
    }

    // Mood HTML (only if recorded for dateStr)
    let moodSectionHtml = '';
    if (dateMoodRecord) {
      const moodVal = dateMoodRecord.mood || dateMoodRecord.score || 'Recorded';
      moodSectionHtml = `
        <div class="day-section-card">
          <div class="day-section-header">
            <i data-lucide="smile" style="width: 14px; height: 14px; color: var(--primary-teal);"></i>
            <span>Wellness & Mood</span>
          </div>
          <div class="day-chips-grid">
            <div class="day-chip-pill">
              <span class="day-chip-label">Daily Mood</span>
              <span class="day-chip-value">${moodVal}</span>
            </div>
          </div>
        </div>
      `;
    }

    contentElem.innerHTML = `
      <div class="day-details-container">
        <!-- 1. Overall Summary Banner -->
        <div class="day-summary-banner">
          <div>
            <div class="day-adherence-num">${adherencePct}%</div>
            <div class="day-adherence-label">Overall Adherence</div>
          </div>
          <div style="text-align: right;">
            <span class="status-badge ${badgeClass}">${statusLabel}</span>
          </div>
        </div>

        <!-- 2. Habit Adherence Breakdown -->
        <div class="day-section-card">
          <div class="day-section-header">
            <i data-lucide="check-square" style="width: 14px; height: 14px; color: var(--primary-teal);"></i>
            <span>Habit Adherence Breakdown</span>
          </div>
          <div class="day-habits-list">
            ${habitsListHtml}
          </div>
        </div>

        <!-- 3. Notes Section -->
        <div class="day-section-card">
          <div class="day-section-header">
            <i data-lucide="file-text" style="width: 14px; height: 14px; color: var(--primary-teal);"></i>
            <span>Daily Notes & Reflections</span>
          </div>
          ${checkIn.notes && checkIn.notes.trim() ? `
            <div class="day-notes-box">"${checkIn.notes.trim()}"</div>
          ` : `
            <div class="day-notes-empty">No notes added for this day.</div>
          `}
        </div>

        <!-- 4. Health Section (Conditional) -->
        ${healthSectionHtml}

        <!-- 5. Mood Section (Conditional) -->
        ${moodSectionHtml}
      </div>
    `;
  } else {
    // 2. IF NO CHECK-IN EXISTS FOR THIS DATE
    let optionalHealthHtml = '';
    if (dateHealthRecords.length > 0) {
      let chipsHtml = '';
      dateHealthRecords.forEach(h => {
        const def = window.BIOMARKER_DEFINITIONS ? window.BIOMARKER_DEFINITIONS[h.type] : null;
        const name = def ? def.name : h.type;
        chipsHtml += `
          <div class="day-chip-pill">
            <span class="day-chip-label">${name}</span>
            <span class="day-chip-value">${h.value} ${h.unit || ''}</span>
          </div>
        `;
      });
      optionalHealthHtml = `
        <div class="day-section-card" style="margin-top: 12px; width: 100%;">
          <div class="day-section-header">
            <i data-lucide="activity" style="width: 14px; height: 14px; color: var(--primary-teal);"></i>
            <span>Recorded Biomarkers</span>
          </div>
          <div class="day-chips-grid">${chipsHtml}</div>
        </div>
      `;
    }

    contentElem.innerHTML = `
      <div class="day-details-container">
        <div class="day-summary-banner">
          <div>
            <div class="day-adherence-num">--</div>
            <div class="day-adherence-label">No Adherence Data</div>
          </div>
          <div style="text-align: right;">
            <span class="status-badge initial">No Check-in</span>
          </div>
        </div>

        <div class="day-empty-box">
          <div class="day-empty-icon">🌱</div>
          <div class="day-empty-title">No Check-in Recorded</div>
          <div class="day-empty-desc">No habit check-in was logged for ${readableDate}. Log your habits on the dashboard to build your daily adherence history.</div>
        </div>

        ${optionalHealthHtml}
      </div>
    `;
  }

  // Open modal
  modal.classList.add('active');
  if (window.lucide) {
    lucide.createIcons();
  }
}

function closeDayDetailsModal() {
  const modal = document.getElementById('modalDayDetails');
  if (modal) {
    modal.classList.remove('active');
  }
}

/**
 * Calculates and renders real monthly summary metrics
 */
function renderMonthlySummary(year, month, rawCheckIns, userHabits) {
  const monthPrefix = `${year}-${String(month + 1).padStart(2, '0')}`;
  const monthRecords = rawCheckIns
    .filter(c => c.date && c.date.startsWith(monthPrefix))
    .map(c => typeof normalizeCheckIn === 'function' ? normalizeCheckIn(c, userHabits) : c);

  let fullCount = 0;
  let partialCount = 0;
  let lowCount = 0;
  let missedCount = 0;
  let scoreSum = 0;

  monthRecords.forEach(r => {
    const cls = r.classification || r.status;
    if (cls === 'FULL') fullCount++;
    else if (cls === 'PARTIAL') partialCount++;
    else if (cls === 'LOW') lowCount++;
    else if (cls === 'MISSED') missedCount++;
    scoreSum += (Number(r.dailyScore) || 0);
  });

  const totalCheckIns = monthRecords.length;
  const avgMonthlyAdherence = totalCheckIns > 0 ? Math.round((scoreSum / totalCheckIns) * 100) : 0;

  // Update Summary DOM elements
  const totalElem = document.getElementById('summaryTotalCheckins');
  const fullElem = document.getElementById('summaryFullDays');
  const partialElem = document.getElementById('summaryPartialDays');
  const lowElem = document.getElementById('summaryLowDays');
  const missedElem = document.getElementById('summaryMissedDays');
  const msgElem = document.getElementById('summarySupportiveMsg');

  if (totalElem) totalElem.textContent = `${totalCheckIns}`;
  if (fullElem) fullElem.textContent = `${fullCount}`;
  if (partialElem) partialElem.textContent = `${partialCount}`;
  if (lowElem) lowElem.textContent = `${lowCount}`;
  if (missedElem) missedElem.textContent = `${missedCount}`;

  // Supportive non-judgmental insight message
  if (msgElem) {
    if (totalCheckIns === 0) {
      msgElem.innerHTML = `<span>🌱</span> <span>No check-ins logged for ${MONTH_NAMES[month]} ${year} yet. Log your daily routines to see your monthly heatmap come to life!</span>`;
    } else if (fullCount + partialCount >= 15) {
      msgElem.innerHTML = `<span>🔥</span> <span>Exceptional consistency! You have completed ${fullCount + partialCount} successful check-in days this month.</span>`;
    } else if (fullCount + partialCount >= 5) {
      msgElem.innerHTML = `<span>✨</span> <span>Great adherence momentum! You are building healthy chronic care habits.</span>`;
    } else {
      msgElem.innerHTML = `<span>📈</span> <span>You have logged ${totalCheckIns} check-in${totalCheckIns === 1 ? '' : 's'} this month with an average adherence of ${avgMonthlyAdherence}%. Every day is an opportunity to stay on track.</span>`;
    }
  }
}

// Export for testing
if (typeof window !== 'undefined') {
  window.initCalendar = initCalendar;
  window.renderCalendar = renderCalendar;
  window.renderMonthGrid = renderMonthGrid;
  window.getCheckInForDate = getCheckInForDate;
  window.getClassificationClass = getClassificationClass;
  window.openDayDetailsModal = openDayDetailsModal;
  window.closeDayDetailsModal = closeDayDetailsModal;
}
