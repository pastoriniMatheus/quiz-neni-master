<?php
/**
 * Plugin Name: Quiz NeniMaster
 * Description: Plugin oficial para integrar quizzes do NeniMaster no WordPress
 * Version: 1.2.1
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
            array(),
            '1.2.1',
            true
        );
        wp_localize_script('quiz-nenimaster-admin', 'quizNeniMaster', array(
            'apiUrl' => get_option('quiz_nenimaster_api_url'),
            'apiKey' => get_option('quiz_nenimaster_api_key')
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
            <p>Configure a URL do seu sistema Quiz NeniMaster e a chave de API para integrar os quizzes.</p>
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
                        <th scope="row"><label for="quiz_nenimaster_api_key">Chave da API</label></th>
                        <td>
                            <input type="text" id="quiz_nenimaster_api_key" name="quiz_nenimaster_api_key" value="<?php echo esc_attr(get_option('quiz_nenimaster_api_key')); ?>" class="regular-text" />
                            <p class="description">Sua chave de API gerada no painel de configurações.</p>
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
        $atts = shortcode_atts(array(
            'slug' => '',
            'width' => '100%',
            'height' => '800px'
        ), $atts, 'quiz_nenimaster');
        
        if (empty($atts['slug'])) {
            return '<!-- Erro Quiz NeniMaster: Slug do quiz não informado no shortcode. -->';
        }
        
        $system_url = get_option('quiz_nenimaster_api_url');
        $api_key = get_option('quiz_nenimaster_api_key');
        
        if (empty($system_url) || empty($api_key)) {
            if (current_user_can('manage_options')) {
                return '<p style="color:red;">Erro Quiz NeniMaster: Configure a URL do Sistema e a Chave da API nas configurações do plugin.</p>';
            }
            return '<!-- Erro Quiz NeniMaster: Plugin não configurado. -->';
        }
        
        // Corrigido: Removido o /quiz/ extra do caminho da API
        $api_endpoint = rtrim($system_url, '/') . '/functions/v1/quiz-api/' . esc_attr($atts['slug']);
        
        $response = wp_remote_get($api_endpoint, array(
            'headers' => array('x-api-key' => $api_key),
            'timeout' => 15
        ));
        
        if (is_wp_error($response) || wp_remote_retrieve_response_code($response) !== 200) {
            if (current_user_can('manage_options')) {
                $error_message = is_wp_error($response) ? $response->get_error_message() : 'Código de resposta: ' . wp_remote_retrieve_response_code($response);
                return '<p style="color:red;">Erro Quiz NeniMaster (visível para admins): Não foi possível validar o quiz. ' . esc_html($error_message) . '</p>';
            }
            return '<!-- Erro Quiz NeniMaster: Não foi possível carregar o quiz. -->';
        }
        
        $quiz_iframe_url = rtrim($system_url, '/') . '/quiz/' . esc_attr($atts['slug']);
        
        return sprintf(
            '<iframe src="%s" width="%s" height="%s" frameborder="0" style="border:none; width:%s; height:%s; min-height: 600px;" allowfullscreen></iframe>',
            esc_url($quiz_iframe_url),
            esc_attr($atts['width']),
            esc_attr($atts['height']),
            esc_attr($atts['width']),
            esc_attr($atts['height'])
        );
    }
}

new QuizNeniMaster();