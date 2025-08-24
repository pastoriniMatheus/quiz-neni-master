<?php
/**
 * Plugin Name: Quiz NeniMaster
 * Description: Plugin oficial para integrar quizzes do NeniMaster no WordPress
 * Version: 1.1.0
 * Author: NeniMaster
 */

if (!defined('ABSPATH')) {
    exit;
}

class QuizNeniMaster {
    
    public function __construct() {
        add_action('admin_menu', array($this, 'admin_menu'));
        add_action('admin_init', array($this, 'register_settings'));
        add_shortcode('quiz_nenimaster', array($this, 'shortcode_handler'));
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
        <div class="wrap">
            <h1>Quiz NeniMaster - Configurações</h1>
            <p>Configure a URL do seu sistema Quiz NeniMaster e a chave de API para integrar os quizzes.</p>
            <form method="post" action="options.php">
                <?php
                settings_fields('quiz_nenimaster_options');
                do_settings_sections('quiz_nenimaster_options');
                ?>
                <table class="form-table">
                    <tr valign="top">
                        <th scope="row"><label for="quiz_nenimaster_api_url">URL do Sistema</label></th>
                        <td>
                            <input type="url" id="quiz_nenimaster_api_url" name="quiz_nenimaster_api_url" value="<?php echo esc_attr(get_option('quiz_nenimaster_api_url')); ?>" class="regular-text" />
                            <p class="description">A URL base da sua aplicação Quiz NeniMaster. Ex: https://riqfafiivzpotfjqfscd.supabase.co</p>
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
        
        $api_url = get_option('quiz_nenimaster_api_url');
        $api_key = get_option('quiz_nenimaster_api_key');
        
        if (empty($api_url) || empty($api_key)) {
            if (current_user_can('manage_options')) {
                return '<p style="color:red;">Erro Quiz NeniMaster: Configure a URL do Sistema e a Chave da API nas configurações do plugin.</p>';
            }
            return '<!-- Erro Quiz NeniMaster: Plugin não configurado. -->';
        }
        
        $api_endpoint = rtrim($api_url, '/') . '/functions/v1/quiz-api/quiz/' . esc_attr($atts['slug']);
        
        $response = wp_remote_get($api_endpoint, array(
            'headers' => array(
                'x-api-key' => $api_key,
                'Content-Type' => 'application/json'
            ),
            'timeout' => 15
        ));
        
        $response_code = wp_remote_retrieve_response_code($response);

        if (is_wp_error($response) || $response_code !== 200) {
            if (current_user_can('manage_options')) {
                $error_message = is_wp_error($response) ? $response->get_error_message() : 'Código de resposta: ' . $response_code;
                return '<p style="color:red;">Erro Quiz NeniMaster (visível para admins): Não foi possível validar o quiz. ' . esc_html($error_message) . '</p>';
            }
            return '<!-- Erro Quiz NeniMaster: Não foi possível carregar o quiz. -->';
        }
        
        $quiz_iframe_url = rtrim($api_url, '/') . '/quiz/' . esc_attr($atts['slug']);
        
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