<template>
  <div class="aiConfog">
    <!-- 工具栏：搜索 + 类型筛选 -->
    <div class="toolbar">
      <t-input v-model="searchKeyword" placeholder="搜索模型..." clearable size="small" class="searchInput">
        <template #prefix-icon><i-search theme="outline" size="14" /></template>
      </t-input>
      <t-radio-group v-model="filterType" variant="default-filled" size="small">
        <t-radio-button value="all">全部</t-radio-button>
        <t-radio-button value="text">文本模型</t-radio-button>
        <t-radio-button value="image">图片模型</t-radio-button>
      </t-radio-group>
    </div>

    <!-- 卡片列表 -->
    <div class="cardGrid">
      <div v-for="item in filteredModels" :key="item.key" class="skillCard" @click="startConfig(item)">
        <div class="skillCardHeader">
          <span class="skillName">{{ item.name }}</span>
          <t-tag v-if="item.model" theme="primary" variant="light" size="small">{{ item.model }}</t-tag>
          <t-tag v-else theme="warning" variant="light" size="small">未配置</t-tag>
        </div>
        <div class="skillCardBody">
          <t-avatar size="36px" v-if="getProviderLogo(item.manufacturer)" :image="getProviderLogo(item.manufacturer)!" />
          <t-avatar size="36px" v-else shape="round">
            <template #icon><i-robot theme="outline" size="20" fill="currentColor" /></template>
          </t-avatar>
          <span class="descText">{{ DESC_MAP[item.key] || `${item.key} 模型配置` }}</span>
        </div>
        <div class="skillCardFooter">
          <div class="footerLeft">
            <t-tag :theme="isTextModel(item.key) ? 'primary' : 'warning'" variant="outline" size="small">
              {{ isTextModel(item.key) ? "文本模型" : "图片模型" }}
            </t-tag>
            <span v-if="item.manufacturer" class="mfr">{{ item.manufacturer }}</span>
          </div>
          <t-dropdown :options="MENU_OPTIONS" trigger="click" @click="(v: any) => onMenu(v, item)">
            <t-button variant="text" shape="circle" size="small" @click.stop>
              <template #icon><i-more theme="outline" size="16" /></template>
            </t-button>
          </t-dropdown>
        </div>
      </div>
      <div v-if="filteredModels.length === 0" class="emptyTip">暂无匹配的模型</div>
    </div>
  </div>

  <modelDataDom v-model:modelDataShow="modelDataShow" :currentType="currentType" v-model:configingModel="configingModel" @modelList="reloadModels" />
  <promptEditDialog v-model="promptDialogVisible" :header="`编辑提示词 - ${promptDialogTitle}`" listTitle="关联提示词" :prompts="relatedPrompts" />
</template>

<script setup lang="ts">
import modelDataDom from "../model/modelData.vue";
import promptEditDialog from "./promptEditDialog.vue";
import type { Prompt } from "./promptEditDialog.vue";
import providersLogo from "@/utils/ai/providersLogo";
import axios from "@/utils/axios";
import { MessagePlugin } from "tdesign-vue-next";

interface ModelType {
  id: number;
  model: string;
  name: string;
  key: string;
  manufacturer: string;
}

// ===== 常量 =====
const TEXT_KEYS = new Set(["storyboardAgent", "outlineScriptAgent", "assetsPrompt", "generateScript", "videoPrompt"]);
const IMAGE_KEYS = new Set(["editImage", "storyboardImage", "assetsImage"]);
const isTextModel = (key: string) => TEXT_KEYS.has(key) || key.includes("Agent") || key.includes("Script") || key.includes("Prompt");

const DESC_MAP: Record<string, string> = {
  storyboardAgent: "根据剧本自动生成分镜描述，将文字转化为画面指令",
  outlineScriptAgent: "从小说原文提取关键情节，生成结构化剧本大纲",
  assetsPrompt: "根据角色和场景要素，生成精准的素材提示词",
  generateScript: "将大纲扩展为完整剧本脚本，包含对话和场景描写",
  videoPrompt: "为视频生成提供画面描述和风格化提示词",
  editImage: "对已有图片进行编辑修改，支持局部重绘和风格调整",
  storyboardImage: "根据分镜描述生成对应的故事板画面",
  assetsImage: "生成角色立绘、场景图等项目素材图片",
};

const MENU_OPTIONS = [
  { content: "配置模型", value: "config" },
  { content: "编辑提示词", value: "editPrompt" },
];

// ===== 数据 =====
const modelData = ref<ModelType[]>([]);
const modelDataShow = ref(false);
const configingModel = ref<ModelType>();
const currentType = ref("");
const searchKeyword = ref("");
const filterType = ref("all");

// 按类型(文本优先) + 名称排序，再按搜索和类型筛选
const filteredModels = computed(() => {
  const sorted = [...modelData.value].sort((a, b) => {
    const ta = isTextModel(a.key) ? 0 : 1;
    const tb = isTextModel(b.key) ? 0 : 1;
    return ta !== tb ? ta - tb : a.name.localeCompare(b.name, "zh-CN");
  });
  return sorted.filter((item) => {
    if (filterType.value === "text" && !isTextModel(item.key)) return false;
    if (filterType.value === "image" && isTextModel(item.key)) return false;
    if (searchKeyword.value) {
      const kw = searchKeyword.value.toLowerCase();
      return item.name.toLowerCase().includes(kw) || item.key.toLowerCase().includes(kw) || (item.manufacturer || "").toLowerCase().includes(kw);
    }
    return true;
  });
});

onMounted(async () => {
  const res = await axios.post("/setting/getAiModelMap");
  modelData.value = res.data;
});

async function reloadModels() {
  const res = await axios.post("/setting/getAiModelMap");
  modelData.value = res.data;
}

function getProviderLogo(manufacturer: string) {
  if (!manufacturer) return null;
  const direct = providersLogo[manufacturer as keyof typeof providersLogo];
  if (direct) return direct;
  const lk = manufacturer.toLowerCase();
  for (const k of Object.keys(providersLogo)) {
    if (k.toLowerCase() === lk) return providersLogo[k as keyof typeof providersLogo];
  }
  return null;
}

function startConfig(item: ModelType) {
  configingModel.value = item;
  currentType.value = IMAGE_KEYS.has(item.key) ? "image" : "text";
  modelDataShow.value = true;
}

function onMenu(opt: { value: string }, model: ModelType) {
  if (opt.value === "config") startConfig(model);
  else openPromptDialog(model);
}

// ===== 提示词弹窗 =====
const promptDialogVisible = ref(false);
const promptDialogTitle = ref("");
const relatedPrompts = ref<Prompt[]>([]);

async function openPromptDialog(model: ModelType) {
  promptDialogTitle.value = model.name;
  try {
    const { data: all = [] } = await axios.get("/prompt/getPrompts");
    const key = model.key.toLowerCase();
    let matched = all.filter((p: Prompt) => {
      const code = p.code.toLowerCase();
      return code.includes(key) || key.includes(code) || p.parentCode?.toLowerCase().includes(key);
    });
    if (!matched.length) {
      const textModel = isTextModel(model.key);
      matched = all.filter((p: Prompt) => (textModel ? p.type !== "system" : p.type === "system")).slice(0, 10);
    }
    relatedPrompts.value = matched.length ? matched : all;
    promptDialogVisible.value = true;
  } catch {
    MessagePlugin.error("获取提示词列表失败");
  }
}
</script>

<style lang="scss" scoped>
.aiConfog {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  .searchInput {
    max-width: 240px;
  }
}

.cardGrid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.skillCard {
  cursor: pointer;
  border: 1px solid var(--td-component-border);
  border-radius: 12px;
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  transition: all 0.2s ease;
  background: var(--td-bg-color-container);
  &:hover {
    box-shadow: var(--td-shadow-2);
    border-color: var(--td-brand-color-light);
    transform: translateY(-1px);
  }
}

.skillCardHeader {
  display: flex;
  align-items: center;
  justify-content: space-between;
  .skillName {
    font-size: 15px;
    font-weight: 600;
  }
}

.skillCardBody {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  .descText {
    flex: 1;
    font-size: 13px;
    color: var(--td-text-color-secondary);
    line-height: 1.5;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
}

.skillCardFooter {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 8px;
  border-top: 1px solid var(--td-component-border);
  .footerLeft {
    display: flex;
    align-items: center;
    gap: 8px;
    .mfr {
      font-size: 12px;
      color: var(--td-text-color-placeholder);
    }
  }
}

.emptyTip {
  grid-column: 1 / -1;
  text-align: center;
  padding: 40px;
  color: var(--td-text-color-placeholder);
  font-size: 14px;
}
</style>
