/**
 * checkin.js
 * Daily Check-in Module for ChronicOne.
 * 
 * Handles:
 *   - Percentage-based completion calculation (100%, 75%, 50%, 25%, 0%)
 *   - Automatic day classification (FULL, PARTIAL, LOW, MISSED)
 *   - Interactive check-in modal with live score feedback
 *   - Editing today's existing record without creating duplicates
 *   - Validation before saving
 */

// 1. Calculates average adherence score across all habits (0.0 to 1.0)
function calculateDailyScore(habits) {
  if (!habits || typeof habits !== 'object') return 0;
  const values = Object.values(habits);
  if (values.length === 0) return 0;
  const sum = values.reduce((acc, curr) => acc + (Number(curr) || 0), 0);
  return Math.round((sum / values.length) * 100) / 100;
}

// 2. Maps a numerical score (0 to 1) to a standardized Day Classification
function classifyDay(score) {
  if (score === 1) return 'FULL';
  if (score >= 0.5) return 'PARTIAL';
  if (score > 0) return 'LOW';
  return 'MISSED';
}

// 3. Normalizes legacy check-in records for backward compatibility
function normalizeCheckIn(checkIn, userHabits = []) {
  if (!checkIn) return null;

  // Already in new structure
  if (checkIn.habits && typeof checkIn.habits === 'object' && typeof checkIn.dailyScore === 'number') {
    return checkIn;
  }

  // Convert old completedHabits array to habits decimal object
  const habitsObj = {};
  const completedList = checkIn.completedHabits || [];
  const allHabits = userHabits.length > 0 ? userHabits : completedList;

  allHabits.forEach(hId => {
    habitsObj[hId] = completedList.includes(hId) ? 1 : 0;
  });

  const dailyScore = calculateDailyScore(habitsObj);
  const classification = classifyDay(dailyScore);

  return {
    ...checkIn,
    habits: habitsObj,
    dailyScore: dailyScore,
    classification: classification,
    status: classification
  };
}

// 4. Opens the Daily Check-in Modal
function openCheckInModal(targetHabitId = null) {
  const modalQuickCheckin = document.getElementById('modalQuickCheckin');
  if (!modalQuickCheckin) return;

  const currentUser = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
  if (!currentUser) return;

  const userHabits = typeof getEffectiveUserHabits === 'function' ? getEffectiveUserHabits(currentUser) : (currentUser.habits || []);
  const rawTodayCheckIn = typeof getTodayCheckIn === 'function' ? getTodayCheckIn(currentUser) : null;
  const todayCheckIn = normalizeCheckIn(rawTodayCheckIn, userHabits);
  const habitsList = document.getElementById('modalHabitsChecklist');
  if (!habitsList) return;

  habitsList.innerHTML = '';

  // Set readable date label in modal header
  const dateLabel = document.getElementById('modalCheckinDateLabel');
  if (dateLabel) {
    const now = new Date();
    dateLabel.textContent = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  }

  const existingHabitValues = todayCheckIn ? (todayCheckIn.habits || {}) : {};

  if (userHabits.length === 0) {
    habitsList.innerHTML = `
      <div style="text-align: center; padding: 16px; color: var(--text-muted); font-size: 0.86rem;">
        No habits selected yet. Please complete onboarding first.
      </div>
    `;
    const liveCard = document.getElementById('modalLiveScoreCard');
    if (liveCard) liveCard.style.display = 'none';
    modalQuickCheckin.classList.add('active');
    return;
  }

  const liveCard = document.getElementById('modalLiveScoreCard');
  if (liveCard) liveCard.style.display = 'flex';

  // 5 discrete completion levels: 100%, 75%, 50%, 25%, 0%
  const LEVELS = [
    { label: '100%', value: 1.0 },
    { label: '75%', value: 0.75 },
    { label: '50%', value: 0.5 },
    { label: '25%', value: 0.25 },
    { label: '0%', value: 0.0 }
  ];

  userHabits.forEach(hId => {
    const meta = window.HABIT_CATALOG ? window.HABIT_CATALOG.find(h => h.id === hId) : null;
    const hasSavedVal = todayCheckIn && existingHabitValues[hId] !== undefined;
    const currentValue = hasSavedVal ? existingHabitValues[hId] : null;

    const row = document.createElement('div');
    row.className = 'habit-checkin-row';
    row.setAttribute('data-habit-row', hId);

    row.innerHTML = `
      <div class="habit-checkin-header">
        <span>${meta ? meta.icon : '📌'} ${meta ? meta.name : hId}</span>
        <span class="habit-current-percent" id="pct_${hId}" style="color: var(--primary-teal); font-size: 0.8rem;">
          ${currentValue !== null ? Math.round(currentValue * 100) + '%' : '--'}
        </span>
      </div>
      <div class="habit-options-group" data-habit-id="${hId}">
        ${LEVELS.map(lvl => `
          <button type="button" class="habit-opt-btn ${currentValue !== null && Math.abs(currentValue - lvl.value) < 0.01 ? 'active' : ''}" data-val="${lvl.value}">
            ${lvl.label}
          </button>
        `).join('')}
      </div>
    `;

    // Add click listeners to percentage option buttons
    const optButtons = row.querySelectorAll('.habit-opt-btn');
    const pctLabel = row.querySelector(`#pct_${hId}`);

    optButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        optButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const val = parseFloat(btn.getAttribute('data-val'));
        if (pctLabel) pctLabel.textContent = `${Math.round(val * 100)}%`;
        updateModalLiveScore();
      });
    });

    habitsList.appendChild(row);
  });

  const notesInput = document.getElementById('modalCheckinNotes');
  if (notesInput) {
    notesInput.value = (todayCheckIn && todayCheckIn.notes) ? todayCheckIn.notes : '';
  }

  // Initialize live score preview immediately
  updateModalLiveScore();

  modalQuickCheckin.classList.add('active');

  // If a specific habit was targeted (e.g. clicking Edit on Medication), scroll to it and highlight
  if (targetHabitId) {
    setTimeout(() => {
      const targetRow = habitsList.querySelector(`[data-habit-row="${targetHabitId}"]`);
      if (targetRow) {
        targetRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
        targetRow.classList.add('highlight-edit');
        setTimeout(() => targetRow.classList.remove('highlight-edit'), 2000);
      }
    }, 100);
  }
}

// 5. Closes the Daily Check-in Modal
function closeCheckInModal() {
  const modalQuickCheckin = document.getElementById('modalQuickCheckin');
  if (modalQuickCheckin) {
    modalQuickCheckin.classList.remove('active');
  }
}

// 6. Calculates and updates the live adherence score inside the open modal
function updateModalLiveScore() {
  const formCheckinModal = document.getElementById('formCheckinModal');
  if (!formCheckinModal) return;

  const currentUser = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
  if (!currentUser) return;

  const userHabits = typeof getEffectiveUserHabits === 'function' ? getEffectiveUserHabits(currentUser) : (currentUser.habits || []);
  if (userHabits.length === 0) return;

  const habitsObj = {};
  let selectedCount = 0;
  let sum = 0;

  userHabits.forEach(hId => {
    const group = formCheckinModal.querySelector(`.habit-options-group[data-habit-id="${hId}"]`);
    if (group) {
      const activeBtn = group.querySelector('.habit-opt-btn.active');
      if (activeBtn) {
        const val = parseFloat(activeBtn.getAttribute('data-val'));
        habitsObj[hId] = val;
        sum += val;
        selectedCount++;
      }
    }
  });

  const scoreTextElem = document.getElementById('modalLiveScoreText');
  const badgeElem = document.getElementById('modalLiveStatusBadge');

  if (!scoreTextElem || !badgeElem) return;

  if (selectedCount === 0) {
    scoreTextElem.textContent = '0%';
    badgeElem.textContent = 'Not logged';
    badgeElem.className = 'status-badge initial';
    return;
  }

  if (selectedCount < userHabits.length) {
    const partialAvg = sum / selectedCount;
    scoreTextElem.textContent = `${Math.round(partialAvg * 100)}%`;
    badgeElem.textContent = `${selectedCount} of ${userHabits.length} selected`;
    badgeElem.className = 'status-badge warning';
    return;
  }

  // All habits selected
  const dailyScore = calculateDailyScore(habitsObj);
  const classification = classifyDay(dailyScore);
  const percent = Math.round(dailyScore * 100);

  scoreTextElem.textContent = `${percent}%`;

  const classMap = {
    'FULL': { text: 'Full Adherence', class: 'status-badge stable' },
    'PARTIAL': { text: 'Partial Adherence', class: 'status-badge warning' },
    'LOW': { text: 'Low Adherence', class: 'status-badge recovery' },
    'MISSED': { text: 'Missed Day', class: 'status-badge initial' }
  };
  const info = classMap[classification] || { text: classification, class: 'status-badge initial' };
  badgeElem.textContent = info.text;
  badgeElem.className = info.class;
}

// 7. Initializes check-in modal event listeners
function initCheckinModal() {
  const btnCloseCheckinModal = document.getElementById('btnCloseCheckinModal');
  const btnCancelCheckin = document.getElementById('btnCancelCheckin');
  const formCheckinModal = document.getElementById('formCheckinModal');

  if (btnCloseCheckinModal) btnCloseCheckinModal.addEventListener('click', closeCheckInModal);
  if (btnCancelCheckin) btnCancelCheckin.addEventListener('click', closeCheckInModal);

  if (formCheckinModal) {
    formCheckinModal.addEventListener('submit', (e) => {
      e.preventDefault();
      const currentUser = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
      if (!currentUser) return;

      const today = typeof getTodayDate === 'function' ? getTodayDate() : new Date().toISOString().slice(0, 10);
      const notesInput = document.getElementById('modalCheckinNotes');
      const notesVal = notesInput ? notesInput.value.trim() : '';
      const userHabits = typeof getEffectiveUserHabits === 'function' ? getEffectiveUserHabits(currentUser) : (currentUser.habits || []);

      if (userHabits.length === 0) {
        if (typeof showToast === 'function') showToast('No habits configured to check in.', 'error');
        closeCheckInModal();
        return;
      }

      // 1. Gather all selected habit percentage values with validation
      const habitsObj = {};
      let hasUnselected = false;

      for (let i = 0; i < userHabits.length; i++) {
        const hId = userHabits[i];
        const group = formCheckinModal.querySelector(`.habit-options-group[data-habit-id="${hId}"]`);
        const activeBtn = group ? group.querySelector('.habit-opt-btn.active') : null;

        if (!activeBtn) {
          hasUnselected = true;
          break;
        }

        const val = parseFloat(activeBtn.getAttribute('data-val'));
        if (isNaN(val) || val < 0 || val > 1) {
          hasUnselected = true;
          break;
        }

        habitsObj[hId] = val;
      }

      if (hasUnselected) {
        if (typeof showToast === 'function') showToast('Please select a completion percentage for every habit.', 'error');
        return;
      }

      // 2. Automatically calculate dailyScore and day classification
      const dailyScore = calculateDailyScore(habitsObj);
      const classification = classifyDay(dailyScore);

      // 3. Save to checkIns array (prevent duplicates for same user and date)
      let allCheckIns = typeof getStorageArray === 'function' ? getStorageArray('checkIns') : [];
      const existingIndex = allCheckIns.findIndex(c => c.userId === currentUser.id && c.date === today);

      const checkInRecord = {
        id: existingIndex !== -1 ? allCheckIns[existingIndex].id : `chk_${Date.now()}`,
        userId: currentUser.id,
        date: today,
        habits: habitsObj,
        dailyScore: dailyScore,
        classification: classification,
        status: classification, // backward compatibility
        notes: notesVal,
        createdAt: existingIndex !== -1 ? allCheckIns[existingIndex].createdAt : new Date().toISOString()
      };

      if (existingIndex !== -1) {
        allCheckIns[existingIndex] = checkInRecord;
      } else {
        allCheckIns.push(checkInRecord);
      }

      if (typeof setStorageArray === 'function') {
        setStorageArray('checkIns', allCheckIns);
      }

      closeCheckInModal();

      if (typeof confetti === 'function' && classification === 'FULL') {
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
      }

      if (typeof showToast === 'function') {
        showToast(`Today's check-in saved! (${Math.round(dailyScore * 100)}% - ${classification})`, 'success');
      }

      if (typeof refreshDashboard === 'function') {
        refreshDashboard();
      }
    });
  }
}

// Export for module systems if applicable
if (typeof window !== 'undefined') {
  window.calculateDailyScore = calculateDailyScore;
  window.classifyDay = classifyDay;
  window.normalizeCheckIn = normalizeCheckIn;
  window.openCheckInModal = openCheckInModal;
  window.closeCheckInModal = closeCheckInModal;
  window.updateModalLiveScore = updateModalLiveScore;
  window.initCheckinModal = initCheckinModal;
}
