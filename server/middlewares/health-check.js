/**
 * @file /にリクエストが来たらヘルスチェック用のレスポンスを返す
 */

/** middleware */
module.exports = (req, res, next) => {
  if (req.url.split('?')[0] !== '/') {
    next();
    return;
  }

  res.statusCode = 200;
  res.end(JSON.stringify({
    result: true,
    message: ''
  }, undefined, 2));
};
