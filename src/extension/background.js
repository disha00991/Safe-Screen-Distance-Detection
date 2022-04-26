let color = 'red';

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.set({ color });
  console.log('Default background color set to %c', `color: ${color}`);
  // chrome.tabs.query({}, function (tabs) {
  //   tabs.forEach(tab => {
  //     chrome.scripting.executeScript({ // Error in event handler: TypeError: Cannot read property 'executeScript' of undefined
  //       target: { tabId: tab.id },
  //       files: ["opencv.js", "utils.js"]
  //     }, (injectionResults) => {
  //       for (const frameResult of injectionResults)
  //         console.log('Frame Title: ' + frameResult.result);
  //     });
  //   });
  // });
});



chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.istab) {
    // chrome.scripting.executeScript({ // Error in event handler: TypeError: Cannot read property 'executeScript' of undefined
    //   target: { tabId: request.to },
    //   files: ["utils.js"]
    // });
    chrome.scripting.executeScript({ // Error in event handler: TypeError: Cannot read property 'executeScript' of undefined
      target: { tabId: request.to },
      files: ["contentScript.js"]
    });
  }
});


// https://developer.chrome.com/docs/extensions/mv3/content_scripts/#programmatic