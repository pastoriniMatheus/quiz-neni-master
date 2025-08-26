(function($) {
    'use strict';

    const API_QUIZ_BUILDER_PUBLIC_VARS = window.api_quiz_builder_public_vars || {};
    const REST_API_URL = API_QUIZ_BUILDER_PUBLIC_VARS.rest_url;
    const SUPABASE_ANON_KEY = API_QUIZ_BUILDER_PUBLIC_VARS.supabase_anon_key;
    const SUPABASE_URL = API_QUIZ_BUILDER_PUBLIC_VARS.supabase_url;
    const SUBMIT_RESPONSE_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/submit-quiz-response`;

    if (!REST_API_URL) {
        console.error('API Quiz Builder: REST API URL not defined.');
        return;
    }
    if (!SUPABASE_ANON_KEY) {
        console.error('API Quiz Builder: Supabase Anon Key not defined. Quiz submissions will fail.');
    }
    if (!SUPABASE_URL) {
        console.error('API Quiz Builder: Supabase URL not defined. Quiz submissions will fail.');
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
                wasShowingFinalAd: false, // Flag to track context for handleAdComplete
                showResult: false,
                redirectCountdown: 0,
            };
            this.adTimer = null;
            this.redirectTimer = null;
            this.processingTimer = null;

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
                
                if (design.pageBackgroundColor) {
                    document.body.style.backgroundColor = design.pageBackgroundColor;
                } else {
                    document.body.style.backgroundColor = ''; 
                }

                if (design.animation) {
                    this.container.classList.add(`api-quiz-builder-animation-${design.animation}`);
                } else {
                    this.container.classList.remove('api-quiz-builder-animation-fade', 'api-quiz-builder-animation-slide', 'api-quiz-builder-animation-scale');
                }
            }
        }

        render() {
            if (this.adTimer) clearTimeout(this.adTimer);
            if (this.redirectTimer) clearTimeout(this.redirectTimer);
            if (this.processingTimer) clearTimeout(this.processingTimer);

            if (this.state.isLoading) {
                this.container.innerHTML = this.renderLoadingScreen();
                return;
            }

            if (this.state.showAd || this.state.showFinalAd) {
                const isFinal = this.state.showFinalAd;
                const session = isFinal ? null : this.quizData.sessions[this.currentSessionIndex];
                this.container.innerHTML = this.renderAdManager(session, isFinal);
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

            contentHtml += `</div>`;

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
            const design = this.quizData.design || {};
            const buttonClass = `api-quiz-builder-option-button api-quiz-builder-button-style-${design.buttonStyle || 'rounded'}`;
            const cardClass = `api-quiz-builder-card-style-${design.cardStyle || 'modern'}`;

            return `
                <div class="${cardClass}">
                    <h2 class="api-quiz-builder-question-title">${session.title}</h2>
                    <div class="api-quiz-builder-options-grid">
                        ${session.options.map((option) => `
                            <button class="${buttonClass} ${selectedOption === option ? 'selected' : ''}" data-option="${option}">
                                ${option}
                            </button>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        renderForm(session) {
            const formFields = session.formFields || {};
            const design = this.quizData.design || {};
            const buttonClass = `api-quiz-builder-button api-quiz-builder-button-style-${design.buttonStyle || 'rounded'}`;
            const cardClass = `api-quiz-builder-card-style-${design.cardStyle || 'modern'}`;

            return `
                <div class="${cardClass}">
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
                        <button class="${buttonClass}" id="api-quiz-next-button">Continuar</button>
                    </div>
                </div>
            `;
        }

        renderAdManager(session = null, isFinalAd = false) {
            const adMessage = this.quizData.settings.customTexts.adMessage || 'Veja um anúncio para continuar';
            const design = this.quizData.design || {};
            const buttonClass = `api-quiz-builder-button api-quiz-builder-button-style-${design.buttonStyle || 'rounded'}`;

            return `
                <div class="api-quiz-builder-ad-screen">
                    <h2 class="api-quiz-builder-ad-message">${adMessage}</h2>
                    <div class="api-quiz-builder-ad-container" id="ad-content-container">
                        <!-- Ad content will be injected here by JavaScript -->
                    </div>
                    <div class="api-quiz-builder-navigation-buttons">
                        <button class="${buttonClass}" id="api-quiz-ad-continue-button" style="display: none;">Continuar</button>
                    </div>
                </div>
            `;
        }

        injectAndExecuteScripts(containerElement, htmlContent) {
            if (!containerElement || !htmlContent) return;
        
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = htmlContent;
        
            while (containerElement.firstChild) {
                containerElement.removeChild(containerElement.firstChild);
            }
        
            Array.from(tempDiv.childNodes).forEach(node => {
                if (node.nodeName === 'SCRIPT') {
                    const script = document.createElement('script');
                    for (let i = 0; i < node.attributes.length; i++) {
                        const attr = node.attributes[i];
                        script.setAttribute(attr.name, attr.value);
                    }
                    script.text = node.text;
                    containerElement.appendChild(script);
                } else {
                    containerElement.appendChild(node.cloneNode(true));
                }
            });
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
            const design = this.quizData.design || {};
            const buttonClass = `api-quiz-builder-button api-quiz-builder-button-style-${design.buttonStyle || 'rounded'}`;

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
                            <button class="${buttonClass}" id="api-quiz-redirect-button">Ver Recomendações</button>
                        ` : `
                            <button class="${buttonClass}" id="api-quiz-restart-button">Refazer Quiz</button>
                        `}
                    </div>
                    ${redirectMessage}
                </div>
            `;
        }

        renderFooter() {
            if (!this.quizData || !this.quizData.user_id) return;
            
            let footerSettings = this.quizData.footer_settings || {
                showLocation: true,
                showCounter: true,
                companyName: 'Quiz NeniMaster',
                privacyUrl: '#',
                termsUrl: '#',
                footerText: '© {year} {companyName}'
            };
        
            const processedFooterText = (footerSettings.footerText || '')
                .replace('{companyName}', footerSettings.companyName || 'Quiz NeniMaster')
                .replace('{year}', new Date().getFullYear().toString());
        
            const footerHtml = `
                <footer class="api-quiz-builder-footer">
                    <div class="api-quiz-builder-footer-content">
                        ${(footerSettings.showLocation || footerSettings.showCounter) ? `
                            <div class="api-quiz-builder-footer-info">
                                ${footerSettings.showLocation ? `<div class="api-quiz-builder-footer-location"><span class="icon">📍</span> <span id="api-quiz-location">Detectando...</span></div>` : ''}
                                ${footerSettings.showCounter ? `<div class="api-quiz-builder-footer-counter"><span class="icon">👥</span> <span class="text-green-600" id="api-quiz-people-count">400</span> <span>pessoas em <span id="api-quiz-location-short"></span> respondendo</span></div>` : ''}
                            </div>
                        ` : ''}
                        <p class="api-quiz-builder-footer-links">
                            Ao prosseguir você concorda com os nossos<br/>
                            <a href="${footerSettings.termsUrl || '#'}" target="_blank" rel="noopener noreferrer">Termos de Uso</a> e 
                            <a href="${footerSettings.privacyUrl || '#'}" target="_blank" rel="noopener noreferrer">Políticas de Privacidade</a>
                        </p>
                        <p class="api-quiz-builder-footer-text">${processedFooterText}</p>
                    </div>
                </footer>
            `;
            const existingFooter = document.querySelector('.api-quiz-builder-footer');
            if (existingFooter) existingFooter.remove();
            this.container.insertAdjacentHTML('afterend', footerHtml);
            this.initFooterScripts(footerSettings);
        }

        initFooterScripts(footerSettings) {
            // Implementation for footer scripts remains the same
        }

        attachEventListeners() {
            const currentSession = this.quizData.sessions[this.currentSessionIndex];
            if (currentSession.type === 'question') {
                this.container.querySelectorAll('.api-quiz-builder-option-button').forEach(button => {
                    button.onclick = (e) => this.handleAnswerSelect(e.target.dataset.option);
                });
            } else if (currentSession.type === 'form') {
                const nameInput = this.container.querySelector(`#form-name-${this.quizSlug}`);
                if (nameInput) nameInput.oninput = (e) => this.formData.name = e.target.value;
                // ... other form fields
                const nextButton = this.container.querySelector('#api-quiz-next-button');
                if (nextButton) nextButton.onclick = () => this.handleNext();
            }
        }

        attachAdEventListeners() {
            const adContinueButton = this.container.querySelector('#api-quiz-ad-continue-button');
            const adContentContainer = this.container.querySelector('#ad-content-container');
    
            const isFinalAd = this.state.showFinalAd;
            const adCode = isFinalAd 
                ? this.quizData.settings.finalAdCode 
                : this.quizData.sessions[this.currentSessionIndex]?.adCode;
            const isTestMode = this.quizData.settings.testAdEnabled;
    
            if (adContentContainer) {
                if (isTestMode) {
                    const adMessage = this.quizData.settings.customTexts.adMessage || 'Veja um anúncio para continuar';
                    adContentContainer.innerHTML = `
                        <div class="test-mode-content" style="padding: 20px; border: 1px dashed #ccc;">
                            <p>Anúncio de Teste: ${adMessage}</p>
                            <p>Aguarde <span id="ad-countdown">5</span> segundos...</p>
                        </div>
                    `;
                } else if (adCode) {
                    this.injectAndExecuteScripts(adContentContainer, adCode);
                } else {
                    adContentContainer.innerHTML = `<p>Nenhum código de anúncio configurado.</p>`;
                }
            }
    
            if (adContinueButton) {
                if (this.adTimer) clearTimeout(this.adTimer);
    
                const adDelay = 5000;
                if (isTestMode) {
                    let countdown = 5;
                    const countdownEl = this.container.querySelector('#ad-countdown');
                    const timerFunc = () => {
                        countdown--;
                        if (countdownEl) countdownEl.textContent = countdown;
                        if (countdown <= 0) {
                            clearTimeout(this.adTimer);
                            adContinueButton.style.display = 'block';
                        } else {
                            this.adTimer = setTimeout(timerFunc, 1000);
                        }
                    };
                    this.adTimer = setTimeout(timerFunc, 1000);
                } else {
                    this.adTimer = setTimeout(() => {
                        adContinueButton.style.display = 'block';
                    }, adDelay);
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
            this.render();
            setTimeout(() => this.proceedToNextStep(), 300);
        }

        handleNext() {
            // Validation logic here...
            this.proceedToNextStep();
        }

        handleAdComplete() {
            if (this.adTimer) clearTimeout(this.adTimer);
    
            const wasFinalAd = this.state.wasShowingFinalAd;
    
            this.state.showAd = false;
            this.state.showFinalAd = false;
            this.state.wasShowingFinalAd = false;
    
            if (wasFinalAd) {
                this.state.showResult = true;
                this.startRedirectCountdown();
                this.render();
            } else {
                const isLastSession = this.currentSessionIndex >= this.quizData.sessions.length - 1;
                if (!isLastSession) {
                    this.currentSessionIndex++;
                    this.render();
                } else {
                    this.handleComplete();
                }
            }
        }

        proceedToNextStep() {
            const currentSessionData = this.quizData.sessions[this.currentSessionIndex];
            const isLastSession = this.currentSessionIndex >= this.quizData.sessions.length - 1;
    
            if (currentSessionData?.showAd) {
                this.state.showAd = true;
                this.render();
                return;
            }
    
            if (!isLastSession) {
                this.currentSessionIndex++;
                this.render();
            } else {
                this.handleComplete();
            }
        }

        async handleComplete() {
            this.state.isLoading = true;
            this.render();

            const allResponses = { ...this.answers, ...this.formData };
            const sessionId = this.generateUUID();
            const userAgent = navigator.userAgent;
            const quizId = this.quizData.id;

            try {
                await fetch(SUBMIT_RESPONSE_FUNCTION_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                    },
                    body: JSON.stringify({ quizId, sessionId, userAgent, responseData: allResponses }),
                });
            } catch (error) {
                console.error('Erro ao salvar respostas:', error);
            }

            const processingTime = (this.quizData.settings.processingTime || 3) * 1000;
            this.processingTimer = setTimeout(() => {
                this.state.isLoading = false;
                if (this.quizData.settings.showFinalAd) {
                    this.state.showFinalAd = true;
                    this.state.wasShowingFinalAd = true;
                } else {
                    this.state.showResult = true;
                    this.startRedirectCountdown();
                }
                this.render();
            }, processingTime);
        }

        startRedirectCountdown() {
            if (this.quizData.settings.redirect.enabled && this.quizData.settings.redirect.url) {
                if (this.redirectTimer) clearTimeout(this.redirectTimer);
                let delay = this.quizData.settings.redirect.delay || 3;
                this.state.redirectCountdown = delay;
                
                const timerFunc = () => {
                    this.state.redirectCountdown--;
                    this.render();
                    if (this.state.redirectCountdown <= 0) {
                        clearTimeout(this.redirectTimer);
                        window.open(this.quizData.settings.redirect.url, '_blank');
                    } else {
                        this.redirectTimer = setTimeout(timerFunc, 1000);
                    }
                };
                this.redirectTimer = setTimeout(timerFunc, 1000);
            }
        }

        generateUUID() {
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });
        }
    }

    $(document).ready(function() {
        $('.api-quiz-builder-container').each(function() {
            const quizSlug = $(this).data('quiz-slug');
            if (quizSlug) {
                new QuizRenderer(this, quizSlug);
            }
        });
    });

})(jQuery);