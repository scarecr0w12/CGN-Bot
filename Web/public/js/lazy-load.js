/**
 * Lazy Loading Image System
 * Optimizes image loading using Intersection Observer API
 */
(function () {
	const config = {
		rootMargin: "50px 0px",
		threshold: 0.01,
	};

	let observer;

	if ("IntersectionObserver" in window) {
		observer = new IntersectionObserver(onIntersection, config);
	} else {
		loadImagesImmediately();
	}

	function onIntersection (entries) {
		entries.forEach(entry => {
			if (entry.intersectionRatio > 0 || entry.isIntersecting) {
				observer.unobserve(entry.target);
				loadImage(entry.target);
			}
		});
	}

	function loadImage (img) {
		if (img.dataset.src) {
			img.src = img.dataset.src;
		}
		if (img.dataset.srcset) {
			img.srcset = img.dataset.srcset;
		}
		img.classList.add("loaded");
	}

	function loadImagesImmediately () {
		const images = document.querySelectorAll("img[data-src]");
		images.forEach(loadImage);
	}

	function initLazyLoad () {
		const images = document.querySelectorAll("img[data-src]");

		if (observer) {
			images.forEach(img => observer.observe(img));
		} else {
			loadImagesImmediately();
		}
	}

	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", initLazyLoad);
	} else {
		initLazyLoad();
	}

	if (typeof Turbolinks !== "undefined") {
		document.addEventListener("turbolinks:load", initLazyLoad);
	}

	window.lazyLoad = {
		init: initLazyLoad,
		observe: (img) => observer && observer.observe(img),
		loadNow: loadImage,
	};
}());
