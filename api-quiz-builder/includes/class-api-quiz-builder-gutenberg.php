<?php

/**
 * Gerencia a integração do plugin com o editor Gutenberg.
 *
 * @package API_Quiz_Builder
 * @subpackage API_Quiz_Builder/includes
 */
class API_Quiz_Builder_Gutenberg {

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
     * Registra o bloco Gutenberg personalizado.
     */
    public function register_gutenberg_block() {
        // Registra o bloco no lado do servidor
        register_block_type( 'nenimaster/quiz-block', array(
            'attributes' => array(
                'quizSlug' => array(
                    'type' => 'string',
                    'default' => '',
                ),
            ),
            'render_callback' => array( $this, 'render_quiz_block' ),
        ) );
    }

    /**
     * Callback para renderizar o bloco Gutenberg no frontend.
     *
     * @param array $attributes Os atributos do bloco.
     * @return string O HTML do shortcode.
     */
    public function render_quiz_block( $attributes ) {
        $slug = isset( $attributes['quizSlug'] ) ? $attributes['quizSlug'] : '';
        if ( empty( $slug ) ) {
            return '<p>Por favor, selecione um quiz no painel lateral.</p>';
        }
        return '[quiz_nenimaster slug="' . esc_attr( $slug ) . '"]';
    }

    /**
     * Enfileira os scripts e estilos para o editor de blocos (Gutenberg).
     */
    public function enqueue_block_editor_assets() {
        wp_enqueue_script(
            $this->plugin_name . '-gutenberg-block',
            API_QUIZ_BUILDER_URL . 'admin/js/gutenberg-block.js',
            array( 'wp-blocks', 'wp-element', 'wp-editor', 'wp-components', 'wp-data', 'wp-plugins', 'wp-edit-post', 'wp-i18n', 'wp-api-fetch' ),
            $this->version,
            true
        );
    }
}