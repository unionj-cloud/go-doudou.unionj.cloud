# 如何在go-doudou应用中使用枚举类型

我们都知道go语言没有原生的枚举类型，但是做业务开发有些时候没有枚举类型确实不方便前后端联调。我们可以通过go语言支持的语法自己实现枚举类型。请看以下示例代码和注释说明：

```go
// 首先定义一个int类型别名，新类型名称就是枚举类型名称
type KeyboardLayout int

// 然后定义若干常量，作为枚举值
// 第一个常量是默认值
const (
	UNKNOWN KeyboardLayout = iota
	QWERTZ
	AZERTY
	QWERTY
)

// 再定义setter方法将传入字符串类型枚举值转成上面定义的常量
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

// 有setter自然就有getter
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

// 最后再定义一组UnmarshalJSON和MarshalJSON方法
// UnmarshalJSON用于json反序列化
func (k *KeyboardLayout) UnmarshalJSON(bytes []byte) error {
	var _k string
	err := json.Unmarshal(bytes, &_k)
	if err != nil {
		return err
	}
	k.StringSetter(_k)
	return nil
}

// MarshalJSON用于json序列化
func (k KeyboardLayout) MarshalJSON() ([]byte, error) {
	return json.Marshal(k.StringGetter())
}
```

定义以后就可以直接用作结构体的属性类型或是接口请求参数类型。

结构体类型示例：

```go
type Keyboard struct {
	Layout  KeyboardLayout `json:"layout,omitempty"`
	Backlit bool            `json:"backlit,omitempty"`
}
```

接口请求参数示例：

```go
type EnumDemo interface {
	GetKeyboard(ctx context.Context, layout vo.KeyboardLayout) (data string, err error)
	GetKeyboard2(ctx context.Context, layout *vo.KeyboardLayout) (data string, err error)
	GetKeyboards(ctx context.Context, layout []vo.KeyboardLayout) (data []string, err error)
	GetKeyboards2(ctx context.Context, layout *[]vo.KeyboardLayout) (data []string, err error)
	GetKeyboards5(ctx context.Context, layout ...vo.KeyboardLayout) (data []string, err error)
	Keyboard(ctx context.Context, keyboard vo.Keyboard) (data string, err error)
}
```

完整示例代码：[https://github.com/unionj-cloud/go-doudou-tutorials/tree/master/enumdemo](https://github.com/unionj-cloud/go-doudou-tutorials/tree/master/enumdemo)