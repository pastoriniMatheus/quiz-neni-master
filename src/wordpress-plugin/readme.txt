
=== Quiz NeniMaster Integration ===
Contributors: NeniMaster
Tags: quiz, survey, lead generation, interactive content
Requires at least: 5.0
Tested up to: 6.4
Stable tag: 1.0.0
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Integra quizzes do Quiz NeniMaster ao WordPress através de shortcodes.

== Description ==

O Quiz NeniMaster Integration permite que você incorpore facilmente quizzes interativos criados no Quiz NeniMaster diretamente em seu site WordPress.

**Características principais:**

* Integração simples via shortcode
* Design responsivo que se adapta ao seu tema
* Suporte completo a todas as funcionalidades do Quiz NeniMaster
* Contador dinâmico de pessoas online
* Detecção automática de localização
* Configuração de redirecionamento
* Analytics e tracking integrados

== Installation ==

1. Faça upload do plugin para a pasta `/wp-content/plugins/quiz-nenimaster/`
2. Ative o plugin através do menu 'Plugins' no WordPress
3. Obtenha sua API Key no painel do Quiz NeniMaster
4. Use o shortcode `[quiz_nenimaster id="ID_DO_QUIZ" api_key="SUA_API_KEY"]` em qualquer página ou post

== Frequently Asked Questions ==

= Como obtenho uma API Key? =

1. Acesse sua conta no Quiz NeniMaster
2. Vá em Configurações → Acesso  
3. Crie uma nova API Key
4. Copie a chave gerada

= O quiz funciona em dispositivos móveis? =

Sim, todos os quizzes são totalmente responsivos e otimizados para dispositivos móveis.

= Posso personalizar o visual do quiz? =

Sim, toda personalização é feita no painel do Quiz NeniMaster e automaticamente aplicada no WordPress.

== Shortcode Parameters ==

* `id` (obrigatório): ID do quiz no Quiz NeniMaster
* `api_key` (obrigatório): Sua chave de API
* `width` (opcional): Largura do quiz (padrão: 100%)
* `height` (opcional): Altura do quiz (padrão: 600px)

Exemplo: `[quiz_nenimaster id="abc123" api_key="qb_xyz789" width="800px" height="700px"]`

== Changelog ==

= 1.0.0 =
* Primeira versão do plugin
* Suporte a shortcodes
* Integração completa com a API
* Painel de administração
* Contador dinâmico e detecção de localização
