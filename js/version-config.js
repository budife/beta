/**
 * Version Configuration System
 * Manages application version and build information
 */

function generateBuildNumber() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const time = String(now.getHours()).padStart(2, '0') + String(now.getMinutes()).padStart(2, '0');
  return `${year}${month}${day}${time}`;
}

const VERSION_CONFIG = {
  version: '6.16.13',
  buildDate: new Date().toISOString(),
  buildNumber: generateBuildNumber(),
  environment: 'development',
  appName: 'eDM Helper',
  author: '@budife.psd'
};

function getVersionInfo() {
  return {
    ...VERSION_CONFIG,
    currentYear: new Date().getFullYear(),
    formattedBuildDate: formatDate(VERSION_CONFIG.buildDate)
  };
}

function formatDate(dateString) {
  const date = new Date(dateString);
  const options = {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  };
  return date.toLocaleDateString('en-US', options);
}

function getCreatorFooterMarkup() {
  const versionInfo = getVersionInfo();
  return `© 2025 ${versionInfo.appName} crafted by ` +
    `<button class="creator-link" type="button" data-creator-modal>budd` +
    `<span class="creator-popover" role="tooltip"><strong>meet the maker</strong></span></button>`;
}

function ensureCreatorModal() {
  if (!document.getElementById('creator-modal')) {
    const modal = document.createElement('div');
    modal.id = 'creator-modal';
    modal.className = 'creator-modal';
    modal.hidden = true;
    modal.innerHTML = `
      <div class="creator-modal-backdrop" data-creator-close></div>
      <section class="creator-modal-card" role="dialog" aria-modal="true" aria-labelledby="creator-modal-title">
        <button class="creator-modal-close" type="button" data-creator-close aria-label="Close creator note">×</button>
        <div class="creator-modal-header">
          <span class="creator-modal-mark">e</span>
          <div>
            <p class="creator-modal-kicker">Creator note</p>
            <h2 id="creator-modal-title">Hi rakyat</h2>
          </div>
        </div>
        <div class="creator-modal-body">
          <p>Terima kasih sudah menyempatkan waktu buat ngecek web app buatan saya.</p>
          <p>Tujuan web app ini dibuat karena saya malas dan pengen kerja yang repetitif jadi lebih sat set. Harusnya ini cuma web sederhana, but here we are.</p>
          <p>Masih jauh dari kata sempurna, but it is useful. Dan tenang, 100% aman: source code bisa dilihat langsung di repo GitHub saya.</p>
        </div>
        <div class="creator-modal-actions">
          <a class="creator-modal-repo" href="https://github.com/budife/beta" target="_blank" rel="noreferrer">
            Fork the repo
          </a>
          <button class="creator-modal-secondary" type="button" data-creator-feedback>
            Send feedback
          </button>
        </div>
        <div class="creator-modal-built">
          <span>Built with</span>
          <strong>OpenAI Codex</strong>
          <strong>GitHub</strong>
          <strong>GitHub Pages</strong>
          <strong>Vanilla JS</strong>
          <strong>CSS</strong>
          <strong>Markdown</strong>
          <strong>Font Awesome</strong>
          <strong>SheetJS/XLSX</strong>
          <strong>CodeMirror</strong>
          <strong>File System Access</strong>
          <strong>IndexedDB</strong>
          <strong>localStorage</strong>
        </div>
        <p class="creator-modal-note">Enjoy bro n sis.</p>
        <p class="creator-modal-signoff">Cheers,<br><strong>budd the Lazy</strong></p>
      </section>
    `;
    document.body.appendChild(modal);
  }

  if (!document.getElementById('creator-feedback-modal')) {
    const feedbackModal = document.createElement('div');
    feedbackModal.id = 'creator-feedback-modal';
    feedbackModal.className = 'creator-modal creator-feedback-modal';
    feedbackModal.hidden = true;
    feedbackModal.innerHTML = `
      <div class="creator-modal-backdrop" data-feedback-close></div>
      <section class="creator-modal-card" role="dialog" aria-modal="true" aria-labelledby="creator-feedback-title">
        <button class="creator-modal-close" type="button" data-feedback-close aria-label="Close feedback form">×</button>
        <p class="creator-modal-kicker">Feedback</p>
        <h2 id="creator-feedback-title">Complain boleh, santai aja</h2>
        <p class="creator-feedback-intro">Isi form ini untuk bikin draft email ke budd. Data tidak dikirim ke server eDM Helper.</p>
        <form class="creator-feedback-form" data-feedback-form>
          <label>
            <span>Your name</span>
            <input name="name" type="text" autocomplete="name" placeholder="Nama kamu">
          </label>
          <label>
            <span>Your email</span>
            <input name="email" type="email" autocomplete="email" placeholder="email@contoh.com">
          </label>
          <label>
            <span>Message</span>
            <textarea name="message" rows="5" required placeholder="Tulis bug, request, atau complain di sini."></textarea>
          </label>
          <div class="creator-feedback-actions">
            <button class="creator-modal-secondary" type="button" data-feedback-close>Cancel</button>
            <button class="creator-modal-repo" type="submit">Open email draft</button>
          </div>
        </form>
      </section>
    `;
    document.body.appendChild(feedbackModal);
  }
}

function openCreatorModal() {
  ensureCreatorModal();
  const modal = document.getElementById('creator-modal');
  modal.hidden = false;
  document.body.classList.add('creator-modal-open');
  modal.querySelector('[data-creator-close]')?.focus?.();
}

function closeCreatorModal() {
  const modal = document.getElementById('creator-modal');
  const feedbackModal = document.getElementById('creator-feedback-modal');
  if (modal) modal.hidden = true;
  if (feedbackModal) feedbackModal.hidden = true;
  document.body.classList.remove('creator-modal-open');
}

function openCreatorFeedbackModal() {
  ensureCreatorModal();
  const creatorModal = document.getElementById('creator-modal');
  const feedbackModal = document.getElementById('creator-feedback-modal');
  if (creatorModal) creatorModal.hidden = true;
  feedbackModal.hidden = false;
  document.body.classList.add('creator-modal-open');
  feedbackModal.querySelector('textarea')?.focus?.();
}

function submitCreatorFeedback(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const formData = new FormData(form);
  const name = String(formData.get('name') || '').trim() || 'Anonymous';
  const email = String(formData.get('email') || '').trim() || 'No email provided';
  const message = String(formData.get('message') || '').trim();
  const subject = encodeURIComponent('eDM Helper feedback');
  const body = encodeURIComponent([
    `Name: ${name}`,
    `Email: ${email}`,
    '',
    message,
    '',
    `Page: ${window.location.href}`
  ].join('\n'));
  window.location.href = `mailto:budi.indra94@gmail.com?subject=${subject}&body=${body}`;
  closeCreatorModal();
}

function initializeCreatorModal() {
  ensureCreatorModal();
  document.addEventListener('click', (event) => {
    if (event.target.closest('[data-creator-modal]')) {
      event.preventDefault();
      openCreatorModal();
      return;
    }
    if (event.target.closest('[data-creator-feedback]')) {
      event.preventDefault();
      openCreatorFeedbackModal();
      return;
    }
    if (event.target.closest('[data-creator-close]')) {
      closeCreatorModal();
    }
    if (event.target.closest('[data-feedback-close]')) {
      closeCreatorModal();
    }
  });
  document.querySelector('[data-feedback-form]')?.addEventListener('submit', submitCreatorFeedback);
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeCreatorModal();
  });
}

function updateFooterVersion() {
  const yearElement = document.getElementById('footer-year');
  if (yearElement) {
    yearElement.textContent = '2025';
  }
  document.querySelectorAll('.footer-text').forEach((footerText) => {
    footerText.innerHTML = getCreatorFooterMarkup();
  });
}

function updateAllVersionDisplays() {
  const versionInfo = getVersionInfo();
  updateFooterVersion();
  const versionElements = document.querySelectorAll('[data-version]');
  versionElements.forEach(element => {
    element.textContent = `v${versionInfo.version}`;
  });
  const buildDateElements = document.querySelectorAll('[data-build-date]');
  buildDateElements.forEach(element => {
    element.textContent = versionInfo.formattedBuildDate;
  });
}

function getAppVersion() {
  return VERSION_CONFIG.version;
}

function getBuildInfo() {
  return {
    version: VERSION_CONFIG.version,
    buildDate: VERSION_CONFIG.buildDate,
    buildNumber: VERSION_CONFIG.buildNumber,
    environment: VERSION_CONFIG.environment
  };
}

document.addEventListener('DOMContentLoaded', function() {
  updateAllVersionDisplays();
  initializeCreatorModal();
});

window.updateVersion = function(newVersion, buildDate = null) {
  VERSION_CONFIG.version = newVersion;
  if (buildDate) {
    VERSION_CONFIG.buildDate = buildDate;
  }
  VERSION_CONFIG.buildNumber = generateBuildNumber();
  updateAllVersionDisplays();
};
