<?php
/**
 * The admin-specific functionality of the plugin.
 *
 * @link       https://nenimaster.com
 * @since      1.0.0
 *
 * @package    API_Quiz_Builder
 * @subpackage API_Quiz_Builder/admin
 */

/**
 * The admin-specific functionality of the plugin.
 *
 * Defines the plugin name, version, and two examples hooks for how to
 * enqueue the admin-specific stylesheet and JavaScript.
 *
 * @package    API_Quiz_Builder
 * @subpackage API_Quiz_Builder/admin
 * @author     NeniMaster <contato@nenimaster.com>
 */
class API_Quiz_Builder_Admin {

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
     * Register the stylesheets for the admin area.
     *
     * @since    1.0.0
     */
    public function enqueue_styles() {
        wp_enqueue_style( $this->plugin_name, plugin_dir_url( __FILE__ ) . 'css/api-quiz-builder-admin.css', array(), $this->version, 'all' );
    }

    /**
     * Register the JavaScript for the admin area.
     *
     * @since    1.0.0
     */
    public function enqueue_scripts() {
        wp_enqueue_script( $this->plugin_name . '-admin', plugin_dir_url( __FILE__ ) . 'js/api-quiz-builder-admin.js', array( 'jquery' ), $this->version, false );
        wp_localize_script( $this->plugin_name . '-admin', 'api_quiz_builder_admin_ajax', array(
            'ajax_url' => admin_url( 'admin-ajax.php' ),
            'nonce'    => wp_create_nonce( 'api_quiz_builder_sync_quizzes_nonce' ),
        ));
    }

    /**
     * Add options page to the admin menu.
     *
     * @since    1.0.0
     */
    public function add_plugin_admin_menu() {
        add_menu_page(
            'API Quiz Builder',
            'API Quiz Builder',
            'manage_options',
            $this->plugin_name,
            array( $this, 'display_plugin_admin_page' ),
            'dashicons-lightbulb',
            6
        );
    }

    /**
     * Render the plugin's admin page.
     *
     * @since    1.0.0
     */
    public function display_plugin_admin_page() {
        // Check user capabilities
        if ( ! current_user_can( 'manage_options' ) ) {
            return;
        }

        // Save settings if form is submitted
        if ( isset( $_POST['submit_api_quiz_settings'] ) ) {
            check_admin_referer( 'api_quiz_builder_settings_nonce', 'api_quiz_builder_settings_nonce_field' );
            $this->save_settings();
        }

        $api_base_url = get_option( 'api_quiz_builder_api_base_url', '' );
        $api_key = get_option( 'api_quiz_builder_api_key', '' );
        $supabase_anon_key = get_option( 'api_quiz_builder_supabase_anon_key', '' );
        ?>
        <div class="wrap">
            <h1><?php echo esc_html( get_admin_page_title() ); ?></h1>

            <form method="post" action="">
                <?php wp_nonce_field( 'api_quiz_builder_settings_nonce', 'api_quiz_builder_settings_nonce_field' ); ?>
                <table class="form-table">
                    <tr>
                        <th scope="row"><label for="api_base_url">URL Base da API</label></th>
                        <td>
                            <input type="url" id="api_base_url" name="api_base_url" value="<?php echo esc_attr( $api_base_url ); ?>" class="regular-text" placeholder="https://riqfafiivzpotfjqfscd.supabase.co/functions/v1/quiz-api" required />
                            <p class="description">A URL base da sua Supabase Edge Function para quizzes (ex: `https://[YOUR_PROJECT_ID].supabase.co/functions/v1/quiz-api`).</p>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row"><label for="api_key">Chave de Autenticação (x-api-key)</label></th>
                        <td>
                            <input type="text" id="api_key" name="api_key" value="<?php echo esc_attr( $api_key ); ?>" class="regular-text" placeholder="qb_..." required />
                            <p class="description">Sua chave API gerada no painel do Quiz NeniMaster.</p>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row"><label for="supabase_anon_key">Supabase Anon Key (Bearer Token)</label></th>
                        <td>
                            <input type="text" id="supabase_anon_key" name="supabase_anon_key" value="<?php echo esc_attr( $supabase_anon_key ); ?>" class="regular-text" placeholder="eyJhbGciOiJIUzI1NiI..." required />
                            <p class="description">A chave pública (anon key) do seu projeto Supabase. Usada para autenticação de funções Edge.</p>
                        </td>
                    </tr>
                </table>
                <?php submit_button( 'Salvar Configurações', 'primary', 'submit_api_quiz_settings' ); ?>
            </form>

            <hr />

            <h2>Sincronizar Quizzes</h2>
            <p>Clique no botão abaixo para buscar e atualizar a lista de quizzes do seu sistema NeniMaster.</p>
            <button id="api-quiz-builder-sync-button" class="button button-secondary">
                Sincronizar Quizzes
                <span class="spinner" style="float: none;"></span>
            </button>
            <div id="api-quiz-builder-sync-status" style="margin-top: 10px;"></div>

            <hr />

            <h2>Quizzes Sincronizados</h2>
            <p>Aqui estão os quizzes que foram sincronizados do seu sistema NeniMaster. Use os shortcodes para exibi-los em suas páginas.</p>
            <div id="api-quiz-builder-quiz-list">
                <?php $this->display_synced_quizzes(); ?>
            </div>
        </div>
        <?php
    }

    /**
     * Save plugin settings.
     *
     * @since    1.0.0
     */
    private function save_settings() {
        $api_base_url = isset( $_POST['api_base_url'] ) ? sanitize_url( wp_unslash( $_POST['api_base_url'] ) ) : '';
        $api_key = isset( $_POST['api_key'] ) ? sanitize_text_field( wp_unslash( $_POST['api_key'] ) ) : '';
        $supabase_anon_key = isset( $_POST['supabase_anon_key'] ) ? sanitize_text_field( wp_unslash( $_POST['supabase_anon_key'] ) ) : '';

        update_option( 'api_quiz_builder_api_base_url', $api_base_url );
        update_option( 'api_quiz_builder_api_key', $api_key );
        update_option( 'api_quiz_builder_supabase_anon_key', $supabase_anon_key );

        add_settings_error( 'api_quiz_builder_messages', 'api_quiz_builder_message', 'Configurações salvas.', 'success' );
        settings_errors( 'api_quiz_builder_messages' );
    }

    /**
     * Display synced quizzes in the admin panel.
     *
     * @since    1.0.0
     */
    private function display_synced_quizzes() {
        global $wpdb;
        $table_name = $wpdb->prefix . 'api_quizzes';
        $quizzes = $wpdb->get_results( "SELECT id, title, slug, status, last_synced_at FROM $table_name ORDER BY last_synced_at DESC" );

        if ( ! empty( $quizzes ) ) {
            echo '<table class="wp-list-table widefat fixed striped">';
            echo '<thead><tr><th>Título</th><th>Slug</th><th>Status</th><th>Shortcode</th><th>Última Sincronização</th></tr></thead>';
            echo '<tbody>';
            foreach ( $quizzes as $quiz ) {
                $shortcode = '[api_quiz slug="' . esc_attr( $quiz->slug ) . '"]';
                echo '<tr>';
                echo '<td>' . esc_html( $quiz->title ) . '</td>';
                echo '<td>' . esc_html( $quiz->slug ) . '</td>';
                echo '<td>' . esc_html( ucfirst( $quiz->status ) ) . '</td>';
                echo '<td><code>' . esc_html( $shortcode ) . '</code> <button class="button button-small copy-shortcode" data-shortcode="' . esc_attr( $shortcode ) . '">Copiar</button></td>';
                echo '<td>' . esc_html( date_i18n( get_option( 'date_format' ) . ' ' . get_option( 'time_format' ), strtotime( $quiz->last_synced_at ) ) ) . '</td>';
                echo '</tr>';
            }
            echo '</tbody>';
            echo '</table>';
        } else {
            echo '<p>Nenhum quiz sincronizado ainda. Sincronize para ver a lista.</p>';
        }
    }

    /**
     * AJAX callback to synchronize quizzes from the API.
     *
     * @since    1.0.0
     */
    public function sync_quizzes_callback() {
        check_ajax_referer( 'api_quiz_builder_sync_quizzes_nonce', 'nonce' );

        if ( ! current_user_can( 'manage_options' ) ) {
            wp_send_json_error( 'Permissão negada.' );
        }

        $api_base_url = get_option( 'api_quiz_builder_api_base_url', '' );
        $api_key = get_option( 'api_quiz_builder_api_key', '' );
        $supabase_anon_key = get_option( 'api_quiz_builder_supabase_anon_key', '' );

        if ( empty( $api_base_url ) || empty( $api_key ) || empty( $supabase_anon_key ) ) {
            wp_send_json_error( 'Por favor, configure a URL da API, a Chave de Autenticação e a Supabase Anon Key nas configurações do plugin.' );
        }

        $api_url = trailingslashit( $api_base_url ) . '?action=list';
        $headers = array(
            'x-api-key'     => $api_key,
            'Authorization' => 'Bearer ' . $supabase_anon_key,
            'Content-Type'  => 'application/json',
        );

        $response = wp_remote_get( $api_url, array(
            'headers' => $headers,
            'timeout' => 30, // seconds
        ));

        if ( is_wp_error( $response ) ) {
            wp_send_json_error( 'Erro ao conectar com a API: ' . $response->get_error_message() );
        }

        $body = wp_remote_retrieve_body( $response );
        $quizzes_data = json_decode( $body, true );

        if ( ! is_array( $quizzes_data ) ) {
            wp_send_json_error( 'Resposta inválida da API. Verifique a URL e as chaves.' );
        }

        $synced_count = 0;
        foreach ( $quizzes_data as $quiz_data ) {
            // Fetch full quiz data for each published quiz
            $full_quiz_url = trailingslashit( $api_base_url ) . '?slug=' . urlencode($quiz_data['slug']);
            $full_quiz_response = wp_remote_get( $full_quiz_url, array(
                'headers' => $headers,
                'timeout' => 30,
            ));

            if ( is_wp_error( $full_quiz_response ) ) {
                error_log( 'API Quiz Builder: Erro ao buscar detalhes do quiz ' . $quiz_data['slug'] . ': ' . $full_quiz_response->get_error_message() );
                continue; // Skip to next quiz
            }

            $full_quiz_body = wp_remote_retrieve_body( $full_quiz_response );
            $full_quiz = json_decode( $full_quiz_body, true );

            if ( ! is_array( $full_quiz ) ) {
                error_log( 'API Quiz Builder: Resposta inválida para detalhes do quiz ' . $quiz_data['slug'] );
                continue; // Skip to next quiz
            }

            // Ensure all required fields are present and properly formatted
            $quiz_id = sanitize_text_field( $full_quiz['id'] );
            $title = sanitize_text_field( $full_quiz['title'] ?? 'Quiz sem título' );
            $description = sanitize_textarea_field( $full_quiz['description'] ?? '' );
            $slug = sanitize_title( $full_quiz['slug'] ?? $quiz_id ); // Use slug from API, fallback to ID
            $status = sanitize_text_field( $full_quiz['status'] ?? 'draft' );
            $sessions = wp_json_encode( $full_quiz['sessions'] ?? [] );
            $settings = wp_json_encode( $full_quiz['settings'] ?? [] );
            $design = wp_json_encode( $full_quiz['design'] ?? [] );
            $created_at = sanitize_text_field( $full_quiz['created_at'] ?? current_time( 'mysql', true ) );
            $updated_at = sanitize_text_field( $full_quiz['updated_at'] ?? current_time( 'mysql', true ) );
            $last_synced_at = current_time( 'mysql', true );

            // Insert or update quiz in local DB
            $result = API_Quiz_Builder_DB::insert_or_update_quiz(
                $quiz_id, $title, $description, $slug, $status, $sessions, $settings, $design, $created_at, $updated_at, $last_synced_at
            );

            if ( $result ) {
                $synced_count++;
            } else {
                error_log( 'API Quiz Builder: Falha ao sincronizar quiz: ' . $title );
            }
        }

        wp_send_json_success( sprintf( '%d quizzes sincronizados com sucesso!', $synced_count ) );
    }
}
?>