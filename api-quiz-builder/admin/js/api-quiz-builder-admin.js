jQuery(document).ready(function($) {
    console.log('Quiz NeniMaster Admin Script Loaded.');

    const loadBtn = $('#load-quizzes-btn');
    const container = $('#quiz-list-container');
    const statusEl = $('#quiz-list-status');
    const spinner = $('#load-quizzes-spinner');

    if (loadBtn.length === 0) {
        return;
    }

    loadBtn.on('click', function() {
        const apiUrl = quizNeniMaster.apiUrl;
        const apiKey = quizNeniMaster.apiKey;
        const anonKey = quizNeniMaster.anonKey;
        
        if (!apiUrl || !apiKey || !anonKey) {
            statusEl.text('Erro: Por favor, preencha e salve a URL do Sistema, a Supabase Anon Key e a Chave da API.').css('color', 'red');
            return;
        }

        // A API para listar todos os quizzes precisa ser implementada ou usada.
        // Por enquanto, vamos assumir que a Edge Function pode ser modificada para listar quizzes.
        // Vamos chamar a função com um parâmetro de ação.
        const endpoint = apiUrl.replace(/\/$/, '') + '/functions/v1/quiz-api?action=list_all';

        $.ajax({
            url: endpoint,
            method: 'GET',
            headers: {
                'Authorization': 'Bearer ' + anonKey,
                'x-api-key': apiKey
            },
            beforeSend: function() {
                loadBtn.prop('disabled', true);
                spinner.addClass('is-active');
                statusEl.text('Carregando quizzes...').css('color', '');
                container.html(statusEl);
            },
            success: function(response) {
                const quizzes = response.data; // Assumindo que a API retorna { data: [...] }
                container.empty();
                if (quizzes && quizzes.length > 0) {
                    quizzes.forEach(function(quiz) {
                        const shortcode = `[quiz_nenimaster slug="${quiz.slug}"]`;
                        const item = `
                            <div class="quiz-list-item">
                                <div>
                                    <div class="title">${quiz.title || 'Quiz sem título'}</div>
                                    <code class="shortcode">${shortcode}</code>
                                </div>
                                <button class="button button-secondary copy-btn" data-shortcode="${shortcode}">Copiar</button>
                            </div>
                        `;
                        container.append(item);
                    });
                } else {
                    statusEl.text('Nenhum quiz publicado encontrado.');
                    container.html(statusEl);
                }
            },
            error: function(jqXHR) {
                let errorMsg = `Erro ao carregar quizzes: ${jqXHR.statusText} (${jqXHR.status}).`;
                statusEl.text(errorMsg).css('color', 'red');
                container.html(statusEl);
            },
            complete: function() {
                loadBtn.prop('disabled', false);
                spinner.removeClass('is-active');
            }
        });
    });

    container.on('click', '.copy-btn', function() {
        const shortcode = $(this).data('shortcode');
        navigator.clipboard.writeText(shortcode).then(() => {
            const originalText = $(this).text();
            $(this).text('Copiado!');
            setTimeout(() => {
                $(this).text(originalText);
            }, 2000);
        });
    });
});