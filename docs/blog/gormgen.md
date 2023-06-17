---
sidebar: auto
---

# go后端开发神器来了！基于gorm从数据库一键生成RESTful和gRPC微服务

![image.png](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/f500ce4a07c64f59900b5c25d783a486~tplv-k3u1fbpfcp-watermark.image?)
Photo by [NEOM](https://unsplash.com/@neom?utm_source=unsplash\&utm_medium=referral\&utm_content=creditCopyText) on [Unsplash](https://unsplash.com/photos/0SUho_B0nus?utm_source=unsplash\&utm_medium=referral\&utm_content=creditCopyText)

在绝大多数的后端开发的职业生涯中，日常工作还是主要围绕业务写数据库CRUD相关的接口。我们从自身业务开发实际出发，给go-doudou v2.1.4版本增加了一个新特性：基于gorm从数据库一键生成RESTful和gRPC服务，来帮助广大go语言开发者更快更好的实现需求，快速上线。这一特性目前设计和支持了以下6类接口：

```go
Post{{.ModelStructName}}(ctx context.Context, body dto.{{.ModelStructName}}) (data {{.PriKeyType}}, err error)

Post{{.ModelStructName}}s(ctx context.Context, body []dto.{{.ModelStructName}}) (data []{{.PriKeyType}}, err error)

Get{{.ModelStructName}}_Id(ctx context.Context, id {{.PriKeyType}}) (data dto.{{.ModelStructName}}, err error)

Put{{.ModelStructName}}(ctx context.Context, body dto.{{.ModelStructName}}) error

Delete{{.ModelStructName}}_Id(ctx context.Context, id {{.PriKeyType}}) error

Get{{.ModelStructName}}s(ctx context.Context, parameter dto.Parameter) (data dto.Page, err error)
```

*   `PostXXX`：单条数据新增接口
*   `PostXXXs`：批量数据新增接口
*   `GetXXX_Id`：根据主键ID查询单条数据接口
*   `PutXXX`：根据主键ID更新单条数据接口
*   `DeleteXXX_Id`：根据主键ID删除单条数据接口
*   `GetXXXs`：分页查询接口

后续还会根据实际需求新增更多的常用接口。下面看一个代码生成的命令示例，并介绍一下命令行参数的含义：

```shell
go-doudou svc init myproject --db_driver mysql --db_dsn "root:1234@tcp(127.0.0.1:3306)/tutorial?charset=utf8mb4&parseTime=True&loc=Local" --db_soft delete_at --db_grpc
```

*   `go-doudou svc init myproject`：该命令表示初始化或者增量更新myproject项目，如果myproject文件夹不存在，会自动创建。如果`go-doudou svc init`后面没有跟文件夹路径或项目名称，则会默认直接将代码生成在当前文件夹路径下。该命令是两用的，既可以初始化并生成全套代码，也可以用于在后续项目迭代过程中增量生成代码。
*   `--db_driver`：设置数据库driver，支持的参数值有mysql，postgres，sqlite，sqlserver和tidb。
*   `--db_dsn`：设置数据库连接地址，注意需要前后加双引号
*   `--db_soft`：设置表示软删除的字段，默认值是`deleted_at`，即数据库表结构里必须有`--db_soft`指定的字段才会用上gorm的软删除机制
*   `--db_grpc`：设置是否生成gRPC全套服务代码，默认值是`false`
*   另外还有一个参数`--db_table_prefix`，主要用于PostgreSQL，指定schema名称

`go-doudou svc init`命令还有一些其他功能和命令行参数，感兴趣的话可以执行命令`go-doudou svc init --help`查看。

我们使用这一特性的流程一般是先通过navicat等数据库图形化管理工具创建模型，然后执行go-doudou命令生成全套代码，随着需求的增加和项目的持续迭代增加新表，再执行go-doudou命令增量生成代码。此功能不会修改或者覆盖任何手工自定义的接口和代码，完全的增量生成，可以放心使用！下面我们动手实践一下吧！

我们以PostgreSQL为例，先创建一个数据库testpg，`create database testpg;`，然后将下面的DDL语句导入即可。
```sql
-- Create "address" table
CREATE TABLE "address" ("id" bigserial NOT NULL, "uid" bigint NULL DEFAULT 0, "phone" character varying(30) NULL DEFAULT '', "name" character varying(30) NULL DEFAULT '', "zipcode" character varying(20) NULL DEFAULT '', "address" character varying(250) NULL DEFAULT '', "default_address" bigint NULL DEFAULT 0, "add_time" bigint NULL DEFAULT 0, PRIMARY KEY ("id"));
-- Set comment to table: "address"
COMMENT ON TABLE "address" IS '地址信息';
-- Set comment to column: "id" on table: "address"
COMMENT ON COLUMN "address" ."id" IS '主键';
-- Set comment to column: "uid" on table: "address"
COMMENT ON COLUMN "address" ."uid" IS '用户编号';
-- Set comment to column: "phone" on table: "address"
COMMENT ON COLUMN "address" ."phone" IS '用户手机';
-- Set comment to column: "name" on table: "address"
COMMENT ON COLUMN "address" ."name" IS '用户名字';
-- Set comment to column: "zipcode" on table: "address"
COMMENT ON COLUMN "address" ."zipcode" IS '邮政编码';
-- Set comment to column: "address" on table: "address"
COMMENT ON COLUMN "address" ."address" IS '地址';
-- Set comment to column: "default_address" on table: "address"
COMMENT ON COLUMN "address" ."default_address" IS '默认地址';
-- Set comment to column: "add_time" on table: "address"
COMMENT ON COLUMN "address" ."add_time" IS '添加时间';
-- Create "administrator" table
CREATE TABLE "administrator" ("id" bigserial NOT NULL, "username" character varying(100) NULL DEFAULT '', "password" character varying(100) NULL DEFAULT '', "mobile" character varying(100) NULL, "email" character varying(50) NULL DEFAULT '', "status" smallint NULL DEFAULT 0, "role_id" bigint NULL DEFAULT 0, "add_time" bigint NULL DEFAULT 0, "is_super" smallint NULL DEFAULT 0, PRIMARY KEY ("id"));
-- Set comment to table: "administrator"
COMMENT ON TABLE "administrator" IS '管理员表';
-- Set comment to column: "username" on table: "administrator"
COMMENT ON COLUMN "administrator" ."username" IS '用户名';
-- Set comment to column: "password" on table: "administrator"
COMMENT ON COLUMN "administrator" ."password" IS '密码';
-- Set comment to column: "mobile" on table: "administrator"
COMMENT ON COLUMN "administrator" ."mobile" IS '手机号';
-- Set comment to column: "email" on table: "administrator"
COMMENT ON COLUMN "administrator" ."email" IS '邮箱';
-- Set comment to column: "status" on table: "administrator"
COMMENT ON COLUMN "administrator" ."status" IS '状态';
-- Set comment to column: "role_id" on table: "administrator"
COMMENT ON COLUMN "administrator" ."role_id" IS '角色编号';
-- Set comment to column: "add_time" on table: "administrator"
COMMENT ON COLUMN "administrator" ."add_time" IS '添加时间';
-- Set comment to column: "is_super" on table: "administrator"
COMMENT ON COLUMN "administrator" ."is_super" IS '是否超级管理员';
-- Create "auth" table
CREATE TABLE "auth" ("id" bigserial NOT NULL, "module_name" character varying(80) NOT NULL DEFAULT '', "action_name" character varying(80) NULL DEFAULT '', "type" boolean NULL DEFAULT false, "url" character varying(250) NULL DEFAULT '', "module_id" bigint NULL DEFAULT 0, "sort" bigint NULL DEFAULT 0, "description" character varying(250) NULL DEFAULT '', "status" boolean NULL DEFAULT false, "add_time" bigint NULL DEFAULT 0, "checked" boolean NULL DEFAULT false, PRIMARY KEY ("id"));
-- Set comment to table: "auth"
COMMENT ON TABLE "auth" IS '权限控制';
-- Set comment to column: "action_name" on table: "auth"
COMMENT ON COLUMN "auth" ."action_name" IS '操作名称';
-- Set comment to column: "type" on table: "auth"
COMMENT ON COLUMN "auth" ."type" IS '节点类型';
-- Set comment to column: "url" on table: "auth"
COMMENT ON COLUMN "auth" ."url" IS '跳转地址';
-- Set comment to column: "module_id" on table: "auth"
COMMENT ON COLUMN "auth" ."module_id" IS '模块编号';
-- Set comment to column: "sort" on table: "auth"
COMMENT ON COLUMN "auth" ."sort" IS '排序';
-- Set comment to column: "description" on table: "auth"
COMMENT ON COLUMN "auth" ."description" IS '描述';
-- Set comment to column: "status" on table: "auth"
COMMENT ON COLUMN "auth" ."status" IS '状态';
-- Set comment to column: "add_time" on table: "auth"
COMMENT ON COLUMN "auth" ."add_time" IS '添加时间';
-- Set comment to column: "checked" on table: "auth"
COMMENT ON COLUMN "auth" ."checked" IS '是否检验';
-- Create "banner" table
CREATE TABLE "banner" ("id" bigserial NOT NULL, "title" character varying(50) NULL DEFAULT '', "banner_type" smallint NULL DEFAULT 0, "banner_img" character varying(100) NULL DEFAULT '', "link" character varying(200) NULL DEFAULT '', "sort" bigint NULL DEFAULT 0, "status" bigint NULL DEFAULT 0, "add_time" bigint NULL DEFAULT 0, PRIMARY KEY ("id"));
-- Set comment to table: "banner"
COMMENT ON TABLE "banner" IS '焦点图表';
-- Set comment to column: "id" on table: "banner"
COMMENT ON COLUMN "banner" ."id" IS '主键';
-- Set comment to column: "title" on table: "banner"
COMMENT ON COLUMN "banner" ."title" IS '标题';
-- Set comment to column: "banner_type" on table: "banner"
COMMENT ON COLUMN "banner" ."banner_type" IS '类型';
-- Set comment to column: "banner_img" on table: "banner"
COMMENT ON COLUMN "banner" ."banner_img" IS '图片地址';
-- Set comment to column: "link" on table: "banner"
COMMENT ON COLUMN "banner" ."link" IS '连接';
-- Set comment to column: "sort" on table: "banner"
COMMENT ON COLUMN "banner" ."sort" IS '排序';
-- Set comment to column: "status" on table: "banner"
COMMENT ON COLUMN "banner" ."status" IS '状态';
-- Set comment to column: "add_time" on table: "banner"
COMMENT ON COLUMN "banner" ."add_time" IS '添加时间';
-- Create "cart" table
CREATE TABLE "cart" ("id" bigserial NOT NULL, "title" character varying(250) NULL DEFAULT '', "price" numeric(10,2) NULL DEFAULT 0.00, "goods_version" character varying(50) NULL DEFAULT '', "num" bigint NULL DEFAULT 0, "product_gift" character varying(100) NULL DEFAULT '', "product_fitting" character varying(100) NULL DEFAULT '', "product_color" character varying(50) NULL DEFAULT '', "product_img" character varying(150) NULL DEFAULT '', "product_attr" character varying(100) NULL DEFAULT '', PRIMARY KEY ("id"));
-- Set comment to table: "cart"
COMMENT ON TABLE "cart" IS '购物车';
-- Set comment to column: "id" on table: "cart"
COMMENT ON COLUMN "cart" ."id" IS '主键';
-- Set comment to column: "title" on table: "cart"
COMMENT ON COLUMN "cart" ."title" IS '标题';
-- Set comment to column: "goods_version" on table: "cart"
COMMENT ON COLUMN "cart" ."goods_version" IS '版本';
-- Set comment to column: "num" on table: "cart"
COMMENT ON COLUMN "cart" ."num" IS '数量';
-- Set comment to column: "product_gift" on table: "cart"
COMMENT ON COLUMN "cart" ."product_gift" IS '商品礼物';
-- Set comment to column: "product_fitting" on table: "cart"
COMMENT ON COLUMN "cart" ."product_fitting" IS '商品搭配';
-- Set comment to column: "product_color" on table: "cart"
COMMENT ON COLUMN "cart" ."product_color" IS '商品颜色';
-- Set comment to column: "product_img" on table: "cart"
COMMENT ON COLUMN "cart" ."product_img" IS '商品图片';
-- Set comment to column: "product_attr" on table: "cart"
COMMENT ON COLUMN "cart" ."product_attr" IS '商品属性';
-- Create "menu" table
CREATE TABLE "menu" ("id" bigserial NOT NULL, "title" character varying(100) NULL DEFAULT '', "link" character varying(250) NULL DEFAULT '', "position" bigint NULL DEFAULT 0, "is_opennew" bigint NULL DEFAULT 0, "relation" character varying(100) NULL DEFAULT '', "sort" bigint NULL DEFAULT 0, "status" bigint NULL DEFAULT 0, "add_time" bigint NULL DEFAULT 0, PRIMARY KEY ("id"));
-- Set comment to column: "id" on table: "menu"
COMMENT ON COLUMN "menu" ."id" IS '编号';
-- Set comment to column: "title" on table: "menu"
COMMENT ON COLUMN "menu" ."title" IS '标题';
-- Set comment to column: "link" on table: "menu"
COMMENT ON COLUMN "menu" ."link" IS '连接';
-- Set comment to column: "position" on table: "menu"
COMMENT ON COLUMN "menu" ."position" IS '位置';
-- Set comment to column: "is_opennew" on table: "menu"
COMMENT ON COLUMN "menu" ."is_opennew" IS '是否新打开';
-- Set comment to column: "relation" on table: "menu"
COMMENT ON COLUMN "menu" ."relation" IS '关系';
-- Set comment to column: "sort" on table: "menu"
COMMENT ON COLUMN "menu" ."sort" IS '排序';
-- Set comment to column: "status" on table: "menu"
COMMENT ON COLUMN "menu" ."status" IS '状态';
-- Set comment to column: "add_time" on table: "menu"
COMMENT ON COLUMN "menu" ."add_time" IS '添加时间';
-- Create "order" table
CREATE TABLE "order" ("id" bigserial NOT NULL, "order_id" character varying(100) NULL DEFAULT '', "uid" bigint NULL DEFAULT 0, "all_price" numeric(10,2) NULL DEFAULT 0.00, "phone" character varying(30) NULL DEFAULT '', "name" character varying(100) NULL DEFAULT '', "address" character varying(250) NULL DEFAULT '', "zipcode" character varying(30) NULL DEFAULT '', "pay_status" smallint NULL DEFAULT 0, "pay_type" smallint NULL DEFAULT 0, "order_status" smallint NULL DEFAULT 0, "add_time" bigint NULL DEFAULT 0, PRIMARY KEY ("id"));
-- Set comment to column: "id" on table: "order"
COMMENT ON COLUMN "order" ."id" IS '编号';
-- Set comment to column: "order_id" on table: "order"
COMMENT ON COLUMN "order" ."order_id" IS '订单编号';
-- Set comment to column: "uid" on table: "order"
COMMENT ON COLUMN "order" ."uid" IS '用户编号';
-- Set comment to column: "all_price" on table: "order"
COMMENT ON COLUMN "order" ."all_price" IS '价格';
-- Set comment to column: "phone" on table: "order"
COMMENT ON COLUMN "order" ."phone" IS '电话';
-- Set comment to column: "name" on table: "order"
COMMENT ON COLUMN "order" ."name" IS '名字';
-- Set comment to column: "address" on table: "order"
COMMENT ON COLUMN "order" ."address" IS '地址';
-- Set comment to column: "zipcode" on table: "order"
COMMENT ON COLUMN "order" ."zipcode" IS '邮编';
-- Set comment to column: "pay_status" on table: "order"
COMMENT ON COLUMN "order" ."pay_status" IS '支付状态';
-- Set comment to column: "pay_type" on table: "order"
COMMENT ON COLUMN "order" ."pay_type" IS '支付类型';
-- Set comment to column: "order_status" on table: "order"
COMMENT ON COLUMN "order" ."order_status" IS '订单状态';
-- Set comment to column: "add_time" on table: "order"
COMMENT ON COLUMN "order" ."add_time" IS '添加时间';
-- Create "order_item" table
CREATE TABLE "order_item" ("id" bigserial NOT NULL, "order_id" bigint NULL DEFAULT 0, "uid" bigint NULL DEFAULT 0, "product_title" character varying(100) NULL DEFAULT '', "product_id" bigint NULL DEFAULT 0, "product_img" character varying(200) NULL DEFAULT '', "product_price" numeric(10,2) NULL DEFAULT 0.00, "product_num" bigint NULL DEFAULT 0, "goods_version" character varying(100) NULL DEFAULT '', "goods_color" character varying(100) NULL DEFAULT '', "add_time" bigint NULL DEFAULT 0, PRIMARY KEY ("id"));
-- Set comment to column: "id" on table: "order_item"
COMMENT ON COLUMN "order_item" ."id" IS '订单编号';
-- Set comment to column: "order_id" on table: "order_item"
COMMENT ON COLUMN "order_item" ."order_id" IS '订单编号';
-- Set comment to column: "uid" on table: "order_item"
COMMENT ON COLUMN "order_item" ."uid" IS '用户编号';
-- Set comment to column: "product_title" on table: "order_item"
COMMENT ON COLUMN "order_item" ."product_title" IS '商品标题';
-- Set comment to column: "product_id" on table: "order_item"
COMMENT ON COLUMN "order_item" ."product_id" IS '商品编号';
-- Set comment to column: "product_img" on table: "order_item"
COMMENT ON COLUMN "order_item" ."product_img" IS '商品图片';
-- Set comment to column: "product_price" on table: "order_item"
COMMENT ON COLUMN "order_item" ."product_price" IS '商品价格';
-- Set comment to column: "product_num" on table: "order_item"
COMMENT ON COLUMN "order_item" ."product_num" IS '商品数量';
-- Set comment to column: "goods_version" on table: "order_item"
COMMENT ON COLUMN "order_item" ."goods_version" IS '商品版本';
-- Set comment to column: "goods_color" on table: "order_item"
COMMENT ON COLUMN "order_item" ."goods_color" IS '商品颜色';
-- Set comment to column: "add_time" on table: "order_item"
COMMENT ON COLUMN "order_item" ."add_time" IS '添加时间';
-- Create "product" table
CREATE TABLE "product" ("id" bigserial NOT NULL, "title" character varying(100) NULL DEFAULT '', "sub_title" character varying(100) NULL DEFAULT '', "product_sn" character varying(50) NULL DEFAULT '', "cate_id" bigint NULL DEFAULT 0, "click_count" bigint NULL DEFAULT 0, "product_number" bigint NULL DEFAULT 0, "price" numeric(10,2) NULL DEFAULT 0.00, "market_price" numeric(10,2) NULL DEFAULT 0.00, "relation_product" character varying(100) NULL DEFAULT '', "product_attr" character varying(100) NULL DEFAULT '', "product_version" character varying(100) NULL DEFAULT '', "product_img" character varying(100) NULL DEFAULT '', "product_gift" character varying(100) NULL DEFAULT '', "product_fitting" character varying(100) NULL DEFAULT '', "product_color" character varying(100) NULL DEFAULT '', "product_keywords" character varying(100) NULL DEFAULT '', "product_desc" character varying(50) NULL DEFAULT '', "product_content" character varying(100) NULL DEFAULT '', "is_delete" smallint NULL DEFAULT 0, "is_hot" smallint NULL DEFAULT 0, "is_best" smallint NULL DEFAULT 0, "is_new" smallint NULL DEFAULT 0, "product_type_id" smallint NULL DEFAULT 0, "sort" bigint NULL DEFAULT 0, "status" smallint NULL DEFAULT 0, "add_time" bigint NULL DEFAULT 0, PRIMARY KEY ("id"));
-- Set comment to table: "product"
COMMENT ON TABLE "product" IS '商品';
-- Set comment to column: "title" on table: "product"
COMMENT ON COLUMN "product" ."title" IS '标题';
-- Set comment to column: "sub_title" on table: "product"
COMMENT ON COLUMN "product" ."sub_title" IS '子标题';
-- Set comment to column: "cate_id" on table: "product"
COMMENT ON COLUMN "product" ."cate_id" IS '分类id';
-- Set comment to column: "click_count" on table: "product"
COMMENT ON COLUMN "product" ."click_count" IS '点击数';
-- Set comment to column: "product_number" on table: "product"
COMMENT ON COLUMN "product" ."product_number" IS '商品编号';
-- Set comment to column: "price" on table: "product"
COMMENT ON COLUMN "product" ."price" IS '价格';
-- Set comment to column: "market_price" on table: "product"
COMMENT ON COLUMN "product" ."market_price" IS '市场价格';
-- Set comment to column: "relation_product" on table: "product"
COMMENT ON COLUMN "product" ."relation_product" IS '关联商品';
-- Set comment to column: "product_attr" on table: "product"
COMMENT ON COLUMN "product" ."product_attr" IS '商品属性';
-- Set comment to column: "product_version" on table: "product"
COMMENT ON COLUMN "product" ."product_version" IS '商品版本';
-- Set comment to column: "product_img" on table: "product"
COMMENT ON COLUMN "product" ."product_img" IS '商品图片';
-- Set comment to column: "product_color" on table: "product"
COMMENT ON COLUMN "product" ."product_color" IS '商品颜色';
-- Set comment to column: "product_keywords" on table: "product"
COMMENT ON COLUMN "product" ."product_keywords" IS '关键词';
-- Set comment to column: "product_desc" on table: "product"
COMMENT ON COLUMN "product" ."product_desc" IS '描述';
-- Set comment to column: "product_content" on table: "product"
COMMENT ON COLUMN "product" ."product_content" IS '内容';
-- Set comment to column: "is_delete" on table: "product"
COMMENT ON COLUMN "product" ."is_delete" IS '是否删除';
-- Set comment to column: "is_hot" on table: "product"
COMMENT ON COLUMN "product" ."is_hot" IS '是否热门';
-- Set comment to column: "is_best" on table: "product"
COMMENT ON COLUMN "product" ."is_best" IS '是否畅销';
-- Set comment to column: "is_new" on table: "product"
COMMENT ON COLUMN "product" ."is_new" IS '是否新品';
-- Set comment to column: "product_type_id" on table: "product"
COMMENT ON COLUMN "product" ."product_type_id" IS '商品类型编号';
-- Set comment to column: "sort" on table: "product"
COMMENT ON COLUMN "product" ."sort" IS '商品分类';
-- Set comment to column: "status" on table: "product"
COMMENT ON COLUMN "product" ."status" IS '商品状态';
-- Set comment to column: "add_time" on table: "product"
COMMENT ON COLUMN "product" ."add_time" IS '添加时间';
-- Create "product_attr" table
CREATE TABLE "product_attr" ("id" bigserial NOT NULL, "product_id" bigint NULL DEFAULT 0, "attribute_cate_id" bigint NULL DEFAULT 0, "attribute_id" bigint NULL DEFAULT 0, "attribute_title" character varying(100) NULL DEFAULT '', "attribute_type" bigint NULL DEFAULT 0, "attribute_value" character varying(100) NULL DEFAULT '', "sort" bigint NULL DEFAULT 0, "add_time" bigint NULL DEFAULT 0, "status" smallint NULL DEFAULT 0, PRIMARY KEY ("id"));
-- Set comment to table: "product_attr"
COMMENT ON TABLE "product_attr" IS '商品属性';
-- Set comment to column: "product_id" on table: "product_attr"
COMMENT ON COLUMN "product_attr" ."product_id" IS '商品编号';
-- Set comment to column: "attribute_cate_id" on table: "product_attr"
COMMENT ON COLUMN "product_attr" ."attribute_cate_id" IS '属性分类编号';
-- Set comment to column: "attribute_id" on table: "product_attr"
COMMENT ON COLUMN "product_attr" ."attribute_id" IS '属性编号';
-- Set comment to column: "attribute_title" on table: "product_attr"
COMMENT ON COLUMN "product_attr" ."attribute_title" IS '属性标题';
-- Set comment to column: "attribute_type" on table: "product_attr"
COMMENT ON COLUMN "product_attr" ."attribute_type" IS '属性类型';
-- Set comment to column: "attribute_value" on table: "product_attr"
COMMENT ON COLUMN "product_attr" ."attribute_value" IS '属性值';
-- Set comment to column: "sort" on table: "product_attr"
COMMENT ON COLUMN "product_attr" ."sort" IS '排序';
-- Set comment to column: "add_time" on table: "product_attr"
COMMENT ON COLUMN "product_attr" ."add_time" IS '添加时间';
-- Set comment to column: "status" on table: "product_attr"
COMMENT ON COLUMN "product_attr" ."status" IS '状态';
-- Create "product_cate" table
CREATE TABLE "product_cate" ("id" bigserial NOT NULL, "title" character varying(200) NULL DEFAULT '', "cate_img" character varying(200) NULL DEFAULT '', "link" character varying(250) NULL DEFAULT '', "template" text NULL, "pid" bigint NULL DEFAULT 0, "sub_title" character varying(100) NULL DEFAULT '', "keywords" character varying(250) NULL DEFAULT '', "description" text NULL, "sort" bigint NULL DEFAULT 0, "status" smallint NULL DEFAULT 0, "add_time" bigint NULL DEFAULT 0, PRIMARY KEY ("id"));
-- Set comment to table: "product_cate"
COMMENT ON TABLE "product_cate" IS '商品分类';
-- Set comment to column: "title" on table: "product_cate"
COMMENT ON COLUMN "product_cate" ."title" IS '分类名称';
-- Set comment to column: "cate_img" on table: "product_cate"
COMMENT ON COLUMN "product_cate" ."cate_img" IS '分类图片';
-- Set comment to column: "link" on table: "product_cate"
COMMENT ON COLUMN "product_cate" ."link" IS '链接';
-- Set comment to column: "template" on table: "product_cate"
COMMENT ON COLUMN "product_cate" ."template" IS '模版';
-- Set comment to column: "pid" on table: "product_cate"
COMMENT ON COLUMN "product_cate" ."pid" IS '父编号';
-- Set comment to column: "sub_title" on table: "product_cate"
COMMENT ON COLUMN "product_cate" ."sub_title" IS '子标题';
-- Set comment to column: "keywords" on table: "product_cate"
COMMENT ON COLUMN "product_cate" ."keywords" IS '关键字';
-- Set comment to column: "description" on table: "product_cate"
COMMENT ON COLUMN "product_cate" ."description" IS '描述';
-- Set comment to column: "sort" on table: "product_cate"
COMMENT ON COLUMN "product_cate" ."sort" IS '排序';
-- Set comment to column: "status" on table: "product_cate"
COMMENT ON COLUMN "product_cate" ."status" IS '状态';
-- Set comment to column: "add_time" on table: "product_cate"
COMMENT ON COLUMN "product_cate" ."add_time" IS '添加时间';
-- Create "product_color" table
CREATE TABLE "product_color" ("id" bigserial NOT NULL, "color_name" character varying(100) NULL DEFAULT '', "color_value" character varying(100) NULL DEFAULT '', "status" smallint NULL DEFAULT 0, "checked" smallint NULL DEFAULT 0, PRIMARY KEY ("id"));
-- Set comment to column: "color_name" on table: "product_color"
COMMENT ON COLUMN "product_color" ."color_name" IS '颜色名字';
-- Set comment to column: "color_value" on table: "product_color"
COMMENT ON COLUMN "product_color" ."color_value" IS '颜色值';
-- Set comment to column: "status" on table: "product_color"
COMMENT ON COLUMN "product_color" ."status" IS '状态';
-- Set comment to column: "checked" on table: "product_color"
COMMENT ON COLUMN "product_color" ."checked" IS '是否检验';
-- Create "product_image" table
CREATE TABLE "product_image" ("id" bigserial NOT NULL, "product_id" bigint NULL DEFAULT 0, "img_url" character varying(250) NULL DEFAULT '', "color_id" bigint NULL DEFAULT 0, "sort" bigint NULL DEFAULT 0, "add_time" bigint NULL DEFAULT 0, "status" smallint NULL DEFAULT 0, PRIMARY KEY ("id"));
-- Set comment to column: "product_id" on table: "product_image"
COMMENT ON COLUMN "product_image" ."product_id" IS '商品编号';
-- Set comment to column: "img_url" on table: "product_image"
COMMENT ON COLUMN "product_image" ."img_url" IS '图片地址';
-- Set comment to column: "color_id" on table: "product_image"
COMMENT ON COLUMN "product_image" ."color_id" IS '颜色编号';
-- Set comment to column: "sort" on table: "product_image"
COMMENT ON COLUMN "product_image" ."sort" IS '排序';
-- Set comment to column: "add_time" on table: "product_image"
COMMENT ON COLUMN "product_image" ."add_time" IS '添加时间';
-- Set comment to column: "status" on table: "product_image"
COMMENT ON COLUMN "product_image" ."status" IS '状态';
-- Create "product_type" table
CREATE TABLE "product_type" ("id" bigserial NOT NULL, "title" character varying(100) NULL DEFAULT '', "description" character varying(500) NULL DEFAULT '', "status" smallint NULL DEFAULT 0, "add_time" bigint NULL DEFAULT 0, PRIMARY KEY ("id"));
-- Set comment to column: "title" on table: "product_type"
COMMENT ON COLUMN "product_type" ."title" IS '标题';
-- Set comment to column: "description" on table: "product_type"
COMMENT ON COLUMN "product_type" ."description" IS '描述';
-- Set comment to column: "status" on table: "product_type"
COMMENT ON COLUMN "product_type" ."status" IS '状态';
-- Set comment to column: "add_time" on table: "product_type"
COMMENT ON COLUMN "product_type" ."add_time" IS '添加时间';
-- Create "product_type_attribute" table
CREATE TABLE "product_type_attribute" ("id" bigserial NOT NULL, "cate_id" bigint NULL DEFAULT 0, "title" character varying(100) NULL DEFAULT '', "attr_type" smallint NULL DEFAULT 0, "attr_value" character varying(100) NULL DEFAULT '', "status" smallint NULL DEFAULT 0, "sort" bigint NULL DEFAULT 0, "add_time" bigint NULL DEFAULT 0, PRIMARY KEY ("id"));
-- Set comment to column: "cate_id" on table: "product_type_attribute"
COMMENT ON COLUMN "product_type_attribute" ."cate_id" IS '分类编号';
-- Set comment to column: "title" on table: "product_type_attribute"
COMMENT ON COLUMN "product_type_attribute" ."title" IS '标题';
-- Set comment to column: "attr_type" on table: "product_type_attribute"
COMMENT ON COLUMN "product_type_attribute" ."attr_type" IS '属性类型';
-- Set comment to column: "attr_value" on table: "product_type_attribute"
COMMENT ON COLUMN "product_type_attribute" ."attr_value" IS '属性值';
-- Set comment to column: "status" on table: "product_type_attribute"
COMMENT ON COLUMN "product_type_attribute" ."status" IS '状态';
-- Set comment to column: "sort" on table: "product_type_attribute"
COMMENT ON COLUMN "product_type_attribute" ."sort" IS '排序';
-- Set comment to column: "add_time" on table: "product_type_attribute"
COMMENT ON COLUMN "product_type_attribute" ."add_time" IS '添加时间';
-- Create "role" table
CREATE TABLE "role" ("id" bigserial NOT NULL, "title" character varying(100) NULL DEFAULT '', "description" character varying(500) NULL DEFAULT '', "status" smallint NULL DEFAULT 0, "add_time" bigint NULL DEFAULT 0, PRIMARY KEY ("id"));
-- Set comment to column: "title" on table: "role"
COMMENT ON COLUMN "role" ."title" IS '标题名称';
-- Set comment to column: "description" on table: "role"
COMMENT ON COLUMN "role" ."description" IS '描述';
-- Set comment to column: "status" on table: "role"
COMMENT ON COLUMN "role" ."status" IS '状态';
-- Set comment to column: "add_time" on table: "role"
COMMENT ON COLUMN "role" ."add_time" IS '添加时间';
-- Create "role_auth" table
CREATE TABLE "role_auth" ("auth_id" bigserial NOT NULL, "role_id" bigint NULL DEFAULT 0, "id" bigserial NOT NULL, PRIMARY KEY ("id"));
-- Set comment to column: "auth_id" on table: "role_auth"
COMMENT ON COLUMN "role_auth" ."auth_id" IS '权限编号';
-- Set comment to column: "role_id" on table: "role_auth"
COMMENT ON COLUMN "role_auth" ."role_id" IS '角色编号';
-- Create "setting" table
CREATE TABLE "setting" ("id" bigserial NOT NULL, "site_title" character varying(100) NULL DEFAULT '', "site_logo" character varying(250) NULL DEFAULT '', "site_keywords" character varying(100) NULL DEFAULT '', "site_description" character varying(500) NULL DEFAULT '', "no_picture" character varying(100) NULL DEFAULT '', "site_icp" character varying(50) NULL DEFAULT '', "site_tel" character varying(50) NULL DEFAULT '', "search_keywords" character varying(250) NULL DEFAULT '', "tongji_code" character varying(500) NULL DEFAULT '', "appid" character varying(50) NULL DEFAULT '', "app_secret" character varying(80) NULL DEFAULT '', "end_point" character varying(200) NULL DEFAULT '', "bucket_name" character varying(200) NULL DEFAULT '', "oss_status" smallint NULL DEFAULT 0, PRIMARY KEY ("id"));
-- Set comment to column: "site_title" on table: "setting"
COMMENT ON COLUMN "setting" ."site_title" IS '商城名称';
-- Set comment to column: "site_logo" on table: "setting"
COMMENT ON COLUMN "setting" ."site_logo" IS '商城图标';
-- Set comment to column: "site_keywords" on table: "setting"
COMMENT ON COLUMN "setting" ."site_keywords" IS '商城关键字';
-- Set comment to column: "site_description" on table: "setting"
COMMENT ON COLUMN "setting" ."site_description" IS '商城描述';
-- Set comment to column: "no_picture" on table: "setting"
COMMENT ON COLUMN "setting" ."no_picture" IS '没有图片显示';
-- Set comment to column: "site_icp" on table: "setting"
COMMENT ON COLUMN "setting" ."site_icp" IS '商城ICP';
-- Set comment to column: "site_tel" on table: "setting"
COMMENT ON COLUMN "setting" ."site_tel" IS '商城手机号';
-- Set comment to column: "search_keywords" on table: "setting"
COMMENT ON COLUMN "setting" ."search_keywords" IS '搜索关键字';
-- Set comment to column: "tongji_code" on table: "setting"
COMMENT ON COLUMN "setting" ."tongji_code" IS '统计编码';
-- Set comment to column: "appid" on table: "setting"
COMMENT ON COLUMN "setting" ."appid" IS 'oss appid';
-- Set comment to column: "app_secret" on table: "setting"
COMMENT ON COLUMN "setting" ."app_secret" IS 'oss app_secret';
-- Set comment to column: "end_point" on table: "setting"
COMMENT ON COLUMN "setting" ."end_point" IS 'oss 终端点';
-- Set comment to column: "bucket_name" on table: "setting"
COMMENT ON COLUMN "setting" ."bucket_name" IS 'oss 桶名称';
-- Set comment to column: "oss_status" on table: "setting"
COMMENT ON COLUMN "setting" ."oss_status" IS 'oss 状态';
-- Create "user" table
CREATE TABLE "user" ("id" bigserial NOT NULL, "phone" character varying(30) NULL DEFAULT '', "password" character varying(80) NULL DEFAULT '', "add_time" bigint NULL DEFAULT 0, "last_ip" character varying(50) NULL DEFAULT '', "email" character varying(80) NULL DEFAULT '', "status" smallint NULL DEFAULT 0, PRIMARY KEY ("id"));
-- Set comment to column: "phone" on table: "user"
COMMENT ON COLUMN "user" ."phone" IS '手机号';
-- Set comment to column: "password" on table: "user"
COMMENT ON COLUMN "user" ."password" IS '密码';
-- Set comment to column: "add_time" on table: "user"
COMMENT ON COLUMN "user" ."add_time" IS '添加时间';
-- Set comment to column: "last_ip" on table: "user"
COMMENT ON COLUMN "user" ."last_ip" IS '最近ip';
-- Set comment to column: "email" on table: "user"
COMMENT ON COLUMN "user" ."email" IS '邮编';
-- Set comment to column: "status" on table: "user"
COMMENT ON COLUMN "user" ."status" IS '状态';
-- Create "user_sms" table
CREATE TABLE "user_sms" ("id" bigserial NOT NULL, "ip" character varying(50) NULL DEFAULT '', "phone" character varying(50) NULL DEFAULT '', "send_count" bigint NULL DEFAULT 0, "add_day" character varying(200) NULL DEFAULT '', "add_time" bigint NULL DEFAULT 0, "sign" character varying(80) NULL DEFAULT '', PRIMARY KEY ("id"));
-- Set comment to column: "ip" on table: "user_sms"
COMMENT ON COLUMN "user_sms" ."ip" IS 'ip地址';
-- Set comment to column: "phone" on table: "user_sms"
COMMENT ON COLUMN "user_sms" ."phone" IS '手机号';
-- Set comment to column: "send_count" on table: "user_sms"
COMMENT ON COLUMN "user_sms" ."send_count" IS '发送统计';
-- Set comment to column: "add_day" on table: "user_sms"
COMMENT ON COLUMN "user_sms" ."add_day" IS '添加日期';
-- Set comment to column: "add_time" on table: "user_sms"
COMMENT ON COLUMN "user_sms" ."add_time" IS '添加时间';
-- Set comment to column: "sign" on table: "user_sms"
COMMENT ON COLUMN "user_sms" ."sign" IS '签名';
```

然后我们执行go-doudou命令即可生成代码
```shell
go-doudou svc init testpg --db_driver postgres --db_dsn "host=localhost user=corteza password=corteza dbname=testpg port=5432 sslmode=disable TimeZone=Asia/Shanghai" --db_soft deleted_at --db_grpc
```

执行`go run cmd/main.go`服务即可启动。代码里有OpenAPI3.0的接口描述文件testpg_openapi3.json，可以直接导入postman里调试接口。

## 分页查询接口
此处需要重点要说明一下分页查询类的接口。以`GetUsers(ctx context.Context, parameter dto.Parameter) (data dto.Page, err error)`这个接口方法为例，会生成"get /users"分页查询接口。导入postman里我们可以看到如下界面

![image.png](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/e518d99d2f934e229029613551baa937~tplv-k3u1fbpfcp-watermark.image?)

里面默认填进去的query参数名是不对的，需要按照下表进行修改，才能调通接口

| postman默认参数名 | 正确的参数名 | 参数说明 |
| --- | --- | --- |
| page | parameter[page] | 页码，第1页传0 | 
| size | parameter[size] | 每页数量 | 
| sort | parameter[sort] | 排序，多个排序条件用英文逗号拼接，单个排序条件默认升序，首字符如果是“-”则降序 | 
| order | parameter[order] | 升降序，默认升序，可以不传。如果传了DESC表示降序。一般只用sort参数即可 | 
| fields | parameter[fields] | 指定返回哪些字段，注意要传数据库中的字段名，多个字段用英文逗号拼接 | 
| filters | parameter[filters] | 筛选过滤条件，支持多维数组做嵌套筛选，下文详细说明 | 

分页查询接口的调用效果如下图

![image.png](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/686d8ca28ced41028cb5ea2ed2d76569~tplv-k3u1fbpfcp-watermark.image?)

为方便调试，这里贴出来curl命令
```shell
curl --location --globoff 'http://localhost:6060/users?parameter[page]=0&parameter[size]=10&parameter[sort]=-phone%2Cid&parameter[fields]=id%2Cphone%2Cemail&parameter[filters][0]=email&parameter[filters][1]=like&parameter[filters][2]=com' \
--header 'Accept: application/json'
```

筛选过滤条件需要传一维或者多维数组，数组最多包含三个元素，第一个是数据库字段名，第二个是操作符，第三个是条件值，条件值可以传数组。

```js
// 语法:
["column_name", "operator", "values"]

// 例子:
["age", "=", 20]
// 简写:
["age", 20]

// 生成的SQL:
// WHERE age = 20
```

只包含一个元素的数组表示逻辑运算符

```js
// 例子
[["age", "=", 20],["or"],["age", "=", 25]]

// 生成的SQL:
// WHERE age = 20 OR age = 25
```

条件值可以传数组

```js
["age", "between", [20, 30] ]
// 生成的SQL:
// WHERE age BETWEEN 20 AND 30

["age", "not in", [20, 21, 22, 23, 24, 25, 26, 26] ]
// 生成的SQL:
// WHERE age NOT IN(20, 21, 22, 23, 24, 25, 26, 26)
```

支持嵌套筛选条件

```js
[
    [
        ["age", ">", 20],
        ["and"]
        ["age", "<", 30]
    ],
    ["and"],
    ["name", "like", "john"],
    ["and"],
    ["name", "like", "doe"]
]
// 生成的SQL:
// WHERE ( (age > 20 AND age < 20) and name like '%john%' and name like '%doe%' )
```

如果需要传`null`值，可以传`"null"`或小写的`null`

```js
// 错的
[ "age", "is", NULL ]
[ "age", "is", Null ]
[ "age", "is not", NULL ]
[ "age", "is not", Null ]

// 对的
[ "age", "is", "NULL" ]
[ "age", "is", "Null" ]
[ "age", "is", "null" ]
[ "age", "is", null ]
[ "age", null ]
[ "age", "is not", "NULL" ]
[ "age", "is not", "Null" ]
[ "age", "is not", "null" ]
[ "age", "is not", null ]
```

## 表关联
此处还需要说明一下表关联这种情况。这个功能暂时还不支持生成表关联相关的代码，但我们提供了基于gorm的事务支持，开发者可以手动实现相关的逻辑，比如在一个数据库事务里插入父子表数据。在生成的svcimpl.go文件里的接口实现结构体中有一个`clone`方法

```go
func (receiver XXXImpl) clone(q *query.Query) *TestpgImpl {
   receiver.q = q
   return &receiver
}
```

可以传入一个底层封装了`*sql.Tx`的`*query.Query`参数克隆出一个接口实现结构体实例，用于执行数据库事务操作。

```go
func (receiver *XXXImpl) TAuthorPosts(ctx context.Context, body dto.SaveAuthorReqDTO) (err error) {
   return errors.WithStack(receiver.q.Transaction(func(tx *query.Query) error {
      instance := receiver.clone(tx)
      _, err1 := instance.PostTAuthor(ctx, body.TAuthor)
      if err1 != nil {
         return err1
      }
      _, err1 = instance.PostTPosts(ctx, body.Posts)
      if err1 != nil {
         return err1
      }
      return nil
   }))
}
```

## 其他优化
这一功能是基于gorm/gen这个库做的二开，做了几点优化：
1. 针对PostgreSQL，支持传入`--db_table_prefix`参数指定schema
2. 针对PostgreSQL，解决了默认值带`::character varying`字符串的问题
3. 支持传入`--db_soft`参数自定义软删除的数据库字段名


以上就是关于go-doudou从数据库一键生成全套服务代码这一功能的介绍。
