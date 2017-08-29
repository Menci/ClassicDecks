let Express = require('express');
let app = Express();
app.listen(53456, '127.0.0.1', () => {
  console.log('Internal Server listened.');
});
app.use(Express.static(__dirname + '/internal'));
