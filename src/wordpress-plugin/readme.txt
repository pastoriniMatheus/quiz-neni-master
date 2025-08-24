=== Quiz NeniMaster ===
Contributors: NeniMaster
Tags: quiz, interactive, engagement, supabase
Requires at least: 5.0
Tested up to: 6.5
Stable tag: 1.3.1
License: GPL v2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Plugin oficial para integrar quizzes do NeniMaster no WordPress de forma segura.

== Description ==

O Quiz NeniMaster permite integrar facilmente seus quizzes interativos em qualquer site WordPress. O plugin se conecta à sua API para listar os quizzes disponíveis e gerar os shortcodes automaticamente, além de validar sua chave de API antes de exibir o quiz, garantindo que apenas quizzes autorizados sejam carregados.

== Installation ==

1.  Faça o upload da pasta `quiz-nenimaster` para o diretório `/wp-content/plugins/`.
2.  Ative o plugin através do menu 'Plugins' no WordPress.
3.  Clique no novo item de menu **"Quiz NeniMaster"** na barra lateral do WordPress.
4.  Preencha a **URL do Sistema**, a **Supabase Anon Key** e a sua **Chave da API**.
5.  Salve as alterações.
6.  No painel "Meus Quizzes", clique em "Carregar Quizzes" para ver a lista e copiar os shortcodes.

== Usage ==

Para exibir um quiz em uma página ou post, use o shortcode gerado na página de configurações:
`[quiz_nenimaster slug="o-slug-do-seu-quiz"]`

== Changelog ==

= 1.3.1 =
* **Correção Crítica**: Corrigido o handler do shortcode que não enviava a `anon key` do Supabase, impedindo a renderização do quiz nas páginas.

= 1.3.0 =
* **Melhoria de UI**: A página de configurações foi completamente redesenhada com um layout de duas colunas.
* **Melhoria de UX**: O plugin agora é um item de menu principal para acesso mais fácil.
* **Melhoria de UX**: Adicionado um spinner de carregamento para melhor feedback visual.

= 1.2.3 =
* **Correção**: Adicionado o cabeçalho de autorização `Bearer` com a chave `anon` para compatibilidade com o gateway de funções do Supabase.

= 1.2.2 =
* **Melhoria de Debug**: Refatorado o script de admin para usar jQuery e fornecer logs de erro mais detalhados no console.

= 1.2.1 =
* **Correção**: Corrigida a construção da URL da API no shortcode handler.

= 1.1.0 =
* **Melhoria de Segurança**: O plugin agora valida a chave de API antes de renderizar o quiz.

= 1.0.0 =
* Versão inicial do plugin.