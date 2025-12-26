/* Service Worker Registration */
(function () {
	"use strict";

	// Check if service workers are supported
	if (!("serviceWorker" in navigator)) {
		console.log("Service Workers not supported");
		return;
	}

	// Handler for update found event
	function handleUpdateFound(registration) {
		return () => {
			const newWorker = registration.installing;
			newWorker.addEventListener("statechange", () => {
				if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
					// New version available
					if (confirm("A new version is available. Reload to update?")) {
						newWorker.postMessage({ action: "skipWaiting" });
						window.location.reload();
					}
				}
			});
		};
	}

	// Register service worker on page load
	window.addEventListener("load", () => {
		navigator.serviceWorker.register("/service-worker.js", {
			scope: "/",
		})
			.then(registration => {
				console.log("Service Worker registered:", registration.scope);

				// Check for updates periodically
				setInterval(() => {
					registration.update();
				}, 60000); // Check every minute

				// Handle updates
				registration.addEventListener("updatefound", handleUpdateFound(registration));
			})
			.catch(err => {
				console.error("Service Worker registration failed:", err);
			});

		// Handle controller change (new SW activated)
		navigator.serviceWorker.addEventListener("controllerchange", () => {
			window.location.reload();
		});
	});

	// Expose utility to clear cache
	window.clearSWCache = function () {
		if (navigator.serviceWorker.controller) {
			navigator.serviceWorker.controller.postMessage({ action: "clearCache" });
			return "Cache clear initiated. Reload page to see changes.";
		}
		return "No active service worker found.";
	};
}());
