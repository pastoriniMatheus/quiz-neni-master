<?php
class Api_Quiz_Builder {
    protected $loader;
    protected $plugin_name;
    protected $version;

    public function __construct() {
        $this->plugin_name = 'api-quiz-builder';
        $this->version = '3.2.0'; // Version bump for new features
        $this->load_dependencies();
        $this->define_admin_hooks();
        $this->define_public_hooks();
        $this->define_gutenberg_hooks();
    }

    private function load_dependencies() {
        $plugin_root_path = plugin_dir_path( dirname( __FILE__ ) );

        require_once $plugin_root_path . 'includes/class-api-quiz-builder-loader.php';
        require_once $plugin_root_path . 'admin/class-api-quiz-builder-admin.php';
        require_once $plugin_root_path . 'public/class-api-quiz-builder-public.php';
        require_once $plugin_root_path . 'includes/class-api-quiz-builder-gutenberg.php';
        
        $this->loader = new Api_Quiz_Builder_Loader();
    }

    private function define_admin_hooks() {
        $plugin_admin = new Api_Quiz_Builder_Admin( $this->get_plugin_name(), $this->get_version() );
        $this->loader->add_action( 'admin_menu', $plugin_admin, 'add_options_page' );
        $this->loader->add_action( 'admin_init', $plugin_admin, 'register_settings' );
        // This was the missing line that caused the bug
        $this->loader->add_action( 'admin_enqueue_scripts', $plugin_admin, 'enqueue_styles_and_scripts' );
    }

    private function define_public_hooks() {
        $plugin_public = new Api_Quiz_Builder_Public( $this->get_plugin_name(), $this->get_version() );
        $this->loader->add_action( 'wp_enqueue_scripts', $plugin_public, 'enqueue_scripts' );
        add_shortcode( 'quiz_nenimaster', array( $plugin_public, 'render_quiz_shortcode' ) );
    }

    private function define_gutenberg_hooks() {
        $gutenberg_block = new Api_Quiz_Builder_Gutenberg( $this->get_plugin_name(), $this->get_version() );
        $this->loader->add_action( 'init', $gutenberg_block, 'register_block' );
        $this->loader->add_action( 'rest_api_init', $gutenberg_block, 'register_rest_route' );
    }

    public function run() {
        $this->loader->run();
    }

    public function get_plugin_name() {
        return $this->plugin_name;
    }

    public function get_version() {
        return $this->version;
    }
}