/* eslint-env browser, jquery */

(function () {
	let fieldCount = 0;
	const svrid = window.location.pathname.split("/")[2];

	// Initialize
	$(document).ready(() => {
		initializeColorPicker();
		initializeFormListeners();
		initializeTemplateActions();
		initializeModals();
		loadChannels();
		updatePreview();
	});

	function initializeColorPicker () {
		$("#embedColorPicker").on("input", function () {
			$("#embedColor").val($(this).val());
			updatePreview();
		});

		$("#embedColor").on("input", function () {
			const color = $(this).val();
			if (/^#[0-9A-F]{6}$/i.test(color)) {
				$("#embedColorPicker").val(color);
			}
			updatePreview();
		});
	}

	function initializeFormListeners () {
		// Update preview on any input change
		$("#embedBuilderForm").on("input change", "input, textarea", () => {
			updatePreview();
		});

		// Add field button
		$("#addFieldBtn").on("click", addField);

		// Preview button
		$("#previewBtn").on("click", () => {
			updatePreview();
			$("html, body").animate({
				scrollTop: $("#embedPreview").offset().top - 100,
			}, 500);
		});

		// Send button
		$("#sendEmbedBtn").on("click", () => {
			$("#sendModal").show();
		});

		// Save template button
		$("#saveTemplateBtn").on("click", () => {
			$("#saveTemplateModal").show();
		});
	}

	function initializeTemplateActions () {
		// Load template
		$(document).on("click", ".load-template", function () {
			const templateId = $(this).data("id");
			loadTemplate(templateId);
		});

		// Delete template
		$(document).on("click", ".delete-template", function () {
			const templateId = $(this).data("id");
			if (confirm("Are you sure you want to delete this template?")) {
				deleteTemplate(templateId);
			}
		});

		$("#confirmSaveTemplateBtn").on("click", saveTemplate);
	}

	function initializeModals () {
		// Close modals
		$(".modal .close").on("click", function () {
			$(this).closest(".modal").hide();
		});

		// Close on outside click
		$(window).on("click", (e) => {
			if ($(e.target).hasClass("modal")) {
				$(e.target).hide();
			}
		});

		// Send confirmation
		$("#confirmSendBtn").on("click", sendEmbed);
	}

	function addField () {
		if ($(".field-group").length >= 25) {
			alert("Maximum of 25 fields allowed!");
			return;
		}

		fieldCount++;
		const fieldHtml = `
			<div class="field-group" data-field-id="${fieldCount}">
				<div class="field-header">
					<h5>Field ${fieldCount}</h5>
					<button type="button" class="btn btn-sm btn-danger remove-field">
						<i class="fas fa-times"></i>
					</button>
				</div>
				<div class="form-group">
					<label>Field Name</label>
					<input type="text" class="field-name form-control" maxlength="256" placeholder="Field name">
				</div>
				<div class="form-group">
					<label>Field Value</label>
					<textarea class="field-value form-control" rows="2" maxlength="1024" placeholder="Field value"></textarea>
				</div>
				<div class="form-group">
					<label>
						<input type="checkbox" class="field-inline">
						Inline
					</label>
				</div>
			</div>
		`;

		$("#fieldsContainer").append(fieldHtml);

		// Remove field handler
		$(`.field-group[data-field-id="${fieldCount}"]`).find(".remove-field").on("click", function () {
			$(this).closest(".field-group").remove();
			updatePreview();
		});

		updatePreview();
	}

	function getEmbedData () {
		const data = {};

		// Basic fields
		const title = $("#embedTitle").val().trim();
		const description = $("#embedDescription").val().trim();
		const url = $("#embedUrl").val().trim();
		const color = $("#embedColor").val().trim();

		if (title) data.title = title;
		if (description) data.description = description;
		if (url) data.url = url;
		if (color) data.color = parseInt(color.replace("#", ""), 16);

		// Author
		const authorName = $("#authorName").val().trim();
		if (authorName) {
			data.author = {
				name: authorName,
			};
			const authorIcon = $("#authorIcon").val().trim();
			const authorUrl = $("#authorUrl").val().trim();
			if (authorIcon) data.author.icon_url = authorIcon;
			if (authorUrl) data.author.url = authorUrl;
		}

		// Footer
		const footerText = $("#footerText").val().trim();
		if (footerText) {
			data.footer = {
				text: footerText,
			};
			const footerIcon = $("#footerIcon").val().trim();
			if (footerIcon) data.footer.icon_url = footerIcon;
		}

		// Timestamp
		if ($("#embedTimestamp").is(":checked")) {
			data.timestamp = true;
		}

		// Images
		const thumbnail = $("#thumbnailUrl").val().trim();
		const image = $("#imageUrl").val().trim();
		if (thumbnail) data.thumbnail = thumbnail;
		if (image) data.image = image;

		// Fields
		const fields = [];
		$(".field-group").each(function () {
			const name = $(this).find(".field-name").val()
				.trim();
			const value = $(this).find(".field-value").val()
				.trim();
			const inline = $(this).find(".field-inline").is(":checked");

			if (name && value) {
				fields.push({ name, value, inline });
			}
		});

		if (fields.length > 0) {
			data.fields = fields;
		}

		return data;
	}

	function updatePreview () {
		const embedData = getEmbedData();

		// Update character count
		let charCount = 0;
		if (embedData.title) charCount += embedData.title.length;
		if (embedData.description) charCount += embedData.description.length;
		if (embedData.footer && embedData.footer.text) charCount += embedData.footer.text.length;
		if (embedData.author && embedData.author.name) charCount += embedData.author.name.length;
		if (embedData.fields) {
			embedData.fields.forEach(field => {
				charCount += field.name.length + field.value.length;
			});
		}
		$("#charCount").text(charCount);

		// Generate preview HTML
		if (Object.keys(embedData).length === 0) {
			$("#embedPreview").html('<p class="text-muted">Your embed preview will appear here</p>');
			return;
		}

		let previewHtml = '<div class="discord-embed"';
		if (embedData.color) {
			previewHtml += ` style="border-left-color: #${embedData.color.toString(16).padStart(6, "0")}"`;
		}
		previewHtml += ">";

		// Author
		if (embedData.author) {
			previewHtml += '<div class="embed-author">';
			if (embedData.author.icon_url) {
				previewHtml += `<img src="${escapeHtml(embedData.author.icon_url)}" alt="Author icon">`;
			}
			previewHtml += `<span>${escapeHtml(embedData.author.name)}</span>`;
			previewHtml += "</div>";
		}

		// Title
		if (embedData.title) {
			if (embedData.url) {
				previewHtml += `<div class="embed-title"><a href="${escapeHtml(embedData.url)}" target="_blank">${escapeHtml(embedData.title)}</a></div>`;
			} else {
				previewHtml += `<div class="embed-title">${escapeHtml(embedData.title)}</div>`;
			}
		}

		// Description
		if (embedData.description) {
			previewHtml += `<div class="embed-description">${escapeHtml(embedData.description)}</div>`;
		}

		// Fields
		if (embedData.fields && embedData.fields.length > 0) {
			previewHtml += '<div class="embed-fields">';
			embedData.fields.forEach(field => {
				const fieldClass = field.inline ? "embed-field inline" : "embed-field";
				previewHtml += `<div class="${fieldClass}">`;
				previewHtml += `<div class="field-name">${escapeHtml(field.name)}</div>`;
				previewHtml += `<div class="field-value">${escapeHtml(field.value)}</div>`;
				previewHtml += "</div>";
			});
			previewHtml += "</div>";
		}

		// Thumbnail
		if (embedData.thumbnail) {
			previewHtml += `<div class="embed-thumbnail"><img src="${escapeHtml(embedData.thumbnail)}" alt="Thumbnail"></div>`;
		}

		// Image
		if (embedData.image) {
			previewHtml += `<div class="embed-image"><img src="${escapeHtml(embedData.image)}" alt="Image"></div>`;
		}

		// Footer
		if (embedData.footer || embedData.timestamp) {
			previewHtml += '<div class="embed-footer">';
			if (embedData.footer) {
				if (embedData.footer.icon_url) {
					previewHtml += `<img src="${escapeHtml(embedData.footer.icon_url)}" alt="Footer icon">`;
				}
				previewHtml += `<span>${escapeHtml(embedData.footer.text)}</span>`;
			}
			if (embedData.timestamp) {
				const now = new Date().toLocaleString();
				previewHtml += `<span class="embed-timestamp">${now}</span>`;
			}
			previewHtml += "</div>";
		}

		previewHtml += "</div>";
		$("#embedPreview").html(previewHtml);
	}

	function loadChannels () {
		$.get(`/api/servers/${svrid}/channels`, (data) => {
			const select = $("#targetChannel");
			select.empty();
			select.append('<option value="">Select a channel...</option>');

			if (data.success && data.channels) {
				data.channels.forEach(channel => {
					if (channel.type === 0 || channel.type === 5) { // Text or Announcement
						select.append(`<option value="${channel.id}">#${channel.name}</option>`);
					}
				});
			}
		});
	}

	function sendEmbed () {
		const channelId = $("#targetChannel").val();
		if (!channelId) {
			alert("Please select a channel!");
			return;
		}

		const embedData = getEmbedData();
		if (Object.keys(embedData).length === 0) {
			alert("Please create an embed first!");
			return;
		}

		$.ajax({
			url: `/dashboard/${svrid}/embed-builder/send`,
			method: "POST",
			contentType: "application/json",
			data: JSON.stringify({ embedData, channelId }),
			success: function (response) {
				if (response.success) {
					alert("✅ Embed sent successfully!");
					$("#sendModal").hide();
				} else {
					alert(`❌ Error: ${response.error || "Unknown error"}`);
				}
			},
			error: function (xhr) {
				const response = xhr.responseJSON;
				alert(`❌ Error: ${response && response.error ? response.error : "Failed to send embed"}`);
			},
		});
	}

	function saveTemplate () {
		const name = $("#templateName").val().trim();
		if (!name) {
			alert("Please enter a template name!");
			return;
		}

		const description = $("#templateDescription").val().trim();
		const embedData = getEmbedData();

		if (Object.keys(embedData).length === 0) {
			alert("Please create an embed first!");
			return;
		}

		$.ajax({
			url: `/dashboard/${svrid}/embed-builder/template/save`,
			method: "POST",
			contentType: "application/json",
			data: JSON.stringify({ name, description, embedData }),
			success: function (response) {
				if (response.success) {
					alert("✅ Template saved successfully!");
					$("#saveTemplateModal").hide();
					$("#templateName").val("");
					$("#templateDescription").val("");
					location.reload(); // Reload to show new template
				} else {
					alert(`❌ Error: ${response.error || "Unknown error"}`);
				}
			},
			error: function (xhr) {
				const response = xhr.responseJSON;
				alert(`❌ Error: ${response && response.error ? response.error : "Failed to save template"}`);
			},
		});
	}

	function loadTemplate (templateId) {
		$.get(`/dashboard/${svrid}/embed-builder/template/${templateId}`, (response) => {
			if (!response.success) {
				alert(`❌ Error: ${response.error || "Failed to load template"}`);
				return;
			}

			const data = response.template.embedData;

			// Clear form
			$("#embedBuilderForm")[0].reset();
			$("#fieldsContainer").empty();
			fieldCount = 0;

			// Load basic fields
			if (data.title) $("#embedTitle").val(data.title);
			if (data.description) $("#embedDescription").val(data.description);
			if (data.url) $("#embedUrl").val(data.url);
			if (data.color) {
				const colorHex = `#${data.color.toString(16).padStart(6, "0")}`;
				$("#embedColor").val(colorHex);
				$("#embedColorPicker").val(colorHex);
			}

			// Load author
			if (data.author) {
				if (data.author.name) $("#authorName").val(data.author.name);
				if (data.author.icon_url) $("#authorIcon").val(data.author.icon_url);
				if (data.author.url) $("#authorUrl").val(data.author.url);
			}

			// Load footer
			if (data.footer) {
				if (data.footer.text) $("#footerText").val(data.footer.text);
				if (data.footer.icon_url) $("#footerIcon").val(data.footer.icon_url);
			}

			// Load timestamp
			if (data.timestamp) $("#embedTimestamp").prop("checked", true);

			// Load images
			if (data.thumbnail) $("#thumbnailUrl").val(data.thumbnail);
			if (data.image) $("#imageUrl").val(data.image);

			// Load fields
			if (data.fields && data.fields.length > 0) {
				data.fields.forEach(field => {
					addField();
					const lastField = $(".field-group").last();
					lastField.find(".field-name").val(field.name);
					lastField.find(".field-value").val(field.value);
					if (field.inline) {
						lastField.find(".field-inline").prop("checked", true);
					}
				});
			}

			updatePreview();
			alert(`✅ Template "${response.template.name}" loaded!`);
		}).fail((xhr) => {
			const response = xhr.responseJSON;
			alert(`❌ Error: ${response && response.error ? response.error : "Failed to load template"}`);
		});
	}

	function deleteTemplate (templateId) {
		$.ajax({
			url: `/dashboard/${svrid}/embed-builder/template/${templateId}`,
			method: "DELETE",
			success: function (response) {
				if (response.success) {
					alert("✅ Template deleted successfully!");
					$(`.template-item[data-template-id="${templateId}"]`).remove();
				} else {
					alert(`❌ Error: ${response.error || "Unknown error"}`);
				}
			},
			error: function (xhr) {
				const response = xhr.responseJSON;
				alert(`❌ Error: ${response && response.error ? response.error : "Failed to delete template"}`);
			},
		});
	}

	function escapeHtml (text) {
		const div = document.createElement("div");
		div.textContent = text;
		return div.innerHTML;
	}
}());
