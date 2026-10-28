# 引擎选型与 Cocos 迁移清单

> 结论：抖音开放平台「小游戏预计使用开发引擎」选择 **普通小游戏引擎（Cocos/Laya/Egret/Godot/其他）**，不要选 Unity。
> 最终生产引擎：**Cocos Creator 3.8.7+（3.8 LTS 最新版）**。
> 当前 HTML5 原型只用于验证手感与数值，不是最终上线包。

## 1. 为什么这样选

| 选项 | 判断 | 原因 |
|---|---|---|
| **Cocos Creator 3.8.7+** | ✅ 首选 | 官方适配抖音；3.8.7 新增抖音「引擎分离」，利于压主包；TypeScript + 2D 工具链成熟；社区/AI 资料多 |
| Laya | 可用 | 适合已有 Laya 团队；社区与 AI 资料少于 Cocos |
| Egret | 不推荐 | 偏老，新项目不建议 |
| Godot 4.5 | 可用 | 已支持抖音，但接入资料/工具链还不如 Cocos |
| Unity | ❌ 不推荐 | WebAssembly 包体大，4MB 主包难压，2D 项目过重 |
| 其他（自研 H5） | 可行但费劲 | 需要自己处理运行时、SDK、包体、性能、审核；适合极简游戏 |

## 2. 包体硬约束

| 项 | 限制 |
|---|---|
| 主包 | ≤ 4MB |
| 整包 | ≤ 20MB |
| 单分包 | ≤ 20MB |

### 必做优化

- 开启 **引擎分离**（Cocos 3.8.7+）
- **不要同时勾选「引擎分离」和「WASM 分包」**：Cocos 3.8.7 已知问题（cocos-engine issue #19056）
- 引擎模块裁剪：只保留 2D、UI、Tween、Audio、粒子；不引 Box2D（物理自研）
- 图集 + WebP + 远程 CDN + 分包
- 音频 OGG，控制总量
- 首包只放核心玩法；关卡/皮肤/音频走分包或远程

## 3. 迁移映射

| 原型 | Cocos / 抖音 |
|---|---|
| Canvas 2D | Cocos Sprite / Graphics |
| DOM HUD / 按钮 | Cocos UI（小游戏没有 DOM） |
| `localStorage` | `tt.setStorageSync` / 云存档 |
| WebAudio | Cocos AudioSource / `tt.createInnerAudioContext` |
| `requestAnimationFrame` | Cocos 帧回调 + 固定步长累加器 |
| 自研圆碰撞 | 保留，替换渲染层 |
| `game.js` 单文件 | `assets/scripts/` 按系统拆模块 |

建议模块：

```
assets/scripts/
  core/Physics.ts
  core/Stone.ts
  core/GateSystem.ts
  core/Score.ts
  game/GameFlow.ts
  game/LevelLoader.ts
  game/Juice.ts
  platform/DouyinSDK.ts
  ui/HUD.ts
  data/levels/*.json
```

## 4. 引擎 spike（必须先做）

在正式迁移前，用 1 天验证：

1. 新建 Cocos 3.8.7 空 2D 项目。
2. 构建抖音小游戏，测**空包主包大小**。
3. 分别测：默认 / 开引擎分离 / 裁剪模块后的主包大小。
4. 接最小 `tt.shareAppMessage` + 侧边栏 + 激励视频 demo，真机跑通。
5. 用一张图 + 一个 Sprite 验证 2.5D 投影与触摸。

### 验收标准

- 空包主包 **< 2.5MB** → 迁移风险低
- 2.5~3.5MB → 需要裁剪/分包/远程资源
- **> 3.5MB** → 先解决包体，或认真评估「其他」自研 H5

## 5. 迁移顺序

```
纯逻辑（物理/门/计分） → 渲染 → UI → SDK → 关卡 → 音效
```

迁移后用原型的同一组参数做对照，确保「变大/分裂/连锁清屏」的爽感不丢。

## 6. 当前状态

- [x] HTML5 可玩原型
- [x] 本地试玩服务器 / 单文件导出
- [ ] Cocos 空工程 spike（需要本机安装 Cocos Creator 3.8.7+）
- [ ] 抖音开发者工具真机验证（需要 AppID / 登录）
- [ ] Cocos 全量迁移
- [ ] 提审

> 说明：Cocos Creator 是桌面 GUI 工具，抖音构建还需要开发者工具与账号；这些无法在当前命令行环境里完成。原型已保证「现在就能试玩」，Cocos spike 需要在本机完成。
