//Contact
$('#working_form').on('submit', function() {
    if (typeof window.gtag === 'function') {
        window.gtag('event', 'form_submit_attempt', { form_id: 'contact_form' });
    }

    var action = $(this).attr('action');

    $("#message").slideUp(750, function() {
        $('#message').hide();

        $('#submit')
            .before('<span class="gif_loader" aria-hidden="true"></span>')
            .attr('disabled', 'disabled');

        var formData = new FormData(document.getElementById('working_form'));

        function done() {
            $('#working_form .gif_loader').fadeOut('slow', function() {
                $(this).remove();
            });
            $('#submit').removeAttr('disabled');
        }

        $.ajax({
            type: 'POST',
            url: action,
            data: formData,
            processData: false,
            contentType: false,
            timeout: 60000,
            success: function(data) {
                document.getElementById('message').innerHTML = data;
                $('#message').slideDown('slow');
                done();
                if (data.match('success') != null) {
                    $('#working_form').slideUp('slow');
                    if (typeof window.gtag === 'function') {
                        window.gtag('event', 'generate_lead', { method: 'contact_form' });
                    }
                }
            },
            error: function() {
                document.getElementById('message').innerHTML = '<div class="error_msg">Er is iets misgegaan. Bel of app 06 57 61 40 22 of mail naar <a href="mailto:info@baarsglasengevelwerken.nl">info@baarsglasengevelwerken.nl</a>.</div>';
                $('#message').slideDown('slow');
                done();
            }
        });

    });

    return false;

});

$(function() {
    var $fileInput = $('#attachment');
    var $btn = $('#attachment_btn');
    var $text = $('#attachment_text');
    var $clear = $('#attachment_clear');

    function updateAttachmentUi() {
        var files = $fileInput[0] && $fileInput[0].files ? $fileInput[0].files : null;
        if (files && files.length) {
            if (files.length === 1) {
                $text.text(files[0].name);
            } else if (files.length === 2) {
                $text.text(files[0].name + ', ' + files[1].name);
            } else {
                $text.text(files.length + ' bestanden geselecteerd');
            }
            $clear.show();
        } else {
            $text.text('Geen bestand geselecteerd.');
            $clear.hide();
        }
    }

    $btn.on('click', function() {
        $fileInput.trigger('click');
    });

    $fileInput.on('change', function() {
        updateAttachmentUi();
    });

    $clear.on('click', function() {
        $fileInput.val('');
        updateAttachmentUi();
    });

    updateAttachmentUi();
});



