# 集成说明

本插件是**纯客户端** bundle 包，通过 DSH 官方 CLI 安装，不需要改任何 monorepo 文件，也不需要 host 半部。

## 安装

在任意目录执行（插件仓库根目录的 `package.json` 声明了 `dsh.bundle.patch`，CLI 会把它挂进 target profile 的 bundle 栈）：

```bash
dsh plugin --profile web add github:FuQiZuo/DSH-Token-Meter
```

使用本机仓库（在插件目录根执行，`link:.` 指向当前目录）：

```bash
dsh plugin --profile web add link:.
```

卸载：

```bash
dsh plugin --profile web rm dsh-token-meter
```

## 安装时发生了什么

`dsh plugin --profile web add <spec>` 是 pnpm 的薄封装：

1. 把 `<spec>` 转发给 pnpm 安装到 `$DSH_HOME/profiles/web`；
2. 安装完成后读取已安装包的真实 `package.json`：
   - 若声明了 `dsh.bundle.patch`（本插件是 `./cordis.patch.yml`），就把 `dsh-token-meter` 追加进 `web` profile 的 `dsh.profile.bundles`，
   - 否则仅作为普通依赖，不成为 profile layer；
3. web profile 启动时，按 `dsh.profile.bundles` 顺序合并每个 bundle 的 patch（`cordis.patch.yml`），得到该插件的挂载行。

因此本插件只需 `package.json` 声明 `dsh.bundle.patch` 并把 `cordis.patch.yml` 放进包根，一条命令即安装并挂载。`cordis.patch.yml` 里那行 `insert`（`id: token-meter` / `name: dsh-token-meter`）会被 client-modules 半区扫描为浏览器 roster 项，从而通过 `exports["./client"]` 提供 `client.js`。

## 浏览器 bundle 如何被发现

- `exports` 里 `"./client" -> "./client.js"`；
- `package.json` 的 `dsh.client` 声明了 `platform: "web"` 与 `inject`（本插件依赖的 DSH client 模块）；
- client-modules 据此把该包作为一条 boot manifest entry（`id = 包名`），以 `/plugins/dsh-token-meter/client.js` 提供，`window.__ModuleLoader__.load({ id: "dsh-token-meter", ... })` 里烘焙的 id 与包名一致，二者是注册键。

## 重新构建 `client.js`

`client.js` 是由 DSH 客户端打包链（`packages/client/tsdown.client.ts` 的 `clientBundle` preset、`lightningcss` CSS Modules、`react` 外部化）生成的浏览器 bundle。构建需要 DSH 的 workspace，因此**不能在仓库外独立构建**。改动源码后：

1. 把 `src/` 放进 DSH workspace 的 client 插件包目录（例如 `packages/client/dsh-token-meter`）；
2. 构建 client 相：`tsc -b tsconfig.client.json && tsdown --env.DSH_BUILD_FACE client`；
3. 把产出的 `lib/client.js` 拷回本仓库根目录；
4. 把 bundle 里烘焙的 id 从 dev 包名重新烘焙为发布包名 `dsh-token-meter`（`window.__ModuleLoader__.load({ id })`、`@module` 注释、CSS `\0dsh-css:` 区域标记），并去掉尾部 `//# sourceMappingURL` 注释（本仓库不随包发布 `.map`）。

## 验证

- **安装成功**：`dsh plugin --profile web add ...` 之后，`dsh.profile.bundles`（`$DSH_HOME/profiles/web/package.json`）里出现 `dsh-token-meter`。
- **组合成功**：`dsh --profile web --dump-config` 输出的末尾出现 `# == dsh-token-meter` 与 `- id: token-meter / name: dsh-token-meter`。
- **运行成功**：刷新 `web` 页面，右下角出现面板；设置页切模式/语言/透明度/文本大小，点 ⓘ 弹出免责声明。

## 请注意

- 面板是 `shell.overlay` 插槽，安装后要刷新页面才会出现。
- `client.js` 只依赖 DSH Client 运行时的 `slots`/`locale`/`sessions` 服务（即 `dsh.client.inject` 列出的模块），不能脱离 DSH 页面在普通浏览器/Node 里运行。
- 不需要 `index.js` 做任何事：它只是 cordis 安装所需的 host 半部占位（空 `apply`）。
