function print (msg) {
    if (typeof msg === 'object') {
        msg = JSON.stringify(msg);
    }
    $('<div/>').html(msg).appendTo('#debug');
}