(function($) {
    'use strict';

    const get = (obj, path, defaultValue = undefined) => {
        const result = path.split('.').reduce((r, p) => r && r[p], obj);
        return (result === undefined || result === null) ? defaultValue : result;
    };

    class QuizRenderer {
        constructor(container, slug) {
            this.container = $(container);
            this.slug = slug;
            this.quizData = null;
            this.answers = {};
            this.formData = {};
            this.state = 'LOADING'; // LOADING, SESSION, AD, PROCESSING, RESULT, ERROR, FINAL_AD
            this.currentSessionIndex = 0;
            this.config = window.quizNeniMasterPublic || {}; // Use quizNeniMasterPublic from wp_localize_script
            this.redirectCountdown = 0;
            this.redirectTimer = null;
            this.adTimer = null;
            this.showSkipButton = false;
            this.locationInterval = null; // Para gerenciar o intervalo do contador
            this.counterInterval = null; // Para gerenciar o intervalo do contador
            this.footerElement = null; // Referência ao elemento do rodapé
            this.init();
        }

        async init() {
            console.log('QuizRenderer init for slug:', this.slug);
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
                console.log('Quiz data loaded:', this.quizData); // Log quiz data
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
            console.log('Applying styles with design:', design);
            
            // Set CSS variables globally on the html element
            $('html').css({
                '--primary-color': design.primaryColor || '#007bff',
                '--secondary-color': design.secondaryColor || '#e0e0e0', // Default secondary color
                '--background-color': design.backgroundColor || '#ffffff', // Default quiz card background
                '--text-color': design.textColor || '#333333', // Default quiz text color
                '--page-background-color': design.pageBackgroundColor || '#f8f8f8' // Default page background
            });
            console.log('HTML CSS variables set.');

            // Apply page background color to body
            $('body').css('background-color', get(design, 'pageBackgroundColor', '#f8f8f8'));
            
            // Apply quiz container specific styles using the variables
            this.container.css({
                'background-color': 'var(--background-color)',
                'color': 'var(--text-color)'
            });
            console.log('Container CSS variables set:', this.container[0].style.cssText);
            
            // Add animation class to the container
            this.container.addClass(`api-quiz-builder-animation-${design.animation || 'fade'}`);
            console.log('Container classes after animation:', this.container.attr('class'));
        }

        render() {
            console.log('Rendering state:', this.state);
            let content = '';
            switch (this.state) {
                case 'LOADING': content = this.renderLoadingState(get(this.quizData, 'settings.customTexts.processing', 'Carregando quiz...')); break;
                case 'SESSION': content = this.renderSessionState(); break;
                case 'AD': content = this.renderAdState(); break;
                case 'PROCESSING': content = this.renderLoadingState(get(this.quizData, 'settings.customTexts.processing', 'Processando suas informações...')); break;
                case 'RESULT': content = this.renderResultState(); break;
                case 'FINAL_AD': content = this.renderFinalAdState(); break; // Novo estado para o anúncio final
                case 'ERROR': content = '<p style="color: red; text-align: center; padding: 20px;">Erro ao carregar o quiz. Verifique o slug e as configurações do plugin.</p>'; break;
            }
            this.container.html(content);
            this.attachEventListeners();
            this.renderAndAttachFooter(); // Renderiza e anexa o rodapé separadamente, APÓS o conteúdo do quiz
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
            const design = get(this.quizData, 'design', {});
            const buttonClass = `api-quiz-builder-button api-quiz-builder-button-style-${design.buttonStyle || 'rounded'}`;

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
                    <button class="${buttonClass}" id="ad-continue" style="display:${this.showSkipButton ? 'block' : 'none'};">Continuar</button>
                </div>
            `;
        }

        renderFinalAdState() {
            const adMessage = get(this.quizData, 'settings.customTexts.adMessage', 'Publicidade');
            const isTestMode = get(this.quizData, 'settings.testAdEnabled', false);
            const finalAdCode = isTestMode ? '' : get(this.quizData, 'settings.finalAdCode', '');
            const design = get(this.quizData, 'design', {});
            const buttonClass = `api-quiz-builder-button api-quiz-builder-button-style-${design.buttonStyle || 'rounded'}`;

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
                    <button class="${buttonClass}" id="final-ad-continue" style="display:${this.showSkipButton ? 'block' : 'none'};">Continuar</button>
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

        // Novo método para renderizar e anexar o rodapé
        renderAndAttachFooter() {
            if (!this.quizData) return;

            const footerSettings = get(this.quizData, 'footer_settings', {});
            const showLocation = get(footerSettings, 'showLocation', true);
            const showCounter = get(footerSettings, 'showCounter', true);
            const companyName = get(footerSettings, 'companyName', 'Quiz NeniMaster');
            const privacyUrl = get(footerSettings, 'privacyUrl', '#');
            const termsUrl = get(footerSettings, 'termsUrl', '#');
            let footerText = get(footerSettings, 'footerText', `© {year} {companyName}`);

            footerText = footerText
                .replace('{companyName}', companyName)
                .replace('{year}', new Date().getFullYear().toString());

            let locationHtml = '';
            if (showLocation) {
                locationHtml = `
                    <div class="api-quiz-builder-footer-location">
                        <span>📍</span>
                        <span id="qnm-location-display">Detectando localização...</span>
                    </div>
                `;
            }

            let counterHtml = '';
            if (showCounter) {
                counterHtml = `
                    <div class="api-quiz-builder-footer-counter">
                        <span>👥</span>
                        <span id="qnm-people-count" class="text-green-600">0</span>
                        <span>pessoas em <span id="qnm-location-city-display"></span> respondendo neste momento</span>
                    </div>
                `;
            }

            const footerHtml = `
                <footer class="api-quiz-builder-footer">
                    <div class="api-quiz-builder-footer-content">
                        ${(showLocation || showCounter) ? `
                            <div class="api-quiz-builder-footer-stats">
                                ${locationHtml}
                                ${counterHtml}
                            </div>
                        ` : ''}
                        <div class="api-quiz-builder-footer-links">
                            Ao prosseguir você concorda com os nossos<br/>
                            <a href="${termsUrl}" target="_blank" rel="noopener noreferrer">Termos de Uso</a>
                            {' e '}
                            <a href="${privacyUrl}" target="_blank" rel="noopener noreferrer">Políticas de Privacidade</a>
                        </div>
                        <p class="api-quiz-builder-footer-text">
                            ${footerText}
                        </p>
                    </div>
                </footer>
            `;

            // Remove o rodapé antigo se existir
            if (this.footerElement) {
                this.footerElement.remove();
            }

            // Cria e anexa o novo rodapé ao body
            this.footerElement = $(footerHtml);
            $('body').append(this.footerElement);

            // Inicializa os scripts do rodapé após anexar o HTML
            this.initFooterScripts();
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
            } else if (this.state === 'FINAL_AD') {
                this.loadFinalAdContent();
                this.container.on('click', '#final-ad-continue', this.handleFinalAdContinue.bind(this));
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
            const settings = get(this.quizData, 'settings', {});

            if (session.showAd) {
                this.state = 'AD';
                this.showSkipButton = false; // Reset for new ad
            } else if (!isLastSession) {
                this.currentSessionIndex++;
                this.state = 'SESSION';
            } else if (settings.showFinalAd) {
                this.state = 'FINAL_AD';
                this.showSkipButton = false; // Reset for final ad
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

        handleAdContinue() {
            if (this.adTimer) clearTimeout(this.adTimer);
            this.moveToNextStep();
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
            
            if (redirect.enabled && redirect.url) {
                let countdown = redirect.delay || 5;
                const countdownEl = this.footerElement.find('#redirect-countdown'); // Buscar no footerElement
                const redirectBtn = this.footerElement.find('#redirect-btn'); // Buscar no footerElement

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

        initFooterScripts() {
            const footerSettings = get(this.quizData, 'footer_settings', {});
            const showLocation = get(footerSettings, 'showLocation', true);
            const showCounter = get(footerSettings, 'showCounter', true);
            const locationScript = get(footerSettings, 'locationScript', '');
            const counterScript = get(footerSettings, 'counterScript', '');

            // Limpa quaisquer intervalos anteriores para evitar duplicação
            if (this.locationInterval) clearInterval(this.locationInterval);
            if (this.counterInterval) clearInterval(this.counterInterval);
            
            // Remove scripts injetados anteriormente para evitar duplicação
            $('head').find('.qnm-injected-script').remove(); 

            const injectScript = (scriptContent, className) => {
                if (!scriptContent) return;
                try {
                    const tempContainer = document.createElement('div');
                    tempContainer.innerHTML = scriptContent;
                    Array.from(tempContainer.children).forEach(child => {
                        let elementToAppend;
                        if (child.tagName === 'SCRIPT') {
                            const newScript = document.createElement('script');
                            Array.from(child.attributes).forEach(attr => newScript.setAttribute(attr.name, attr.value));
                            newScript.text = child.textContent;
                            elementToAppend = newScript;
                        } else {
                            elementToAppend = child.cloneNode(true);
                        }
                        $(elementToAppend).addClass(className); // Adiciona classe para fácil remoção
                        document.head.appendChild(elementToAppend);
                    });
                } catch (error) {
                    console.error('Erro ao analisar ou executar script personalizado:', error);
                }
            };

            // Lógica de localização
            if (showLocation) {
                if (locationScript) {
                    injectScript(locationScript, 'qnm-location-script');
                } else {
                    // Lógica padrão de script de localização
                    const locationDisplayEl = this.footerElement.find('#qnm-location-display');
                    const locationCityDisplayEl = this.footerElement.find('#qnm-location-city-display');
                    const mostrarCidade = async () => {
                        try {
                            const response = await fetch("https://api-bdc.io/data/reverse-geocode-client");
                            const contentType = response.headers.get("content-type");
                            if (!response.ok || !contentType || !contentType.includes("application/json")) {
                                console.error("Erro ao obter a cidade: Resposta da API não foi OK ou não é JSON", response.status, contentType);
                                locationDisplayEl.text('Brasil');
                                locationCityDisplayEl.text('Brasil');
                                return;
                            }
                            const data = await response.json();
                            const cidade = data.city || 'Cidade';
                            const estado = data.principalSubdivision || 'Estado';
                            locationDisplayEl.text(`${cidade}, ${estado}`);
                            locationCityDisplayEl.text(cidade);
                        } catch (error) {
                            console.error("Erro ao obter a cidade:", error);
                            locationDisplayEl.text('Brasil');
                            locationCityDisplayEl.text('Brasil');
                        }
                    };
                    mostrarCidade();
                }
            }

            // Lógica do contador
            if (showCounter) {
                if (counterScript) {
                    injectScript(counterScript, 'qnm-counter-script');
                } else {
                    // Lógica padrão de script do contador
                    const peopleCountEl = this.footerElement.find('#qnm-people-count');
                    let peopleCount = Math.floor(Math.random() * (800 - 400 + 1)) + 400;
                    peopleCountEl.text(peopleCount);

                    const gerarNumeroAleatorio = () => {
                        return Math.floor(Math.random() * (800 - 400 + 1)) + 400;
                    };

                    const atualizarNumero = () => {
                        const novoNumero = gerarNumeroAleatorio();
                        const steps = 100; 
                        let currentStep = 0;
                        const startCount = peopleCount;
                        const diff = novoNumero - startCount;

                        if (this.counterInterval) clearInterval(this.counterInterval);

                        this.counterInterval = setInterval(() => {
                            currentStep++;
                            const newCount = Math.round(startCount + (diff / steps) * currentStep);
                            peopleCountEl.text(newCount);

                            if (currentStep >= steps) {
                                clearInterval(this.counterInterval);
                                peopleCount = novoNumero;
                                peopleCountEl.text(peopleCount);
                                setTimeout(atualizarNumero, Math.floor(Math.random() * (30000 - 15000 + 1)) + 15000);
                            }
                        }, 100);
                    };
                    setTimeout(atualizarNumero, 1000); // Atraso inicial
                }
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