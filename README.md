# DSH Token Meter

**Token 计量表** — DeepSeek Harness（DSH）的 token 用量计量插件。

一个挂载在右下角 `shell.overlay` 的浮动面板，同时展示 **当前会话**（输入 / 输出 / 命中缓存 / 未命中缓存 / 总 token）与 **全部会话**（累计输入 / 累计输出 / 累计命中 / 累计未命中）。纯客户端插件：不改动应用代码，只注册一个面板 + 一个设置页。

## 快速开始

```bash
dsh plugin --profile web add github:FuQiZuo/DSH-Token-Meter
```

重启（或重新加载）web profile 即生效。面板出现在右下角；在 **设置 › Token 计量表设置** 调整统计模式、语言、透明度与文本大小。

卸载：

```bash
dsh plugin --profile web rm dsh-token-meter
```

### 安装到本机（不通过 GitHub）

在插件仓库根目录执行：

```bash
dsh plugin --profile web add link:.
```

> 这里 `link:.` 指向当前目录。请在该插件仓库根目录执行，而不是 `link:.\某子目录`。

### 一次性试用（不安装，作为动态 Cordis 插件）

1. 复制 `client.js` 里 `apply(ctx) { ... }` 的函数体；
2. 用 `cordis_define` 新建插件，粘贴为 **Client 代码**（`return { apply(ctx) { ... } }`），再用 `cordis_run` 激活；
3. 刷新页面生效；在 Run 卡片上停止插件即完全卸载（面板与设置页自动拆除）。

`client.js` 依赖 DSH Client 运行时的 `slots`、`locale`、`sessions` 服务，不能在普通浏览器里直接运行。

## 特性

| 特性 | 说明 |
| --- | --- |
| 当前会话 | 输入 / 输出 / 命中缓存 / 未命中缓存 / 总 token |
| 全部会话 | 累计输入 / 累计输出 / 累计命中 / 累计未命中 |
| 实时 / 延迟模式 | 实时模式下每秒用本地分词器（`gpt-tokenizer` p50k_base）统计流式输出；输入仅在模型思考（reasoning 块）时累加。请求结束后用 `tokenUsage` projection 校准到真实值 |
| 平滑爬升 | 输出 token 由内置分词器按真实流式输出块统计，生成时才上涨、思考/空闲时不动；输入在思考时按 2400–2800 token/秒 的实测吞吐爬升，避免数字跳动过大 |
| 校准过渡 | 请求结束、实时值被真实值替换后，数字保持橙色约 1 秒再变白，让交接可见 |
| 设置页 | 统计模式（实时 / 延迟）、语言（zh / en）、面板透明度（0–100% 滑杆，只淡化背景与毛玻璃，边框固定）、文本大小（小 / 中 / 大）。localStorage 持久化，文案跟随语言设置 |
| 免责声明 | 设置页的 ⓘ 打开居中的免责声明弹窗，点背景或 × 关闭 |

## 数据来源与口径

- 所有总量读取 DSH 的 `tokenUsage` projection（客户端权威值）：`input = uncachedInputTokens + cacheReadTokens + cacheWriteTokens`，`hit = cacheReadTokens`，`miss = uncachedInputTokens + cacheWriteTokens`，`total = input + output`。四个桶互斥。
- 实时预估仅作预览，不计入任何限额或计费；请求结束由真实 projection 校准。
- 以本地分词器统计，与 DeepSeek 官方分词器不完全一致，存在误差（尤其包含思考链的输入 token），请以请求结束后的校准值为准。当前会话总量不包含子代理用量（已知限制）。

## 项目结构

```
client.js          浏览器端全部实现（面板 + 设置页 + 免责声明 + 本地统计）
index.js           Host 半部，空实现（Token Meter 是纯客户端的）
cordis.patch.yml   安装时把插件行挂进 bundle 栈
src/               TypeScript 源码（client.js 由 DSH 构建链打包生成）
README.md          本文档（中文见 README.zh.md）
```

## 开发与维护

`client.js` 是一份由 DSH 客户端打包链（`clientBundle` preset、`lightningcss` CSS Modules、`react` 外部化）生成的预构建浏览器 bundle。修改源码需在 DSH checkout 内构建：

1. 把 `src/` 放入 DSH workspace 的插件包目录；
2. 运行 `tsc -b tsconfig.client.json && tsdown --env.DSH_BUILD_FACE client`；
3. 将产出的 `lib/client.js` 拷回仓库根目录（同时把 bundle 的 id 重新烘焙为 `dsh-token-meter`）。

## 常见问题

- **`dsh plugin add` 装了之后面板没出现？** 确认你用的是 `web` profile，并且刷新了页面；面板是 `shell.overlay` 插槽，不是安装后自动打开的。
- **能用 Node 直接跑 `client.js` 吗？** 不能。它依赖 DSH Client 运行时的 slot / locale / session 服务，脱离 DSH 页面会报错。
- **实时数字和请求结束的数字不一致？** 正常。实时值用本地分词器按秒爬升，是预览；请求结束的 `tokenUsage` projection 才是真实值并做校准。
- **需要 host 半部吗？** 不需要。Token Meter 是纯客户端插件，`index.js` 只是 cordis 安装所需的空实现。

## 许可证

MIT
