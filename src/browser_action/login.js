function isLoggedIn(token) {
  // The user is logged in if their token isn't expired
  return window.jwt_decode(token).exp > Date.now() / 1000;
}

function logout() {
  // Remove the idToken from storage
  localStorage.clear();
  main();
}

function enableTracker() {
  const enableButton = $('#enable-button');
  if (enableButton.dataset.triggered === 'true') return;
  enableButton.dataset.triggered = true;
  enableButton.classList.add('active');
  $('#disable-button').classList.remove('active');
  window.chrome.browserAction.setIcon({path: '../assets/icons/icon128_on.png'});
  window.chrome.runtime.sendMessage({
    type: 'enableTracker',
  });
}

function disableTracker() {
  const enableButton = $('#enable-button');
  enableButton.classList.remove('active');
  $('#disable-button').classList.add('active');
  enableButton.dataset.triggered = false;
  window.chrome.browserAction.setIcon({
    path: '../assets/icons/icon128_off.png',
  });
  window.chrome.runtime.sendMessage({
    type: 'disableTracker',
  });
}

// Minimal jQuery
const $ = document.querySelector.bind(document);

function renderMainView(authResult) {
  $('.default').classList.add('hidden');
  $('.loading').classList.remove('hidden');
  fetch(`https://${window.env.AUTH0_DOMAIN}/userinfo`, {
    headers: {
      Authorization: `Bearer ${authResult.access_token}`,
    },
  })
    .then(resp => resp.json())
    .then(profile => {
      ['name'].forEach(key => {
        const element = $(`.${key}`);
        element.textContent = profile[key];
      });
      $('.loading').classList.add('hidden');
      $('.profile').classList.remove('hidden');
      $('#enable-button').addEventListener('click', enableTracker);
      $('#disable-button').addEventListener('click', disableTracker);
      enableTracker();
    })
    .catch(logout);
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
  const token = authResult.id_token;
  if (token && isLoggedIn(token)) {
    renderMainView(authResult);
  } else {
    renderDefaultView();
  }
}

document.addEventListener('DOMContentLoaded', main);
