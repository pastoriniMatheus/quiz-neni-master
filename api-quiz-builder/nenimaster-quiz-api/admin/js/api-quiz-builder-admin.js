jQuery(document).ready(function($) {
    const syncButton = $('#api-quiz-builder-sync-button');
    const syncStatusDiv = $('#api-quiz-builder-sync-status');
    const spinner = syncButton.find('.spinner');

    syncButton.on('click', function(e) {
        e.preventDefault();

        syncButton.prop('disabled', true);
        spinner.addClass('is-active');
        syncStatusDiv.html('<p style="color: blue;">Sincronizando quizzes... Por favor, aguarde.</p>');

        $.ajax({
            url: api_quiz_builder_admin_ajax.ajax_url,
            type: 'POST',
            data: {
                action: 'api_quiz_builder_sync_quizzes',
                nonce: api_quiz_builder_admin_ajax.nonce,
            },
            success: function(response) {
                if (response.success) {
                    syncStatusDiv.html('<p style="color: green;">' + response.data + '</p>');
                    // Reload the quiz list after successful sync
                    $('#api-quiz-builder-quiz-list').load(location.href + ' #api-quiz-builder-quiz-list > *');
                } else {
                    syncStatusDiv.html('<p style="color: red;">Erro: ' + response.data + '</p>');
                }
            },
            error: function(jqXHR, textStatus, errorThrown) {
                console.error('AJAX Error:', textStatus, errorThrown, jqXHR.responseText);
                syncStatusDiv.html('<p style="color: red;">Erro na requisição AJAX: ' + textStatus + '</p>');
            },
            complete: function() {
                syncButton.prop('disabled', false);
                spinner.removeClass('is-active');
            }
        });
    });

    // Handle copy shortcode button clicks
    $(document).on('click', '.copy-shortcode', function() {
        const shortcode = $(this).data('shortcode');
        navigator.clipboard.writeText(shortcode).then(() => {
            const originalText = $(this).text();
            $(this).text('Copiado!');
            setTimeout(() => {
                $(this).text(originalText);
            }, 2000);
        }).catch(err => {
            console.error('Failed to copy shortcode: ', err);
        });
    });
});