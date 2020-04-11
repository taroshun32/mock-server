/**
 * @file APIのモックjsonを返すミドルウェア
 */

const fs = require('fs');
const join = require('path').join;

/** モックjsonの配置先 */
const SERVE_FROM = join(__dirname, '../../');
/** jsonファイルのパスの接続文字 */
const DELIMITER = '-';

/**
 * リクエストされたURLをパースする
 * @returns {Array<string>} jsonのpath
 */
function parse(req) {
  // リクエストされたパスの階層
  // /foo/bar/baz?a=b なら ['foo', 'bar', 'baz']
  const hierarchy = req.url.split('?')[0].split('/').slice(1).filter(Boolean);

  // 可能性のあるjsonのパス
  // /foo/bar/:baz は get-foo-bar-baz.jsonのようなファイル名なので、
  // /foo/bar/1 もマッチさせるために以下のようにして、存在している可能性のあるjsonファイル名のリストにする
  // パラメータはすべて_に置き換える
  // ['get-foo-bar-baz', 'get-foo-bar-_', 'get-foo-_-_']
  const method = req.method.toLowerCase();
  const possiblePaths = hierarchy.map((_, i) => {
    const path = [].concat(hierarchy.slice(0, i + 1)).concat(hierarchy.slice(i + 1).map(() => '_')).join(DELIMITER);
    return `${method}-${path}`;
  });
  possiblePaths.reverse();

  return possiblePaths;
}

/**
 * 指定したパスのjsonファイルを探して読み取る
 * @param {string} path
 * @return {*}
 */
function getJsonFromPath(path) {
  // 配置先にあるjsonのファイル名一覧
  const dir = fs.readdirSync(SERVE_FROM);

  // 条件に合致したファイル名を全部取っておいて、パラメータの一番少ないものを採用する
  const allMatchedFilenames = [];
  for (const _filename of dir) {
    // ファイル名のパラメータを_に置き換える
    const filename = _filename.replace(/\.json$/, '')
      .split(DELIMITER).map((f) => /^_/.test(f) ? '_' : f)
      .join(DELIMITER);

    if (filename === path) {
      allMatchedFilenames.push(_filename);
    }
  }

  // パラメータの少ない順に並び替える
  const parameterCountRegex = new RegExp(`${DELIMITER}_`, 'g');
  allMatchedFilenames.sort((a, b) => {
    (parameterCountRegex.match(a) || []).length - (parameterCountRegex.match(b) || []).length;
  });

  // jsonファイルが見つかったので読み取る
  if (allMatchedFilenames.length > 0) {
    try {
      return fs.readFileSync(join(SERVE_FROM, allMatchedFilenames[0]));
    } catch (exception) {
      console.error(exception);
      return null;
    }
  }

  return null;
}

/** middleware */
module.exports = (req, res, next) => {
  // リクエストを元に読み取るjsonのパスをパースする
  const possiblePaths = parse(req);

  // 共通のheaderを設定
  res.setHeader("Accept", "application/json");
  res.setHeader('Content-Type', 'application/json');
  // デバッグ用にパース結果を返す
  res.setHeader('X-Debug-Paths', possiblePaths.join(','));

  // リクエストされたパスに合致するjsonがあれば、それを返す
  for (const path of possiblePaths) {
    const json = getJsonFromPath(path);
    if (json !== null) {
      res.setHeader('X-Path', `${path}.json`);
      res.statusCode = 200;
      res.end(json);
      next();
      return;
    }
  }

  // jsonが見つからなかったら404を返す
  res.statusCode = 404;
  res.end(JSON.stringify({
    result: false,
    message: 'JSON not found.',
    checkedPaths: possiblePaths
  }, undefined, 2));

  next();
};
