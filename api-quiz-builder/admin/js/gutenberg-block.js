(function(blocks, element, components, apiFetch) {
    const { registerBlockType } = blocks;
    const { createElement, useState, useEffect } = element;
    const { SelectControl, PanelBody } = components;
    const { InspectorControls } = wp.blockEditor;

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

        edit: function(props) {
            const { attributes, setAttributes } = props;
            const [quizzes, setQuizzes] = useState([]);
            const [loading, setLoading] = useState(true);

            useEffect(function() {
                apiFetch({ path: '/nenimaster/v1/quizzes' })
                    .then(function(data) {
                        const quizOptions = data.map(function(quiz) {
                            return { label: quiz.title, value: quiz.slug };
                        });
                        setQuizzes([{ label: 'Selecione um Quiz', value: '' }].concat(quizOptions));
                        setLoading(false);
                    })
                    .catch(function(error) {
                        console.error('Error fetching quizzes:', error);
                        setQuizzes([{ label: 'Erro ao carregar quizzes', value: '' }]);
                        setLoading(false);
                    });
            }, []);

            function onQuizChange(newSlug) {
                setAttributes({ quizSlug: newSlug });
            }

            return [
                createElement(InspectorControls, { key: 'inspector' },
                    createElement(PanelBody, { title: 'Configurações do Quiz' },
                        createElement(SelectControl, {
                            label: 'Selecione o Quiz',
                            value: attributes.quizSlug,
                            options: quizzes,
                            onChange: onQuizChange,
                            disabled: loading,
                        })
                    )
                ),
                createElement('div', { className: props.className },
                    attributes.quizSlug ? 
                    'Quiz NeniMaster selecionado: ' + (quizzes.find(q => q.value === attributes.quizSlug)?.label || attributes.quizSlug) + '. O quiz será exibido aqui.' :
                    'Por favor, selecione um quiz no painel de configurações à direita.'
                )
            ];
        },

        save: function() {
            // A renderização é feita pelo PHP (render_callback), então o save retorna null.
            return null;
        },
    });
})(window.wp.blocks, window.wp.element, window.wp.components, window.wp.apiFetch);