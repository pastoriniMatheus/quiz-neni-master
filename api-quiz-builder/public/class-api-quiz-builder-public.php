<?php
class Api_Quiz_Builder_Public {
    private $plugin_name;
    private $version;

    public function __construct( $plugin_name, $version ) {
        $this->plugin_name = $plugin_name;
        $this->version = $version;
    }

    public function enqueue_scripts() {
        wp_enqueue_script(
            $this->plugin_name,
            plugin_dir_url( __FILE__ ) . 'js/api-quiz-renderer.js',
            array( 'jquery' ),
            $this->version,
            true
        );

        $options = get_option('api_quiz_builder_settings');
        
        wp_localize_script(
            $this->plugin_name,
            'api_quiz_builder_public_vars',
            array(
                'supabase_url' => isset($options['supabase_url']) ? $options['supabase_url'] : '',
                'supabase_anon_key' => isset($options['supabase_anon_key']) ? $options['supabase_anon_key'] : '',
                'api_key' => isset($options['api_key']) ? $options['api_key'] : '',
            )
        );
    }

    public function render_quiz_shortcode( $atts ) {
        $atts = shortcode_atts( array(
            'slug' => '',
        ), $atts, 'quiz_nenimaster' );

        if ( empty( $atts['slug'] ) ) {
            return '<p style="color: red;">Erro: O slug do quiz é obrigatório no shortcode. Ex: [quiz_nenimaster slug="seu-quiz"]</p>';
        }

        $options = get_option('api_quiz_builder_settings');
        if (empty($options['supabase_url']) || empty($options['supabase_anon_key']) || empty($options['api_key'])) {
            return '<p style="color: red;">Erro: As configurações da API do Quiz NeniMaster não estão completas. Por favor, vá para Configurações > NeniMaster Quiz-API.</p>';
        }

        return '<div class="api-quiz-builder-container" data-quiz-slug="' . esc_attr( $atts['slug'] ) . '"></div>';
    }
}