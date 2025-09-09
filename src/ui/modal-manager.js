export class ModalManager {
  constructor() {
    this.setupEventListeners();
  }

  /** 🔹 Event listener kurulum */
  setupEventListeners() {
    const modal = document.getElementById('feedbackModal');
    const form = document.getElementById('feedbackForm');

    this.bindClick('feedbackHeaderBtn', () => this.openModal());
    this.bindClick('modalClose', () => this.closeModal());
    this.bindClick('cancelFeedback', () => this.closeModal());
    this.bindClick('successClose', () => this.closeModal());

    if (form) {
      form.addEventListener('submit', (e) => this.handleSubmit(e));
    }

    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) this.closeModal();
      });
    }
  }

  /** 🔹 Yardımcı click binder */
  bindClick(id, handler) {
    const el = document.getElementById(id);
    if (el) el.addEventListener('click', handler);
  }

  /** 🔹 Modal aç */
  openModal() {
    const modal = document.getElementById('feedbackModal');
    if (!modal) return;

    const form = document.getElementById('feedbackForm');
    const success = document.getElementById('feedbackSuccess');

    if (form) form.style.display = 'block';
    if (success) success.style.display = 'none';

    this.resetForm();
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';

    setTimeout(() => {
      const firstInput = modal.querySelector('select, input, textarea');
      if (firstInput) firstInput.focus();
    }, 300);
  }

  /** 🔹 Modal kapat */
  closeModal() {
    const modal = document.getElementById('feedbackModal');
    if (modal) {
      modal.classList.remove('show');
      document.body.style.overflow = '';
    }
  }

  /** 🔹 Form reset */
  resetForm() {
    const form = document.getElementById('feedbackForm');
    if (form) form.reset();
  }

  /** 🔹 Submit handler */
  async handleSubmit(event) {
    event.preventDefault();

    const feedbackData = {
      type: document.getElementById('feedbackType')?.value,
      subject: document.getElementById('feedbackSubject')?.value,
      message: document.getElementById('feedbackMessage')?.value,
      email: document.getElementById('feedbackEmail')?.value,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      extensionVersion: '1.0.4'
    };

    const submitBtn = document.querySelector('.btn-submit');
    if (!submitBtn) return;

    const originalText = submitBtn.textContent;
    submitBtn.textContent = '📤 Sending...';
    submitBtn.disabled = true;

    try {
      await this.sendFeedback(feedbackData);
      this.showSuccess();
    } catch (err) {
      console.error('Feedback send error:', err);
      alert('An error occurred while sending feedback. Please try again later.');
      submitBtn.textContent = originalText;
      submitBtn.disabled = false;
    }
  }

  /** 🔹 Feedback gönder */
  async sendFeedback(feedbackData) {
    const FORMSPREE_ENDPOINT = 'https://formspree.io/f/xdkdllvl';

    const formData = new FormData();
    formData.append('feedback_type', this.getFeedbackTypeText(feedbackData.type));
    formData.append('subject', feedbackData.subject);
    formData.append('message', feedbackData.message);
    formData.append('user_email', feedbackData.email || 'Not specified');
    formData.append('timestamp', new Date(feedbackData.timestamp).toLocaleString('tr-TR'));
    formData.append('extension_version', feedbackData.extensionVersion);
    formData.append('user_agent', feedbackData.userAgent);

    const formattedMessage = `
${this.getFeedbackTypeEmoji(feedbackData.type)} Feedback Type: ${this.getFeedbackTypeText(feedbackData.type)}
📝 Subject: ${feedbackData.subject}

💬 Message:
${feedbackData.message}

---
📧 User Email: ${feedbackData.email || 'Not specified'}
📅 Date: ${new Date(feedbackData.timestamp).toLocaleString('en-US')}
🔧 Extension Version: ${feedbackData.extensionVersion}
🌐 Browser: ${feedbackData.userAgent}
    `.trim();

    formData.append('formatted_message', formattedMessage);

    try {
      const response = await fetch(FORMSPREE_ENDPOINT, {
        method: 'POST',
        body: formData,
        headers: { Accept: 'application/json' }
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Formspree submission failed');
      }

      this.saveFeedbackToLocal(feedbackData, { emailSent: true, method: 'formspree' });
      return { success: true };
    } catch (err) {
      this.saveFeedbackToLocal(feedbackData, { emailSent: false, emailError: err.message });
      throw new Error('Error occurred while sending email: ' + err.message);
    }
  }

  /** 🔹 LocalStorage log */
  saveFeedbackToLocal(feedbackData, extra) {
    const existing = JSON.parse(localStorage.getItem('yulaf_feedback') || '[]');
    existing.push({ ...feedbackData, ...extra });
    localStorage.setItem('yulaf_feedback', JSON.stringify(existing));
  }

  /** 🔹 Tür => Text */
  getFeedbackTypeText(type) {
    const map = {
      bug: 'Bug Report',
      feature: 'Feature Request',
      improvement: 'Improvement',
      general: 'General Opinion',
      compliment: 'Compliment'
    };
    return map[type] || type;
  }

  /** 🔹 Tür => Emoji */
  getFeedbackTypeEmoji(type) {
    const map = {
      bug: '🐛',
      feature: '💡',
      improvement: '🚀',
      general: '💬',
      compliment: '👍'
    };
    return map[type] || '📝';
  }

  /** 🔹 Başarı ekranı */
  showSuccess() {
    const form = document.getElementById('feedbackForm');
    const success = document.getElementById('feedbackSuccess');
    if (form && success) {
      form.style.display = 'none';
      success.style.display = 'block';
    }
  }
}
