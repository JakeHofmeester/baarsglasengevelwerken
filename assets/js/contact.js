//Contact
$('#working_form').on('submit', function() {
    if (typeof window.gtag === 'function') {
        window.gtag('event', 'form_submit_attempt', { form_id: 'contact_form' });
    }

    var action = $(this).attr('action');

    $("#message").slideUp(750, function() {
        $('#message').hide();

        $('#submit')
            .before('<img src="" class="gif_loader" />')
            .attr('disabled', 'disabled');

        var formData = new FormData(document.getElementById('working_form'));

        $.ajax({
            type: 'POST',
            url: action,
            data: formData,
            processData: false,
            contentType: false,
            success: function(data) {
                document.getElementById('message').innerHTML = data;
                $('#message').slideDown('slow');
                $('#working_form img.gif_loader').fadeOut('slow', function() {
                    $(this).remove()
                });
                $('#submit').removeAttr('disabled');
                if (data.match('success') != null) {
                    $('#working_form').slideUp('slow');
                    if (typeof window.gtag === 'function') {
                        window.gtag('event', 'generate_lead', { method: 'contact_form' });
                    }
                }
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



