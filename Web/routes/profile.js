/**
 * Profile Routes
 * Handles user profile viewing and editing
 */

const profileController = require("../controllers/profile");

module.exports = router => {
	// Primary Profile Routes
	router.get("/profile/:userId", profileController.primaryProfile);
	router.get("/profile/:userId/edit", profileController.editPrimaryProfile);

	// Server Profile Routes
	router.get("/profile/:userId/:serverId", profileController.serverProfile);
	router.get("/profile/:userId/:serverId/edit", profileController.editServerProfile);
};
