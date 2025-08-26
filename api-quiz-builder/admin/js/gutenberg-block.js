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
        edit: () => null, // The sidebar handles editing/insertion
        save: () => null,
    });

    // 2. Create the React component for our new sidebar
    const QuizInserterSidebar = () => {
        const [quizzes, setQuizzes] = useState([]);
        const [isLoading, setIsLoading] = useState(true);
        const [error, setError] = useState(null);

        useEffect(() => {
            apiFetch({ path: '/nenimaster/v1/quizzes' })
                .then((data) => {
                    const quizOptions = data.map((quiz) => ({
                        label: quiz.title,
                        value: quiz.slug,
                    }));
                    setQuizzes(quizOptions);
                    setIsLoading(false);
                })
                .catch((err) => {
                    setError('Não foi possível carregar os quizzes. Verifique as configurações do plugin.');
                    setIsLoading(false);
                    console.error(err);
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