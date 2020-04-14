/**
 * @file オプションのパースと実行
 */

const querystring = require('querystring');
const fs = require('fs');
const join = require('path').join;

/** Jsonの配置先 */
const SERVE_FROM_MOCK = join(__dirname, '../../mock-json/');

/**
 * オプションをqueryからパースする
 * @returns {Object} パースしたオプション
 */
function parseOption(url) {
  const option = {};

  // queryを抜き出す
  const queryMatched = url.match(/\?(.*)$/);
  const query = querystring.parse(queryMatched ? queryMatched[1] : '');

  // レスポンスの遅延(ms)
  const delay = parseInt(query._delay, 10);
  if (!isNaN(delay)) {
    option.delay = delay;
  }

  // レスポンスをエラーにするか(booleanかstatusCodeの数値)
  if (query._error != null) {
    const errorCode = parseInt(query._error, 10);
    option.error = isNaN(errorCode) ? true : errorCode;
  }

  // 常にmock jsonを返すか
  if (query._mock != null) {
    option.mock = !(query._mock === 'false' || query._mock === '0');
  }

  return option;
}

/** middleware */
module.exports = (req, res, next) => {
  // オプションをqueryからパースする
  const option = parseOption(req.url);
  res.locals = {
    option: {
      // レスポンスの遅延(ms)
      delay: 0,
      // レスポンスをエラーにするか(booleanかstatusCodeの数値)
      error: false,
      // 常にmock jsonを返すか
      mock: false,
      // パースしたオプションで上書きする
      ...option
    }
  };

  // delayが設定されていればその分レスポンスを遅延させる
  if (res.locals.option.delay > 0) {
    setTimeout(done, res.locals.option.delay);
  } else {
    done();
  }

  function done() {
    // errorが設定されていればエラーにする
    if (res.locals.option.error) {
      res.statusCode = typeof res.locals.option.error === 'number' ? res.locals.option.error : 500;
      res.setHeader("Accept", "application/json");
      res.setHeader('Content-Type', 'application/json');
      res.end(getErrorJsonFromPath(String(typeof res.locals.option.error === 'number' ? res.locals.option.error : 500)));
      return;
    }
    next();
  }
};

// ルート配下のエラーレスポンスjsonを返す
function getErrorJsonFromPath(statusCode) {
  try {
    return fs.readFileSync(join(SERVE_FROM_MOCK, `${statusCode}.json`));
  } catch (exception) {
    console.error(exception);
    return "error file not exist"
  }
}