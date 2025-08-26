<?php
/**
 * Plugin Name:       NeniMaster Quiz-API
 * Description:       Renderiza quizzes da plataforma NeniMaster via API.
 * Version:           3.1.0
 * Author:            NeniMaster
 * License:           GPL-2.0+
 * License URI:       http://www.gnu.org/licenses/gpl-2.0.txt
 * Text Domain:       api-quiz-builder
 */

if ( ! defined( 'WPINC' ) ) {
    die;
}

define( 'API_QUIZ_BUILDER_VERSION', '3.1.0' );

require_once plugin_dir_path( __FILE__ ) . 'includes/class-api-quiz-builder.php';

function run_api_quiz_builder() {
    $plugin = new Api_Quiz_Builder();
    $plugin->run();
}
run_api_quiz_builder();