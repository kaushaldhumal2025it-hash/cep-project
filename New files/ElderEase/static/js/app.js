/**
 * ElderEase - Main Application Controller
 * Handles navigation tabs, accessibility font-scaling, contrast mode,
 * toast alerts, and dashboard live summary sync.
 */

const ElderEase = {
  activeTab: 'home',
  currentDate: new Date(),
  userName: 'Dadaji',
  language: new URLSearchParams(window.location.search).get('language') === 'mr'
    ? 'mr'
    : (localStorage.getItem('elderease_language') || 'en'),
  translations: {
    en: {
      'nav.home': 'Home', 'nav.appointments': 'Appointments', 'nav.nutrition': 'Nutrition & Water',
      'nav.tutorials': 'Tutorials', 'nav.care': 'My Care', 'header.contrast': 'High Contrast',
      'header.emergency': 'Emergency Call', 'home.prompt': 'How can we help you today? Tap any of the big buttons below.',
      'appointments.title': 'Doctor Appointment Calendar', 'tutorials.title': 'Tutorials',
      'care.title': 'My Care Centre', 'care.subtitle': 'Keep important health information together. Ask a family member to help if needed.'
    },
    mr: {
      'nav.home': 'मुख्यपृष्ठ', 'nav.appointments': 'भेटी', 'nav.nutrition': 'आहार आणि पाणी',
      'nav.tutorials': 'मार्गदर्शक', 'nav.care': 'माझी काळजी', 'header.contrast': 'उच्च कॉन्ट्रास्ट',
      'header.emergency': 'आपत्कालीन कॉल', 'home.prompt': 'आज आम्ही तुमची कशी मदत करू शकतो? खालील मोठ्या बटणावर टॅप करा.',
      'appointments.title': 'डॉक्टरांची भेटी', 'tutorials.title': 'मार्गदर्शक',
      'care.title': 'माझे आरोग्य केंद्र', 'care.subtitle': 'तुमची महत्त्वाची आरोग्य माहिती एकाच ठिकाणी ठेवा. गरज असल्यास कुटुंबाची मदत घ्या.'
    },
    text: {
      'Simple care for everyday life': 'दररोजच्या जीवनासाठी सोपी काळजी',
      'Text:': 'अक्षर:', 'High Contrast': 'उच्च कॉन्ट्रास्ट', 'Emergency Call': 'आपत्कालीन कॉल',
      'Change Name': 'नाव बदला', 'Appointments': 'भेटी', 'Nutrition': 'आहार',
      'Water Tracker': 'पाणी नोंद', 'Tutorials': 'मार्गदर्शक',
      'Open Calendar ➔': 'दिनदर्शिका उघडा ➔', 'View Meals ➔': 'आहार पहा ➔',
      'Track Water ➔': 'पाणी नोंदवा ➔', 'Open Tutorials ➔': 'मार्गदर्शक उघडा ➔',
      "Today's Overview": 'आजचा आढावा', 'A quick look at your schedule and daily health progress': 'तुमच्या वेळापत्रकाचा आणि आरोग्य प्रगतीचा आढावा',
      'Upcoming Doctor Visit': 'आगामी डॉक्टरांची भेट', 'Schedule': 'वेळापत्रक',
      "Today's Nutrition & Water": 'आजचा आहार आणि पाणी', 'Daily Health': 'दैनंदिन आरोग्य',
      'Loading upcoming appointment...': 'आगामी भेटीची माहिती लोड होत आहे...',
      "Loading today's nutrition...": 'आजच्या आहाराची माहिती लोड होत आहे...',
      'Elder Safety Tip:': 'ज्येष्ठांसाठी सुरक्षा सूचना:',
      'Read UPI Safety Rules': 'UPI सुरक्षा नियम पहा',
      'Doctor Appointment Calendar': 'डॉक्टरांची भेटीची दिनदर्शिका',
      'Select a date to view or schedule doctor appointments.': 'भेट पाहण्यासाठी किंवा ठरवण्यासाठी तारीख निवडा.',
      'Add New Appointment': 'नवीन भेट जोडा', 'Previous': 'मागील', 'Today': 'आज', 'Next': 'पुढील',
      'SELECTED DATE': 'निवडलेली तारीख', 'All Upcoming Visits at a Glance': 'सर्व आगामी भेटी',
      'Previous Day': 'मागील दिवस', 'Jump to Today': 'आजच्या दिवसावर जा', 'Next Day ▶': 'पुढील दिवस ▶',
      'Daily Water Intake': 'दैनंदिन पाणी सेवन', 'Remove 1 Glass': '१ ग्लास कमी करा',
      'Today’s Meals': 'आजचे जेवण', "Today's Meals": 'आजचे जेवण',
      'Tutorials': 'मार्गदर्शक',
      'Read Step Aloud': 'पायरी मोठ्याने ऐका', 'Close Guide': 'मार्गदर्शक बंद करा',
      'Previous Step': 'मागील पायरी', 'Next Step ▶': 'पुढील पायरी ▶',
      'My Care Centre': 'माझे आरोग्य केंद्र', 'Start voice command': 'आवाजाचा आदेश सुरू करा',
      'Family emergency contact': 'कुटुंबाचा आपत्कालीन संपर्क', 'Save family number': 'कुटुंबाचा क्रमांक जतन करा',
      'Medicine tracker': 'औषध नोंद', 'Add medicine reminder': 'औषधाची आठवण जोडा',
      'Blood pressure checker': 'रक्तदाब तपासणी', 'Save BP reading': 'रक्तदाब नोंदवा',
      'Important documents': 'महत्त्वाची कागदपत्रे', 'Upload document': 'कागदपत्र अपलोड करा',
      'Gentle daily exercises': 'दररोजचे सोपे व्यायाम', 'Read exercises aloud': 'व्यायाम मोठ्याने ऐका',
      'Emergency Helplines': 'आपत्कालीन मदत क्रमांक', 'MEDICAL AMBULANCE': 'रुग्णवाहिका',
      'NATIONAL SENIOR CITIZEN HELPLINE': 'राष्ट्रीय ज्येष्ठ नागरिक मदत', 'NATIONAL CYBER CRIME / UPI FRAUD': 'सायबर गुन्हा / UPI फसवणूक',
      'FAMILY CONTACT (EMERGENCY)': 'कुटुंबाचा संपर्क (आपत्कालीन)', 'WOMEN HELPLINE': 'महिला मदत क्रमांक'
      , 'Family emergency contact': 'कुटुंबाचा आपत्कालीन संपर्क',
      'Medicine name': 'औषधाचे नाव', 'Dose (for example, 1 tablet)': 'मात्रा (उदा. १ गोळी)',
      'Take at': 'वेळ', 'Blood pressure checker': 'रक्तदाब तपासणी',
      'Important documents': 'महत्त्वाची कागदपत्रे', 'Gentle daily exercises': 'दररोजचे सोपे व्यायाम',
      'No family contacts saved yet.': 'कुटुंबाचे संपर्क अजून जतन केलेले नाहीत.',
      'No medicines added yet.': 'अजून औषधे जोडलेली नाहीत.', 'No readings saved yet.': 'अजून नोंदी जतन केलेल्या नाहीत.',
      'No documents uploaded yet.': 'अजून कागदपत्रे अपलोड केलेली नाहीत.',
      'Start voice command': 'आवाजाचा आदेश सुरू करा', 'Medicines': 'औषधे', 'Documents': 'कागदपत्रे', 'Family': 'कुटुंब',
      'Save family number': 'कुटुंबाचा क्रमांक जतन करा', 'Phone number': 'फोन क्रमांक',
      'Relationship (optional)': 'नाते (ऐच्छिक)', 'Name (for example, Meena)': 'नाव (उदा. मीना)',
      'Upper (systolic)': 'वरचा (सिस्टोलिक)', 'Lower (diastolic)': 'खालचा (डायस्टोलिक)', 'Pulse (optional)': 'नाडी (ऐच्छिक)',
      'Category (prescription, report...)': 'प्रकार (प्रिस्क्रिप्शन, रिपोर्ट...)'
      , 'Enter the reading from your BP machine. This is a log, not a diagnosis.': 'तुमच्या BP मशीनवरील नोंद भरा. ही नोंद आहे, निदान नाही.',
      'Store reports and prescriptions on this device. Maximum file size: 10 MB.': 'रिपोर्ट आणि प्रिस्क्रिप्शन या डिव्हाइसवर जतन करा. कमाल फाइल आकार: १० MB.',
      'Stop if you feel pain, dizziness, or breathlessness. Use a sturdy chair and ask for help.': 'वेदना, चक्कर किंवा श्वास घेण्यास त्रास झाल्यास थांबा. मजबूत खुर्ची वापरा आणि मदत घ्या.',
      'Chair march:': 'खुर्चीवर चालणे:', 'Sit tall and lift one knee at a time for 1 minute.': 'सरळ बसा आणि एकावेळी एक गुडघा १ मिनिट उचला.',
      'Ankle circles:': 'घोट्यांची गोल हालचाल:', 'Move each ankle slowly 10 times in each direction.': 'प्रत्येक घोटा प्रत्येक दिशेने १० वेळा हळू फिरवा.',
      'Shoulder rolls:': 'खांदे फिरवणे:', 'Roll shoulders gently 10 times, breathing slowly.': 'हळू श्वास घेत खांदे १० वेळा अलगद फिरवा.',
      'Supported sit-to-stand:': 'आधार घेऊन उठणे-बसणे:', 'Hold a chair and stand up, then sit down 5 times.': 'खुर्चीचा आधार घेऊन ५ वेळा उठा आणि बसा.',
      'Choose File': 'फाइल निवडा', 'Family': 'कुटुंब'
    }
  },

  init() {
    this.setupNavigation();
    this.setupAccessibilityControls();
    this.setupEmergencyModal();
    this.setupWelcomeBanner();
    this.setupLanguage();
    this.refreshDashboard();

    // Check URL hash for direct tab linking
    const hash = window.location.hash.replace('#', '');
    if (['home', 'appointments', 'nutrition', 'tutorials', 'care'].includes(hash)) {
      this.switchTab(hash);
    }
  },

  // -------------------------------------------------------------
  // Navigation
  // -------------------------------------------------------------
  setupNavigation() {
    const tabs = document.querySelectorAll('.nav-tab-btn');
    tabs.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetTab = btn.getAttribute('data-tab');
        this.switchTab(targetTab);
      });
    });

    // Quick action cards on dashboard
    document.querySelectorAll('[data-nav-target]').forEach(el => {
      el.addEventListener('click', (e) => {
        const target = el.getAttribute('data-nav-target');
        if (target) {
          this.switchTab(target);
        }
      });
    });
  },

  switchTab(tabId) {
    this.activeTab = tabId;
    window.location.hash = tabId;

    // Update buttons
    document.querySelectorAll('.nav-tab-btn').forEach(btn => {
      const isTarget = btn.getAttribute('data-tab') === tabId;
      btn.classList.toggle('active', isTarget);
      btn.setAttribute('aria-selected', isTarget ? 'true' : 'false');
    });

    // Update panels
    document.querySelectorAll('.tab-panel').forEach(panel => {
      const isTarget = panel.id === `tab-${tabId}`;
      panel.classList.toggle('active', isTarget);
    });

    // Trigger tab specific refresh
    if (tabId === 'home') {
      this.refreshDashboard();
    } else if (tabId === 'appointments' && window.AppointmentModule) {
      window.AppointmentModule.refreshCalendar();
    } else if (tabId === 'nutrition' && window.NutritionModule) {
      window.NutritionModule.loadToday();
    } else if (tabId === 'tutorials' && window.UPIModule) {
      // Keep state or reset if needed
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  // -------------------------------------------------------------
  // Accessibility Font Size & Contrast
  // -------------------------------------------------------------
  setupAccessibilityControls() {
    const savedFontSize = localStorage.getItem('elderease_fontsize') || 'font-normal';
    document.body.className = savedFontSize;
    this.updateFontButtonActive(savedFontSize);

    document.querySelectorAll('.font-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const sizeClass = btn.getAttribute('data-size');
        document.body.classList.remove('font-normal', 'font-large', 'font-xlarge');
        document.body.classList.add(sizeClass);
        localStorage.setItem('elderease_fontsize', sizeClass);
        this.updateFontButtonActive(sizeClass);
        this.showToast(`Text size changed to ${btn.innerText.trim()}`);
      });
    });

    // Contrast Toggle
    const contrastBtn = document.getElementById('toggleContrastBtn');
    if (contrastBtn) {
      const isContrast = localStorage.getItem('elderease_contrast') === 'true';
      if (isContrast) document.body.classList.add('high-contrast-mode');

      contrastBtn.addEventListener('click', () => {
        document.body.classList.toggle('high-contrast-mode');
        const active = document.body.classList.contains('high-contrast-mode');
        localStorage.setItem('elderease_contrast', active);
        this.showToast(active ? "High Contrast Mode Turned On" : "Standard Mode Restored");
      });
    }
  },

  setupLanguage() {
    document.querySelectorAll('.language-btn').forEach(button => {
      button.classList.toggle('active', button.dataset.language === this.language);
      button.addEventListener('click', () => this.setLanguage(button.dataset.language));
    });
    this.applyLanguage();
  },

  setLanguage(language) {
    this.language = language === 'mr' ? 'mr' : 'en';
    localStorage.setItem('elderease_language', this.language);
    window.location.href = `/?language=${this.language}#${this.activeTab}`;
  },

  applyLanguage() {
    const strings = this.translations[this.language];
    document.documentElement.lang = this.language === 'mr' ? 'mr' : 'en';
    document.querySelectorAll('[data-i18n]').forEach(element => {
      if (strings[element.dataset.i18n]) element.textContent = strings[element.dataset.i18n];
    });
    this.translateVisibleText();
    if (!this.languageObserver) {
      this.languageObserver = new MutationObserver(() => {
        if (this.language === 'mr') this.translateVisibleText();
      });
      this.languageObserver.observe(document.body, { childList: true, subtree: true });
    }
    document.querySelectorAll('.language-btn').forEach(button => {
      button.classList.toggle('active', button.dataset.language === this.language);
    });
    const contrast = document.getElementById('toggleContrastBtn');
    const emergency = document.getElementById('openEmergencyBtn');
    if (contrast) contrast.lastChild.textContent = ` ${strings['header.contrast']}`;
    if (emergency) emergency.lastChild.textContent = ` ${strings['header.emergency']}`;
  },

  translateVisibleText() {
    const mr = this.language === 'mr';
    const dictionary = this.translations.text;
    document.querySelectorAll('input[placeholder], textarea[placeholder], [title]').forEach(element => {
      const property = element.hasAttribute('placeholder') ? 'placeholder' : 'title';
      const value = element.getAttribute(property);
      if (mr && dictionary[value]) element.dataset.englishValue = value, element.setAttribute(property, dictionary[value]);
      if (!mr && element.dataset.englishValue) element.setAttribute(property, element.dataset.englishValue);
    });
    if (!mr) return;
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(node => {
      if (!node.__elderEaseEnglishText) node.__elderEaseEnglishText = node.nodeValue;
      const source = node.__elderEaseEnglishText.trim();
      if (mr) {
        let translated = node.__elderEaseEnglishText;
        Object.keys(dictionary).sort((a, b) => b.length - a.length).forEach(key => {
          translated = translated.split(key).join(dictionary[key]);
        });
        node.nodeValue = translated;
      }
      if (!mr && node.__elderEaseEnglishText) node.nodeValue = node.__elderEaseEnglishText;
    });
  },

  updateFontButtonActive(sizeClass) {
    document.querySelectorAll('.font-btn').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-size') === sizeClass);
    });
  },

  speak(text) {
    if (!('speechSynthesis' in window)) {
      this.showToast('Voice playback is not supported on this browser.', true);
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.85;
    utterance.lang = this.language === 'mr' ? 'mr-IN' : 'en-IN';
    window.speechSynthesis.speak(utterance);
  },

  // -------------------------------------------------------------
  // Dashboard Live Summary Sync
  // -------------------------------------------------------------
  async refreshDashboard() {
    this.updateGreeting();

    try {
      const res = await fetch('/api/dashboard-summary');
      if (!res.ok) return;
      const data = await res.json();

      // 1. Update Upcoming Appointment Box
      const upcomingContainer = document.getElementById('dashUpcomingAppContainer');
      if (upcomingContainer) {
        if (data.upcoming_appointment) {
          const app = data.upcoming_appointment;
          // Format date nicely
          const dateObj = new Date(app.date);
          const formattedDate = dateObj.toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
          });

          upcomingContainer.innerHTML = `
            <div class="upcoming-doctor-name">🩺 ${this.escapeHtml(app.doctor_name)}</div>
            <div class="upcoming-detail-row">🏥 ${this.escapeHtml(app.hospital)}</div>
            <div class="upcoming-detail-row">📅 ${formattedDate} • ⏰ ${this.escapeHtml(app.time)}</div>
            <div class="app-reason-badge">📋 ${this.escapeHtml(app.reason)}</div>
            ${app.notes ? `<div class="app-notes-box">💡 Note: ${this.escapeHtml(app.notes)}</div>` : ''}
            <div style="margin-top: 16px;">
              <button class="btn btn-primary" onclick="ElderEase.switchTab('appointments')">
                📅 View in Calendar
              </button>
            </div>
          `;
        } else {
          upcomingContainer.innerHTML = `
            <div class="empty-summary-box">
              <p>No upcoming appointments found.</p>
              <p style="margin-top: 8px;">Stay healthy and keep smiling!</p>
              <button class="btn btn-primary" style="margin-top: 14px;" onclick="ElderEase.openNewAppointment()">
                ➕ Schedule New Appointment
              </button>
            </div>
          `;
        }
      }

      // 2. Update Nutrition & Water Summary Box
      const nutrSummary = document.getElementById('dashNutritionContainer');
      if (nutrSummary && data.nutrition) {
        const n = data.nutrition;
        const waterCount = n.water_glasses;
        const waterTarget = n.target_water || 8;

        // Render water drop icons (up to 8)
        let dropsHtml = '';
        for (let i = 1; i <= waterTarget; i++) {
          if (i <= waterCount) {
            dropsHtml += `<span title="Glass ${i}">💧</span>`;
          } else {
            dropsHtml += `<span title="Pending" style="opacity: 0.35;">○</span>`;
          }
        }

        nutrSummary.innerHTML = `
          <div style="font-size: 1.25rem; font-weight: 800; margin-bottom: 8px;">
            Meals Logged: <span style="color: var(--color-primary);">${n.meals_eaten} of ${n.meals_total}</span>
          </div>
          <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 14px;">
            <span class="meal-status-tag ${n.breakfast ? 'done' : 'pending'}">${n.breakfast ? '✓ Breakfast Done' : '○ Breakfast'}</span>
            <span class="meal-status-tag ${n.lunch ? 'done' : 'pending'}">${n.lunch ? '✓ Lunch Done' : '○ Lunch'}</span>
            <span class="meal-status-tag ${n.dinner ? 'done' : 'pending'}">${n.dinner ? '✓ Dinner Done' : '○ Dinner'}</span>
          </div>

          <div style="font-size: 1.25rem; font-weight: 800; margin-top: 16px;">
            Water Intake: <span class="water-badge">${waterCount} / ${waterTarget} Glasses</span>
          </div>
          <div class="mini-water-bar">
            ${dropsHtml}
          </div>

          <div style="display: flex; gap: 12px; margin-top: 16px; flex-wrap: wrap;">
            <button class="btn btn-success" onclick="ElderEase.quickAddWater()">
              💧 + Add 1 Glass
            </button>
            <button class="btn btn-secondary" onclick="ElderEase.switchTab('nutrition')">
              🍎 Open Nutrition Tracker
            </button>
          </div>
        `;
      }
    } catch (err) {
      console.error('Error fetching dashboard summary:', err);
    }
  },

  updateGreeting() {
    const greetingEl = document.getElementById('dashboardGreeting');
    if (!greetingEl) return;

    const hour = new Date().getHours();
    let timeGreeting = 'GOOD MORNING 👋';
    if (hour >= 12 && hour < 17) {
      timeGreeting = 'GOOD AFTERNOON 👋';
    } else if (hour >= 17) {
      timeGreeting = 'GOOD EVENING 👋';
    }

    greetingEl.innerText = `${timeGreeting}, ${this.userName}`;
  },

  async quickAddWater() {
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const res = await fetch('/api/nutrition/water', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: todayStr, delta: 1 })
      });
      const data = await res.json();
      if (data.success) {
        this.showToast(`💧 Great job! You have drank ${data.water_glasses} glasses today.`);
        this.refreshDashboard();
        if (window.NutritionModule) {
          window.NutritionModule.loadToday();
        }
      }
    } catch (e) {
      this.showToast('Could not record water intake. Please try again.', true);
    }
  },

  openNewAppointment() {
    this.switchTab('appointments');
    if (window.AppointmentModule) {
      window.AppointmentModule.openAddModal();
    }
  },

  // -------------------------------------------------------------
  // Welcome & Profile Switcher
  // -------------------------------------------------------------
  setupWelcomeBanner() {
    const editNameBtn = document.getElementById('editSeniorNameBtn');
    if (editNameBtn) {
      editNameBtn.addEventListener('click', () => {
        const newName = prompt('Please enter your name:', this.userName);
        if (newName && newName.trim()) {
          this.userName = newName.trim();
          localStorage.setItem('elderease_username', this.userName);
          this.updateGreeting();
          this.showToast(`Welcome, ${this.userName}!`);
        }
      });
    }

    const savedName = localStorage.getItem('elderease_username');
    if (savedName) {
      this.userName = savedName;
    }
  },

  // -------------------------------------------------------------
  // Emergency Helpline Modal
  // -------------------------------------------------------------
  setupEmergencyModal() {
    const modal = document.getElementById('emergencyModal');
    const openBtn = document.getElementById('openEmergencyBtn');
    const closeBtn = document.getElementById('closeEmergencyModalBtn');

    if (openBtn && modal) {
      openBtn.addEventListener('click', () => modal.classList.add('active'));
    }
    if (closeBtn && modal) {
      closeBtn.addEventListener('click', () => modal.classList.remove('active'));
    }
  },

  // -------------------------------------------------------------
  // Feedback Toast Helper
  // -------------------------------------------------------------
  showToast(message, isError = false) {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${isError ? 'toast-error' : ''}`;
    toast.innerHTML = `
      <span>${isError ? '⚠️' : '✅'} ${this.escapeHtml(message)}</span>
      <button style="background:transparent; border:none; color:#fff; font-size:1.2rem; cursor:pointer;" onclick="this.parentElement.remove()">✕</button>
    `;

    container.appendChild(toast);
    setTimeout(() => {
      toast.remove();
    }, 4500);
  },

  escapeHtml(text) {
    if (!text) return '';
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
};

document.addEventListener('DOMContentLoaded', () => {
  ElderEase.init();
});
