<template>
  <div class="projectAssets">
    <t-dialog v-model:visible="projectAssetsShow" header="项目资产" :footer="false" width="90%" top="10vh" destroy-on-close>
      <div class="assetsContent">
        <t-tabs v-model="assetOptions" @change="selectAssetOptions">
          <t-tab-panel v-for="(item, index) in themeData" :key="index" :value="item.value">
            <template #label>
              <div class="tabLabel">
                <component :is="item.icon" theme="outline" size="20" />
                <span>{{ item.name }}</span>
              </div>
            </template>
            <div class="panelContent">
              <div class="toolbar">
                <t-space>
                  <t-button theme="primary" @click="handleAdd(item.name)">
                    <template #icon>
                      <t-icon name="add" />
                    </template>
                    新增{{ item.name }}
                  </t-button>
                  <t-button theme="primary" @click="handleBatchGenerate">
                    <template #icon>
                      <t-icon name="indent-left" />
                    </template>
                    批量生成
                  </t-button>
                  <t-button theme="default" variant="outline" @click="handleBatchDelete">
                    <template #icon>
                      <t-icon name="delete" />
                    </template>
                    批量删除
                  </t-button>
                </t-space>
                <t-input v-model="searchText" placeholder="搜索资产名称..." clearable style="width: 260px">
                  <template #prefix-icon>
                    <t-icon name="search" />
                  </template>
                </t-input>
              </div>
              <t-table
                :columns="columns"
                :data="tableData"
                :selected-row-keys="selectedRowKeys"
                :expanded-row-keys="expandedRowKeys"
                row-key="id"
                hover
                stripe
                size="small"
                :pagination="pagination"
                :loading="loading"
                lazy-load
                table-layout="fixed"
                @select-change="handleSelectChange"
                @expand-change="handleExpandChange"
                @page-change="handlePageChange">
                <template #expandedRow="{ row }">
                  <div class="expandedContent">
                    <t-table :columns="subColumns" :data="row.sonAssets || []" row-key="id" hover size="small" table-layout="fixed">
                      <template #preview="{ row: subRow }">
                        <div class="previewCell">
                          <t-image-viewer :images="[subRow.filePath]" :closeOnEscKeydown="true" :closeOnOverlay="true">
                            <template #trigger="{ open }">
                              <div class="imageTrigger" @click="subRow.filePath && open()">
                                <img v-if="subRow.filePath" :src="subRow.filePath" :alt="subRow.name" class="previewImage" />
                                <div v-else class="noImage">
                                  <t-icon name="image" size="24px" />
                                </div>
                                <div v-if="subRow.filePath" class="imageHoverOverlay">
                                  <t-icon name="browse" size="20px" />
                                  <span class="hoverText">预览</span>
                                </div>
                              </div>
                            </template>
                          </t-image-viewer>
                        </div>
                      </template>
                      <template #operation="{ row: subRow }">
                        <t-space :size="0">
                          <t-button theme="primary" variant="text" @click="generate(subRow)">
                            <template #icon>
                              <i-magic :size="18" />
                            </template>
                            生成
                          </t-button>
                          <t-button theme="primary" variant="text" @click="handleEdit(subRow)">
                            <template #icon>
                              <t-icon name="edit" />
                            </template>
                            编辑
                          </t-button>
                          <t-button theme="danger" variant="text" @click="handleDelete(subRow)">
                            <template #icon>
                              <t-icon name="delete" />
                            </template>
                            删除
                          </t-button>
                        </t-space>
                      </template>
                    </t-table>
                  </div>
                </template>
                <template #preview="{ row }">
                  <div class="previewCell">
                    <t-image-viewer :images="[row.filePath]" :closeOnEscKeydown="true" :closeOnOverlay="true">
                      <template #trigger="{ open }">
                        <div class="imageTrigger" @click="row.filePath && open()">
                          <img v-if="row.filePath" :src="row.filePath" :alt="row.name" class="previewImage" />
                          <div v-else class="noImage">
                            <t-icon name="image" size="24px" />
                          </div>
                          <div v-if="row.filePath" class="imageHoverOverlay">
                            <t-icon name="browse" size="20px" />
                            <span class="hoverText">预览</span>
                          </div>
                        </div>
                      </template>
                    </t-image-viewer>
                  </div>
                </template>
                <template #startTime="{ row }">
                  <span>{{ dayjs(row.startTime).format("YYYY-MM-DD HH:mm:ss") }}</span>
                </template>
                <template #operation="{ row }">
                  <t-space :size="0">
                    <t-button theme="primary" variant="text" @click="generate(row)">
                      <template #icon>
                        <i-magic :size="18" />
                      </template>
                      生成
                    </t-button>
                    <t-button theme="primary" variant="text" @click="handleEdit(row)">
                      <template #icon>
                        <t-icon name="edit" />
                      </template>
                      编辑
                    </t-button>
                    <t-button theme="danger" variant="text" @click="handleDelete(row)">
                      <template #icon>
                        <t-icon name="delete" />
                      </template>
                      删除
                    </t-button>
                  </t-space>
                </template>
              </t-table>
            </div>
          </t-tab-panel>
        </t-tabs>
      </div>
    </t-dialog>
    <addAssets v-model="addAssetsShow" :type="activeTab" :formData="formData" @getFilteredData="getFilteredData(activeTab)" />
    <batchGeneration v-model="batchGenerationShow" :type="activeTab" @update="loadCurrentTabData" />
    <generateImage v-model="generateImageShow" :data="currentAssetData" @update="loadCurrentTabData" />
  </div>
</template>

<script setup lang="ts">
import axios from "@/utils/axios";
import dayjs from "dayjs";
import type { TabValue, TableProps } from "tdesign-vue-next";
import addAssets from "./components/addAssets.vue";
import batchGeneration from "./components/batchGeneration.vue";
import generateImage from "./components/generateImage.vue";
import store from "@/stores";
const projectAssetsShow = defineModel<boolean>({
  default: false,
});

watch(projectAssetsShow, (newVal) => {
  if (newVal) {
    loadCurrentTabData();
  }
});

//表格数据类型定义
interface Asset {
  id: number;
  name: string;
  prompt: string;
  describe: string;
  remark: string;
  filePath?: string;
  type: string; // "角色" | "道具" | "场景"
  sonAssets?: Asset[]; // 子资产列表
}
const themeData = ref([
  {
    name: "角色",
    value: "role",
    icon: "i-permissions",
  },
  {
    name: "道具",
    value: "tool",
    icon: "i-tool",
  },
  {
    name: "场景",
    value: "scene",
    icon: "i-landscape",
  },
]);

// 父资产表格列配置
const columns: TableProps["columns"] = [
  { colKey: "row-select", type: "multiple", width: 50, align: "center", fixed: "left" },
  {
    colKey: "filePath",
    title: "预览",
    width: 100,
    align: "center",
    cell: "preview",
  },
  {
    colKey: "name",
    title: "名称",
    width: 100,
    align: "left",
    ellipsis: true,
  },
  {
    colKey: "prompt",
    title: "提示词",
    width: 200,
    align: "left",
    ellipsis: true,
  },
  {
    colKey: "describe",
    title: "描述",
    width: 200,
    align: "left",
    ellipsis: true,
  },
  {
    colKey: "remark",
    title: "备注",
    minWidth: 200,
    align: "left",
    ellipsis: true,
  },
  {
    colKey: "startTime",
    title: "创建时间",
    width: 200,
    align: "center",
    cell: "startTime",
  },
  {
    colKey: "operation",
    title: "操作",
    width: 250,
    align: "center",
    fixed: "right",
    cell: "operation",
  },
];

// 子资产表格列配置 - 不含勾选框和创建时间
const subColumns: TableProps["columns"] = [
  {
    colKey: "filePath",
    title: "预览",
    width: 100,
    align: "center",
    cell: "preview",
  },
  {
    colKey: "name",
    title: "名称",
    width: 200,
    align: "left",
    ellipsis: true,
  },
  {
    colKey: "prompt",
    title: "提示词",
    width: 200,
    align: "left",
    ellipsis: true,
  },
  {
    colKey: "describe",
    title: "描述",
    width: 200,
    align: "left",
    ellipsis: true,
  },
  {
    colKey: "remark",
    title: "备注",
    minWidth: 200,
    align: "left",
    ellipsis: true,
  },
  {
    colKey: "operation",
    title: "操作",
    width: 180,
    align: "center",
    fixed: "right",
    cell: "operation",
  },
];

// 表格数据
const tableData = ref<Asset[]>([]);
const loading = ref(false);

const assetOptions = ref<TabValue>("role");
const searchText = ref("");
const selectedRowKeys = ref<Array<string | number>>([]);
const expandedRowKeys = ref<Array<string | number>>([]);

let searchTimer: ReturnType<typeof setTimeout> | null = null;
watch(searchText, () => {
  pagination.current = 1;
  selectedRowKeys.value = [];
  if (searchTimer) {
    clearTimeout(searchTimer);
  }
  searchTimer = setTimeout(() => {
    loadCurrentTabData();
  }, 500);
});

// 分页配置
const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
  showJumper: true,
});

// 加载当前标签的数据
async function loadCurrentTabData() {
  let type = "";
  if (assetOptions.value === "role") {
    type = "角色";
  } else if (assetOptions.value === "tool") {
    type = "道具";
  } else if (assetOptions.value === "scene") {
    type = "场景";
  }
  await getFilteredData(type);
}

function selectAssetOptions(value: TabValue) {
  assetOptions.value = value;
  if (value === "role") {
    activeTab.value = "角色";
  } else if (value === "tool") {
    activeTab.value = "道具";
  } else if (value === "scene") {
    activeTab.value = "场景";
  }
  searchText.value = "";
  selectedRowKeys.value = [];
  expandedRowKeys.value = [];
  pagination.current = 1;
  loadCurrentTabData();
}
const { projectId } = storeToRefs(store());
async function getFilteredData(type: string) {
  try {
    loading.value = true;
    const { data } = await axios.post("/assets/getAssetsApi", {
      projectId: projectId.value,
      type,
      name: searchText.value || undefined,
      page: pagination.current,
      limit: pagination.pageSize,
    });

    tableData.value = data.data || [];
    pagination.total = data.total || 0;
    return tableData.value;
  } catch (error) {
    console.error("加载资产数据失败:", error);
    tableData.value = [];
    pagination.total = 0;
  } finally {
    loading.value = false;
  }
}

// 选择行
function handleSelectChange(value: Array<string | number>) {
  selectedRowKeys.value = value;
}

function handleExpandChange(value: Array<string | number>) {
  if (value.length > 3) {
    value = value.slice(-3);
  }
  expandedRowKeys.value = value;
}

// 处理分页变化
function handlePageChange(pageInfo: { current: number; pageSize: number }) {
  pagination.current = pageInfo.current;
  pagination.pageSize = pageInfo.pageSize;
  loadCurrentTabData();
}
const addAssetsShow = ref(false);
const activeTab = ref("角色");
const formData = ref<{ id: number; name: string; describe: string; remark: string }>({
  id: 0,
  name: "",
  describe: "",
  remark: "",
});

// 当前操作的资产数据（用于图片生成）
const currentAssetData = ref<{
  id?: number;
  name?: string;
  describe?: string;
  type?: string;
  filePath?: string;
}>({});

// 新增
function handleAdd(type: string) {
  activeTab.value = type;
  formData.value = {
    id: 0,
    name: "",
    describe: "",
    remark: "",
  };
  addAssetsShow.value = true;
}

// 编辑
function handleEdit(row: any) {
  formData.value = {
    ...row,
  };
  addAssetsShow.value = true;
}

// 删除
function handleDelete(row: any) {
  const dialog = DialogPlugin.confirm({
    header: "确认删除",
    body: "确定要删除这资产吗？此操作无法撤销。",
    confirmBtn: "删除",
    cancelBtn: "取消",
    theme: "warning",
    onConfirm: async () => {
      try {
        await axios.post("/assets/delAssets", { id: row.id });
        MessagePlugin.success("资产删除成功");
        getFilteredData(activeTab.value);
        dialog.destroy();
      } catch (error) {
        console.error("删除资产失败:", error);
        MessagePlugin.error("资产删除失败");
        dialog.destroy();
      }
    },
  });
}
// 生成
const generateImageShow = ref(false);
function generate(row: any) {
  // 设置当前资产数据
  currentAssetData.value = {
    id: row.id,
    name: row.name,
    describe: row.describe,
    type: activeTab.value, // 使用当前选中的类型
    filePath: row.filePath,
  };
  generateImageShow.value = true;
}
const batchGenerationShow = ref(false);
// 批量生成
function handleBatchGenerate() {
  batchGenerationShow.value = true;
}

// 批量删除
function handleBatchDelete() {
  const selectedAssets = tableData.value.filter((item: any) => selectedRowKeys.value.includes(item.id));
  if (selectedAssets.length === 0) {
    MessagePlugin.warning("请至少选择一个资产");
    return;
  }
  const dialog = DialogPlugin.confirm({
    header: "确认删除",
    body: "确定要批量删除这些资产吗？此操作无法撤销。",
    confirmBtn: "删除",
    cancelBtn: "取消",
    theme: "warning",
    onConfirm: async () => {
      await axios.post("/assets/batchDelete", { id: selectedAssets.map((asset) => asset.id) });
      MessagePlugin.success("资产删除成功");
      getFilteredData(activeTab.value);
      dialog.destroy();
    },
  });
}
</script>

<style lang="scss" scoped>
.projectAssets {
  .assetsContent {
    min-height: 500px;

    :deep(.t-tabs__nav-wrap) {
      padding: 0 16px;
      border-bottom: 1px solid var(--td-border-level-1-color);
    }

    .tabLabel {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 4px;
      transition: all 0.2s ease;

      &:hover {
        opacity: 0.8;
      }
    }

    .panelContent {
      margin-top: 20px;
      .toolbar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
        padding-bottom: 16px;
        border-bottom: 1px solid var(--td-border-level-1-color);
      }

      .previewCell {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 4px;

        .imageTrigger {
          position: relative;
          width: 80px;
          height: 80px;
          border-radius: 6px;
          overflow: hidden;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);

          &:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);

            .imageHoverOverlay {
              opacity: 1;
            }
          }

          .previewImage {
            width: 100%;
            height: 100%;
            object-fit: cover;
            display: block;
            transition: transform 0.3s ease;
          }

          &:hover .previewImage {
            transform: scale(1.1);
          }

          .noImage {
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            background: var(--td-bg-color-component);
            border: 2px dashed var(--td-border-level-2-color);
            color: var(--td-text-color-placeholder);
            cursor: not-allowed;
          }

          .imageHoverOverlay {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.6);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 4px;
            opacity: 0;
            transition: opacity 0.3s ease;
            color: #fff;

            .hoverText {
              font-size: 12px;
              font-weight: 500;
            }
          }
        }
      }

      .expandedContent {
        padding: 16px 24px;
        background: var(--td-bg-color-container);
        border-radius: 4px;
        margin: 8px 0;
      }

      :deep(.t-table) {
        .t-table__expanded-row {
          &:hover {
            background: transparent;
          }
        }
        border-radius: 6px;
        overflow: hidden;
        .t-table__header {
          background: var(--td-bg-color-container);
          th {
            text-align: center;
          }
        }
        .t-table__body {
          td {
            text-align: center;
            vertical-align: middle;
          }
        }

        .t-button--variant-text {
          padding: 4px 8px;

          &:hover {
            background: var(--td-bg-color-container-hover);
          }
        }
      }

      :deep(.t-input) {
        .t-input__prefix {
          color: var(--td-text-color-placeholder);
        }
      }
    }
  }

  // 图片查看器样式优化
  :deep(.t-image-viewer) {
    .t-image-viewer__modal {
      background: rgba(0, 0, 0, 0.9);
    }

    .t-image-viewer__modal-pic {
      img {
        max-height: 90vh;
        border-radius: 8px;
      }
    }

    .t-image-viewer__modal-icon {
      color: #fff;
      transition: all 0.2s ease;

      &:hover {
        transform: scale(1.1);
      }
    }
  }
}
</style>
