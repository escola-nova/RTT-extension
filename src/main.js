/* eslint-disable no-console */

window.chrome.runtime.onMessage.addListener(event => {
  events[event.type]();
});

const events = {};

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

events.enableTracker = function enableTracker() {
  console.log('========TRACKING ON===========');
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
  window.chrome.tabs.onUpdated.addListener((_, changeInfo, tab) => {
    if (changeInfo.status === 'complete') {
      sendData({
        url: tab.url,
        startTime: Date.now(),
      });
    }
  });

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
  window.chrome.tabs.onActivated.addListener(({tabId}) =>
    /**
     * Current tab.
     * @param {integer} tabId tab id.
     * @param {func} callback Update the current url with the tab.url.
     *
     * @callback
     ** @param {Tab} tab All tabs info, including url: string.
     */
    window.chrome.tabs.get(tabId, tab => {
      sendData({
        url: tab.url,
        startTime: Date.now(),
      });
    }),
  );

  /**
   * Activated Window.
   * Update the current url when the user changes window.
   *
   * @listens event:windows.onFocusChanged
   *
   * @param {func} callback Get the current url by the tabId.
   */
  window.chrome.windows.onFocusChanged.addListener(() => {
    /**
     * Current tab.
     * @param {Object} queryInfo Take a deeper look.
     * @param {func}   callback  If url is the same twice means it's out of focus. Update the current url with the tab.url if tabs[0] true.
     *
     * @callback
     ** @param {Array} tabs Array of tabs with always one Tab.
     */
    window.chrome.tabs.query(
      {active: true, lastFocusedWindow: true},
      tabs =>
        tabs[0] &&
        sendData({
          url: tabs[0].url,
          startTime: Date.now(),
        }), // if url is the same twice means it's out of focus.
    );

    window.chrome.tabs.query(
      {active: false, lastFocusedWindow: true},
      tabs =>
        tabs[0] &&
        sendData({
          url: tabs[0].url,
          startTime: Date.now(),
        }),
    ); // if url is the same twice means it's out of focus.
  });
};

events.disableTracker = function disableTracker() {
  console.log('========TRACKING OFF===========');
  window.chrome.tabs.onUpdated.removeListener();
  window.chrome.tabs.onActivated.removeListener();
  window.chrome.windows.onFocusChanged.removeListener();
};

function sendData(record) {
  const authResult = JSON.parse(localStorage.authResult || '{}');
  const body = {
    id_token: authResult.id_token || undefined,
  };

  body.record = record;

  fetch(window.env.MICRO_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })
    .then(res => res.json())
    .then(data => console.log('DATA SENT: ', data))
    .catch(err => console.log('ERROR: ', err));
}
