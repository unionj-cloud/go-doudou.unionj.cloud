# Migrating from v0.x

As we want more developers to join us to contribute to go-doudou and read its source code more easily, we make some breaking changes.

- Separated CLI part and framework part to `cmd` package and `framework` package respectively

- Moved all kinds of util packages to `toolkit` package

- Loading dotenv files in `init` function from `github.com/unionj-cloud/go-doudou/framework/internal/config` package

- Unexported built-in http middlewares like `Tracing`, `Metrics`, `Rest`, `Recovery` and `Logger`, and add them to `mux` along with third-party middlewares `handlers.CompressHandler`, `requestid.RequestIDHandler` and `handlers.ProxyHeaders` by default to support these features out-of-box.

You may also need to correct import paths to clear compile errors. Here is a table for your reference.


| v0.x                    | v1.x                                        |                                               
| ----------------------- |---------------------------------------------|
| `github.com/unionj-cloud/go-doudou/svc/`            | `github.com/unionj-cloud/go-doudou/framework/` |
| `github.com/unionj-cloud/go-doudou/svc/config`            | moved to `github.com/unionj-cloud/go-doudou/framework/internal/config` package, so it can't be imported to your code anymore  |


