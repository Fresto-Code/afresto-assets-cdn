(function ($){
    $.fn.afrestoVoiceToText = function (options){
        var el = null;
        var settings = $.extend({
            onComplete: function(element, text){
                var editorType = element.attr('data-editor-type');
                var editorTarget = element.attr('data-editor-target');

                if(editorType === 'tinymce'){
                    var precontent = tinyMCE.get(editorTarget).getContent()
                    tinyMCE.get(editorTarget).setContent(precontent + final_transcript)
                }else{
                    $(editorTarget).val(final_transcript);
                }
            }
        }, options );

        /** Template Voice 136 x 189**/
        var tpl = `
            <div style='position:fixed; text-align: center; background: #fff; top: calc(50% - 68px); left: calc(50% - 95px);box-shadow: 0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19);z-index: 9999' id="afresto-voice">
                <div style="padding: 20px">
                    Mendengarkan suara<br>
                    Silahkan berbicara<br/>
                    <img src="https://fresto-code.github.io/afresto-assets-cdn/image/animation/sound.gif">
                    <br/>
                </div>
                <div class="afresto-voice-result" style="position: fixed; bottom: 0; left: 0; right: 0; background: #fff; padding: 10px; border-top: 2px solid #ccc; text-align: left">
                    <div style="display: flex">
                        <div style="flex-grow: 1">
                            <div>
                                <strong>Pratinjau Text</strong>
                            </div>
                            <div id="afresto-voice-text" style="min-height: 24px">
                                ...
                            </div>
                        </div>
                        <a href="#" id="afrsto-suara-finish" style="font-size: 15px; padding: 12px; text-decoration: none; color: #198754; font-weight: 600">
                            Selesai
                        </a>
                    </div>
                </div>
                
            </div>
        `
        var final_transcript = '';
        var printSuara = null;
        var recognition = new webkitSpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'id-ID'
        recognition.onstart = function () {
            $('body').append(tpl);
            printSuara = $("#afresto-voice-text");
            $('#afrsto-suara-finish').on('click',function (){
                recognition.stop();
            })
        };

        recognition.onerror = function (event) {
            if (event.error === 'no-speech') {
            }else if (event.error === 'audio-capture') {

            }else if (event.error === 'not-allowed') {

            }
        };

        recognition.onend = function () {
            $("#afresto-voice").remove();
            settings.onComplete(el, final_transcript);
            final_transcript = '';
        }

        recognition.onresult = function (event) {
            var interim_transcript = '';
            var final;
            for (var i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    final = event.results[i][0].transcript
                    final_transcript += event.results[i][0].transcript;
                } else {
                    interim_transcript += event.results[i][0].transcript;
                }
            }

            if(navigator.userAgentData.mobile){
                printSuara.html(final);
                final_transcript = final;
            }else{
                printSuara.html(final_transcript)
            }

        };
        this.click(function (){
            el = $(this);
            recognition.start();
        })
        return this;
    }
}(jQuery))
