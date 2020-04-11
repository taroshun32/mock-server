/**
 * @file APIモックサーバの起動時に実行するファイル
 */

const connect = require('connect');
const cors = require('cors');
const optionMiddleware = require('./middlewares/option.js');
const proxyMiddleware = require('./middlewares/proxy.js');
const mockMiddleware = require('./middlewares/mock.js');

const port = process.env.PORT || 80;

const app = connect();

// CORSの許可
app.use(cors());
// デフォルトオプションの設定(connectではexpressと違ってres.localsがないので作る)
app.use((req, res, next) => {
  res.locals = {
    option: {
      // レスポンスの遅延(ms)
      delay: 0,
      // レスポンスをエラーにするか(booleanかstatusCodeの数値)
      error: false,
      // 常にmock jsonを返すか
      mock: false
    }
  };
  next();
});
// queryのオプションのパースと実行
app.use(optionMiddleware);
// dev環境への問い合わせ
app.use(proxyMiddleware);
// mock jsonの検索
app.use(mockMiddleware);

app.listen(port);
