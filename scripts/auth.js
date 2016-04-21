var OAUTH2_CLIENT_ID ='AIzaSyB5gvhYEIZD8UwHwUqodLHr5J3ijPVBbsQ';
function initialize() {
  gapi.client.setApiKey(OAUTH2_CLIENT_ID);
  gapi.client.load('youtube', 'v3', function() {
    //handleAPILoaded();
  });
}
