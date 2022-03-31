# 接口定义

Go-doudou没有重新造轮子，直接采用Go语言接口类型来做为接口描述语言IDL。用户可以在Go语言接口类型里定义方法，来让go-doudou生成对应的接口代码。

## 优势
- 对go-doudou的用户来说，易学易上手
- 对go-doudou开发者来说，Go语言编译器可以帮我们做语法检查，IDE可以为我们提供语法高亮，省去了开发IDL和IDE插件的工作量

## 劣势
用接口方法作为接口描述语言存在一些局限性。

1. 仅支持生成`GET`, `POST`, `PUT`, `DELETE`接口。默认是`POST`接口。你可以给方法名加上`Get`/`Post`/`Put`/`Delete`前缀，指定接口的http请求方法。
2. 方法签名第一个入参必须是`context.Context`。
3. 方法签名中的入参和出参仅支持绝大多数常见的Go语言[内建类型](https://golang.org/pkg/builtin/)，字符串作为键的字典类型，`vo`包中的自定义结构体类型，以及相对应的切片和指针类型。
   当生成代码和`OpenAPI 3.0`的接口文档的时候，go-doudou只会扫描`vo`包中的结构体。如果方法签名中出现了在`vo`包之外定义的结构体类型，go-doudou是不知道它里面有哪些字段的。
4. 作为特例，你可以用`v3.FileModel`类型作为入参来上传文件，用`*os.File`类型作为出参来下载文件。
5. 不支持别名类型作为结构体的字段。
6. 不支持函数类型、通道类型和匿名结构体类型作为方法签名的入参和出参。
7. 只内建支持对必传参数的校验，没有对结构体字段的校验，需要自己实现。Go-doudou将指针类型的入参视为非必传，非指针类型的入参都视为必传。
8. 对于`OpenAPI 3.0`的接口文档生成：
	- 不支持请求头和响应头，全局参数以及权限校验。你可以把这些内容作为Go语言注释，写在接口声明的上方或者接口方法签名的上方，这些注释会作为`description`的值生成到接口文档里，然后显示在在线接口文档页面的相应位置。
	- 不支持[Tag Object](https://spec.openapis.org/oas/v3.0.3#tag-object), [Callback Object](https://spec.openapis.org/oas/v3.0.3#callback-object), [Discriminator Object](https://spec.openapis.org/oas/v3.0.3#discriminator-object), [XML Object](https://spec.openapis.org/oas/v3.0.3#xml-object), [Security Scheme Object](https://spec.openapis.org/oas/v3.0.3#security-scheme-object), [OAuth Flows Object](https://spec.openapis.org/oas/v3.0.3#oauth-flows-object), [OAuth Flow Object](https://spec.openapis.org/oas/v3.0.3#oauth-flow-object), [Security Requirement Object ](https://spec.openapis.org/oas/v3.0.3#security-requirement-object). 你可能并不会用到这些API，但我需要在这里提一下。

## 特殊类型

### 枚举

go-doudou 从v1.0.5起新增对枚举的支持。

#### 定义方法

1. 在`vo`包里定义一个基础类型的别名类型作为枚举类型，并且实现`github.com/unionj-cloud/go-doudou/toolkit/openapi/v3`包里的`IEnum`接口

```go
type IEnum interface {
	StringSetter(value string)
	StringGetter() string
	UnmarshalJSON(bytes []byte) error
	MarshalJSON() ([]byte, error)
}
```

2. 定义若干该枚举类型的常量

#### 示例代码

完整的demo代码，请移步 [go-doudou-tutorials/enumdemo](https://github.com/unionj-cloud/go-doudou-tutorials/tree/master/enumdemo)

```go
package vo

import "encoding/json"

//go:generate go-doudou name --file $GOFILE -o

type KeyboardLayout int

const (
	UNKNOWN KeyboardLayout = iota
	QWERTZ
	AZERTY
	QWERTY
)

func (k *KeyboardLayout) StringSetter(value string) {
	switch value {
	case "UNKNOWN":
		*k = UNKNOWN
	case "QWERTY":
		*k = QWERTY
	case "QWERTZ":
		*k = QWERTZ
	case "AZERTY":
		*k = AZERTY
	default:
		*k = UNKNOWN
	}
}

func (k *KeyboardLayout) StringGetter() string {
	switch *k {
	case UNKNOWN:
		return "UNKNOWN"
	case QWERTY:
		return "QWERTY"
	case QWERTZ:
		return "QWERTZ"
	case AZERTY:
		return "AZERTY"
	default:
		return "UNKNOWN"
	}
}

func (k *KeyboardLayout) UnmarshalJSON(bytes []byte) error {
	var _k string
	err := json.Unmarshal(bytes, &_k)
	if err != nil {
		return err
	}
	k.StringSetter(_k)
	return nil
}

func (k KeyboardLayout) MarshalJSON() ([]byte, error) {
	return json.Marshal(k.StringGetter())
}

type Keyboard struct {
	Layout  KeyboardLayout `json:"layout,omitempty"`
	Backlit bool            `json:"backlit,omitempty"`
}
```

## 示例代码
```go
package service

import (
	"context"
	v3 "github.com/unionj-cloud/go-doudou/openapi/v3"
	"os"
	"usersvc/vo"
)

// Usersvc是用户管理服务
// 你需要设置Authentication请求头，带上bearer token参数来访问被保护的接口，如用户信息查询接口、用户分页查询接口和上传头像接口。
// 你可以在这里加上服务整体的文档说明
type Usersvc interface {
	// PageUsers 用户分页查询接口
	// 演示如何定义post请求的，application/json类型的接口
	PageUsers(ctx context.Context,
		// pagination parameter
		query vo.PageQuery) (
		// pagination result
		data vo.PageRet,
		// error
		err error)

	// GetUser 用户详情接口
	// 演示如何定义get请求的，带查询字符串参数的接口
	GetUser(ctx context.Context,
		// user id
		userId int) (
		// user detail
		data vo.UserVo,
		// error
		err error)

	// PublicSignUp 用户注册接口
	// 演示如何定义post请求的，application/x-www-form-urlencoded类型的接口
	PublicSignUp(ctx context.Context,
		// username
		username string,
		// password
		password string,
		// image code, optional as it is pointer type
		code *string,
	) (
		// return OK if success
		data string, err error)

	// PublicLogIn 用户登录接口
	// 演示如何定义post请求的，application/x-www-form-urlencoded类型的接口
	PublicLogIn(ctx context.Context,
		// username
		username string,
		// password
		password string) (
		// token
		data string, err error)

	// UploadAvatar 头像上传接口
	// 演示如何定义文件上传接口
	// 注意：必须要有至少一个v3.FileModel类型或[]v3.FileModel类型的入参
	UploadAvatar(ctx context.Context,
		// user avatar
		avatar v3.FileModel, id int) (
		// return OK if success
		data string, err error)

	// GetPublicDownloadAvatar 头像下载接口
	// 演示如何定义文件下载接口
	// 注意：一定要有一个且仅有一个*os.File类型的出参
	GetPublicDownloadAvatar(ctx context.Context,
		// user id
		userId int) (
		// avatar file
		data *os.File, err error)
}
```