chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
	if (
		changeInfo.status === "complete" &&
		tab.url &&
		tab.url.includes("youtube.com/watch")
	) {
		const urlParameter = tab.url.split("?")[1];
		const uniqueVideoId = new URLSearchParams(urlParameter).get("v");

		console.log("Unique Video ID:", uniqueVideoId);

		chrome.tabs.sendMessage(
			tabId,
			{
				type: "newVideo",
				videoId: uniqueVideoId,
			},

			(response) => {
				if (chrome.runtime.lastError) {
					console.warn(
						"No receiver (content script not ready yet):",
						chrome.runtime.lastError.message
					);
				}
			}
		);
	}
});
