(() => {
	let youtubeLeftControls, youtubePlayer;
	let currentVideo = "";
	let currentVideoBookmarks = [];

	chrome.runtime.onMessage.addListener((object, sender, sendResponse) => {
		const { type, videoId, value } = object;

		if (type === "newVideo") {
			currentVideo = videoId;
			newVideoLoaded();
		} else if (type === "playVideo") {
			if (youtubePlayer) youtubePlayer.currentTime = value;
		} else if (type === "deleteBookmark") {
			currentVideoBookmarks = currentVideoBookmarks.filter(
				(b) => b.time != value
			);
			chrome.storage.sync.set({
				[currentVideo]: JSON.stringify(currentVideoBookmarks),
			});
			sendResponse(currentVideoBookmarks);
		}
		return true;
	});

	const fetchBookmarks = () => {
		return new Promise((resolve) => {
			chrome.storage.sync.get([currentVideo], (object) => {
				if (chrome.runtime.lastError) {
					return;
				}
				resolve(object[currentVideo] ? JSON.parse(object[currentVideo]) : []);
			});
		});
	};

	const newVideoLoaded = async () => {
		currentVideoBookmarks = await fetchBookmarks();
		const bookmarkButtonExists =
			document.getElementsByClassName("bookmark-button")[0];

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

	const addNewBookmarkEventHandler = async () => {
		if (!youtubePlayer) return;

		const currentTime = youtubePlayer.currentTime;
		const newBookmark = {
			time: currentTime,
			desc: "Video bookmarked at " + formatTime(currentTime),
		};

		currentVideoBookmarks = await fetchBookmarks();

		chrome.storage.sync.set({
			[currentVideo]: JSON.stringify(
				[...currentVideoBookmarks, newBookmark].sort((a, b) => a.time - b.time)
			),
		});
	};

	function formatTime(seconds) {
		const date = new Date(0);
		date.setSeconds(seconds);
		return date.toISOString().substr(11, 8);
	}

	newVideoLoaded();
})();
