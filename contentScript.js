(() => {
	let youtubeLeftControls, youtubePlayer;
	let currentVideo = "";
	let currentVideoBookmarks = [];

	chrome.runtime.onMessage.addListener((object, sender, sendResponse) => {
		const { type, videoId, value } = object;

		if (type === "newVideo") {
			currentVideo = videoId;
			newVideoLoaded();
		} else if (type === "playVideo" && youtubePlayer) {
			youtubePlayer.currentTime = value;
		} else if (type === "deleteBookmark") {
			currentVideoBookmarks = currentVideoBookmarks.filter(
				(b) => b.time != value
			);
			chrome.storage.sync.set({
				[currentVideo]: JSON.stringify(currentVideoBookmarks),
			});
			sendResponse(currentVideoBookmarks);
		}
	});

	const fetchBookmarks = () => {
		return new Promise((resolve) => {
			chrome.storage.sync.get([currentVideo], (object) => {
				resolve(object[currentVideo] ? JSON.parse(object[currentVideo]) : []);
			});
		});
	};

	const newVideoLoaded = async () => {
		const bookmarkButtonExists = document.querySelector(".bookmark-button");
		currentVideoBookmarks = await fetchBookmarks();

		if (!bookmarkButtonExists) {
			const bookmarkButton = document.createElement("img");
			bookmarkButton.src = chrome.runtime.getURL("assets/bookmark.png");
			bookmarkButton.className = "ytp-button bookmark-button";
			bookmarkButton.title = "Click to bookmark current timestamp";

			waitForElement(".ytp-left-controls", (controls) => {
				youtubeLeftControls = controls;
				youtubePlayer = document.querySelector(".video-stream");
				youtubeLeftControls.appendChild(bookmarkButton);

				bookmarkButton.addEventListener("click", addNewBookmark);
			});
		}
	};

	const addNewBookmark = async () => {
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

	function waitForElement(selector, callback) {
		const el = document.querySelector(selector);
		if (el) {
			callback(el);
		} else {
			requestAnimationFrame(() => waitForElement(selector, callback));
		}
	}

	function formatTime(seconds) {
		const date = new Date(0);
		date.setSeconds(seconds);
		return date.toISOString().substr(11, 8);
	}

	// Ensure ytExt param (optional hack)
	const trail = "&ytExt=ON";
	if (
		!window.location.href.includes(trail) &&
		window.location.href.includes("youtube.com/watch")
	) {
		window.location.href += trail;
	}
})();
