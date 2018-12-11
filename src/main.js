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
