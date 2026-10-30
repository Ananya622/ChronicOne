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

// Saves or updates the mood record for today via API
async function saveTodayMood(mood, user = null) {
  const activeUser = user || (typeof getCurrentUser === 'function' ? getCurrentUser() : null);
  if (!activeUser) return;

  const today = typeof getTodayDate === 'function' ? getTodayDate() : new Date().toISOString().slice(0, 10);

  try {
    let res = null;
    if (typeof window.api !== 'undefined' && window.api.isAuthenticated()) {
      res = await window.api.post('/api/wellness/mood', {
        mood,
        date: today
      });
    }

    const savedRecord = (res && res.record) ? res.record : {
      id: `mood_${Date.now()}`,
      userId: activeUser.id || activeUser._id,
      date: today,
      mood,
      createdAt: new Date().toISOString()
    };

    // Update in-memory state with MongoDB response
    if (typeof updateCachedMoodRecord === 'function') {
      updateCachedMoodRecord(savedRecord);
    }

    if (typeof showToast === 'function') {
      showToast('Mood recorded for today!', 'success');
    }

    renderMoodSection(activeUser);
  } catch (err) {
    if (typeof showToast === 'function') {
      showToast(err.message || 'Failed to save mood to server.', 'error');
    }
  }
}

// Export for module systems if applicable
if (typeof window !== 'undefined') {
  window.renderMoodSection = renderMoodSection;
  window.saveTodayMood = saveTodayMood;
}
