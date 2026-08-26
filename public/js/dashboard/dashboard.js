/**
 * dashboard.js (dashboard module)
 * Main Dashboard Coordinator for ChronicOne.
 * Page: public/dashboard.html
 * 
 * Orchestrates submodules:
 *   - common/storage.js
 *   - common/utils.js
 *   - common/auth-guard.js
 *   - checkin/checkin.js
 *   - streak/streak.js
 *   - health/health.js
 *   - wellness/wellness.js
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

  // 4. Initialize Submodules Event Listeners
  if (typeof initCheckinModal === 'function') initCheckinModal();
  if (typeof initHealthModule === 'function') initHealthModule();

  // 5. Hero & Navigation Check-in Trigger Buttons
  const btnHeroCheckin = document.getElementById('btnHeroCheckin');
  const navCheckinBtn = document.getElementById('navCheckinBtn');
  if (btnHeroCheckin) btnHeroCheckin.addEventListener('click', () => {
    if (typeof openCheckInModal === 'function') openCheckInModal();
  });
  if (navCheckinBtn) navCheckinBtn.addEventListener('click', () => {
    if (typeof openCheckInModal === 'function') openCheckInModal();
  });

  // 6. Sidebar Navigation & Feature Modals
  initNavigationHandlers(currentUser);

  // 7. Initial Dashboard Render
  refreshDashboard();
});

// =========================================================================
// 1. THEME SWITCHER
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

// =========================================================================
// 2. RENDER USER PROFILE, GREETING & DAY 1
// =========================================================================
function renderUserProfileAndGreeting() {
  const currentUser = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
  if (!currentUser) return;

  const now = new Date();
  const hour = now.getHours();
  let greeting = 'Good day';

  if (hour >= 5 && hour < 12) greeting = 'Good morning';
  else if (hour >= 12 && hour < 17) greeting = 'Good afternoon';
  else if (hour >= 17 && hour < 22) greeting = 'Good evening';
  else greeting = 'Good night';

  const firstName = currentUser.name ? currentUser.name.split(' ')[0] : 'Friend';
  const greetingElem = document.getElementById('userGreetingTitle');
  if (greetingElem) greetingElem.textContent = `${greeting}, ${firstName} 👋`;

  const history = typeof getUserCheckIns === 'function' ? getUserCheckIns(currentUser) : [];
  const todayCheckIn = typeof getTodayCheckIn === 'function' ? getTodayCheckIn(currentUser) : null;
  const greetingSubtext = document.querySelector('.greeting-subtext');

  if (greetingSubtext) {
    if (history.length === 0) {
      greetingSubtext.textContent = "✨ Welcome! Today is Day 1 of your health journey. Complete your check-in below to start your streak!";
    } else if (history.length === 1 && todayCheckIn) {
      greetingSubtext.textContent = "🔥 Day 1 Check-in Complete! ";
    } else {
      greetingSubtext.textContent = "Here is your chronic condition adherence and resilience summary for today.";
    }
  }

  // Formatted date pill
  const liveDateElem = document.getElementById('liveFormattedDate');
  if (liveDateElem) {
    const options = { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' };
    liveDateElem.textContent = now.toLocaleDateString('en-US', options);
  }

  // Sidebar user pill
  const sidebarName = document.getElementById('sidebarUserName');
  const sidebarEmail = document.getElementById('sidebarUserEmail');
  const sidebarAvatar = document.getElementById('sidebarAvatar');
  if (sidebarName) sidebarName.textContent = currentUser.name;
  if (sidebarEmail) sidebarEmail.textContent = currentUser.email;
  if (sidebarAvatar) sidebarAvatar.textContent = typeof getUserInitials === 'function' ? getUserInitials(currentUser.name) : 'US';

  // Render Managed Conditions Badges
  const tagRow = document.getElementById('userConditionsTagRow');
  if (tagRow) {
    tagRow.innerHTML = '';

    // Day counter pill
    const dayPill = document.createElement('span');
    dayPill.className = 'condition-pill';
    if (history.length === 0) {
      dayPill.style.background = 'rgba(99, 102, 241, 0.2)';
      dayPill.style.color = '#818CF8';
      dayPill.style.borderColor = 'rgba(99, 102, 241, 0.4)';
      dayPill.innerHTML = '<span>🌟</span> <span>Day 1</span>';
    } else {
      const dayNum = history.length + (todayCheckIn ? 0 : 1);
      dayPill.style.background = 'rgba(16, 185, 129, 0.15)';
      dayPill.style.color = '#10B981';
      dayPill.style.borderColor = 'rgba(16, 185, 129, 0.3)';
      dayPill.innerHTML = `<span>🗓️</span> <span>Day ${dayNum}</span>`;
    }
    tagRow.appendChild(dayPill);

    if (currentUser.conditions && currentUser.conditions.length > 0) {
      currentUser.conditions.forEach(condKey => {
        const pill = document.createElement('span');
        pill.className = 'condition-pill';

        if (condKey.startsWith('custom:')) {
          pill.innerHTML = `<span>✨</span> <span>${condKey.replace('custom:', '')}</span>`;
        } else if (condKey === 'prefer_not_to_say') {
          pill.innerHTML = `<span>🔒</span> <span>General Wellness</span>`;
        } else {
          const config = window.CONDITIONS_CONFIG ? window.CONDITIONS_CONFIG[condKey] : null;
          pill.innerHTML = `<span>${config ? config.icon : '🩺'}</span> <span>${config ? config.name : condKey}</span>`;
        }
        tagRow.appendChild(pill);
      });
    } else {
      const defaultPill = document.createElement('span');
      defaultPill.className = 'condition-pill';
      defaultPill.innerHTML = '<span>🌱</span> <span>General Wellness</span>';
      tagRow.appendChild(defaultPill);
    }
  }
}

// =========================================================================
// 3. RENDER STREAK STAT CARDS (Connected to streak.js)
// =========================================================================
function renderStreakMetrics() {
  const currentUser = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
  if (!currentUser) return;

  const stats = typeof calculateStreak === 'function' ? calculateStreak(currentUser) : { currentStreak: 0, bestStreak: 0, graceDaysUsed: 0, graceDaysRemaining: 2, status: 'INITIAL', statusLabel: '🌱 Not started' };
  const rawTodayCheckIn = typeof getTodayCheckIn === 'function' ? getTodayCheckIn(currentUser) : null;
  const userHabits = typeof getEffectiveUserHabits === 'function' ? getEffectiveUserHabits(currentUser) : (currentUser.habits || []);
  const todayCheckIn = typeof normalizeCheckIn === 'function' ? normalizeCheckIn(rawTodayCheckIn, userHabits) : rawTodayCheckIn;
  const history = typeof getUserCheckIns === 'function' ? getUserCheckIns(currentUser) : [];

  const currStreakElem = document.getElementById('statCurrentStreak');
  const bestStreakElem = document.getElementById('statBestStreak');
  const graceDaysElem = document.getElementById('statGraceDays');
  if (currStreakElem) currStreakElem.textContent = `${stats.currentStreak} day${stats.currentStreak === 1 ? '' : 's'}`;
  if (bestStreakElem) bestStreakElem.textContent = `${stats.bestStreak} day${stats.bestStreak === 1 ? '' : 's'}`;
  if (graceDaysElem) {
    if (stats.recoveryBonusAvailable) {
      graceDaysElem.textContent = `${stats.graceDaysUsed} / 2 (+1 Bonus)`;
    } else {
      graceDaysElem.textContent = `${stats.graceDaysUsed} / 2 used`;
    }
  }

  const badgeElem = document.getElementById('statStreakBadge');
  if (badgeElem) {
    const isSuccessDay1 = todayCheckIn && (todayCheckIn.classification === 'FULL' || todayCheckIn.classification === 'PARTIAL');
    if (history.length === 0) {
      badgeElem.textContent = '🌱 Day 1 (Pending Check-in)';
      badgeElem.className = 'status-badge initial';
    } else if (history.length === 1 && isSuccessDay1) {
      badgeElem.textContent = '🔥 Day 1 Complete!';
      badgeElem.className = 'status-badge stable';
    } else {
      badgeElem.textContent = stats.statusLabel;
      badgeElem.className = `status-badge ${stats.status ? stats.status.toLowerCase() : 'initial'}`;
    }
  }

  // Grace subtext
  const graceSubtext = document.getElementById('statGraceSubtext');
  if (graceSubtext) {
    if (stats.recoveryBonusAvailable) {
      graceSubtext.innerHTML = `<span style="color: #10B981;">🎉 Recovery Achieved • 🛡️ +1 Bonus Ready</span>`;
    } else if (stats.recoveryActive) {
      graceSubtext.innerHTML = `<span style="color: #F59E0B;">🔄 Recovery in Progress (${stats.recoveryDays} / 3)</span>`;
    } else if (stats.relapse) {
      graceSubtext.innerHTML = `<span style="color: #EF4444;">⚠️ Relapse detected • Grace exhausted</span>`;
    } else if (stats.graceUsedToday) {
      graceSubtext.innerHTML = `<span style="color: #F59E0B;">🛡️ Grace day used to protect streak</span>`;
    } else {
      graceSubtext.innerHTML = `<span>${stats.graceDaysRemaining} rest allowance${stats.graceDaysRemaining === 1 ? '' : 's'} left</span>`;
    }
  }

  // Today's Adherence rate calculated from dailyScore
  const totalHabits = userHabits.length;
  const adherencePercent = todayCheckIn ? Math.round(todayCheckIn.dailyScore * 100) : 0;
  const adherenceElem = document.getElementById('statTodayAdherence');
  const adherenceSubtext = document.getElementById('statAdherenceSubtext');

  if (adherenceElem) adherenceElem.textContent = `${adherencePercent}%`;

  if (adherenceSubtext) {
    if (todayCheckIn) {
      adherenceSubtext.textContent = `Classification: ${todayCheckIn.classification}`;
    } else if (history.length === 0) {
      adherenceSubtext.textContent = `Day 1 • Not logged yet`;
    } else {
      adherenceSubtext.textContent = `0 of ${totalHabits} habit${totalHabits === 1 ? '' : 's'} logged`;
    }
  }

  // Update CTA Hero Button
  const heroBtn = document.getElementById('btnHeroCheckin');
  const heroBtnText = document.getElementById('heroCheckinBtnText');
  const navBadge = document.getElementById('navCheckinBadge');

  if (heroBtn && heroBtnText && navBadge) {
    if (todayCheckIn) {
      heroBtn.classList.add('completed');
      heroBtnText.textContent = `✓ Today's Check-in (${adherencePercent}%)`;
      navBadge.textContent = 'Done';
      navBadge.style.background = 'rgba(16, 185, 129, 0.2)';
      navBadge.style.color = '#10B981';
    } else {
      heroBtn.classList.remove('completed');
      heroBtnText.textContent = history.length === 0 ? 'Complete Day 1 Check-in' : 'Complete Today\'s Check-in';
      navBadge.textContent = 'Pending';
      navBadge.style.background = '';
      navBadge.style.color = '';
    }
  }
}

// =========================================================================
// 4. RENDER TODAY'S HABIT PROGRESS (Progress Bars & Log % / Edit %)
// =========================================================================
function renderTodayHabitsList() {
  const container = document.getElementById('todayHabitsListContainer');
  if (!container) return;

  container.innerHTML = '';
  const currentUser = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
  if (!currentUser) return;

  const userHabits = typeof getEffectiveUserHabits === 'function' ? getEffectiveUserHabits(currentUser) : (currentUser.habits || []);
  const rawTodayCheckIn = typeof getTodayCheckIn === 'function' ? getTodayCheckIn(currentUser) : null;
  const todayCheckIn = typeof normalizeCheckIn === 'function' ? normalizeCheckIn(rawTodayCheckIn, userHabits) : rawTodayCheckIn;
  const habitsMap = todayCheckIn ? (todayCheckIn.habits || {}) : {};

  if (userHabits.length === 0) {
    container.innerHTML = `
      <div class="empty-state-card">
        <div class="empty-state-icon">📋</div>
        <p>No active habits selected yet.</p>
      </div>
    `;
    return;
  }

  userHabits.forEach(habitId => {
    const habitMeta = window.HABIT_CATALOG ? window.HABIT_CATALOG.find(h => h.id === habitId) : null;
    const isLoggedToday = todayCheckIn && habitsMap[habitId] !== undefined;
    const completionVal = isLoggedToday ? habitsMap[habitId] : 0;
    const percent = Math.round(completionVal * 100);

    const item = document.createElement('div');
    item.className = 'habit-progress-item';
    item.style.cursor = 'pointer';

    item.innerHTML = `
      <div class="habit-item-left">
        <span class="habit-item-icon">${habitMeta ? habitMeta.icon : '📌'}</span>
        <div class="habit-item-info">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span class="habit-item-name">${habitMeta ? habitMeta.name : habitId}</span>
            <span style="font-size: 0.76rem; font-weight: 700; color: ${percent > 0 ? 'var(--primary-teal)' : 'var(--text-subtle)'};">${percent}%</span>
          </div>
          <div class="habit-item-progress-bar-wrap">
            <div class="habit-item-progress-bar-fill" style="width: ${percent}%;"></div>
          </div>
        </div>
      </div>
      <button class="btn-add-reading btn-edit-single-habit" data-habit="${habitId}" style="padding: 3px 8px; font-size: 0.7rem; margin-left: 8px;" title="${isLoggedToday ? 'Edit habit percentage' : 'Log habit percentage'}">
        ${isLoggedToday ? 'Edit %' : 'Log %'}
      </button>
    `;

    // Clicking habit row opens modal focused on this habit
    item.addEventListener('click', () => {
      if (typeof openCheckInModal === 'function') openCheckInModal(habitId);
    });

    const editBtn = item.querySelector('.btn-edit-single-habit');
    if (editBtn) {
      editBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (typeof openCheckInModal === 'function') openCheckInModal(habitId);
      });
    }

    container.appendChild(item);
  });
}

// =========================================================================
// 5. BEHAVIORAL INSIGHT ENGINE
// =========================================================================
function renderBehavioralInsight() {
  const currentUser = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
  const history = typeof getUserCheckIns === 'function' ? getUserCheckIns(currentUser) : [];
  const streakStats = typeof calculateStreak === 'function' ? calculateStreak(currentUser) : { currentStreak: 0, bestStreak: 0, graceDaysUsed: 0 };
  const heading = document.getElementById('insightHeading');
  const body = document.getElementById('insightBody');

  if (!heading || !body) return;

  if (history.length === 0) {
    heading.textContent = '🌱 Day 1: Welcome to ChronicOne!';
    body.textContent = 'Today is Day 1 of your health journey. Select your completion levels for today\'s habits to establish your baseline streak.';
  } else if (streakStats.recoveryComplete && streakStats.recoveryBonusAvailable) {
    heading.textContent = '🎉 Recovery Achieved!';
    body.textContent = 'Congratulations! You completed 3 consecutive recovery check-ins and earned a +1 Recovery Bonus grace day.';
  } else if (streakStats.recoveryActive) {
    heading.textContent = `🔄 Recovery in Progress (${streakStats.recoveryDays}/3)`;
    body.textContent = `You're getting back on track! Complete ${3 - streakStats.recoveryDays} more consecutive successful check-in${(3 - streakStats.recoveryDays) === 1 ? '' : 's'} to achieve recovery and unlock your +1 Recovery Bonus.`;
  } else if (streakStats.relapse) {
    heading.textContent = '⚠️ Relapse Detected';
    body.textContent = 'Your recent adherence streak was interrupted. Complete 3 consecutive successful check-ins to rebuild your routine and earn a recovery bonus.';
  } else if (streakStats.currentStreak >= 7) {
    heading.textContent = '🔥 Outstanding Consistency';
    body.textContent = `Exceptional adherence! You have sustained your health habits for ${streakStats.currentStreak} consecutive days.`;
  } else if (streakStats.graceDaysUsed > 0) {
    heading.textContent = '🛡️ Grace Day Utilized';
    body.textContent = 'You recently took a planned rest day. Your streak remains protected and ready for today\'s routines.';
  } else {
    heading.textContent = '📈 Positive Daily Rhythm';
    body.textContent = `You have completed ${history.length} check-in log${history.length === 1 ? '' : 's'}. Staying consistent with your chronic care routines builds long-term vitality.`;
  }
}

// =========================================================================
// 6. MINI 7-DAY CALENDAR & RECENT ACTIVITY FEED
// =========================================================================
function renderMiniCalendar() {
  const container = document.getElementById('miniCalendarPreviewRow');
  if (!container) return;

  container.innerHTML = '';
  const currentUser = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
  const userHabits = typeof getEffectiveUserHabits === 'function' ? getEffectiveUserHabits(currentUser) : (currentUser ? currentUser.habits : []);
  const rawHistory = typeof getUserCheckIns === 'function' ? getUserCheckIns(currentUser) : [];
  const todayDateStr = typeof getTodayDate === 'function' ? getTodayDate() : new Date().toISOString().slice(0, 10);
  const today = new Date();

  // Generate exact past 7 calendar days ending today [today-6 ... today]
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(today.getDate() - i);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const dayName = d.toLocaleDateString('en-US', { weekday: 'narrow' });
    const dayNum = d.getDate();
    const isToday = (dateStr === todayDateStr);
    const readableDate = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

    // Look up check-in record for this calendar date
    const rawCheckIn = rawHistory.find(c => c.date === dateStr);
    const checkIn = rawCheckIn && typeof normalizeCheckIn === 'function' ? normalizeCheckIn(rawCheckIn, userHabits) : rawCheckIn;

    let colorClass = 'no-checkin';
    let pctText = '—';
    let statusLabel = 'No check-in recorded';

    if (checkIn) {
      const cls = (checkIn.classification || checkIn.status || '').toUpperCase();
      const numericScore = checkIn.dailyScore !== undefined ? Math.round(Number(checkIn.dailyScore) * 100) : null;

      if (cls === 'FULL') {
        colorClass = 'full';
        pctText = '100%';
        statusLabel = '100% — Full Adherence';
      } else if (cls === 'PARTIAL') {
        colorClass = 'partial';
        pctText = numericScore !== null ? `${numericScore}%` : 'Partial';
        statusLabel = `${pctText} — Partial Adherence`;
      } else if (cls === 'LOW') {
        colorClass = 'low';
        pctText = numericScore !== null ? `${numericScore}%` : 'Low';
        statusLabel = `${pctText} — Low Adherence`;
      } else if (cls === 'MISSED') {
        colorClass = 'missed';
        pctText = '0%';
        statusLabel = '0% — Missed Routine';
      }
    }

    const tooltipText = isToday 
      ? `${readableDate} (Today): ${statusLabel}`
      : `${readableDate}: ${statusLabel}`;

    const cell = document.createElement('div');
    cell.className = `mini-day-cell ${colorClass} ${isToday ? 'is-today' : ''}`;
    cell.setAttribute('title', tooltipText);
    cell.setAttribute('tabindex', '0');
    cell.setAttribute('aria-label', tooltipText);

    cell.innerHTML = `
      <span class="mini-day-name">${dayName}</span>
      <span class="mini-day-date">${dayNum}</span>
      <span class="mini-day-dot ${colorClass}"></span>
      <span class="mini-day-score ${colorClass}">${pctText}</span>
    `;

    container.appendChild(cell);
  }
}

function renderRecentActivity() {
  const container = document.getElementById('recentActivityFeedContainer');
  if (!container) return;

  container.innerHTML = '';
  const currentUser = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
  const userHabits = typeof getEffectiveUserHabits === 'function' ? getEffectiveUserHabits(currentUser) : (currentUser ? currentUser.habits : []);
  const rawHistory = typeof getUserCheckIns === 'function' ? getUserCheckIns(currentUser) : [];
  const history = rawHistory.slice(-3).reverse();
  const todayDate = typeof getTodayDate === 'function' ? getTodayDate() : new Date().toISOString().slice(0, 10);

  if (history.length === 0) {
    container.innerHTML = '<div style="font-size: 0.78rem; color: var(--text-muted);">No activity recorded yet. Check in today!</div>';
    return;
  }

  history.forEach(rawEntry => {
    const entry = typeof normalizeCheckIn === 'function' ? normalizeCheckIn(rawEntry, userHabits) : rawEntry;
    const isToday = entry.date === todayDate;
    const dateLabel = isToday ? 'Today' : entry.date;
    const scorePct = Math.round((entry.dailyScore || 0) * 100);

    const div = document.createElement('div');
    div.className = 'recent-activity-item';
    div.innerHTML = `
      <div class="activity-icon-badge ${entry.classification ? entry.classification.toLowerCase() : 'initial'}">
        <i data-lucide="${entry.classification === 'FULL' ? 'check-circle' : 'activity'}"></i>
      </div>
      <div class="activity-text-info">
        <span class="activity-primary-text">Daily Check-in • ${scorePct}%</span>
        <span class="activity-time-text">${dateLabel} • ${entry.classification || 'LOGGED'}</span>
      </div>
    `;
    container.appendChild(div);
  });
}

// =========================================================================
// 7. ACHIEVEMENTS PREVIEW
// =========================================================================
function renderAchievements() {
  const container = document.getElementById('achievementsPreviewContainer');
  if (!container) return;

  container.innerHTML = '';
  const currentUser = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
  const history = typeof getUserCheckIns === 'function' ? getUserCheckIns(currentUser) : [];
  const streakStats = typeof calculateStreak === 'function' ? calculateStreak(currentUser) : { bestStreak: 0, graceDaysUsed: 0 };

  const ALL_ACHIEVEMENTS = [
    { id: 'first_checkin', name: 'First Step', icon: '🏅', unlocked: history.length >= 1, progress: `${Math.min(1, history.length)} / 1 log` },
    { id: 'streak_3', name: '3-Day Momentum', icon: '🔥', unlocked: streakStats.bestStreak >= 3, progress: `${Math.min(3, streakStats.bestStreak)} / 3 days` },
    { id: 'grace_user', name: 'Grace Master', icon: '🛡️', unlocked: streakStats.graceDaysUsed > 0, progress: streakStats.graceDaysUsed > 0 ? 'Unlocked' : '0 / 1 used' },
    { id: 'streak_7', name: '7-Day Champion', icon: '🏆', unlocked: streakStats.bestStreak >= 7, progress: `${Math.min(7, streakStats.bestStreak)} / 7 days` }
  ];

  ALL_ACHIEVEMENTS.slice(0, 3).forEach(ach => {
    const div = document.createElement('div');
    div.className = 'achievement-pill-item';
    div.innerHTML = `
      <span class="achievement-icon">${ach.icon}</span>
      <div class="achievement-info">
        <span class="achievement-title">${ach.name}</span>
        <span class="achievement-status-tag ${ach.unlocked ? 'unlocked' : ''}">
          ${ach.unlocked ? '✓ Unlocked' : ach.progress}
        </span>
      </div>
    `;
    container.appendChild(div);
  });
}

// =========================================================================
// 8. SIDEBAR NAVIGATION & PREVIEW MODALS
// =========================================================================
function initNavigationHandlers(currentUser) {
  const modalFeaturePreview = document.getElementById('modalFeaturePreview');
  const btnCloseFeaturePreview = document.getElementById('btnCloseFeaturePreview');
  const previewFeatureIcon = document.getElementById('previewFeatureIcon');
  const previewFeatureTitle = document.getElementById('previewFeatureTitle');
  const previewFeatureDesc = document.getElementById('previewFeatureDesc');

  function openFeatureModal(title, icon, desc) {
    if (!modalFeaturePreview) return;
    if (previewFeatureTitle) previewFeatureTitle.textContent = title;
    if (previewFeatureIcon) previewFeatureIcon.textContent = icon;
    if (previewFeatureDesc) previewFeatureDesc.textContent = desc;
    modalFeaturePreview.classList.add('active');
  }

  if (btnCloseFeaturePreview && modalFeaturePreview) {
    btnCloseFeaturePreview.addEventListener('click', () => {
      modalFeaturePreview.classList.remove('active');
    });
  }

  document.querySelectorAll('.sidebar-nav button[data-nav]').forEach(btn => {
    btn.addEventListener('click', () => {
      const navTarget = btn.getAttribute('data-nav');
      if (navTarget === 'checkin') {
        if (typeof openCheckInModal === 'function') openCheckInModal();
      } else if (navTarget === 'progress') {
        openFeatureModal('Progress & Analytics', '📊', 'Detailed longitudinal adherence charts and trend analysis are coming in Phase 2.');
      } else if (navTarget === 'health') {
        if (typeof openAddReadingModal === 'function') openAddReadingModal();
      } else if (navTarget === 'wellness') {
        openFeatureModal('Wellness & Symptoms', '🌱', 'Daily symptom severity logger and mood correlation charts are coming in Phase 2.');
      } else if (navTarget === 'recovery') {
        openFeatureModal('Recovery & Relapse Engine', '🔄', 'Advanced relapse pattern detection and recovery challenges are integrated with your streak state machine.');
      } else if (navTarget === 'achievements') {
        openFeatureModal('Achievements & Badges', '🏆', 'Full achievement showcase and milestone rewards are coming in the next step.');
      } else if (navTarget === 'journal') {
        openFeatureModal('Personal Health Journal', '📖', 'Encrypted health diary and symptom notes will be available in Phase 2.');
      } else if (navTarget === 'reminders') {
        openFeatureModal('Smart Reminders', '⏰', 'Condition-timed medication alerts and check-in notification settings are coming soon.');
      } else if (navTarget === 'profile') {
        openFeatureModal('Profile & Conditions', '👤', `Logged in as ${currentUser.name} (${currentUser.email}). Managing ${currentUser.conditions?.length || 0} conditions.`);
      }
    });
  });

  const btnViewAllAchievements = document.getElementById('btnViewAllAchievements');
  if (btnViewAllAchievements) {
    btnViewAllAchievements.addEventListener('click', () => {
      openFeatureModal('Achievements & Badges', '🏆', 'Complete achievement milestones and streak rewards are being tracked automatically.');
    });
  }
}

// =========================================================================
// 9. MASTER DASHBOARD REFRESH ORCHESTRATOR
// =========================================================================
function refreshDashboard() {
  const currentUser = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
  if (!currentUser) return;

  renderUserProfileAndGreeting();
  renderStreakMetrics();
  renderTodayHabitsList();

  if (typeof renderHealthBiomarkers === 'function') renderHealthBiomarkers(currentUser);
  if (typeof renderMoodSection === 'function') renderMoodSection(currentUser);

  renderBehavioralInsight();
  renderMiniCalendar();
  renderRecentActivity();
  renderAchievements();

  if (window.lucide) {
    lucide.createIcons();
  }
}

// Export for module systems if applicable
if (typeof window !== 'undefined') {
  window.refreshDashboard = refreshDashboard;
  window.renderUserProfileAndGreeting = renderUserProfileAndGreeting;
  window.renderStreakMetrics = renderStreakMetrics;
  window.renderTodayHabitsList = renderTodayHabitsList;
  window.renderMiniCalendar = renderMiniCalendar;
}
