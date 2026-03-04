<template>
  <div class="storyboard">
    <!-- 头部统计区域 -->
    <div class="summary-header">
      <div class="summary-left">
        <div class="icon-wrapper">
          <i-file-text :size="20" class="icon" />
        </div>
        <span class="summary-title">剧本统计</span>
        <span v-if="scripts?.length" class="count-badge">{{ scripts.length }} 集</span>
      </div>
      <button @click="exportScript" class="generate-btn">
        <i-export theme="outline" size="18" />
        <span>一键导出剧本</span>
      </button>
    </div>

    <!-- 标签页内容 -->
    <div class="data-content">
      <div class="tabs-wrapper">
        <a-tabs v-model:activeKey="selectSet" @change="handleTabChange" type="card">
          <a-tab-pane v-for="item in scripts" :key="item.id" :tab="item.name">
            <div class="tab-content">
              <!-- 资产元素卡片 -->
              <div class="section-card">
                <div class="section-header">
                  <div class="section-title">
                    <i-peoples :size="18" />
                    <span>关联资产</span>
                  </div>
                  <a-button v-if="item.element?.length" @click="openBatchGenerate(item)" :disabled="generating" size="small" class="batch-btn">
                    <i-lightning :size="14" />
                    批量生成
                  </a-button>
                </div>

                <div class="section-body">
                  <template v-if="item.element?.length">
                    <div class="element-grid">
                      <div v-for="el in item.element" :key="el.id" class="element-card" @click="openImageDialog(el)">
                        <div class="element-cover">
                          <a-image @click.stop class="element-img" :src="el.filePath || splitGraph" :fallback="splitGraph" :preview="false" />
                          <div class="element-overlay">
                            <i-edit :size="16" />
                          </div>
                        </div>
                        <div class="element-info">
                          <div class="element-name">{{ el.name }}</div>
                          <div class="element-type">
                            <span class="type-tag">{{ el.type }}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </template>
                  <div v-else class="empty-state">
                    <div class="empty-icon">
                      <i-inbox :size="32" />
                    </div>
                    <p class="empty-text">该集暂无使用的资产</p>
                  </div>
                </div>
              </div>

              <!-- 剧本内容卡片 -->
              <div class="section-card script-section">
                <div class="section-header">
                  <div class="section-title">
                    <i-text :size="18" />
                    <span>剧本内容</span>
                  </div>
                  <div class="f ac">
                    <div class="exportScript">
                      <a-button v-if="item.element?.length" @click="handleGenerate" :disabled="generating" size="small" class="batch-btn">
                        <template v-if="generating">
                          <span class="btn-spinner"></span>
                          <span>生成中...</span>
                        </template>
                        <template v-else>
                          <i-optimize :size="18" />
                          <span>生成剧本</span>
                        </template>
                      </a-button>
                    </div>
                    <div v-if="item.content && !scriptGenerateLoading[item.id]" class="word-count">
                      <i-file-text :size="14" />
                      <span>{{ item.content.length }} 字</span>
                    </div>
                  </div>
                </div>

                <div class="section-body">
                  <!-- 加载状态 -->
                  <div v-if="scriptGenerateLoading[item.id]" class="loading-state">
                    <div class="loading-spinner"></div>
                    <p class="loading-text">剧本生成中...</p>
                    <p class="loading-time">已用时 {{ generateElapsed[item.id] || 0 }} 秒</p>
                  </div>

                  <!-- 有内容 -->
                  <template v-else-if="item.content">
                    <div class="notebook">
                      <div class="line-numbers">
                        <div v-for="n in lineCount(item.content)" :key="n" class="line-number">{{ n }}</div>
                      </div>
                      <textarea
                        v-model="item.content"
                        class="notebook-textarea"
                        placeholder="请输入剧本内容..."
                        spellcheck="false"
                        @input="handleInput($event, item)"
                        @scroll="handleScroll($event, item.id)"
                        :ref="(el) => setTextareaRef(el, item.id)"></textarea>
                    </div>

                    <div class="script-footer">
                      <div class="footer-info">
                        <span class="update-hint">编辑后请记得保存</span>
                      </div>
                      <a-button type="primary" class="save-btn" @click="saveScript">
                        <i-save :size="16" />
                        保存剧本
                      </a-button>
                    </div>
                  </template>

                  <!-- 空状态 -->
                  <div v-else class="empty-state">
                    <div class="empty-icon">
                      <i-file-text :size="32" />
                    </div>
                    <p class="empty-text">该集暂无剧本内容</p>
                    <p class="empty-hint">点击上方按钮生成剧本</p>
                  </div>
                </div>
              </div>
            </div>
          </a-tab-pane>
        </a-tabs>
      </div>
    </div>

    <!-- 弹窗组件 -->
    <generateImage v-model="generateImageShow" :data="currentImage" @update="fetchScripts" />
    <batchGenereate
      v-if="batchGenerateShow"
      v-model="batchGenerateShow"
      :data="generateData"
      type="role"
      :scriptId="batchGenerateScript?.id ?? -1"
      @save="handleBatchSave" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onUnmounted, nextTick } from "vue";
import { storeToRefs } from "pinia";
import { message } from "ant-design-vue";
import splitGraph from "@/utils/splitGraph";
import axios from "@/utils/axios";
import loadingStore from "@/stores/loadingStore";
import generateImage from "@/views/projectDetail/components/assetsManager/components/generateImage.vue";
import batchGenereate from "@/views/projectDetail/components/assetsManager/components/batchGenereate.vue";
import store from "@/stores";

const { projectId } = storeToRefs(store());

interface Element {
  id: number;
  filePath: string;
  intro: string;
  name: string;
  prompt: string;
  remark: string;
  duration: number;
  type: string;
  videoPrompt: string;
}

interface Script {
  id: number;
  name: string;
  content: string;
  outlineId: number;
  element: Element[];
}

const emit = defineEmits<{
  change: [scriptId: number | undefined];
  getScriptData: [];
}>();

const scripts = defineModel<Script[]>();
const selectSet = defineModel<number>("scriptId", { default: null });

const { scriptGenerateLoading } = storeToRefs(loadingStore());

const generating = ref(false);
const generateImageShow = ref(false);
const batchGenerateShow = ref(false);
const generateElapsed = ref<Record<number, number>>({});
const generateIntervals = ref<Record<number, ReturnType<typeof setInterval>>>({});
const currentImage = ref<Element>();
const textareaRefs = ref<Record<number, HTMLTextAreaElement | null>>({});
const batchGenerateScript = ref<Script | null>(null);
const isRefreshing = ref(false);

const currentScript = computed(() => scripts.value?.find((s) => s.id === selectSet.value));
const generateData = computed(() => batchGenerateScript.value?.element ?? []);

const LINE_HEIGHT = 28;
const MIN_LINES = 20;

onUnmounted(() => {
  Object.values(generateIntervals.value).forEach(clearInterval);
});

function setTextareaRef(el: any, id: number) {
  if (el) {
    textareaRefs.value[id] = el;
    // 初始化时自动调整高度
    nextTick(() => {
      adjustTextareaHeight(el);
    });
  }
}

function adjustTextareaHeight(textarea: HTMLTextAreaElement) {
  textarea.style.height = "auto";
  const newHeight = Math.max(textarea.scrollHeight, MIN_LINES * LINE_HEIGHT);
  textarea.style.height = `${newHeight}px`;
}

function lineCount(content: string): number {
  const lines = content ? content.split("\n").length : 1;
  return Math.max(lines, MIN_LINES);
}

function handleInput(event: Event, item: Script) {
  // 自动调整高度
  const textarea = event.target as HTMLTextAreaElement;
  adjustTextareaHeight(textarea);
}

function handleScroll(event: Event, id: number) {
  const textarea = event.target as HTMLTextAreaElement;
  const lineNumbers = textarea.parentElement?.querySelector(".line-numbers") as HTMLElement;
  if (lineNumbers) {
    lineNumbers.scrollTop = textarea.scrollTop;
  }
}

function startTimer(id: number) {
  const startTime = Date.now();
  generateElapsed.value[id] = 0;
  generateIntervals.value[id] = setInterval(() => {
    generateElapsed.value[id] = Math.floor((Date.now() - startTime) / 1000);
  }, 1000);
}

function stopTimer(id: number) {
  clearInterval(generateIntervals.value[id]);
  delete generateIntervals.value[id];
  delete generateElapsed.value[id];
}

async function fetchScripts() {
  try {
    const { data } = await axios.post("/script/geScriptApi", { projectId: projectId.value });
    scripts.value = data;
  } catch {
    message.error("获取剧本列表失败");
  }
}

async function handleGenerate() {
  const script = currentScript.value;
  if (!script) return;

  const { id, outlineId } = script;
  generating.value = true;
  scriptGenerateLoading.value[id] = true;
  startTimer(id);

  try {
    await axios.post("/script/generateScriptApi", { outlineId, scriptId: id });
    message.success("生成剧本成功");
    isRefreshing.value = true;
    emit("getScriptData");
  } catch (err: any) {
    message.error(err.message || "生成剧本失败");
  } finally {
    generating.value = false;
    scriptGenerateLoading.value[id] = false;
    stopTimer(id);
  }
}

async function saveScript() {
  const script = currentScript.value;
  if (!script) return;

  try {
    await axios.post("/script/generateScriptSave", {
      outlineId: script.outlineId,
      scriptId: script.id,
      content: script.content,
    });
    message.success("保存成功");
  } catch {
    message.error("保存失败");
  }
}

function openImageDialog(el: Element) {
  currentImage.value = { ...el };
  generateImageShow.value = true;
}

async function openBatchGenerate(item: Script) {
  batchGenerateScript.value = item;
  await nextTick();
  batchGenerateShow.value = true;
}

function handleTabChange(activeKey: number | string) {
  if (isRefreshing.value) {
    isRefreshing.value = false;
    return;
  }
  emit("change", Number(activeKey));
}

async function handleBatchSave(list: Element[]) {
  const tasks = list.map((item) =>
    Promise.all([
      axios.post("/assets/updateAssets", {
        id: item.id,
        name: item.name,
        intro: item.intro,
        type: item.type,
        prompt: item.prompt,
      }),
      axios.post("/assets/saveAssets", {
        id: item.id,
        filePath: item.filePath,
        projectId: projectId.value,
        prompt: item.prompt,
      }),
    ]).catch((err) => console.error(`保存失败，id: ${item.id}`, err)),
  );

  await Promise.all(tasks);

  const types = [...new Set(list.map((item) => item.type))];
  await Promise.all(types.map((type) => axios.post("/assets/getAssets", { projectId: projectId.value, type })));
  await fetchScripts();
}

watch(
  scripts,
  async (data) => {
    if (data?.length) {
      if (!selectSet.value || !data.find((s) => s.id === selectSet.value)) {
        selectSet.value = data[0].id;
        await nextTick();
        emit("change", data[0].id);
      }
      await nextTick();
      if (!isRefreshing.value) {
        handleTabChange(selectSet.value);
      } else {
        isRefreshing.value = false;
      }
      Object.entries(textareaRefs.value).forEach(([id, textarea]) => {
        if (textarea) {
          adjustTextareaHeight(textarea);
        }
      });
    }
  },
  { immediate: true },
);

// 监听选中的tab变化，调整对应textarea高度
watch(selectSet, async () => {
  await nextTick();
  const textarea = textareaRefs.value[selectSet.value];
  if (textarea) {
    adjustTextareaHeight(textarea);
  }
});
//导出剧本
function exportScript() {
  const script = scripts.value?.map((item) => {
    return {
      name: item.name,
      content: item.content,
    };
  });
  if (!script || !script.length) {
    message.warning("暂无剧本可导出");
    return;
  }
  //生成txt文件
  const blob = new Blob([script.map((s) => `${s.name}\n\n${s.content}\n\n`).join("")], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `剧本_${new Date().toISOString().slice(0, 10)}.txt`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
</script>

<style lang="scss" scoped>
$line-height: 28px;

.storyboard {
  .summary-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
    background: var(--td-bg-color-container);
    border-radius: 16px;
    border: 1px solid var(--td-component-border);
    .summary-left {
      display: flex;
      align-items: center;
      gap: 12px;

      .icon-wrapper {        
        display: flex;
        align-items: center;
        justify-content: center;
        width: 36px;
        height: 36px;
        background: var(--td-brand-color);
        border-radius: 10px;
        box-shadow: 0 4px 12px var(--td-shadow-1);
      }

      .summary-title {
        font-weight: 600;
        font-size: 16px;
        color: var(--td-text-color-primary);
      }

      .count-badge {
        padding: 2px 10px;
        background: var(--td-bg-color-component);
        border: 1px solid var(--td-component-border);
        border-radius: 20px;
        font-size: 13px;
        font-weight: 500;
        color: var(--td-text-color-secondary);
      }
    }

    .generate-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 20px;
      background: var(--td-brand-color);
      border: none;
      border-radius: 12px;
      color: var(--td-text-color-anti);
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.3s ease;
      box-shadow: 0 4px 12px var(--td-shadow-1);

      &:hover:not(:disabled) {
        transform: translateY(-2px);
        background: var(--td-brand-color-hover);
        box-shadow: 0 6px 16px var(--td-shadow-2);
      }

      &:disabled {
        opacity: 0.6;
        box-shadow: none;
        cursor: not-allowed;
      }
    }
  }

  .data-content {
    margin-top: 20px;

    .tabs-wrapper {
      :deep(.ant-tabs) {
        .ant-tabs-nav {
          margin-bottom: 0;

          &::before {
            border: none;
          }

          .ant-tabs-tab {
            padding: 10px 20px;
            margin: 0 4px 0 0;
            background: var(--td-bg-color-component);
            border: 1px solid var(--td-component-border);
            border-radius: 12px 12px 0 0;
            color: var(--td-text-color-secondary);
            transition: all 0.3s ease;

            &:hover {
              color: var(--td-text-color-primary);
              background: var(--td-bg-color-component-hover);
            }

            &.ant-tabs-tab-active {
              background: var(--td-bg-color-container);
              border-bottom-color: var(--td-bg-color-container);
              color: var(--td-brand-color);

              .ant-tabs-tab-btn {
                font-weight: 600;
              }
            }
          }
        }

        .ant-tabs-content-holder {
          background: var(--td-bg-color-container);
          border: 1px solid var(--td-component-border);
          border-radius: 0 12px 12px 12px;
          padding: 20px;
        }
      }
    }

    .tab-content {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .section-card {
      background: var(--td-bg-color-container);
      border: 1px solid var(--td-component-border);
      border-radius: 12px;
      overflow: hidden;

      .section-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 14px 18px;
        background: var(--td-bg-color-component);
        border-bottom: 1px solid var(--td-component-border);

        .section-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          font-weight: 600;
          color: var(--td-text-color-primary);
        }

        .batch-btn {
          display: flex;
          align-items: center;
          gap: 4px;
          background: var(--td-brand-color);
          color: var(--td-text-color-anti);
          border: none;
          border-radius: 8px;

          &:hover {
            opacity: 0.9;
            background: var(--td-brand-color-hover);
          }
        }

        .word-count {
          margin-left: 10px;
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 4px 12px;
          background: var(--td-bg-color-component);
          border: 1px solid var(--td-component-border);
          border-radius: 20px;
          font-size: 13px;
          font-weight: 500;
          color: var(--td-text-color-secondary);
        }
      }

      .section-body {
        padding: 18px;
      }
    }

    .element-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
      gap: 16px;
    }

    .element-card {
      background: var(--td-bg-color-container);
      border-radius: 12px;
      border: 1px solid var(--td-component-border);
      overflow: hidden;
      cursor: pointer;
      transition: all 0.3s ease;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 16px var(--td-shadow-2);
        border-color: var(--td-brand-color);

        .element-overlay {
          opacity: 1;
        }
      }

      .element-cover {
        position: relative;
        width: 100%;
        height: 100px;
        overflow: hidden;
        background: var(--td-bg-color-component);

        .element-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .element-overlay {
          position: absolute;
          inset: 0;
          background: var(--td-mask-active);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--td-text-color-anti);
          opacity: 0;
          transition: opacity 0.3s ease;
        }
      }

      .element-info {
        padding: 12px;

        .element-name {
          font-size: 14px;
          font-weight: 600;
          color: var(--td-text-color-primary);
          margin-bottom: 6px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .type-tag {
          display: inline-block;
          padding: 2px 8px;
          background: var(--td-brand-color);
          border: 1px solid var(--td-component-border);
          border-radius: 4px;
          font-size: 12px;
          color: var(--td-text-color-secondary);
        }
      }
    }

    // 记事本样式
    .notebook {
      display: flex;
      border: 1px solid var(--td-component-border);
      border-radius: 8px;
      overflow: visible;
      background: var(--td-bg-color-container);
      min-height: calc($line-height * 20 + 24px);

      .line-numbers {
        width: 50px;
        background: var(--td-bg-color-component);
        border-right: 1px solid var(--td-component-border);
        padding: 12px 0;
        user-select: none;
        flex-shrink: 0;

        .line-number {
          height: $line-height;
          line-height: $line-height;
          text-align: right;
          padding-right: 12px;
          font-size: 13px;
          font-family: "Monaco", "Menlo", monospace;
          color: var(--td-text-color-placeholder);
        }
      }

      .notebook-textarea {
        flex: 1;
        padding: 12px 16px;
        border: none;
        outline: none;
        resize: none;
        overflow: hidden;
        min-height: calc($line-height * 20);
        height: auto;
        font-size: 16px;
        line-height: $line-height;
        background: transparent;
        color: var(--td-text-color-primary);
        font-family: "KaiTi", "STKaiti", "PingFang SC", sans-serif;
        background-image: repeating-linear-gradient(
          transparent,
          transparent calc($line-height - 1px),
          var(--td-component-border) calc($line-height - 1px),
          var(--td-component-border) $line-height
        );
        background-position: 0 12px;

        &::placeholder {
          color: var(--td-text-color-placeholder);
        }
      }
    }

    .script-section {
      .script-footer {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-top: 16px;
        padding-top: 16px;
        border-top: 1px solid var(--td-component-border);

        .footer-info {
          .update-hint {
            font-size: 13px;
            color: var(--td-text-color-placeholder);
          }
        }

        .save-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 20px;
          background: var(--td-brand-color);
          color: var(--td-text-color-anti);
          border: none;
          border-radius: 10px;
          font-weight: 500;

          &:hover {
            background: var(--td-brand-color-hover);
          }
        }
      }
    }

    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 60px 20px;

      .loading-spinner {
        width: 48px;
        height: 48px;
        border: 4px solid var(--td-component-border);
        border-top-color: var(--td-brand-color);
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin-bottom: 20px;
      }

      .loading-text {
        margin: 0 0 8px;
        font-size: 16px;
        font-weight: 500;
        color: var(--td-text-color-primary);
      }

      .loading-time {
        margin: 0;
        font-size: 14px;
        color: var(--td-text-color-secondary);
      }
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40px 20px;

      .empty-icon {
        width: 64px;
        height: 64px;
        background: var(--td-bg-color-component);
        border: 1px solid var(--td-component-border);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 16px;
        color: var(--td-text-color-placeholder);
      }

      .empty-text {
        margin: 0 0 4px;
        font-size: 14px;
        font-weight: 500;
        color: var(--td-text-color-secondary);
      }

      .empty-hint {
        margin: 0;
        font-size: 13px;
        color: var(--td-text-color-placeholder);
      }
    }
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.exportScript {
  .btn-spinner {
    display: inline-block;
    width: 14px;
    height: 14px;
    border: 2px solid var(--td-component-border);
    border-top-color: var(--td-brand-color);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
    margin-right: 4px;
  }
}
</style>
