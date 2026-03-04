<template>
  <div class="storyboard-video">
    <!-- 头部 -->
    <div class="header">
      <div class="title">
        <div class="icon-wrapper">
          <i-pic :size="20" class="icon" />
        </div>
        <span>视频配置</span>
        <span v-if="currentConfigs.length" class="count">{{ currentConfigs.length }}</span>
      </div>
      <button v-if="canGenerate" :disabled="!disableBtn" class="generate-btn" @click="modalShow = true">
        <i-video-two :size="18" />
        <span>添加配置</span>
      </button>
    </div>

    <!-- 内容区 -->
    <div class="content">
      <template v-if="currentConfigs.length">
        <div class="video-grid">
          <div v-for="(config, index) in currentConfigs" :key="config.id" class="video-card" @click="openDetail(config)">
            <!-- 视频编号 -->
            <div class="video-index">#{{ index + 1 }}</div>

            <!-- 封面区域 -->
            <div class="cover-wrapper">
              <!-- 有生成中的结果 - 优先显示 -->
              <template v-if="hasGeneratingResult(config.id)">
                <div class="status-wrapper generating">
                  <div class="loading-spinner"></div>
                  <span class="status-text">正在生成中...</span>
                  <span class="status-hint">{{ getResultCount(config.id) }}个结果</span>
                </div>
              </template>

              <!-- 已选择结果且成功 -->
              <template v-else-if="getSelectedResult(config.id)?.state === 1">
                <img
                  v-if="getSelectedResult(config.id)?.firstFrame"
                  :src="getSelectedResult(config.id)?.firstFrame"
                  class="cover-image"
                  alt="视频封面" />
                <video
                  v-else-if="getSelectedResult(config.id)?.filePath"
                  :src="getSelectedResult(config.id)?.filePath"
                  class="cover-image"
                  preload="metadata"></video>
                <div v-else class="video-placeholder">
                  <i-film :size="32" />
                  <span>视频</span>
                </div>
                <!-- <img :src="getSelectedResult(config.id)?.firstFrame || getSelectedResult(config.id)?.filePath" class="cover-image" alt="视频封面" /> -->
                <div class="play-overlay">
                  <div class="play-button">
                    <i-play-one theme="filled" :size="32" fill="#fff" />
                  </div>
                </div>
                <div v-if="getSelectedResult(config.id)?.duration" class="duration-badge">
                  {{ formatDuration(getSelectedResult(config.id)!.duration) }}
                </div>
              </template>

              <!-- 未生成/待生成 -->
              <template v-else>
                <div class="status-wrapper pending">
                  <div class="pending-icon">
                    <i-setting-config :size="32" />
                  </div>
                  <span class="status-text">待生成</span>
                  <span class="status-hint">点击进入生成</span>
                </div>
              </template>
            </div>

            <!-- 信息区域 -->
            <div class="info-wrapper">
              <div class="config-info">
                <span class="manufacturer-tag">{{ getManufacturerLabel(config.manufacturer) }}</span>
                <span class="resolution-tag" v-if="config.resolution">{{ config.resolution }}</span>
                <span class="duration-tag">{{ config.duration }}s</span>
              </div>
              <p class="prompt-text">{{ config.prompt || "暂无描述" }}</p>
            </div>

            <!-- 删除按钮 -->
            <button class="delete-btn" @click.stop="handleDeleteConfig(config.id)">
              <i-delete :size="16" />
            </button>
          </div>
        </div>
      </template>

      <!-- 空状态 -->
      <div v-else class="empty-state">
        <div class="empty-icon">
          <i-video-two :size="48" />
        </div>
        <p class="empty-title">暂无视频配置</p>
        <p class="empty-desc">点击上方按钮添加视频配置</p>
      </div>
    </div>

    <!-- 添加配置弹窗 -->
    <newVideo v-if="modalShow && scriptId" v-model="modalShow" :scriptId="scriptId" />

    <!-- 视频详情弹窗 -->
    <videoDetail  v-model="detailModalShow" :configId="currentConfigId" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { Modal, message } from "ant-design-vue";
import newVideo from "./generateVideo/newVideo.vue";
import videoDetail from "./generateVideo/videoDetail.vue";
import videoStore, { type VideoConfig, type VideoResult } from "@/stores/video";
import { storeToRefs } from "pinia";

const props = defineProps<{
  scriptId: number | null;
  disableBtn: boolean;
  canGenerate: boolean;
}>();

const store = videoStore();
const { currentConfigs } = storeToRefs(store);

const modalShow = ref(false);
const detailModalShow = ref(false);
const currentConfigId = ref<number | null>(null);

// 厂商标签映射
const manufacturerLabels: Record<string, string> = {
  volcengine: "豆包",
  runninghub: "Sora",
  openAi: "OpenAI",
};

function getManufacturerLabel(manufacturer: string): string {
  return manufacturerLabels[manufacturer] || manufacturer;
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

// 获取配置的选中结果
function getSelectedResult(configId: number): VideoResult | null {
  return store.getSelectedResult(configId);
}

// 检查是否有生成中的结果
function hasGeneratingResult(configId: number): boolean {
  const results = store.getResultsByConfigId(configId);
  return results.some((r) => r.state === 0);
}

// 获取结果数量
function getResultCount(configId: number): number {
  return store.getResultsByConfigId(configId).length;
}

// 打开详情弹窗
function openDetail(config: VideoConfig) {
  currentConfigId.value = config.id;
  detailModalShow.value = true;
}

// 删除配置
function handleDeleteConfig(configId: number) {
  Modal.confirm({
    title: "确认删除",
    content: "删除配置后，关联的所有生成结果也会被删除，确定要删除吗？",
    okText: "确定",
    cancelText: "取消",
    onOk() {
      store.removeConfig(configId);
      message.success("删除成功");
    },
  });
}
</script>

<style lang="scss" scoped>
.storyboard-video {
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

    .video-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 24px;
    }

    .video-card {
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

        .play-overlay {
          opacity: 1;
          z-index: 9999999999;
        }

        .cover-image {
          transform: scale(1.05);
        }

        .delete-btn {
          opacity: 1;
          z-index: 999999999999;
        }
      }

      .video-index {
        position: absolute;
        top: 10px;
        left: 10px;
        min-width: 24px;
        height: 24px;
        padding: 0 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--td-brand-color);
        border-radius: 6px;
        color: var(--td-text-color-anti);
        font-size: 12px;
        font-weight: 600;
        z-index: 10;
      }

      .delete-btn {
        position: absolute;
        top: 10px;
        right: 10px;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--td-error-color);
        border: none;
        border-radius: 8px;
        color: var(--td-text-color-anti);
        cursor: pointer;
        opacity: 0;
        transition: all 0.2s ease;
        z-index: 10;

        &:hover {
          background: var(--td-error-color-hover);
          transform: scale(1.1);
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
          object-fit: cover;
          transition: transform 0.4s ease;
        }

        .video-placeholder {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          gap: 8px;
          color: var(--td-text-color-placeholder);
          
          span {
            font-size: 14px;
          }
        }

        .play-overlay {
          position: absolute;
          inset: 0;
          background: var(--td-mask-active);
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: opacity 0.3s ease;

          .play-button {
            width: 60px;
            height: 60px;
            background: var(--td-brand-color);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            backdrop-filter: blur(4px);
            transition: transform 0.2s ease;

            &:hover {
              transform: scale(1.1);
              background: var(--td-brand-color-hover);
            }
          }
        }

        .duration-badge {
          position: absolute;
          bottom: 10px;
          right: 10px;
          padding: 4px 10px;
          background: var(--td-mask-active);
          color: var(--td-text-color-anti);
          border-radius: 6px;
          font-size: 12px;
          font-weight: 500;
          backdrop-filter: blur(4px);
        }

        .status-badge {
          position: absolute;
          top: 10px;
          left: 10px;
          padding: 4px 10px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 500;

          &.success {
            background: var(--td-success-color);
            color: var(--td-text-color-anti);
          }
        }

        .status-wrapper {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          gap: 12px;

          &.generating {
            .loading-spinner {
              width: 40px;
              height: 40px;
              border: 3px solid var(--td-component-border);
              border-top-color: var(--td-brand-color);
              border-radius: 50%;
              animation: spin 1s linear infinite;
            }

            .status-text {
              color: var(--td-text-color-secondary);
              font-size: 14px;
              font-weight: 500;
            }

            .status-hint {
              color: var(--td-text-color-placeholder);
              font-size: 12px;
            }
          }

          &.pending {
            .pending-icon {
              width: 50px;
              height: 50px;
              background: var(--td-bg-color-component);
              border: 1px solid var(--td-component-border);
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              color: var(--td-brand-color);
            }

            .status-text {
              color: var(--td-text-color-secondary);
              font-size: 14px;
              font-weight: 500;
            }

            .status-hint {
              color: var(--td-text-color-placeholder);
              font-size: 12px;
            }
          }
        }
      }

      .info-wrapper {
        padding: 16px;

        .config-info {
          display: flex;
          gap: 8px;
          margin-bottom: 10px;
          flex-wrap: wrap;

          .manufacturer-tag,
          .resolution-tag,
          .duration-tag {
            padding: 2px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: 500;
          }

          .manufacturer-tag {
            background: var(--td-brand-color-1);
            color: var(--td-brand-color);
            border: 1px solid var(--td-brand-color-2);
          }

          .resolution-tag {
            background: var(--td-bg-color-component);
            color: var(--td-text-color-secondary);
            border: 1px solid var(--td-component-border);
          }

          .duration-tag {
            background: var(--td-success-color-1);
            color: var(--td-success-color);
            border: 1px solid var(--td-success-color-2);
          }
        }

        .prompt-text {
          margin: 0;
          font-size: 14px;
          color: var(--td-text-color-secondary);
          line-height: 1.6;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          line-clamp: 2;
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
