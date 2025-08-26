<?php

/**
 * Gerencia a exibição pública do plugin, incluindo o shortcode e scripts de frontend.
 *
 * @package API_Quiz_Builder
 * @subpackage API_Quiz_Builder/public
 */
class API_Quiz_Builder_Public {

    /**
     * O identificador único deste plugin.
     *
     * @var string $plugin_name O nome do plugin usado para internacionalização e identificação.
     */
    private $plugin_name;

    /**
     * A versão atual do plugin.
     *
     * @var string $version A versão atual do plugin.
     */
    private $version;

    /**
     * Construtor da classe.
     *
     * @param string $plugin_name O nome do plugin.
     * @param string $version     A versão do plugin.
     */
    public function __construct( $plugin_name, $version ) {
        $this->plugin_name = $plugin_name;
        $this->version = $version;
    }

    /**
     * Enfileira os scripts e estilos necessários para o frontend.
     */
    public function enqueue_public_scripts() {
        wp_enqueue_style( $this->plugin_name . '-public', API_QUIZ_BUILDER_URL . 'public/css/api-quiz-builder-public.css', array(), $this->version, 'all' );
        wp_enqueue_script( $this->plugin_name . '-public', API_QUIZ_BUILDER_URL . 'public/js/api-quiz-renderer.js', array( 'jquery' ), $this->version, true );

        // Ponto CRÍTICO: Passa as configurações salvas para o JavaScript público
        $settings = API_Quiz_Builder::get_plugin_settings();
        wp_localize_script(
            $this->plugin_name . '-public',
            'quizNeniMasterPublic',
            array(
                'supabase_url'      => isset( $settings['supabase_url'] ) ? $settings['supabase_url'] : '',
                'supabase_anon_key' => isset( $settings['supabase_anon_key'] ) ? $settings['supabase_anon_key'] : '',
                'api_key'           => isset( $settings['api_key'] ) ? $settings['api_key'] : '',
            )
        );
    }

    /**
     * Registra o shortcode [quiz_nenimaster].
     */
    public function register_shortcode() {
        add_shortcode( 'quiz_nenimaster', array( $this, 'shortcode_callback' ) );
    }

    /**
     * Callback para o shortcode [quiz_nenimaster].
     *
     * @param array $atts Os atributos do shortcode.
     * @return string O HTML do contêiner do quiz.
     */
    public function shortcode_callback( $atts ) {
        $atts = shortcode_atts(
            array(
                'slug' => '',
            ),
            $atts,
            'quiz_nenimaster'
        );

        $slug = sanitize_title( $atts['slug'] );

        if ( empty( $slug ) ) {
            return '<p style="color: red;">Erro: O shortcode [quiz_nenimaster] requer um atributo "slug". Ex: [quiz_nenimaster slug="meu-quiz-exemplo"]</p>';
        }

        // Retorna um div que será preenchido pelo JavaScript
        return '<div class="api-quiz-builder-container" data-quiz-slug="' . esc_attr( $slug ) . '"></div>';
    }
}