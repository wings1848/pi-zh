#!/usr/bin/env node
/**
 * telegram-zh outbound 词典脚本
 *
 * 供 telegram.json 配置式 outboundHandlers（type: "text"）调用：
 * 从 stdin 读取插件发送的文本，对固定 UI 英文短语做精确整句替换，写回 stdout。
 * 只替换完整的、带标记的插件固定文案，避免误伤 agent 回复内容。
 * 未命中任何短语时原样输出（stdout 非空是配置式 handler 生效的前提）。
 */

import { readFileSync } from "node:fs";

/** 精确短语替换表：EN → ZH。按完整字符串匹配（split/join 全量替换，包含 HTML 标签片段） */
const DICTIONARY = [
  // --- busy / 状态提示 ---
  ["<b>⏳ Cannot open status while Pi is busy. Send /abort, /next, or /stop.</b>",
   "<b>⏳ Pi 忙，无法打开状态菜单。请发送 /abort、/next 或 /stop。</b>"],
  ["<b>⏳ Cannot switch model while Pi is busy. Send /abort, /next, or /stop.</b>",
   "<b>⏳ Pi 忙，无法切换模型。请发送 /abort、/next 或 /stop。</b>"],
  ["<b>🚫 Cannot compact while Pi or the Telegram queue is busy.</b>",
   "<b>🚫 Pi 或 Telegram 队列忙，无法压缩会话。</b>"],
  ["Pi is busy. Send /abort or /stop first.",
   "Pi 忙，请先发送 /abort 或 /stop。"],
  ["Pi is busy. Send /abort, /next, or /stop.",
   "Pi 忙，请发送 /abort、/next 或 /stop。"],
  ["Cannot compact while Pi or the Telegram queue is busy. Wait for queued turns to finish or send /abort first.",
   "Pi 或 Telegram 队列忙，无法压缩。请等待排队任务结束，或先发送 /abort。"],

  // --- 压缩状态 ---
  ["**✅ Compaction completed.**", "**✅ 压缩完成。**"],
  ["Compaction completed.", "压缩完成。"],
  ["Compaction started.", "压缩开始。"],
  ["Compaction cancelled.", "压缩已取消。"],
  ["<b>🚫 Compaction cancelled.</b>", "<b>🚫 压缩已取消。</b>"],
  ["Compaction failed: ", "压缩失败："],

  // --- 模型 ---
  ["<b>🚫 No available models with configured auth.</b>",
   "<b>🚫 没有配置认证的可用模型。</b>"],
  ["<b>🤖 Choose a model:</b>", "<b>🤖 选择模型：</b>"],
  ["<b>🤖 Model:</b>", "<b>🤖 模型：</b>"],
  ["Model is not available.", "模型不可用。"],
  ["Invalid model selection.", "无效的模型选择。"],
  ["Added to scoped models", "已添加到作用域模型"],
  ["Model scope is controlled by CLI --models.",
   "模型作用域由 CLI --models 控制。"],
  ["No CLI scoped models matched the current auth configuration. Showing all available models.",
   "没有匹配当前认证配置的 CLI 作用域模型。显示全部可用模型。"],
  ["No scoped models matched the current auth configuration. Showing all available models.",
   "没有匹配当前认证配置的作用域模型。显示全部可用模型。"],
  ["<b>Choose a page:</b>", "<b>选择页码：</b>"],
  ["Invalid page.", "无效的页码。"],
  ["All models", "全部模型"],
  ["☑️ Activate", "☑️ 激活"],
  ["🟢 Active", "🟢 已激活"],
  ["🟣 All", "🟣 全部"],
  ["⚫️ All", "⚫️ 全部"],

  // --- 思考级别 ---
  ["<b>🧠 Choose a thinking level:</b>", "<b>🧠 选择思考级别：</b>"],
  ["Invalid thinking level.", "无效的思考级别。"],
  ["Thinking controls are disabled during voice replies.",
   "语音回复期间思考控制已禁用。"],
  ["This model has no reasoning controls.", "此模型没有推理控制。"],
  ["Choose how much technical model activity Telegram shows.",
   "选择 Telegram 显示多少技术性模型活动。"],

  // --- 队列 ---
  ["<b>⏳ Queue:</b>", "<b>⏳ 队列：</b>"],
  ["<b>🕳 Nothing queued yet.</b>", "<b>🕳 队列中还没有任务。</b>"],
  ["<b>⌛ Queue is empty.</b>", "<b>⌛ 队列为空。</b>"],
  ["<b>⌛ Queue is still empty.</b>", "<b>⌛ 队列仍然为空。</b>"],
  ["<b>🧺 Basket is empty.</b>", "<b>🧺 篮子为空。</b>"],
  ["<b>🫧 Queue bubbles: none.</b>", "<b>🫧 队列气泡：无。</b>"],
  ["<b>🦗 Queue crickets continue.</b>", "<b>🦗 队列中蟋蟀还在叫。</b>"],
  ["<b>🌙 Queue is peacefully idle.</b>", "<b>🌙 队列安静闲置中。</b>"],
  ["<b>🪐 Queue orbit is clear.</b>", "<b>🪐 队列轨道畅通。</b>"],
  ["<b>🍃 Queue remains empty.</b>", "<b>🍃 队列依然为空。</b>"],
  ["<b>🫙 Still nothing in queue.</b>", "<b>🫙 队列里还是什么都没有。</b>"],
  ["<b>🔭 No prompts on the horizon.</b>", "<b>🔭 地平线上没有提示。</b>"],
  ["<b>🛸 No queued signals detected.</b>", "<b>🛸 未检测到排队信号。</b>"],
  ["<b>🧘 Nothing waiting. Very zen.</b>", "<b>🧘 没有等待，很禅。</b>"],
  ["<b>🕳 Nothing queued yet.</b>", "<b>🕳 还没有排队任务。</b>"],
  ["Item no longer in queue.", "项目已不在队列中。"],

  // --- 设置 ---
  ["<b>⚙️ Settings:</b>", "<b>⚙️ 设置：</b>"],
  ["<b>🔬 Activity:</b>", "<b>🔬 活动显示：</b>"],
  ["<b>🧾 Assistant rendering:</b>", "<b>🧾 助手渲染：</b>"],
  ["<b>📝 Draft previews:</b>", "<b>📝 草稿预览：</b>"],
  ["<b>🧹 Thread cleanup:</b>", "<b>🧹 会话清理：</b>"],
  ["<b>🕒 Time injection mode:</b>", "<b>🕒 时间注入模式：</b>"],
  ["<b>👄 Voice reply mode:</b>", "<b>👄 语音回复模式：</b>"],
  ["Choose how final assistant Markdown answers are delivered.",
   "选择最终助手 Markdown 回复的投递方式。"],
  ["Controls when pi-telegram converts assistant text replies into Telegram voice messages.",
   "控制 pi-telegram 何时将助手文本回复转换为 Telegram 语音消息。"],
  ["Controls whether Telegram-originated prompts include a compact wall-clock [time] line.",
   "控制 Telegram 来源的提示是否包含一行紧凑的墙钟 [time]。"],
  ["Delete this Pi instance's Telegram tab when Pi quits normally.",
   "Pi 正常退出时删除此 Pi 实例的 Telegram 标签页。"],
  ["<code>-</code> <code>rich</code> (default): use Telegram Native Rich Markdown.",
   "<code>-</code> <code>rich</code>（默认）：使用 Telegram 原生富文本 Markdown。"],
  ["<code>-</code> <code>html</code>: use the legacy Markdown-to-HTML renderer.",
   "<code>-</code> <code>html</code>：使用旧版 Markdown 转 HTML 渲染器。"],
  ["<code>-</code> <code>on</code> (default): stream safe Telegram Rich Draft frames before the final answer.",
   "<code>-</code> <code>on</code>（默认）：在最终回复前流式发送安全的 Telegram 富文本草稿。"],
  ["<code>-</code> <code>off</code> (default): show native active status, then send one final answer.",
   "<code>-</code> <code>off</code>（默认）：显示原生活跃状态，然后发送一条最终回复。"],
  ["<code>-</code> <code>quiet</code>: show no thinking or tool traffic.",
   "<code>-</code> <code>quiet</code>：不显示思考或工具动态。"],
  ["<code>-</code> <code>thinking</code>: show persistent collapsed thinking.",
   "<code>-</code> <code>thinking</code>：显示持久折叠的思考。"],
  ["<code>-</code> <code>tools</code>: show persistent Rich tool details.",
   "<code>-</code> <code>tools</code>：显示持久富文本工具详情。"],
  ["<code>-</code> <code>verbose</code> (default): show both thinking and tools.",
   "<code>-</code> <code>verbose</code>（默认）：同时显示思考和工具。"],
  ["<code>-</code> <code>off</code>: preserve the tab as a restart hint; manual <code>/telegram-disconnect</code> still confirms and deletes it.",
   "<code>-</code> <code>off</code>：保留标签页作为重启提示；手动 <code>/telegram-disconnect</code> 仍会确认并删除它。"],
  ["<code>-</code> <code>on</code> (default): delete the bound thread and release Telegram authority on graceful quit.",
   "<code>-</code> <code>on</code>（默认）：优雅退出时删除绑定的会话并释放 Telegram 权限。"],
  ["<code>-</code> <code>manual</code> (default): add no automatic voice context; explicit 'telegram_voice' actions still work.",
   "<code>-</code> <code>manual</code>（默认）：不自动添加语音上下文；显式 'telegram_voice' 操作仍然有效。"],
  ["<code>-</code> <code>mirror</code>: voice input activates automatic voice delivery; text input follows 'manual' behavior.",
   "<code>-</code> <code>mirror</code>：语音输入激活自动语音回复；文本输入遵循 'manual' 行为。"],
  ["<code>-</code> <code>always</code>: activate automatic voice delivery for every reply.",
   "<code>-</code> <code>always</code>：每次回复都激活自动语音投递。"],
  ["<code>-</code> <code>off</code> (default): add no time line to prompt context.",
   "<code>-</code> <code>off</code>（默认）：不向提示上下文添加时间行。"],
  ["<code>-</code> <code>hidden</code>: no time line is added to prompt context.",
   "<code>-</code> <code>hidden</code>：不向提示上下文添加时间行。"],
  ["<code>-</code> <code>interval</code> (default): add time at most once per chat interval (1 hour unless configured).",
   "<code>-</code> <code>interval</code>（默认）：每个聊天间隔最多添加一次时间（默认 1 小时，可配置）。"],
  ["<code>-</code> <code>always</code>: add time to every Telegram turn.",
   "<code>-</code> <code>always</code>：每个 Telegram 轮次都添加时间。"],

  // --- 导航 ---
  ["⬆️ Back", "⬆️ 返回"],
  ["⬆️ Main menu", "⬆️ 主菜单"],
  ["⚙️ Settings", "⚙️ 设置"],
  ["Interactive message expired.", "交互消息已过期。"],

  // --- 命令帮助文案 ---
  ["<b>🟢 Open menu / Pair bridge</b>", "<b>🟢 打开菜单 / 配对桥接</b>"],
];

const input = readFileSync(0, "utf8");
let output = input;
for (const [en, zh] of DICTIONARY) {
  if (output.includes(en)) {
    output = output.split(en).join(zh);
  }
}
process.stdout.write(output);
