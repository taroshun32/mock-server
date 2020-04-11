/**
 * @file オプションのパースと実行
 */

const querystring = require('querystring');

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
  const errorCode = parseInt(query._error, 10);
  if (query._error) {
    option.error = isNaN(errorCode) ? true : errorCode;
  }

  // 常にmock jsonを返すか
  if (query._mock) {
    option.mock = !!query._mock;
  }

  return option;
}

/** middleware */
module.exports = (req, res, next) => {
  // オプションをqueryからパースする
  const option = parseOption(req.url);
  res.locals.option = {
    ...res.locals.option,
    ...option
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
      res.end('');
      return;
    }
    next();
  }
};
