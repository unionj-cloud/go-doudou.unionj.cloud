# Define API

Go-doudou uses golang interface as IDL to let users define APIs.

## Benefits
- For go-doudou users, have a flattened learning curve.
- For go-doudou developers, no need to develop new DSL and IDE plugins, which saves a lot of work.

## Limitations
There are some limitations when you define methods as exposed API for client in svc.go file.

1. Only support `GET`, `POST`, `PUT`, `DELETE` http methods. You can specify http method by prefixing method name with one of `Get`/`Post`/`Put`/`Delete`. 
If you don't specify, default is `POST`.
2. First input parameter MUST be `context.Context`.
3. Only support most of golang [built-in types](https://golang.org/pkg/builtin/), map with string key, custom structs in vo
   package, corresponding slice and pointer types for input and output parameters. When generate code and
   OpenAPI 3.0 spec, it will scan structs in vo package only. The structs placed in other than vo package will not be known by go-doudou.
4. As a special case, it supports `v3.FileModel` for uploading files as input parameter and `*os.File` for downloading files as output parameter.
5. NOT support alias types as field of struct.
6. NOT support func, channel and anonymous struct type as input and output parameter.
7. Only request parameter `required` validation feature built-in, no struct field validation. Go-doudou treats pointer type as optional, non-pointer type as required. 
8. As for OpenAPI 3.0 documentation
	- Not support documenting request headers and response headers, global parameters and authentication. You can write down these information 
as golang comments immediately above service interface or corresponding methods in `svc.go` file, and these comments will be set to each `description` attribute in generated OpenAPI 3.0 json file and also be displayed in online api documentation.
	- Not support [Tag Object](https://spec.openapis.org/oas/v3.0.3#tag-object), [Callback Object](https://spec.openapis.org/oas/v3.0.3#callback-object), [Discriminator Object](https://spec.openapis.org/oas/v3.0.3#discriminator-object), [XML Object](https://spec.openapis.org/oas/v3.0.3#xml-object), [Security Scheme Object](https://spec.openapis.org/oas/v3.0.3#security-scheme-object), [OAuth Flows Object](https://spec.openapis.org/oas/v3.0.3#oauth-flows-object), [OAuth Flow Object](https://spec.openapis.org/oas/v3.0.3#oauth-flow-object), [Security Requirement Object ](https://spec.openapis.org/oas/v3.0.3#security-requirement-object). You may not need them, but I should mention here.

## Special Types

### Enum

go-doudou supports enum type since v1.0.5

#### How

1. Define an alias type of any golang basic type as enum type, and implement `IEnum` interface from `github.com/unionj-cloud/go-doudou/toolkit/openapi/v3` package

```go
type IEnum interface {
	StringSetter(value string)
	StringGetter() string
	UnmarshalJSON(bytes []byte) error
	MarshalJSON() ([]byte, error)
}
```

2. Define several const variables of this enum type

#### Demo

Please visit [go-doudou-tutorials/enumdemo](https://github.com/unionj-cloud/go-doudou-tutorials/tree/master/enumdemo) to see full demo source code.

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

## Example
```go
package service

import (
	"context"
	v3 "github.com/unionj-cloud/go-doudou/openapi/v3"
	"os"
	"usersvc/vo"
)

// Usersvc is user management service
// You should set Bearer Token header when you request protected endpoints such as user detail, user pagination and upload avatar.
// You can add doc for whole service here
type Usersvc interface {
	// PageUsers is user pagination api
	// demo how to define post request api which accepts application/json content-type
	PageUsers(ctx context.Context,
		// pagination parameter
		query vo.PageQuery) (
		// pagination result
		data vo.PageRet,
		// error
		err error)

	// GetUser is user detail api
	// demo how to define get http request with query string parameters
	GetUser(ctx context.Context,
		// user id
		userId int) (
		// user detail
		data vo.UserVo,
		// error
		err error)

	// PublicSignUp is user signup api
	// demo how to define post request api which accepts application/x-www-form-urlencoded content-type
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

	// PublicLogIn is user login api
	// demo how to do authentication and issue token
	PublicLogIn(ctx context.Context,
		// username
		username string,
		// password
		password string) (
		// token
		data string, err error)

	// UploadAvatar is avatar upload api
	// demo how to define file upload api
	// NOTE: there must be at least one []*v3.FileModel or *v3.FileModel input parameter
	UploadAvatar(ctx context.Context,
		// user avatar
		avatar v3.FileModel, id int) (
		// return OK if success
		data string, err error)

	// GetPublicDownloadAvatar is avatar download api
	// demo how to define file download api
	// NOTE: there must be one and at most one *os.File output parameter
	GetPublicDownloadAvatar(ctx context.Context,
		// user id
		userId int) (
		// avatar file
		data *os.File, err error)
}
```