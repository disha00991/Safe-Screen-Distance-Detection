let color = 'pink';

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.set({ color });
  console.log('Default background color set to %c', `color: ${color}`);
});

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.isTab) {
    chrome.scripting.executeScript({ // Error in event handler: TypeError: Cannot read property 'executeScript' of undefined
      target: { tabId: request.to },
      file: "contentScript.js"
    });
  }  
});


// https://developer.chrome.com/docs/extensions/mv3/content_scripts/#programmatic