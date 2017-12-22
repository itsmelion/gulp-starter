(function () {
    console.log('app script loaded');
    $('h1').append('<h2>Right now is: <b>' + moment().format('DD/MM/YYYY hh:mm') + '</b></h2>');
}())