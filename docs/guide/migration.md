# Migrating from v0.x

As we want more developers to join us to contribute to go-doudou and read its source code more easily, we make some breaking changes.

- Separated CLI part and framework part to `cmd` package and `framework` package respectively

- Moved all kinds of util packages to `toolkit` package

- Loading dotenv files in `init` function from `github.com/unionj-cloud/go-doudou/framework/internal/config` package

- Unexported built-in http middlewares like `Tracing`, `Metrics`, `Rest`, `Recovery` and `Logger`, and add them to `mux` along with third-party middlewares `handlers.CompressHandler`, `requestid.RequestIDHandler` and `handlers.ProxyHeaders` by default to support these features out-of-box. For flexibility, we also expose a new api `PreMiddleware` for inserting your custom middleware to the front of chain.

You may also need to correct import paths to clear compile errors. Here is a table for your reference.


| v0.x                    | v1.x                                        |                                               
| ----------------------- |---------------------------------------------|
| `github.com/unionj-cloud/go-doudou/svc/`            | `github.com/unionj-cloud/go-doudou/framework/` |
| `github.com/unionj-cloud/go-doudou/svc/config`      | moved to `github.com/unionj-cloud/go-doudou/framework/internal/config` package, so it can't be imported to your project anymore.  |
| `ddconfig.InitEnv()`      | get rid of `ddconfig.InitEnv()` from `main` function  |
| `if ddconfig.GddMode.Load() == "micro" {`      | `if os.Getenv("GDD_MODE") == "micro" {`. The name of environment variable `GDD_MODE` is arbitrary.
| `srv.AddMiddleware(ddhttp.Tracing, ddhttp.Metrics, requestid.RequestIDHandler, handlers.CompressHandler, handlers.ProxyHeaders, ddhttp.Logger, yourCustomMiddleware, ddhttp.Rest, ddhttp.Recover)`      | `srv.AddMiddleware(yourCustomMiddleware)`. Get rid of `ddhttp.Tracing`, `ddhttp.Metrics`, `requestid.RequestIDHandler`, `handlers.CompressHandler`, `handlers.ProxyHeaders`, `ddhttp.Logger`, `ddhttp.Rest`, `ddhttp.Recover`. They have been already built-in go-doudou.
| `github.com/unionj-cloud/go-doudou/ddl/`      | `github.com/unionj-cloud/go-doudou/toolkit/sqlext/`
| `github.com/unionj-cloud/go-doudou/*utils`      | `github.com/unionj-cloud/go-doudou/toolkit/*utils`
| `github.com/unionj-cloud/go-doudou/cast`      | `github.com/unionj-cloud/go-doudou/toolkit/cast`
| `github.com/unionj-cloud/go-doudou/openapi/v3`      | `github.com/unionj-cloud/go-doudou/toolkit/openapi/v3`
| `github.com/unionj-cloud/go-doudou/copier`      | `github.com/unionj-cloud/go-doudou/toolkit/copier`

