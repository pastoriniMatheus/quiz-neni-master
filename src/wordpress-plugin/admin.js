document.addEventListener('DOMContentLoaded', function () {
    const loadBtn = document.getElementById('load-quizzes-btn');
    const container = document.getElementById('quiz-list-container');
    const statusEl = document.getElementById('quiz-list-status');

    if (!loadBtn) return;

    loadBtn.addEventListener('click', function () {
        console.log('Botão "Carregar Quizzes" clicado.');
        const apiUrl = quizNeniMaster.apiUrl;
        const apiKey = quizNeniMaster.apiKey;
        console.log('URL da API:', apiUrl);
        console.log('Chave da API:', apiKey ? '...' + apiKey.slice(-4) : 'Nenhuma');

        if (!apiUrl || !apiKey) {
            statusEl.textContent = 'Erro: Por favor, salve a URL do Sistema e a Chave da API primeiro.';
            statusEl.style.color = 'red';
            return;
        }

        statusEl.textContent = 'Carregando quizzes...';
        statusEl.style.color = '';
        loadBtn.disabled = true;

        const endpoint = apiUrl.replace(/\/$/, '') + '/functions/v1/quiz-api/quizzes';
        console.log('Endpoint da requisição:', endpoint);

        fetch(endpoint, {
            method: 'GET',
            headers: {
                'x-api-key': apiKey,
                'Content-Type': 'application/json'
            }
        })
        .then(response => {
            console.log('Resposta recebida:', response);
            if (!response.ok) {
                return response.text().then(text => {
                    let errorBody = text;
                    try {
                        const jsonError = JSON.parse(text);
                        errorBody = jsonError.error || text;
                    } catch (e) {
                        // Ignore if text is not JSON
                    }
                    throw new Error(`Falha na requisição: ${response.status} ${response.statusText} - ${errorBody}`);
                });
            }
            return response.json();
        })
        .then(quizzes => {
            console.log('Quizzes recebidos:', quizzes);
            container.innerHTML = ''; // Limpa o container
            if (quizzes && quizzes.length > 0) {
                quizzes.forEach(quiz => {
                    const shortcode = `[quiz_nenimaster slug="${quiz.slug}"]`;
                    const item = document.createElement('div');
                    item.className = 'quiz-list-item';
                    item.innerHTML = `
                        <div>
                            <div class="title">${quiz.title || 'Quiz sem título'}</div>
                            <code class="shortcode">${shortcode}</code>
                        </div>
                        <button class="button copy-btn" data-shortcode="${shortcode}">Copiar</button>
                    `;
                    container.appendChild(item);
                });
            } else {
                statusEl.textContent = 'Nenhum quiz publicado encontrado.';
                container.appendChild(statusEl);
            }
        })
        .catch(error => {
            console.error('Erro detalhado ao carregar quizzes:', error);
            statusEl.textContent = 'Erro ao carregar quizzes: ' + error.message;
            statusEl.style.color = 'red';
            container.innerHTML = '';
            container.appendChild(statusEl);
        })
        .finally(() => {
            loadBtn.disabled = false;
        });
    });

    container.addEventListener('click', function(e) {
        if (e.target.classList.contains('copy-btn')) {
            const shortcode = e.target.dataset.shortcode;
            navigator.clipboard.writeText(shortcode).then(() => {
                const originalText = e.target.textContent;
                e.target.textContent = 'Copiado!';
                setTimeout(() => {
                    e.target.textContent = originalText;
                }, 2000);
            });
        }
    });
});