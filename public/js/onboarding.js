/**
 * onboarding.js
 * Multi-Step Health Registration, Eye Toggles, Live Dynamic Password Evaluator,
 * Theme Switcher & LocalStorage Manager for the Landing/Auth Page (index.html).
 */

document.addEventListener('DOMContentLoaded', () => {
  // Initialize Lucide icons
  if (window.lucide) {
    lucide.createIcons();
  }

  // =========================================================================
  // State
  // =========================================================================
  const onboardingState = {
    currentStep: 1,
    fullName: '',
    email: '',
    password: '',
    conditions: [],
    customCondition: '',
    selectedHabits: []
  };

  // =========================================================================
  // Theme Toggle Engine (Dark Luxe / Warm Porcelain Light)
  // =========================================================================
  const themeToggle = document.getElementById('themeToggle');
  const themeIcon = document.getElementById('themeIcon');

  // Load saved theme or default to dark
  const savedTheme = localStorage.getItem('auraTheme') || 'dark';
  if (savedTheme === 'light') {
    document.body.classList.add('light-theme');
    if (themeIcon) themeIcon.setAttribute('data-lucide', 'moon');
  } else {
    document.body.classList.remove('light-theme');
    if (themeIcon) themeIcon.setAttribute('data-lucide', 'sun');
  }
  if (window.lucide) lucide.createIcons();

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const isLight = document.body.classList.toggle('light-theme');
      localStorage.setItem('auraTheme', isLight ? 'light' : 'dark');
      themeIcon.setAttribute('data-lucide', isLight ? 'moon' : 'sun');
      if (window.lucide) lucide.createIcons();
    });
  }

  // =========================================================================
  // DOM Elements
  // =========================================================================
  // Mode Tabs
  const tabRegister = document.getElementById('tabRegister');
  const tabLogin = document.getElementById('tabLogin');
  const registerFlowContainer = document.getElementById('registerFlowContainer');
  const loginForm = document.getElementById('loginForm');

  // Progress Indicators
  const stepCountLabel = document.getElementById('stepCountLabel');
  const stepNameLabel = document.getElementById('stepNameLabel');
  const progSegment1 = document.getElementById('progSegment1');
  const progSegment2 = document.getElementById('progSegment2');
  const progSegment3 = document.getElementById('progSegment3');

  // Step Views
  const step1Form = document.getElementById('step1Form');
  const step2View = document.getElementById('step2View');
  const step3View = document.getElementById('step3View');

  // Step 1 Inputs & Errors
  const regFullName = document.getElementById('regFullName');
  const regEmail = document.getElementById('regEmail');
  const regPassword = document.getElementById('regPassword');
  const regConfirmPassword = document.getElementById('regConfirmPassword');
  const nameError = document.getElementById('nameError');
  const emailError = document.getElementById('emailError');
  const confirmPasswordError = document.getElementById('confirmPasswordError');

  // Password Strength & Missing Rules UI
  const strengthBadge = document.getElementById('strengthBadge');
  const meterSeg1 = document.getElementById('meterSeg1');
  const meterSeg2 = document.getElementById('meterSeg2');
  const meterSeg3 = document.getElementById('meterSeg3');
  const meterSeg4 = document.getElementById('meterSeg4');
  const unmetRulesContainer = document.getElementById('unmetRulesContainer');

  // Eye Toggle Buttons
  const toggleRegPassword = document.getElementById('toggleRegPassword');
  const toggleConfirmPassword = document.getElementById('toggleConfirmPassword');
  const toggleLoginPassword = document.getElementById('toggleLoginPassword');

  // Step 2 Condition Elements
  const conditionsGrid = document.getElementById('conditionsGrid');
  const customConditionWrapper = document.getElementById('customConditionWrapper');
  const customConditionInput = document.getElementById('customConditionInput');
  const btnBackToStep1 = document.getElementById('btnBackToStep1');
  const btnToStep3 = document.getElementById('btnToStep3');

  // Step 3 Habit Elements
  const habitsGrid = document.getElementById('habitsGrid');
  const btnBackToStep2 = document.getElementById('btnBackToStep2');
  const btnCompleteRegistration = document.getElementById('btnCompleteRegistration');

  // Login Elements
  const loginEmail = document.getElementById('loginEmail');
  const loginPassword = document.getElementById('loginPassword');
  const loginEmailError = document.getElementById('loginEmailError');
  const loginPasswordError = document.getElementById('loginPasswordError');

  const authToastContainer = document.getElementById('authToastContainer');

  // =========================================================================
  // Password Visibility Toggle Logic
  // =========================================================================
  function setupPasswordToggle(button, inputField) {
    if (!button || !inputField) return;
    button.addEventListener('click', () => {
      const isPassword = inputField.getAttribute('type') === 'password';
      inputField.setAttribute('type', isPassword ? 'text' : 'password');
      button.innerHTML = `<i data-lucide="${isPassword ? 'eye-off' : 'eye'}" style="width: 15px; height: 15px;"></i>`;
      if (window.lucide) lucide.createIcons();
    });
  }

  setupPasswordToggle(toggleRegPassword, regPassword);
  setupPasswordToggle(toggleConfirmPassword, regConfirmPassword);
  setupPasswordToggle(toggleLoginPassword, loginPassword);

  // =========================================================================
  // LocalStorage Helper Utilities (PART 6)
  // =========================================================================
  function getExistingUsers() {
    try {
      const usersJson = localStorage.getItem('users');
      return usersJson ? JSON.parse(usersJson) : [];
    } catch (e) {
      console.error('Error reading users from localStorage:', e);
      return [];
    }
  }

  function emailExistsInStorage(email) {
    const users = getExistingUsers();
    return users.some(u => u.email.trim().toLowerCase() === email.trim().toLowerCase());
  }

  // =========================================================================
  // Auth Mode Switching (Sign Up vs Log In)
  // =========================================================================
  tabRegister.addEventListener('click', () => {
    tabRegister.classList.add('active');
    tabLogin.classList.remove('active');
    registerFlowContainer.style.display = 'block';
    loginForm.style.display = 'none';
  });

  tabLogin.addEventListener('click', () => {
    tabLogin.classList.add('active');
    tabRegister.classList.remove('active');
    registerFlowContainer.style.display = 'none';
    loginForm.style.display = 'block';
    authWrapper.classList.remove('step-wide');
  });

  // =========================================================================
  // Dynamic Live Password Strength Evaluator (PART 2)
  // Only shows missing requirements when unfulfilled to keep view compact
  // =========================================================================
  function evaluatePassword(pwd) {
    const rules = {
      length: { met: pwd.length >= 8, label: '8+ chars' },
      uppercase: { met: /[A-Z]/.test(pwd), label: 'Uppercase (A-Z)' },
      lowercase: { met: /[a-z]/.test(pwd), label: 'Lowercase (a-z)' },
      number: { met: /[0-9]/.test(pwd), label: 'Number (0-9)' },
      special: { met: /[!@#$%^&*(),.?":{}|<>]/.test(pwd), label: 'Symbol (!@#$)' }
    };

    const satisfiedCount = Object.values(rules).filter(r => r.met).length;
    let strength = 'Too Short';
    let strengthClass = '';
    let segmentsLit = 0;

    if (pwd.length === 0) {
      strength = 'Enter password';
      strengthClass = '';
      segmentsLit = 0;
      unmetRulesContainer.innerHTML = '';
    } else {
      if (satisfiedCount <= 2 || pwd.length < 8) {
        strength = 'Weak';
        strengthClass = 'weak';
        segmentsLit = 1;
      } else if (satisfiedCount === 3 || satisfiedCount === 4) {
        strength = 'Medium';
        strengthClass = 'medium';
        segmentsLit = 2;
      } else if (satisfiedCount === 5) {
        if (pwd.length >= 12) {
          strength = 'Very Strong';
          strengthClass = 'very-strong';
          segmentsLit = 4;
        } else {
          strength = 'Strong';
          strengthClass = 'strong';
          segmentsLit = 3;
        }
      }

      // Render ONLY missing/unmet requirements dynamically
      unmetRulesContainer.innerHTML = '';
      const unmet = Object.values(rules).filter(r => !r.met);

      if (unmet.length === 0) {
        const validTag = document.createElement('span');
        validTag.className = 'unmet-tag all-valid';
        validTag.innerHTML = '✓ Strong password ready';
        unmetRulesContainer.appendChild(validTag);
      } else {
        unmet.forEach(r => {
          const tag = document.createElement('span');
          tag.className = 'unmet-tag';
          tag.textContent = `Need ${r.label}`;
          unmetRulesContainer.appendChild(tag);
        });
      }
    }

    // Update Strength Badge
    strengthBadge.textContent = strength;
    strengthBadge.className = `strength-badge ${strengthClass}`;

    // Update Meter Segments
    updateMeterSegments(segmentsLit, strengthClass);

    return {
      isValid: satisfiedCount === 5 && rules.length.met,
      strength
    };
  }

  function updateMeterSegments(litCount, strengthClass) {
    const segments = [meterSeg1, meterSeg2, meterSeg3, meterSeg4];
    const colorMap = {
      'weak': 'var(--strength-weak)',
      'medium': 'var(--strength-medium)',
      'strong': 'var(--strength-strong)',
      'very-strong': 'var(--strength-very-strong)'
    };

    segments.forEach((seg, index) => {
      if (index < litCount) {
        seg.style.backgroundColor = colorMap[strengthClass] || 'var(--primary-teal)';
      } else {
        seg.style.backgroundColor = document.body.classList.contains('light-theme') 
          ? 'rgba(0, 0, 0, 0.08)' 
          : 'rgba(255, 255, 255, 0.08)';
      }
    });
  }

  regPassword.addEventListener('input', () => {
    evaluatePassword(regPassword.value);
    validatePasswordMatch();
  });

  regConfirmPassword.addEventListener('input', () => {
    validatePasswordMatch();
  });

  function validatePasswordMatch() {
    const pwd = regPassword.value;
    const confirm = regConfirmPassword.value;

    if (!confirm) {
      confirmPasswordError.classList.remove('visible');
      regConfirmPassword.classList.remove('has-error', 'is-valid');
      return false;
    }

    if (pwd === confirm) {
      confirmPasswordError.classList.remove('visible');
      regConfirmPassword.classList.remove('has-error');
      regConfirmPassword.classList.add('is-valid');
      return true;
    } else {
      confirmPasswordError.classList.add('visible');
      regConfirmPassword.classList.add('has-error');
      regConfirmPassword.classList.remove('is-valid');
      return false;
    }
  }

  // =========================================================================
  // Email Validation & Duplicate Check (PART 3)
  // =========================================================================
  function validateEmailField(input, errorElement, checkDuplicates = true) {
    const email = input.value.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email) {
      errorElement.textContent = 'Email required.';
      errorElement.classList.add('visible');
      input.classList.add('has-error');
      input.classList.remove('is-valid');
      return false;
    }

    if (!emailRegex.test(email)) {
      errorElement.textContent = 'Invalid format (e.g. name@domain.com).';
      errorElement.classList.add('visible');
      input.classList.add('has-error');
      input.classList.remove('is-valid');
      return false;
    }

    if (checkDuplicates && emailExistsInStorage(email)) {
      errorElement.textContent = 'Email already registered. Please log in.';
      errorElement.classList.add('visible');
      input.classList.add('has-error');
      input.classList.remove('is-valid');
      return false;
    }

    errorElement.classList.remove('visible');
    input.classList.remove('has-error');
    input.classList.add('is-valid');
    return true;
  }

  regEmail.addEventListener('blur', () => {
    validateEmailField(regEmail, emailError, true);
  });

  // =========================================================================
  // Step 1 Submission -> Step 2
  // =========================================================================
  step1Form.addEventListener('submit', (e) => {
    e.preventDefault();

    const isNameValid = regFullName.value.trim().length > 0;
    if (!isNameValid) {
      nameError.classList.add('visible');
      regFullName.classList.add('has-error');
    } else {
      nameError.classList.remove('visible');
      regFullName.classList.remove('has-error');
    }

    const isEmailValid = validateEmailField(regEmail, emailError, true);
    const pwdEval = evaluatePassword(regPassword.value);
    const isMatchValid = validatePasswordMatch();

    if (isNameValid && isEmailValid && pwdEval.isValid && isMatchValid) {
      onboardingState.fullName = regFullName.value.trim();
      onboardingState.email = regEmail.value.trim().toLowerCase();
      onboardingState.password = regPassword.value;
      goToStep(2);
    } else {
      showToast('Please fulfill all highlighted requirements to proceed.', 'error');
    }
  });

  // =========================================================================
  // Step 2: Conditions Selection (PART 4)
  // =========================================================================
  const conditionCards = conditionsGrid.querySelectorAll('.condition-card');

  conditionCards.forEach(card => {
    card.addEventListener('click', () => {
      const cond = card.getAttribute('data-condition');

      if (cond === 'prefer_not_to_say') {
        conditionCards.forEach(c => {
          c.classList.remove('selected');
          c.setAttribute('aria-checked', 'false');
        });
        card.classList.add('selected');
        card.setAttribute('aria-checked', 'true');
        customConditionWrapper.classList.remove('visible');
      } else {
        const preferCard = conditionsGrid.querySelector('[data-condition="prefer_not_to_say"]');
        if (preferCard) {
          preferCard.classList.remove('selected');
          preferCard.setAttribute('aria-checked', 'false');
        }

        card.classList.toggle('selected');
        const isSelected = card.classList.contains('selected');
        card.setAttribute('aria-checked', isSelected ? 'true' : 'false');

        if (cond === 'other') {
          if (isSelected) {
            customConditionWrapper.classList.add('visible');
            customConditionInput.focus();
          } else {
            customConditionWrapper.classList.remove('visible');
          }
        }
      }
    });

    card.addEventListener('keydown', (e) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        card.click();
      }
    });
  });

  btnBackToStep1.addEventListener('click', () => {
    goToStep(1);
  });

  btnToStep3.addEventListener('click', () => {
    const selected = [];
    conditionCards.forEach(card => {
      if (card.classList.contains('selected')) {
        const cond = card.getAttribute('data-condition');
        if (cond === 'other') {
          const customVal = customConditionInput.value.trim();
          selected.push(customVal ? `custom:${customVal}` : 'other');
        } else {
          selected.push(cond);
        }
      }
    });

    onboardingState.conditions = selected;
    renderHabitRecommendations();
    goToStep(3);
  });

  // =========================================================================
  // Step 3: Habit Personalization (PART 5) — Fixed Click Reliability
  // =========================================================================
  function renderHabitRecommendations() {
    habitsGrid.innerHTML = '';

    const recommendedHabitIds = window.getRecommendedHabitsForConditions 
      ? window.getRecommendedHabitsForConditions(onboardingState.conditions)
      : ['medication', 'exercise', 'diet'];
      
    const catalog = window.HABIT_CATALOG || [];

    // Pre-select recommended habits initially
    onboardingState.selectedHabits = [...recommendedHabitIds];

    catalog.forEach(habit => {
      const isRecommended = recommendedHabitIds.includes(habit.id);
      const isSelected = onboardingState.selectedHabits.includes(habit.id);

      const card = document.createElement('div');
      card.className = `habit-card ${isSelected ? 'selected' : ''}`;
      card.setAttribute('data-habit-id', habit.id);
      card.setAttribute('tabindex', '0');
      card.setAttribute('role', 'checkbox');
      card.setAttribute('aria-checked', isSelected ? 'true' : 'false');

      card.innerHTML = `
        <div class="habit-card-left" style="pointer-events: none;">
          <span class="habit-card-icon">${habit.icon}</span>
          <div class="habit-card-info">
            <strong>${habit.name}</strong>
            <p>${habit.description}</p>
            ${isRecommended ? '<span class="recommended-pill">✨ Recommended</span>' : ''}
          </div>
        </div>
        <div class="card-checkbox" style="pointer-events: none;">✓</div>
      `;

      // Direct and reliable click toggle
      card.addEventListener('click', () => {
        card.classList.toggle('selected');
        const checked = card.classList.contains('selected');
        card.setAttribute('aria-checked', checked ? 'true' : 'false');

        if (checked) {
          if (!onboardingState.selectedHabits.includes(habit.id)) {
            onboardingState.selectedHabits.push(habit.id);
          }
        } else {
          onboardingState.selectedHabits = onboardingState.selectedHabits.filter(id => id !== habit.id);
        }
      });

      card.addEventListener('keydown', (e) => {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          card.click();
        }
      });

      habitsGrid.appendChild(card);
    });
  }

  btnBackToStep2.addEventListener('click', () => {
    goToStep(2);
  });

  // =========================================================================
  // Step 3 Completion & LocalStorage Persistence (PART 6 & 7)
  // =========================================================================
  btnCompleteRegistration.addEventListener('click', () => {
    if (onboardingState.selectedHabits.length === 0) {
      showToast('Please select at least one habit to track.', 'error');
      return;
    }

    const userId = `user_${Date.now()}`;
    const newUser = {
      id: userId,
      name: onboardingState.fullName,
      email: onboardingState.email,
      password: onboardingState.password,
      conditions: onboardingState.conditions,
      habits: onboardingState.selectedHabits,
      createdAt: new Date().toISOString()
    };

    const users = getExistingUsers();
    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));
    localStorage.setItem('currentUser', userId);

    // Initialize scalable LocalStorage schema
    localStorage.setItem('userPreferences', JSON.stringify({
      reminderSettings: { enabled: true, time: '08:00' },
      privacySettings: { shareWithCaregiver: false }
    }));

    localStorage.setItem('checkIns', JSON.stringify([]));
    localStorage.setItem('healthRecords', JSON.stringify([]));
    localStorage.setItem('moodRecords', JSON.stringify([]));
    localStorage.setItem('symptomRecords', JSON.stringify([]));
    localStorage.setItem('journalEntries', JSON.stringify([]));

    localStorage.setItem('streakState', JSON.stringify({
      currentStreak: 0,
      bestStreak: 0,
      graceDaysUsed: 0,
      relapseCount: 0,
      recoveryMode: false
    }));

    localStorage.setItem('achievements', JSON.stringify([]));

    if (typeof confetti === 'function') {
      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#0D9488', '#6366F1', '#10B981', '#F59E0B']
      });
    }

    showToast(`Welcome, ${newUser.name.split(' ')[0]}! Profile saved.`, 'success');

    setTimeout(() => {
      window.location.href = 'dashboard.html';
    }, 1000);
  });

  // =========================================================================
  // Step Progression Handler (Adaptive Width)
  // =========================================================================
  const authWrapper = document.querySelector('.auth-wrapper');
  const linkSwitchToRegister = document.getElementById('linkSwitchToRegister');

  if (linkSwitchToRegister) {
    linkSwitchToRegister.addEventListener('click', () => {
      tabRegister.click();
    });
  }

  function goToStep(stepNumber) {
    onboardingState.currentStep = stepNumber;

    // Apply wider container for Steps 2 & 3 so conditions and habits have plenty of room
    if (stepNumber === 2 || stepNumber === 3) {
      authWrapper.classList.add('step-wide');
    } else {
      authWrapper.classList.remove('step-wide');
    }

    step1Form.classList.toggle('active', stepNumber === 1);
    step2View.classList.toggle('active', stepNumber === 2);
    step3View.classList.toggle('active', stepNumber === 3);

    stepCountLabel.textContent = `Step ${stepNumber} of 3`;
    if (stepNumber === 1) stepNameLabel.textContent = 'Account Information';
    if (stepNumber === 2) stepNameLabel.textContent = 'Health Focus';
    if (stepNumber === 3) stepNameLabel.textContent = 'Habit Selection';

    progSegment1.className = `progress-segment ${stepNumber >= 1 ? 'completed active' : ''}`;
    progSegment2.className = `progress-segment ${stepNumber >= 2 ? 'completed active' : ''}`;
    progSegment3.className = `progress-segment ${stepNumber >= 3 ? 'completed active' : ''}`;

    if (window.lucide) {
      lucide.createIcons();
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // =========================================================================
  // Login Form Submission
  // =========================================================================
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const email = loginEmail.value.trim().toLowerCase();
    const password = loginPassword.value;

    const users = getExistingUsers();
    const foundUser = users.find(u => u.email.toLowerCase() === email);

    if (!foundUser) {
      loginEmailError.textContent = 'No account found with this email.';
      loginEmailError.classList.add('visible');
      loginEmail.classList.add('has-error');
      return;
    } else {
      loginEmailError.classList.remove('visible');
      loginEmail.classList.remove('has-error');
    }

    if (foundUser.password !== password) {
      loginPasswordError.textContent = 'Incorrect password.';
      loginPasswordError.classList.add('visible');
      loginPassword.classList.add('has-error');
      return;
    } else {
      loginPasswordError.classList.remove('visible');
      loginPassword.classList.remove('has-error');
    }

    localStorage.setItem('currentUser', foundUser.id);
    showToast(`Welcome back, ${foundUser.name}!`, 'success');

    setTimeout(() => {
      window.location.href = 'dashboard.html';
    }, 800);
  });

  // =========================================================================
  // Toast Helper
  // =========================================================================
  function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `auth-toast ${type}`;
    toast.innerHTML = `<span>${type === 'success' ? '✨' : '⚠️'}</span> <span>${message}</span>`;
    authToastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(8px)';
      setTimeout(() => toast.remove(), 300);
    }, 2600);
  }
});
