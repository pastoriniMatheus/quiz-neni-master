(function($) {
    'use strict';

    const API_QUIZ_BUILDER_PUBLIC_VARS = window.api_quiz_builder_public_vars || {};
    const REST_API_URL = API_QUIZ_BUILDER_PUBLIC_VARS.rest_url;

    if (!REST_API_URL) {
        console.error('API Quiz Builder: REST API URL not defined.');
        return;
    }

    class QuizRenderer {
        constructor(containerElement, quizSlug) {
            this.container = containerElement;
            this.quizSlug = quizSlug;
            this.quizData = null;
            this.currentSessionIndex = 0;
            this.answers = {};
            this.formData = {};
            this.state = {
                isLoading: true,
                showAd: false,
                showFinalAd: false,
                showResult: false,
                redirectCountdown: 0,
            };

            this.init();
        }

        async init() {
            this.container.innerHTML = '<p class="loading-message">Carregando quiz...</p>';
            await this.fetchQuizData();
            if (this.quizData) {
                this.applyCustomStyles();
                this.render();
            } else {
                this.container.innerHTML = '<p style="color: red;">Não foi possível carregar o quiz.</p>';
            }
        }

        async fetchQuizData() {
            try {
                const response = await fetch(`${REST_API_URL}/${this.quizSlug}`);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                this.quizData = await response.json();
                this.state.isLoading = false;
                console.log('Quiz data loaded:', this.quizData);
            } catch (error) {
                console.error('Error fetching quiz data:', error);
                this.quizData = null;
                this.state.isLoading = false;
            }
        }

        applyCustomStyles() {
            if (this.quizData && this.quizData.design) {
                const design = this.quizData.design;
                this.container.style.setProperty('--primary-color', design.primaryColor || '#007bff');
                this.container.style.setProperty('--secondary-color', design.secondaryColor || '#6c757d');
                this.container.style.setProperty('--background-color', design.backgroundColor || '#ffffff');
                this.container.style.setProperty('--text-color', design.textColor || '#333333');
                
                // Apply page background color to body if specified
                if (design.pageBackgroundColor) {
                    document.body.style.backgroundColor = design.pageBackgroundColor;
                }
            }
        }

        render() {
            if (this.state.isLoading) {
                this.container.innerHTML = this.renderLoadingScreen();
                return;
            }

            if (this.state.showAd) {
                this.container.innerHTML = this.renderAdManager(this.quizData.sessions[this.currentSessionIndex]);
                this.attachAdEventListeners();
                return;
            }

            if (this.state.showFinalAd) {
                this.container.innerHTML = this.renderAdManager(null, true); // Pass null for session, true for final ad
                this.attachAdEventListeners();
                return;
            }

            if (this.state.showResult) {
                this.container.innerHTML = this.renderResultScreen();
                this.attachResultEventListeners();
                return;
            }

            const currentSession = this.quizData.sessions[this.currentSessionIndex];
            if (!currentSession) {
                this.container.innerHTML = '<p style="color: red;">Erro: Nenhuma sessão encontrada ou índice inválido.</p>';
                return;
            }

            let contentHtml = `
                <h1 class="api-quiz-builder-quiz-title">${this.quizData.title || 'Quiz'}</h1>
                <p class="api-quiz-builder-quiz-description">${this.quizData.description || ''}</p>
            `;

            if (this.quizData.sessions.length > 0) {
                contentHtml += this.renderProgressBar();
            }

            contentHtml += `<div class="api-quiz-builder-session-content">`;

            if (currentSession.type === 'question') {
                contentHtml += this.renderQuestion(currentSession);
            } else if (currentSession.type === 'form') {
                contentHtml += this.renderForm(currentSession);
            }

            contentHtml += `</div>`; // Close api-quiz-builder-session-content

            this.container.innerHTML = contentHtml;
            this.attachEventListeners();
            this.renderFooter();
        }

        renderProgressBar() {
            const progress = ((this.currentSessionIndex + 1) / this.quizData.sessions.length) * 100;
            return `
                <div class="api-quiz-builder-progress-bar">
                    <div class="api-quiz-builder-progress-fill" style="width: ${progress}%;"></div>
                </div>
            `;
        }

        renderQuestion(session) {
            const selectedOption = this.answers[session.id];
            return `
                <h2 class="api-quiz-builder-question-title">${session.title}</h2>
                <div class="api-quiz-builder-options-grid">
                    ${session.options.map((option, index) => `
                        <button class="api-quiz-builder-option-button ${selectedOption === option ? 'selected' : ''}" data-option="${option}">
                            ${option}
                        </button>
                    `).join('')}
                </div>
            `;
        }

        renderForm(session) {
            const formFields = session.formFields || {};
            return `
                <h2 class="api-quiz-builder-question-title">${session.title}</h2>
                <div class="api-quiz-builder-form-fields">
                    ${formFields.name ? `
                        <div>
                            <label for="form-name-${this.quizSlug}">Nome Completo ${session.required ? '*' : ''}</label>
                            <input type="text" id="form-name-${this.quizSlug}" value="${this.formData.name || ''}" placeholder="Seu nome completo" />
                        </div>
                    ` : ''}
                    ${formFields.email ? `
                        <div>
                            <label for="form-email-${this.quizSlug}">E-mail ${session.required ? '*' : ''}</label>
                            <input type="email" id="form-email-${this.quizSlug}" value="${this.formData.email || ''}" placeholder="seu@email.com" />
                        </div>
                    ` : ''}
                    ${formFields.phone ? `
                        <div>
                            <label for="form-phone-${this.quizSlug}">Telefone/WhatsApp</label>
                            <input type="tel" id="form-phone-${this.quizSlug}" value="${this.formData.phone || ''}" placeholder="(11) 99999-9999" />
                        </div>
                    ` : ''}
                    ${formFields.message ? `
                        <div>
                            <label for="form-message-${this.quizSlug}">Mensagem</label>
                            <textarea id="form-message-${this.quizSlug}" placeholder="Sua mensagem">${this.formData.message || ''}</textarea>
                        </div>
                    ` : ''}
                </div>
                <div class="api-quiz-builder-navigation-buttons">
                    <button class="api-quiz-builder-button" id="api-quiz-next-button">Continuar</button>
                </div>
            `;
        }

        renderAdManager(session = null, isFinalAd = false) {
            const adCode = isFinalAd ? this.quizData.settings.finalAdCode : session?.adCode;
            const isTestMode = this.quizData.settings.testAdEnabled;
            const adMessage = this.quizData.settings.customTexts.adMessage || 'Veja um anúncio para continuar';

            let adContent = '';
            if (isTestMode) {
                adContent = `
                    <div class="api-quiz-builder-ad-container test-mode">
                        <p>Anúncio de Teste: ${adMessage}</p>
                        <p>Aguarde <span id="ad-countdown">5</span> segundos...</p>
                    </div>
                `;
            } else if (adCode) {
                adContent = `
                    <div class="api-quiz-builder-ad-container">
                        ${adCode}
                    </div>
                `;
            } else {
                adContent = `
                    <div class="api-quiz-builder-ad-container">
                        <p>Nenhum código de anúncio configurado.</p>
                    </div>
                `;
            }

            return `
                <div class="api-quiz-builder-ad-screen">
                    <h2 class="api-quiz-builder-ad-message">${adMessage}</h2>
                    ${adContent}
                    <div class="api-quiz-builder-navigation-buttons">
                        <button class="api-quiz-builder-button" id="api-quiz-ad-continue-button" style="display: none;">Continuar</button>
                    </div>
                </div>
            `;
        }

        renderLoadingScreen() {
            const processingText = this.quizData?.settings?.customTexts?.processing || 'Processando suas informações...';
            return `
                <div class="api-quiz-builder-loading-screen">
                    <div class="api-quiz-builder-loading-spinner"></div>
                    <h2 class="api-quiz-builder-result-title">${processingText}</h2>
                    <p class="api-quiz-builder-result-description">Aguarde enquanto analisamos suas respostas.</p>
                </div>
            `;
        }

        renderResultScreen() {
            const resultText = this.quizData.settings.customTexts.result || 'Resultado calculado!';
            const redirectEnabled = this.quizData.settings.redirect.enabled && this.quizData.settings.redirect.url;
            const redirectUrl = this.quizData.settings.redirect.url;

            let redirectMessage = '';
            if (redirectEnabled && this.state.redirectCountdown > 0) {
                redirectMessage = `<p class="api-quiz-builder-redirect-countdown">Redirecionando automaticamente em ${this.state.redirectCountdown} segundos...</p>`;
            }

            return `
                <div class="api-quiz-builder-result-screen">
                    <div class="api-quiz-builder-result-icon">✅</div>
                    <h2 class="api-quiz-builder-result-title">${resultText}</h2>
                    <p class="api-quiz-builder-result-description">Com base no seu perfil, selecionamos as melhores opções.</p>
                    <div class="api-quiz-builder-navigation-buttons">
                        ${redirectEnabled ? `
                            <button class="api-quiz-builder-button" id="api-quiz-redirect-button">Ver Recomendações</button>
                        ` : `
                            <button class="api-quiz-builder-button" id="api-quiz-restart-button">Refazer Quiz</button>
                        `}
                    </div>
                    ${redirectMessage}
                </div>
            `;
        }

        renderFooter() {
            const footerSettings = this.quizData.footer_settings || {
                showLocation: true,
                showCounter: true,
                companyName: 'Quiz NeniMaster',
                privacyUrl: '#',
                termsUrl: '#',
                footerText: '© {year} {companyName}'
            };

            const processedFooterText = (footerSettings.footerText || '© {year} {companyName}')
                .replace('{companyName}', footerSettings.companyName || 'Quiz NeniMaster')
                .replace('{year}', new Date().getFullYear().toString());

            const footerHtml = `
                <footer class="api-quiz-builder-footer">
                    <div class="api-quiz-builder-footer-content">
                        ${(footerSettings.showLocation || footerSettings.showCounter) ? `
                            <div class="api-quiz-builder-footer-info">
                                ${footerSettings.showLocation ? `
                                    <div class="api-quiz-builder-footer-location">
                                        <span class="icon">📍</span>
                                        <span id="api-quiz-location">Detectando localização...</span>
                                    </div>
                                ` : ''}
                                ${footerSettings.showCounter ? `
                                    <div class="api-quiz-builder-footer-counter">
                                        <span class="icon">👥</span>
                                        <span class="text-green-600" id="api-quiz-people-count">400</span>
                                        <span>pessoas em <span id="api-quiz-location-short"></span> respondendo neste momento</span>
                                    </div>
                                ` : ''}
                            </div>
                        ` : ''}
                        <p class="api-quiz-builder-footer-links">
                            Ao prosseguir você concorda com os nossos<br/>
                            <a href="${footerSettings.termsUrl || '#'}" target="_blank" rel="noopener noreferrer">Termos de Uso</a>
                            {' e '}
                            <a href="${footerSettings.privacyUrl || '#'}" target="_blank" rel="noopener noreferrer">Políticas de Privacidade</a>
                        </p>
                        <p class="api-quiz-builder-footer-text">
                            ${processedFooterText}
                        </p>
                    </div>
                </footer>
            `;
            // Append footer to the body or a specific container outside the quiz container if needed
            // For now, let's append it right after the quiz container for simplicity
            const existingFooter = document.querySelector('.api-quiz-builder-footer');
            if (existingFooter) {
                existingFooter.remove();
            }
            this.container.insertAdjacentHTML('afterend', footerHtml);
            this.initFooterScripts(footerSettings);
        }

        initFooterScripts(footerSettings) {
            const locationEl = document.getElementById('api-quiz-location');
            const locationShortEl = document.getElementById('api-quiz-location-short');
            const peopleCountEl = document.getElementById('api-quiz-people-count');

            if (footerSettings.showLocation && locationEl) {
                if (footerSettings.locationScript) {
                    this.injectCustomScript(footerSettings.locationScript, locationEl);
                } else {
                    this.fetchLocation(locationEl, locationShortEl);
                }
            }

            if (footerSettings.showCounter && peopleCountEl) {
                if (footerSettings.counterScript) {
                    this.injectCustomScript(footerSettings.counterScript, peopleCountEl);
                } else {
                    this.startPeopleCounter(peopleCountEl, locationShortEl);
                }
            }
        }

        injectCustomScript(scriptContent, targetElement) {
            try {
                const tempContainer = document.createElement('div');
                tempContainer.innerHTML = scriptContent;

                Array.from(tempContainer.children).forEach(child => {
                    let elementToAppend;
                    if (child.tagName === 'SCRIPT') {
                        const newScript = document.createElement('script');
                        Array.from(child.attributes).forEach(attr => newScript.setAttribute(attr.name, attr.value));
                        newScript.textContent = child.textContent;
                        elementToAppend = newScript;
                    } else {
                        elementToAppend = child.cloneNode(true);
                    }
                    // Append to target element or head/body based on script needs
                    // For simplicity, let's append to the target element's parent or body
                    document.body.appendChild(elementToAppend); // Or targetElement.parentNode.appendChild(elementToAppend);
                });
            } catch (error) {
                console.error('Error injecting custom script:', error);
            }
        }

        async fetchLocation(locationEl, locationShortEl) {
            try {
                const response = await fetch("https://api-bdc.io/data/reverse-geocode-client");
                const contentType = response.headers.get("content-type");
                if (!response.ok || !contentType || !contentType.includes("application/json")) {
                    console.error("Error getting city: API response not OK or not JSON", response.status, contentType);
                    locationEl.textContent = 'Brasil';
                    if (locationShortEl) locationShortEl.textContent = 'Brasil';
                    return;
                }
                const data = await response.json();
                const city = data.city || 'Cidade';
                const state = data.principalSubdivision || 'Estado';
                locationEl.textContent = `${city}, ${state}`;
                if (locationShortEl) locationShortEl.textContent = city;
            } catch (error) {
                console.error("Error getting city:", error);
                locationEl.textContent = 'Brasil';
                if (locationShortEl) locationShortEl.textContent = 'Brasil';
            }
        }

        startPeopleCounter(peopleCountEl, locationShortEl) {
            let currentCount = Math.floor(Math.random() * (800 - 400 + 1)) + 400;
            peopleCountEl.textContent = currentCount;

            const updateNumber = () => {
                const newNumber = Math.floor(Math.random() * (800 - 400 + 1)) + 400;
                const steps = 100;
                let step = (newNumber - currentCount) / steps;
                let i = 0;

                const interval = setInterval(() => {
                    currentCount += step;
                    peopleCountEl.textContent = Math.round(currentCount);
                    i++;
                    if (i >= steps) {
                        clearInterval(interval);
                        currentCount = newNumber;
                        peopleCountEl.textContent = currentCount;
                        setTimeout(updateNumber, Math.floor(Math.random() * (30000 - 15000 + 1)) + 15000);
                    }
                }, 100);
            };
            setTimeout(updateNumber, Math.floor(Math.random() * (30000 - 15000 + 1)) + 15000);
        }

        attachEventListeners() {
            const currentSession = this.quizData.sessions[this.currentSessionIndex];
            if (currentSession.type === 'question') {
                this.container.querySelectorAll('.api-quiz-builder-option-button').forEach(button => {
                    button.onclick = (e) => this.handleAnswerSelect(e.target.dataset.option);
                });
            } else if (currentSession.type === 'form') {
                const nameInput = this.container.querySelector(`#form-name-${this.quizSlug}`);
                const emailInput = this.container.querySelector(`#form-email-${this.quizSlug}`);
                const phoneInput = this.container.querySelector(`#form-phone-${this.quizSlug}`);
                const messageInput = this.container.querySelector(`#form-message-${this.quizSlug}`);

                if (nameInput) nameInput.oninput = (e) => this.formData.name = e.target.value;
                if (emailInput) emailInput.oninput = (e) => this.formData.email = e.target.value;
                if (phoneInput) phoneInput.oninput = (e) => this.formData.phone = e.target.value;
                if (messageInput) messageInput.oninput = (e) => this.formData.message = e.target.value;

                const nextButton = this.container.querySelector('#api-quiz-next-button');
                if (nextButton) nextButton.onclick = () => this.handleNext();
            }
        }

        attachAdEventListeners() {
            const adContinueButton = this.container.querySelector('#api-quiz-ad-continue-button');
            if (adContinueButton) {
                if (this.quizData.settings.testAdEnabled) {
                    let countdown = 5;
                    const countdownEl = this.container.querySelector('#ad-countdown');
                    const timer = setInterval(() => {
                        countdown--;
                        if (countdownEl) countdownEl.textContent = countdown;
                        if (countdown <= 0) {
                            clearInterval(timer);
                            adContinueButton.style.display = 'block';
                        }
                    }, 1000);
                } else {
                    // For real ads, show button after a fixed delay (e.g., 5 seconds)
                    setTimeout(() => {
                        adContinueButton.style.display = 'block';
                    }, 5000);
                }
                adContinueButton.onclick = () => this.handleAdComplete();
            }
        }

        attachResultEventListeners() {
            const redirectButton = this.container.querySelector('#api-quiz-redirect-button');
            if (redirectButton) {
                redirectButton.onclick = () => window.open(this.quizData.settings.redirect.url, '_blank');
            }
            const restartButton = this.container.querySelector('#api-quiz-restart-button');
            if (restartButton) {
                restartButton.onclick = () => window.location.reload();
            }
        }

        handleAnswerSelect(option) {
            const currentSessionData = this.quizData.sessions[this.currentSessionIndex];
            this.answers[currentSessionData.id] = option;
            this.render(); // Re-render to show selection
            setTimeout(() => this.proceedToNextStep(), 300);
        }

        handleNext() {
            const currentSessionData = this.quizData.sessions[this.currentSessionIndex];

            if (currentSessionData.required) {
                if (currentSessionData.type === 'question' && !this.answers[currentSessionData.id]) {
                    alert('Por favor, selecione uma opção para continuar.'); // Replace with a better notification
                    return;
                }
                if (currentSessionData.type === 'form') {
                    const formFields = currentSessionData.formFields || {};
                    let missingFields = [];
                    if (formFields.name && !this.formData.name?.trim()) missingFields.push('Nome');
                    if (formFields.email && !this.formData.email?.trim()) missingFields.push('E-mail');
                    
                    if (missingFields.length > 0) {
                        alert(`Por favor, preencha os campos obrigatórios: ${missingFields.join(', ')}`); // Replace with a better notification
                        return;
                    }
                }
            }
            this.proceedToNextStep();
        }

        handleAdComplete() {
            this.state.showAd = false;
            this.state.showFinalAd = false;
            this.proceedToNextStep();
        }

        proceedToNextStep() {
            const currentSessionData = this.quizData.sessions[this.currentSessionIndex];

            if (currentSessionData?.showAd && !this.state.showAd) {
                this.state.showAd = true;
                this.render();
                return;
            }

            if (this.currentSessionIndex < this.quizData.sessions.length - 1) {
                this.currentSessionIndex++;
                this.render();
            } else {
                this.handleComplete();
            }
        }

        async handleComplete() {
            this.state.isLoading = true;
            this.render(); // Show loading screen

            const allResponses = { ...this.answers, ...this.formData };
            const sessionId = this.generateUUID();
            const userAgent = navigator.userAgent;
            const quizId = this.quizData.id;

            try {
                const response = await fetch(`https://riqfafiivzpotfjqfscd.supabase.co/functions/v1/submit-quiz-response`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        quizId,
                        sessionId,
                        userAgent,
                        responseData: allResponses,
                    }),
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Erro desconhecido ao salvar resposta.');
                }
                console.log('Respostas salvas com sucesso!');
            } catch (error) {
                console.error('Erro ao salvar respostas:', error);
                alert(`Não foi possível salvar a resposta: ${error.message}`); // Replace with a better notification
            }

            const processingTime = (this.quizData.settings.processingTime || 3) * 1000;
            setTimeout(() => {
                this.state.isLoading = false;
                if (this.quizData.settings.showFinalAd) {
                    this.state.showFinalAd = true;
                } else {
                    this.state.showResult = true;
                    this.startRedirectCountdown();
                }
                this.render();
            }, processingTime);
        }

        startRedirectCountdown() {
            if (this.quizData.settings.redirect.enabled && this.quizData.settings.redirect.url) {
                let delay = this.quizData.settings.redirect.delay || 3;
                this.state.redirectCountdown = delay;
                
                const timer = setInterval(() => {
                    this.state.redirectCountdown--;
                    this.render(); // Re-render to update countdown
                    if (this.state.redirectCountdown <= 0) {
                        clearInterval(timer);
                        window.open(this.quizData.settings.redirect.url, '_blank');
                    }
                }, 1000);
            }
        }

        generateUUID() {
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                var r = Math.random() * 16 | 0,
                    v = c == 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });
        }
    }

    // Initialize quiz renderers for all containers on the page
    $(document).ready(function() {
        $('.api-quiz-builder-container').each(function() {
            const quizSlug = $(this).data('quiz-slug');
            if (quizSlug) {
                new QuizRenderer(this, quizSlug);
            }
        });
    });

})(jQuery);