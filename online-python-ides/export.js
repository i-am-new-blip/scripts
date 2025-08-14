if (true){
        prev_result = 'in';
        document.getElementById("hint-section").innerHTML = '';
        editor_list = $(".nav-tabs").children('li');
        code_contents = [];
        active_filename = '';
        for (let i = 0; i < editor_list.length - 1; i++) {
            editor_index = parseInt($(editor_list[i]).attr('id').split('-')[1]);
            code_content = {}
            code_content['code'] = editor_session[editor_index - 1].getValue();
            code_content['file_name'] = $(editor_list[i]).children('a')[0].innerText;
            if ($(editor_list[i]).hasClass('active')) {
                active_filename = code_content['file_name'];
            }
            code_contents.push(code_content);
        }

        active_file_name = active_editor_id.html();
        document.getElementById("download_file_name").value = active_file_name.replace(/\..*/g, '').toLowerCase() + '_output.txt';

        init_ts = performance.now();

        if (typeof socket !== "undefined") {
            socket.close();
        }
        output.innerHTML = '';
        progress_status.innerHTML = '';
        $('#output').append('<div class="wrapper" id="wrap"></div><form id="term-form"><input id="term-input" autocomplete="off"></form>');

        exec_detail.innerHTML = '<span class="label label-primary"><i class="fas fa-sync-alt fa-spin"></i>&ensp;Connecting to Server</span>';
        progress_status.innerHTML = '<div class="progress" id="progress-bar"><div class="progress-bar progress-bar-primary progress-bar-striped active" role="progressbar"></div></div>';
        document.getElementById('control-btn').innerHTML = '<button type="button" class="btn btn-danger btn-sm" id="stop-btn" onclick="stop_python()"><i class="fa fa-stop"></i>&ensp;<strong>Stop</strong></button>';
        $('#stop-btn').removeAttr('disabled');
        // $('#run-btn').attr('disabled', 'disabled');
        $('.status button').attr('disabled', 'disabled');
        $('#terminal-ad').css('display', 'none');
        $('#output').css('display', 'block');

        document.getElementById('wrap').innerHTML = '';

        socket_options['query'] = { type: "script", "lang": "python3" };
        socket = io(repl_host, socket_options);
        socket.emit('code', code_contents, input_arguments.substring(0, 500), active_filename);

        socket.on('reconnecting', function() {
            console.log('Reconnecting to the server!');
        });

        socket.on('connect', function() {
            console.log('Client has connected to the server');
            // exec_detail.innerHTML = '<span class="label label-primary"><i class="fas fa-play"></i>&ensp;Executing</span>';
        });

        socket.on('exit', function(data, code) {
            add_content(data);
            // $('#progress-bar').css('display', 'none');
            final_ts = Math.floor(performance.now() - init_ts) / 1000;

            if (code == 0) {
                exe_cnt += 1;
                // exec_detail.innerHTML = '<span class="label label-success"><i class="fa fa-check"></i>&ensp;Completed</span>';
                progress_status.innerHTML = '<div class="progress" id="progress-bar"><div class="progress-bar progress-bar-success active" role="progressbar"></div></div>';
            } else if (code == 1000) {
                // exec_detail.innerHTML = '<span class="label label-warning"><i class="fa fa-exclamation-triangle"></i>&ensp;Killed</span>';
                progress_status.innerHTML = '<div class="progress" id="progress-bar"><div class="progress-bar progress-bar-warning active" role="progressbar"></div></div>';
            } else {
                // exec_detail.innerHTML = '<span class="label label-danger"><i class="fa fa-exclamation-circle"></i>&ensp;Failed</span>';
                progress_status.innerHTML = '<div class="progress" id="progress-bar"><div class="progress-bar progress-bar-danger active" role="progressbar"></div></div>';
            }

            // exec_detail.innerHTML += '&ensp;<span class="label label-default"><i class="far fa-clock"></i>&ensp;' + final_ts + ' sec</span>';
            document.getElementById('control-btn').innerHTML = '<button type="button" class="btn btn-success btn-sm" id="run-btn" onclick="run_python()"><i class="fa fa-play"></i>&ensp;<strong>Run</strong></button>';
            // $('#stop-btn').attr('disabled', 'disabled');
            $('#run-btn').removeAttr('disabled');
            $('.status button').removeAttr('disabled');
            if (exe_cnt === 5) {
                $("#share-btn").popover('show');
                setTimeout(function() { $("#share-btn").popover('hide') }, 7000);
            }
            if (exe_cnt === 3) {
                $("#support-btn").popover('show');
                setTimeout(function() { $("#support-btn").popover('hide') }, 7000);
            }
            if (hint !== undefined) {
                document.getElementById("hint-section").innerHTML = '<a tabindex="0" type="button" id="hint-btn" data-toggle="popover" data-placement="right" data-trigger="hover" data-content="' + hint + '" title="Hint" class="btn btn-default btn-sm status"><i class="fas fa-lightbulb"></i></button></a>';
                $("#hint-btn").popover('show');
                setTimeout(function() { $("#hint-btn").popover('hide') }, 7000);
                hint_glow = setInterval(function() {
                    if ($("#hint-btn").css('transform').search('1.5') !== -1) {
                        $("#hint-btn").css('transform', 'scale(1.2)')
                    } else {
                        $("#hint-btn").css('transform', 'scale(1.5)')
                    }
                }, 700);
            }
            // if (!isMobile) editor.focus();
            add_content('\nPress Enter to exit terminal');
            $(document).ready(function() {
                $('#term-input').focus();
                $('#term-form').submit(function(event) {
                    clear_output();
                    return false;
                });
            });

        })

        socket.on('output', function(data) {
            var encodedString = String.fromCharCode.apply(null, new Uint8Array(data));
            var buf = decodeURIComponent(escape(encodedString));
            // var buf = String.fromCharCode.apply(null, new Uint8Array(data));
            add_content(buf, true);
        });

        socket.on('input', function(data) {
            var encodedString = String.fromCharCode.apply(null, new Uint8Array(data));
            var buf = decodeURIComponent(escape(encodedString));
            // var buf = String.fromCharCode.apply(null, new Uint8Array(data));
            add_input_content(buf, true);
        });

        socket.on('err', function(data) {
            var encodedString = String.fromCharCode.apply(null, new Uint8Array(data));
            var buf = decodeURIComponent(escape(encodedString));
            // var buf = String.fromCharCode.apply(null, new Uint8Array(data));
            add_err(buf);
            if (hint === undefined) hint = check_hint(buf);
        });

        socket.on('reconnect_failed', function(err) {
            console.log("Connection Failed");
            clear_content();
            add_content("Problem in connecting to the server. Below could be the possible reasons:\n", true);
            add_content("  -  Your Page can be unresponsive. Please reload your page and try.\n", true);
            add_content("  -  Your Internet might be down. Check your internet connection.\n", true);
            add_content("  -  Server may not be reachable and could be under maintenence. Please try after sometime.\n", true);
            // if (connect_error !== "" || connect_error !== null || connect_error !== undefined) {
            //     add_content(connect_error, true);
            // }
            document.getElementById('control-btn').innerHTML = '<button type="button" class="btn btn-success btn-sm" id="run-btn" onclick="run_python()" id="#run"><i class="fa fa-play"></i>&ensp;<strong>Run</strong></button>';
            // $('#stop-btn').attr('disabled', 'disabled');
            $('#run-btn').removeAttr('disabled');
            $('.status button').removeAttr('disabled');
            socket.close();
        });

        socket.on('connect_error', function(err) {
            console.log("Connection Failed - " + err);
            connect_error = err;
        });


        $(document).ready(function() {
            $('#term-form').submit(function(event) {
                var input = $('#term-input');
                socket.send(input.val());
                //leave the content on the page
                return false;
            });
            //let a cursor focus on the input when the page is loaded
            var scrolledWindow = $('body').height() - $(window).height() + 0
            // $(window).scrollTop(scrolledWindow);
            $('#term-input').focus();
        });
}
