import { getActiveTabURL } from "../utils.js";

const addNewBookmark = (allBookmarks, bookmark) => {
	const bookmarkTitle = document.createElement("div");
	const bookmarkContent = document.createElement("div");
	const controlButtons = document.createElement("div");

	bookmarkTitle.textContent = bookmark.desc;
	bookmarkTitle.className = "bookmark-title";

	controlButtons.className = "bookmark-control";

	bookmarkContent.id = "bookmark-" + bookmark.time;
	bookmarkContent.className = "bookmark";
	bookmarkContent.setAttribute("timeStamp", bookmark.time);

	setBookmarkAttribute("play", onPlay, controlButtons);
	setBookmarkAttribute("delete", onDelete, controlButtons);

	bookmarkContent.appendChild(bookmarkTitle);
	bookmarkContent.appendChild(controlButtons);
	allBookmarks.appendChild(bookmarkContent);
};

const onPlay = async (e) => {
	const bookmarkTime = e.target.parentNode.parentNode.getAttribute("timeStamp");
	const activeTab = await getActiveTabURL();

	chrome.tabs.sendMessage(activeTab.id, {
		type: "playVideo",
		value: bookmarkTime,
	});
};

const onDelete = async (e) => {
	const bookmarkTime = e.target.parentNode.parentNode.getAttribute("timeStamp");
	const activeTab = await getActiveTabURL();
	const deleteBookmark = document.getElementById("bookmark-" + bookmarkTime);

	if (deleteBookmark) {
		deleteBookmark.parentNode.removeChild(deleteBookmark);
	}

	chrome.tabs.sendMessage(
		activeTab.id,
		{
			type: "deleteBookmark",
			value: bookmarkTime,
		},
		viewBookmarks
	);
};

const setBookmarkAttribute = (source, eventListener, controlParent) => {
	const control = document.createElement("img");
	control.src = chrome.runtime.getURL("assets/" + source + ".png");

	control.title = source;
	control.addEventListener("click", eventListener);
	controlParent.appendChild(control);
};

const viewBookmarks = (currentBookmarks = []) => {
	const allBookmarks = document.getElementById("bookmarks");
	allBookmarks.innerHTML = "";

	if (currentBookmarks.length > 0) {
		for (let i = 0; i < currentBookmarks.length; i++) {
			const bookmark = currentBookmarks[i];
			addNewBookmark(allBookmarks, bookmark);
		}
	}
};

document.addEventListener("DOMContentLoaded", async () => {
	const currentTab = await getActiveTabURL();
	const urlParameter = currentTab.url.split("?")[1];
	const currentVideo = new URLSearchParams(urlParameter).get("v");

	if (currentTab.url.includes("youtube.com/watch") && currentVideo) {
		chrome.storage.sync.get([currentVideo], (object) => {
			const currentVideoBookmarks = object[currentVideo]
				? JSON.parse(object[currentVideo])
				: [];
			viewBookmarks(currentVideoBookmarks);
		});
	} else {
		const container = document.getElementsByClassName("container")[0];
		container.innerHTML =
			'<div class="title">The current tab is not a YouTube Video Page. To view your video timestamps, please navigate to any YouTube Video Page.</div>';
	}
});
