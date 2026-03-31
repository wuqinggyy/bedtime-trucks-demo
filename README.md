# 晚安小工程车

这是当前仓库里的本地前端验证页，用来连接已经存在的本机后端服务：

```text
http://127.0.0.1:3000
```

页面会调用：

```text
POST /api/v1/sessions/create
```

也支持轻量健康检查：

```text
GET /health
```

并把返回的 `latestStory` 和 `latestAudio` 展示到网页里。

## 当前定位

- 这是一个轻量本地前端，不是原来只放静态样本的 demo 版本。
- 页面保留了原来的晚安视觉风格，但主流程已经改成调用本机后端生成故事和音频。
- 适合在浏览器里快速验证：表单提交、故事返回、MP3 播放是否正常。

## 页面功能

- 生成面板对中文用户展示为“宝宝昵称 / 今晚主题 / 补充要求 / 配音音色”，内部仍保持原有 payload keys
- `voice` 默认值是 `zh-CN-XiaoxiaoNeural`
- 默认故事生成模式是 `template-local`，本地验证不需要模型密钥
- 页面支持配置 `providerMode`、`model`、`baseUrl`、`apiKeyEnvVar`、`temperature`、`maxTokens` 和高级 `systemPrompt`
- 前端只会提交 `apiKeyEnvVar` 这样的后端环境变量名，不会暴露真实 API key
- 提交后显示加载、错误、成功状态
- 生成中的请求支持显式取消；如果再次触发生成，前端会先中止上一轮请求，避免晚到响应覆盖新结果
- 支持一键检查 `GET /health`，并把结果显示到页面和调试面板
- 成功后渲染故事标题和正文
- 主播放器会切换到后端返回的 `latestAudio.url`
- 音频地址会基于当前配置的后端地址自动补全
- 当前结果支持复制故事正文、复制音频地址、清空结果、按上次参数快速重试
- 页面内置动态验证状态面板，可观察页面加载、后端可达、生成成功、故事返回、音频返回、音频可播放这 6 个状态

## 本地运行

不要直接用 `file://` 打开 `index.html`。

建议先确保本机后端已经运行在：

```text
http://127.0.0.1:3000
```

然后在当前项目目录启动一个静态文件服务，例如：

```bash
python3 -m http.server 8000
```

再访问：

```text
http://127.0.0.1:8000
```

也可以用任何类似的本地静态服务工具，只要是通过 HTTP 访问页面即可。

## 前端配置

- 页面默认后端地址是 `http://127.0.0.1:3000`
- 可通过 `?backendBaseUrl=` URL 参数覆盖
- 也可在页面中填写 `backend base URL` 后点击“保存后端地址”
- 页面会优先读取 URL 参数，其次读取 localStorage 中保存值
- 页面默认 `providerMode=template-local`
- 只有当你切到 `model` 模式时，才会把以下字段带进请求 payload：
  - `providerMode`
  - `model`
  - `baseUrl`
  - `apiKeyEnvVar`
  - `temperature`
  - `maxTokens`
  - `systemPrompt`
- `temperature` 会按 `0` 到 `2` 的数值发送，`maxTokens` 会按正整数发送；留空则交给后端默认配置
- 如果你要验证 model 模式，请先在后端环境中设置真实密钥，例如 `OPENAI_API_KEY=...`，前端里只填写变量名 `OPENAI_API_KEY`

## 主要文件

- `index.html`：本地联调主页面
- `voice-samples.html`：保留的声音样本对比页
- `samples/`：原 demo 留下的静态音频样本

## 说明

- 这个仓库只修改当前前端，不涉及原来的静态 demo 仓库。
- 页面默认假设后端返回 `latestStory` 和 `latestAudio`，其中音频可从 `/audio/<file>.mp3` 访问。
- 如果后端字段名有少量差异，前端已经做了几种常见字段兼容。
