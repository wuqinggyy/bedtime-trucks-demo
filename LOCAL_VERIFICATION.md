# bedtime-trucks-app 本地联调验证说明

## 目标

验证 `bedtime-trucks-app` 前端页面是否已经成功接入本机后端，并完成以下闭环：

- 前端页面可启动
- 浏览器可访问页面
- 点击按钮可调用后端接口
- 后端可返回故事正文与音频
- 前端可正确展示正文并播放音频

---

## 项目结构

- 前端项目：`/Users/gongyangyang/Projects/bedtime-trucks-app`
- 后端项目：`/Users/gongyangyang/Projects/bedtime-trucks-service`

---

## 本次联调涉及的关键地址

### 前端页面

```text
http://127.0.0.1:8000
```

### 后端服务

```text
http://127.0.0.1:3000
```

### 前端调用的核心接口

```text
POST /api/v1/sessions/create
```

完整地址：

```text
http://127.0.0.1:3000/api/v1/sessions/create
```

### 健康检查接口

```text
GET /health
```

---

## 启动方式

### 1. 启动后端

在 `bedtime-trucks-service` 目录执行：

```bash
cd /Users/gongyangyang/Projects/bedtime-trucks-service
npm run dev
```

后端正常启动后，应监听：

```text
http://127.0.0.1:3000
```

### 2. 启动前端静态服务

在 `bedtime-trucks-app` 目录执行：

```bash
cd /Users/gongyangyang/Projects/bedtime-trucks-app
python3 -m http.server 8000
```

然后浏览器访问：

```text
http://127.0.0.1:8000
```

> 不建议直接用 `file://` 打开 `index.html`。

---

## 页面验证步骤

1. 打开前端页面：`http://127.0.0.1:8000`
2. 使用默认参数，或填写以下字段：
   - `child name`
   - `theme`
   - `prompt`
   - `voice`
   - `providerMode`
   - `model`（仅 `model` 模式）
   - `baseUrl`（仅 `model` 模式）
   - `apiKeyEnvVar`（仅 `model` 模式，填写环境变量名，不填 secret）
   - `temperature`（仅 `model` 模式）
   - `maxTokens`（仅 `model` 模式）
   - `systemPrompt`（仅 `model` 模式，高级字段）
   - `backend base URL`（可选，默认 `http://127.0.0.1:3000`）
3. 点击：

```text
生成故事和音频
```

4. 验证以下结果：
   - 页面状态变更为生成中 / 成功 / 失败
   - 默认 `template-local` 模式下，请求 payload 不需要携带模型字段，旧链路仍可直接工作
   - 切到 `model` 模式后，请求 payload 会按需包含 `providerMode / model / baseUrl / apiKeyEnvVar / temperature / maxTokens / systemPrompt`
   - 生成过程中可点击“取消本次生成”；若连续再次触发生成，旧请求会先被取消，避免结果交叉覆盖
   - “本地验证状态”面板会动态更新 6 个检查项
   - 右侧故事标题更新
   - 右侧故事正文正确显示
   - 音频地址被加载
   - 页面播放器可播放最新音频
   - 页面可执行“复制故事正文”“复制音频地址”“清空当前结果”“用相同参数重试”
   - 调试面板可看到请求地址、请求体、响应状态、解析摘要、健康检查结果和原始响应

### 健康检查步骤

1. 在页面中确认 `backend base URL`
2. 点击“检查 /health”
3. 验证以下结果：
   - 页面显示健康检查成功或失败
   - “后端可访问”检查项更新
   - 调试面板中的 `Health Check` 区块记录状态和响应

### 后端地址切换方式

- 可通过 URL 参数覆盖：

```text
http://127.0.0.1:8000/?backendBaseUrl=http://127.0.0.1:3000
```

- 也可在页面里的 `backend base URL` 输入框填写后点击“保存后端地址”
- 页面会优先读取 URL 参数，其次读取 localStorage 中已保存的地址

---

## 本次实际遇到的问题与修复

### 1. CORS 预检失败

#### 现象

前端点击“生成故事和音频”时，请求失败。
浏览器预检 `OPTIONS /api/v1/sessions/create` 未通过，导致后续 `POST` 被拦截。

#### 原因

后端对来自：

```text
http://127.0.0.1:8000
```

的跨域请求处理不完整，浏览器预检请求未被正确放行。

#### 修复方向

后端补充 / 调整了本地开发环境的 CORS 配置，确保：

- `OPTIONS` 预检可通过
- `POST /api/v1/sessions/create` 可正常调用
- 本地前端来源 `http://127.0.0.1:8000` 被允许

---

### 2. 前端成功收到响应，但正文未显示

#### 现象

页面提示：

```text
后端已返回成功，但没有找到可显示的故事正文。
```

#### 原因

后端实际返回的是带 `data` 包装的响应结构，例如：

```json
{
  "data": {
    "latestStory": {
      "content": "..."
    },
    "latestAudio": {
      "url": "..."
    }
  }
}
```

但前端初版解析时，没有完整兼容这层包装结构。

#### 修复方向

前端增加了集中式响应解析逻辑，兼容：

- 直接对象结构
- `{ data: ... }` 包装结构
- `latestStory / latestAudio`
- `stories[0] / audio[0]` 兜底结构

这样无论后端返回的是聚合对象还是带包装对象，前端都能正确提取：

- 故事标题
- 故事正文
- 音频 URL
- voice 信息

同时新增了调试面板，用于直接查看最近一次请求和响应详情，便于区分：

- 后端地址错误
- 网络 / CORS 问题
- HTTP 4xx / 5xx
- JSON 解析失败
- 成功响应但缺少故事或音频字段

---

## 当前验证结果

当前验证应至少覆盖以下两种场景：

- [x] 前端页面可启动
- [x] 浏览器可正常访问页面
- [ ] `template-local` 模式请求 shape 正确，且后端可回退到本地模板生成
- [ ] 如本机存在对应 API key 环境变量，则 `model` 模式可至少成功验证一次
- [ ] 前端可正确展示故事正文
- [ ] 前端可加载并播放返回音频

---

## 当前页面定位

当前的 `bedtime-trucks-app` 已经不是纯静态样本展示页，而是一个**本地联调验证页**，主要用于：

- 验证前后端接口是否打通
- 验证故事生成链路是否可用
- 验证音频生成与播放是否正常
- 为后续正式前端工程化改造提供一个可运行基线

---

## 建议的后续优化

### 前端

- 继续固化后端返回字段契约，减少前端兼容分支
- 如需长期维护，可再补一层更系统的前端测试

### 后端

- 明确本地开发与生产环境的 CORS 策略
- 固化 API 响应结构，减少前端兼容分支
- 增加更明确的接口错误信息

---

## 一句话总结

当前本地验证页除了原有 story/audio 联调，还支持安全地验证后端模型参数透传：

1. 默认走 `template-local`，保证旧链路继续可用
2. 需要模型时，只把环境变量名发给后端，不把 API key 暴露到前端
