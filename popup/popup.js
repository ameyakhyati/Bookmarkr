import { getActiveTabURL } from "../utils.js";

const addNewBookmark = (allBookmarks, bookmark) => {
	const bookmarkContent = document.createElement("div");
	bookmarkContent.id = "bookmark-" + bookmark.time;
	bookmarkContent.className = "bookmark-item";
	bookmarkContent.setAttribute("timeStamp", bookmark.time);

	const bookmarkText = document.createElement("div");
	bookmarkText.textContent = bookmark.desc;
	bookmarkText.className = "bookmark-text";

	const controls = document.createElement("div");
	controls.className = "bookmark-control";

	setBookmarkControl("play", onPlay, controls);
	setBookmarkControl("delete", onDelete, controls);

	bookmarkContent.appendChild(bookmarkText);
	bookmarkContent.appendChild(controls);

	allBookmarks.appendChild(bookmarkContent);
};

const onPlay = async (e) => {
	const bookmarkTime = Number(
		e.target.closest(".bookmark-item").getAttribute("timeStamp")
	);
	const activeTab = await getActiveTabURL();

	chrome.tabs.sendMessage(activeTab.id, {
		type: "playVideo",
		value: bookmarkTime,
	});
};

const onDelete = async (e) => {
	const bookmarkTime = Number(
		e.target.closest(".bookmark-item").getAttribute("timeStamp")
	);
	const activeTab = await getActiveTabURL();

	chrome.tabs.sendMessage(
		activeTab.id,
		{
			type: "deleteBookmark",
			value: bookmarkTime,
		},
		(response) => {
			if (chrome.runtime.lastError) {
				console.log("Error:", chrome.runtime.lastError.message);
				return;
			}
			viewBookmarks(response);
		}
	);
};

const setBookmarkControl = (icon, handler, parent) => {
	const controlButton = document.createElement("img");
	controlButton.src = chrome.runtime.getURL("assets/" + icon + ".png");
	controlButton.title = icon;
	controlButton.className = "control-button";
	controlButton.addEventListener("click", handler);
	parent.appendChild(controlButton);
};

const showView = (viewId) => {
	document
		.querySelectorAll(".content")
		.forEach((el) => el.classList.add("hidden"));
	document.getElementById(viewId).classList.remove("hidden");
};

const viewBookmarks = (currentBookmarks = []) => {
	const allBookmarks = document.getElementById("bookmarks");
	allBookmarks.innerHTML = "";

	if (currentBookmarks.length > 0) {
		currentBookmarks.forEach((bookmark) =>
			addNewBookmark(allBookmarks, bookmark)
		);
		showView("bookmarks-view");
	} else {
		showView("noVideoTimestamp-view");
	}
};

document.addEventListener("DOMContentLoaded", async () => {
	const currentTab = await getActiveTabURL();

	if (currentTab.url && currentTab.url.includes("youtube.com/watch")) {
		const urlParameter = currentTab.url.split("?")[1];
		const currentVideo = new URLSearchParams(urlParameter).get("v");

		if (currentVideo) {
			chrome.storage.sync.get([currentVideo], (result) => {
				const bookmarks = result[currentVideo]
					? JSON.parse(result[currentVideo])
					: [];
				viewBookmarks(bookmarks);
			});
		} else {
			showView("empty-view");
		}
	} else {
		showView("empty-view");
	}
});
