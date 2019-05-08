var graph = require("@microsoft/microsoft-graph-client");
module.exports = {
  getUserDetails: async accessToken => {
    const client = getAuthenticatedClient(accessToken);

    const user = await client.api("/me").get();
    return user;
  },

  getMailFolders: async (accessToken, query) => {
    const client = getAuthenticatedClient(accessToken);
    let items = [];

    let folders;
    if (!query) {
      folders = await client
        .api("/me/mailFolders")
        .count(true)
        .top(20)
        .get();
    } else {
      folders = await client.api(query).get();
    }

    const iter = new graph.PageIterator(client, folders, data => {
      if (data) {
        items.push(data);
        return true;
      }
      return false;
    });
    return iter.iterate().then(res => {
      return items;
    });
  },

  getFoldersMessages: async (accessToken, id, query) => {
    const client = getAuthenticatedClient(accessToken);
    let messages;
    if (!query) {
      var url = `/me/mailFolders/${id}/messages`;
      messages = await client
        .api(url)
        .top(5)
        .get();
    } else {
      messages = await client.api(query).get();
    }

    return messages;
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
      .select("id,sender,subject,bodyPreview,isRead,body")
      .get();

    return messages;
  },

  updateMessage: async (accessToken, id, body) => {
    const client = getAuthenticatedClient(accessToken);

    const result = await client
      .api("/me/messages/" + id)
      .patch(JSON.stringify(body));

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
