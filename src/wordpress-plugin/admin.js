jQuery(document).ready(function($) {
    console.log('Quiz NeniMaster Admin Script Loaded.');

    const loadBtn = $('#load-quizzes-btn');
    const container = $('#quiz-list-container');
    const statusEl = $('#quiz-list-status');

    if (loadBtn.length === 0) {
        console.error('Botão #load-quizzes-btn não encontrado.');
        return;
    }

    loadBtn.on('click', function() {
        console.log('Botão "Carregar Quizzes" clicado.');
        const apiUrl = quizNeniMaster.apiUrl;
        const apiKey = quizNeniMaster.apiKey;
        const anonKey = quizNeniMaster.anonKey; // Pegando a nova chave
        
        console.log('URL da API:', apiUrl);
        console.log('Chave Anon:', anonKey ? '...' + anonKey.slice(-4) : 'Nenhuma');
        console.log('Chave da API:', apiKey ? '...' + apiKey.slice(-4) : 'Nenhuma');

        if (!apiUrl || !apiKey || !anonKey) {
            statusEl.text('Erro: Por favor, preencha e salve a URL do Sistema, a Supabase Anon Key e a Chave da API.').css('color', 'red');
            return;
        }

        const endpoint = apiUrl.replace(/\/$/, '') + '/functions/v1/quiz-api/quizzes';
        console.log('Endpoint da requisição:', endpoint);

        $.ajax({
            url: endpoint,
            method: 'GET',
            headers: {
                'Authorization': 'Bearer ' + anonKey, // Adicionando o cabeçalho de autorização
                'x-api-key': apiKey
            },
            beforeSend: function() {
                loadBtn.prop('disabled', true);
                statusEl.text('Carregando quizzes...').css('color', '');
                container.html(statusEl);
            },
            success: function(quizzes) {
                console.log('Sucesso! Quizzes recebidos:', quizzes);
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
                                <button class="button copy-btn" data-shortcode="${shortcode}">Copiar</button>
                            </div>
                        `;
                        container.append(item);
                    });
                } else {
                    statusEl.text('Nenhum quiz publicado encontrado.');
                    container.html(statusEl);
                }
            },
            error: function(jqXHR, textStatus, errorThrown) {
                console.error('Erro na requisição AJAX:', {
                    status: jqXHR.status,
                    statusText: jqXHR.statusText,
                    responseText: jqXHR.responseText,
                    textStatus: textStatus,
                    errorThrown: errorThrown
                });
                let errorMsg = `Erro ao carregar quizzes: ${textStatus} (${jqXHR.status}).`;
                if (jqXHR.responseText) {
                    try {
                        const errorJson = JSON.parse(jqXHR.responseText);
                        errorMsg += ` Detalhe: ${errorJson.error || jqXHR.responseText}`;
                    } catch (e) {
                        errorMsg += ` Resposta do servidor: ${jqXHR.responseText}`;
                    }
                }
                statusEl.text(errorMsg).css('color', 'red');
                container.html(statusEl);
            },
            complete: function() {
                loadBtn.prop('disabled', false);
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