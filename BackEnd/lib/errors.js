var errors = {
    wget_error: function (code) {
        var message = '';
        switch (code) {
            case 4:
                message = 'Network Failure'
                break;
            case 5:
                message = 'SSL verification failure.'
                break;
            case 7:
                message = 'Protocol errors.'
                break;
            case 8:
                message = 'Server issued an error response.'
                break;
            default:
                message = 'Error unknown.'
                break;
        }
        return message;
    }
}
module.exports = errors;
