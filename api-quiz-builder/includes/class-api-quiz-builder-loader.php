<?php

/**
 * Gerencia os hooks do WordPress (ações e filtros).
 *
 * @package API_Quiz_Builder
 * @subpackage API_Quiz_Builder/includes
 */
class API_Quiz_Builder_Loader {

    /**
     * Array de hooks registrados.
     *
     * @var array $actions As ações e seus callbacks.
     * @var array $filters Os filtros e seus callbacks.
     */
    protected $actions;
    protected $filters;

    /**
     * Construtor da classe.
     */
    public function __construct() {
        $this->actions = array();
        $this->filters = array();
    }

    /**
     * Adiciona uma nova ação ao array de ações.
     *
     * @param string $hook          O nome do hook do WordPress que está sendo registrado.
     * @param object $component     Uma referência à instância do objeto no qual o callback está definido.
     * @param string $callback      O nome do callback que deve ser executado.
     * @param int    $priority      Opcional. A prioridade na qual o callback deve ser executado. Padrão: 10.
     * @param int    $accepted_args Opcional. O número de argumentos que o callback aceita. Padrão: 1.
     */
    public function add_action( $hook, $component, $callback, $priority = 10, $accepted_args = 1 ) {
        $this->actions = $this->add( $this->actions, $hook, $component, $callback, $priority, $accepted_args );
    }

    /**
     * Adiciona um novo filtro ao array de filtros.
     *
     * @param string $hook          O nome do hook do WordPress que está sendo registrado.
     * @param object $component     Uma referência à instância do objeto no qual o callback está definido.
     * @param string $callback      O nome do callback que deve ser executado.
     * @param int    $priority      Opcional. A prioridade na qual o callback deve ser executado. Padrão: 10.
     * @param int    $accepted_args Opcional. O número de argumentos que o callback aceita. Padrão: 1.
     */
    public function add_filter( $hook, $component, $callback, $priority = 10, $accepted_args = 1 ) {
        $this->filters = $this->add( $this->filters, $hook, $component, $callback, $priority, $accepted_args );
    }

    /**
     * Uma função utilitária para registrar um único hook (ação ou filtro).
     *
     * @param array  $hooks         O array de hooks (ações ou filtros) para adicionar.
     * @param string $hook          O nome do hook do WordPress que está sendo registrado.
     * @param object $component     Uma referência à instância do objeto no qual o callback está definido.
     * @param string $callback      O nome do callback que deve ser executado.
     * @param int    $priority      A prioridade na qual o callback deve ser executado.
     * @param int    $accepted_args O número de argumentos que o callback aceita.
     *
     * @return array O array de hooks modificado.
     */
    private function add( $hooks, $hook, $component, $callback, $priority, $accepted_args ) {
        $hooks[] = array(
            'hook'          => $hook,
            'component'     => $component,
            'callback'      => $callback,
            'priority'      => $priority,
            'accepted_args' => $accepted_args
        );
        return $hooks;
    }

    /**
     * Registra os filtros e ações com o WordPress.
     */
    public function run() {
        foreach ( $this->filters as $hook ) {
            add_filter( $hook['hook'], array( $hook['component'], $hook['callback'] ), $hook['priority'], $hook['accepted_args'] );
        }

        foreach ( $this->actions as $hook ) {
            add_action( $hook['hook'], array( $hook['component'], $hook['callback'] ), $hook['priority'], $hook['accepted_args'] );
        }
    }
}