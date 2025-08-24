=== Quiz NeniMaster ===
Contributors: NeniMaster
Tags: quiz, interactive, engagement, supabase
Requires at least: 5.0
Tested up to: 6.5
Stable tag: 1.1.0
License: GPL v2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Plugin oficial para integrar quizzes do NeniMaster no WordPress de forma segura.

== Description ==

O Quiz NeniMaster permite integrar facilmente seus quizzes interativos em qualquer site WordPress usando um simples shortcode. O plugin valida sua chave de API antes de exibir o quiz, garantindo que apenas quizzes autorizados sejam carregados.

== Installation ==

1.  Faça o upload da pasta `quiz-nenimaster` para o diretório `/wp-content/plugins/`.
2.  Ative o plugin através do menu 'Plugins' no WordPress.
3.  Vá para `Configurações > Quiz NeniMaster` no seu painel do WordPress.
4.  Preencha a **URL do Sistema** (a URL base da sua aplicação, ex: `https://seusite.com`) e a sua **Chave da API**.
5.  Salve as alterações.

== Usage ==

Para exibir um quiz em uma página ou post, use o shortcode:
`[quiz_nenimaster slug="o-slug-do-seu-quiz"]`

Substitua `o-slug-do-seu-quiz` pelo slug (URL personalizada) do quiz que você deseja exibir.

== Changelog ==

= 1.1.0 =
* **Melhoria de Segurança**: O plugin agora valida a chave de API antes de renderizar o quiz.
* **Melhoria de UI**: Página de configurações atualizada para maior clareza.
* **Melhoria de Debug**: Mensagens de erro detalhadas para administradores logados.

= 1.0.0 =
* Versão inicial do plugin.