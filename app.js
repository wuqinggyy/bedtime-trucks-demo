(function () {
  const DEFAULT_BACKEND_BASE_URL = "http://127.0.0.1:3000";
  const CREATE_SESSION_PATH = "/api/v1/sessions/create";
  const HEALTH_PATH = "/health";

  const defaultFormValues = {
    childName: "豆豆",
    theme: "晚安小卡车",
    prompt: "要温柔、节奏慢一点，适合 2 岁宝宝，加入月亮和停车小院。",
    voice: "zh-CN-XiaoxiaoNeural",
    providerMode: "template-local",
    model: "",
    baseUrl: "",
    apiKeyEnvVar: "",
    temperature: "",
    maxTokens: "",
    systemPrompt: ""
  };

  const noiseMap = {
    none: "现在只有安静的夜晚，月亮在看着小车车睡觉。",
    wind: "晚风轻轻吹。呼呀，呼呀。像在慢慢拍一拍。",
    rain: "小雨很轻。沙沙，沙沙。像柔柔的小被子。",
    wheels: "远远的车轮慢慢过去。咕噜，咕噜。然后又安静了。"
  };

  const ambientKey = "bedtime-trucks-local-ambient";
  const noiseKey = "bedtime-trucks-local-noise";
  const formKey = "bedtime-trucks-local-form";
  const latestSessionKey = "bedtime-trucks-latest-session";
  const backendBaseUrlKey = "bedtime-trucks-backend-base-url";

  const checklistKeys = [
    "pageLoaded",
    "backendReachable",
    "generateRequestSucceeded",
    "storyReturned",
    "audioReturned",
    "audioPlayable"
  ];

  const checklistLabels = {
    pass: "通过",
    fail: "失败",
    pending: "等待中",
    in_progress: "进行中"
  };

  const body = document.body;
  const generationForm = document.getElementById("generationForm");
  const childNameInput = document.getElementById("childNameInput");
  const themeInput = document.getElementById("themeInput");
  const promptInput = document.getElementById("promptInput");
  const voiceInput = document.getElementById("voiceInput");
  const providerModeInput = document.getElementById("providerModeInput");
  const modelInput = document.getElementById("modelInput");
  const baseUrlInput = document.getElementById("baseUrlInput");
  const apiKeyEnvVarInput = document.getElementById("apiKeyEnvVarInput");
  const temperatureInput = document.getElementById("temperatureInput");
  const maxTokensInput = document.getElementById("maxTokensInput");
  const systemPromptInput = document.getElementById("systemPromptInput");
  const providerModeSummary = document.getElementById("providerModeSummary");
  const backendBaseUrlInput = document.getElementById("backendBaseUrlInput");
  const saveBackendBtn = document.getElementById("saveBackendBtn");
  const resetBackendBtn = document.getElementById("resetBackendBtn");
  const healthCheckBtn = document.getElementById("healthCheckBtn");
  const healthStatus = document.getElementById("healthStatus");
  const generateBtn = document.getElementById("generateBtn");
  const cancelGenerateBtn = document.getElementById("cancelGenerateBtn");
  const resetFormBtn = document.getElementById("resetFormBtn");
  const currentTags = document.getElementById("currentTags");
  const currentTitle = document.getElementById("currentTitle");
  const currentDescription = document.getElementById("currentDescription");
  const mainPlayer = document.getElementById("mainPlayer");
  const mainSource = document.getElementById("mainSource");
  const playCurrentBtn = document.getElementById("playCurrentBtn");
  const copyStoryBtn = document.getElementById("copyStoryBtn");
  const copyAudioUrlBtn = document.getElementById("copyAudioUrlBtn");
  const clearCurrentBtn = document.getElementById("clearCurrentBtn");
  const regenerateBtn = document.getElementById("regenerateBtn");
  const downloadCurrentBtn = document.getElementById("downloadCurrentBtn");
  const playerStatus = document.getElementById("playerStatus");
  const audioStatus = document.getElementById("audioStatus");
  const noiseCue = document.getElementById("noiseCue");
  const heroEndpoint = document.getElementById("heroEndpoint");
  const verificationSummary = document.getElementById("verificationSummary");
  const debugTimestamp = document.getElementById("debugTimestamp");
  const debugRequestUrl = document.getElementById("debugRequestUrl");
  const debugResponseStatus = document.getElementById("debugResponseStatus");
  const debugRequestPayload = document.getElementById("debugRequestPayload");
  const debugParsedSummary = document.getElementById("debugParsedSummary");
  const debugHealthCheck = document.getElementById("debugHealthCheck");
  const debugRawResponse = document.getElementById("debugRawResponse");

  const checklistElements = {
    pageLoaded: {
      badge: document.getElementById("checkPageLoadedBadge"),
      detail: document.getElementById("checkPageLoadedDetail")
    },
    backendReachable: {
      badge: document.getElementById("checkBackendReachableBadge"),
      detail: document.getElementById("checkBackendReachableDetail")
    },
    generateRequestSucceeded: {
      badge: document.getElementById("checkGenerateRequestBadge"),
      detail: document.getElementById("checkGenerateRequestDetail")
    },
    storyReturned: {
      badge: document.getElementById("checkStoryReturnedBadge"),
      detail: document.getElementById("checkStoryReturnedDetail")
    },
    audioReturned: {
      badge: document.getElementById("checkAudioReturnedBadge"),
      detail: document.getElementById("checkAudioReturnedDetail")
    },
    audioPlayable: {
      badge: document.getElementById("checkAudioPlayableBadge"),
      detail: document.getElementById("checkAudioPlayableDetail")
    }
  };

  const state = {
    backendBaseUrl: DEFAULT_BACKEND_BASE_URL,
    latestParsed: null,
    lastSubmittedFormValues: null,
    isGenerating: false,
    isHealthChecking: false,
    activeGenerationRequest: null,
    latestRequestId: 0,
    checklist: {
      pageLoaded: {
        status: "pending",
        detail: "页面还在初始化。"
      },
      backendReachable: {
        status: "pending",
        detail: "尚未检查后端。"
      },
      generateRequestSucceeded: {
        status: "pending",
        detail: "尚未发起生成请求。"
      },
      storyReturned: {
        status: "pending",
        detail: "尚未拿到故事内容。"
      },
      audioReturned: {
        status: "pending",
        detail: "尚未拿到音频地址。"
      },
      audioPlayable: {
        status: "pending",
        detail: "播放器还没有可验证的音频。"
      }
    }
  };

  function hasAudioSource() {
    return Boolean(mainSource.getAttribute("src"));
  }

  function isAbortError(error) {
    return Boolean(error && error.name === "AbortError");
  }

  function sanitizeBaseUrl(value) {
    if (!value) {
      return "";
    }
    return value.trim().replace(/\/+$/, "");
  }

  function getBackendBaseUrlFromQuery() {
    const params = new URLSearchParams(window.location.search);
    return sanitizeBaseUrl(params.get("backendBaseUrl"));
  }

  function getBackendBaseUrl() {
    return state.backendBaseUrl;
  }

  function getCreateSessionUrl() {
    return `${getBackendBaseUrl()}${CREATE_SESSION_PATH}`;
  }

  function getHealthUrl() {
    return `${getBackendBaseUrl()}${HEALTH_PATH}`;
  }

  function formatJson(value) {
    if (value == null) {
      return "null";
    }
    if (typeof value === "string") {
      return value;
    }
    try {
      return JSON.stringify(value, null, 2);
    } catch (error) {
      return String(value);
    }
  }

  function formatDebugValue(value) {
    if (!value) {
      return "无";
    }
    return typeof value === "string" ? value : formatJson(value);
  }

  function summarizeParsedResult(parsed) {
    if (!parsed) {
      return "尚未解析";
    }

    const parts = [
      `ok: ${parsed.ok}`,
      `storyTitle: ${parsed.story.title || "无"}`,
      `storyLength: ${parsed.story.content ? parsed.story.content.length : 0}`,
      `audioUrl: ${parsed.audio.url || "无"}`,
      `voice: ${parsed.audio.voice || "无"}`
    ];

    if (parsed.warnings.length) {
      parts.push(`warnings: ${parsed.warnings.join(" | ")}`);
    }

    return parts.join("\n");
  }

  function trimToEmpty(value) {
    return typeof value === "string" ? value.trim() : "";
  }

  function readOptionalNumber(value, options) {
    const trimmed = trimToEmpty(value);
    if (!trimmed) {
      return {
        ok: true,
        hasValue: false
      };
    }

    const parsed = options && options.integerOnly ? Number.parseInt(trimmed, 10) : Number(trimmed);
    if (!Number.isFinite(parsed)) {
      return {
        ok: false,
        message: options && options.label ? `${options.label} 必须是数字。` : "数值格式无效。"
      };
    }

    if (options && options.integerOnly && !Number.isInteger(parsed)) {
      return {
        ok: false,
        message: `${options.label} 必须是整数。`
      };
    }

    if (options && typeof options.min === "number" && parsed < options.min) {
      return {
        ok: false,
        message: `${options.label} 不能小于 ${options.min}。`
      };
    }

    if (options && typeof options.max === "number" && parsed > options.max) {
      return {
        ok: false,
        message: `${options.label} 不能大于 ${options.max}。`
      };
    }

    return {
      ok: true,
      hasValue: true,
      value: parsed
    };
  }

  function updateDebugPanel(details) {
    const now = new Date();
    debugTimestamp.textContent = details.timestamp || now.toLocaleTimeString("zh-CN", { hour12: false });
    debugRequestUrl.textContent = formatDebugValue(details.requestUrl);
    debugResponseStatus.textContent = formatDebugValue(details.responseStatus);
    debugRequestPayload.textContent = formatDebugValue(details.requestPayload);
    debugParsedSummary.textContent = formatDebugValue(details.parsedSummary);
    debugRawResponse.textContent = formatDebugValue(details.rawResponse);
    if (Object.prototype.hasOwnProperty.call(details, "healthCheck")) {
      debugHealthCheck.textContent = formatDebugValue(details.healthCheck);
    }
  }

  function updateHealthDebug(value) {
    debugHealthCheck.textContent = formatDebugValue(value);
  }

  function normalizeAudioUrl(url, backendBaseUrl) {
    if (!url) {
      return "";
    }
    if (/^https?:\/\//i.test(url)) {
      return url;
    }
    return `${backendBaseUrl}${url.startsWith("/") ? url : `/${url}`}`;
  }

  function unwrapPayload(data) {
    return data && typeof data === "object" && data.data && typeof data.data === "object" ? data.data : data;
  }

  function parseBackendResponse(options) {
    const payload = unwrapPayload(options.data) || {};
    const latestStory =
      payload.latestStory ||
      payload.story ||
      (Array.isArray(payload.stories) ? payload.stories[0] : null) ||
      {};
    const latestAudio =
      payload.latestAudio ||
      (Array.isArray(payload.audio) ? payload.audio[0] : null) ||
      {};

    const storyTitle = latestStory.title || latestStory.storyTitle || payload.title || "";
    const storyContent = latestStory.content || latestStory.story || latestStory.text || payload.story || payload.content || "";
    const audioUrl = normalizeAudioUrl(
      latestAudio.url || latestAudio.path || payload.audioUrl || "",
      options.backendBaseUrl
    );
    const voice = latestAudio.voice || payload.voice || options.fallbackVoice || defaultFormValues.voice;
    const warnings = [];

    if (!storyTitle) {
      warnings.push("未找到故事标题，已回退为“未命名故事”。");
    }
    if (!storyContent) {
      warnings.push("后端返回成功，但没有找到可显示的故事正文。");
    }
    if (!audioUrl) {
      warnings.push("后端返回成功，但没有找到可播放的音频地址。");
    }

    return {
      ok: Boolean(storyContent || audioUrl),
      payload,
      hasStoryContent: Boolean(storyContent),
      hasAudioUrl: Boolean(audioUrl),
      story: {
        title: storyTitle || "未命名故事",
        content: storyContent || "后端已返回成功，但没有找到可显示的故事正文。"
      },
      audio: {
        url: audioUrl,
        voice
      },
      warnings
    };
  }

  function updateStatus(message, type) {
    playerStatus.textContent = message;
    playerStatus.className = "status";
    if (type) {
      playerStatus.classList.add(type);
    }
  }

  function updateAudioStatus(message, type) {
    audioStatus.textContent = `音频状态：${message}`;
    audioStatus.className = "audio-status";
    if (type) {
      audioStatus.classList.add(type);
    }
  }

  function updateGenerateControls() {
    generateBtn.disabled = state.isGenerating;
    generateBtn.textContent = state.isGenerating ? "生成中..." : "生成故事和音频";
    cancelGenerateBtn.disabled = !state.isGenerating;
    cancelGenerateBtn.classList.toggle("is-busy", state.isGenerating);
  }

  function setChecklistItem(key, status, detail) {
    state.checklist[key] = {
      status,
      detail
    };
    renderChecklist();
  }

  function renderChecklist() {
    let passCount = 0;
    let failCount = 0;
    let progressCount = 0;

    checklistKeys.forEach((key) => {
      const item = state.checklist[key];
      const elements = checklistElements[key];
      if (!elements) {
        return;
      }

      elements.badge.className = `check-badge ${item.status}`;
      elements.badge.textContent = checklistLabels[item.status] || item.status;
      elements.detail.textContent = item.detail;

      if (item.status === "pass") {
        passCount += 1;
      } else if (item.status === "fail") {
        failCount += 1;
      } else if (item.status === "in_progress") {
        progressCount += 1;
      }
    });

    if (failCount > 0) {
      verificationSummary.textContent = `${passCount}/6 通过，${failCount} 项失败`;
      return;
    }

    if (progressCount > 0) {
      verificationSummary.textContent = `${passCount}/6 已通过，${progressCount} 项进行中`;
      return;
    }

    verificationSummary.textContent = `${passCount}/6 已通过`;
  }

  function setResultActionsState() {
    const hasStory = Boolean(state.latestParsed && state.latestParsed.hasStoryContent);
    const hasAudio = hasAudioSource();
    const canRegenerate = Boolean(state.lastSubmittedFormValues) && !state.isGenerating;

    playCurrentBtn.disabled = !hasAudio;
    copyStoryBtn.disabled = !hasStory;
    copyAudioUrlBtn.disabled = !hasAudio;
    clearCurrentBtn.disabled = state.isGenerating || (!hasStory && !hasAudio);
    regenerateBtn.disabled = !canRegenerate;
    downloadCurrentBtn.href = hasAudio ? mainSource.getAttribute("src") : "#";
    downloadCurrentBtn.setAttribute("aria-disabled", hasAudio ? "false" : "true");
    downloadCurrentBtn.classList.toggle("is-disabled", !hasAudio);
  }

  function beginGenerationRequest(sourceLabel) {
    if (state.activeGenerationRequest && state.activeGenerationRequest.controller) {
      state.activeGenerationRequest.controller.abort();
    }

    state.latestRequestId += 1;
    const controller = new AbortController();
    const request = {
      id: state.latestRequestId,
      controller,
      sourceLabel: sourceLabel || "unknown"
    };

    state.activeGenerationRequest = request;
    state.isGenerating = true;
    updateGenerateControls();
    setResultActionsState();
    return request;
  }

  function finishGenerationRequest(request) {
    if (state.activeGenerationRequest && state.activeGenerationRequest.id === request.id) {
      state.activeGenerationRequest = null;
      state.isGenerating = false;
      updateGenerateControls();
      setResultActionsState();
      return true;
    }
    return false;
  }

  function cancelActiveGeneration(reason) {
    if (!state.activeGenerationRequest || !state.activeGenerationRequest.controller) {
      return false;
    }

    state.activeGenerationRequest.controller.abort();
    updateStatus(reason || "已取消当前生成请求。");
    updateAudioStatus("当前请求已取消，可以重新发起生成。");
    setChecklistItem("generateRequestSucceeded", "pending", "上一轮请求已取消，等待新的生成请求。");
    setChecklistItem("storyReturned", "pending", "等待新的故事内容。");
    setChecklistItem("audioReturned", "pending", "等待新的音频地址。");
    setChecklistItem("audioPlayable", "pending", "等待新的音频播放验证。");
    return true;
  }

  function renderCurrentPanel(parsed, formValues) {
    state.latestParsed = parsed;
    currentTitle.textContent = parsed.story.title;
    currentDescription.textContent = parsed.story.content;
    currentTags.innerHTML = `
      <span class="tag">${parsed.audio.voice}</span>
      <span class="tag">${formValues.childName || "未填写名字"}</span>
      <span class="tag">${formValues.theme || "未填写主题"}</span>
      <span class="tag">${formValues.providerMode === "model" ? "model" : "template-local"}</span>
      <span class="tag">已连接本机后端</span>
    `;

    if (parsed.audio.url) {
      mainSource.src = parsed.audio.url;
      updateAudioStatus("已收到音频地址，正在加载播放器元数据。", "loading");
    } else {
      mainSource.removeAttribute("src");
      updateAudioStatus("这次响应没有返回音频地址。", "error");
    }
    mainPlayer.load();

    localStorage.setItem(
      latestSessionKey,
      JSON.stringify({
        formValues,
        sessionData: parsed.payload
      })
    );

    setResultActionsState();

    if (parsed.audio.url && !parsed.warnings.length) {
      updateStatus(`生成成功，已切换到《${parsed.story.title}》并加载最新音频。`, "success");
      return;
    }

    if (parsed.audio.url && parsed.warnings.length) {
      updateStatus(`生成成功，但返回字段不完整：${parsed.warnings.join(" ")}`, "success");
      return;
    }

    updateStatus(`生成成功，但返回里缺少音频地址：${parsed.warnings.join(" ")}`, "error");
  }

  function resetCurrentPanel(options) {
    const keepStatus = options && options.keepStatus;
    const clearStored = !options || options.clearStored !== false;

    state.latestParsed = null;
    currentTitle.textContent = "还没有生成新的故事";
    currentDescription.textContent = "在左侧填写信息后点击“生成故事和音频”，这里会显示后端返回的标题、正文和可播放的最新音频。";
    currentTags.innerHTML = `
      <span class="tag">等待生成</span>
      <span class="tag">本地联调</span>
    `;
    mainSource.removeAttribute("src");
    mainPlayer.load();
    updateAudioStatus("等待返回可用音频。");

    if (clearStored) {
      localStorage.removeItem(latestSessionKey);
    }

    setChecklistItem("generateRequestSucceeded", "pending", "尚未发起新的生成请求。");
    setChecklistItem("storyReturned", "pending", "尚未拿到故事内容。");
    setChecklistItem("audioReturned", "pending", "尚未拿到音频地址。");
    setChecklistItem("audioPlayable", "pending", "播放器还没有可验证的音频。");

    if (!keepStatus) {
      updateStatus("已清空当前结果。可以修改参数后重新生成。");
    }

    setResultActionsState();
  }

  function setAmbient(level) {
    body.classList.remove("ambient-low", "ambient-medium", "ambient-high");
    body.classList.add(`ambient-${level}`);
    localStorage.setItem(ambientKey, level);
    document.querySelectorAll("[data-ambient]").forEach((button) => {
      button.classList.toggle("active", button.dataset.ambient === level);
    });
  }

  function setNoise(mode) {
    noiseCue.textContent = noiseMap[mode] || noiseMap.none;
    localStorage.setItem(noiseKey, mode);
    document.querySelectorAll("[data-noise]").forEach((button) => {
      button.classList.toggle("active", button.dataset.noise === mode);
    });
  }

  function getFormValues() {
    return {
      childName: childNameInput.value.trim(),
      theme: themeInput.value.trim(),
      prompt: promptInput.value.trim(),
      voice: voiceInput.value.trim(),
      providerMode: providerModeInput.value === "model" ? "model" : "template-local",
      model: trimToEmpty(modelInput.value),
      baseUrl: trimToEmpty(baseUrlInput.value),
      apiKeyEnvVar: trimToEmpty(apiKeyEnvVarInput.value),
      temperature: trimToEmpty(temperatureInput.value),
      maxTokens: trimToEmpty(maxTokensInput.value),
      systemPrompt: trimToEmpty(systemPromptInput.value)
    };
  }

  function applyFormValues(values) {
    childNameInput.value = values.childName || "";
    themeInput.value = values.theme || "";
    promptInput.value = values.prompt || "";
    voiceInput.value = values.voice || defaultFormValues.voice;
    providerModeInput.value = values.providerMode === "model" ? "model" : "template-local";
    modelInput.value = values.model || "";
    baseUrlInput.value = values.baseUrl || "";
    apiKeyEnvVarInput.value = values.apiKeyEnvVar || "";
    temperatureInput.value = values.temperature != null ? String(values.temperature) : "";
    maxTokensInput.value = values.maxTokens != null ? String(values.maxTokens) : "";
    systemPromptInput.value = values.systemPrompt || "";
    syncProviderModeUi();
  }

  function persistFormValues() {
    localStorage.setItem(formKey, JSON.stringify(getFormValues()));
  }

  function syncBackendBaseUrlUi() {
    backendBaseUrlInput.value = getBackendBaseUrl();
    heroEndpoint.textContent = getCreateSessionUrl();
  }

  function syncProviderModeUi() {
    const mode = providerModeInput.value === "model" ? "model" : "template-local";
    const isModelMode = mode === "model";

    providerModeSummary.textContent = mode;
    document.body.classList.toggle("model-mode-active", isModelMode);

    [
      modelInput,
      baseUrlInput,
      apiKeyEnvVarInput,
      temperatureInput,
      maxTokensInput,
      systemPromptInput
    ].forEach((input) => {
      input.disabled = !isModelMode;
    });
  }

  function setBackendBaseUrl(nextBaseUrl, sourceLabel) {
    state.backendBaseUrl = nextBaseUrl || DEFAULT_BACKEND_BASE_URL;
    localStorage.setItem(backendBaseUrlKey, state.backendBaseUrl);
    syncBackendBaseUrlUi();

    if (sourceLabel) {
      updateStatus(`后端地址已切换为 ${state.backendBaseUrl}（来源：${sourceLabel}）。`);
    }
  }

  function validateBackendBaseUrl(value) {
    const sanitized = sanitizeBaseUrl(value);
    if (!sanitized) {
      return {
        ok: false,
        message: "后端服务地址不能为空。"
      };
    }

    try {
      const parsed = new URL(sanitized);
      if (!/^https?:$/.test(parsed.protocol)) {
        return {
          ok: false,
          message: "后端服务地址只支持 http:// 或 https://。"
        };
      }
      return {
        ok: true,
        value: sanitizeBaseUrl(parsed.toString())
      };
    } catch (error) {
      return {
        ok: false,
        message: "后端服务地址格式无效，请输入完整地址，例如 http://127.0.0.1:3000。"
      };
    }
  }

  function buildRequestPayload(formValues) {
    const payload = {
      childName: formValues.childName,
      child_name: formValues.childName,
      theme: formValues.theme,
      prompt: formValues.prompt,
      voice: formValues.voice,
      providerMode: formValues.providerMode === "model" ? "model" : "template-local"
    };

    if (formValues.providerMode === "model") {
      if (formValues.model) {
        payload.model = formValues.model;
      }
      if (formValues.baseUrl) {
        payload.baseUrl = formValues.baseUrl;
      }
      if (formValues.apiKeyEnvVar) {
        payload.apiKeyEnvVar = formValues.apiKeyEnvVar;
      }
      if (formValues.systemPrompt) {
        payload.systemPrompt = formValues.systemPrompt;
      }

      const temperature = readOptionalNumber(formValues.temperature, {
        label: "Temperature",
        min: 0,
        max: 2
      });
      if (!temperature.ok) {
        throw new Error(temperature.message);
      }
      if (temperature.hasValue) {
        payload.temperature = temperature.value;
      }

      const maxTokens = readOptionalNumber(formValues.maxTokens, {
        label: "Max Tokens",
        min: 1,
        integerOnly: true
      });
      if (!maxTokens.ok) {
        throw new Error(maxTokens.message);
      }
      if (maxTokens.hasValue) {
        payload.maxTokens = maxTokens.value;
      }
    }

    return payload;
  }

  async function parseResponseBody(response) {
    const rawText = await response.text();
    if (!rawText) {
      return {
        rawText: "",
        data: null
      };
    }

    try {
      return {
        rawText,
        data: JSON.parse(rawText)
      };
    } catch (error) {
      return {
        rawText,
        data: null,
        parseError: error
      };
    }
  }

  function buildHttpErrorMessage(response, rawText) {
    const bodySnippet = rawText ? rawText.trim().slice(0, 300) : "";
    if (response.status === 400) {
      return `请求参数不符合后端预期（HTTP 400）。${bodySnippet ? ` 服务端返回：${bodySnippet}` : ""}`;
    }
    if (response.status === 404) {
      return `没有找到接口 ${getCreateSessionUrl()}（HTTP 404）。请确认后端地址和路由是否正确。`;
    }
    if (response.status >= 500) {
      return `后端服务报错（HTTP ${response.status}）。${bodySnippet ? ` 服务端返回：${bodySnippet}` : ""}`;
    }
    return `请求失败（HTTP ${response.status}${response.statusText ? ` ${response.statusText}` : ""}）。${bodySnippet ? ` 服务端返回：${bodySnippet}` : ""}`;
  }

  function buildFetchErrorMessage(error) {
    if (error && error.name === "TypeError") {
      return "网络请求未完成。请检查后端是否启动、地址是否可访问，或浏览器是否拦截了跨域请求。";
    }
    return error && error.message ? error.message : "未知错误";
  }

  async function copyText(value, successMessage) {
    if (!value) {
      updateStatus("当前没有可复制的内容。", "error");
      return;
    }

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(value);
      } else {
        const helper = document.createElement("textarea");
        helper.value = value;
        helper.setAttribute("readonly", "readonly");
        helper.style.position = "absolute";
        helper.style.left = "-9999px";
        document.body.appendChild(helper);
        helper.select();
        document.execCommand("copy");
        document.body.removeChild(helper);
      }
      updateStatus(successMessage, "success");
    } catch (error) {
      updateStatus("复制失败，请检查浏览器权限或手动复制。", "error");
    }
  }

  async function handleHealthCheck() {
    const backendValidation = validateBackendBaseUrl(backendBaseUrlInput.value);
    if (!backendValidation.ok) {
      updateStatus(backendValidation.message, "error");
      return;
    }

    setBackendBaseUrl(backendValidation.value);
    state.isHealthChecking = true;
    healthCheckBtn.disabled = true;
    healthStatus.textContent = `正在检查 ${getHealthUrl()} ...`;
    healthStatus.className = "status inline-status loading";
    setChecklistItem("backendReachable", "in_progress", `正在请求 ${getHealthUrl()} 。`);
    updateHealthDebug({
      url: getHealthUrl(),
      status: "请求中"
    });

    try {
      const response = await fetch(getHealthUrl(), {
        method: "GET"
      });
      const body = await parseResponseBody(response);
      const summary = {
        url: getHealthUrl(),
        status: `HTTP ${response.status} ${response.statusText || ""}`.trim(),
        body: body.data || body.rawText || "空响应"
      };

      updateHealthDebug(summary);

      if (!response.ok) {
        throw new Error(buildHttpErrorMessage(response, body.rawText));
      }

      healthStatus.textContent = `健康检查成功：${summary.status}`;
      healthStatus.className = "status inline-status success";
      setChecklistItem("backendReachable", "pass", `健康检查通过：${summary.status}`);
      updateStatus(`后端健康检查通过：${summary.status}。`, "success");
    } catch (error) {
      const message = buildFetchErrorMessage(error);
      healthStatus.textContent = `健康检查失败：${message}`;
      healthStatus.className = "status inline-status error";
      setChecklistItem("backendReachable", "fail", `健康检查失败：${message}`);
      updateStatus(`健康检查失败：${message}`, "error");
      updateHealthDebug({
        url: getHealthUrl(),
        status: "请求失败",
        error: message
      });
    } finally {
      state.isHealthChecking = false;
      healthCheckBtn.disabled = false;
    }
  }

  async function handleGenerate(event) {
    event.preventDefault();

    if (state.isGenerating) {
      cancelActiveGeneration("检测到新的生成请求，已先取消上一轮。");
    }

    const formValues = getFormValues();
    const missingFields = [];

    if (!formValues.childName) {
      missingFields.push("宝宝昵称");
    }
    if (!formValues.theme) {
      missingFields.push("今晚主题");
    }
    if (!formValues.voice) {
      missingFields.push("配音音色");
    }

    if (missingFields.length) {
      updateStatus(`请先填写必填字段：${missingFields.join("、")}。`, "error");
      return;
    }

    if (formValues.providerMode === "model" && formValues.baseUrl) {
      const modelBaseUrlValidation = validateBackendBaseUrl(formValues.baseUrl);
      if (!modelBaseUrlValidation.ok) {
        updateStatus(`模型 Base URL 无效：${modelBaseUrlValidation.message}`, "error");
        return;
      }
      formValues.baseUrl = modelBaseUrlValidation.value;
    }

    const backendValidation = validateBackendBaseUrl(backendBaseUrlInput.value);
    if (!backendValidation.ok) {
      updateStatus(backendValidation.message, "error");
      return;
    }

    setBackendBaseUrl(backendValidation.value);

    let requestPayload;
    try {
      requestPayload = buildRequestPayload(formValues);
    } catch (error) {
      updateStatus(error.message || "生成参数无效，请检查模型配置。", "error");
      return;
    }
    const requestUrl = getCreateSessionUrl();
    const request = beginGenerationRequest("form-submit");

    state.lastSubmittedFormValues = {
      ...formValues
    };

    persistFormValues();

    updateStatus(`正在请求 ${requestUrl} ...`, "loading");
    updateAudioStatus("等待后端返回音频地址。", "loading");
    setChecklistItem("backendReachable", "in_progress", `正在连接 ${getBackendBaseUrl()} 。`);
    setChecklistItem("generateRequestSucceeded", "in_progress", `正在请求 ${requestUrl} 。`);
    setChecklistItem("storyReturned", "pending", "等待响应里的故事内容。");
    setChecklistItem("audioReturned", "pending", "等待响应里的音频地址。");
    setChecklistItem("audioPlayable", "pending", "等待播放器开始加载音频。");

    updateDebugPanel({
      requestUrl,
      responseStatus: "请求中",
      requestPayload,
      parsedSummary: "等待响应",
      rawResponse: "等待响应"
    });

    try {
      const response = await fetch(requestUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(requestPayload),
        signal: request.controller.signal
      });

      const responseBody = await parseResponseBody(response);

      if (!state.activeGenerationRequest || state.activeGenerationRequest.id !== request.id) {
        return;
      }

      if (!response.ok) {
        updateDebugPanel({
          requestUrl,
          responseStatus: `HTTP ${response.status} ${response.statusText || ""}`.trim(),
          requestPayload,
          parsedSummary: "请求失败，未进入业务解析",
          rawResponse: responseBody.data || responseBody.rawText || "空响应"
        });
        throw new Error(buildHttpErrorMessage(response, responseBody.rawText));
      }

      if (responseBody.parseError) {
        updateDebugPanel({
          requestUrl,
          responseStatus: `HTTP ${response.status} ${response.statusText || ""}`.trim(),
          requestPayload,
          parsedSummary: "响应不是有效 JSON",
          rawResponse: responseBody.rawText || "空响应"
        });
        throw new Error("后端返回了成功状态，但响应不是有效 JSON，前端无法解析。");
      }

      const parsed = parseBackendResponse({
        data: responseBody.data,
        fallbackVoice: formValues.voice,
        backendBaseUrl: getBackendBaseUrl()
      });

      updateDebugPanel({
        requestUrl,
        responseStatus: `HTTP ${response.status} ${response.statusText || ""}`.trim(),
        requestPayload,
        parsedSummary: summarizeParsedResult(parsed),
        rawResponse: responseBody.data || responseBody.rawText || "空响应"
      });

      setChecklistItem("backendReachable", "pass", `生成接口已成功响应：HTTP ${response.status}。`);
      setChecklistItem("generateRequestSucceeded", "pass", `POST ${CREATE_SESSION_PATH} 成功。`);
      setChecklistItem(
        "storyReturned",
        parsed.hasStoryContent ? "pass" : "fail",
        parsed.hasStoryContent ? `已返回故事《${parsed.story.title}》。` : "响应成功，但没有可展示的故事正文。"
      );
      setChecklistItem(
        "audioReturned",
        parsed.hasAudioUrl ? "pass" : "fail",
        parsed.hasAudioUrl ? `已返回音频地址：${parsed.audio.url}` : "响应成功，但没有音频地址。"
      );

      renderCurrentPanel(parsed, formValues);

      if (parsed.hasAudioUrl) {
        const playPromise = mainPlayer.play();
        if (playPromise && typeof playPromise.catch === "function") {
          playPromise.catch(() => {
            updateStatus("生成成功，音频已加载。如果浏览器拦截了自动播放，请手动点击播放器播放。", "success");
            updateAudioStatus("已可播放，但浏览器拦截了自动播放，请手动点击播放。", "success");
          });
        }
      } else {
        setChecklistItem("audioPlayable", "fail", "没有音频地址，无法验证播放。");
      }
    } catch (error) {
      if (isAbortError(error)) {
        if (state.activeGenerationRequest && state.activeGenerationRequest.id === request.id) {
          updateStatus("当前生成已取消。可以调整参数后重新生成。");
          updateAudioStatus("生成已取消，仍保留上一次成功结果。");
        }
        return;
      }

      const message = buildFetchErrorMessage(error);
      updateStatus(`生成失败：${message}`, "error");
      updateAudioStatus("本次生成失败，未拿到可播放音频。", "error");
      setChecklistItem("backendReachable", "fail", `请求失败：${message}`);
      setChecklistItem("generateRequestSucceeded", "fail", `生成请求失败：${message}`);
      setChecklistItem("storyReturned", "fail", "生成失败，未返回故事内容。");
      setChecklistItem("audioReturned", "fail", "生成失败，未返回音频地址。");
      setChecklistItem("audioPlayable", "fail", "生成失败，无法验证播放。");

      if (debugResponseStatus.textContent === "请求中") {
        updateDebugPanel({
          requestUrl,
          responseStatus: "请求异常",
          requestPayload,
          parsedSummary: "请求未拿到可解析响应",
          rawResponse: message
        });
      }
    } finally {
      finishGenerationRequest(request);
    }
  }

  function restoreLatestSession() {
    const saved = localStorage.getItem(latestSessionKey);
    if (!saved) {
      return;
    }

    try {
      const parsed = JSON.parse(saved);
      if (parsed.formValues) {
        applyFormValues({
          ...defaultFormValues,
          ...parsed.formValues
        });
        state.lastSubmittedFormValues = {
          ...defaultFormValues,
          ...parsed.formValues
        };
      }
      if (parsed.sessionData) {
        const normalized = parseBackendResponse({
          data: parsed.sessionData,
          fallbackVoice: (parsed.formValues && parsed.formValues.voice) || defaultFormValues.voice,
          backendBaseUrl: getBackendBaseUrl()
        });
        renderCurrentPanel(normalized, parsed.formValues || defaultFormValues);
        setChecklistItem("generateRequestSucceeded", "pass", "已恢复最近一次成功生成结果。");
        setChecklistItem("storyReturned", normalized.hasStoryContent ? "pass" : "fail", normalized.hasStoryContent ? "已恢复故事内容。" : "恢复结果里没有故事正文。");
        setChecklistItem("audioReturned", normalized.hasAudioUrl ? "pass" : "fail", normalized.hasAudioUrl ? "已恢复音频地址。" : "恢复结果里没有音频地址。");
        setChecklistItem("audioPlayable", normalized.hasAudioUrl ? "pending" : "fail", normalized.hasAudioUrl ? "已恢复音频地址，等待播放器再次验证。" : "没有音频地址，无法恢复播放状态。");
      }
    } catch (error) {
      localStorage.removeItem(latestSessionKey);
    }
  }

  function initBackendBaseUrl() {
    const fromQuery = getBackendBaseUrlFromQuery();
    const fromStorage = sanitizeBaseUrl(localStorage.getItem(backendBaseUrlKey));
    const candidate = fromQuery || fromStorage || DEFAULT_BACKEND_BASE_URL;
    const validation = validateBackendBaseUrl(candidate);

    if (!validation.ok) {
      state.backendBaseUrl = DEFAULT_BACKEND_BASE_URL;
      localStorage.setItem(backendBaseUrlKey, DEFAULT_BACKEND_BASE_URL);
    } else {
      state.backendBaseUrl = validation.value;
      localStorage.setItem(backendBaseUrlKey, validation.value);
    }

    syncBackendBaseUrlUi();
  }

  function init() {
    const savedAmbient = localStorage.getItem(ambientKey) || "medium";
    const savedNoise = localStorage.getItem(noiseKey) || "none";

    try {
      const savedForm = JSON.parse(localStorage.getItem(formKey) || "null");
      applyFormValues({
        ...defaultFormValues,
        ...(savedForm || {})
      });
    } catch (error) {
      applyFormValues(defaultFormValues);
    }

    initBackendBaseUrl();
    setAmbient(savedAmbient);
    setNoise(savedNoise);
    syncProviderModeUi();
    resetCurrentPanel({
      keepStatus: true,
      clearStored: false
    });
    restoreLatestSession();

    updateDebugPanel({
      requestUrl: getCreateSessionUrl(),
      responseStatus: "尚未请求",
      requestPayload: "尚未请求",
      parsedSummary: "尚未请求",
      rawResponse: "尚未请求",
      healthCheck: "尚未检查"
    });

    healthStatus.textContent = "尚未执行健康检查。";
    healthStatus.className = "status inline-status";
    setChecklistItem("pageLoaded", "pass", `页面已加载，当前后端地址为 ${getBackendBaseUrl()} 。`);
    updateGenerateControls();
    setResultActionsState();
  }

  generationForm.addEventListener("submit", handleGenerate);
  providerModeInput.addEventListener("change", () => {
    syncProviderModeUi();
    persistFormValues();
  });
  [
    modelInput,
    baseUrlInput,
    apiKeyEnvVarInput,
    temperatureInput,
    maxTokensInput,
    systemPromptInput
  ].forEach((input) => {
    input.addEventListener("input", persistFormValues);
  });

  resetFormBtn.addEventListener("click", () => {
    applyFormValues(defaultFormValues);
    persistFormValues();
    updateStatus("已恢复默认示例参数，可以直接重新生成。");
  });

  saveBackendBtn.addEventListener("click", () => {
    const validation = validateBackendBaseUrl(backendBaseUrlInput.value);
    if (!validation.ok) {
      updateStatus(validation.message, "error");
      return;
    }

    setBackendBaseUrl(validation.value, "手动保存");
  });

  resetBackendBtn.addEventListener("click", () => {
    setBackendBaseUrl(DEFAULT_BACKEND_BASE_URL, "恢复默认");
  });

  healthCheckBtn.addEventListener("click", handleHealthCheck);

  cancelGenerateBtn.addEventListener("click", () => {
    if (!cancelActiveGeneration("已取消当前生成请求。")) {
      updateStatus("当前没有进行中的生成请求。");
    }
  });

  playCurrentBtn.addEventListener("click", () => {
    if (!hasAudioSource()) {
      updateStatus("当前还没有可播放的音频，请先生成一次。", "error");
      return;
    }

    const playPromise = mainPlayer.play();
    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch(() => {
        updateStatus("浏览器拦截了自动播放。请直接点击原生音频播放器中的播放键。", "error");
      });
    }
  });

  copyStoryBtn.addEventListener("click", () => {
    copyText(currentDescription.textContent.trim(), "故事正文已复制到剪贴板。");
  });

  copyAudioUrlBtn.addEventListener("click", () => {
    copyText(mainSource.getAttribute("src"), "音频地址已复制到剪贴板。");
  });

  clearCurrentBtn.addEventListener("click", () => {
    if (state.isGenerating) {
      cancelActiveGeneration("已取消当前生成，并清空当前结果。");
    }
    resetCurrentPanel();
  });

  regenerateBtn.addEventListener("click", () => {
    if (!state.lastSubmittedFormValues || state.isGenerating) {
      updateStatus("还没有可重试的生成参数。", "error");
      return;
    }

    applyFormValues(state.lastSubmittedFormValues);
    persistFormValues();
    generationForm.requestSubmit();
  });

  document.getElementById("ambientOptions").addEventListener("click", (event) => {
    const trigger = event.target.closest("[data-ambient]");
    if (trigger) {
      setAmbient(trigger.dataset.ambient);
    }
  });

  document.getElementById("noiseOptions").addEventListener("click", (event) => {
    const trigger = event.target.closest("[data-noise]");
    if (trigger) {
      setNoise(trigger.dataset.noise);
    }
  });

  mainPlayer.addEventListener("loadstart", () => {
    if (hasAudioSource()) {
      updateAudioStatus("播放器开始请求音频。", "loading");
      setChecklistItem("audioPlayable", "in_progress", "播放器正在请求音频文件。");
    }
  });

  mainPlayer.addEventListener("loadedmetadata", () => {
    if (hasAudioSource()) {
      const duration = Number.isFinite(mainPlayer.duration) ? `，时长约 ${Math.round(mainPlayer.duration)} 秒` : "";
      updateAudioStatus(`音频元数据已加载${duration}。`, "success");
      setChecklistItem("audioPlayable", "in_progress", `音频元数据已加载${duration || "。"} 等待可播放状态。`);
    }
  });

  mainPlayer.addEventListener("canplay", () => {
    if (hasAudioSource()) {
      updateAudioStatus("音频已加载完成，可以播放。", "success");
      setChecklistItem("audioPlayable", "pass", "播放器已经进入可播放状态。");
    }
  });

  mainPlayer.addEventListener("waiting", () => {
    if (hasAudioSource()) {
      updateAudioStatus("音频缓冲中，请稍候。", "loading");
      setChecklistItem("audioPlayable", "in_progress", "播放器正在缓冲音频。");
    }
  });

  mainPlayer.addEventListener("play", () => {
    if (currentTitle.textContent) {
      updateStatus(`正在播放《${currentTitle.textContent}》。`, "success");
      updateAudioStatus("正在播放。", "success");
      setChecklistItem("audioPlayable", "pass", "音频已经开始播放。");
    }
  });

  mainPlayer.addEventListener("pause", () => {
    if (!mainPlayer.ended && hasAudioSource()) {
      updateStatus(`《${currentTitle.textContent}》已暂停，可以稍后继续。`);
      updateAudioStatus("已暂停，可以继续播放。");
    }
  });

  mainPlayer.addEventListener("ended", () => {
    if (hasAudioSource()) {
      updateStatus(`《${currentTitle.textContent}》播放完成。`);
      updateAudioStatus("播放完成。");
    }
  });

  mainPlayer.addEventListener("error", () => {
    if (hasAudioSource()) {
      updateAudioStatus("播放器加载失败，请检查音频地址或后端静态文件服务。", "error");
      setChecklistItem("audioPlayable", "fail", "播放器无法加载当前音频。");
      updateStatus("音频加载失败，请检查返回的 MP3 地址是否可访问。", "error");
    }
  });

  init();
})();
