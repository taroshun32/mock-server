/**
* @file APIのモックjsonを返すミドルウェア
*/

const fs = require('fs');
const join = require('path').join;

/** モックjsonの配置先 */
const SERVE_FROM_MOCK = join(__dirname, '../../mock-json/');
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
* 引数で受けた情報を持つレスポンスを返す
* @param {Response} response
* @param {File} json
* @param {number} statusCode
* @param {string} path
*/
function setResponseContents(response, json, statusCode, path) {
  if (json !== null) {
    response.setHeader('X-Resource', `${path}.json`);
    response.statusCode = statusCode;
    response.end(json);
    return response;
  }
}

/**
* 指定したパスのjsonファイルを探して読み取る
* @param {string} path
* @param {string} [dirForTest='']
* @return {*}
*/
function getJsonFromPath(path, dirForTest = '') {
  // jsonの配置先
  const searchPath = join(SERVE_FROM_MOCK, dirForTest);

  // 配置先のディレクトリが存在しているかチェックする
  if (!fs.existsSync(searchPath)) {
    if (dirForTest !== '') {
      return getJsonFromPath(path);
    }
    return null;
  }
  // 配置先にあるjsonのファイル名一覧
  const dir = fs.readdirSync(searchPath);

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
      return fs.readFileSync(join(searchPath, allMatchedFilenames[0]));
    } catch (exception) {
      console.error(exception);
      return null;
    }
  }

  // テスト用のディレクトリを指定していて見つからなかった場合は、本来の配置先にフォールバックする
  if (dirForTest !== '') {
    return getJsonFromPath(path);
  }

  return null;
}

/** middleware */
module.exports = (req, res) => {
  // リクエストを元に読み取るjsonのパスをパースする
  const possiblePaths = parse(req);

  // 共通のheaderを設定
  res.setHeader("Accept", "application/json");
  res.setHeader('Content-Type', 'application/json');
  // デバッグ用にパース結果を返す
  res.setHeader('X-Debug-Paths', possiblePaths.join(','));

  // リクエストされたパスに合致するjsonがあれば、それを返す
  for (const path of possiblePaths) {
    const dist = req.headers['dist']
    var json = null
    var response = null
    json = getJsonFromPath(path, dist);
    response = setResponseContents(res, json, 200, path);
    if (response != null) {
      return response;
    }
  }

  // jsonが見つからなかったら404を返す
  res.statusCode = 404;
  res.end(JSON.stringify({
    result: false,
    message: 'JSON not found.',
    checkedPaths: possiblePaths
  }, undefined, 2));
};
