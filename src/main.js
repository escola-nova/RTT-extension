/* eslint-disable no-console */

window.chrome.runtime.onMessage.addListener(event => {
  events[event.type]();
});

const events = {};
let currentTab = '';

events.authenticate = function authenticate() {
  const options = {
    scope: 'openid profile offline_access',
    device: 'chrome-extension',
  };
  new window.Auth0Chrome(window.env.AUTH0_DOMAIN, window.env.AUTH0_CLIENT_ID)
    .authenticate(options)
    .then(authResult => {
      window.localStorage.authResult = JSON.stringify(authResult);
      window.chrome.notifications.create({
        type: 'basic',
        iconUrl: 'src/assets/icons/icon128.png',
        title: 'Login Successful',
        message: 'You can use the app now',
      });
    })
    .catch(err => {
      window.chrome.notifications.create({
        type: 'basic',
        iconUrl: 'src/assets/icons/icon128.png',
        title: 'Login Failed',
        message: err.message,
      });
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
    });
  });
}

events.disableTracker = function disableTracker() {
  console.log('========TRACKING OFF===========');
  window.chrome.tabs.onUpdated.removeListener(_onUpdated);
  window.chrome.tabs.onActivated.removeListener(_onActivated);
  window.chrome.windows.onFocusChanged.removeListener(_onFocusChanged);
};

events.enableTracker = function enableTracker() {
  console.log('========TRACKING ON===========');
  window.chrome.tabs.onUpdated.addListener(_onUpdated);
  window.chrome.tabs.onActivated.addListener(_onActivated);
  window.chrome.windows.onFocusChanged.addListener(_onFocusChanged);
};

function sendData(record) {
  const authResult = JSON.parse(localStorage.authResult || '{}');

  fetch(window.env.MICRO_URL, {
    method: 'POST',
    headers: {
      id_token: authResult.id_token || undefined,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(record),
  })
    .then(res => res.json())
    .then(data => console.log('DATA SENT: ', data))
    .catch(err => console.log('ERROR: ', err));
}
