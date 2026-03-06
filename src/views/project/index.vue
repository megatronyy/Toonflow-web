<template>
  <div class="project">
    <div class="header">
      <div class="fc">
        <span class="title">我的项目</span>
        <span class="sub">管理您的所有短剧项目</span>
      </div>
      <t-button class="addBtn" @click="addProjectShow = true">
        <i-plus class="addIcon" :size="20" />
        新建项目
      </t-button>
    </div>
    <div class="list">
      <t-row style="gap: 20px">
        <t-col :xs="12" :sm="6" :md="6" :lg="4" :xl="4" v-for="project in allProject" :key="project.id">
          <t-card hoverShadow class="card" @click="openProject(project.id)">
            <div class="title">
              {{ project.name }}
            </div>
            <t-tag shape="round">{{ project.type }}</t-tag>
            <div class="intro">
              {{ project.intro }}
            </div>
            <div class="bottomMenu f ac jb">
              <div class="time">
                <span>{{ dayjs(project?.createTime).format("YYYY-MM-DD HH:mm:ss") }}</span>
              </div>
              <div class="removeBtn" @click.stop="delProjcer(project.id)">
                <i-delete :size="18" />
              </div>
            </div>
          </t-card>
        </t-col>
      </t-row>
    </div>
  </div>
  <addProject v-model="addProjectShow" @add="addProjectFn" />
</template>

<script setup lang="ts">
import addProject from "./components/addProject.vue";
import dayjs from "dayjs";
import axios from "@/utils/axios";
import projectStore from "@/stores/project";
const { allProject, project } = storeToRefs(projectStore());

const addProjectShow = ref(false);

function getAllProject() {
  axios
    .post("/project/getProject")
    .then(({ data }) => {
      allProject.value = data;
    })
    .catch(() => {
      window.$message.error("获取项目列表失败");
    });
}

onMounted(() => {
  getAllProject();
});

const router = useRouter();

function openProject(projectId: string | undefined) {
  const item = allProject.value.find((p) => p.id === projectId);
  if (item) project.value = item;
  else return window.$message.error("未找到该项目!");
  router.push(`/projectDetail?id=${projectId}`);
}

function addProjectFn(data: { projectType: string; name: string; intro: string; type: string; artStyle: string; videoRatio: string }) {
  axios
    .post("/project/addProject", data)
    .then(() => {
      window.$message.success("新增项目成功");
      getAllProject();
    })
    .catch((e) => {
      window.$message.error(e.message ?? "新增项目失败");
    });
}

function delProjcer(projectId: string | undefined) {
  DialogPlugin.confirm({
    header: "删除项目",
    body: "确定要删除该项目吗？",
    confirmBtn: "删除",
    cancelBtn: "取消",
    onConfirm: () => {
      axios
        .post("/project/delProject", { id: projectId })
        .then(() => {
          window.$message.success("删除项目成功");
          getAllProject();
        })
        .catch((e) => {
          window.$message.error(e.message ?? "删除项目失败");
        });
    },
  });
}
</script>

<style lang="scss" scoped>
.project {
  .header {
    padding-top: 2rem;
    margin-bottom: 2rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    .title {
      font-size: 2rem;
      font-weight: 600;
    }
    .sub {
      opacity: 0.5;
    }
  }
  .list {
    .card {
      cursor: pointer;
      .title {
        font-size: 1.25rem;
        font-weight: bold;
        margin-bottom: 0.5rem;
      }
      .intro {
        margin-top: 8px;
        margin-bottom: 8px;
      }
      .bottomMenu {
        margin-top: 2rem;
        .time {
          opacity: 0.5;
        }
        .removeBtn {
          &:hover {
            color: red;
          }
        }
      }
    }
  }
}
</style>
