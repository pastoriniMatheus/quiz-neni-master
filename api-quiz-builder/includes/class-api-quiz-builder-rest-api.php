<?php
/**
 * The REST API functionality of the plugin.
 *
 * @link       https://nenimaster.com
 * @since      1.0.0
 *
 * @package    API_Quiz_Builder
 * @subpackage API_Quiz_Builder/includes
 */

/**
 * The REST API functionality of the plugin.
 *
 * This class defines all methods for registering custom REST API endpoints.
 *
 * @since      1.0.0
 * @package    API_Quiz_Builder
 * @subpackage API_Quiz_Builder/includes
 * @author     NeniMaster <contato@nenimaster.com>
 */
class API_Quiz_Builder_REST_API {

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
     * Register the custom REST API routes.
     *
     * @since    1.0.0
     */
    public function register_routes() {
        register_rest_route( 'api-quiz/v1', '/quiz/(?P<slug>[a-zA-Z0-9-]+)', array(
            'methods'             => 'GET',
            'callback'            => array( $this, 'get_quiz_data' ),
            'permission_callback' => '__return_true', // Public endpoint
            'args'                => array(
                'slug' => array(
                    'validate_callback' => function( $param, $request, $key ) {
                        return is_string( $param ) && ! empty( $param );
                    }
                ),
            ),
        ));
    }

    /**
     * Callback for the /quiz/{slug} REST API endpoint.
     * Fetches quiz data from the local database.
     *
     * @since    1.0.0
     * @param    WP_REST_Request $request The request object.
     * @return   WP_REST_Response The response object.
     */
    public function get_quiz_data( WP_REST_Request $request ) {
        $slug = $request['slug'];

        $quiz = API_Quiz_Builder_DB::get_quiz_by_slug( $slug );

        if ( ! $quiz ) {
            return new WP_REST_Response( array( 'message' => 'Quiz não encontrado.' ), 404 );
        }

        // Decode JSON fields for the frontend
        $quiz->sessions = json_decode( $quiz->sessions );
        $quiz->settings = json_decode( $quiz->settings );
        $quiz->design = json_decode( $quiz->design );

        return new WP_REST_Response( $quiz, 200 );
    }
}
?>