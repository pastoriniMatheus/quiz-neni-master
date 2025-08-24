<?php
/**
 * Plugin Name: Quiz NeniMaster
 * Description: Plugin oficial para integrar quizzes do NeniMaster no WordPress
 * Version: 1.3.2
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
            '1.3.0',
            true
        );
        wp_localize_script('quiz-nenimaster-admin', 'quizNeniMaster', array(
            'apiUrl' => get_option('quiz_nenimaster_api_url'),
            'apiKey' => get_option('quiz_nenimaster_api_key'),
            'anonKey' => get_option('quiz_nenimaster_anon_key')
        ));
    }

    public function admin_menu() {
        add_menu_page(
            'Quiz NeniMaster',
            'Quiz NeniMaster',
            'manage_options',
            'quiz-nenimaster',
            array($this, 'admin_page_content'),
            'dashicons-forms',
            25
        );
    }

    public function register_settings() {
        register_setting('quiz_nenimaster_options', 'quiz_nenimaster_api_url');
        register_setting('quiz_nenimaster_options', 'quiz_nenimaster_api_key');
        register_setting('quiz_nenimaster_options', 'quiz_nenimaster_anon_key');
    }
    
    public function admin_page_content() {
        ?>
        <style>
            #quiz-nenimaster-admin-page .postbox-container { float: left; width: 49%; margin-right: 2%; }
            #quiz-nenimaster-admin-page .postbox-container:last-child { margin-right: 0; }
            #quiz-nenimaster-admin-page .form-table th { padding: 15px 10px 15px 0; }
            #quiz-nenimaster-admin-page .form-table td { padding: 10px; }
            .quiz-list-item { background: #f9f9f9; border: 1px solid #ccd0d4; padding: 12px; margin-bottom: 8px; border-radius: 4px; display: flex; justify-content: space-between; align-items: center; }
            .quiz-list-item .title { font-weight: 600; }
            .quiz-list-item .shortcode { background: #eee; padding: 4px 8px; border-radius: 3px; font-family: monospace; user-select: all; }
            .copy-btn { margin-left: 10px; }
            #load-quizzes-spinner { display: none; vertical-align: middle; margin-left: 5px; }
        </style>
        <div class="wrap" id="quiz-nenimaster-admin-page">
            <h1><span class="dashicons-forms" style="font-size: 30px; height: 30px; width: 30px; margin-right: 5px;"></span> Quiz NeniMaster</h1>
            <p>Gerencie a integração dos seus quizzes interativos diretamente no WordPress.</p>
            
            <div id="poststuff">
                <div class="postbox-container">
                    <div class="postbox">
                        <h2 class="hndle"><span>Configurações da API</span></h2>
                        <div class="inside">
                            <form method="post" action="options.php">
                                <?php settings_fields('quiz_nenimaster_options'); ?>
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
                                            <p class="description">Sua chave de API gerada no painel (começa com 'qb_').</p>
                                        </td>
                                    </tr>
                                </table>
                                <?php submit_button('Salvar Configurações'); ?>
                            </form>
                        </div>
                    </div>
                </div>
                <div class="postbox-container">
                    <div class="postbox">
                        <h2 class="hndle"><span>Meus Quizzes</span></h2>
                        <div class="inside">
                            <p>Clique no botão para buscar seus quizzes publicados e obter os shortcodes.</p>
                            <p>
                                <button id="load-quizzes-btn" class="button button-primary">Carregar Quizzes</button>
                                <span class="spinner" id="load-quizzes-spinner"></span>
                            </p>
                            <div id="quiz-list-container" style="margin-top: 20px;">
                                <p id="quiz-list-status">Seus quizzes aparecerão aqui.</p>
                            </div>
                        </div>
                    </div>
                </div>
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
        $anon_key = get_option('quiz_nenimaster_anon_key');
        
        if (empty($system_url) || empty($api_key) || empty($anon_key)) {
            if (current_user_can('manage_options')) {
                return '<p style="color:red;">Erro Quiz NeniMaster: Configure a URL do Sistema e ambas as Chaves de API nas configurações do plugin.</p>';
            }
            return '<!-- Erro Quiz NeniMaster: Plugin não configurado. -->';
        }
        
        $api_endpoint = rtrim($system_url, '/') . '/functions/v1/quiz-api/quiz/' . esc_attr($atts['slug']);
        
        $response = wp_remote_get($api_endpoint, array(
            'headers' => array(
                'Authorization' => 'Bearer ' . $anon_key,
                'x-api-key'     => $api_key
            ),
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