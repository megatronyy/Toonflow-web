<template>
  <t-dialog
    :visible.sync="modalShow"
    wrapClassName="noHeaderMargin"
    destroyOnClose
    :footer="false"
    :width="900"
    top="2vh"
    dialogClass="customModal"
    :closable="false"
    :close-btn="false"
    :maskClosable="false"
    @close="close">
    <template #header>
      <div class="titHeader">
        <div class="titleWrapper">
          <div class="titleIcon">
            <i-pic class="icon" theme="outline" size="20" />
          </div>
          <span class="title">图片生成</span>
        </div>
        <i-close class="closeBtn" theme="outline" size="20" @click="close" />
      </div>
    </template>
    <a-spin :spinning="fakeLoading" tip="发送数据中...">
      <div class="modelBody" v-if="formData">
        <!-- 模式切换 -->
        <div class="modeSwitch">
          <a-radio-group v-model:value="mode" button-style="solid">
            <a-radio-button :value="1">
              <i-upload-one theme="outline" size="14" />
              <span>本地上传</span>
            </a-radio-button>
            <a-radio-button :value="2">
              <i-robot theme="outline" size="14" />
              <span>AI 生成</span>
            </a-radio-button>
          </a-radio-group>
        </div>

        <div class="contentWrapper">
          <!-- 左侧面板 -->
          <div class="leftBody">
            <div class="sectionCard">
              <!-- 图片上传区域 -->
              <div class="uploadSection">
                <div class="sectionHeader">
                  <span class="namePre">{{ mode === 1 ? "上传图片" : "参考图片" }}</span>
                  <span v-if="mode === 2" class="optionalTag">可选</span>
                </div>
                <div class="picturePreview" @click="changeFile">
                  <template v-if="currentImage">
                    <div class="imageDiv pr">
                      <a-image :src="currentImage" alt="元素图片" class="elementImg" :fallback="errorPictrue" />
                      <div class="imageOverlay">
                        <i-delete class="deleteBtn" theme="outline" size="18" @click.stop="deleteImage" />
                      </div>
                    </div>
                  </template>
                  <div v-else class="uploadPlaceholder">
                    <div class="uploadIconWrapper">
                      <i-upload-picture theme="outline" size="32" />
                    </div>
                    <span class="uploadText">点击上传</span>
                  </div>
                </div>
              </div>

              <!-- AI生成模式的提示词 -->
              <template v-if="mode === 2">
                <div class="promptSection">
                  <div class="sectionHeader">
                    <span class="namePre">提示词</span>
                    <a-tooltip title="AI 智能生成提示词">
                      <a-button type="link" size="small" class="magicBtn" @click.stop="generatePrompt" :loading="promptLoading">
                        <template #icon><i-magic theme="outline" size="14" /></template>
                        智能生成
                      </a-button>
                    </a-tooltip>
                  </div>
                  <a-spin :spinning="promptLoading" tip="提示词生成中...">
                    <a-textarea
                      v-model:value="formData.prompt"
                      :autoSize="{ minRows: 4, maxRows: 10 }"
                      placeholder="请输入或使用 AI 生成提示词，描述您想要生成的图片内容..."
                      class="promptTextarea" />
                  </a-spin>
                </div>

                <a-button type="primary" block size="large" class="generateBtn" @click="startGenerate" :loading="generateLoading">
                  <template #icon><i-lightning theme="outline" size="16" /></template>
                  开始生成
                </a-button>
              </template>
            </div>
          </div>

          <!-- 右侧结果面板 -->
          <div v-if="mode === 2" class="rightBody">
            <div class="sectionCard resultCard">
              <div class="sectionHeader">
                <span class="namePre">生成结果</span>
                <a-tag v-if="resultImages.length" color="purple">{{ resultImages.length }} 张</a-tag>
              </div>
              <div class="resultContent">
                <a-empty v-if="!resultImages.length" :image="simpleImage" description="暂无生成结果" />
                <div v-else class="resultGrid">
                  <div
                    v-for="(item, index) in resultImages"
                    :key="index"
                    class="resultItem"
                    :class="{ selected: selectedIndex === index, generating: item.state === '生成中' }"
                    @click="handleSelect(item, index)">
                    <template v-if="(item.state === '生成成功' || !item.state) && item.filePath">
                      <a-image :preview="false" :src="item.filePath" :fallback="errorPictrue" class="resultImg" />
                      <div class="resultOverlay">
                        <i-preview-open class="previewBtn" theme="outline" size="20" @click.stop="previewImage(item.filePath)" />
                      </div>
                      <div class="del">
                        <i-delete class="delImage" style="margin-left: 5px" theme="outline" size="20" @click.stop="delImage(item)" />
                      </div>
                      <div v-if="selectedIndex === index" class="selectedBadge">
                        <i-check theme="outline" size="14" />
                      </div>
                    </template>
                    <template v-else-if="item.state === '生成中'">
                      <div class="generatingPlaceholder">
                        <a-spin />
                        <span>生成中...</span>
                      </div>
                      <div class="del">
                        <i-delete class="delImage" style="margin-left: 5px" theme="outline" size="20" @click.stop="delImage(item)" />
                      </div>
                    </template>
                    <template v-else-if="item.state === '生成失败'">
                      <div class="errorPlaceholder">生成失败</div>
                      <div class="del">
                        <i-delete class="delImage" style="margin-left: 5px" theme="outline" size="20" @click.stop="delImage(item)" />
                      </div>
                    </template>
                    <template v-else>
                      <div class="errorPlaceholder">未知状态</div>
                      <div class="del">
                        <i-delete class="delImage" style="margin-left: 5px" theme="outline" size="20" @click.stop="delImage(item)" />
                      </div>
                    </template>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 底部按钮 -->
        <div class="footerBtns">
          <a-button size="large" @click="close">取消</a-button>
          <a-button type="primary" size="large" :loading="saveLoading" @click="handleSave">
            <template #icon><i-save theme="outline" size="16" /></template>
            保存
          </a-button>
        </div>
      </div>
    </a-spin>
  </t-dialog>

  <!-- 图片预览 -->
  <a-image :width="200" style="display: none" :preview="{ visible: previewVisible, onVisibleChange: setPreviewVisible }" :src="previewUrl" />
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { storeToRefs } from "pinia";
import { Empty, message, Modal } from "ant-design-vue";
import { useFileDialog } from "@vueuse/core";
import errorPictrue from "@/utils/error";
import axios from "@/utils/axios";
import store from "@/stores";
const { projectId } = storeToRefs(store());

interface ImageState {
  id?: number;
  filePath: string;
  state: string;
}

interface FormData {
  id: number;
  filePath: string;
  uploadImage?: string;
  sampleImage?: string;
  intro: string;
  name: string;
  prompt: string;
  remark: string;
  type?: string;
}

const TYPE_MAP: Record<string, string> = {
  角色: "role",
  场景: "scene",
  分镜: "storyboard",
  道具: "props",
};
const fakeLoading = ref(false);
const props = defineProps<{ data?: FormData }>();
const emits = defineEmits<{ update: [] }>();

const modalShow = defineModel<boolean>({ default: false });

// 使用组件内部状态，确保每个弹窗实例独立
const promptLoading = ref(false);
const generateLoading = ref(false);

const simpleImage = Empty.PRESENTED_IMAGE_SIMPLE;

// 状态
const mode = ref<1 | 2>(2);
const formData = ref<FormData>();
const resultImages = ref<ImageState[]>([]);
const selectedIndex = ref(-1);
const saveLoading = ref(false);
const previewVisible = ref(false);
const previewUrl = ref("");

// 计算属性
const currentImage = computed(() => (mode.value === 1 ? formData.value?.uploadImage : formData.value?.sampleImage));
const assetType = computed(() => TYPE_MAP[formData.value?.type ?? "道具"] ?? "props");

// 文件选择
const { open, onChange, onCancel } = useFileDialog({ multiple: false, reset: true, accept: ".png,.jpg,.jpeg" });
const isFirstLoad = ref(true);
// 监听弹窗打开
watch(modalShow, (visible) => {
  if (visible && props.data) {
    formData.value = { ...props.data, sampleImage: "", uploadImage: "" };
    isFirstLoad.value = true; // 重置首次加载标志
    fetchImages(props.data.id);
    // 重置加载状态,确保每次打开弹窗时状态独立
    promptLoading.value = false;
    generateLoading.value = false;
  }
  if (!visible) {
    timer && clearTimeout(timer);
  }
});
function handleSelect(item: ImageState, index: number) {
  if (item.state == "生成中") {
    message.warn("生成中");
    return;
  }
  selectedIndex.value = index;
}
function setPreviewVisible(value: boolean) {
  previewVisible.value = value;
}
let timer: NodeJS.Timeout | number = -1;
// 获取图片列表
const assetsId = ref();
async function fetchImages(id: number) {
  const _id = id;
  const { data } = await axios.post("/assets/getImage", { assetsId: id });
  assetsId.value = data.id;
  if (data.tempAssets.filter((i: { state: string }) => i.state == "生成中").length > 0) {
    timer = setTimeout(() => {
      if (modalShow.value) fetchImages(_id);
    }, 2000);
  }
  if (_id == formData.value?.id) {
    if (data.filePath.length > 0) {
      resultImages.value = [{ filePath: data.filePath, state: "生成成功" }, ...data.tempAssets];
      if (isFirstLoad.value) {
        selectedIndex.value = resultImages.value.findIndex((item) => item.filePath === formData.value?.filePath);
        isFirstLoad.value = false;
      }
    } else {
      resultImages.value = [...data.tempAssets];
      if (isFirstLoad.value) {
        selectedIndex.value = resultImages.value.findIndex(
          (item) => item.filePath === formData.value?.filePath && formData.value?.filePath.length > 0,
        );
        isFirstLoad.value = false;
      }
    }
  }
}

// 选择文件
async function changeFile() {
  if (!formData.value) return;

  const files = await new Promise<FileList | null>((resolve) => {
    open();
    onChange((f) => resolve(f));
    onCancel(() => resolve(null));
  });

  if (!files?.length) return;

  const file = files[0];
  if (mode.value === 1) {
    formData.value.uploadImage = URL.createObjectURL(file);
  } else {
    formData.value.sampleImage = await fileToBase64(file);
  }
}

// 删除图片
function deleteImage() {
  if (!formData.value) return;
  if (mode.value === 1) {
    formData.value.uploadImage = "";
  } else {
    formData.value.sampleImage = "";
  }
}

// 预览图片
function previewImage(url: string) {
  previewUrl.value = url;
  previewVisible.value = true;
}

//删除图片
async function delImage(item: ImageState) {
  Modal.confirm({
    title: "确认删除",
    content: `确定要删除该图片吗？`,
    okText: "删除",
    cancelText: "取消",
    okButtonProps: { danger: true },
    onOk: async () => {
      if (item.id) {
        await axios.post("/assets/delAssetsImage", {
          imageId: item.id,
        });
      } else {
        await axios.post("/assets/delAssetsImage", {
          assetsId: assetsId.value,
        });
      }
      if (props.data?.id) {
        fetchImages(props.data.id);
      }
      message.success("删除成功");
    },
  });
}

// 关闭弹窗
function close() {
  modalShow.value = false;
}

// 生成提示词
async function generatePrompt() {
  if (!formData.value) return;
  const { id, name, intro, type } = formData.value;
  promptLoading.value = true;
  try {
    const { data } = await axios.post("/assets/polishAssetsPrompt", {
      projectId: projectId.value,
      assetsId: id,
      type: TYPE_MAP[type ?? "道具"] ?? "props",
      name,
      describe: intro ? intro : "无描述",
    });
    message.success("提示词生成成功");
    if (data.assetsId === formData.value.id) {
      formData.value.prompt = data.prompt;
    }
  } catch (e: any) {
    message.error(e.message ?? "提示词生成失败");
  } finally {
    promptLoading.value = false;
  }
}

// 开始生成图片
async function startGenerate() {
  if (!formData.value) return;
  const { id, name, sampleImage, prompt } = formData.value;
  fakeLoading.value = true;
  generateLoading.value = true;
  try {
    const _promise = axios.post("/assets/generateAssets", {
      type: assetType.value,
      projectId: projectId.value,
      name,
      base64: sampleImage || undefined,
      prompt,
      id,
    });
    setTimeout(() => {
      fetchImages(props.data?.id ?? -1);
      fakeLoading.value = false;
    }, 2000);

    const { data } = await _promise;
    await fetchImages(props.data?.id ?? -1);
    message.success("资产生成成功");
    if (data.assetsId === formData.value.id) {
      resultImages.value.push({ filePath: data.path, state: "生成成功" });
    }
  } catch (e) {
    message.error("资产生成失败");
  } finally {
    generateLoading.value = false;
  }
}

// 保存
async function handleSave() {
  if (!formData.value) return;

  const params: Record<string, any> = { projectId: projectId.value, id: formData.value.id };

  if (mode.value === 1) {
    if (!formData.value.uploadImage) {
      message.error("请上传图片");
      return;
    }
    params.base64 = await blobUrlToBase64(formData.value.uploadImage);
  } else {
    if (selectedIndex.value === -1) {
      message.error("请选择生成结果");
      return;
    }
    params.prompt = formData.value.prompt || "";
    params.filePath = resultImages.value[selectedIndex.value]?.filePath || "";
  }

  saveLoading.value = true;
  try {
    await axios.post("/assets/saveAssets", params);
    message.success("保存成功");
    emits("update");
    close();
  } catch {
    message.error("保存失败");
  } finally {
    saveLoading.value = false;
  }
}

// 工具函数
function fileToBase64(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function blobUrlToBase64(blobUrl: string): Promise<string> {
  const response = await fetch(blobUrl);
  const blob = await response.blob();
  return fileToBase64(blob);
}
</script>

<style lang="scss" scoped>
.titHeader {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--td-bg-color-container);
  height: 64px;
  width: 100%;
  border-bottom: 1px solid var(--td-component-border);

  .titleWrapper {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-left: 24px;

    .titleIcon {
      width: 36px;
      height: 36px;
      background: var(--td-brand-color);
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;

      .icon {
        color: var(--td-text-color-anti);
      }
    }

    .title {
      font-weight: 600;
      font-size: 18px;
      color: var(--td-text-color-primary);
    }
  }

  .closeBtn {
    cursor: pointer;
    margin-right: 24px;
    padding: 6px;
    border-radius: 8px;
    transition: all 0.2s;
    color: var(--td-text-color-secondary);

    &:hover {
      background: var(--td-bg-color-component-hover);
      color: var(--td-text-color-primary);
    }
  }
}

.modelBody {
  padding: 20px 24px;
  background: var(--td-bg-color-page);

  .modeSwitch {
    margin-bottom: 20px;
    display: flex;

    :deep(.ant-radio-group) {
      background: var(--td-bg-color-container);
      padding: 4px;
      border-radius: 10px;
      border: 1px solid var(--td-component-border);
      box-shadow: 0 1px 3px var(--td-shadow-1);
    }

    :deep(.ant-radio-button-wrapper) {
      border: none;
      border-radius: 8px !important;
      padding: 8px 24px;
      height: auto;
      line-height: 1.5;
      display: inline-flex;
      align-items: center;
      gap: 6px;

      &::before {
        display: none;
      }

      &:not(.ant-radio-button-wrapper-checked) {
        background: transparent;
        color: var(--td-text-color-secondary);
      }

      &.ant-radio-button-wrapper-checked {
        background: var(--td-brand-color);
        color: var(--td-text-color-anti);
      }

      &:hover:not(.ant-radio-button-wrapper-checked) {
        color: var(--td-text-color-primary);
      }
    }
  }

  .contentWrapper {
    display: flex;
    gap: 20px;
  }

  .leftBody {
    width: 320px;
    flex-shrink: 0;
  }

  .rightBody {
    flex: 1;
    min-width: 0;
  }

  .sectionCard {
    background: var(--td-bg-color-container);
    border-radius: 16px;
    padding: 20px;
    box-shadow: 0 2px 8px var(--td-shadow-1);
    border: 1px solid var(--td-component-border);
  }

  .resultCard {
    height: 100%;
    display: flex;
    flex-direction: column;

    .resultContent {
      flex: 1;
      max-height: 420px;
      overflow-y: auto;
      margin-top: 16px;

      &::-webkit-scrollbar {
        width: 6px;
      }

      &::-webkit-scrollbar-track {
        background: var(--td-bg-color-component);
        border-radius: 3px;
      }

      &::-webkit-scrollbar-thumb {
        background: var(--td-scrollbar-color);
        border-radius: 3px;

        &:hover {
          background: var(--td-scrollbar-hover-color);
        }
      }
    }
  }

  .sectionHeader {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
  }

  .namePre {
    font-size: 15px;
    font-weight: 600;
    color: var(--td-text-color-primary);
  }

  .optionalTag {
    font-size: 12px;
    color: var(--td-text-color-placeholder);
    background: var(--td-bg-color-component);
    padding: 2px 8px;
    border-radius: 4px;
    border: 1px solid var(--td-component-border);
  }

  .uploadSection {
    margin-bottom: 20px;
  }

  .picturePreview {
    width: 100%;
    aspect-ratio: 1/1;
    max-width: 100px;
    border: 2px dashed var(--td-component-border);
    border-radius: 16px;
    overflow: hidden;
    background: var(--td-bg-color-component);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.3s ease;

    &:hover {
      border-color: var(--td-brand-color);
      background: var(--td-brand-color-1);
      box-shadow: 0 4px 12px var(--td-shadow-2);
    }
  }

  .uploadPlaceholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    padding: 20px;

    .uploadIconWrapper {
      width: 26px;
      height: 26px;
      background: var(--td-brand-color-1);
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--td-brand-color);
    }

    .uploadText {
      font-size: 14px;
      font-weight: 500;
      color: var(--td-brand-color);
    }
  }

  .imageDiv {
    width: 100%;
    height: 100%;

    .imageOverlay {
      position: absolute;
      inset: 0;
      background: var(--td-mask-active);
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      transition: opacity 0.2s;
    }

    &:hover .imageOverlay {
      opacity: 1;
    }

    .deleteBtn {
      padding: 8px;
      background: var(--td-error-color);
      border-radius: 8px;
      cursor: pointer;
      transition: transform 0.2s;
      color: var(--td-text-color-anti);

      &:hover {
        transform: scale(1.1);
        background: var(--td-error-color-hover);
      }
    }
  }

  .promptSection {
    margin-bottom: 20px;

    .magicBtn {
      padding: 0;
      height: auto;
      color: var(--td-brand-color);
      font-size: 13px;

      &:hover {
        color: var(--td-brand-color-hover);
      }
    }

    .promptTextarea {
      border-radius: 12px;
      border-color: var(--td-component-border);
      padding: 12px 14px;
      font-size: 14px;
      resize: none;
      background: var(--td-bg-color-container);
      color: var(--td-text-color-primary);

      &:focus {
        border-color: var(--td-brand-color);
        box-shadow: 0 0 0 3px var(--td-brand-color-1);
      }

      &::placeholder {
        color: var(--td-text-color-placeholder);
      }
    }
  }

  .generateBtn {
    border-radius: 12px;
    height: 48px;
    font-size: 15px;
    font-weight: 500;
    background: var(--td-brand-color);
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    color: var(--td-text-color-anti);

    &:hover {
      background: var(--td-brand-color-hover);
    }
  }

  .resultGrid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 12px;
  }

  .resultItem {
    aspect-ratio: 1/1;
    border-radius: 12px;
    overflow: hidden;
    cursor: pointer;
    position: relative;
    border: 2px solid transparent;
    transition: all 0.2s ease;
    background: var(--td-bg-color-component);

    &:hover {
      box-shadow: 0 4px 12px var(--td-shadow-2);
      .resultOverlay {
        opacity: 1;
      }
    }

    &.selected {
      border-color: var(--td-brand-color);
    }

    &.generating {
      cursor: default;

      &:hover {
        transform: none;
        box-shadow: none;
      }
    }

    .resultImg {
      width: 100%;
      height: 100%;
      object-fit: cover;
      z-index: 999999;
    }

    .resultOverlay {
      position: absolute;
      inset: 0;
      background: var(--td-mask-active);
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      transition: opacity 0.2s;

      .previewBtn {
        padding: 8px;
        background: var(--td-bg-color-container);
        border-radius: 8px;
        backdrop-filter: blur(4px);
        cursor: pointer;
        transition: all 0.2s;
        color: var(--td-text-color-primary);

        &:hover {
          background: var(--td-bg-color-component-hover);
        }
      }
    }

    .del {
      position: absolute;
      right: 8px;
      bottom: 8px;
      cursor: pointer;

      .delImage {
        color: var(--td-error-color);
        padding: 4px;
        background: var(--td-bg-color-container);
        border-radius: 6px;
        transition: all 0.2s;

        &:hover {
          background: var(--td-error-color-1);
        }
      }
    }

    .selectedBadge {
      position: absolute;
      top: 8px;
      right: 8px;
      width: 24px;
      height: 24px;
      background: var(--td-brand-color);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 6px var(--td-shadow-1);
      color: var(--td-text-color-anti);
    }

    .generatingPlaceholder {
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 10px;
      background: var(--td-bg-color-component);
      border: 1px dashed var(--td-component-border);
      border-radius: 10px;

      span {
        font-size: 12px;
        color: var(--td-text-color-secondary);
      }
    }

    .errorPlaceholder {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--td-error-color-1);
      color: var(--td-error-color);
      font-size: 12px;
    }
  }

  .footerBtns {
    margin-top: 24px;
    padding-top: 20px;
    border-top: 1px solid var(--td-component-border);
    display: flex;
    justify-content: flex-end;
    gap: 12px;

    .ant-btn {
      min-width: 100px;
      border-radius: 10px;
      height: 44px;
      font-size: 15px;

      &.ant-btn-primary {
        background: var(--td-brand-color);
        border: none;
        color: var(--td-text-color-anti);

        &:hover {
          background: var(--td-brand-color-hover);
        }
      }

      &:not(.ant-btn-primary) {
        background: var(--td-bg-color-container);
        border: 1px solid var(--td-component-border);
        color: var(--td-text-color-secondary);

        &:hover {
          background: var(--td-bg-color-component-hover);
          color: var(--td-text-color-primary);
          border-color: var(--td-brand-color);
        }
      }
    }
  }
}

:deep(.ant-image) {
  width: 100%;
  height: 100%;

  img {
    object-fit: cover;
  }
}

:deep(.ant-empty) {
  margin: 40px 0;

  .ant-empty-description {
    color: var(--td-text-color-placeholder);
  }
}

:deep(.ant-tag) {
  border-radius: 6px;
  border: none;
  font-size: 12px;
  background: var(--td-brand-color-1);
  color: var(--td-brand-color);
  border: 1px solid var(--td-brand-color-2);
}

:deep(.ant-image-img) {
  height: 100%;
}

:deep(.ant-spin) {
  color: var(--td-brand-color);
}
</style>
