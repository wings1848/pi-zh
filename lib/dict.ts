/**
 * pi-zh 词典总表 — 唯一数据源（v0.3）
 *
 * 所有汉化条目集中在此，新增/修改汉化只需编辑本文件。
 * 每条目是 [英文原文, 中文译文]，补丁引擎按精确全串匹配替换。
 * 条目按 target 分组：TARGET_DICTS[targetName] = DictEntry[]。
 *
 * 注意事项：
 * 1. 英文原文必须与目标文件内容逐字一致（含空格/标点/转义）
 * 2. 原文应当足够长/独特，避免误伤代码标识符
 * 3. 工具 schema（给 AI 的 description）不在此列——汉化会影响模型理解
 */

export interface DictEntry {
  /** 英文原文（target 文件中逐字出现） */
  en: string;
  /** 中文译文 */
  zh: string;
  /** 限定目标文件（相对包根；省略则应用于该 target 的全部文件） */
  targetFiles?: string[];
  /** 备注 */
  note?: string;
}

// ---------------------------------------------------------------------------
// target: pi — Pi 本体（命令补全 + TUI 文案）
// ---------------------------------------------------------------------------

/**
 * pi 内置 slash 命令描述（输入框 / 自动补全面板）
 * 目标：dist/core/slash-commands.js（发行独立文件）+ bundle chunk（内嵌副本）
 */
const PI_COMMAND_DESCRIPTIONS: DictEntry[] = [
  { en: '"Open settings menu"', zh: '"打开设置菜单"', note: "/settings" },
  { en: '"Select model (opens selector UI)"', zh: '"选择模型（打开选择器）"', note: "/model" },
  { en: '"Navigate session tree (switch branches)"', zh: '"导航会话树（切换分支）"', note: "/tree" },
  { en: '"Set thinking level"', zh: '"设置思考级别"', note: "/thinking" },
  { en: '"Enable/disable models for Ctrl+P cycling"', zh: '"启用/禁用 Ctrl+P 循环模型"', note: "/scoped-models" },
  { en: '"Export session (HTML default, or specify path: .html/.jsonl)"', zh: '"导出会话（默认 HTML，可指定 .html/.jsonl 路径）"', note: "/export" },
  { en: '"Import and resume a session from a JSONL file"', zh: '"从 JSONL 文件导入并恢复会话"', note: "/import" },
  { en: '"Share session as a secret GitHub gist"', zh: '"将会话分享为私有 GitHub Gist"', note: "/share" },
  { en: '"Copy last agent message to clipboard"', zh: '"复制最后一条助手消息到剪贴板"', note: "/copy" },
  { en: '"Set session display name"', zh: '"设置会话显示名称"', note: "/name" },
  { en: '"Show session info and stats"', zh: '"显示会话信息与统计"', note: "/session" },
  { en: '"Show changelog entries"', zh: '"显示更新日志记录"', note: "/changelog" },
  { en: '"Show all keyboard shortcuts"', zh: '"显示全部键盘快捷键"', note: "/hotkeys" },
  { en: '"Create a new fork from a previous user message"', zh: '"从之前的用户消息创建新分支"', note: "/fork" },
  { en: '"Duplicate the current session at the current position"', zh: '"在当前位置复制当前会话"', note: "/clone" },
  { en: '"Save project trust decision for future sessions"', zh: '"为后续会话保存项目信任决策"', note: "/trust" },
  { en: '"Configure provider authentication"', zh: '"配置服务商认证"', note: "/login" },
  { en: '"Remove provider authentication"', zh: '"移除服务商认证"', note: "/logout" },
  { en: '"Start a new session"', zh: '"开始新会话"', note: "/new" },
  { en: '"Manually compact the session context"', zh: '"手动压缩会话上下文"', note: "/compact" },
  { en: '"Resume a different session"', zh: '"恢复其他会话"', note: "/resume" },
  { en: '"Reload keybindings, extensions, skills, prompts, themes, and context files"', zh: '"重载快捷键、扩展、技能、提示词、主题与上下文文件"', note: "/reload" },
  { en: '`Quit ${APP_NAME}`', zh: '`退出 ${APP_NAME}`', note: "/quit（模板字符串）" },
];

/** pi TUI 界面文案（bundle chunk 内唯一短语） */
const PI_TUI_DESCRIPTIONS: DictEntry[] = [
  { en: '"Keyboard Shortcuts"', zh: '"键盘快捷键"', note: "/hotkeys 面板标题" },
  { en: '"\\u2713 New session started"', zh: '"\\u2713 新会话已开始"', note: "/new 完成提示" },
];

// ---------------------------------------------------------------------------
// target: pi — /hotkeys 快捷键面板（bundle chunk 内模板字符串）
// ---------------------------------------------------------------------------

const PI_HOTKEYS_PANEL: DictEntry[] = [
  // 面板标题
  { en: 'hotkeys=`\n**Navigation**', zh: 'hotkeys=`\n**导航**', note: "/hotkeys 节标题" },
  { en: '\n\n**Editing**\n', zh: '\n\n**编辑**\n', note: "/hotkeys 节标题" },
  { en: '\n\n**Other**\n', zh: '\n\n**其他**\n', note: "/hotkeys 节标题" },
  // 表头（仅存在于 hotkeys 模板中，3 处）
  { en: '| Key | Action |\n|-----|--------|', zh: '| 按键 | 操作 |\n|-----|--------|', note: "hotkeys 表头" },
  // Navigation 节动作说明
  { en: 'Move cursor / browse history', zh: '移动光标 / 浏览历史', note: "navigation" },
  { en: 'Move by word', zh: '按词移动', note: "navigation" },
  { en: 'Start of line', zh: '行首', note: "navigation" },
  { en: 'End of line', zh: '行尾', note: "navigation" },
  { en: 'Jump forward to character', zh: '向前跳到字符', note: "navigation" },
  { en: 'Jump backward to character', zh: '向后跳到字符', note: "navigation" },
  { en: 'Scroll by page', zh: '按页滚动', note: "navigation" },
  // Editing 节动作说明
  { en: 'Send message', zh: '发送消息', note: "editing" },
  { en: 'New line', zh: '换行', note: "editing" },
  { en: "(Ctrl+Enter on Windows Terminal)", zh: "（Windows 终端为 Ctrl+Enter）", note: "editing" },
  { en: 'Delete word backwards', zh: '向后删除单词', note: "editing" },
  { en: 'Delete word forwards', zh: '向前删除单词', note: "editing" },
  { en: 'Delete to start of line', zh: '删除到行首', note: "editing" },
  { en: 'Delete to end of line', zh: '删除到行尾', note: "editing" },
  { en: 'Paste the most-recently-deleted text', zh: '粘贴最近删除的文本', note: "editing" },
  { en: 'Cycle through the deleted text after pasting', zh: '粘贴后循环切换已删除文本', note: "editing" },
  { en: 'Undo', zh: '撤销', note: "editing" },
  // Other 节动作说明
  { en: 'Path completion / accept autocomplete', zh: '路径补全 / 接受自动补全', note: "other" },
  { en: 'Cancel autocomplete / abort streaming', zh: '取消自动补全 / 中止流式输出', note: "other" },
  { en: 'Clear editor (first) / exit (second)', zh: '清空编辑器（第一次）/ 退出（第二次）', note: "other" },
  { en: 'Exit (when editor is empty)', zh: '退出（编辑器为空时）', note: "other" },
  { en: 'Suspend to background', zh: '挂起到后台', note: "other" },
  { en: 'Cycle thinking level', zh: '循环切换思考级别', note: "other" },
  { en: 'Cycle models', zh: '循环切换模型', note: "other" },
  { en: 'Open model selector', zh: '打开模型选择器', note: "other" },
  { en: 'Toggle tool output expansion', zh: '切换工具输出展开', note: "other" },
  { en: 'Toggle thinking block visibility', zh: '切换思考块可见性', note: "other" },
  { en: 'Edit message in external editor', zh: '在外部编辑器中编辑消息', note: "other" },
  { en: 'Copy last assistant message', zh: '复制最后一条助手消息', note: "other" },
  { en: 'Queue follow-up message', zh: '排队后续消息', note: "other" },
  { en: 'Restore queued messages', zh: '恢复排队消息', note: "other" },
  { en: 'Paste image or text from clipboard', zh: '从剪贴板粘贴图片或文本', note: "other" },
  { en: 'Slash commands', zh: '斜杠命令', note: "other" },
  { en: 'Run bash command', zh: '运行 bash 命令', note: "other" },
  { en: 'Run bash command (excluded from context)', zh: '运行 bash 命令（不进入上下文）', note: "other" },
  // Extensions 节
  { en: '**Extensions**\n| Key | Action |\n|-----|--------|', zh: '**扩展**\n| 按键 | 操作 |\n|-----|--------|', note: "extensions 节标题" },
];
// ---------------------------------------------------------------------------
// target: pi — /session 会话信息面板
// ---------------------------------------------------------------------------

const PI_SESSION_PANEL: DictEntry[] = [
  { en: 'theme.bold("Session Info")', zh: 'theme.bold("会话信息")', note: "标题" },
  { en: 'theme.fg("dim","Name:")', zh: 'theme.fg("dim","名称:")', note: "字段" },
  { en: 'theme.fg("dim","File:")', zh: 'theme.fg("dim","文件:")', note: "字段" },
  { en: '"In-memory"', zh: '"内存会话"', note: "文件列占位" },
  { en: 'theme.bold("Messages")', zh: 'theme.bold("消息")', note: "节标题" },
  { en: 'theme.fg("dim","Total:")', zh: 'theme.fg("dim","总计:")', note: "字段" },
  { en: 'theme.fg("dim","User:")', zh: 'theme.fg("dim","用户:")', note: "字段" },
  { en: 'theme.fg("dim","Assistant:")', zh: 'theme.fg("dim","助手:")', note: "字段" },
  { en: 'theme.fg("dim","Tools:")', zh: 'theme.fg("dim","工具:")', note: "字段" },
  { en: 'theme.bold("Tokens")', zh: 'theme.bold("令牌")', note: "节标题" },
  { en: 'theme.fg("dim","Input:")', zh: 'theme.fg("dim","输入:")', note: "字段" },
  { en: 'theme.fg("dim","Cached:")', zh: 'theme.fg("dim","缓存:")', note: "字段" },
  { en: 'theme.fg("dim","Uncached:")', zh: 'theme.fg("dim","未缓存:")', note: "字段" },
  { en: '`(${cacheWrite.toLocaleString()} written to cache)`', zh: '`(${cacheWrite.toLocaleString()} 已写入缓存)`', note: "写入提示" },
  { en: 'theme.fg("dim","Output:")', zh: 'theme.fg("dim","输出:")', note: "字段" },
  { en: 'theme.bold("Cost")', zh: 'theme.bold("费用")', note: "节标题" },
  { en: 'theme.fg("dim","Cache Re-billed:")', zh: 'theme.fg("dim","缓存重新计费:")', note: "字段" },
  { en: '"1 miss"', zh: '"1 次未命中"', note: "缓存未命中" },
  { en: '`${cacheWaste.missCount} misses`', zh: '`${cacheWaste.missCount} 次未命中`', note: "缓存未命中" },
  { en: '"Show session info and stats"', zh: '"显示会话信息与统计"', note: "命令描述（已有）—— 保留" },
];

// ---------------------------------------------------------------------------
// target: pi — /settings 设置面板
// ---------------------------------------------------------------------------

const PI_SETTINGS_PANEL: DictEntry[] = [
  // 顶级子菜单标题
  { en: 'new SelectSubmenu("Theme"', zh: 'new SelectSubmenu("主题"', note: "Theme 子菜单" },
  // settings 项（label + description 均替换；label 完整串）
  { en: 'label:"Anthropic extra usage"', zh: 'label:"Anthropic 额外用量"', note: "设置项" },
  { en: 'description:"Warn when Anthropic subscription auth may use paid extra usage"', zh: 'description:"当 Anthropic 订阅认证可能产生付费额外用量时警告"', note: "设置项说明" },
  { en: 'label:"Light theme"', zh: 'label:"浅色主题"', note: "设置项" },
  { en: 'description:"Theme to use in automatic mode when the terminal is light"', zh: 'description:"终端为浅色时自动模式使用的主题"', note: "设置项说明" },
  { en: 'label:"Dark theme"', zh: 'label:"深色主题"', note: "设置项" },
  { en: 'description:"Theme to use in automatic mode when the terminal is dark"', zh: 'description:"终端为深色时自动模式使用的主题"', note: "设置项说明" },
  { en: 'label:"Apply"', zh: 'label:"应用"', note: "设置项" },
  { en: 'description:"Save and go back"', zh: 'description:"保存并返回"', note: "设置项说明" },
  { en: 'label:"Change mode"', zh: 'label:"切换模式"', note: "设置项" },
  { en: 'description:"Switch to one theme for light and dark"', zh: 'description:"浅色和深色共用一套主题"', note: "设置项说明" },
  { en: 'label:"Auto-compact"', zh: 'label:"自动压缩"', note: "设置项" },
  { en: 'description:"Automatically compact context when it gets too large"', zh: 'description:"上下文过大时自动压缩"', note: "设置项说明" },
  { en: 'label:"Steering mode"', zh: 'label:"引导模式"', note: "设置项" },
  { en: 'label:"Transport"', zh: 'label:"传输方式"', note: "设置项" },
  { en: 'description:"Preferred transport for providers that support multiple transports"', zh: 'description:"支持多种传输的服务商首选传输方式"', note: "设置项说明" },
  { en: 'label:"HTTP idle timeout"', zh: 'label:"HTTP 空闲超时"', note: "设置项" },
  { en: 'label:"Hide thinking"', zh: 'label:"隐藏思考"', note: "设置项" },
  { en: 'description:"Hide thinking blocks in assistant responses"', zh: 'description:"在助手回复中隐藏思考块"', note: "设置项说明" },
  { en: 'label:"Mermaid diagrams"', zh: 'label:"Mermaid 图表"', note: "设置项" },
  { en: 'label:"Cache miss notices"', zh: 'label:"缓存未命中提示"', note: "设置项" },
  { en: 'label:"Collapse changelog"', zh: 'label:"折叠更新日志"', note: "设置项" },
  { en: 'label:"Quiet startup"', zh: 'label:"静默启动"', note: "设置项" },
  { en: 'description:"Disable verbose printing at startup"', zh: 'description:"启动时不打印详情信息"', note: "设置项说明" },
  { en: 'label:"Install telemetry"', zh: 'label:"安装遥测"', note: "设置项" },
  { en: 'label:"Default project trust"', zh: 'label:"默认项目信任"', note: "设置项" },
  { en: 'label:"Double-escape action"', zh: 'label:"双击 Escape 行为"', note: "设置项" },
  { en: 'label:"Tree filter mode"', zh: 'label:"会话树过滤模式"', note: "设置项" },
  { en: 'description:"Default filter when opening /tree"', zh: 'description:"打开 /tree 时的默认过滤"', note: "设置项说明" },
  { en: 'label:"Warnings"', zh: 'label:"警告"', note: "设置项" },
  { en: 'description:"Enable or disable individual warnings"', zh: 'description:"启用或禁用单项警告"', note: "设置项说明" },
  { en: 'label:"TUI mode"', zh: 'label:"TUI 模式"', note: "设置项" },
  { en: 'description:"Interface layout; fullscreen mode is experimental"', zh: 'description:"界面布局；全屏模式为实验性"', note: "设置项说明" },
  { en: 'label:"Fullscreen exit output"', zh: 'label:"全屏退出输出"', note: "设置项" },
  { en: 'label:"Fullscreen scrollbar"', zh: 'label:"全屏滚动条"', note: "设置项" },
  { en: 'label:"Fullscreen copy on select"', zh: 'label:"全屏选中复制"', note: "设置项" },
  { en: 'label:"Theme"', zh: 'label:"主题"', note: "设置项（两处）" },
  { en: 'description:"Color theme for the interface"', zh: 'description:"界面配色主题"', note: "设置项说明" },
  { en: 'label:"Show images"', zh: 'label:"显示图片"', note: "设置项" },
  { en: 'label:"Image width"', zh: 'label:"图片宽度"', note: "设置项" },
  { en: 'label:"Auto-resize images"', zh: 'label:"自动调整图片大小"', note: "设置项" },
  { en: 'label:"Block images"', zh: 'label:"屏蔽图片"', note: "设置项" },
  { en: 'label:"Skill commands"', zh: 'label:"技能命令"', note: "设置项" },
  { en: 'description:"Register skills as /skill:name commands"', zh: 'description:"将技能注册为 /skill:name 命令"', note: "设置项说明" },
  { en: 'label:"Show hardware cursor"', zh: 'label:"显示硬件光标"', note: "设置项" },
  { en: 'label:"Editor padding"', zh: 'label:"编辑器内边距"', note: "设置项" },
  { en: 'label:"Output padding"', zh: 'label:"输出内边距"', note: "设置项" },
  { en: 'label:"Autocomplete max items"', zh: 'label:"自动补全最大项数"', note: "设置项" },
  { en: 'label:"Clear on shrink"', zh: 'label:"缩小时清空"', note: "设置项" },
  { en: 'label:"Terminal progress"', zh: 'label:"终端进度"', note: "设置项" },
  // 子菜单/值选项
  { en: '"Deep reasoning (~16k tokens)"', zh: '"深度思考（~16k 令牌）"', note: "thinking 级别" },
  { en: '"Extra-high reasoning (~32k tokens)"', zh: '"超高思考（~32k 令牌）"', note: "thinking 级别" },
  { en: '"Light reasoning (~2k tokens)"', zh: '"轻量思考（~2k 令牌）"', note: "thinking 级别" },
  { en: '"Moderate reasoning (~8k tokens)"', zh: '"中等思考（~8k 令牌）"', note: "thinking 级别" },
  { en: '"Very brief reasoning (~1k tokens)"', zh: '"极简思考（~1k 令牌）"', note: "thinking 级别" },
  { en: '"No reasoning"', zh: '"无思考"', note: "thinking 级别" },
  { en: '"Maximum reasoning"', zh: '"最大思考"', note: "thinking 级别" },
  { en: '"Per-Model Thinking Level"', zh: '"按模型思考级别"', note: "子菜单标题" },
  { en: '"Always trust"', zh: '"总是信任"', note: "信任选项" },
  { en: '"Never trust"', zh: '"从不信任"', note: "信任选项" },
  { en: '"Log in to a provider or configure an API key first"', zh: '"请先登录服务商或配置 API 密钥"', note: "提示" },
  { en: '"No models available"', zh: '"没有可用模型"', note: "提示" },
  { en: '"Select a model to configure"', zh: '"选择要配置的模型"', note: "提示" },
];

// 占位条目会被过滤（zh 为 null 的无意义条目在此剔除）
const cleanHotkeys = PI_HOTKEYS_PANEL.filter((e) => e.zh !== null);
const cleanSession = PI_SESSION_PANEL.filter((e) => e.zh !== null);

// ---------------------------------------------------------------------------
// target: telegram — pi-telegram（菜单卡片/状态卡/子菜单）
// ---------------------------------------------------------------------------

const TELEGRAM_PATCHES: DictEntry[] = [
  // 菜单卡片命令说明
  { en: '/start — Open menu / Pair bridge', zh: '/start — 打开菜单 / 配对桥接', targetFiles: ["lib/commands.ts"] },
  { en: '/compact — Compact current session', zh: '/compact — 压缩当前会话', targetFiles: ["lib/commands.ts"] },
  { en: '/next — Force next turn', zh: '/next — 强制下一轮', targetFiles: ["lib/commands.ts"] },
  { en: '/continue — Queue continue prompt', zh: '/continue — 排入继续提示', targetFiles: ["lib/commands.ts"] },
  { en: '/abort — Abort Pi', zh: '/abort — 中止 Pi', targetFiles: ["lib/commands.ts"] },
  { en: '/stop — Abort Pi & Clear queue', zh: '/stop — 中止 Pi 并清空队列', targetFiles: ["lib/commands.ts"] },
  // 状态卡标签
  { en: 'buildStatusRow(\n      "Status",', zh: 'buildStatusRow(\n      "状态",', targetFiles: ["lib/status.ts"] },
  { en: 'buildStatusRow("Status",', zh: 'buildStatusRow("状态",', targetFiles: ["lib/status.ts"] },
  { en: 'buildStatusRow("Tokens", usageSummary)', zh: 'buildStatusRow("令牌", usageSummary)', targetFiles: ["lib/status.ts"] },
  { en: 'buildStatusRow("Cache", cacheSummary)', zh: 'buildStatusRow("缓存", cacheSummary)', targetFiles: ["lib/status.ts"] },
  { en: 'buildStatusRow("Cost", costSummary)', zh: 'buildStatusRow("费用", costSummary)', targetFiles: ["lib/status.ts"] },
  { en: 'buildStatusRow("Context", buildContextSummary(ctx, activeModel))', zh: 'buildStatusRow("上下文", buildContextSummary(ctx, activeModel))', targetFiles: ["lib/status.ts"] },
  // 状态摘要值
  { en: 'if (state.hasActiveTurn || state.activeToolExecutions > 0) return "active";', zh: 'if (state.hasActiveTurn || state.activeToolExecutions > 0) return "忙碌";', targetFiles: ["lib/status.ts"] },
  { en: 'if (ctx.isCompactionInProgress?.()) return "compacting";', zh: 'if (ctx.isCompactionInProgress?.()) return "压缩中";', targetFiles: ["lib/status.ts"] },
  { en: 'if (ctx.hasPendingMessages?.()) return "pending";', zh: 'if (ctx.hasPendingMessages?.()) return "待处理";', targetFiles: ["lib/status.ts"] },
  { en: 'if (ctx.isIdle?.() === false) return "active";', zh: 'if (ctx.isIdle?.() === false) return "忙碌";', targetFiles: ["lib/status.ts"] },
  { en: 'if (ctx.isIdle?.() === true) return "idle";', zh: 'if (ctx.isIdle?.() === true) return "空闲";', targetFiles: ["lib/status.ts"] },
  // 菜单按钮
  { en: '`${formatTelegramCommandEmojiPrefix("model")}Model`', zh: '`${formatTelegramCommandEmojiPrefix("model")}模型`', targetFiles: ["lib/menu-status.ts"] },
  { en: '`${formatTelegramCommandEmojiPrefix("thinking")}Thinking`', zh: '`${formatTelegramCommandEmojiPrefix("thinking")}思考`', targetFiles: ["lib/menu-status.ts"] },
  { en: '`${queueItemCount === 0 ? "⌛" : "⏳"} Queue: ${queueItemCount}`', zh: '`${queueItemCount === 0 ? "⌛" : "⏳"} 队列: ${queueItemCount}`', targetFiles: ["lib/menu-status.ts"] },
  { en: '"⚙️ Settings",\n      callback_data: "menu:settings",', zh: '"⚙️ 设置",\n      callback_data: "menu:settings",', targetFiles: ["lib/menu-status.ts"] },
  // 子菜单标题
  { en: 'MODEL_MENU_TITLE = "<b>🤖 Choose a model:</b>"', zh: 'MODEL_MENU_TITLE = "<b>🤖 选择模型：</b>"', targetFiles: ["lib/menu-model.ts"] },
  { en: 'MODEL_DETAIL_MENU_TITLE = "<b>🤖 Model:</b>"', zh: 'MODEL_DETAIL_MENU_TITLE = "<b>🤖 模型：</b>"', targetFiles: ["lib/menu-model.ts"] },
  { en: 'return "<b>🧠 Choose a thinking level:</b>";', zh: 'return "<b>🧠 选择思考级别：</b>";', targetFiles: ["lib/menu-thinking.ts"] },
  { en: 'SETTINGS_MENU_TITLE = "<b>⚙️ Settings:</b>"', zh: 'SETTINGS_MENU_TITLE = "<b>⚙️ 设置：</b>"', targetFiles: ["lib/menu-settings.ts"] },
  { en: '"<b>🧹 Thread cleanup:</b>";', zh: '"<b>🧹 会话清理：</b>";', targetFiles: ["lib/menu-settings.ts"] },
  { en: 'DRAFT_PREVIEWS_SETTINGS_TITLE = "<b>📝 Draft previews:</b>"', zh: 'DRAFT_PREVIEWS_SETTINGS_TITLE = "<b>📝 草稿预览：</b>"', targetFiles: ["lib/menu-settings.ts"] },
  { en: '"<b>🧾 Assistant rendering:</b>";', zh: '"<b>🧾 助手渲染：</b>";', targetFiles: ["lib/menu-settings.ts"] },
  { en: '"<b>🔬 Activity:</b>";', zh: '"<b>🔬 活动：</b>";', targetFiles: ["lib/menu-settings.ts"] },
  { en: '"<b>🕒 Time injection mode:</b>";', zh: '"<b>🕒 时间注入模式：</b>";', targetFiles: ["lib/menu-settings.ts"] },
  { en: 'VOICE_REPLY_MODE_SETTINGS_TITLE = "<b>👄 Voice reply mode:</b>"', zh: 'VOICE_REPLY_MODE_SETTINGS_TITLE = "<b>👄 语音回复模式：</b>"', targetFiles: ["lib/menu-settings.ts"] },
  // 导航
  { en: '{ text: "⬆️ Main menu", callback_data: "menu:back" }', zh: '{ text: "⬆️ 主菜单", callback_data: "menu:back" }', targetFiles: ["lib/menu-model.ts", "lib/menu-thinking.ts", "lib/menu-queue.ts", "lib/menu-settings.ts"] },
  { en: '[{ text: "⬆️ Back", callback_data: "queue:list" }]', zh: '[{ text: "⬆️ 返回", callback_data: "queue:list" }]', targetFiles: ["lib/menu-queue.ts"] },
  // 队列空状态
  { en: '"<b>🛸 No queued signals detected.</b>",', zh: '"<b>🛸 未检测到排队信号。</b>",', targetFiles: ["lib/menu-queue.ts"] },
  { en: 'if (items.length > 0) return "<b>⏳ Queue:</b>";', zh: 'if (items.length > 0) return "<b>⏳ 队列：</b>";', targetFiles: ["lib/menu-queue.ts"] },
  { en: '"<b>🕳 Nothing queued yet.</b>",', zh: '"<b>🕳 队列中还没有任务。</b>",', targetFiles: ["lib/menu-queue.ts"] },
];

// ---------------------------------------------------------------------------
// target: cache-optimizer — pi-cache-optimizer（/cache-optimizer 命令与提示）
// ---------------------------------------------------------------------------

const CACHE_OPTIMIZER_PATCHES: DictEntry[] = [
  // 命令描述
  { en: 'description: "Configure and diagnose Pi cache behavior"', zh: 'description: "配置和诊断 Pi 缓存行为"', targetFiles: ["index.ts"] },
  // 用户可见提示
  { en: '"No active model selected. Select a model first with /model or pi --model."', zh: '"未选择活动模型。请先用 /model 或 pi --model 选择模型。"', targetFiles: ["index.ts"] },
  { en: '"ℹ️ Active model does not match a cache adapter. No stats to reset."', zh: '"ℹ️ 活动模型不匹配缓存适配器。没有可重置的统计。"', targetFiles: ["index.ts"] },
  { en: '"No changes were made. Canceled by user."', zh: '"未做任何修改。已被用户取消。"', targetFiles: ["index.ts"] },
  { en: '"✅ Compat fully configured."', zh: '"✅ 兼容配置完成。"', targetFiles: ["index.ts"] },
  { en: '"Upstream provider prompt cache was not modified. "', zh: '"上游服务商提示缓存未被修改。"', targetFiles: ["index.ts"] },
  { en: '"Usage: /cache-optimizer stats [all|contributors]"', zh: '"用法：/cache-optimizer stats [all|contributors]"', targetFiles: ["index.ts"] },
];

// ---------------------------------------------------------------------------
// 导出：按 target 分组
// ---------------------------------------------------------------------------

export const TARGET_DICTS: Record<string, DictEntry[]> = {
  pi: [
    ...PI_COMMAND_DESCRIPTIONS,
    ...PI_TUI_DESCRIPTIONS,
    ...cleanHotkeys,
    ...cleanSession,
    ...PI_SETTINGS_PANEL,
  ],
  telegram: TELEGRAM_PATCHES,
  "cache-optimizer": CACHE_OPTIMIZER_PATCHES,
};

/** 全部条目（兼容旧接口的汇总） */
export const ALL_ENTRIES: DictEntry[] = Object.values(TARGET_DICTS).flat();
