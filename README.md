# 晚安小工程车

一个面向 2 岁幼儿的静态睡前故事音频 Demo。当前版本的主体验不再依赖浏览器即时语音朗读，而是使用仓库内预生成的 `edge-tts` `zh-CN-XiaoxiaoNeural` 本地音频样本。

## 当前版本定位

- 这是一个 GitHub Pages 友好的静态 Demo。
- 首页主路径是点击试听本地 MP3，而不是调用浏览器 `SpeechSynthesis`。
- 页面仍然保留柔和、安静、适合睡前的产品感。
- 当前选定的演示声音是 `Xiaoxiao`。

## 这版包含什么

- 一个重新整理过的首页 `index.html`
- `今夜试听 / Xiaoxiao 晚安声音` 区块，展示 4 个本地晚安音频入口
- 本地静态音频播放器，支持移动端直接点击播放
- 夜晚氛围和白噪音提示控制
- 一个独立的 `voice-samples.html` 声音对比页

## 音频结构

主要演示音频放在：

```text
samples/xiaoxiao/
```

当前首页默认使用这些静态文件：

- `samples/xiaoxiao/moonlit-garage.mp3`
- `samples/xiaoxiao/wind-down-yard.mp3`
- `samples/xiaoxiao/sweet-dream-convoy.mp3`
- `samples/xiaoxiao/goodnight-construction-site.mp3`

这些文件会被页面当作本地静态资源直接播放，不需要后端。

## 如果要继续加新试听

1. 把新的 Xiaoxiao MP3 放进 `samples/xiaoxiao/`
2. 在 `index.html` 里的 `demoEntries` 数组增加一项
3. 填上标题、角色、文案和对应的 `src`

这样就可以继续扩展静态试听库。

## 本地运行

直接打开 `index.html` 也可以使用。

如果想更接近 GitHub Pages 的访问方式，建议在项目目录运行：

```bash
python3 -m http.server 8000
```

然后访问：

```text
http://localhost:8000
```

## 部署

这个项目是 GitHub Pages 友好的，入口文件就是根目录下的 `index.html`，所有音频也都放在仓库内静态目录。

部署方式：

1. 推送仓库到 GitHub
2. 在仓库设置里打开 GitHub Pages
3. 选择从默认分支的根目录部署
4. 等待 Pages 构建完成后访问站点

也可以部署到任何静态托管平台，例如 Netlify、Cloudflare Pages、Vercel Static 或 Nginx 静态目录。

## 文件说明

- `index.html`：当前主 Demo 页面，静态音频优先
- `voice-samples.html`：不同 edge-tts 中文声音的对比试听页
- `samples/`：音频样本目录
- `README.md`：项目说明

## 说明

- 这版是静态预生成音频 Demo，不包含服务端动态 TTS 生成。
- 当前的 Xiaoxiao 首页样本适合做产品感展示、语气验证和 GitHub Pages 演示。
- 后续如果要升级到动态故事生成，可以在保留这套 UI 的前提下再接入服务端 TTS。
