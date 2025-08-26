<?php
/**
 * Plugin Name: Quiz NeniMaster
 * Plugin URI: https://quiznenimaster.com.br
 * Description: Um plugin para integrar quizzes criados no Quiz NeniMaster ao WordPress.
 * Version: 1.0.0
 * Author: Matheus Pastorini
 * Author URI: https://matheuspastorini.com.br
 * License: GPL2
 */

// Define a versão do plugin
if ( ! defined( 'API_QUIZ_BUILDER_VERSION' ) ) {
    define( 'API_QUIZ_BUILDER_VERSION', '1.0.0' );
}

// Define o caminho base do plugin
if ( ! defined( 'API_QUIZ_BUILDER_PATH' ) ) {
    define( 'API_QUIZ_BUILDER_PATH', plugin_dir_path( __FILE__ ) );
}

// Define a URL base do plugin
if ( ! defined( 'API_QUIZ_BUILDER_URL' ) ) {
    define( 'API_QUIZ_BUILDER_URL', plugin_dir_url( __FILE__ ) );
}

// Inclui o gerenciador de hooks
require_once API_QUIZ_BUILDER_PATH . 'includes/class-api-quiz-builder-loader.php';

// Inclui a lógica central do plugin
require_once API_QUIZ_BUILDER_PATH . 'includes/class-api-quiz-builder.php';

/**
 * Inicia o plugin
 *
 * @return API_Quiz_Builder Instância da classe principal do plugin.
 */
function run_api_quiz_builder() {
    $plugin = new API_Quiz_Builder();
    $plugin->run();
    return $plugin;
}

// Inicia o plugin
run_api_quiz_builder();

// Hooks de ativação e desativação (opcional, para limpeza ou setup inicial)
register_activation_hook( __FILE__, array( 'API_Quiz_Builder', 'activate' ) );
register_deactivation_hook( __FILE__, array( 'API_Quiz_Builder', 'deactivate' ) );