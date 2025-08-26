<?php

/**
 * Gerencia a interface e a lógica do plugin no painel administrativo do WordPress.
 *
 * @package API_Quiz_Builder
 * @subpackage API_Quiz_Builder/admin
 */
class API_Quiz_Builder_Admin {

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
     * Adiciona um item de menu para as configurações do plugin no painel do WordPress.
     */
    public function add_plugin_admin_menu() {
        add_menu_page(
            'Quiz NeniMaster Settings',
            'Quiz NeniMaster',
            'manage_options',
            $this->plugin_name,
            array( $this, 'settings_page' ),
            'dashicons-forms',
            60
        );
    }

    /**
     * Registra as seções e campos de configuração usando a API de Settings do WordPress.
     */
    public function settings_init() {
        register_setting( 'api_quiz_builder_group', 'api_quiz_builder_settings' );

        add_settings_section(
            'api_quiz_builder_section_general',
            'Configurações Gerais',
            null,
            'api_quiz_builder_page'
        );

        add_settings_field(
            'supabase_url',
            'URL do Sistema (Supabase)',
            array( $this, 'render_supabase_url_field' ),
            'api_quiz_builder_page',
            'api_quiz_builder_section_general'
        );

        add_settings_field(
            'supabase_anon_key',
            'Supabase Anon Key',
            array( $this, 'render_supabase_anon_key_field' ),
            'api_quiz_builder_page',
            'api_quiz_builder_section_general'
        );

        add_settings_field(
            'api_key',
            'Chave da API (Gerada no Painel)',
            array( $this, 'render_api_key_field' ),
            'api_quiz_builder_page',
            'api_quiz_builder_section_general'
        );

        add_settings_section(
            'api_quiz_builder_section_quizzes',
            'Meus Quizzes Publicados',
            array( $this, 'render_quizzes_section_description' ),
            'api_quiz_builder_page'
        );
    }

    /**
     * Renderiza o campo para a URL do Supabase.
     */
    public function render_supabase_url_field() {
        $options = API_Quiz_Builder::get_plugin_settings();
        $value = isset( $options['supabase_url'] ) ? esc_attr( $options['supabase_url'] ) : '';
        echo '<input type="url" id="supabase_url" name="api_quiz_builder_settings[supabase_url]" value="' . $value . '" class="regular-text" placeholder="https://your-project-id.supabase.co" />';
        echo '<p class="description">A URL base do seu projeto Supabase.</p>';
    }

    /**
     * Renderiza o campo para a Supabase Anon Key.
     */
    public function render_supabase_anon_key_field() {
        $options = API_Quiz_Builder::get_plugin_settings();
        $value = isset( $options['supabase_anon_key'] ) ? esc_attr( $options['supabase_anon_key'] ) : '';
        echo '<input type="text" id="supabase_anon_key" name="api_quiz_builder_settings[supabase_anon_key]" value="' . $value . '" class="regular-text" placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." />';
        echo '<p class="description">A chave pública (anon key) do seu projeto Supabase.</p>';
    }

    /**
     * Renderiza o campo para a Chave da API.
     */
    public function render_api_key_field() {
        $options = API_Quiz_Builder::get_plugin_settings();
        $value = isset( $options['api_key'] ) ? esc_attr( $options['api_key'] ) : '';
        echo '<input type="text" id="api_key" name="api_quiz_builder_settings[api_key]" value="' . $value . '" class="regular-text" placeholder="qb_..." />';
        echo '<p class="description">Uma chave de API gerada no painel do Quiz NeniMaster para autenticação.</p>';
    }

    /**
     * Renderiza a descrição da seção de quizzes.
     */
    public function render_quizzes_section_description() {
        echo '<p>Clique no botão abaixo para carregar e listar todos os quizzes publicados do seu sistema Quiz NeniMaster.</p>';
        echo '<button id="load-quizzes-btn" class="button button-primary">Carregar Quizzes</button>';
        echo '<span class="spinner" id="load-quizzes-spinner"></span>';
        echo '<div id="quiz-list-container" class="qnm-quiz-list"><p id="quiz-list-status" class="qnm-status-text">Nenhum quiz carregado.</p></div>';
    }

    /**
     * Renderiza o HTML da página de configurações.
     */
    public function settings_page() {
        ?>
        <div class="wrap qnm-wrap">
            <div class="qnm-header">
                <h1><span class="dashicons dashicons-forms" style="font-size: 1.2em; margin-right: 5px;"></span> Quiz NeniMaster Settings</h1>
                <p>Configure a integração do seu site WordPress com o sistema Quiz NeniMaster.</p>
            </div>

            <form method="post" action="options.php">
                <?php
                settings_fields( 'api_quiz_builder_group' );
                do_settings_sections( 'api_quiz_builder_page' );
                submit_button();
                ?>
            </form>
        </div>
        <?php
    }

    /**
     * Enfileira o script api-quiz-builder-admin.js e o estilo api-quiz-builder-admin.css.
     */
    public function enqueue_admin_scripts() {
        wp_enqueue_style( $this->plugin_name . '-admin', API_QUIZ_BUILDER_URL . 'admin/css/api-quiz-builder-admin.css', array(), $this->version, 'all' );
        wp_enqueue_script( $this->plugin_name . '-admin', API_QUIZ_BUILDER_URL . 'admin/js/api-quiz-builder-admin.js', array( 'jquery' ), $this->version, true );

        // Ponto CRÍTICO: Passa as configurações salvas para o JavaScript
        $settings = API_Quiz_Builder::get_plugin_settings();
        wp_localize_script(
            $this->plugin_name . '-admin',
            'quizNeniMasterAdmin',
            array(
                'supabase_url'      => isset( $settings['supabase_url'] ) ? $settings['supabase_url'] : '',
                'supabase_anon_key' => isset( $settings['supabase_anon_key'] ) ? $settings['supabase_anon_key'] : '',
                'api_key'           => isset( $settings['api_key'] ) ? $settings['api_key'] : '',
            )
        );
    }
}