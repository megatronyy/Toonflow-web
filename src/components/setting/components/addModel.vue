<template>
  <div class="addModel">
    <t-dialog
      :visible.sync="addModelShow"
      :closable="false"
      header="添加模型"
      :maskClosable="false"
      wrapClassName="no-header-margin"
      dialogClass="custom-modal"
      @close-btn-click="handleCancel"
      @confirm="onConfirm"
      @cancel="handleCancel">
      <div class="data">
        <t-form :data="formData" :labelWidth="100" labelAlign="top">
          <t-form-item name="modelName">
            <t-select v-model="formData.modelName">
              <t-option v-for="(item, index) in modelData" :key="index" :value="item.modelName">
                <span class="modelName">{{ item.modelName }}</span>
                <span class="modelType" style="margin-left: 10px">{{ item.type }}</span>
              </t-option>
            </t-select>
          </t-form-item>
        </t-form>
      </div>
    </t-dialog>
  </div>
</template>

<script setup lang="ts">
const addModelShow = defineModel({
  type: Boolean,
  default: false,
});
const props = defineProps<{
  formData: {
    modelName: string;
  };
}>();
const modelData = ref([
  {
    modelName: "GPT-3.5",
    type: "文本模型",
  },
  {
    modelName: "GPT-4",
    type: "图片模型",
  },
  {
    modelName: "Claude",
    type: "视频模型",
  },
]);
function handleCancel() {
  addModelShow.value = false;
}
function onConfirm() {
  console.log("confirm", props.formData.modelName);
  addModelShow.value = false;
}
</script>

<style lang="scss" scoped></style>
