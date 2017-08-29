require('./internal.js');

let querystring = require('querystring');
let tmp = require('tmp-promise');
let fs = require('fs-extra');
let Express = require('express');
let app = Express();
app.listen('53457', '0.0.0.0', () => {
  console.log('Server listened.');
});
app.use(Express.static(__dirname + '/static'));

(async () => {
  let phantom = await require('phantom').create();

  app.get('/', async (req, res) => {
    res.sendFile(__dirname + '/index.html');
  });

  app.get('/generate', async (req, res) => {
    try {
      let page = await phantom.createPage();
      page.property('viewportSize', { width: 1160, height: 1224 });
      page.property('clipRect', { top: 0, left: 0, width: 1160, height: 1224 });

      page.on('onCallback', async () => {
        let filename = '/tmp/' + await tmp.tmpName({ template: 'CLASSIC_DECK_XXXXXX.png', dir: '/tmp' });
        await page.render(filename);
        res.type('png');
        res.sendFile(filename, {}, async err => {
          if (err) {
            console.log(req.query);
            console.log(err);
          }
          await fs.remove(filename);
          page.invokeMethod('close');
        });
      });

      await page.open('http://127.0.0.1:53456/?' + querystring.encode(req.query));
    } catch (e) {
      console.log(req.query);
      console.log(e);
    }
  });
})()
