/**
 * @file APIモックサーバの起動時に実行するファイル
 */

const connect = require('connect');
const cors = require('cors');
const healthCheckMiddleware = require('./middlewares/health-check.js');
const optionMiddleware = require('./middlewares/option.js');
const mockMiddleware = require('./middlewares/mock.js');

const port = process.env.PORT || 80;

const app = connect();

// CORSの許可
app.use(cors());
// /にアクセスがきたらヘルスチェック用のレスポンスを返す
app.use(healthCheckMiddleware);
// queryのオプションのパースと実行
app.use(optionMiddleware);
// mock jsonの検索
app.use(mockMiddleware);

app.listen(port);
