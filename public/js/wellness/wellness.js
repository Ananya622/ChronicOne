/**
 * wellness.js
 * Mood Logger & Wellness Module for ChronicOne.
 * 
 * Handles logging and displaying today's mood state in LocalStorage.moodRecords.
 */

// Renders the interactive mood picker buttons and today's logged state
function renderMoodSection(user = null) {
  const activeUser = user || (typeof getCurrentUser === 'function' ? getCurrentUser() : null);
  const todayMood = typeof getTodayMood === 'function' ? getTodayMood(activeUser) : null;
  const statusText = document.getElementById('moodLoggedStatus');
  const buttons = document.querySelectorAll('#moodPickerContainer .mood-btn');

  buttons.forEach(btn => {
    const moodVal = btn.getAttribute('data-mood');
    if (todayMood && todayMood.mood === moodVal) {
      btn.classList.add('selected');
    } else {
      btn.classList.remove('selected');
    }

    btn.onclick = () => {
      saveTodayMood(moodVal, activeUser);
    };
  });

  if (statusText) {
    if (todayMood) {
      const moodLabels = { great: '😊 Great', good: '🙂 Good', neutral: '😐 Okay', low: '😟 Low', flareup: '😞 Pain' };
      statusText.textContent = `Today: ${moodLabels[todayMood.mood] || todayMood.mood}`;
      statusText.style.color = 'var(--primary-emerald)';
    } else {
      statusText.textContent = 'Not logged yet';
      statusText.style.color = 'var(--primary-teal)';
    }
  }
}

// Saves or updates the mood record for today
function saveTodayMood(mood, user = null) {
  const activeUser = user || (typeof getCurrentUser === 'function' ? getCurrentUser() : null);
  if (!activeUser) return;

  const today = typeof getTodayDate === 'function' ? getTodayDate() : new Date().toISOString().slice(0, 10);
  let allMoods = typeof getStorageArray === 'function' ? getStorageArray('moodRecords') : [];

  allMoods = allMoods.filter(m => !(m.userId === activeUser.id && m.date === today));
  allMoods.push({
    id: `mood_${Date.now()}`,
    userId: activeUser.id,
    date: today,
    mood,
    createdAt: new Date().toISOString()
  });

  if (typeof setStorageArray === 'function') {
    setStorageArray('moodRecords', allMoods);
  }

  if (typeof showToast === 'function') {
    showToast('Mood recorded for today!', 'success');
  }

  renderMoodSection(activeUser);
}

// Export for module systems if applicable
if (typeof window !== 'undefined') {
  window.renderMoodSection = renderMoodSection;
  window.saveTodayMood = saveTodayMood;
}
