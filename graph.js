var graph = require("@microsoft/microsoft-graph-client");
module.exports = {
  getUserDetails: async accessToken => {
    const client = getAuthenticatedClient(accessToken);

    const user = await client.api("/me").get();
    return user;
  },

  getMessages: async (accessToken, query) => {
    const client = getAuthenticatedClient(accessToken);
    let messages;
    if (!query) {
      messages = await client
        .api("/me/messages")
        .select("id,sender,subject,bodyPreview,isRead")
        .orderby("createdDateTime DESC")
        .count(true)
        .top(10)
        .get();
    } else {
      messages = await client
        .api(query)
        .orderby("createdDateTime DESC")
        .get();
    }
    return messages;
  },

  getMessage: async (accessToken, id) => {
    const client = getAuthenticatedClient(accessToken);
    let messages;

    messages = await client
      .api("/me/messages/" + id)
      .select("id,sender,subject,bodyPreview,isRead")
      .get();

    return messages;
  },

  updateMessage: async (accessToken, body) => {
    const client = getAuthenticatedClient(accessToken);

    const result = await client.api("/me/messages/" + id).patch(body);

    return result;
  }
};

function getAuthenticatedClient(accessToken) {
  // Initialize Graph client
  const client = graph.Client.init({
    // Use the provided access token to authenticate
    // requests
    authProvider: done => {
      done(null, accessToken);
    }
  });

  return client;
}
