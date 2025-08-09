export class ModalManager {
  constructor() {
    this.setupEventListeners();
  }

  setupEventListeners() {
    const feedbackHeaderBtn = document.getElementById('feedbackHeaderBtn');
    const feedbackModal = document.getElementById('feedbackModal');
    const modalClose = document.getElementById('modalClose');
    const cancelFeedback = document.getElementById('cancelFeedback');
    const feedbackForm = document.getElementById('feedbackForm');
    const successClose = document.getElementById('successClose');

    if (feedbackHeaderBtn) {
      feedbackHeaderBtn.addEventListener('click', () => this.openModal());
    }

    if (modalClose) {
      modalClose.addEventListener('click', () => this.closeModal());
    }

    if (cancelFeedback) {
      cancelFeedback.addEventListener('click', () => this.closeModal());
    }

    if (successClose) {
      successClose.addEventListener('click', () => this.closeModal());
    }

    if (feedbackForm) {
      feedbackForm.addEventListener('submit', (e) => this.handleSubmit(e));
    }

    if (feedbackModal) {
      feedbackModal.addEventListener('click', (e) => {
        if (e.target === feedbackModal) {
          this.closeModal();
        }
      });
    }
  }

  openModal() {
    const modal = document.getElementById('feedbackModal');
    const form = document.getElementById('feedbackForm');
    const success = document.getElementById('feedbackSuccess');
    
    if (modal) {
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
  }

  closeModal() {
    const modal = document.getElementById('feedbackModal');
    if (modal) {
      modal.classList.remove('show');
      document.body.style.overflow = '';
    }
  }

  resetForm() {
    const form = document.getElementById('feedbackForm');
    if (form) {
      form.reset();
    }
  }

  async handleSubmit(event) {
    event.preventDefault();
    
    const feedbackData = {
      type: document.getElementById('feedbackType').value,
      subject: document.getElementById('feedbackSubject').value,
      message: document.getElementById('feedbackMessage').value,
      email: document.getElementById('feedbackEmail').value,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      extensionVersion: '1.0.4'
    };

    try {
      const submitBtn = document.querySelector('.btn-submit');
      const originalText = submitBtn.textContent;
      submitBtn.textContent = '📤 Sending...';
      submitBtn.disabled = true;

      await this.sendFeedback(feedbackData);
      this.showSuccess();
      
    } catch (error) {
      console.error('Feedback send error:', error);
      alert('An error occurred while sending feedback. Please try again later.');
      
      const submitBtn = document.querySelector('.btn-submit');
      submitBtn.textContent = '📤 Send';
      submitBtn.disabled = false;
    }
  }

  async sendFeedback(feedbackData) {
    try {
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

      const response = await fetch(FORMSPREE_ENDPOINT, {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json'
        }
      });

      if (response.ok) {
        const existingFeedback = JSON.parse(localStorage.getItem('yulaf_feedback') || '[]');
        existingFeedback.push({ ...feedbackData, emailSent: true, method: 'formspree' });
        localStorage.setItem('yulaf_feedback', JSON.stringify(existingFeedback));
        
        return { success: true, method: 'formspree' };
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Formspree submission failed');
      }
    } catch (error) {
      const existingFeedback = JSON.parse(localStorage.getItem('yulaf_feedback') || '[]');
      existingFeedback.push({ ...feedbackData, emailSent: false, emailError: error.message });
      localStorage.setItem('yulaf_feedback', JSON.stringify(existingFeedback));
      
      throw new Error('Error occurred while sending email: ' + error.message);
    }
  }

  getFeedbackTypeText(type) {
    const types = {
      'bug': 'Bug Report',
      'feature': 'Feature Request',
      'improvement': 'Improvement',
      'general': 'General Opinion',
      'compliment': 'Compliment'
    };
    return types[type] || type;
  }

  getFeedbackTypeEmoji(type) {
    const emojis = {
      'bug': '🐛',
      'feature': '💡',
      'improvement': '🚀',
      'general': '💬',
      'compliment': '👍'
    };
    return emojis[type] || '📝';
  }

  showSuccess() {
    const form = document.getElementById('feedbackForm');
    const success = document.getElementById('feedbackSuccess');
    
    if (form && success) {
      form.style.display = 'none';
      success.style.display = 'block';
    }
  }
}