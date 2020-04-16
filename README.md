# mock-server
mock-json に従いレスポンスを返却するモックサーバ

## Jsonファイル命名規則(standard-swaggerのCIで実行)
■ 方針
- swaggerで定義したAPIのパスをベースとする
- prefixはメソッド名を付与
- "/"や繋ぎの部分は"-"区切り
- パスパラメータも"-"繋ぎ
- パスパラメータはprefixとして"_"を加える
- 階層化せずフラットに配置