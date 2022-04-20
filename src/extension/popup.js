// Initialize button with user's preferred color
let changeColor = document.getElementById("changeColor");

chrome.storage.sync.get("color", ({ color }) => {
    changeColor.style.backgroundColor = color;
});

// When the button is clicked, inject setPageBackgroundColor into all tabs and the ones opened
changeColor.addEventListener("click", async () => {
    chrome.tabs.query({}, function (tabs) {
        tabs.forEach(tab => {
            chrome.runtime.sendMessage({ to: tab.id, istab: true });
        });
    });
});


