/**
 * health.js
 * Adaptive Condition Biomarkers & Vitals Module for ChronicOne.
 * 
 * Dynamically renders biomarker widgets derived from user.conditions (deduplicated)
 * and handles adding/updating biometric readings in LocalStorage.healthRecords.
 */

const BIOMARKER_DEFINITIONS = {
  bloodGlucose: { name: 'Blood Glucose', defaultUnit: 'mg/dL', icon: '🩸', defaultTarget: '70-140' },
  bloodPressure: { name: 'Blood Pressure', defaultUnit: 'mmHg', icon: '🫀', defaultTarget: '< 120/80' },
  heartRate: { name: 'Resting Heart Rate', defaultUnit: 'bpm', icon: '💓', defaultTarget: '60-100' },
  peakFlow: { name: 'Peak Flow Rate', defaultUnit: 'L/min', icon: '🫁', defaultTarget: '400-600' },
  jointPain: { name: 'Joint Pain Level', defaultUnit: '/ 10', icon: '🦴', defaultTarget: '0-3' },
  weight: { name: 'Body Weight', defaultUnit: 'kg', icon: '⚖️', defaultTarget: 'Stable' },
  sleepHours: { name: 'Sleep Duration', defaultUnit: 'hrs', icon: '🌙', defaultTarget: '7-9' }
};

// Determines deduplicated required biomarker keys based on user's conditions
function getRequiredBiomarkersForUser(user = null) {
  const activeUser = user || (typeof getCurrentUser === 'function' ? getCurrentUser() : null);
  const conditions = activeUser ? (activeUser.conditions || []) : [];
  const metricSet = new Set();

  conditions.forEach(cond => {
    if (cond === 'diabetes') {
      metricSet.add('bloodGlucose');
      metricSet.add('weight');
    } else if (cond === 'hypertension') {
      metricSet.add('bloodPressure');
      metricSet.add('heartRate');
      metricSet.add('weight');
    } else if (cond === 'asthma') {
      metricSet.add('peakFlow');
    } else if (cond === 'arthritis') {
      metricSet.add('jointPain');
    } else if (cond === 'thyroid') {
      metricSet.add('weight');
      metricSet.add('heartRate');
    }
  });

  if (metricSet.size === 0) {
    metricSet.add('sleepHours');
    metricSet.add('weight');
  }

  return Array.from(metricSet);
}

// Renders the condition-specific health biomarker cards
function renderHealthBiomarkers(user = null) {
  const container = document.getElementById('healthBiomarkersContainer');
  if (!container) return;

  container.innerHTML = '';
  const activeUser = user || (typeof getCurrentUser === 'function' ? getCurrentUser() : null);
  const requiredMetrics = getRequiredBiomarkersForUser(activeUser);
  const userRecords = typeof getUserHealthRecords === 'function' ? getUserHealthRecords(activeUser) : [];
  const todayDate = typeof getTodayDate === 'function' ? getTodayDate() : new Date().toISOString().slice(0, 10);

  requiredMetrics.forEach(metricKey => {
    const def = BIOMARKER_DEFINITIONS[metricKey] || { name: metricKey, defaultUnit: '', icon: '🩺' };
    const latestRecord = userRecords.find(r => r.type === metricKey);

    const card = document.createElement('div');
    card.className = 'biomarker-card';

    card.innerHTML = `
      <div>
        <div class="biomarker-header">
          <span class="biomarker-label">${def.icon} ${def.name}</span>
          <span style="font-size: 0.68rem; color: var(--text-subtle);">${def.defaultTarget ? `Target: ${def.defaultTarget}` : ''}</span>
        </div>
        <div class="biomarker-value">
          ${latestRecord ? `${latestRecord.value} <span style="font-size: 0.8rem; font-weight: normal; color: var(--text-muted);">${latestRecord.unit || def.defaultUnit}</span>` : '<span style="font-size: 0.85rem; color: var(--text-muted); font-weight: normal;">No reading yet</span>'}
        </div>
        <div class="biomarker-subtext">
          ${latestRecord ? `Recorded ${latestRecord.date === todayDate ? 'today' : latestRecord.date}` : 'Not recorded today'}
        </div>
      </div>
      <button class="btn-add-reading btn-record-metric" data-metric="${metricKey}">
        ${latestRecord ? 'Update' : '+ Add Reading'}
      </button>
    `;

    card.querySelector('.btn-record-metric').addEventListener('click', () => {
      openAddReadingModal(metricKey);
    });

    container.appendChild(card);
  });
}

// Opens the Add/Update Reading Modal
function openAddReadingModal(preselectedType = '') {
  const modalAddReading = document.getElementById('modalAddReading');
  const modalBiomarkerType = document.getElementById('modalBiomarkerType');
  const modalBiomarkerValue = document.getElementById('modalBiomarkerValue');
  const modalBiomarkerUnit = document.getElementById('modalBiomarkerUnit');
  if (!modalAddReading || !modalBiomarkerType) return;

  modalBiomarkerType.innerHTML = '';
  const metrics = getRequiredBiomarkersForUser();

  metrics.forEach(mKey => {
    const def = BIOMARKER_DEFINITIONS[mKey] || { name: mKey, defaultUnit: '' };
    const opt = document.createElement('option');
    opt.value = mKey;
    opt.textContent = `${def.name} (${def.defaultUnit})`;
    if (mKey === preselectedType) opt.selected = true;
    modalBiomarkerType.appendChild(opt);
  });

  const selectedType = modalBiomarkerType.value;
  const selectedDef = BIOMARKER_DEFINITIONS[selectedType];
  if (modalBiomarkerUnit) modalBiomarkerUnit.value = selectedDef ? selectedDef.defaultUnit : '';

  // Prepopulate with today's existing reading if present
  const userRecords = typeof getUserHealthRecords === 'function' ? getUserHealthRecords() : [];
  const todayDate = typeof getTodayDate === 'function' ? getTodayDate() : new Date().toISOString().slice(0, 10);
  const existingRecord = userRecords.find(r => r.type === selectedType && r.date === todayDate);

  if (modalBiomarkerValue) modalBiomarkerValue.value = existingRecord ? existingRecord.value : '';

  modalAddReading.classList.add('active');
}

// Initializes the Health Modal event listeners
function initHealthModule() {
  const modalAddReading = document.getElementById('modalAddReading');
  const btnOpenAddReadingModal = document.getElementById('btnOpenAddReadingModal');
  const btnCloseReadingModal = document.getElementById('btnCloseReadingModal');
  const btnCancelReading = document.getElementById('btnCancelReading');
  const formAddReadingModal = document.getElementById('formAddReadingModal');
  const modalBiomarkerType = document.getElementById('modalBiomarkerType');
  const modalBiomarkerValue = document.getElementById('modalBiomarkerValue');
  const modalBiomarkerUnit = document.getElementById('modalBiomarkerUnit');

  if (modalBiomarkerType && modalBiomarkerUnit) {
    modalBiomarkerType.addEventListener('change', () => {
      const selectedType = modalBiomarkerType.value;
      const def = BIOMARKER_DEFINITIONS[selectedType];
      modalBiomarkerUnit.value = def ? def.defaultUnit : '';

      const userRecords = typeof getUserHealthRecords === 'function' ? getUserHealthRecords() : [];
      const todayDate = typeof getTodayDate === 'function' ? getTodayDate() : new Date().toISOString().slice(0, 10);
      const existingRecord = userRecords.find(r => r.type === selectedType && r.date === todayDate);
      if (modalBiomarkerValue) modalBiomarkerValue.value = existingRecord ? existingRecord.value : '';
    });
  }

  if (btnOpenAddReadingModal) btnOpenAddReadingModal.addEventListener('click', () => openAddReadingModal());
  if (btnCloseReadingModal) btnCloseReadingModal.addEventListener('click', () => modalAddReading?.classList.remove('active'));
  if (btnCancelReading) btnCancelReading.addEventListener('click', () => modalAddReading?.classList.remove('active'));

  if (formAddReadingModal) {
    formAddReadingModal.addEventListener('submit', (e) => {
      e.preventDefault();
      const currentUser = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
      if (!currentUser) return;

      const type = modalBiomarkerType.value;
      const val = parseFloat(document.getElementById('modalBiomarkerValue').value);
      const unit = modalBiomarkerUnit ? modalBiomarkerUnit.value : '';

      if (isNaN(val)) {
        if (typeof showToast === 'function') showToast('Please enter a valid numeric value', 'error');
        return;
      }

      const allRecords = typeof getStorageArray === 'function' ? getStorageArray('healthRecords') : [];
      const todayDate = typeof getTodayDate === 'function' ? getTodayDate() : new Date().toISOString().slice(0, 10);

      // Rule: ONE USER + ONE BIOMARKER TYPE + ONE DATE = ONE HEALTH RECORD
      const existingIndex = allRecords.findIndex(r =>
        r.userId === currentUser.id &&
        r.type === type &&
        r.date === todayDate
      );

      if (existingIndex !== -1) {
        // UPDATE existing same-day record in-place (preserves id and createdAt)
        allRecords[existingIndex] = {
          ...allRecords[existingIndex],
          value: val,
          unit,
          updatedAt: new Date().toISOString()
        };
      } else {
        // CREATE new health record
        allRecords.push({
          id: `rec_${Date.now()}`,
          userId: currentUser.id,
          type,
          value: val,
          unit,
          date: todayDate,
          createdAt: new Date().toISOString()
        });
      }

      if (typeof setStorageArray === 'function') setStorageArray('healthRecords', allRecords);
      modalAddReading.classList.remove('active');
      const isUpdate = existingIndex !== -1;
      if (typeof showToast === 'function') {
        showToast(`${BIOMARKER_DEFINITIONS[type]?.name || type} reading ${isUpdate ? 'updated' : 'recorded'}!`, 'success');
      }
      renderHealthBiomarkers();
    });
  }
}

// Export for module systems if applicable
if (typeof window !== 'undefined') {
  window.BIOMARKER_DEFINITIONS = BIOMARKER_DEFINITIONS;
  window.getRequiredBiomarkersForUser = getRequiredBiomarkersForUser;
  window.renderHealthBiomarkers = renderHealthBiomarkers;
  window.openAddReadingModal = openAddReadingModal;
  window.initHealthModule = initHealthModule;
}
