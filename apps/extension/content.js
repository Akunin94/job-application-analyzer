/* global LZString */
(function () {
  'use strict';

  const DEFAULT_APP_URL = 'https://job-application-analyzer.vercel.app';
  let button = null;
  let lastUrl = '';

  // ── DOM extraction ────────────────────────────────────────────────────────

  function queryFirst(...selectors) {
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el) return el;
    }
    return null;
  }

  function extractJobData() {
    const titleEl = queryFirst(
      'h1.job-details-jobs-unified-top-card__job-title',
      'h1.t-24.t-bold',
      '.job-details-jobs-unified-top-card__job-title',
      '.topcard__title',
      'h1',
    );

    const companyEl = queryFirst(
      '.job-details-jobs-unified-top-card__company-name',
      '.job-details-jobs-unified-top-card__primary-description-without-tagline a',
      '.topcard__org-name-link',
      '[class*="company-name"]',
    );

    const locationEl = queryFirst(
      '.job-details-jobs-unified-top-card__primary-description-without-tagline .tvm__text',
      '.topcard__flavor--bullet',
      '[class*="location"]',
    );

    const descEl = queryFirst(
      '.jobs-description__content',
      '.jobs-box__html-content',
      '#job-details',
      '[class*="description__content"]',
      '[class*="description-content"]',
    );

    const title = titleEl?.innerText?.trim() || '';
    const company = companyEl?.innerText?.trim() || '';
    const location = locationEl?.innerText?.trim() || '';
    const description = descEl?.innerText?.trim() || '';

    if (!description) return null;

    const headerParts = [
      title,
      company && location ? `${company} · ${location}` : company || location,
    ]
      .filter(Boolean)
      .join('\n');

    return {
      title,
      company,
      text: headerParts ? `${headerParts}\n\n${description}` : description,
    };
  }

  // ── Button injection ──────────────────────────────────────────────────────

  function createButton() {
    const btn = document.createElement('button');
    btn.id = 'ai-job-analyzer-btn';
    btn.innerHTML =
      '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>' +
      '<span>Analyze with AI</span>';

    Object.assign(btn.style, {
      position: 'fixed',
      bottom: '24px',
      right: '24px',
      zIndex: '99999',
      background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
      color: '#fff',
      border: 'none',
      borderRadius: '10px',
      padding: '10px 18px',
      fontSize: '13px',
      fontWeight: '600',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '7px',
      boxShadow: '0 4px 14px rgba(99,102,241,0.45)',
      transition: 'transform 0.15s ease, box-shadow 0.15s ease',
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      letterSpacing: '-0.01em',
    });

    btn.addEventListener('mouseenter', () => {
      btn.style.transform = 'translateY(-2px)';
      btn.style.boxShadow = '0 6px 18px rgba(99,102,241,0.55)';
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.transform = '';
      btn.style.boxShadow = '0 4px 14px rgba(99,102,241,0.45)';
    });
    btn.addEventListener('mousedown', () => {
      btn.style.transform = 'translateY(0)';
    });

    btn.addEventListener('click', handleAnalyze);
    return btn;
  }

  function injectButton() {
    if (button || document.getElementById('ai-job-analyzer-btn')) return;
    if (!window.location.pathname.match(/\/jobs\/view\//)) return;

    button = createButton();
    document.body.appendChild(button);
  }

  function removeButton() {
    if (button) {
      button.remove();
      button = null;
    }
    const stale = document.getElementById('ai-job-analyzer-btn');
    if (stale) stale.remove();
  }

  // ── Analyze action ────────────────────────────────────────────────────────

  function handleAnalyze() {
    const data = extractJobData();

    if (!data) {
      showToast(
        'Could not extract job description. Please wait for the page to fully load and try again.',
      );
      return;
    }

    chrome.storage.sync.get({ appUrl: DEFAULT_APP_URL }, ({ appUrl }) => {
      const compressed = LZString.compressToEncodedURIComponent(data.text);
      const params = new URLSearchParams({ job: compressed });
      if (data.company) params.set('company', data.company);
      window.open(`${appUrl}/analyze?${params.toString()}`, '_blank');
    });
  }

  // ── Toast ─────────────────────────────────────────────────────────────────

  function showToast(message) {
    const existing = document.getElementById('ai-job-analyzer-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.id = 'ai-job-analyzer-toast';
    toast.textContent = message;
    Object.assign(toast.style, {
      position: 'fixed',
      bottom: '80px',
      right: '24px',
      zIndex: '99999',
      background: '#1e1e2e',
      color: '#fff',
      borderRadius: '8px',
      padding: '10px 14px',
      fontSize: '13px',
      maxWidth: '280px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    });
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
  }

  // ── SPA navigation watcher ────────────────────────────────────────────────

  function checkPage() {
    const isJobView = window.location.pathname.match(/\/jobs\/view\//);
    if (isJobView) {
      // LinkedIn loads content asynchronously — wait for description
      setTimeout(() => {
        if (
          document.querySelector(
            '.jobs-description__content, .jobs-box__html-content, #job-details',
          )
        ) {
          injectButton();
        } else {
          // Retry once more if description not yet rendered
          setTimeout(injectButton, 2000);
        }
      }, 1200);
    } else {
      removeButton();
    }
  }

  // Initial run
  lastUrl = window.location.href;
  checkPage();

  // Watch for LinkedIn SPA route changes via URL mutation
  const navObserver = new MutationObserver(() => {
    if (window.location.href !== lastUrl) {
      lastUrl = window.location.href;
      removeButton();
      checkPage();
    }
  });

  navObserver.observe(document.documentElement, { childList: true, subtree: true });
})();
