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

    public function create_admin_page() {
        ?>
        <div class="wrap">
            <h2>NeniMaster Quiz-API Configurações</h2>
            <p>Configure as credenciais para conectar o WordPress à sua aplicação Quiz NeniMaster.</p>
            <form method="post" action="options.php">
                <?php
                settings_fields( 'api_quiz_builder_options_group' );
                do_settings_sections( $this->plugin_name );
                submit_button();
                ?>
            </form>
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
            'Credenciais da API',
            null,
            $this->plugin_name
        );

        add_settings_field(
            'supabase_url',
            'Supabase URL',
            array( $this, 'supabase_url_callback' ),
            $this->plugin_name,
            'api_quiz_builder_main_section'
        );

        add_settings_field(
            'supabase_anon_key',
            'Supabase Anon Key',
            array( $this, 'supabase_anon_key_callback' ),
            $this->plugin_name,
            'api_quiz_builder_main_section'
        );

        add_settings_field(
            'api_key',
            'Chave da API (x-api-key)',
            array( $this, 'api_key_callback' ),
            $this->plugin_name,
            'api_quiz_builder_main_section'
        );
    }

    public function supabase_url_callback() {
        $options = get_option( 'api_quiz_builder_settings' );
        $url = isset( $options['supabase_url'] ) ? esc_attr( $options['supabase_url'] ) : '';
        echo "<input type='url' name='api_quiz_builder_settings[supabase_url]' value='$url' class='regular-text' placeholder='https://<project-id>.supabase.co' />";
        echo "<p class='description'>Encontrado no seu painel Supabase em Configurações > API.</p>";
    }

    public function supabase_anon_key_callback() {
        $options = get_option( 'api_quiz_builder_settings' );
        $key = isset( $options['supabase_anon_key'] ) ? esc_attr( $options['supabase_anon_key'] ) : '';
        echo "<input type='text' name='api_quiz_builder_settings[supabase_anon_key]' value='$key' class='large-text' />";
        echo "<p class='description'>A chave pública (anon key) do seu projeto Supabase.</p>";
    }

    public function api_key_callback() {
        $options = get_option( 'api_quiz_builder_settings' );
        $key = isset( $options['api_key'] ) ? esc_attr( $options['api_key'] ) : '';
        echo "<input type='text' name='api_quiz_builder_settings[api_key]' value='$key' class='large-text' />";
        echo "<p class='description'>A chave de API que você criou na aba 'Acesso' do seu Quiz Builder.</p>";
    }

    public function enqueue_scripts() {
        // No scripts needed for this page
    }
}