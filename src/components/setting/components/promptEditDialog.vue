<template>
  <t-dialog v-model:visible="visible" :header="header" width="70%" :confirm-btn="null" :cancel-btn="null" top="5vh">
    <div class="promptDialogBody">
      <div class="listPanel">
        <div class="listHeader">{{ listTitle }}</div>
        <div class="listItems">
          <div
            v-for="p in promptList"
            :key="p.code"
            class="listItem"
            :class="{ active: current?.code === p.code }"
            @click="select(p)">
            <span class="itemName">{{ p.name }}</span>
            <t-tag v-if="p.customValue" theme="warning" variant="light" size="small">已自定义</t-tag>
          </div>
          <div v-if="!promptList.length" class="listEmpty">暂无提示词</div>
        </div>
      </div>
      <div class="editPanel">
        <template v-if="current">
          <div class="editHeader">
            <div class="editInfo">
              <span class="editTitle">{{ current.name }}</span>
              <t-tag :theme="isCustom ? 'warning' : 'success'" variant="light" size="small">{{ isCustom ? "已自定义" : "默认值" }}</t-tag>
            </div>
            <t-space size="small">
              <t-button theme="default" size="small" @click="reset">
                <template #icon><i-redo theme="outline" size="14" fill="currentColor" /></template>重置
              </t-button>
              <t-button theme="primary" size="small" :loading="saving" @click="save">
                <template #icon><i-check theme="outline" size="14" fill="currentColor" /></template>保存
              </t-button>
            </t-space>
          </div>
          <t-textarea v-model="editValue" placeholder="请输入提示词内容" class="editTextarea" :autosize="{ minRows: 12, maxRows: 20 }" />
          <span class="editTip">{{ isCustom ? '点击"重置"可恢复默认值' : "编辑后将保存为自定义值" }}</span>
        </template>
        <div v-else class="editEmpty">
          <i-edit theme="outline" size="40" />
          <span>请从左侧选择一个提示词</span>
        </div>
      </div>
    </div>
  </t-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { MessagePlugin } from "tdesign-vue-next";
import axios from "@/utils/axios";

export interface Prompt {
  id: number;
  code: string;
  name: string;
  type: "mainAgent" | "subAgent" | "system";
  parentCode: string;
  defaultValue: string;
  customValue: string;
}

const props = withDefaults(defineProps<{ header?: string; listTitle?: string; prompts?: Prompt[] }>(), {
  header: "编辑提示词",
  listTitle: "提示词列表",
});

const visible = defineModel<boolean>({ default: false });
const emit = defineEmits<{ (e: "saved", prompt: Prompt): void }>();

const internalPrompts = ref<Prompt[]>([]);
const current = ref<Prompt | null>(null);
const editValue = ref("");
const saving = ref(false);

const promptList = computed(() => props.prompts ?? internalPrompts.value);
const fmt = (v: string) => v?.replace(/\\n/g, "\n") || "";
const isCustom = computed(() => {
  if (!current.value) return false;
  const def = fmt(current.value.defaultValue || "");
  return editValue.value.trim() !== "" && editValue.value !== def;
});

watch(visible, async (v) => {
  if (!v) return;
  current.value = null;
  editValue.value = "";
  if (!props.prompts) {
    try {
      internalPrompts.value = (await axios.get("/prompt/getPrompts")).data || [];
    } catch {
      MessagePlugin.error("获取提示词列表失败");
    }
  }
  if (promptList.value.length) select(promptList.value[0]);
});

function select(p: Prompt) {
  current.value = p;
  editValue.value = fmt(p.customValue || p.defaultValue || "");
}

function reset() {
  if (!current.value) return;
  editValue.value = fmt(current.value.defaultValue || "");
  MessagePlugin.info("已重置为默认值，点击保存生效");
}

async function save() {
  if (!current.value) return;
  saving.value = true;
  try {
    const def = fmt(current.value.defaultValue || "");
    const val = editValue.value === def ? "" : editValue.value.trim();
    await axios.post("/prompt/updatePrompt", { id: current.value.id, code: current.value.code, customValue: val });
    const list = props.prompts ?? internalPrompts.value;
    const idx = list.findIndex((p) => p.code === current.value?.code);
    if (idx !== -1) list[idx].customValue = val;
    emit("saved", { ...current.value, customValue: val });
    MessagePlugin.success("保存成功");
  } catch {
    MessagePlugin.error("保存失败");
  } finally {
    saving.value = false;
  }
}
</script>

<style lang="scss" scoped>
.promptDialogBody {
  display: flex;
  height: 55vh;
  gap: 16px;
}

.listPanel {
  width: 220px;
  flex-shrink: 0;
  border: 1px solid var(--td-component-border);
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  .listHeader {
    padding: 12px 16px;
    font-size: 13px;
    font-weight: 600;
    border-bottom: 1px solid var(--td-component-border);
    color: var(--td-text-color-secondary);
  }
  .listItems {
    flex: 1;
    overflow-y: auto;
    padding: 4px;
  }
  .listItem {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 12px;
    border-radius: 6px;
    cursor: pointer;
    gap: 6px;
    transition: background 0.2s;
    &:hover { background: var(--td-bg-color-container-hover); }
    &.active { background: var(--td-brand-color-light); color: var(--td-brand-color); }
    .itemName {
      font-size: 13px;
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }
  .listEmpty {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    font-size: 13px;
    color: var(--td-text-color-placeholder);
    padding: 24px;
  }
}

.editPanel {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
  .editHeader {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .editInfo {
    display: flex;
    align-items: center;
    gap: 8px;
    .editTitle { font-size: 15px; font-weight: 600; }
  }
  .editTextarea {
    flex: 1;
    font-size: 13px;
    line-height: 1.7;
    font-family: "SF Mono", Monaco, Menlo, Consolas, monospace;
  }
  .editTip {
    font-size: 12px;
    color: var(--td-text-color-placeholder);
  }
  .editEmpty {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    color: var(--td-text-color-placeholder);
    font-size: 14px;
  }
}

:deep(.editTextarea .t-textarea__inner) {
  min-height: 300px !important;
}
</style>
