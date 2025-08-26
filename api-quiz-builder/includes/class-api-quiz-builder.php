<?php

/**
 * A classe principal que orquestra a inicialização das partes administrativa e pública do plugin.
 *
 * @package API_Quiz_Builder
 * @subpackage API_Quiz_Builder/includes
 */
class API_Quiz_Builder {

    /**
     * O gerenciador de hooks que registra todas as ações e filtros.
     *
     * @var API_Quiz_Builder_Loader $loader Mantém e registra todos os hooks.
     */
    protected $loader;

    /**
     * O identificador único deste plugin.
     *
     * @var string $plugin_name O nome do plugin usado para internacionalização e identificação.
     */
    protected $plugin_name;

    /**
     * A versão atual do plugin.
     *
     * @var string $version A versão atual do plugin.
     */
    protected $version;

    /**
     * Construtor da classe.
     */
    public function __construct() {
        $this->plugin_name = 'api-quiz-builder';
        $this->version = API_QUIZ_BUILDER_VERSION;

        $this->load_dependencies();
        $this->define_admin_hooks();
        $this->define_public_hooks();
    }

    /**
     * Carrega as dependências do plugin.
     */
    private function load_dependencies() {
        require_once API_QUIZ_BUILDER_PATH . 'admin/class-api-quiz-builder-admin.php';
        require_once API_QUIZ_BUILDER_PATH . 'public/class-api-quiz-builder-public.php';
        require_once API_QUIZ_BUILDER_PATH . 'includes/class-api-quiz-builder-gutenberg.php'; // Para registrar o bloco Gutenberg
        
        $this->loader = new API_Quiz_Builder_Loader();
    }

    /**
     * Registra todos os hooks relacionados à área administrativa.
     */
    private function define_admin_hooks() {
        $plugin_admin = new API_Quiz_Builder_Admin( $this->get_plugin_name(), $this->get_version() );

        $this->loader->add_action( 'admin_menu', $plugin_admin, 'add_plugin_admin_menu' );
        $this->loader->add_action( 'admin_init', $plugin_admin, 'settings_init' );
        $this->loader->add_action( 'admin_enqueue_scripts', $plugin_admin, 'enqueue_admin_scripts' );
        
        // Gutenberg Block
        $plugin_gutenberg = new API_Quiz_Builder_Gutenberg( $this->get_plugin_name(), $this->get_version() );
        $this->loader->add_action( 'init', $plugin_gutenberg, 'register_gutenberg_block' );
        $this->loader->add_action( 'enqueue_block_editor_assets', $plugin_gutenberg, 'enqueue_block_editor_assets' );
    }

    /**
     * Registra todos os hooks relacionados à área pública.
     */
    private function define_public_hooks() {
        $plugin_public = new API_Quiz_Builder_Public( $this->get_plugin_name(), $this->get_version() );

        $this->loader->add_action( 'wp_enqueue_scripts', $plugin_public, 'enqueue_public_scripts' );
        $this->loader->add_action( 'init', $plugin_public, 'register_shortcode' );
    }

    /**
     * Executa o loader para registrar todos os hooks.
     */
    public function run() {
        $this->loader->run();
    }

    /**
     * Retorna o nome do plugin.
     *
     * @return string O nome do plugin.
     */
    public function get_plugin_name() {
        return $this->plugin_name;
    }

    /**
     * Retorna a versão do plugin.
     *
     * @return string A versão do plugin.
     */
    public function get_version() {
        return $this->version;
    }

    /**
     * Obtém as configurações salvas do plugin.
     *
     * @return array As configurações do plugin.
     */
    public static function get_plugin_settings() {
        return get_option( 'api_quiz_builder_settings', array() );
    }

    /**
     * Hook de ativação do plugin.
     */
    public static function activate() {
        // Pode ser usado para criar tabelas, definir opções padrão, etc.
        // Exemplo: Definir opções padrão se ainda não existirem
        $default_settings = array(
            'supabase_url' => 'https://riqfafiivzpotfjqfscd.supabase.co',
            'supabase_anon_key' => 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpcWZhZmlpdnpwb3RmanFmc2NkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU5NjExMDcsImV4cCI6MjA3MTUzNzEwN30.TGxCyriLKuvI1r8_MJPtGiEctXOCrXkyk0ez-LRWjto',
            'api_key' => '',
        );
        add_option( 'api_quiz_builder_settings', $default_settings );
    }

    /**
     * Hook de desativação do plugin.
     */
    public static function deactivate() {
        // Pode ser usado para limpar dados, remover opções, etc.
        // Exemplo: delete_option( 'api_quiz_builder_settings' );
    }
}