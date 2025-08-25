<?php
/**
 * Plugin Name: API Quiz Builder
 * Description: Integra quizzes do Quiz NeniMaster via API para renderização direta no WordPress.
 * Version: 1.0.0
 * Author: NeniMaster
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

?>