<?php
/**
 * Plugin Name: Quiz NeniMaster (Iframe)
 * Description: Plugin oficial para integrar quizzes do NeniMaster no WordPress via iframe.
 * Version: 1.0.1
 * Author: Matheus Pastorini
 */

// Evitar acesso direto
if (!defined('ABSPATH')) {
    exit;
}

class QuizNeniMaster_Iframe_Plugin {
    
    public function __construct() {
        add_action('init', array($this, 'init'));
        add_action('admin_menu', array($this, 'admin_menu'));
        add_shortcode('quiz_nenimaster', array($this, 'shortcode_handler'));
    }
    
    public function init() {
        // Inicialização do plugin
    }
    
    public function admin_page() {
        if (isset($_POST['save_settings'])) {
            update_option('quiz_nenimaster_api_url', sanitize_text_field($_POST['api_url']));
            update_option('quiz_nenimaster_api_key', sanitize_text_field($_POST['api_key']));
            echo '<div class="notice notice-success"><p>Configurações salvas!</p></div>';
        }
        
        $api_url = get_option('quiz_nenimaster_api_url', '');
        $api_key = get_option('quiz_nenimaster_api_key', '');
        ?>
        <div class="wrap">
            <h1>Quiz NeniMaster (Iframe) - Configurações</h1>
            <form method="post">
                <table class="form-table">
                    <tr>
                        <th scope="row">URL do Sistema Quiz NeniMaster</th>
                        <td>
                            <input type="url" name="api_url" value="<?php echo esc_attr($api_url); ?>" class="regular-text" />
                            <p class="description">A URL base do seu sistema Quiz NeniMaster (ex: https://quiz.paineldedisparos.com.br ou http://localhost:8080). Esta é a URL onde o frontend do seu aplicativo está hospedado, NÃO a URL da Edge Function.</p>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row">Chave da API</th>
                        <td>
                            <input type="text" name="api_key" value="<?php echo esc_attr($api_key); ?>" class="regular-text" />
                            <p class="description">Sua chave API gerada no painel do Quiz NeniMaster. (Opcional, apenas se o quiz precisar de autenticação extra)</p>
                        </td>
                    </tr>
                </table>
                <?php submit_button('Salvar Configurações', 'primary', 'save_settings'); ?>
            </form>
        </div>
        <?php
    }
    
    public function shortcode_handler($atts) {
        $atts = shortcode_atts(array(
            'slug' => '',
            'width' => '100%',
            'height' => '600px'
        ), $atts);
        
        if (empty($atts['slug'])) {
            return '<p>Erro: Slug do quiz não informado.</p>';
        }
        
        $api_url = get_option('quiz_nenimaster_api_url', '');
        // $api_key = get_option('quiz_nenimaster_api_key', ''); // API Key not directly used by iframe plugin
        
        if (empty($api_url)) {
            return '<p>Erro: Configure a URL do Sistema Quiz NeniMaster nas configurações do plugin.</p>';
        }
        
        $quiz_url = rtrim($api_url, '/') . '/quiz/' . esc_attr($atts['slug']);
        
        return sprintf(
            '<iframe src="%s" width="%s" height="%s" frameborder="0" style="border:none; width:%s; height:%s;"></iframe>',
            esc_url($quiz_url),
            esc_attr($atts['width']),
            esc_attr($atts['height']),
            esc_attr($atts['width']),
            esc_attr($atts['height'])
        );
    }
}

// Inicializar o plugin
new QuizNeniMaster_Iframe_Plugin();
?>