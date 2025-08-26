(function(wp) {
    const { registerPlugin } = wp.plugins;
    const { PluginSidebar, PluginSidebarMoreMenuItem } = wp.editPost;
    const { createElement, useState, useEffect } = wp.element;
    const { PanelBody, Button, Spinner } = wp.components;
    const { __ } = wp.i18n;
    const { apiFetch } = wp;
    const { createBlock } = wp.blocks;
    const { dispatch } = wp.data;
    const { registerBlockType } = wp.blocks;

    // 1. Register the underlying block (it won't be visible in the inserter, but is needed)
    registerBlockType('nenimaster/quiz-block', {
        title: 'Quiz NeniMaster',
        icon: 'forms',
        category: 'embed',
        attributes: {
            quizSlug: {
                type: 'string',
                default: '',
            },
        },
        edit: () => null, // The sidebar handles editing/insertion
        save: (props) => {
            // Renderiza o shortcode no frontend
            return `[quiz_nenimaster slug="${props.attributes.quizSlug}"]`;
        },
    });

    // 2. Create the React component for our new sidebar
    const QuizInserterSidebar = () => {
        const [quizzes, setQuizzes] = useState([]);
        const [isLoading, setIsLoading] = useState(true);
        const [error, setError] = useState(null);

        useEffect(() => {
            // Acessa as variáveis localizadas por wp_localize_script (do admin/class-api-quiz-builder-admin.php)
            const supabaseUrl = quizNeniMasterAdmin.supabase_url;
            const apiKey = quizNeniMasterAdmin.api_key;
            const anonKey = quizNeniMasterAdmin.supabase_anon_key;

            if (!supabaseUrl || !apiKey || !anonKey) {
                setError('Por favor, preencha e salve a URL do Sistema, a Supabase Anon Key e a Chave da API nas configurações do plugin.');
                setIsLoading(false);
                return;
            }

            const endpoint = supabaseUrl.replace(/\/$/, '') + '/functions/v1/quiz-api?action=list_all';

            apiFetch({
                url: endpoint,
                method: 'GET',
                headers: {
                    'Authorization': 'Bearer ' + anonKey,
                    'x-api-key': apiKey
                },
            })
            .then((response) => {
                const data = response.data; // Assumindo que a API retorna { data: [...] }
                const quizOptions = data.map((quiz) => ({
                    label: quiz.title || 'Quiz sem título',
                    value: quiz.slug,
                }));
                setQuizzes(quizOptions);
                setIsLoading(false);
            })
            .catch((err) => {
                console.error('Erro ao carregar quizzes para o Gutenberg:', err);
                let errorMsg = 'Não foi possível carregar os quizzes. Verifique as configurações do plugin.';
                if (err.message) {
                    errorMsg += ` Detalhe: ${err.message}`;
                }
                setError(errorMsg);
                setIsLoading(false);
            });
        }, []);

        const insertQuiz = (slug) => {
            const block = createBlock('nenimaster/quiz-block', {
                quizSlug: slug,
            });
            dispatch('core/block-editor').insertBlocks(block);
            // Optional: close the sidebar after inserting
            dispatch('core/edit-post').closeGeneralSidebar();
        };

        return createElement(
            'div',
            { style: { padding: '16px' } },
            createElement(
                PanelBody,
                { title: __('Quizzes Publicados', 'nenimaster-quiz-inserter') },
                isLoading && createElement(Spinner),
                error && createElement('p', { style: { color: 'red' } }, error),
                !isLoading && !error && quizzes.length === 0 && createElement('p', {}, 'Nenhum quiz publicado encontrado.'),
                !isLoading && !error && quizzes.map((quiz) =>
                    createElement(
                        Button,
                        {
                            isPrimary: true,
                            isLarge: true,
                            style: { marginBottom: '8px', width: '100%', justifyContent: 'flex-start' },
                            onClick: () => insertQuiz(quiz.value),
                        },
                        quiz.label
                    )
                )
            )
        );
    };

    // 3. Register the plugin which creates the sidebar and the icon
    registerPlugin('nenimaster-quiz-inserter', {
        icon: 'forms', // The icon for the sidebar
        render: () => {
            return createElement(
                wp.element.Fragment,
                {},
                createElement(
                    PluginSidebarMoreMenuItem,
                    { target: 'nenimaster-quiz-sidebar' },
                    __('Quiz NeniMaster', 'nenimaster-quiz-inserter')
                ),
                createElement(
                    PluginSidebar,
                    {
                        name: 'nenimaster-quiz-sidebar',
                        title: __('Inserir Quiz', 'nenimaster-quiz-inserter'),
                    },
                    createElement(QuizInserterSidebar)
                )
            );
        },
    });

})(window.wp);