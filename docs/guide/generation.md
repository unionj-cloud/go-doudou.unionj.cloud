# 代码生成规则

除了理解`go-doudou`命令行工具的用法，你还需要了解代码生成规则。我将规则分成了三类：“增量生成”，“覆盖生成”，“局部修改”和“跳过”。

## 增量生成

- `svcimpl.go`: 每次执行`go-doudou svc http`命令，已有代码不会被覆盖，只会在文件末尾新增代码，所以你可以自由修改生成的代码以适应你的业务需求。重复执行此命令，不会让你丢失任何人工编写的代码。

- `transport/httpsrv/handlerimpl.go`: 每次执行带上`--handler`参数的`go-doudou svc http`命令，已有代码不会被覆盖，只会在文件末尾新增代码，所以你可以自由修改生成的代码以适应你的业务需求。重复执行此命令，不会让你丢失任何人工编写的代码。

- `client/clientproxy.go`: 每次执行带上`-c`参数的`go-doudou svc http`命令，已有代码不会被覆盖，只会在文件末尾新增代码，所以你可以自由修改生成的代码以适应你的业务需求。重复执行此命令，不会让你丢失任何人工编写的代码。

## 覆盖生成

- `transport/httpsrv/handler.go`: 每次执行`go-doudou svc http`命令，会重新生成代码，所以请不要人工修改此文件，所有人工修改或编写的代码都会丢失。

- `client/client.go`: 每次执行带上`-c`参数的`go-doudou svc http`命令，会重新生成代码，所以请不要人工修改此文件，所有人工修改或编写的代码都会丢失。

- `client/iclient.go`: 每次执行带上`-c`参数的`go-doudou svc http`命令，会重新生成代码，所以请不要人工修改此文件，所有人工修改或编写的代码都会丢失。

- `${service}_openapi3.go`: 每次执行带上`--doc`参数的`go-doudou svc http`命令，会重新生成代码，所以请不要人工修改此文件，所有人工修改或编写的代码都会丢失。

- `${service}_openapi3.json`: 每次执行带上`--doc`参数的`go-doudou svc http`命令，会重新生成代码，所以请不要人工修改此文件，所有人工修改或编写的代码都会丢失。

- `transport/grpc/${service}.pb.go`: 每次执行`go-doudou svc grpc`命令，会重新生成代码，所以请不要人工修改此文件，所有人工修改或编写的代码都会丢失。

- `transport/grpc/${service}.proto`: 每次执行`go-doudou svc grpc`命令，会重新生成代码，所以请不要人工修改此文件，所有人工修改或编写的代码都会丢失。

- `transport/grpc/${service}_grpc.pb.go`: 每次执行`go-doudou svc grpc`命令，会重新生成代码，所以请不要人工修改此文件，所有人工修改或编写的代码都会丢失。

- `transport/grpc/annotation.go`: 每次执行`go-doudou svc grpc`命令，会重新生成代码，所以请不要人工修改此文件，所有人工修改或编写的代码都会丢失。

## 局部修改

- `${service}_deployment.yaml`: 每次执行`go-doudou svc push`命令，会更新`image`属性的值，即更新镜像名

- `${service}_statefulset.yaml`: 每次执行`go-doudou svc push`命令，会更新`image`属性的值，即更新镜像名

## 跳过

其他文件如果已经存在，都会跳过。