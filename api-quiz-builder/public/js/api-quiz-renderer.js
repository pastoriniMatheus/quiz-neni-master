(function($) {
    'use strict';

    // Corrigido: A função 'get' agora retorna o defaultValue se o resultado for null ou undefined.
    const get = (obj, path, defaultValue = undefined) => {
        const result = path.split('.').reduce((r, p) => r && r[p], obj);
        // Retorna defaultValue se o resultado for null OU undefined
        return (result === undefined || result === null) ? defaultValue : result;
    };

    class QuizRenderer {
        constructor(container, slug) {
            this.container = $(container);
            this.slug = slug;
            this.quizData = null;
            this.answers = {};
            this.formData = {}; // For form session data
            this.state = 'LOADING'; // LOADING, SESSION, AD, PROCESSING, RESULT, ERROR
            this.currentSessionIndex = 0;
            this.config = window.quizNeniMaster || {}; // Use quizNeniMaster from wp_localize_script
            this.redirectCountdown = 0;
            this.redirectTimer = null;
            this.adTimer = null;
            this.showSkipButton = false;
            this.init();
        }

        async init() {
            this.render(); // Renderiza o estado de carregamento inicial
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
            // Add animation class to the container
            this.container.addClass(`api-quiz-builder-animation-${design.animation || 'fade'}`);
        }

        render() {
            let content = '';
            switch (this.state) {
                case 'LOADING': content = this.renderLoadingState(get(this.quizData, 'settings.customTexts.processing', 'Carregando quiz...')); break;
                case 'SESSION': content = this.renderSessionState(); break;
                case 'AD': content = this.renderAdState(); break;
                case 'PROCESSING': content = this.renderLoadingState(get(this.quizData, 'settings.customTexts.processing', 'Processando suas informações...')); break;
                case 'RESULT': content = this.renderResultState(); break;
                case 'ERROR': content = '<p style="color: red; text-align: center; padding: 20px;">Erro ao carregar o quiz. Verifique o slug e as configurações do plugin.</p>'; break;
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
                <h1 class="api-quiz-builder-quiz-title">${this.quizData.title || 'Quiz'}</h1>
                <p class="api-quiz-builder-quiz-description">${this.quizData.description || ''}</p>
                <div class="api-quiz-builder-progress-bar"><div class="api-quiz-builder-progress-fill" style="width: ${progress}%;"></div></div>
                <div class="api-quiz-builder-session-content ${cardClass}">${sessionContent}</div>
            `;
        }

        renderQuestion(session) {
            const design = get(this.quizData, 'design', {});
            const buttonClass = `api-quiz-builder-option-button api-quiz-builder-button-style-${design.buttonStyle || 'rounded'}`;
            const selectedOption = this.answers[session.id];

            return `
                <h2 class="api-quiz-builder-question-title">${session.title}</h2>
                <div class="api-quiz-builder-options-grid">
                    ${session.options.map(opt => `
                        <button 
                            class="${buttonClass} ${selectedOption === opt ? 'selected' : ''}" 
                            data-option="${$('<div/>').text(opt).html()}"
                        >
                            ${$('<div/>').text(opt).html()}
                        </button>
                    `).join('')}
                </div>
            `;
        }

        renderForm(session) {
            const design = get(this.quizData, 'design', {});
            const buttonClass = `api-quiz-builder-button api-quiz-builder-button-style-${design.buttonStyle || 'rounded'}`;
            const fields = session.formFields || {};
            const currentFormData = this.formData;

            return `
                <h2 class="api-quiz-builder-question-title">${session.title}</h2>
                <div class="api-quiz-builder-form-fields">
                    ${fields.name ? `
                        <div>
                            <label>Nome ${session.required ? '*' : ''}</label>
                            <input type="text" name="name" value="${currentFormData.name || ''}" placeholder="Seu nome completo" />
                        </div>` : ''}
                    ${fields.email ? `
                        <div>
                            <label>Email ${session.required ? '*' : ''}</label>
                            <input type="email" name="email" value="${currentFormData.email || ''}" placeholder="seu@email.com" />
                        </div>` : ''}
                    ${fields.phone ? `
                        <div>
                            <label>Telefone/WhatsApp</label>
                            <input type="tel" name="phone" value="${currentFormData.phone || ''}" placeholder="(11) 99999-9999" />
                        </div>` : ''}
                    ${fields.message ? `
                        <div>
                            <label>Mensagem</label>
                            <textarea name="message" placeholder="Sua mensagem">${currentFormData.message || ''}</textarea>
                        </div>` : ''}
                </div>
                <div class="api-quiz-builder-navigation-buttons">
                    <button class="${buttonClass}" id="submit-form">Continuar</button>
                </div>
            `;
        }

        renderAdState() {
            const session = this.quizData.sessions[this.currentSessionIndex];
            const adMessage = get(this.quizData, 'settings.customTexts.adMessage', 'Publicidade');
            const isTestMode = get(this.quizData, 'settings.testAdEnabled', false);
            const adCode = isTestMode ? '' : get(session, 'adCode', ''); // Use session adCode for interstitial ads

            let adContent = '';
            if (isTestMode) {
                adContent = `
                    <div class="api-quiz-builder-ad-container test-mode">
                        <p>Modo de teste de anúncio. Clique em continuar.</p>
                        <p>Aguarde <span id="ad-countdown">5</span> segundos...</p>
                    </div>
                `;
            } else if (adCode) {
                adContent = `<div class="api-quiz-builder-ad-container" id="ad-code-container">${adCode}</div>`;
            } else {
                adContent = `
                    <div class="api-quiz-builder-ad-container">
                        <p>Nenhum código de anúncio configurado para esta sessão.</p>
                    </div>
                `;
            }

            return `
                <h2 class="api-quiz-builder-ad-message">${adMessage}</h2>
                ${adContent}
                <div class="api-quiz-builder-navigation-buttons">
                    <button class="api-quiz-builder-button" id="ad-continue" style="display:${this.showSkipButton ? 'block' : 'none'};">Continuar</button>
                </div>
            `;
        }

        renderLoadingState(message) {
            const design = get(this.quizData, 'design', {});
            return `
                <div class="api-quiz-builder-loading-screen">
                    <div class="api-quiz-builder-loading-spinner" style="border-top-color: ${design.primaryColor || '#007bff'};"></div>
                    <h2 class="api-quiz-builder-loading-title">${message}</h2>
                    <p class="api-quiz-builder-loading-description">Aguarde um momento enquanto preparamos seu resultado personalizado</p>
                    <div class="api-quiz-builder-progress-bar" style="background-color: ${design.secondaryColor || '#e0e0e0'};">
                        <div class="api-quiz-builder-progress-fill" style="width: 100%; background-color: ${design.primaryColor || '#007bff'}; animation: pulse-progress 1.5s infinite;"></div>
                    </div>
                    <p class="api-quiz-builder-loading-subtext">Analisando suas respostas...</p>
                </div>
            `;
        }

        renderResultState() {
            const resultText = get(this.quizData, 'settings.customTexts.result', 'Obrigado!');
            const redirect = get(this.quizData, 'settings.redirect', {});
            const design = get(this.quizData, 'design', {});
            const buttonClass = `api-quiz-builder-button api-quiz-builder-button-style-${design.buttonStyle || 'rounded'}`;

            return `
                <div class="api-quiz-builder-result-screen">
                    <div class="api-quiz-builder-result-icon" style="color: ${design.primaryColor || 'green'};">✅</div>
                    <h2 class="api-quiz-builder-result-title">${resultText}</h2>
                    <p class="api-quiz-builder-result-description">Com base no seu perfil, selecionamos as melhores opções</p>
                    ${redirect.enabled && redirect.url ? `
                        <button class="${buttonClass}" id="redirect-btn">Ver Recomendações</button>
                        <p id="redirect-countdown" class="api-quiz-builder-redirect-countdown"></p>
                    ` : `
                        <button class="${buttonClass}" id="restart-quiz-btn">Refazer Quiz</button>
                    `}
                </div>
            `;
        }

        attachEventListeners() {
            this.container.off(); // Remove all previous event listeners

            if (this.state === 'SESSION') {
                const session = this.quizData.sessions[this.currentSessionIndex];
                if (session.type === 'question') {
                    this.container.on('click', '.api-quiz-builder-option-button', this.handleQuestionAnswer.bind(this));
                } else if (session.type === 'form') {
                    this.container.on('input', '.api-quiz-builder-form-fields input, .api-quiz-builder-form-fields textarea', this.handleFormInputChange.bind(this));
                    this.container.on('click', '#submit-form', this.handleFormSubmit.bind(this));
                }
            } else if (this.state === 'AD') {
                this.loadAdContent();
                this.container.on('click', '#ad-continue', this.handleAdContinue.bind(this));
            } else if (this.state === 'RESULT') {
                this.handleResultActions();
            }
        }

        handleQuestionAnswer(e) {
            const session = this.quizData.sessions[this.currentSessionIndex];
            const selectedOption = $(e.target).data('option');
            this.answers[session.id] = selectedOption;

            // Update UI to show selected option
            this.container.find('.api-quiz-builder-option-button').removeClass('selected');
            $(e.target).addClass('selected');
            
            setTimeout(() => this.moveToNextStep(), 300);
        }

        handleFormInputChange(e) {
            const inputName = $(e.target).attr('name');
            this.formData[inputName] = $(e.target).val();
        }

        handleFormSubmit() {
            const session = this.quizData.sessions[this.currentSessionIndex];
            const formFields = session.formFields || {};
            let missingFields = [];

            if (session.required) {
                if (formFields.name && !this.formData.name?.trim()) missingFields.push('Nome');
                if (formFields.email && !this.formData.email?.trim()) missingFields.push('E-mail');
                // Add other required fields if necessary
            }

            if (missingFields.length > 0) {
                alert(`Por favor, preencha os campos obrigatórios: ${missingFields.join(', ')}`);
                return;
            }
            this.moveToNextStep();
        }

        moveToNextStep() {
            const session = this.quizData.sessions[this.currentSessionIndex];
            const isLastSession = this.currentSessionIndex >= this.quizData.sessions.length - 1;

            if (session.showAd) {
                this.state = 'AD';
                this.showSkipButton = false; // Reset for new ad
            } else if (!isLastSession) {
                this.currentSessionIndex++;
                this.state = 'SESSION';
            } else {
                this.completeQuiz();
                return;
            }
            this.render();
        }

        loadAdContent() {
            const session = this.quizData.sessions[this.currentSessionIndex];
            const adCode = get(session, 'adCode', '');
            const isTestMode = get(this.quizData, 'settings.testAdEnabled', false);
            const adContainer = this.container.find('#ad-code-container');
            const adContinueButton = this.container.find('#ad-continue');
            const adCountdownEl = this.container.find('#ad-countdown');

            // Clear any previous timers
            if (this.adTimer) clearTimeout(this.adTimer);
            this.showSkipButton = false;
            adContinueButton.hide();

            if (isTestMode) {
                let countdown = 5;
                adCountdownEl.text(countdown);
                const testTimer = setInterval(() => {
                    countdown--;
                    adCountdownEl.text(countdown);
                    if (countdown <= 0) {
                        clearInterval(testTimer);
                        this.showSkipButton = true;
                        adContinueButton.show();
                    }
                }, 1000);
                this.adTimer = testTimer;
            } else if (adCode && adContainer.length) {
                adContainer.html(adCode);
                // Re-execute scripts within the ad code
                adContainer.find('script').each(function() {
                    const oldScript = this;
                    const newScript = document.createElement('script');
                    Array.from(oldScript.attributes).forEach(attr => newScript.setAttribute(attr.name, attr.value));
                    newScript.text = oldScript.text || '';
                    oldScript.parentNode.replaceChild(newScript, oldScript);
                });
                this.adTimer = setTimeout(() => {
                    this.showSkipButton = true;
                    adContinueButton.show();
                }, 5000); // Show skip button after 5 seconds for real ads
            } else {
                // No ad code, just show continue button after a short delay
                this.adTimer = setTimeout(() => {
                    this.showSkipButton = true;
                    adContinueButton.show();
                }, 2000);
            }
        }

        handleAdContinue() {
            if (this.adTimer) clearTimeout(this.adTimer);
            const isLastSession = this.currentSessionIndex >= this.quizData.sessions.length - 1;
            const settings = get(this.quizData, 'settings', {});

            if (!isLastSession) {
                this.currentSessionIndex++;
                this.state = 'SESSION';
                this.render();
            } else if (settings.showFinalAd) {
                // If it's the last session and there's a final ad, show it
                this.state = 'FINAL_AD'; // New state for final ad
                this.render();
            } else {
                this.completeQuiz();
            }
        }

        async completeQuiz() {
            this.state = 'PROCESSING';
            this.render();

            const allResponses = { ...this.answers, ...this.formData };
            const sessionId = 'wp-session-' + Date.now();
            const userAgent = navigator.userAgent;

            const submitUrl = `${this.config.supabase_url}/functions/v1/submit-quiz-response`;
            try {
                await $.ajax({
                    url: submitUrl,
                    method: 'POST',
                    contentType: 'application/json',
                    headers: { 'Authorization': `Bearer ${this.config.supabase_anon_key}` },
                    data: JSON.stringify({
                        quizId: this.quizData.id,
                        sessionId: sessionId,
                        userAgent: userAgent,
                        responseData: allResponses
                    })
                });
            } catch (e) { 
                console.error("Falha ao enviar respostas.", e); 
                // Optionally, show an error message to the user
            }

            const processingTime = get(this.quizData, 'settings.processingTime', 3) * 1000;
            setTimeout(() => {
                this.state = 'RESULT';
                this.render();
            }, processingTime);
        }

        handleResultActions() {
            const redirect = get(this.quizData, 'settings.redirect', {});
            const finalAdCode = get(this.quizData, 'settings.finalAdCode', '');
            const showFinalAd = get(this.quizData, 'settings.showFinalAd', false);
            const isTestMode = get(this.quizData, 'settings.testAdEnabled', false);

            if (showFinalAd) {
                // Render final ad
                this.state = 'FINAL_AD';
                this.render();
                // The FINAL_AD state will handle its own continuation to redirect or restart
                return;
            }

            if (redirect.enabled && redirect.url) {
                let countdown = redirect.delay || 5;
                const countdownEl = this.container.find('#redirect-countdown');
                const redirectBtn = this.container.find('#redirect-btn');

                if (this.redirectTimer) clearInterval(this.redirectTimer);

                const updateCountdown = () => {
                    if (countdown <= 0) {
                        clearInterval(this.redirectTimer);
                        window.open(redirect.url, '_blank'); // Open in new tab
                    } else {
                        countdownEl.text(`Redirecionando em ${countdown} segundos...`);
                        countdown--;
                        this.redirectTimer = setTimeout(updateCountdown, 1000);
                    }
                };
                updateCountdown();
                redirectBtn.on('click', () => { 
                    if (this.redirectTimer) clearInterval(this.redirectTimer);
                    window.open(redirect.url, '_blank'); 
                });
            } else {
                this.container.on('click', '#restart-quiz-btn', () => {
                    window.location.reload(); // Reload page to restart quiz
                });
            }
        }
    }

    // Extend QuizRenderer for FINAL_AD state
    class FullQuizRenderer extends QuizRenderer {
        render() {
            if (this.state === 'FINAL_AD') {
                this.container.html(this.renderFinalAdState());
                this.attachEventListeners();
            } else {
                super.render();
            }
        }

        renderFinalAdState() {
            const adMessage = get(this.quizData, 'settings.customTexts.adMessage', 'Publicidade');
            const isTestMode = get(this.quizData, 'settings.testAdEnabled', false);
            const finalAdCode = get(this.quizData, 'settings.finalAdCode', '');

            let adContent = '';
            if (isTestMode) {
                adContent = `
                    <div class="api-quiz-builder-ad-container test-mode">
                        <p>Modo de teste de anúncio final. Clique em continuar.</p>
                        <p>Aguarde <span id="final-ad-countdown">5</span> segundos...</p>
                    </div>
                `;
            } else if (finalAdCode) {
                adContent = `<div class="api-quiz-builder-ad-container" id="final-ad-code-container">${finalAdCode}</div>`;
            } else {
                adContent = `
                    <div class="api-quiz-builder-ad-container">
                        <p>Nenhum código de anúncio final configurado.</p>
                    </div>
                `;
            }

            return `
                <h2 class="api-quiz-builder-ad-message">${adMessage}</h2>
                ${adContent}
                <div class="api-quiz-builder-navigation-buttons">
                    <button class="api-quiz-builder-button" id="final-ad-continue" style="display:${this.showSkipButton ? 'block' : 'none'};">Continuar</button>
                </div>
            `;
        }

        attachEventListeners() {
            super.attachEventListeners(); // Call parent's event listeners first

            if (this.state === 'FINAL_AD') {
                this.loadFinalAdContent();
                this.container.on('click', '#final-ad-continue', this.handleFinalAdContinue.bind(this));
            }
        }

        loadFinalAdContent() {
            const isTestMode = get(this.quizData, 'settings.testAdEnabled', false);
            const finalAdCode = get(this.quizData, 'settings.finalAdCode', '');
            const adContainer = this.container.find('#final-ad-code-container');
            const adContinueButton = this.container.find('#final-ad-continue');
            const adCountdownEl = this.container.find('#final-ad-countdown');

            if (this.adTimer) clearTimeout(this.adTimer);
            this.showSkipButton = false;
            adContinueButton.hide();

            if (isTestMode) {
                let countdown = 5;
                adCountdownEl.text(countdown);
                const testTimer = setInterval(() => {
                    countdown--;
                    adCountdownEl.text(countdown);
                    if (countdown <= 0) {
                        clearInterval(testTimer);
                        this.showSkipButton = true;
                        adContinueButton.show();
                    }
                }, 1000);
                this.adTimer = testTimer;
            } else if (finalAdCode && adContainer.length) {
                adContainer.html(finalAdCode);
                adContainer.find('script').each(function() {
                    const oldScript = this;
                    const newScript = document.createElement('script');
                    Array.from(oldScript.attributes).forEach(attr => newScript.setAttribute(attr.name, attr.value));
                    newScript.text = oldScript.text || '';
                    oldScript.parentNode.replaceChild(newScript, oldScript);
                });
                this.adTimer = setTimeout(() => {
                    this.showSkipButton = true;
                    adContinueButton.show();
                }, 5000);
            } else {
                this.adTimer = setTimeout(() => {
                    this.showSkipButton = true;
                    adContinueButton.show();
                }, 2000);
            }
        }

        handleFinalAdContinue() {
            if (this.adTimer) clearTimeout(this.adTimer);
            this.state = 'RESULT';
            this.render();
        }
    }


    $(document).ready(function() {
        $('.api-quiz-builder-container').each(function() {
            const slug = $(this).data('quiz-slug');
            if (slug) new FullQuizRenderer(this, slug);
        });
    });

})(jQuery);