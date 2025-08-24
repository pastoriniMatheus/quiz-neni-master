document.addEventListener('DOMContentLoaded', function () {
    const loadBtn = document.getElementById('load-quizzes-btn');
    const container = document.getElementById('quiz-list-container');
    const statusEl = document.getElementById('quiz-list-status');

    if (!loadBtn) return;

    loadBtn.addEventListener('click', function () {
        const apiUrl = quizNeniMaster.apiUrl;
        const apiKey = quizNeniMaster.apiKey;

        if (!apiUrl || !apiKey) {
            statusEl.textContent = 'Erro: Por favor, salve a URL do Sistema e a Chave da API primeiro.';
            statusEl.style.color = 'red';
            return;
        }

        statusEl.textContent = 'Carregando quizzes...';
        statusEl.style.color = '';
        loadBtn.disabled = true;

        const endpoint = apiUrl.replace(/\/$/, '') + '/functions/v1/quiz-api/quizzes';

        fetch(endpoint, {
            method: 'GET',
            headers: {
                'x-api-key': apiKey,
                'Content-Type': 'application/json'
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Falha na requisição: ' + response.statusText);
            }
            return response.json();
        })
        .then(quizzes => {
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