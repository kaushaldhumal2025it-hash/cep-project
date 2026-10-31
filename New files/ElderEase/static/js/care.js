const CareModule = {
  async request(url, options) {
    const response = await fetch(url, options);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Could not complete the request.');
    return data;
  },

  init() {
    this.bind('contactForm', e => this.saveContact(e));
    this.bind('medicineForm', e => this.saveMedicine(e));
    this.bind('bpForm', e => this.saveBP(e));
    this.bind('documentForm', e => this.uploadDocument(e));
    document.getElementById('voiceCommandBtn')?.addEventListener('click', () => this.startVoiceCommand());
    this.updateVoiceLanguage();
    this.loadAll();
  },

  bind(id, handler) {
    document.getElementById(id)?.addEventListener('submit', event => {
      event.preventDefault();
      handler(event);
    });
  },

  async loadAll() {
    try {
      const [contacts, medicines, readings, documents] = await Promise.all([
        this.request('/api/emergency-contacts'), this.request('/api/medicines'),
        this.request('/api/blood-pressure'), this.request('/api/documents')
      ]);
      this.renderContacts(contacts);
      this.renderMedicines(medicines);
      this.renderBP(readings);
      this.renderDocuments(documents);
    } catch (error) {
      ElderEase.showToast(error.message, true);
    }
  },

  async saveContact(event) {
    try {
      await this.request('/api/emergency-contacts', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(Object.fromEntries(new FormData(event.target))) });
      event.target.reset(); await this.loadAll(); ElderEase.showToast('Family contact saved.');
    } catch (error) { ElderEase.showToast(error.message, true); }
  },

  renderContacts(items) {
    const list = document.getElementById('contactList');
    const emergency = document.getElementById('emergencyFamilyContact');
    if (emergency && items[0]) emergency.innerHTML = `📞 <a href="tel:${ElderEase.escapeHtml(items[0].phone)}">${ElderEase.escapeHtml(items[0].name)}: ${ElderEase.escapeHtml(items[0].phone)}</a>`;
    if (list) list.innerHTML = items.length ? items.map(item => `<div class="care-row"><span><strong>${ElderEase.escapeHtml(item.name)}</strong><br>${ElderEase.escapeHtml(item.relationship || 'Family')} · ${ElderEase.escapeHtml(item.phone)}</span><button class="btn btn-danger" onclick="CareModule.deleteContact(${item.id})">Delete</button></div>`).join('') : '<p>No family contacts saved yet.</p>';
  },

  async deleteContact(id) {
    try { await this.request(`/api/emergency-contacts/${id}`, {method: 'DELETE'}); await this.loadAll(); } catch (error) { ElderEase.showToast(error.message, true); }
  },

  async saveMedicine(event) {
    try {
      await this.request('/api/medicines', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(Object.fromEntries(new FormData(event.target))) });
      event.target.reset(); await this.loadAll(); ElderEase.showToast('Medicine reminder added.');
    } catch (error) { ElderEase.showToast(error.message, true); }
  },

  renderMedicines(items) {
    const list = document.getElementById('medicineList');
    if (!list) return;
    list.innerHTML = items.length ? items.map(item => `<div class="care-row"><span><strong>${ElderEase.escapeHtml(item.name)}</strong> ${ElderEase.escapeHtml(item.dosage)}<br>⏰ ${ElderEase.escapeHtml(item.schedule_time)} ${item.taken_time ? `· Taken at ${ElderEase.escapeHtml(item.taken_time)}` : ''}</span><span><button class="btn btn-success" onclick="CareModule.takeMedicine(${item.id})">${item.taken_time ? '✓ Taken' : 'Mark taken'}</button><button class="btn btn-danger" onclick="CareModule.deleteMedicine(${item.id})">Delete</button></span></div>`).join('') : '<p>No medicines added yet.</p>';
  },

  async takeMedicine(id) {
    try { await this.request(`/api/medicines/${id}/taken`, {method: 'POST'}); await this.loadAll(); ElderEase.showToast('Medicine marked as taken.'); } catch (error) { ElderEase.showToast(error.message, true); }
  },

  async deleteMedicine(id) {
    try { await this.request(`/api/medicines/${id}`, {method: 'DELETE'}); await this.loadAll(); } catch (error) { ElderEase.showToast(error.message, true); }
  },

  async saveBP(event) {
    try {
      await this.request('/api/blood-pressure', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(Object.fromEntries(new FormData(event.target)))});
      event.target.reset(); await this.loadAll(); ElderEase.showToast('BP reading saved.');
    } catch (error) { ElderEase.showToast(error.message, true); }
  },

  renderBP(items) {
    const list = document.getElementById('bpList');
    if (list) list.innerHTML = items.length ? items.map(item => `<div class="care-row"><span><strong>${item.systolic}/${item.diastolic} mmHg</strong>${item.pulse ? ` · Pulse ${item.pulse}` : ''}</span><small>${new Date(item.measured_at).toLocaleString('en-IN')}</small></div>`).join('') : '<p>No readings saved yet.</p>';
  },

  async uploadDocument(event) {
    try {
      await this.request('/api/documents', {method: 'POST', body: new FormData(event.target)});
      event.target.reset(); await this.loadAll(); ElderEase.showToast('Document uploaded safely.');
    } catch (error) { ElderEase.showToast(error.message, true); }
  },

  renderDocuments(items) {
    const list = document.getElementById('documentList');
    if (list) list.innerHTML = items.length ? items.map(item => `<div class="care-row"><a href="/api/documents/${item.id}">📄 ${ElderEase.escapeHtml(item.original_name)}</a><button class="btn btn-danger" onclick="CareModule.deleteDocument(${item.id})">Delete</button></div>`).join('') : '<p>No documents uploaded yet.</p>';
  },

  async deleteDocument(id) {
    try { await this.request(`/api/documents/${id}`, {method: 'DELETE'}); await this.loadAll(); } catch (error) { ElderEase.showToast(error.message, true); }
  },

  startVoiceCommand() {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const status = document.getElementById('voiceCommandStatus');
    if (!Recognition) { status.textContent = 'Voice commands need Chrome or Edge. You can use the large buttons instead.'; return; }
    const recognition = new Recognition();
    recognition.lang = ElderEase.language === 'mr' ? 'mr-IN' : 'en-IN';
    status.textContent = ElderEase.language === 'mr' ? 'ऐकत आहे… आता आदेश द्या.' : 'Listening… say a command now.';
    recognition.onresult = event => {
      const phrase = event.results[0][0].transcript.toLowerCase();
      status.textContent = `Heard: “${phrase}”`;
      const marathi = ElderEase.language === 'mr';
      if (phrase.includes('medicine') || phrase.includes('औषध')) ElderEase.switchTab('care');
      else if (phrase.includes('document') || phrase.includes('file') || phrase.includes('कागदपत्र')) document.getElementById('documentForm')?.scrollIntoView({behavior: 'smooth'});
      else if (phrase.includes('family') || phrase.includes('call') || phrase.includes('कुटुंब')) document.getElementById('contactForm')?.scrollIntoView({behavior: 'smooth'});
      else if (phrase.includes('appointment') || phrase.includes('भेट')) ElderEase.switchTab('appointments');
      else ElderEase.speak(marathi ? 'मला समजले नाही. औषध, कागदपत्र किंवा कुटुंब म्हणा.' : 'I did not understand. Try saying medicines, documents, or family.');
    };
    recognition.onerror = () => { status.textContent = 'I could not hear that. Please try again.'; };
    recognition.start();
  }
};

CareModule.updateVoiceLanguage = function() {
  const status = document.getElementById('voiceCommandStatus');
  if (status) status.textContent = ElderEase.language === 'mr'
    ? '“औषध”, “कागदपत्र” किंवा “कुटुंब” असे म्हणा.'
    : 'Say “medicines”, “documents”, or “family”.';
};

window.CareModule = CareModule;

document.addEventListener('DOMContentLoaded', () => CareModule.init());
