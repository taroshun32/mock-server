/**
 * proxyMiddlewareを実装するときのテスト用サーバ
 * @type {createServer}
 */

const connect = require('connect');
const cors = require('cors');

const app = connect();
app.use(cors());
app.use((req, res) => {
  res.setHeader("Accept", "application/json");
  res.setHeader('Content-Type', 'application/json');

  if (req.url === '/foo') {
    res.statusCode = 200;
    res.end(JSON.stringify({
      path: '/foo'
    }));
    return;
  }

  if (req.url === '/bar') {
    res.statusCode = 500;
    res.end(JSON.stringify({
      path: '/bar'
    }));
    return;
  }

  res.statusCode = 404;
  res.end('');
});
app.listen(3002);
