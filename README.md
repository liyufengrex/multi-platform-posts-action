
<p align="center">
<h1 align="center">multi-platform-posts-action</h1>
</p>

<div align="center">
  同步不同平台的最近文章到github首页，支持掘金、知乎、思否

<br/>
<br/>

</div>


## 💡 灵感来源
受到 👉 [KunLunXu-CC/juejin-posts-action](https://github.com/KunLunXu-CC/juejin-posts-action) 的启发，但用了发现只生成了文章链接，不支持点赞数、收藏数、多平台等功能，所以自己实现一个。

## ✨功能

- 多平台，目前支持**掘金、知乎、思否**（本来做好了语雀的，但发现语雀接口很奇怪，没法拿到正确的文章链接，所以暂时取消支持语雀的功能）
- 支持生成不同平台的 icon![](./assets/juejin.svg) ![](./assets/zhihu.ico) ![](./assets/segmentfault.ico)
- 支持点赞数 👍🏻
- 支持收藏数 ⭐（目前只有掘金有，知乎、思否接口比较麻烦，暂且不做）
 ## 🔨 使用

1. 在 `README` 中任意位置添加标志位

```markdown
<!-- multi-platform-posts start -->
这里会插入生成的文章列表
<!-- multi-platform-posts end -->
```

