<?php
class Api_Quiz_Builder_Gutenberg {
    private $plugin_name;
    private $version;

    public function __construct($plugin_name, $version) {
        $this->plugin_name = $plugin_name;
        $this->version = $version;
    }

    public function register_block() {
        if (!function_exists('register_block_type')) {
            return;
        }

        wp_register_script(
            $this->plugin_name . '-gutenberg-block',
            plugin_dir_url(dirname(__FILE__)) . 'admin/js/gutenberg-block.js',
            array('wp-blocks', 'wp-element', 'wp-components', 'wp-api-fetch', 'wp-edit-post', 'wp-plugins'),
            $this->version,
            true
        );

        register_block_type('nenimaster/quiz-block', array(
            'editor_script' => $this->plugin_name . '-gutenberg-block',
            'render_callback' => array($this, 'render_block_callback'),
            'attributes' => array(
                'quizSlug' => array(
                    'type' => 'string',
                    'default' => '',
                ),
            ),
        ));
    }

    public function render_block_callback($attributes) {
        if (empty($attributes['quizSlug'])) {
            return '<div style="padding: 1em; background-color: #f0f0f0; border: 1px solid #ddd;">Por favor, selecione um quiz no editor.</div>';
        }
        return do_shortcode('[quiz_nenimaster slug="' . esc_attr($attributes['quizSlug']) . '"]');
    }

    public function register_rest_route() {
        register_rest_route('nenimaster/v1', '/quizzes', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_quizzes_for_block'),
            'permission_callback' => function () {
                return current_user_can('edit_posts');
            }
        ));
    }

    public function get_quizzes_for_block() {
        $options = get_option('api_quiz_builder_settings');
        $supabase_url = isset($options['supabase_url']) ? $options['supabase_url'] : '';
        $api_key = isset($options['api_key']) ? $options['api_key'] : '';
        $anon_key = isset($options['supabase_anon_key']) ? $options['supabase_anon_key'] : '';

        if (empty($supabase_url) || empty($api_key) || empty($anon_key)) {
            return new WP_Error('no_settings', 'As credenciais da API não estão configuradas.', array('status' => 500));
        }

        $request_url = rtrim($supabase_url, '/') . '/functions/v1/quiz-api?action=list_all';

        $response = wp_remote_get($request_url, array(
            'headers' => array(
                'x-api-key' => $api_key,
                'Authorization' => 'Bearer ' . $anon_key, // <-- THIS WAS THE MISSING LINE
            ),
            'timeout' => 20,
        ));

        if (is_wp_error($response)) {
            return new WP_Error('api_error', 'Falha na comunicação com a API de quizzes.', array('status' => 500));
        }

        $body = wp_remote_retrieve_body($response);
        $data = json_decode($body, true);

        if (json_last_error() !== JSON_ERROR_NONE || !isset($data['data'])) {
            return new WP_Error('invalid_response', 'A resposta da API foi inválida.', array('status' => 500));
        }

        return new WP_REST_Response($data['data'], 200);
    }
}