<?php
/**
 * Plugin Name: Quiz NeniMaster
 * Description: Plugin oficial para integrar quizzes do NeniMaster no WordPress
 * Version: 1.8.0
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
        add_action('wp', array($this, 'prepare_page_for_quiz')); // NOVO: Hook principal para limpeza da página
    }
    
    public function enqueue_admin_scripts($hook) {
        if ($hook != 'toplevel_page_quiz-nenimaster') {
            return;
        }
        wp_enqueue_script(
            'quiz-nenimaster-admin',
            plugin_dir_url(__FILE__) . 'admin.js',
            array('jquery'),
            '1.8.0',
            true
        );
        wp_localize_script('quiz-nenimaster-admin', 'quizNeniMaster', array(
            'apiUrl' => get_option('quiz_nenimaster_api_url'),
            'apiKey' => get_option('quiz_nenimaster_api_key'),
            'anonKey' => get_option('quiz_nenimaster_anon_key')
        ));
    }

    public function admin_menu() {
        add_menu_page('Quiz NeniMaster', 'Quiz NeniMaster', 'manage_options', 'quiz-nenimaster', array($this, 'admin_page_content'), 'dashicons-forms', 25);
    }

    public function register_settings() {
        register_setting('quiz_nenimaster_options', 'quiz_nenimaster_api_url');
        register_setting('quiz_nenimaster_options', 'quiz_nenimaster_frontend_url');
        register_setting('quiz_nenimaster_options', 'quiz_nenimaster_api_key');
        register_setting('quiz_nenimaster_options', 'quiz_nenimaster_anon_key');
        register_setting('quiz_nenimaster_options', 'quiz_nenimaster_disable_page_scripts');
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
                            <div id="quiz-list-container" style="margin-top: 20px;"></div>
                        </div>
                    </div>
                    <div class="postbox">
                        <h2 class="hndle"><span>Otimização da Página</span></h2>
                        <div class="inside">
                            <form method="post" action="options.php">
                                <?php settings_fields('quiz_nenimaster_options'); ?>
                                <table class="form-table">
                                    <tr valign="top">
                                        <th scope="row">Desabilitar Scripts e Estilos da Página</th>
                                        <td>
                                            <label for="quiz_nenimaster_disable_page_scripts">
                                                <input type="checkbox" id="quiz_nenimaster_disable_page_scripts" name="quiz_nenimaster_disable_page_scripts" value="1" <?php checked(1, get_option('quiz_nenimaster_disable_page_scripts'), true); ?> />
                                                Ativar para remover a maioria dos scripts e estilos da página quando um quiz é exibido.
                                            </label>
                                            <p class="description" style="color: red;">
                                                <strong>Atenção:</strong> Esta é uma medida agressiva. Isso pode quebrar completamente o layout e as funcionalidades do seu tema ou de outros plugins na página do quiz. Use com extrema cautela e teste rigorosamente!
                                            </p>
                                        </td>
                                    </tr>
                                </table>
                                <?php submit_button('Salvar Otimização'); ?>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <?php
    }
    
    public function shortcode_handler($atts) {
        $atts = shortcode_atts(array('slug' => '', 'width' => '100%', 'height' => '100vh'), $atts, 'quiz_nenimaster');
        if (empty($atts['slug'])) return '<!-- Erro: Slug do quiz não informado. -->';

        $api_url = get_option('quiz_nenimaster_api_url');
        $frontend_url = get_option('quiz_nenimaster_frontend_url');
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
        
        $quiz_iframe_url = rtrim($frontend_url, '/') . '/quiz/' . esc_attr($atts['slug']);
        
        return sprintf('<div class="quiz-nenimaster-iframe-wrapper"><iframe class="quiz-nenimaster-iframe" src="%s" width="%s" height="%s" frameborder="0" style="border:none; width:%s; height:%s; display:block;" allowfullscreen></iframe></div>',
            esc_url($quiz_iframe_url), esc_attr($atts['width']), esc_attr($atts['height']), esc_attr($atts['width']), esc_attr($atts['height'])
        );
    }

    // NOVO: Função principal para preparar a página para o quiz
    public function prepare_page_for_quiz() {
        global $post;
        if (is_a($post, 'WP_Post') && has_shortcode($post->post_content, 'quiz_nenimaster') && get_option('quiz_nenimaster_disable_page_scripts')) {
            
            // 1. Remover todos os scripts e estilos enfileirados/registrados
            $this->remove_all_scripts_and_styles();

            // 2. Remover todas as ações dos hooks wp_head e wp_footer
            $this->remove_all_header_footer_actions();

            // 3. Injetar nossos estilos CSS para tela cheia (com alta prioridade)
            add_action('wp_head', array($this, 'inject_fullscreen_styles'), 1); 
        }
    }

    // Função auxiliar para remover todos os scripts e estilos
    private function remove_all_scripts_and_styles() {
        global $wp_scripts, $wp_styles;

        if ($wp_scripts instanceof WP_Scripts) {
            $wp_scripts->queue = array(); // Limpa scripts enfileirados
            $wp_scripts->registered = array(); // Limpa scripts registrados
        }
        if ($wp_styles instanceof WP_Styles) {
            $wp_styles->queue = array(); // Limpa estilos enfileirados
            $wp_styles->registered = array(); // Limpa estilos registrados
        }
        // Re-adiciona admin bar se o usuário estiver logado (opcional, mas útil para admins)
        if (is_user_logged_in()) {
            wp_enqueue_script('admin-bar');
            wp_enqueue_style('admin-bar');
        }
    }

    // Função auxiliar para remover todas as ações dos hooks wp_head e wp_footer
    private function remove_all_header_footer_actions() {
        // Remove todas as ações de wp_head
        remove_all_actions('wp_head');
        // Remove todas as ações de wp_footer
        remove_all_actions('wp_footer');

        // Re-adiciona ações essenciais da admin bar se o usuário estiver logado
        if (is_user_logged_in()) {
            add_action('wp_head', '_admin_bar_bump_cb'); // CSS da admin bar
            add_action('wp_footer', 'wp_admin_bar_render', 1000); // HTML da admin bar
        }
    }

    // Função para injetar estilos CSS para o iframe em tela cheia
    public function inject_fullscreen_styles() {
        global $post;
        if (is_a($post, 'WP_Post') && has_shortcode($post->post_content, 'quiz_nenimaster') && get_option('quiz_nenimaster_disable_page_scripts')) {
            echo '<style type="text/css">';
            echo 'html, body { height: 100%; margin: 0 !important; padding: 0 !important; overflow: hidden !important; }';
            echo 'body { display: flex; flex-direction: column; }';
            // Tenta atingir wrappers comuns de temas para garantir que não adicionem espaço indesejado
            echo '#page, #content, #primary, #main, .site-content, .site-main { height: 100%; width: 100%; margin: 0 !important; padding: 0 !important; }';
            echo '.quiz-nenimaster-iframe-wrapper { flex-grow: 1; height: 100%; width: 100%; margin: 0 !important; padding: 0 !important; display: flex; flex-direction: column; }';
            echo '.quiz-nenimaster-iframe { width: 100%; height: 100%; display: block; }';
            echo '</style>';
        }
    }
}

new QuizNeniMaster();