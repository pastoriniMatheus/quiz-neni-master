<?php
/**
 * The file that defines the core plugin class
 *
 * A class definition that holds all of the plugin's functionality.
 *
 * @link       https://nenimaster.com
 * @since      1.0.0
 *
 * @package    API_Quiz_Builder
 * @subpackage API_Quiz_Builder/includes
 */

/**
 * The core plugin class.
 *
 * This is used to define internationalization, admin-specific hooks, and
 * public-facing site hooks.
 *
 * Also maintains the unique identifier of this plugin as well as the current
 * version of the plugin.
 *
 * @since      1.0.0
 * @package    API_Quiz_Builder
 * @subpackage API_Quiz_Builder/includes
 * @author     NeniMaster <contato@nenimaster.com>
 */
class API_Quiz_Builder {

    /**
     * The loader that's responsible for maintaining and registering all hooks that power the plugin.
     *
     * @since    1.0.0
     * @access   protected
     * @var      API_Quiz_Builder_Loader    $loader    Maintains and registers all hooks for the plugin.
     */
    protected $loader;

    /**
     * The unique identifier of this plugin.
     *
     * @since    1.0.0
     * @access   protected
     * @var      string    $plugin_name    The string used to uniquely identify this plugin.
     */
    protected $plugin_name;

    /**
     * The current version of the plugin.
     *
     * @since    1.0.0
     * @access   protected
     * @var      string    $version    The current version of the plugin.
     */
    protected $version;

    /**
     * Define the core functionality of the plugin.
     *
     * @since    1.0.0
     */
    public function __construct() {
        $this->plugin_name = 'api-quiz-builder';
        $this->version = '1.0.0';

        $this->load_dependencies();
        $this->define_admin_hooks();
        $this->define_public_hooks();
        $this->define_rest_api_hooks();
        $this->define_shortcode_hooks();
    }

    /**
     * Load the required dependencies for this plugin.
     *
     * Include the following files that make up the plugin:
     *
     * - API_Quiz_Builder_Loader. Orchestrates the hooks of the plugin.
     * - API_Quiz_Builder_Admin. Defines all hooks for the admin area.
     * - API_Quiz_Builder_Public. Defines all hooks for the public side of the site.
     * - API_Quiz_Builder_DB. Handles database operations.
     * - API_Quiz_Builder_Shortcode. Handles shortcode registration and rendering.
     * - API_Quiz_Builder_REST_API. Handles custom REST API endpoints.
     *
     * @since    1.0.0
     * @access   private
     */
    private function load_dependencies() {
        require_once plugin_dir_path( dirname( __FILE__ ) ) . 'includes/class-api-quiz-builder-loader.php';
        require_once plugin_dir_path( dirname( __FILE__ ) ) . 'includes/class-api-quiz-builder-db.php';
        require_once plugin_dir_path( dirname( __FILE__ ) ) . 'admin/class-api-quiz-builder-admin.php';
        require_once plugin_dir_path( dirname( __FILE__ ) ) . 'includes/class-api-quiz-builder-shortcode.php';
        require_once plugin_dir_path( dirname( __FILE__ ) ) . 'includes/class-api-quiz-builder-rest-api.php';
        
        $this->loader = new API_Quiz_Builder_Loader();
    }

    /**
     * Register all of the hooks related to the admin area functionality
     * of the plugin.
     *
     * @since    1.0.0
     * @access   private
     */
    private function define_admin_hooks() {
        $plugin_admin = new API_Quiz_Builder_Admin( $this->get_plugin_name(), $this->get_version() );

        $this->loader->add_action( 'admin_menu', $plugin_admin, 'add_plugin_admin_menu' );
        $this->loader->add_action( 'admin_enqueue_scripts', $plugin_admin, 'enqueue_styles' );
        $this->loader->add_action( 'admin_enqueue_scripts', $plugin_admin, 'enqueue_scripts' );
        $this->loader->add_action( 'wp_ajax_api_quiz_builder_sync_quizzes', $plugin_admin, 'sync_quizzes_callback' );
    }

    /**
     * Register all of the hooks related to the public-facing functionality
     * of the plugin.
     *
     * @since    1.0.0
     * @access   private
     */
    private function define_public_hooks() {
        // For now, public hooks are primarily handled by the shortcode and REST API.
        // If we need global public scripts/styles, they would go here.
    }

    /**
     * Register all of the hooks related to the REST API functionality
     * of the plugin.
     *
     * @since    1.0.0
     * @access   private
     */
    private function define_rest_api_hooks() {
        $plugin_rest_api = new API_Quiz_Builder_REST_API( $this->get_plugin_name(), $this->get_version() );
        $this->loader->add_action( 'rest_api_init', $plugin_rest_api, 'register_routes' );
    }

    /**
     * Register all of the hooks related to the shortcode functionality
     * of the plugin.
     *
     * @since    1.0.0
     * @access   private
     */
    private function define_shortcode_hooks() {
        $plugin_shortcode = new API_Quiz_Builder_Shortcode( $this->get_plugin_name(), $this->get_version() );
        $this->loader->add_action( 'init', $plugin_shortcode, 'register_shortcode' );
        $this->loader->add_action( 'wp_enqueue_scripts', $plugin_shortcode, 'enqueue_public_assets' );
    }

    /**
     * Run the loader to execute all of the hooks with WordPress.
     *
     * @since    1.0.0
     */
    public function run() {
        $this->loader->run();
        // Register activation hook for database setup
        register_activation_hook( plugin_dir_path( dirname( __FILE__ ) ) . 'api-quiz-builder.php', array( 'API_Quiz_Builder_DB', 'install' ) );
    }

    /**
     * The name of the plugin used to uniquely identify it within the context of WordPress and
     * to define internationalization functionality.
     *
     * @since     1.0.0
     * @return    string    The name of the plugin.
     */
    public function get_plugin_name() {
        return $this->plugin_name;
    }

    /**
     * The reference to the class that orchestrates the hooks with the plugin.
     *
     * @since     1.0.0
     * @return    API_Quiz_Builder_Loader    Orchestrates the hooks of the plugin.
     */
    public function get_loader() {
        return $this->loader;
    }

    /**
     * Retrieve the version number of the plugin.
     *
     * @since     1.0.0
     * @return    string    The version number of the plugin.
     */
    public function get_version() {
        return $this->version;
    }
}

// This class is a generic loader for WordPress hooks.
// It's a common pattern in WP plugin development to centralize hook management.
// I'll create a minimal version of it.
class API_Quiz_Builder_Loader {
    protected $actions;
    protected $filters;

    public function __construct() {
        $this->actions = array();
        $this->filters = array();
    }

    public function add_action( $hook, $component, $callback, $priority = 10, $accepted_args = 1 ) {
        $this->actions = $this->add( $this->actions, $hook, $component, $callback, $priority, $accepted_args );
    }

    public function add_filter( $hook, $component, $callback, $priority = 10, $accepted_args = 1 ) {
        $this->filters = $this->add( $this->filters, $hook, $component, $callback, $priority, $accepted_args );
    }

    private function add( $hooks, $hook, $component, $callback, $priority, $accepted_args ) {
        $hooks[] = array(
            'hook'          => $hook,
            'component'     => $component,
            'callback'      => $callback,
            'priority'      => $priority,
            'accepted_args' => $accepted_args
        );
        return $hooks;
    }

    public function run() {
        foreach ( $this->filters as $hook ) {
            add_filter( $hook['hook'], array( $hook['component'], $hook['callback'] ), $hook['priority'], $hook['accepted_args'] );
        }
        foreach ( $this->actions as $hook ) {
            add_action( $hook['hook'], array( $hook['component'], $hook['callback'] ), $hook['priority'], $hook['accepted_args'] );
        }
    }
}
?>