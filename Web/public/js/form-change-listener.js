/**
 * Form Change Listener
 * Tracks form changes and enables/disables save buttons accordingly
 */

document.addEventListener("DOMContentLoaded", () => {
	const form = document.getElementById("form");
	if (!form) return;

	const saveButton = document.querySelector("button[type=\"submit\"]");
	const resetButton = document.querySelector("button[type=\"reset\"]");

	if (!saveButton) return;

	let hasChanges = false;

	// Track all form input changes
	form.addEventListener("change", () => {
		hasChanges = true;
		if (saveButton) saveButton.disabled = false;
		if (resetButton) resetButton.disabled = false;
	});

	form.addEventListener("input", () => {
		hasChanges = true;
		if (saveButton) saveButton.disabled = false;
		if (resetButton) resetButton.disabled = false;
	});

	// Handle form submission
	form.addEventListener("submit", (e) => {
		e.preventDefault();
		hasChanges = false;
		if (saveButton) saveButton.disabled = true;
		if (resetButton) resetButton.disabled = true;

		// Let the form submit via SkynetUtil.submitForm()
		SkynetUtil.submitForm();
	});

	// Handle form reset
	if (resetButton) {
		resetButton.addEventListener("click", () => {
			hasChanges = false;
			if (saveButton) saveButton.disabled = true;
			if (resetButton) resetButton.disabled = true;
		});
	}

	// Warn user if they try to leave with unsaved changes
	window.addEventListener("beforeunload", (e) => {
		if (hasChanges) {
			e.preventDefault();
			e.returnValue = "";
			return "";
		}
	});
});
