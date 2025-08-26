<?php
/**
 * Plugin Name: NeniMaster Quiz-API
 * Description: Integra quizzes do Quiz NeniMaster via API para renderização direta no WordPress.
 * Version: 1.0.0
 * Author: Matheus Pastorini
 * Author URI: https://nenimaster.com
 * License: GPL2
 */

// Exit if accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

/**
 * The core plugin class that is used to define internationalization,
 * admin-specific hooks, and public-facing site hooks.
 */
require_once plugin_dir_path( __FILE__ ) . 'includes/class-api-quiz-builder.php';

/**
 * The database functionality of the plugin.
 * This is required here so the activation hook can find the `install` method.
 */
require_once plugin_dir_path( __FILE__ ) . 'includes/class-api-quiz-builder-db.php';


/**
 * Begins execution of the plugin.
 *
 * Since everything within the plugin is registered via hooks,
 * then kicking off the plugin from this point in the file means
 * that all of the plugin's functionality is registered and
 * ready for use.
 *
 * @since    1.0.0
 */
function run_api_quiz_builder() {
    $plugin = new API_Quiz_Builder();
    $plugin->run();
}
run_api_quiz_builder();

// Register activation hook for database setup
// Using __FILE__ ensures the hook is registered for this specific plugin file.
// The API_Quiz_Builder_DB class is now guaranteed to be loaded.
register_activation_hook( __FILE__, array( 'API_Quiz_Builder_DB', 'install' ) );

?>