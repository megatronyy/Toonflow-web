<template>
  <div class="storyboard-image">
    <!-- 头部 -->
    <div class="header">
      <div class="title">
        <div class="icon-wrapper">
          <i-pic :size="20" class="icon" />
        </div>
        <span>生成分镜图</span>
        <span v-if="data.length" class="count">{{ data.length }}</span>
      </div>
      <button v-if="canGenerate" :disabled="!disableBtn" class="generate-btn" @click="modalShow = true">
        <i-optimize :size="18" />
        <span>生成分镜图</span>
      </button>
    </div>

    <!-- 内容区 -->
    <div class="content">
      <template v-if="data.length">
        <div class="image-grid">
          <div v-for="(item, index) in data" :key="item.id" class="image-card" @click="handleEdit(item)">
            <!-- 序号标签 -->
            <div class="shot-badge">片段{{ item.segmentId }}-{{ item.shotIndex }}镜头</div>
            <!-- 删除分镜图 -->
            <div class="delStoryboards" @click.stop="delStoryboardsFn(item.id, index, $event)">
              <i-delete :size="16" />
            </div>
            <!-- 封面区域 -->
            <div class="cover-wrapper">
              <el-image class="cover-image" :src="item.filePath" fit="cover">
                <template #placeholder>
                  <div class="loading-placeholder">
                    <div class="loading-spinner"></div>
                  </div>
                </template>
                <template #error>
                  <div class="error-placeholder">
                    <i-error-picture theme="outline" :size="28" fill="#ef4444" />
                    <span>加载失败</span>
                  </div>
                </template>
              </el-image>
              <!-- 悬浮操作层 -->
              <!-- <div class="hover-overlay">
                <div class="action-btn">
                  <i-edit :size="20" />
                  <span>编辑</span>
                </div>
              </div> -->
            </div>
            <!-- 信息区域 -->
            <div class="info-wrapper">
              <h4 v-if="item.name" class="card-title">{{ item.name }}</h4>
              <p class="card-desc">{{ item.prompt || "暂无描述" }}</p>
            </div>
          </div>
        </div>
      </template>

      <!-- 空状态 -->
      <div v-else class="empty-state">
        <div class="empty-icon">
          <i-pic :size="48" />
        </div>
        <p class="empty-title">暂无分镜图</p>
        <p class="empty-desc">点击上方按钮开始生成分镜图</p>
      </div>
    </div>

    <!-- 弹窗 -->
    <storyboardChat v-if="modalShow" v-model="modalShow" :scriptId="scriptId" :projectId="projectId" @save="$emit('save')" />
    <storyboardEditor ref="storyboardEditorRef" @save="handelrEditSave" />
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { message, Modal } from "ant-design-vue";
import storyboardChat from "./storyboardImage/storyboardChat.vue";
import storyboardEditor from "@/components/storyboardEditor/index.vue";
import axios from "@/utils/axios";

interface Storyboard {
  id: number;
  name: string;
  intro: string;
  prompt: string;
  filePath: string;
  duration: number;
  segmentId: number; // 片段ID
  shotIndex: number; // 镜头在片段内的序号
  generateImg: { assetsId: number; filePath: string }[];
}

const emit = defineEmits(["save"]);
const props = defineProps<{
  data: Storyboard[];
  projectId: number;
  scriptId: number | null;
  disableBtn: number | null;
  canGenerate: boolean;
}>();

const modalShow = ref(false);
const storyboardEditorRef = ref<InstanceType<typeof storyboardEditor> | null>(null);

function handleEdit(item: Storyboard) {
  storyboardEditorRef.value?.doFusionEdit({
    id: item.id,
    filePath: item.filePath,
    scriptId: props.scriptId ?? undefined,
    otherImgs: [],
    prompt: item.prompt || "",
    intro: item.intro || "",
    generateImg: item.generateImg || [],
    editPrompt: "",
  });
}

function handelrEditSave(data: any) {
  axios.post("/storyboard/saveStoryboard", data).then(() => {
    emit("save");
  });
}
function delStoryboardsFn(id: number, index: number, event: MouseEvent) {
  Modal.confirm({
    title: "确认删除",
    content: `确定要删除分镜图吗？`,
    okText: "删除",
    cancelText: "取消",
    okButtonProps: { danger: true },
    onOk: async () => {
      axios.post("/storyboard/delStoryboard", { id }).then(() => {
        emit("save");
        message.success("删除成功");
      });
    },
  });
}
</script>

<style lang="scss" scoped>
.storyboard-image {
  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
    background: var(--td-bg-color-container);
    border-radius: 16px;
    border: 1px solid var(--td-component-border);

    .title {
      display: flex;
      align-items: center;
      gap: 12px;
      font-weight: 600;
      font-size: 16px;
      color: var(--td-text-color-primary);

      .icon-wrapper {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 36px;
        height: 36px;
        background: var(--td-brand-color);
        border-radius: 10px;
        box-shadow: 0 4px 12px var(--td-shadow-1);

        .icon {
          color: var(--td-text-color-anti);
        }
      }

      .count {
        padding: 2px 10px;
        background: var(--td-bg-color-component);
        color: var(--td-brand-color);
        border: 1px solid var(--td-component-border);
        border-radius: 20px;
        font-size: 13px;
        font-weight: 500;
      }
    }

    .generate-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 20px;
      background: var(--td-brand-color);
      color: var(--td-text-color-anti);
      border: none;
      border-radius: 12px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.3s ease;
      box-shadow: 0 4px 14px var(--td-shadow-1);

      &:hover:not(:disabled) {
        transform: translateY(-2px);
        background: var(--td-brand-color-hover);
        box-shadow: 0 6px 20px var(--td-shadow-2);
      }

      &:active:not(:disabled) {
        transform: translateY(0);
      }

      &:disabled {
        background: var(--td-bg-color-component-disabled);
        color: var(--td-text-color-disabled);
        box-shadow: none;
        cursor: not-allowed;
        opacity: 0.6;
      }
    }
  }

  .content {
    margin-top: 24px;

    .image-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 24px;
    }

    .image-card {
      position: relative;
      background: var(--td-bg-color-container);
      border-radius: 16px;
      overflow: hidden;
      cursor: pointer;
      transition: all 0.3s ease;
      border: 1px solid var(--td-component-border);
      box-shadow: 0 2px 8px var(--td-shadow-1);

      &:hover {
        transform: translateY(-4px);
        box-shadow: 0 12px 24px var(--td-shadow-3);
        border-color: var(--td-brand-color);

        .delStoryboards {
          opacity: 1;
        }

        .hover-overlay {
          opacity: 1;
        }

        .cover-image {
          transform: scale(1.05);
        }
      }

      .shot-badge {
        position: absolute;
        top: 12px;
        left: 12px;
        z-index: 10;
        padding: 4px 12px;
        background: var(--td-brand-color);
        color: var(--td-text-color-anti);
        border-radius: 8px;
        font-size: 13px;
        font-weight: 600;
        box-shadow: 0 2px 8px var(--td-shadow-1);
      }
      .delStoryboards {
        position: absolute;
        top: 12px;
        right: 12px;
        z-index: 10;
        padding: 4px 12px;
        background: var(--td-error-color);
        color: var(--td-text-color-anti);
        border-radius: 8px;
        font-size: 13px;
        font-weight: 600;
        box-shadow: 0 2px 8px var(--td-shadow-1);
        opacity: 0;
        transition: opacity 0.3s ease;
        cursor: pointer;

        &:hover {
          background: var(--td-error-color-hover);
        }
      }

      .cover-wrapper {
        position: relative;
        width: 100%;
        height: 180px;
        overflow: hidden;
        background: var(--td-bg-color-component);

        .cover-image {
          width: 100%;
          height: 100%;
          transition: transform 0.4s ease;

          :deep(img) {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }
        }

        .loading-placeholder {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 100%;
          background: var(--td-bg-color-component);

          .loading-spinner {
            width: 32px;
            height: 32px;
            border: 3px solid var(--td-component-border);
            border-top-color: var(--td-brand-color);
            border-radius: 50%;
            animation: spin 1s linear infinite;
          }
        }

        .error-placeholder {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 8px;
          width: 100%;
          height: 100%;
          background: var(--td-error-color-1);

          span {
            font-size: 13px;
            color: var(--td-error-color);
          }
        }

        .hover-overlay {
          position: absolute;
          inset: 0;
          z-index: 9999999999;
          background: var(--td-mask-active);
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: opacity 0.3s ease;
          backdrop-filter: blur(2px);

          .action-btn {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 10px 20px;
            background: var(--td-bg-color-container);
            color: var(--td-brand-color);
            border: 1px solid var(--td-component-border);
            border-radius: 10px;
            font-size: 14px;
            font-weight: 500;
            transition: transform 0.2s ease;

            &:hover {
              transform: scale(1.05);
              border-color: var(--td-brand-color);
            }
          }
        }
      }

      .info-wrapper {
        padding: 16px;

        .card-title {
          margin: 0 0 8px;
          font-size: 15px;
          font-weight: 600;
          color: var(--td-text-color-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .card-desc {
          margin: 0;
          font-size: 14px;
          color: var(--td-text-color-secondary);
          line-height: 1.6;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      }
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 60px 20px;
      background: var(--td-bg-color-container);
      border-radius: 16px;
      border: 2px dashed var(--td-component-border);

      .empty-icon {
        width: 80px;
        height: 80px;
        background: var(--td-bg-color-component);
        border: 1px solid var(--td-component-border);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--td-brand-color);
        margin-bottom: 20px;
      }

      .empty-title {
        margin: 0 0 8px;
        font-size: 18px;
        font-weight: 600;
        color: var(--td-text-color-primary);
      }

      .empty-desc {
        margin: 0;
        font-size: 14px;
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
</style>
