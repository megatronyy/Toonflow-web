<template>
  <div class="main">
    <div class="menu fc jb">
      <div class="logoBox c">
        <img class="logo" src="@/assets/logo.png" />
      </div>
      <div class="itemBox fc ac">
        <t-tooltip
          :content="menu.label"
          placement="right"
          theme="light"
          destroyOnClose
          :showArrow="false"
          v-for="(menu, index) in menuList"
          :key="index">
          <div class="item c" :class="{ active: activeMenu == menu.path }" @click="handleClick(menu.path)">
            <component :is="menu.icon" class="icon" />
            <span v-show="!collapsed">{{ menu.label }}</span>
          </div>
        </t-tooltip>
      </div>
      <div class="footItem fc ac">
        <t-tooltip
          :content="menu.label"
          placement="right"
          theme="light"
          destroyOnClose
          :showArrow="false"
          v-for="(menu, index) in footMenuList"
          :key="index">
          <div class="item c" :class="{ active: activeMenu == menu.path }" @click="handleClick(menu.path)">
            <component :is="menu.icon" class="icon" />
            <span v-show="!collapsed">{{ menu.label }}</span>
          </div>
        </t-tooltip>
      </div>
    </div>
    <div class="view">
      <router-view />
    </div>
  </div>
</template>

<script setup lang="ts">
const menuList = [
  { path: "/project", label: "我的项目", icon: "i-folder-close" },
  { path: "/taskList", label: "任务中心", icon: "i-view-list" },
];

const footMenuList = [{ path: "/setting", label: "设置", icon: "i-setting" }];

const router = useRouter();
const route = useRoute();
const activeMenu = ref(route.path);
const collapsed = ref(true);

function handleClick(value: string | number) {
  const path = String(value);
  router.push(path);
  activeMenu.value = path;
}
</script>

<style lang="scss" scoped>
.main {
  height: 100vh;
  width: 100vw;
  padding: 1rem;
  background-color: #ebebeb;
  display: flex;

  .menu {
    width: 64px;
    height: 100%;
    background-color: #fff;
    border-radius: 16px;
    padding-top: 1rem;
    padding-bottom: 1rem;
    .logoBox {
      width: 100%;
      height: fit-content;
      .logo {
        width: 60%;
        height: auto;
      }
    }
    .itemBox {
      flex: 1;
      margin-top: 1rem;
      margin-bottom: 1rem;
      padding-top: 1rem;
      padding-bottom: 1rem;
      width: 100%;
      height: 100%;
      .item {
        margin-bottom: 8px;
        cursor: pointer;
        width: 50px;
        height: 50px;
        .icon {
          font-size: 24px;
        }
        &:hover {
          background-color: #ecedef;
          border-radius: 16px;
        }
      }
      .active {
        background-color: #000 !important;
        color: #ebebeb;
        border-radius: 16px;
      }
    }
    .footItem {
      width: 100%;
      height: fit-content;
      .item {
        margin-top: 8px;
        cursor: pointer;
        width: 50px;
        height: 50px;
        .icon {
          font-size: 24px;
        }
        &:hover {
          background-color: #ecedef;
          border-radius: 16px;
        }
      }
      .active {
        background-color: #000 !important;
        color: #ebebeb;
        border-radius: 16px;
      }
    }
  }
  .view {
    flex: 1;
    margin-left: 1rem;
    background-color: #fff;
    border-radius: 16px;
     width: 100%;
    height: 100%;
    overflow-x: hidden;
    overflow-y: auto;
  }
}
</style>
