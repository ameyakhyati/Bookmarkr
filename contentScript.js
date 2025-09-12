(() => {
	let youtubeLeftControls, youtubePlayer;
	let currentVideo = "";
	let isProcessing = false;

	const fetchBookmarks = () => {
		return new Promise((resolve) => {
			chrome.storage.sync.get([currentVideo], (object) => {
				if (chrome.runtime.lastError) {
					resolve([]);
					return;
				}
				resolve(object[currentVideo] ? JSON.parse(object[currentVideo]) : []);
			});
		});
	};

	const handleDeleteBookmark = async (timeToDelete, sendResponse) => {
		isProcessing = true;
		try {
			const bookmarks = await fetchBookmarks();
			const newBookmarks = bookmarks.filter(
				(b) => Math.abs(b.time - timeToDelete) > 0.1
			);

			await chrome.storage.sync.set({
				[currentVideo]: JSON.stringify(newBookmarks),
			});

			sendResponse(newBookmarks);
		} catch (error) {
			console.error("Error during deletion:", error);
		} finally {
			isProcessing = false;
		}
	};

	const addNewBookmarkEventHandler = async () => {
		if (isProcessing) return;
		isProcessing = true;
		try {
			if (!youtubePlayer) return;
			const currentTime = youtubePlayer.currentTime;
			const newBookmark = {
				time: currentTime,
				desc: "Video bookmarked at " + formatTime(currentTime),
			};

			const currentBookmarks = await fetchBookmarks();
			const newBookmarks = [...currentBookmarks, newBookmark].sort(
				(a, b) => a.time - b.time
			);

			await chrome.storage.sync.set({
				[currentVideo]: JSON.stringify(newBookmarks),
			});
		} catch (error) {
			console.error("Error adding bookmark:", error);
		} finally {
			isProcessing = false;
		}
	};

	const newVideoLoaded = async () => {
		const bookmarkButtonExists = document.getElementsByClassName("bookmark-button")[0];
		youtubePlayer = document.querySelector(".video-stream");
		youtubeLeftControls = document.querySelector(".ytp-left-controls");

		if (!bookmarkButtonExists && youtubeLeftControls) {
			const bookmarkButton = document.createElement("img");
			bookmarkButton.src = chrome.runtime.getURL("assets/bookmark.png");
			bookmarkButton.className = "ytp-button bookmark-button";
			bookmarkButton.title = "Click to bookmark current timestamp";
			youtubeLeftControls.appendChild(bookmarkButton);
			bookmarkButton.addEventListener("click", addNewBookmarkEventHandler);
		}
	};

	function formatTime(seconds) {
		const date = new Date(0);
		date.setSeconds(seconds);
		return date.toISOString().substr(11, 8);
	}

	chrome.runtime.onMessage.addListener((object, sender, sendResponse) => {
		const { type, videoId, value } = object;
		if (type === "newVideo") {
			currentVideo = videoId;
			newVideoLoaded();
		} else if (type === "playVideo") {
			if (youtubePlayer) youtubePlayer.currentTime = value;
		} else if (type === "deleteBookmark") {
			if (isProcessing) {
				console.log("Operation in progress, please wait.");
				return true;
			}
			handleDeleteBookmark(value, sendResponse);
			return true;
		}
	});
})();
