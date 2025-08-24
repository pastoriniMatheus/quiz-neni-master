<?php
/**
 * Plugin Name: Quiz NeniMaster
 * Description: Plugin oficial para integrar quizzes do NeniMaster no WordPress
 * Version: 1.2.3
 * Author: NeniMaster
 */

if (!defined('ABSPATH')) {
    exit;
}

class QuizNeniMaster {
    
    public function __construct() {
        add_action('admin_menu', array($this, 'admin_menu'));
        add_action('admin_init', array($this, 'register_settings'));
        add_action('admin_enqueue_scripts', array($this, 'enqueue_admin_scripts'));
        add_shortcode('quiz_nenimaster', array($this, 'shortcode_handler'));
    }
    
    public function enqueue_admin_scripts($hook) {
        if ($hook != 'settings_page_quiz-nenimaster') {
            return;
        }
        wp_enqueue_script(
            'quiz-nenimaster-admin',
            plugin_dir_url(__FILE__) . 'admin.js',
            array('jquery'),
            '1.2.3',
            true
        );
        wp_localize_script('quiz-nenimaster-admin', 'quizNeniMaster', array(
            'apiUrl' => get_option('quiz_nenimaster_api_url'),
            'apiKey' => get_option('quiz_nenimaster_api_key'),
            'anonKey' => get_option('quiz_nenimaster_anon_key') // Passando a nova chave para o JS
        ));
    }

    public function admin_menu() {
        add_options_page(
            'Quiz NeniMaster',
            'Quiz NeniMaster',
            'manage_options',
            'quiz-nenimaster',
            array($this, 'admin_page_content')
        );
    }

    public function register_settings() {
        register_setting('quiz_nenimaster_options', 'quiz_nenimaster_api_url');
        register_setting('quiz_nenimaster_options', 'quiz_nenimaster_api_key');
        register_setting('quiz_nenimaster_options', 'quiz_nenimaster_anon_key'); // Registrando a nova configuração
    }
    
    public function admin_page_content() {
        ?>
        <style>
            .quiz-list-item { background: #fff; border: 1px solid #ccd0d4; padding: 12px; margin-bottom: 8px; border-radius: 4px; display: flex; justify-content: space-between; align-items: center; }
            .quiz-list-item .title { font-weight: 600; }
            .quiz-list-item .shortcode { background: #f0f0f1; padding: 4px 8px; border-radius: 3px; font-family: monospace; }
            .copy-btn { margin-left: 10px; }
        </style>
        <div class="wrap">
            <h1>Quiz NeniMaster - Configurações</h1>
            <p>Configure a URL do seu sistema Quiz NeniMaster e as chaves de API para integrar os quizzes.</p>
            <form method="post" action="options.php">
                <?php
                settings_fields('quiz_nenimaster_options');
                ?>
                <table class="form-table">
                    <tr valign="top">
                        <th scope="row"><label for="quiz_nenimaster_api_url">URL do Sistema</label></th>
                        <td>
                            <input type="url" id="quiz_nenimaster_api_url" name="quiz_nenimaster_api_url" value="<?php echo esc_attr(get_option('quiz_nenimaster_api_url')); ?>" class="regular-text" />
                            <p class="description">A URL base da sua aplicação. Ex: https://riqfafiivzpotfjqfscd.supabase.co</p>
                        </td>
                    </tr>
                    <tr valign="top">
                        <th scope="row"><label for="quiz_nenimaster_anon_key">Supabase Anon Key (Pública)</label></th>
                        <td>
                            <input type="text" id="quiz_nenimaster_anon_key" name="quiz_nenimaster_anon_key" value="<?php echo esc_attr(get_option('quiz_nenimaster_anon_key')); ?>" class="regular-text" />
                            <p class="description">A chave pública (anon) do seu projeto Supabase.</p>
                        </td>
                    </tr>
                    <tr valign="top">
                        <th scope="row"><label for="quiz_nenimaster_api_key">Chave da API (Privada)</label></th>
                        <td>
                            <input type="text" id="quiz_nenimaster_api_key" name="quiz_nenimaster_api_key" value="<?php echo esc_attr(get_option('quiz_nenimaster_api_key')); ?>" class="regular-text" />
                            <p class="description">Sua chave de API gerada no painel de configurações (começa com 'qb_').</p>
                        </td>
                    </tr>
                </table>
                <?php submit_button(); ?>
            </form>

            <hr/>

            <h2>Quizzes Disponíveis</h2>
            <p>Clique no botão para buscar seus quizzes publicados e obter os shortcodes.</p>
            <button id="load-quizzes-btn" class="button button-primary">Carregar Quizzes</button>
            <div id="quiz-list-container" style="margin-top: 20px;">
                <p id="quiz-list-status">Seus quizzes aparecerão aqui.</p>
            </div>
        </div>
        <?php
    }
    
    public function shortcode_handler($atts) {
        // ... (o resto da função PHP não precisa de alterações)
    }
}

new QuizNeniMaster();