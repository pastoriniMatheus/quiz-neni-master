<?php

/**
 * The public-facing functionality of the plugin.
 *
 * @link       https://matheuspastorini.com.br
 * @since      1.0.0
 *
 * @package    Api_Quiz_Builder
 * @subpackage Api_Quiz_Builder/public
 */

/**
 * The public-facing functionality of the plugin.
 *
 * Defines the plugin name, version, and two examples hooks for how to
 * enqueue the public-facing stylesheet and JavaScript.
 *
 * @package    Api_Quiz_Builder
 * @subpackage Api_Quiz_Builder/public
 * @author     Matheus Pastorini <matheus.pastorini@gmail.com>
 */
class Api_Quiz_Builder_Public {

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
	 * @param      string    $plugin_name       The name of the plugin.
	 * @param      string    $version    The version of this plugin.
	 */
	public function __construct( $plugin_name, $version ) {

		$this->plugin_name = $plugin_name;
		$this->version = $version;

	}

	/**
	 * Register the stylesheets for the public-facing side of the site.
	 *
	 * @since    1.0.0
	 */
	public function enqueue_styles() {

		wp_enqueue_style( $this->plugin_name, plugin_dir_url( __FILE__ ) . 'css/api-quiz-builder-public.css', array(), $this->version, 'all' );

	}

	/**
	 * Register the JavaScript for the public-facing side of the site.
	 *
	 * @since    1.0.0
	 */
	public function enqueue_scripts() {

		wp_enqueue_script( $this->plugin_name, plugin_dir_url( __FILE__ ) . 'js/api-quiz-renderer.js', array( 'jquery' ), $this->version, false );

		$supabase_url = get_option('api_quiz_builder_supabase_url');
		$api_key = get_option('api_quiz_builder_api_key');
		$supabase_anon_key = get_option('api_quiz_builder_supabase_anon_key');

		wp_localize_script( $this->plugin_name, 'quizNeniMaster', array(
			'supabase_url' => $supabase_url,
			'api_key' => $api_key,
			'supabase_anon_key' => $supabase_anon_key,
		));

	}

	/**
	 * Render the quiz shortcode.
	 *
	 * @since 1.0.0
	 * @param array $atts Shortcode attributes.
	 * @return string HTML output for the quiz.
	 */
	public function render_quiz_shortcode( $atts ) {
		$atts = shortcode_atts( array(
			'slug' => '',
		), $atts, 'quiz_nenimaster' );

		if ( empty( $atts['slug'] ) ) {
			return '<p>Erro: O shortcode [quiz_nenimaster] requer um atributo "slug".</p>';
		}

		// The JavaScript will dynamically load and render the quiz into this container.
		return sprintf( '<div id="quiz-nenimaster-container-%s" class="api-quiz-builder-container" data-quiz-slug="%s">
			<div class="loading-message">Carregando quiz...</div>
		</div>', esc_attr( $atts['slug'] ), esc_attr( $atts['slug'] ) );
	}

}