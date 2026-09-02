/**
 * ChronicOne — Express Backend Server
 * Simple, readable, and human-friendly backend for chronic habit tracking.
 */

const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware for parsing JSON data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve all frontend files from the 'public' folder
app.use(express.static(path.join(__dirname, 'public')));

// In-Memory Data Store (Easy to understand and explain)
const users = [];
const checkIns = [];

// ============================================================================
// 1. AUTHENTICATION ROUTES
// ============================================================================

// Register new user
app.post('/api/register', (req, res) => {
  const { name, email, password, conditions, habits } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required.' });
  }

  const existingUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (existingUser) {
    return res.status(409).json({ error: 'An account with this email already exists.' });
  }

  const newUser = {
    id: `user_${Date.now()}`,
    name,
    email: email.toLowerCase(),
    password,
    conditions: conditions || [],
    habits: habits || [],
    createdAt: new Date().toISOString()
  };

  users.push(newUser);
  res.status(201).json({ message: 'User registered successfully', user: newUser });
});

// Login user
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;

  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (!user) {
    return res.status(404).json({ error: 'No account found with this email.' });
  }

  if (user.password !== password) {
    return res.status(401).json({ error: 'Incorrect password.' });
  }

  res.status(200).json({ message: 'Login successful', user });
});

// ============================================================================
// 2. STREAK ENGINE & RELAPSE LOGIC (Anti-Cheat Algorithmic Challenge)
// ============================================================================

app.post('/api/checkin/:userId', (req, res) => {
  const { userId } = req.params;
  const { date, status, completedHabits, notes } = req.body;

  const newCheckIn = {
    id: `chk_${Date.now()}`,
    userId,
    date: date || new Date().toISOString().split('T')[0],
    status: status || 'FULL', // 'FULL', 'PARTIAL', 'REST_DAY', 'MISSED'
    completedHabits: completedHabits || [],
    notes: notes || '',
    createdAt: new Date().toISOString()
  };

  checkIns.push(newCheckIn);

  // Calculate streak with grace days & relapse logic
  const userHistory = checkIns.filter(c => c.userId === userId);
  const streakStats = calculateStreak(userHistory);

  res.status(201).json({ checkIn: newCheckIn, streakStats });
});

app.get('/api/streak/:userId', (req, res) => {
  const { userId } = req.params;
  const userHistory = checkIns.filter(c => c.userId === userId);
  const streakStats = calculateStreak(userHistory);
  res.status(200).json(streakStats);
});

// Helper function: Streak State Machine
function calculateStreak(history) {
  let currentStreak = 0;
  let bestStreak = 0;
  let graceDaysUsed = 0;
  const maxGraceDays = 2;
  let consecutiveMisses = 0;
  let inRecoveryMode = false;

  history.forEach(entry => {
    if (entry.status === 'FULL') {
      currentStreak += 1;
      consecutiveMisses = 0;
    } else if (entry.status === 'PARTIAL') {
      currentStreak += 1; // Partial completion counts towards streak
      consecutiveMisses = 0;
    } else if (entry.status === 'REST_DAY') {
      if (graceDaysUsed < maxGraceDays) {
        graceDaysUsed += 1; // Grace day used, streak is protected!
      } else {
        consecutiveMisses += 1;
      }
    } else {
      consecutiveMisses += 1;
      if (consecutiveMisses >= 2) {
        currentStreak = 0; // Relapse resets active streak
        inRecoveryMode = true;
      }
    }

    if (currentStreak > bestStreak) {
      bestStreak = currentStreak;
    }
  });

  return {
    currentStreak,
    bestStreak,
    graceDaysUsed,
    graceDaysRemaining: Math.max(0, maxGraceDays - graceDaysUsed),
    inRecoveryMode
  };
}

// Start the Server
app.listen(PORT, () => {
  console.log(`✅ ChronicOne server running at: http://localhost:${PORT}`);
});
