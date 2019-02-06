// Minimal jQuery
const $ = document.querySelector.bind(document);

function isLoggedIn(token) {
  // The user is logged in if their token isn't expired
  return token.exp > Date.now() / 1000;
}

function logout() {
  // Remove the idToken from storage
  localStorage.clear();
}

function enableTracker() {
  $('#check-button').checked = true;
  if (window.localStorage.enable) return;
  window.localStorage.enable = 'true';
  window.chrome.runtime.sendMessage({
    type: 'enableTracker',
  });
}

function disableTracker() {
  $('#check-button').checked = false;
  window.localStorage.enable = '';
  window.chrome.runtime.sendMessage({
    type: 'disableTracker',
  });
}

function toggleTracker(e) {
  return e.target.checked ? enableTracker() : disableTracker();
}

function renderMainView(profile) {
  $('.default').classList.add('hidden');
  ['name', 'email'].forEach(key => {
    const element = $(`.${key}`);
    element.textContent = profile[key];
  });
  $('.loading').classList.add('hidden');
  $('.profile').classList.remove('hidden');
  $('#check-button').addEventListener('click', toggleTracker);
  if (window.localStorage.enable) enableTracker();
  else disableTracker();
}

function renderDefaultView() {
  $('.default').classList.remove('hidden');
  $('.profile').classList.add('hidden');
  $('.loading').classList.add('hidden');

  $('.login-button').addEventListener('click', () => {
    $('.default').classList.add('hidden');
    $('.loading').classList.remove('hidden');
    window.chrome.runtime.sendMessage({
      type: 'authenticate',
    });
  });
}

function main() {
  const authResult = JSON.parse(localStorage.authResult || '{}');
  const token = authResult.id_token && window.jwt_decode(authResult.id_token);
  if (token && isLoggedIn(token)) {
    renderMainView(token);
  } else {
    logout();
    renderDefaultView();
  }
}

document.addEventListener('DOMContentLoaded', main);
