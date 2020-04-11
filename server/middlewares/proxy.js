/**
 * @file dev環境に問い合わせるミドルウェア
 */

const request = require('request');

const server = process.env.SERVER || null;

/** middleware */
module.exports = (req, res, next) => {
  // dev環境が渡されてないか、mockを返すオプションが設定されている場合は何もしない
  if (server === null || res.locals.mock) {
    next();
    return;
  }

  // dev環境にリクエストする
  request({
    uri: req.url,
    baseUrl: server,
    method: req.method,
    headers: req.headers,
    body: req.body
  }, (error, response, body) => {
    if (error) {
      console.error(error);
      next();
      return;
    }

    // 未実装or存在しないAPIは404で返ってくるので、
    // 404以外の場合は実装済みということにしてレスポンスをそのまま返す
    if (response.statusCode !== 404) {
      res.statusCode = response.statusCode;
      for (const header of Object.keys(response.headers)) {
        res.setHeader(header, response.headers[header]);
      }
      res.end(body);
      return;
    }

    next();
  });
};
