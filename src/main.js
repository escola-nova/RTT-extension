window.chrome.runtime.onMessage.addListener(event => {
  if (event.type === 'authenticate') {
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
  }
});

/**
 * Update page.
 * Update the current url when the user reloads,go to link or go back.
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
window.chrome.tabs.onUpdated.addListener(
  (_, changeInfo, tab) =>
    changeInfo.status === 'complete' && console.log('ON UPDATE', tab.url),
);

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
  window.chrome.tabs.get(tabId, tab => console.log('ACTIVATED', tab.url)),
);

/**
 * Activated Window.
 * Update the current url when the user changes window.
 *
 * @listens event:windows.onFocusChanged
 *
 * @param {func} callback Get the current url by the tabId.
 */
window.chrome.windows.onFocusChanged.addListener(() =>
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
    tabs => tabs[0] && console.log('WINDOW FOCUS', tabs[0].url), // if url is the same twice means it's out of focus.
  ),
);
