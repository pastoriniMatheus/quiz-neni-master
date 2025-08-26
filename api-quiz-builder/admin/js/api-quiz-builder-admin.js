jQuery(document).ready(function($) {
    console.log('Quiz NeniMaster Admin Script Loaded.');

    const loadBtn = $('#load-quizzes-btn');
    const container = $('#quiz-list-container');
    const statusEl = $('#quiz-list-status');
    const spinner = $('#load-quizzes-spinner');

    if (loadBtn.length === 0) {
        console.error('Botão #load-quizzes-btn não encontrado.');
        return;
    }

    loadBtn.on('click', function() {
        console.log('Botão "Carregar Quizzes" clicado.');
        // Acessa as variáveis localizadas por wp_localize_script
        const supabaseUrl = quizNeniMasterAdmin.supabase_url;
        const apiKey = quizNeniMasterAdmin.api_key;
        const anonKey = quizNeniMasterAdmin.supabase_anon_key;
        
        console.log('URL do Supabase:', supabaseUrl);
        console.log('Chave Anon (últimos 4):', anonKey ? '...' + anonKey.slice(-4) : 'Nenhuma');
        console.log('Chave da API (últimos 4):', apiKey ? '...' + apiKey.slice(-4) : 'Nenhuma');

        if (!supabaseUrl || !apiKey || !anonKey) {
            statusEl.text('Erro: Por favor, preencha e salve a URL do Sistema, a Supabase Anon Key e a Chave da API nas configurações acima.').css('color', 'red');
            return;
        }

        // Constrói a URL do endpoint da Edge Function quiz-api com o parâmetro action=list_all
        const endpoint = supabaseUrl.replace(/\/$/, '') + '/functions/v1/quiz-api?action=list_all';
        console.log('Endpoint da requisição:', endpoint);

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
                console.error('Erro na requisição AJAX:', {
                    status: jqXHR.status,
                    statusText: jqXHR.statusText,
                    responseText: jqXHR.responseText,
                    errorThrown: jqXHR.responseJSON ? jqXHR.responseJSON.error : 'N/A'
                });
                let errorMsg = `Erro ao carregar quizzes: ${jqXHR.statusText} (${jqXHR.status}).`;
                if (jqXHR.responseJSON && jqXHR.responseJSON.error) {
                    errorMsg += ` Detalhe: ${jqXHR.responseJSON.error}`;
                } else if (jqXHR.responseText) {
                    try {
                        const errorJson = JSON.parse(jqXHR.responseText);
                        errorMsg += ` Resposta do servidor: ${errorJson.error || jqXHR.responseText}`;
                    } catch (e) {
                        errorMsg += ` Resposta do servidor: ${jqXHR.responseText}`;
                    }
                }
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