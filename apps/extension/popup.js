'use strict';

const DEFAULT_APP_URL = 'https://job-application-analyzer.vercel.app';

const input = document.getElementById('appUrl');
const saveBtn = document.getElementById('save');
const resetBtn = document.getElementById('reset');
const status = document.getElementById('status');

// Load saved URL
chrome.storage.sync.get({ appUrl: DEFAULT_APP_URL }, ({ appUrl }) => {
  input.value = appUrl;
});

saveBtn.addEventListener('click', () => {
  const url = input.value.trim().replace(/\/$/, '');
  if (!url || !url.startsWith('http')) {
    showStatus('Enter a valid URL (must start with http)', 'error');
    return;
  }
  chrome.storage.sync.set({ appUrl: url }, () => {
    showStatus('Saved!');
  });
});

resetBtn.addEventListener('click', () => {
  input.value = DEFAULT_APP_URL;
  chrome.storage.sync.set({ appUrl: DEFAULT_APP_URL }, () => {
    showStatus('Reset to default');
  });
});

function showStatus(msg, type = 'ok') {
  status.textContent = msg;
  status.style.color = type === 'error' ? '#f87171' : '#6366f1';
  setTimeout(() => {
    status.textContent = '';
  }, 2500);
}
