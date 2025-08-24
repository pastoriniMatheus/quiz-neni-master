<?php
/**
 * Plugin Name: Quiz NeniMaster
 * Description: Plugin oficial para integrar quizzes do NeniMaster no WordPress
 * Version: 1.4.0
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
        if ($hook != 'toplevel_page_quiz-nenimaster') {
            return;
        }
        wp_enqueue_script(
            'quiz-nenimaster-admin',
            plugin_dir_url(__FILE__) . 'admin.js',
            array('jquery'),
            '1.4.0',
            true
        );
        wp_localize_script('quiz-nenimaster-admin', 'quizNeniMaster', array(
            'apiUrl' => get_option('quiz_nenimaster_api_url'), // ATUALIZADO: Garante que o JS use a URL da API
            'apiKey' => get_option('quiz_nenimaster_api_key'),
            'anonKey' => get_option('quiz_nenimaster_anon_key')
        ));
    }

    public function admin_menu() {
        add_menu_page('Quiz NeniMaster', 'Quiz NeniMaster', 'manage_options', 'quiz-nenimaster', array($this, 'admin_page_content'), 'dashicons-forms', 25);
    }

    public function register_settings() {
        register_setting('quiz_nenimaster_options', 'quiz_nenimaster_api_url');
        register_setting('quiz_nenimaster_options', 'quiz_nenimaster_frontend_url'); // NOVO CAMPO
        register_setting('quiz_nenimaster_options', 'quiz_nenimaster_api_key');
        register_setting('quiz_nenimaster_options', 'quiz_nenimaster_anon_key');
    }
    
    public function admin_page_content() {
        ?>
        <div class="wrap">
            <h1>Quiz NeniMaster - Configurações</h1>
            <form method="post" action="options.php">
                <?php settings_fields('quiz_nenimaster_options'); ?>
                <table class="form-table">
                    <tr valign="top">
                        <th scope="row"><label for="quiz_nenimaster_api_url">URL da API (Supabase)</label></th>
                        <td>
                            <input type="url" id="quiz_nenimaster_api_url" name="quiz_nenimaster_api_url" value="<?php echo esc_attr(get_option('quiz_nenimaster_api_url')); ?>" class="regular-text" />
                            <p class="description">A URL base do seu projeto Supabase. Ex: https://riqfafiivzpotfjqfscd.supabase.co</p>
                        </td>
                    </tr>
                    <tr valign="top">
                        <th scope="row"><label for="quiz_nenimaster_frontend_url">URL de Exibição (Frontend)</label></th>
                        <td>
                            <input type="url" id="quiz_nenimaster_frontend_url" name="quiz_nenimaster_frontend_url" value="<?php echo esc_attr(get_option('quiz_nenimaster_frontend_url')); ?>" class="regular-text" />
                            <p class="description">A URL pública onde seus quizzes são exibidos. Ex: https://quiz.paineldedisparos.com.br</p>
                        </td>
                    </tr>
                    <tr valign="top">
                        <th scope="row"><label for="quiz_nenimaster_anon_key">Supabase Anon Key (Pública)</label></th>
                        <td>
                            <input type="text" id="quiz_nenimaster_anon_key" name="quiz_nenimaster_anon_key" value="<?php echo esc_attr(get_option('quiz_nenimaster_anon_key')); ?>" class="regular-text" />
                        </td>
                    </tr>
                    <tr valign="top">
                        <th scope="row"><label for="quiz_nenimaster_api_key">Chave da API (Privada)</label></th>
                        <td>
                            <input type="text" id="quiz_nenimaster_api_key" name="quiz_nenimaster_api_key" value="<?php echo esc_attr(get_option('quiz_nenimaster_api_key')); ?>" class="regular-text" />
                        </td>
                    </tr>
                </table>
                <?php submit_button('Salvar Configurações'); ?>
            </form>
            
            <hr>
            <h2>Meus Quizzes</h2>
            <button id="load-quizzes-btn" class="button button-primary">Carregar Quizzes</button>
            <div id="quiz-list-container" style="margin-top: 20px;"></div>
        </div>
        <?php
    }
    
    public function shortcode_handler($atts) {
        $atts = shortcode_atts(array('slug' => '', 'width' => '100%', 'height' => '800px'), $atts, 'quiz_nenimaster');
        if (empty($atts['slug'])) return '<!-- Erro: Slug do quiz não informado. -->';

        $api_url = get_option('quiz_nenimaster_api_url');
        $frontend_url = get_option('quiz_nenimaster_frontend_url'); // ATUALIZADO: Pega a URL de exibição
        $api_key = get_option('quiz_nenimaster_api_key');
        $anon_key = get_option('quiz_nenimaster_anon_key');

        if (empty($api_url) || empty($frontend_url) || empty($api_key) || empty($anon_key)) {
            return current_user_can('manage_options') ? '<p style="color:red;">Erro: Configure todas as URLs e Chaves nas configurações do plugin.</p>' : '<!-- Erro: Plugin não configurado. -->';
        }
        
        $api_endpoint = rtrim($api_url, '/') . '/functions/v1/quiz-api?slug=' . esc_attr($atts['slug']);
        
        $response = wp_remote_get($api_endpoint, array(
            'headers' => array('Authorization' => 'Bearer ' . $anon_key, 'x-api-key' => $api_key),
            'timeout' => 15
        ));
        
        if (is_wp_error($response) || wp_remote_retrieve_response_code($response) !== 200) {
            return current_user_can('manage_options') ? '<p style="color:red;">Erro ao validar quiz.</p>' : '<!-- Erro: Não foi possível carregar o quiz. -->';
        }
        
        $quiz_iframe_url = rtrim($frontend_url, '/') . '/quiz/' . esc_attr($atts['slug']); // ATUALIZADO: Usa a URL de exibição
        
        return sprintf('<iframe src="%s" width="%s" height="%s" frameborder="0" style="border:none; width:%s; height:%s; min-height: 600px;" allowfullscreen></iframe>',
            esc_url($quiz_iframe_url), esc_attr($atts['width']), esc_attr($atts['height']), esc_attr($atts['width']), esc_attr($atts['height'])
        );
    }
}

new QuizNeniMaster();