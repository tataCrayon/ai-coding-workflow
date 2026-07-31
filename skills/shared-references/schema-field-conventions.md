# Schema 字段约定（通用版）

> 通用字段设计约定，供 `database-design-guard` Skill 引用。项目有特有规范时以项目 `.notes/` 为准。

## 一、标准公共字段

业务表建议统一包含以下审计/控制字段，命名与类型统一：

| 字段名 | 推荐类型 | 说明 |
|--------|----------|------|
| `id` | BIGINT / INT | 自增主键或雪花 ID |
| `tenant_id` | VARCHAR(64) | 租户隔离（多租户场景，NOT NULL） |
| `deleted` | INT / TINYINT(1) | 逻辑删除（0=未删除，1=已删除） |
| `version` | INT | 乐观锁版本号 |
| `create_by` | VARCHAR(64) | 创建人 |
| `update_by` | VARCHAR(64) | 更新人 |
| `create_time` | DATETIME(3) | 创建时间 |
| `update_time` | DATETIME(3) | 更新时间 |

**禁止变体命名**：不用 `delete_flag`/`is_deleted`（统一 `deleted`）、不用 `create_user`/`update_user`（统一 `create_by`/`update_by`）、不用 `gmt_create`（统一 `create_time`）。
**时间类型统一**：使用 `DATETIME(3)`，禁止用 `BIGINT` 存时间戳。

## 二、字段类型选择决策树

```
是金额/费率？
├── 金额 → DECIMAL(20,4)（精确到4位小数）
└── 费率/百分比 → DECIMAL(10,6)（精确到6位小数）
是文本？
├── 短（人名/编码）→ VARCHAR(64)
├── 中（标题/备注）→ VARCHAR(256)
└── 长（大段描述/JSON）→ TEXT
是状态/枚举？→ TINYINT / SMALLINT（数值型枚举）
是布尔标识？→ TINYINT(1)（0/1）
是时间？→ DATETIME(3)
```

## 三、字段长度建议

| 字段类别 | 推荐长度 |
|---------|---------|
| 租户 ID | VARCHAR(64) |
| 人名/操作人 | VARCHAR(64) |
| 编码/单号 | VARCHAR(64) |
| 标题/名称 | VARCHAR(256) |
| 备注 | VARCHAR(512) 或 TEXT |

## 四、金额精度（金融场景可选扩展）

涉及资金的表：
- 金额字段一律 `DECIMAL(20,4)`，禁止 FLOAT/DOUBLE
- 费率/汇率 `DECIMAL(10,6)`
- 币种 `CHAR(3)`（ISO 4217）或 `VARCHAR(8)`
