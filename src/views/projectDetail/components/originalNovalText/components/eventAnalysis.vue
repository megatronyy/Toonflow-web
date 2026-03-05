<template>
  <div class="">
    <div>
      <transition name="fadeInSection" appear>
        <section class="analyzeSection">
          <div class="sectionHeader">
            <div class="sectionHeaderLeft">
              <i-brain theme="outline" size="22" fill="var(--td-brand-color)" />
              <span class="sectionTitle">进度分析</span>
            </div>
            <span class="sectionPercent">{{ percentAi }}%</span>
          </div>
          <t-progress :percent="percentAi" :label="false" />
          <div class="sectionTip" v-if="percentAi != 100">正在分析章节内容...</div>
          <div class="sectionTip" v-else style="color: #52c41a">分析完成！</div>
        </section>
      </transition>
      <transition name="fadeInSection" appear>
        <section class="analyzeSection">
          <div class="sectionHeader">
            <i-brain theme="outline" size="22" fill="var(--td-brand-color)" />
            <span class="sectionTitle">章节分析进度</span>
          </div>
          <div class="chapterList">
            <div v-for="(item, index) in splitRanges" :key="index" class="chapterCard" :class="{ isProcessing: index == stepAi }">
              <div class="chapterInfo">
                <div class="chapterRange">第{{ item[0] }}章 - 第{{ item[1] }}章</div>
                <div v-if="index == stepAi" class="chapterStatus processing">
                  <i-dot theme="outline" size="14" fill="var(--td-brand-color)" />
                  分析中
                </div>
                <div v-else-if="index > stepAi" class="chapterStatus processing">等待中</div>
                <div v-else class="chapterStatus waiting">完成</div>
              </div>
            </div>
          </div>
        </section>
      </transition>

      <transition name="fadeInSection" appear>
        <section class="analyzeSection flex flex-col gap-3">
          <div class="sectionHeader">
            <i-brain theme="outline" size="22" fill="var(--td-brand-color)" />
            <span class="sectionTitle">已提取事件 ({{ totalEvents.length }})</span>
          </div>
          <div
            v-for="(item, index) in totalEvents"
            :key="index"
            class="f ac items-center"
            style="
              background: #fff;
              border-radius: 10px;
              box-shadow: 0 2px 10px 0 rgba(176, 170, 255, 0.07);
              gap: 12px;
              padding: 12px 11px 9px 11px;
              border: 1px solid #efeafd;
            ">
            <div class="collapseHeader flex-1 flex items-center">
              <span class="chapterOrder">{{ item.name }}</span>
              <span class="chapterKeypoint">{{ item.detail }}</span>
            </div>
          </div>
        </section>
      </transition>
    </div>

    <div style="margin-top: 16px; text-align: right">
      <t-button variant="outline" v-if="activeKey" @click="activeKey = 'To2'">上一步</t-button>
      <t-button v-if="analyStatus == 0" theme="primary" style="margin-left: 10px" @click="startAnalasy">开始分析</t-button>
      <template v-if="analyStatus == 2">
        <t-button theme="primary" style="margin-left: 10px" @click="startAnalasy">重新分析</t-button>
        <t-button theme="primary" style="margin-left: 10px" @click="">保存</t-button>
      </template>
      <t-button theme="primary" v-if="analyStatus == 1" disabled style="margin-left: 10px">正在分析中...</t-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";

interface EventData {
  name: string; //事件名称
  detail: string; //事件内容
}
const activeKey = defineModel({ default: null });
const analyStatus = ref(0);
//章节分割
const splitRanges = ref<number[][]>([]);
//总事件
const totalEvents = ref<EventData[]>([]);
//当前分析进度
const percentAi = ref(0);
//当前正在分析 索引
const stepAi = ref();

function startAnalasy() {
  analyStatus.value = 1;
  //执行方法
}
</script>

<style lang="scss" scoped>
.analyzeSection {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 16px 0 rgba(176, 170, 255, 0.1);
  border: 1px solid #f2f1fe;
  padding: 22px 22px 16px 22px;
  margin-bottom: 20px;
  display: flex;
  flex-direction: column;

  .sectionHeader {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 12px;

    .sectionHeaderLeft {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .sectionTitle {
      font-size: 1rem;
      font-weight: 600;
      color: #453a76;
    }

    .sectionPercent {
      font-weight: bold;
      font-size: 1.04rem;
      color: #9d80ff;
    }
  }

  .sectionTip {
    color: #a495e0;
    font-size: 0.93rem;
    margin-top: 3px;
  }
}

.chapterList {
  display: grid;
  gap: 13px;
}

.chapterList {
  grid-template-columns: repeat(auto-fill, minmax(145px, 1fr));
  margin-top: 7px;
}

.chapterCard {
  background: #fff;
  border-radius: 10px;
  min-height: 46px;
  border: 1px solid #ebeafd;
  padding: 10px 10px 9px 10px;
  transition: border-color 0.13s;

  &.isProcessing {
    border-color: #b0aaff;
    background: #faf9ff;
  }

  .chapterInfo {
    display: flex;
    flex-direction: column;
    gap: 2.5px;

    .chapterRange {
      font-weight: 600;
      color: #977eff;
      font-size: 1rem;
    }

    .chapterStatus {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 0.93rem;

      &.processing {
        color: #977eff;
        font-weight: 600;
      }

      &.waiting {
        color: #b8b7cd;
      }
    }
  }
}

.collapseHeader {
  display: flex;
  align-items: center;
  gap: 10px;

  .chapterOrder {
    color: #b0aaff;
    font-weight: 600;
  }
}

/* 淡入动画样式 */
.fadeInSection-enter-active {
  transition:
    opacity 0.45s cubic-bezier(0.32, 0.72, 0, 1),
    transform 0.45s cubic-bezier(0.32, 0.72, 0, 1);
}

.fadeInSection-enter-from {
  opacity: 0;
  transform: translateY(36px) scale(0.98);
}

.fadeInSection-enter-to {
  opacity: 1;
  transform: translateY(0) scale(1);
}
</style>
