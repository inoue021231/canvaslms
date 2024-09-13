chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "getToken") {
    chrome.storage.sync.get(['apiToken'], (result) => {
      sendResponse({ token: result.apiToken });
    });
    return true;
  } else if (request.type === "getData") {
    chrome.storage.sync.get(['data'], (result) => {
      sendResponse({ data: result.data});
    });
    return true;
  } else if (request.type === "fetchPage") {
    fetch(request.url)
      .then(response => response.text())
      .then(htmlString => {
        sendResponse({ success: true, data: htmlString });
      })
      .catch(error => {
        console.error("Error fetching target URL:", error);
        sendResponse({ success: false, error: error.message });
      });
    return true;
  } else if(request.type === "getByAPI") {
    fetch("https://nu.instructure.com/api/v1/courses", {
      headers: {
        "Authorization": request.apiToken,
      },
    })
     .then(response => response.json())
     .then(data => {
      sendResponse({ success: true, data });
     })
     .catch(error => {
      console.error("Error fetching API:", error);
      sendResponse({ success: false, error: error.message});
     });
     return true;
  }
});
