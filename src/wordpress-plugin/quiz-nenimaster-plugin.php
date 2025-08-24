
<?php
/**
 * Plugin Name: Quiz NeniMaster
 * Plugin URI: https://github.com/seu-usuario/quiz-nenimaster
 * Description: Plugin para integrar e exibir quizzes do sistema Quiz NeniMaster no WordPress usando shortcode.
 * Version: 1.0.4
 * Author: Matheus Pastorini
 * License: GPL v2 or later
 * Text Domain: quiz-nenimaster
 * Requires at least: 5.0
 * Tested up to: 6.4
 * Requires PHP: 7.4
 */

// Prevenir acesso direto
if (!defined('ABSPATH')) {
    exit;
}

// Verificar versão do PHP
if (version_compare(PHP_VERSION, '7.4', '<')) {
    add_action('admin_notices', function() {
        echo '<div class="notice notice-error"><p>Quiz NeniMaster requer PHP 7.4 ou superior. Versão atual: ' . PHP_VERSION . '</p></div>';
    });
    return;
}

class QuizNeniMaster {
    
    private $plugin_name = 'quiz-nenimaster';
    private $version = '1.0.4';
    
    public function __construct() {
        register_activation_hook(__FILE__, array($this, 'activate'));
        register_deactivation_hook(__FILE__, array($this, 'deactivate'));
        
        add_action('init', array($this, 'init'));
        add_action('admin_menu', array($this, 'add_admin_menu'));
        add_action('admin_init', array($this, 'settings_init'));
        add_shortcode('quiz_nenimaster', array($this, 'shortcode_handler'));
        add_action('wp_enqueue_scripts', array($this, 'enqueue_scripts'));
        add_action('admin_enqueue_scripts', array($this, 'admin_enqueue_scripts'));
    }
    
    public function activate() {
        // Configurações padrão na ativação
        if (!get_option('quiz_nenimaster_endpoint')) {
            update_option('quiz_nenimaster_endpoint', 'https://riqfafiivzpotfjqfscd.supabase.co');
        }
        
        // Criar página de teste se não existir
        if (!get_page_by_title('Teste Quiz NeniMaster')) {
            wp_insert_post(array(
                'post_title' => 'Teste Quiz NeniMaster',
                'post_content' => '[quiz_nenimaster slug="exemplo"]',
                'post_status' => 'draft',
                'post_type' => 'page'
            ));
        }
    }
    
    public function deactivate() {
        // Limpeza se necessário
        delete_transient('quiz_nenimaster_api_test');
    }
    
    public function init() {
        load_plugin_textdomain($this->plugin_name, false, dirname(plugin_basename(__FILE__)) . '/languages/');
    }
    
    public function add_admin_menu() {
        add_menu_page(
            'Quiz NeniMaster',
            'Quiz NeniMaster',
            'manage_options',
            'quiz-nenimaster',
            array($this, 'admin_page'),
            'dashicons-forms',
            30
        );
    }
    
    public function settings_init() {
        register_setting('quiz_nenimaster_settings', 'quiz_nenimaster_api_key');
        register_setting('quiz_nenimaster_settings', 'quiz_nenimaster_endpoint');
        
        add_settings_section(
            'quiz_nenimaster_section',
            __('Configurações da API', 'quiz-nenimaster'),
            array($this, 'settings_section_callback'),
            'quiz_nenimaster_settings'
        );
        
        add_settings_field(
            'quiz_nenimaster_endpoint',
            __('URL do Sistema', 'quiz-nenimaster'),
            array($this, 'endpoint_field_callback'),
            'quiz_nenimaster_settings',
            'quiz_nenimaster_section'
        );
        
        add_settings_field(
            'quiz_nenimaster_api_key',
            __('Chave da API', 'quiz-nenimaster'),
            array($this, 'api_key_field_callback'),
            'quiz_nenimaster_settings',
            'quiz_nenimaster_section'
        );
    }
    
    public function admin_enqueue_scripts($hook) {
        if ('toplevel_page_quiz-nenimaster' !== $hook) {
            return;
        }
        wp_enqueue_script('jquery');
    }
    
    public function admin_page() {
        $endpoint = get_option('quiz_nenimaster_endpoint', 'https://riqfafiivzpotfjqfscd.supabase.co');
        $api_key = get_option('quiz_nenimaster_api_key', '');
        ?>
        <div class="wrap">
            <h1><?php echo esc_html(get_admin_page_title()); ?></h1>
            
            <?php if (isset($_GET['settings-updated']) && $_GET['settings-updated']) : ?>
                <div class="notice notice-success is-dismissible">
                    <p>Configurações salvas com sucesso!</p>
                </div>
            <?php endif; ?>
            
            <div class="quiz-nenimaster-admin">
                <div class="card">
                    <h2>📋 Configurações</h2>
                    <form action="options.php" method="post">
                        <?php
                        settings_fields('quiz_nenimaster_settings');
                        do_settings_sections('quiz_nenimaster_settings');
                        submit_button(__('Salvar Configurações', 'quiz-nenimaster'));
                        ?>
                    </form>
                </div>
                
                <?php if (!empty($endpoint) && !empty($api_key)) : ?>
                <div class="card">
                    <h2>🔍 Teste de Conexão</h2>
                    <button type="button" id="test-api-connection" class="button button-secondary">
                        Testar Conexão com a API
                    </button>
                    <div id="connection-result" style="margin-top: 10px;"></div>
                </div>
                
                <div class="card">
                    <h2>📝 Lista de Quizzes</h2>
                    <div id="quiz-list">
                        <p>Clique em "Carregar Quizzes" para ver a lista...</p>
                    </div>
                    <button type="button" id="load-quizzes" class="button button-secondary">
                        Carregar Quizzes
                    </button>
                </div>
                <?php endif; ?>
                
                <div class="card">
                    <h2>📖 Como usar</h2>
                    <p><strong>Para exibir um quiz em qualquer página ou post, use o shortcode:</strong></p>
                    <div class="shortcode-examples">
                        <p><code>[quiz_nenimaster slug="seu-quiz-slug"]</code></p>
                        <p><code>[quiz_nenimaster id="seu-quiz-id"]</code></p>
                        <p><strong>Exemplo:</strong> <code>[quiz_nenimaster slug="quiz-emprestimo"]</code></p>
                    </div>
                    
                    <h3>⚙️ Parâmetros opcionais:</h3>
                    <ul>
                        <li><code>width</code> - Largura do quiz (padrão: 100%)</li>
                        <li><code>height</code> - Altura do quiz (padrão: 600px)</li>
                    </ul>
                    <p><strong>Exemplo completo:</strong> <code>[quiz_nenimaster slug="meu-quiz" width="800px" height="500px"]</code></p>
                </div>

                <div class="card">
                    <h2>🔧 Instruções de Configuração</h2>
                    <div class="instructions">
                        <h3>📌 Configuração Correta:</h3>
                        <ul>
                            <li><strong>URL do Sistema:</strong> https://riqfafiivzpotfjqfscd.supabase.co</li>
                            <li><strong>NÃO digite</strong> /functions/v1/quiz-api na URL - isso é adicionado automaticamente</li>
                            <li><strong>Endpoint da API:</strong> /functions/v1/quiz-api (automático)</li>
                        </ul>
                        
                        <h3>🔑 Como obter a chave API:</h3>
                        <ol>
                            <li>Acesse o sistema Quiz NeniMaster</li>
                            <li>Faça login na sua conta</li>
                            <li>Vá em <strong>Configurações > Chaves de API</strong></li>
                            <li>Crie uma nova chave API</li>
                            <li>Copie a chave gerada (começa com "qb_")</li>
                            <li>Cole no campo "Chave da API" acima</li>
                        </ol>
                        
                        <h3>⚠️ Solução de Problemas:</h3>
                        <ul>
                            <li><strong>URL correta:</strong> https://riqfafiivzpotfjqfscd.supabase.co (SEM /functions/v1/quiz-api)</li>
                            <li>Certifique-se de que a chave API está ativa no sistema</li>
                            <li>Verifique se os quizzes estão com status "publicado"</li>
                            <li>Se der erro 401, a chave API pode estar inválida ou inativa</li>
                            <li>Se der erro 404, verifique se o quiz existe e está publicado</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
        
        <style>
        .quiz-nenimaster-admin .card {
            background: #fff;
            border: 1px solid #c3c4c7;
            border-radius: 4px;
            padding: 20px;
            margin: 20px 0;
        }
        .quiz-nenimaster-admin .card h2 {
            margin-top: 0;
        }
        .shortcode-examples {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 4px;
            margin: 10px 0;
        }
        .shortcode-examples code {
            background: #e9ecef;
            padding: 2px 6px;
            border-radius: 3px;
            font-family: monospace;
        }
        .instructions {
            background: #f0f8ff;
            padding: 15px;
            border-radius: 4px;
            border-left: 4px solid #0073aa;
        }
        .instructions h3 {
            margin-top: 15px;
            margin-bottom: 10px;
            color: #0073aa;
        }
        .instructions ul, .instructions ol {
            margin-left: 20px;
        }
        .quiz-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px;
            border-bottom: 1px solid #eee;
            background: #f9f9f9;
            margin: 5px 0;
            border-radius: 4px;
        }
        .quiz-shortcode {
            background: #fff;
            padding: 5px 10px;
            border-radius: 3px;
            font-family: monospace;
            font-size: 12px;
            border: 1px solid #ddd;
        }
        .success-message {
            color: #155724;
            background: #d4edda;
            border: 1px solid #c3e6cb;
            border-radius: 4px;
            padding: 10px;
            margin: 10px 0;
        }
        .error-message {
            color: #721c24;
            background: #f8d7da;
            border: 1px solid #f5c6cb;
            border-radius: 4px;
            padding: 10px;
            margin: 10px 0;
        }
        .loading {
            color: #0073aa;
            font-style: italic;
        }
        </style>
        
        <script>
        jQuery(document).ready(function($) {
            
            $('#test-api-connection').on('click', function() {
                testApiConnection();
            });
            
            $('#load-quizzes').on('click', function() {
                loadQuizzes();
            });
            
            function testApiConnection() {
                const endpoint = '<?php echo esc_js($endpoint); ?>';
                const apiKey = '<?php echo esc_js($api_key); ?>';
                
                $('#connection-result').html('<div class="loading">🔄 Testando conexão...</div>');
                
                if (!endpoint || !apiKey) {
                    $('#connection-result').html('<div class="error-message">❌ Configure a URL do sistema e a chave da API primeiro.</div>');
                    return;
                }
                
                // Construir URL corretamente - evitar dupla concatenação
                let baseUrl = endpoint.replace(/\/$/, ''); // Remove barra no final se existir
                const apiUrl = baseUrl + '/functions/v1/quiz-api/quizzes';
                
                console.log('🔍 Testando conexão com:', apiUrl);
                
                $.ajax({
                    url: apiUrl,
                    method: 'GET',
                    headers: {
                        'x-api-key': apiKey,
                        'Content-Type': 'application/json'
                    },
                    timeout: 15000,
                    success: function(response) {
                        console.log('✅ Resposta da API:', response);
                        $('#connection-result').html(
                            '<div class="success-message">✅ Conexão bem-sucedida! API está funcionando corretamente. Encontrados ' + (response.count || 0) + ' quizzes.</div>'
                        );
                    },
                    error: function(xhr, status, error) {
                        console.error('❌ Erro na conexão:', {
                            status: xhr.status,
                            statusText: xhr.statusText,
                            error: error, 
                            response: xhr.responseText,
                            readyState: xhr.readyState
                        });
                        
                        let errorMsg = '❌ Falha na conexão. ';
                        
                        if (xhr.readyState === 0) {
                            errorMsg += 'Problema de conectividade ou CORS. Verifique se a URL está correta e acessível.';
                        } else if (xhr.status === 401) {
                            errorMsg += 'Chave da API inválida ou expirada. Verifique se está correta e ativa no sistema.';
                        } else if (xhr.status === 404) {
                            errorMsg += 'Endpoint não encontrado. Verifique se a URL do sistema está correta.';
                        } else if (xhr.status === 500) {
                            errorMsg += 'Erro interno do servidor. Entre em contato com o suporte.';
                        } else if (xhr.status === 0 && status === 'error') {
                            errorMsg += 'Falha na requisição. Possível problema de CORS ou conectividade.';
                        } else {
                            errorMsg += `Erro ${xhr.status}: ${error || xhr.statusText}`;
                        }
                        
                        if (xhr.responseText) {
                            try {
                                const response = JSON.parse(xhr.responseText);
                                if (response.message) {
                                    errorMsg += '<br><strong>Detalhes:</strong> ' + response.message;
                                }
                            } catch (e) {
                                errorMsg += '<br><strong>Resposta do servidor:</strong> ' + xhr.responseText.substring(0, 200);
                            }
                        }
                        
                        $('#connection-result').html(`<div class="error-message">${errorMsg}</div>`);
                    }
                });
            }
            
            function loadQuizzes() {
                const endpoint = '<?php echo esc_js($endpoint); ?>';
                const apiKey = '<?php echo esc_js($api_key); ?>';
                
                if (!endpoint || !apiKey) {
                    $('#quiz-list').html('<div class="error-message">❌ Configure a URL do sistema e a chave da API primeiro.</div>');
                    return;
                }
                
                $('#quiz-list').html('<div class="loading">🔄 Carregando quizzes...</div>');
                
                // Construir URL corretamente - evitar dupla concatenação
                let baseUrl = endpoint.replace(/\/$/, ''); // Remove barra no final se existir
                const apiUrl = baseUrl + '/functions/v1/quiz-api/quizzes';
                
                console.log('📋 Carregando quizzes de:', apiUrl);
                
                $.ajax({
                    url: apiUrl,
                    method: 'GET',
                    headers: {
                        'x-api-key': apiKey,
                        'Content-Type': 'application/json'
                    },
                    timeout: 15000,
                    success: function(response) {
                        console.log('✅ Quizzes carregados:', response);
                        displayQuizzes(response.data || response.quizzes || response);
                    },
                    error: function(xhr, status, error) {
                        console.error('❌ Erro ao carregar quizzes:', {status, error, response: xhr.responseText});
                        
                        let errorMsg = '❌ Erro ao carregar quizzes. ';
                        if (xhr.status === 401) {
                            errorMsg += 'Chave da API inválida.';
                        } else if (xhr.status === 0) {
                            errorMsg += 'Problema de CORS ou conectividade.';
                        } else {
                            errorMsg += `Status: ${xhr.status} - ${error}`;
                        }
                        
                        $('#quiz-list').html(`<div class="error-message">${errorMsg}</div>`);
                    }
                });
            }
            
            function displayQuizzes(quizzes) {
                let html = '';
                
                if (quizzes && quizzes.length > 0) {
                    html += `<p><strong>📊 ${quizzes.length} quiz(es) encontrado(s):</strong></p>`;
                    
                    quizzes.forEach(function(quiz) {
                        const shortcodeSlug = `[quiz_nenimaster slug="${quiz.slug || quiz.id}"]`;
                        const shortcodeId = `[quiz_nenimaster id="${quiz.id}"]`;
                        
                        html += `
                            <div class="quiz-item">
                                <div>
                                    <strong>📝 ${quiz.title}</strong>
                                    ${quiz.description ? `<br><small>📄 ${quiz.description}</small>` : ''}
                                    <br><small>🆔 ID: ${quiz.id}</small>
                                    ${quiz.slug ? `<br><small>🔗 Slug: ${quiz.slug}</small>` : ''}
                                </div>
                                <div>
                                    <div style="margin-bottom: 5px;">
                                        <span class="quiz-shortcode">${shortcodeSlug}</span>
                                        <button type="button" class="button button-small" onclick="copyToClipboard('${shortcodeSlug}')">📋 Copiar</button>
                                    </div>
                                    <div>
                                        <span class="quiz-shortcode">${shortcodeId}</span>
                                        <button type="button" class="button button-small" onclick="copyToClipboard('${shortcodeId}')">📋 Copiar</button>
                                    </div>
                                </div>
                            </div>
                        `;
                    });
                } else {
                    html = '<div class="error-message">📭 Nenhum quiz publicado encontrado.</div>';
                }
                
                $('#quiz-list').html(html);
            }
            
            window.copyToClipboard = function(text) {
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText(text).then(function() {
                        alert('✅ Shortcode copiado para a área de transferência!');
                    }).catch(function(err) {
                        console.error('Erro ao copiar:', err);
                        fallbackCopyToClipboard(text);
                    });
                } else {
                    fallbackCopyToClipboard(text);
                }
            };
            
            function fallbackCopyToClipboard(text) {
                const textArea = document.createElement('textarea');
                textArea.value = text;
                textArea.style.position = 'fixed';
                textArea.style.opacity = '0';
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                
                try {
                    document.execCommand('copy');
                    alert('✅ Shortcode copiado!');
                } catch (err) {
                    console.error('Erro ao copiar:', err);
                    alert('❌ Erro ao copiar. Copie manualmente: ' + text);
                }
                
                document.body.removeChild(textArea);
            }
        });
        </script>
        <?php
    }
    
    public function settings_section_callback() {
        echo '<p>' . __('Configure as informações para conectar com o sistema Quiz NeniMaster.', 'quiz-nenimaster') . '</p>';
        echo '<div class="notice notice-info inline"><p><strong>💡 Importante:</strong> Use APENAS a URL base: https://riqfafiivzpotfjqfscd.supabase.co</p></div>';
    }
    
    public function endpoint_field_callback() {
        $value = get_option('quiz_nenimaster_endpoint', 'https://riqfafiivzpotfjqfscd.supabase.co');
        echo '<input type="url" id="quiz_nenimaster_endpoint" name="quiz_nenimaster_endpoint" value="' . esc_attr($value) . '" class="regular-text" placeholder="https://riqfafiivzpotfjqfscd.supabase.co" required />';
        echo '<p class="description">' . __('URL base do seu sistema Quiz NeniMaster.', 'quiz-nenimaster') . '</p>';
        echo '<p class="description"><strong>⚠️ ATENÇÃO:</strong> Use APENAS: https://riqfafiivzpotfjqfscd.supabase.co (SEM /functions/v1/quiz-api)</p>';
    }
    
    public function api_key_field_callback() {
        $value = get_option('quiz_nenimaster_api_key');
        echo '<input type="password" id="quiz_nenimaster_api_key" name="quiz_nenimaster_api_key" value="' . esc_attr($value) . '" class="regular-text" placeholder="qb_..." />';
        echo '<p class="description">' . __('Sua chave de API gerada no sistema Quiz NeniMaster (na seção Configurações > Chaves de API).', 'quiz-nenimaster') . '</p>';
        
        if (!empty($value)) {
            echo '<p class="description" style="color: green;">✅ Chave configurada (termina em: ...' . substr($value, -8) . ')</p>';
        } else {
            echo '<p class="description" style="color: red;">❌ Chave não configurada</p>';
        }
    }
    
    public function shortcode_handler($atts) {
        $atts = shortcode_atts(array(
            'slug' => '',
            'id' => '',
            'width' => '100%',
            'height' => '600px'
        ), $atts, 'quiz_nenimaster');
        
        // Validação dos parâmetros
        if (empty($atts['slug']) && empty($atts['id'])) {
            return '<div style="border: 2px dashed #ccc; padding: 20px; text-align: center; color: #666;">
                        ❌ <strong>Quiz NeniMaster:</strong> Especifique um slug ou ID do quiz.<br>
                        <small>Exemplo: [quiz_nenimaster slug="meu-quiz"] ou [quiz_nenimaster id="123"]</small>
                    </div>';
        }
        
        $endpoint = get_option('quiz_nenimaster_endpoint');
        if (empty($endpoint)) {
            return '<div style="border: 2px dashed #f00; padding: 20px; text-align: center; color: #d00;">
                        ❌ <strong>Quiz NeniMaster:</strong> Configure o endpoint da API nas configurações do plugin.
                    </div>';
        }
        
        // Construir URL do quiz - usando a URL pública do quiz
        $quiz_identifier = !empty($atts['slug']) ? $atts['slug'] : $atts['id'];
        $quiz_url = rtrim($endpoint, '/') . '/quiz/' . urlencode($quiz_identifier);
        
        $iframe_id = 'quiz-nenimaster-' . uniqid();
        
        ob_start();
        ?>
        <div class="quiz-nenimaster-container" style="width: <?php echo esc_attr($atts['width']); ?>; margin: 0 auto; max-width: 100%;">
            <iframe 
                id="<?php echo esc_attr($iframe_id); ?>"
                src="<?php echo esc_url($quiz_url); ?>" 
                width="100%" 
                height="<?php echo esc_attr($atts['height']); ?>"
                frameborder="0" 
                scrolling="auto"
                loading="lazy"
                style="border: none; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); background: #f9f9f9;">
                <p>Seu navegador não suporta iframes. <a href="<?php echo esc_url($quiz_url); ?>" target="_blank">Abrir quiz em nova janela</a></p>
            </iframe>
        </div>
        
        <script>
        (function() {
            const iframe = document.getElementById('<?php echo esc_js($iframe_id); ?>');
            if (!iframe) return;
            
            // Auto-resize baseado no conteúdo
            window.addEventListener('message', function(event) {
                const allowedOrigins = [
                    'https://riqfafiivzpotfjqfscd.supabase.co',
                    '<?php echo esc_js(parse_url($endpoint, PHP_URL_SCHEME) . '://' . parse_url($endpoint, PHP_URL_HOST)); ?>'
                ];
                
                if (!allowedOrigins.includes(event.origin)) {
                    return;
                }
                
                if (event.data && event.data.type === 'quiz-height' && event.data.iframe === '<?php echo esc_js($iframe_id); ?>') {
                    const newHeight = Math.max(400, parseInt(event.data.height) || 600);
                    iframe.style.height = newHeight + 'px';
                    console.log('📐 Quiz altura ajustada para:', newHeight + 'px');
                }
            });
            
            // Enviar ID do iframe para o quiz
            iframe.addEventListener('load', function() {
                try {
                    iframe.contentWindow.postMessage({
                        type: 'iframe-id',
                        id: '<?php echo esc_js($iframe_id); ?>'
                    }, '<?php echo esc_js($endpoint); ?>');
                    console.log('📤 ID do iframe enviado para o quiz');
                } catch (e) {
                    console.log('ℹ️ Não foi possível enviar mensagem para o iframe (normal se for domínio diferente)');
                }
            });
            
            // Fallback de altura após timeout
            setTimeout(function() {
                if (iframe.style.height === '<?php echo esc_js($atts['height']); ?>') {
                    console.log('📐 Usando altura padrão do shortcode');
                }
            }, 3000);
        })();
        </script>
        <?php
        return ob_get_clean();
    }
    
    public function enqueue_scripts() {
        // Scripts para o frontend se necessário
    }
}

// Verificar se a classe já foi iniciada para evitar conflitos
if (!isset($GLOBALS['quiz_nenimaster_instance'])) {
    $GLOBALS['quiz_nenimaster_instance'] = new QuizNeniMaster();
}

?>
