<?php
class Api_Quiz_Builder_Admin {
    private $plugin_name;
    private $version;

    public function __construct( $plugin_name, $version ) {
        $this->plugin_name = $plugin_name;
        $this->version = $version;
    }

    public function add_options_page() {
        add_options_page(
            'NeniMaster Quiz-API Configurações',
            'NeniMaster Quiz-API',
            'manage_options',
            $this->plugin_name,
            array( $this, 'create_admin_page' )
        );
    }

    public function enqueue_styles_and_scripts($hook) {
        if ('settings_page_' . $this->plugin_name !== $hook) {
            return;
        }
        wp_enqueue_style(
            $this->plugin_name,
            plugin_dir_url( __FILE__ ) . 'css/api-quiz-builder-admin.css',
            array(),
            $this->version,
            'all'
        );
        wp_enqueue_script(
            $this->plugin_name,
            plugin_dir_url( __FILE__ ) . 'js/api-quiz-builder-admin.js',
            array( 'jquery' ),
            $this->version,
            true
        );
        
        $options = get_option('api_quiz_builder_settings');
        wp_localize_script($this->plugin_name, 'quizNeniMaster', [
            'apiUrl' => isset($options['supabase_url']) ? $options['supabase_url'] : '',
            'apiKey' => isset($options['api_key']) ? $options['api_key'] : '',
            'anonKey' => isset($options['supabase_anon_key']) ? $options['supabase_anon_key'] : '',
        ]);
    }

    public function create_admin_page() {
        ?>
        <div class="wrap qnm-wrap">
            <div class="qnm-header">
                <h1>NeniMaster Quiz-API</h1>
                <p>Configure suas credenciais e gerencie seus quizzes.</p>
            </div>

            <div class="qnm-grid">
                <div class="qnm-card">
                    <h2>Configurações da API</h2>
                    <form method="post" action="options.php">
                        <?php
                        settings_fields( 'api_quiz_builder_options_group' );
                        do_settings_sections( $this->plugin_name );
                        submit_button('Salvar Configurações');
                        ?>
                    </form>
                </div>
                <div class="qnm-card">
                    <h2>Quizzes Disponíveis</h2>
                    <p>Clique no botão abaixo para carregar seus quizzes publicados. As credenciais da API devem ser salvas primeiro.</p>
                    <button id="load-quizzes-btn" class="button button-primary">Carregar Quizzes</button>
                    <span id="load-quizzes-spinner" class="spinner"></span>
                    <div id="quiz-list-container" class="qnm-quiz-list">
                        <p id="quiz-list-status" class="qnm-status-text">Aguardando para carregar quizzes...</p>
                    </div>
                </div>
            </div>
        </div>
        <?php
    }

    public function register_settings() {
        register_setting(
            'api_quiz_builder_options_group',
            'api_quiz_builder_settings'
        );

        add_settings_section(
            'api_quiz_builder_main_section',
            null, // Title is handled in the page markup
            null,
            $this->plugin_name
        );

        add_settings_field('supabase_url', 'Supabase URL', array( $this, 'field_html_callback' ), $this->plugin_name, 'api_quiz_builder_main_section', ['id' => 'supabase_url', 'type' => 'url', 'placeholder' => 'https://<project-id>.supabase.co']);
        add_settings_field('supabase_anon_key', 'Supabase Anon Key', array( $this, 'field_html_callback' ), $this->plugin_name, 'api_quiz_builder_main_section', ['id' => 'supabase_anon_key', 'type' => 'text', 'class' => 'large-text']);
        add_settings_field('api_key', 'Chave da API (x-api-key)', array( $this, 'field_html_callback' ), $this->plugin_name, 'api_quiz_builder_main_section', ['id' => 'api_key', 'type' => 'text', 'class' => 'large-text']);
    }

    public function field_html_callback($args) {
        $options = get_option('api_quiz_builder_settings');
        $value = isset($options[$args['id']]) ? esc_attr($options[$args['id']]) : '';
        $type = isset($args['type']) ? $args['type'] : 'text';
        $class = isset($args['class']) ? $args['class'] : 'regular-text';
        $placeholder = isset($args['placeholder']) ? $args['placeholder'] : '';
        echo "<input type='{$type}' name='api_quiz_builder_settings[{$args['id']}]' value='{$value}' class='{$class}' placeholder='{$placeholder}' />";
    }
}