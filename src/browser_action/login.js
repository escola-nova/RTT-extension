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
  window.chrome.runtime.sendMessage({
    type: 'enableTracker',
  });
}

function disableTracker() {
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
      ['name', 'nickname'].forEach(key => {
        const element = $(`.${key}`);
        element.textContent = profile[key];
      });
      $('.loading').classList.add('hidden');
      $('.profile').classList.remove('hidden');
      $('.enable-button').addEventListener('click', enableTracker);
      $('.disable-button').addEventListener('click', disableTracker);
      $('.logout-button').addEventListener('click', logout);
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
