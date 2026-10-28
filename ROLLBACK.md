# 回退说明

当前基线：**v0.3 爽快模式**（tag：`v0.3-baseline`）。
新功能：**v0.7 冰球爬塔 + 满力投掷 + 圆形增益区 + 大旋弧**（tag：`v0.7-fullpower`）。

## 方式 1：Git 回退（推荐）

```bash
cd E:\Project\curling-gates
git checkout master
```

`master` 是 v0.3 基线；新功能在 `feature/tower-mode` 分支。

查看当前分支：

```bash
git branch --show-current
```

查看两个分支差异：

```bash
git diff master..feature/tower-mode
```

只回退某个文件：

```bash
git checkout master -- game.js
```

回到 v0.4 新功能：

```bash
git checkout feature/tower-mode
```

## 方式 2：独立备份

完整源码已复制到：

```
E:\Project\curling-gates-v0.3-backup
```

直接双击：

```
E:\Project\curling-gates-v0.3-backup\play.cmd
```

即可运行 v0.3 基线。

## 方式 3：单文件基线

v0.3 的单文件试玩版在：

```
E:\Project\curling-gates\dist\curling-gates.html
```

如果新版本覆盖了它，可从备份目录取回：

```
E:\Project\curling-gates-v0.3-backup\dist\curling-gates.html
```

## 分支 / 标签

| 分支 / 位置 | 内容 |
|---|---|
| `master` | v0.3 爽快模式基线 |
| `feature/tower-mode` | v0.7 冰球爬塔 + 满力/瞄准线/圆形门 |
| tag `v0.3-baseline` | v0.3 Git 基线 |
| tag `v0.4-tower` | v0.4 新功能快照 |
| tag `v0.5-ball-tower` | v0.5 冰球爬塔 + 往返力度条 |
| tag `v0.6-rogue` | v0.6 单球开局/三选一/随机布局/平滑力度条 |
| tag `v0.7-fullpower` | v0.7 取消力度/擦冰、固定满力、圆形门、大旋弧 |
| `E:\Project\curling-gates-v0.3-backup` | v0.3 独立源码备份 |

> 新功能开发期间，`master` 不会被修改；随时可以切回。
