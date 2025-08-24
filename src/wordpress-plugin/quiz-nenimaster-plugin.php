<?php
/**
 * Plugin Name: Quiz NeniMaster
 * Description: Plugin oficial para integrar quizzes do NeniMaster no WordPress
 * Version: 1.3.3
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
        // ... (admin page content is unchanged)
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
        
        // ATUALIZADO: URL da API simplificada
        $api_endpoint = rtrim($system_url, '/') . '/functions/v1/quiz-api/' . esc_attr($atts['slug']);
        
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