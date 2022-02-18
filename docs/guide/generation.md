# Generation Behaviors

Besides understanding `go-doudou` CLI flags and subcommands usage, you should also know generation behaviors on generated files. I group them into three kind of behaviors `Incremental Generation`, `Overwritten Generation` and `Skip Generation`.

## Incremental Generation

- `svcimpl.go`: Every time you run `go-doudou svc http`, existing code in it will not be overwritten, only new code will be appended to the end. So you can feel free to remove the generated code and write your own to fit your need. You will not lost any code, even rerun this command again and again as your will.

- `transport/httpsrv/handlerimpl.go`: Every time you run `go-doudou svc http` with `--handler` flag, existing code in it will not be overwritten, only new code will be appended to the end. So you can feel free to remove the generated code and write your own to fit your need. You will not lost any code, even rerun this command again and again as your will.

- `client/clientproxy.go`: Every time you run `go-doudou svc http` with `-c` flag, existing code in it will not be overwritten, only new code will be appended to the end. So you can feel free to remove the generated code and write your own to fit your need. You will not lost any code, even rerun this command again and again as your will.

## Overwritten Generation

- `transport/httpsrv/handler.go`: Every time you run `go-doudou svc http`, existing code in it will be overwritten. So don't edit it.

- `client/client.go`: Every time you run `go-doudou svc http` with `-c` flag, existing code in it will be overwritten. So don't edit it.

- `${service}_openapi3.go`: Every time you run `go-doudou svc http` with `--doc` flag, existing code in it will be overwritten. So don't edit it.

- `${service}_openapi3.json`: Every time you run `go-doudou svc http` with `--doc` flag, existing code in it will be overwritten. So don't edit it.

## Skip Generation

The other files will be skipped if they have been already generated.