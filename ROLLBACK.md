# 回退说明

当前基线：**v0.3 爽快模式**（tag：`v0.3-baseline`）。

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

## 当前分支说明

| 分支 / 位置 | 内容 |
|---|---|
| `master` | v0.3 爽快模式基线 |
| `feature/tower-mode` | 爬塔模式开发分支 |
| `E:\Project\curling-gates-v0.3-backup` | 独立源码备份 |
| tag `v0.3-baseline` | Git 基线标签 |

> 新功能开发期间，`master` 不会被修改；随时可以切回。
