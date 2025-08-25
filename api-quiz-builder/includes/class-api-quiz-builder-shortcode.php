<?php
/**
 * The shortcode functionality of the plugin.
 *
 * @link       https://nenimaster.com
 * @since      1.0.0
 *
 * @package    API_Quiz_Builder
 * @subpackage API_Quiz_Builder/includes
 */

/**
 * The shortcode functionality of the plugin.
 *
 * This class defines all methods for registering and rendering the shortcode.
 *
 * @since      1.0.0
 * @package    API_Quiz_Builder
 * @subpackage API_Quiz_Builder/includes
 * @author     NeniMaster <contato@nenimaster.com>
 */
class API_Quiz_Builder_Shortcode {

    /**
     * The ID of this plugin.
     *
     * @since    1.0.0
     * @access   private
     * @var      string    $plugin_name    The ID of this plugin.
     */
    private $plugin_name;

    /**
     * The version of this plugin.
     *
     * @since    1.0.0
     * @access   private
     * @var      string    $version    The current version of this plugin.
     */
    private $version;

    /**
     * Initialize the class and set its properties.
     *
     * @since    1.0.0
     * @param      string    $plugin_name       The name of this plugin.
     * @param      string    $version           The version of this plugin.
     */
    public function __construct( $plugin_name, $version ) {
        $this->plugin_name = $plugin_name;
        $this->version = $version;
    }

    /**
     * Register the shortcode.
     *
     * @since    1.0.0
     */
    public function register_shortcode() {
        add_shortcode( 'api_quiz', array( $this, 'render_quiz_shortcode' ) );
    }

    /**
     * Enqueue public assets (JS and CSS) for the quiz renderer.
     *
     * @since    1.0.0
     */
    public function enqueue_public_assets() {
        wp_enqueue_style( $this->plugin_name . '-public', plugin_dir_url( dirname( __FILE__ ) ) . 'public/css/api-quiz-builder-public.css', array(), $this->version, 'all' );
        wp_enqueue_script( $this->plugin_name . '-renderer', plugin_dir_url( dirname( __FILE__ ) ) . 'public/js/api-quiz-renderer.js', array(), $this->version, true );
        
        // Localize script with REST API URL
        wp_localize_script( $this->plugin_name . '-renderer', 'api_quiz_builder_public_vars', array(
            'rest_url' => get_rest_url( null, 'api-quiz/v1/quiz' ),
        ));
    }

    /**
     * Render the quiz shortcode.
     *
     * @since    1.0.0
     * @param    array $atts Shortcode attributes.
     * @return   string The HTML output for the quiz.
     */
    public function render_quiz_shortcode( $atts ) {
        $atts = shortcode_atts( array(
            'slug' => '',
        ), $atts, 'api_quiz' );

        $slug = sanitize_title( $atts['slug'] );

        if ( empty( $slug ) ) {
            return '<p style="color: red;">Erro: O shortcode [api_quiz] requer um atributo "slug".</p>';
        }

        // The JavaScript will fetch the actual quiz data via REST API.
        // We just provide a container and the slug.
        return sprintf(
            '<div id="api-quiz-container-%s" class="api-quiz-builder-container" data-quiz-slug="%s">
                <p class="loading-message">Carregando quiz...</p>
            </div>',
            esc_attr( $slug ),
            esc_attr( $slug )
        );
    }
}
?>