/* eslint-disable no-console */
/* global chrome */

const events = {};
let currentTab = '';

window.chrome.runtime.onMessage.addListener(event => {
  events[event.type]();
});

class ChromeClient extends window.Auth0Chrome {
  getAuthResult(url, interactive) {
    console.log(url, interactive);
    return new Promise((resolve, reject) => {
      chrome.identity.launchWebAuthFlow({url, interactive}, callbackURL => {
        console.log('callbackURL ', callbackURL);
        if (chrome.runtime.lastError) {
          return reject(new Error(chrome.runtime.lastError.message));
        }
        return resolve(callbackURL);
      });
    });
  }

  _authenticate(...args) {
    console.log(this.get);
    return this.authenticate(...args);
  }

  getRedirectURL() {
    return chrome.identity.getRedirectURL('auth0');
  }
}

events.authenticate = function authenticate() {
  const options = {
    scope: 'openid profile email offline_access',
    device: 'chrome-extension',
  };

  new ChromeClient(window.env.AUTH0_DOMAIN, window.env.AUTH0_CLIENT_ID)
    ._authenticate(options)
    .then(authResult => {
      window.localStorage.authResult = JSON.stringify(authResult);
      window.localStorage.enable = 1;
      events.sendNotification('Login Successful', 'You can use the app now');
      events.enableTracker();
    })
    .catch(err => {
      console.error(err);
      events.sendNotification('Login Failed', err.message);
    });
};

events.sendNotification = (title, message) => {
  window.chrome.notifications.create({
    type: 'basic',
    iconUrl: 'src/assets/icons/icon128.png',
    title,
    message,
  });
};

/**
 * Update page.
 * Update the current url when the user reloads, go to link or go back.
 *
 * @listens event:tabs.onUpdated
 *
 * @param {func} callback When the chancheInfo.status is 'complete' update the url with tab.url.
 *
 * @callback
 ** @param {integer}   tabId       Id of the current tab.
 ** @param {object}    changeInfo  Shows the status: string of the chancge.
 ** @param {Tab}       tab         Contains all Tab infos, including url: string.
 */
function _onUpdated(_, changeInfo, tab) {
  if (changeInfo.status === 'complete') {
    currentTab = tab.url;
    sendData({
      url: tab.url,
      startTime: Date.now(),
      eventType: 'UPDATE_TAB',
    });
  }
}

/**
 * Activated tab.
 * Update the current url when the user changes tab.
 *
 * @listens event:tabs.onActivated
 *
 * @param {func} callback Get the current url by the tabId.
 *
 * @callback
 ** @param {Object}  activeInfo Object with the active tab infos.
 ** @param {integer} tabId      Id of the current tab.
 ** @param {integer} windowId   Id of the current window.
 */
function _onActivated({tabId}) {
  /**
   * Current tab.
   * @param {integer} tabId tab id.
   * @param {func} callback Update the current url with the tab.url.
   *
   * @callback
   ** @param {Tab} tab All tabs info, including url: string.
   */
  window.chrome.tabs.get(tabId, tab => {
    currentTab = tab.url;
    sendData({
      url: tab.url,
      startTime: Date.now(),
      eventType: 'TAB_ACTIVE_CHANGE',
    });
  });
}

/**
 * Activated Window.
 * Update the current url when the user changes window.
 *
 * @listens event:windows.onFocusChanged
 *
 * @param {func} callback Get the selected tab.
 */
function _onFocusChanged() {
  /**
   * Current tab.
   * @param {func} callback Get the current tab and compare.
   *
   * @callback
   ** @param {Tab} tab All tabs info, including url: string.
   */
  window.chrome.tabs.getSelected(tab => {
    currentTab = tab && currentTab !== tab.url ? tab.url : null;
    sendData({
      url: currentTab,
      startTime: Date.now(),
      eventType: 'WINDOW_FOCUS_CHANGED',
    });
  });
}

events.disableTracker = function disableTracker() {
  window.chrome.browserAction.setIcon({
    path: 'src/assets/icons/icon128_off.png',
  });
  window.chrome.tabs.onUpdated.removeListener(_onUpdated);
  window.chrome.tabs.onActivated.removeListener(_onActivated);
  window.chrome.windows.onFocusChanged.removeListener(_onFocusChanged);
};

events.enableTracker = function enableTracker() {
  window.chrome.browserAction.setIcon({
    path: 'src/assets/icons/icon128_on.png',
  });
  window.chrome.tabs.onUpdated.addListener(_onUpdated);
  window.chrome.tabs.onActivated.addListener(_onActivated);
  window.chrome.windows.onFocusChanged.addListener(_onFocusChanged);
};

function sendData(record) {
  const authResult = JSON.parse(localStorage.authResult || '{}');
  fetch(window.env.MICRO_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${authResult.id_token || ''}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(record),
  })
    .then(res => (res.status === 401 ? res.text() : res.json()))
    .then(data => console.log('DATA SENT: ', data))
    .catch(err => console.log('ERROR: ', err));
}

(function init() {
  const authResult = JSON.parse(localStorage.authResult || '{}');
  const enable = JSON.parse(localStorage.enable || '{}');
  const token = authResult.id_token && window.jwt_decode(authResult.id_token);
  if (token && token.exp > Date.now() / 1000 && +enable) {
    events.enableTracker();
  } else {
    events.disableTracker();
  }
})();
