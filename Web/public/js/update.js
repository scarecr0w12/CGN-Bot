/* eslint-disable max-len */
$(document).ready(() => {
	window.SkynetUtil = window.SkynetUtil || { dashboard: {} };
	window.SkynetData = window.SkynetData || {};
	SkynetUtil.dashboard.versioning = {};
	SkynetData.IHTML = {
		article: "<article id='{ID}' class='message installer-log is-{LEVEL}'><div class='message-body'><div class='content'>{LOG}</div></div></article>",
		colors: {
			info: "info",
			error: "danger",
			warn: "warning",
			success: "success",
		},
	};

	let totalCountedChunks = 0;
	let totalChunks = 0;

	SkynetUtil.dashboard.versioning.downloadVersion = (button, branch, tag) => {
		totalCountedChunks = 0;

		const progress = $("progress.is-appended");
		progress.attr("value", 0);
		progress.css("height", ".5rem");
		button.addClass("is-loading");
		const setProgress = percentage => {
			progress.attr("value", Math.round(percentage));
		};

		SkynetData.dashboard.socket.on("totalChunks", chunks => {
			totalChunks = chunks;
		});
		SkynetData.dashboard.socket.on("downloadSuccess", () => {
			SkynetUtil.log(`[UPDATE] Version Download finished with total of ${totalCountedChunks} bytes. (100%)`);
			button.html("Install").removeClass("is-loading");
			$(".version-update-indicator").css("animation-name", "none");
			setProgress(100);
			$("#version-cloud-icon").remove();
			return setTimeout(() => progress.css("height", "0"), 500);
		});
		SkynetData.dashboard.socket.on("chunk", chunk => {
			totalCountedChunks += chunk;
			let percentage = (totalCountedChunks / totalChunks) * 100;
			if (percentage > 95) percentage = 95;
			setProgress(percentage);
			SkynetUtil.log(`[UPDATE] Received Chunk Size: ${chunk} (${percentage}%)`);
		});

		SkynetUtil.log("[UPDATE] Starting Version Download...");
		SkynetData.dashboard.socket.emit("download", {
			branch,
			tag,
		});
	};

	SkynetUtil.dashboard.versioning.installVersion = (button, branch, tag) => {
		$(".version-update-indicator").css("animation-name", "version-update-indicator-install");
		$("#version-installer").slideToggle();
		button.addClass("is-loading");

		let currentLog;
		let updating = true;
		const logMessage = log => {
			const message = $(`#${log.id}`);
			if (!message[0]) {
				$("#installer-logs").prepend(SkynetData.IHTML.article.replace("{ID}", log.id)
					.replace("{LEVEL}", SkynetData.IHTML.colors[log.type])
					.replace("{LOG}", log.msg));
				currentLog = log.id;
			} else {
				message.removeClass("is-info").removeClass("is-warning").removeClass("is-error");
				message.addClass(`is-${SkynetData.IHTML.colors[log.type]}`);
				message.find(".content").html(log.msg);
				if (log.header) message.find(".message-header").html(log.header);
			}
		};
		const onDisconnect = err => {
			if (!updating) return;
			if (err === "disconnect") {
				logMessage({ id: currentLog, type: "error", msg: "Lost connection during operation." });
				logMessage({ id: "update-warning", type: "error", msg: "Restart SkynetBot and attempt to re-install the update to prevent corruption issues.", header: "Uh-oh. Lost connection to SkynetBot!" });
			} else {
				logMessage({ id: currentLog, type: "error", msg: "An unexpected exception occurred. Please try installing again." });
				SkynetUtil.error(JSON.stringify(err));
			}
			button.removeClass("is-loading").attr("disabled", true);
			$(".version-update-indicator").css("animation-name", "version-update-indicator-error");
		};
		SkynetData.dashboard.socket.on("disconnect", () => onDisconnect("disconnect"));
		SkynetData.dashboard.socket.on("err", onDisconnect);
		SkynetData.dashboard.socket.on("installLog", logMessage);
		SkynetData.dashboard.socket.on("installFinish", () => {
			logMessage({ id: "update-warning", type: "success", msg: "SkynetBot has been successfully updated. Please restart SkynetBot to apply the changes. You may now close this window.", header: "Great success!" });
			button.remove();
			$(".version-update-indicator").css("animation-name", "version-update-indicator-success");
			updating = false;
		});
		SkynetData.dashboard.socket.emit("install", {
			branch,
			tag,
		});
	};


	const button = $("#update-btn");
	button.click(() => {
		const op = button.data("op");
		if (op === "download") {
			SkynetUtil.dashboard.versioning.downloadVersion(button, button.data("branch"), button.data("tag"));
			button.data("op", "install");
		} else {
			SkynetUtil.dashboard.versioning.installVersion(button, button.data("branch"), button.data("tag"));
		}
	});
});
