var graph = require('@microsoft/microsoft-graph-client');
module.exports = {
  getUserDetails: async accessToken => {
    const client = getAuthenticatedClient(accessToken);

    const user = await client.api('/me').get();
    return user;
  },

  getMessages: async accessToken => {
    const client = getAuthenticatedClient(accessToken);

    const messages = await client
      .api('/me/messages')
      .select('sender,subject')
      .orderby('createdDateTime DESC')
      .count(true)
      .get();

    return messages;
  }
};

function getAuthenticatedClient(accessToken) {
  // Initialize Graph client
  const client = graph.Client.init({
    // Use the provided access token to authenticate
    // requests
    authProvider: (done) => {
      done(null, accessToken);
    }
  });

  return client;
}