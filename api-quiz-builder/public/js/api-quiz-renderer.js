(function($) {
    'use strict';

    const get = (obj, path, defaultValue = undefined) => {
        const result = path.split('.').reduce((r, p) => r && r[p], obj);
        return result === undefined ? defaultValue : result;
    };

    class QuizRenderer {
        constructor(container, slug) {
            this.container = $(container);
            this.slug = slug;
            this.quizData = null;
            this.answers = {};
            this.state = 'LOADING'; // LOADING, SESSION, AD, PROCESSING, RESULT, ERROR
            this.currentSessionIndex = 0;
            this.config = window.api_quiz_builder_public_vars || {};
            this.init();
        }

        async init() {
            this.render();
            try {
                const apiUrl = `${this.config.supabase_url}/functions/v1/quiz-api/${this.slug}`;
                
                const response = await $.ajax({
                    url: apiUrl,
                    method: 'GET',
                    headers: {
                        'x-api-key': this.config.api_key,
                        'Authorization': `Bearer ${this.config.supabase_anon_key}`
                    }
                });

                this.quizData = response;
                this.applyStyles();
                this.state = 'SESSION';
                this.render();
            } catch (error) {
                console.error('Falha ao carregar dados do quiz:', error);
                this.state = 'ERROR';
                this.render();
            }
        }

        applyStyles() {
            const design = get(this.quizData, 'design', {});
            this.container.css({
                '--primary-color': design.primaryColor || '#007bff',
                '--secondary-color': design.secondaryColor || '#6c757d',
                '--background-color': design.backgroundColor || '#ffffff',
                '--text-color': design.textColor || '#333333'
            });
            if (design.pageBackgroundColor) {
                $('body').css('background-color', design.pageBackgroundColor);
            }
        }

        render() {
            let content = '';
            switch (this.state) {
                case 'LOADING': content = this.renderLoadingState('Carregando quiz...'); break;
                case 'SESSION': content = this.renderSessionState(); break;
                case 'AD': content = this.renderAdState(); break;
                case 'PROCESSING': content = this.renderLoadingState(get(this.quizData, 'settings.customTexts.processing', 'Processando...')); break;
                case 'RESULT': content = this.renderResultState(); break;
                case 'ERROR': content = '<p style="color: red;">Erro ao carregar o quiz. Verifique o slug e as configurações do plugin.</p>'; break;
            }
            this.container.html(content);
            this.attachEventListeners();
        }

        renderSessionState() {
            const session = this.quizData.sessions[this.currentSessionIndex];
            const progress = ((this.currentSessionIndex + 1) / this.quizData.sessions.length) * 100;
            const design = get(this.quizData, 'design', {});
            const cardClass = `api-quiz-builder-card-style-${design.cardStyle || 'modern'}`;
            let sessionContent = session.type === 'question' ? this.renderQuestion(session) : this.renderForm(session);

            return `
                <h1 class="api-quiz-builder-quiz-title">${this.quizData.title}</h1>
                <p class="api-quiz-builder-quiz-description">${this.quizData.description}</p>
                <div class="api-quiz-builder-progress-bar"><div class="api-quiz-builder-progress-fill" style="width: ${progress}%;"></div></div>
                <div class="api-quiz-builder-session-content ${cardClass}">${sessionContent}</div>
            `;
        }

        renderQuestion(session) {
            const design = get(this.quizData, 'design', {});
            const buttonClass = `api-quiz-builder-option-button api-quiz-builder-button-style-${design.buttonStyle || 'rounded'}`;
            return `
                <h2 class="api-quiz-builder-question-title">${session.title}</h2>
                <div class="api-quiz-builder-options-grid">
                    ${session.options.map(opt => `<button class="${buttonClass}" data-option="${$('<div/>').text(opt).html()}">${$('<div/>').text(opt).html()}</button>`).join('')}
                </div>`;
        }

        renderForm(session) {
            const design = get(this.quizData, 'design', {});
            const buttonClass = `api-quiz-builder-button api-quiz-builder-button-style-${design.buttonStyle || 'rounded'}`;
            const fields = session.formFields || {};
            return `
                <h2 class="api-quiz-builder-question-title">${session.title}</h2>
                <div class="api-quiz-builder-form-fields">
                    ${fields.name ? '<div><label>Nome</label><input type="text" name="name" /></div>' : ''}
                    ${fields.email ? '<div><label>Email</label><input type="email" name="email" /></div>' : ''}
                    ${fields.phone ? '<div><label>Telefone</label><input type="tel" name="phone" /></div>' : ''}
                </div>
                <div class="api-quiz-builder-navigation-buttons"><button class="${buttonClass}" id="submit-form">Continuar</button></div>`;
        }

        renderAdState() {
            const adMessage = get(this.quizData, 'settings.customTexts.adMessage', 'Publicidade');
            return `
                <h2 class="api-quiz-builder-ad-message">${adMessage}</h2>
                <div class="api-quiz-builder-ad-container" id="ad-container"></div>
                <div class="api-quiz-builder-navigation-buttons"><button class="api-quiz-builder-button" id="ad-continue" style="display:none;">Continuar</button></div>`;
        }

        renderLoadingState(message) {
            return `<div class="api-quiz-builder-loading-screen"><div class="api-quiz-builder-loading-spinner"></div><h2>${message}</h2></div>`;
        }

        renderResultState() {
            const resultText = get(this.quizData, 'settings.customTexts.result', 'Obrigado!');
            const redirect = get(this.quizData, 'settings.redirect', {});
            return `
                <div class="api-quiz-builder-result-screen">
                    <div class="api-quiz-builder-result-icon">✅</div>
                    <h2 class="api-quiz-builder-result-title">${resultText}</h2>
                    ${redirect.enabled && redirect.url ? `<button class="api-quiz-builder-button" id="redirect-btn">Ver Recomendações</button><p id="redirect-countdown"></p>` : ''}
                </div>`;
        }

        attachEventListeners() {
            this.container.off();
            if (this.state === 'SESSION') {
                this.quizData.sessions[this.currentSessionIndex].type === 'question'
                    ? this.container.on('click', '.api-quiz-builder-option-button', this.handleQuestionAnswer.bind(this))
                    : this.container.on('click', '#submit-form', this.handleFormSubmit.bind(this));
            } else if (this.state === 'AD') {
                this.loadAd();
                this.container.on('click', '#ad-continue', this.handleAdContinue.bind(this));
            } else if (this.state === 'RESULT') {
                this.handleRedirect();
            }
        }

        handleQuestionAnswer(e) {
            const session = this.quizData.sessions[this.currentSessionIndex];
            this.answers[session.id] = $(e.target).data('option');
            setTimeout(() => this.moveToNextStep(), 300);
        }

        handleFormSubmit() {
            this.container.find('.api-quiz-builder-form-fields input').each((_, el) => {
                this.answers[$(el).attr('name')] = $(el).val();
            });
            this.moveToNextStep();
        }

        moveToNextStep() {
            const session = this.quizData.sessions[this.currentSessionIndex];
            const isLastSession = this.currentSessionIndex >= this.quizData.sessions.length - 1;

            if (session.showAd) {
                this.state = 'AD';
            } else if (!isLastSession) {
                this.currentSessionIndex++;
                this.state = 'SESSION';
            } else {
                this.completeQuiz();
                return;
            }
            this.render();
        }

        loadAd() {
            const session = this.quizData.sessions[this.currentSessionIndex];
            const adCode = get(session, 'adCode', '');
            const isTest = get(this.quizData, 'settings.testAdEnabled', false);
            const adContainer = this.container.find('#ad-container');

            if (isTest) {
                adContainer.html('<p>Modo de teste de anúncio. Clique em continuar.</p>');
            } else if (adCode) {
                adContainer.html(adCode);
                adContainer.find('script').each(function() {
                    const script = document.createElement('script');
                    script.text = $(this).text();
                    document.body.appendChild(script).parentNode.removeChild(script);
                });
            }
            setTimeout(() => this.container.find('#ad-continue').show(), 5000);
        }

        handleAdContinue() {
            const isLastSession = this.currentSessionIndex >= this.quizData.sessions.length - 1;
            if (!isLastSession) {
                this.currentSessionIndex++;
                this.state = 'SESSION';
                this.render();
            } else {
                this.completeQuiz();
            }
        }

        async completeQuiz() {
            this.state = 'PROCESSING';
            this.render();

            const submitUrl = `${this.config.supabase_url}/functions/v1/submit-quiz-response`;
            try {
                await $.ajax({
                    url: submitUrl,
                    method: 'POST',
                    contentType: 'application/json',
                    headers: { 'Authorization': `Bearer ${this.config.supabase_anon_key}` },
                    data: JSON.stringify({
                        quizId: this.quizData.id,
                        sessionId: 'session-' + Date.now(),
                        responseData: this.answers
                    })
                });
            } catch (e) { console.error("Falha ao enviar respostas.", e); }

            const processingTime = get(this.quizData, 'settings.processingTime', 3) * 1000;
            setTimeout(() => {
                this.state = 'RESULT';
                this.render();
            }, processingTime);
        }

        handleRedirect() {
            const redirect = get(this.quizData, 'settings.redirect', {});
            if (redirect.enabled && redirect.url) {
                let countdown = redirect.delay || 5;
                const countdownEl = this.container.find('#redirect-countdown');
                const updateCountdown = () => {
                    if (countdown <= 0) {
                        window.location.href = redirect.url;
                    } else {
                        countdownEl.text(`Redirecionando em ${countdown}...`);
                        countdown--;
                        setTimeout(updateCountdown, 1000);
                    }
                };
                updateCountdown();
                this.container.on('click', '#redirect-btn', () => { window.location.href = redirect.url; });
            }
        }
    }

    $(document).ready(function() {
        $('.api-quiz-builder-container').each(function() {
            const slug = $(this).data('quiz-slug');
            if (slug) new QuizRenderer(this, slug);
        });
    });

})(jQuery);