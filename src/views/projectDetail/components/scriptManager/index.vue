<template>
  <div class="scriptManager">
    <div class="smHead jb ac">
      <div>
        <h2 class="smTitle">剧本管理</h2>
        <p class="smSub">管理和编辑剧本内容</p>
      </div>
    </div>
    <div class="scriptData">
      <div class="head jb ac">
        <div class="searchInput">
          <t-input placeholder="输入剧本名称搜索" v-model="searchQuery" @change="onChange">
            <template #suffixIcon>
              <i-search :size="16" class="icon" />
            </template>
          </t-input>
        </div>
        <div class="addBtn">
          <t-button theme="primary" @click="handleAddScript">
            <template #icon><i-plus :size="16" /></template>
            新建剧本
          </t-button>
        </div>
      </div>
      <div class="content">
        <div v-if="scripts.length === 0" class="noneScripts c">
          <t-empty />
        </div>
        <div v-else class="scriptsList f w">
          <div
            class="scriptItem"
            v-for="(item, index) in scripts"
            :key="index"
            @click="
              selectedScript = {
                ...item,
              };
              detailsShow = true;
            ">
            <t-card :title="item.title" :bordered="false" hover-shadow :style="{ width: '400px' }">
              <template #avatar>
                <t-image :src="image" fit="fill" :style="{ width: '60px', height: '60px', borderRadius: '20%' }" />
              </template>
              <span>{{ item.content }}</span>
            </t-card>
          </div>
        </div>
      </div>
    </div>
    <Details v-model="detailsShow" :item="selectedScript" />
    <AddScript v-model="addScriptShow" />
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import image from "@/assets/providers/script.png";
import Details from "./components/details.vue";
import AddScript from "./components/addScript.vue";

interface Script {
  id: number;
  title: string;
  content: string;
}
const selectedScript = ref<Script>({
  id: 0,
  title: "",
  content: "",
});
// 模拟剧本数据
const scripts = ref<Script[]>([
  {
    id: 1,
    title: "剧本1",
    content: "这是剧本1撒大大爱仕达爱仕达爱仕达爱仕达爱仕达爱仕达爱仕达爱仕达爱仕达的内容",
  },
  {
    id: 2,
    title: "剧本2",
    content: "这是剧本2的内容",
  },
  {
    id: 2,
    title: "剧本2",
    content: "这是剧本2的内容",
  },
  {
    id: 2,
    title: "剧本2",
    content: "这是剧本2的内容",
  },
  {
    id: 2,
    title: "剧本2",
    content: "这是剧本2的内容",
  },
]);
const searchQuery = ref("");
const detailsShow = ref(false);
const addScriptShow = ref(false);
//新增剧本
function handleAddScript() {
  addScriptShow.value = true;
}
// 搜索输入变化
function onChange() {
  searchScripts();
}
//搜索剧本
function searchScripts() {
  console.log("执行搜索，查询:", searchQuery.value);
}
</script>

<style lang="scss" scoped>
.scriptManager {
  .smHead {
    .smTitle {
      font-size: 22px;
      font-weight: 600;
      margin-bottom: 8px;
    }
    .smSub {
      color: #a19f9f;
      font-size: 15px;
    }
  }
  .scriptData {
    .searchInput {
      width: 500px;
    }
  }
  .content {
    margin-top: 20px;
    .noneScripts {
      width: 100%;
      height: 400px;
    }
    .scriptsList {
      gap: 20px;
      .scriptItem {
        cursor: pointer;
        span {
          display: -webkit-box;
          -webkit-box-orient: vertical;
          -webkit-line-clamp: 1;
          overflow: hidden;
        }
      }
    }
  }
}
</style>
