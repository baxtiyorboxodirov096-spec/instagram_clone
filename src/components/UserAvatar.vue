<script setup>
import { computed } from 'vue'

const props = defineProps({
  user: { type: Object, default: null },
  size: { type: Number, default: 44 },
  online: { type: Boolean, default: false },
})

const initial = computed(() => (props.user?.username || '?').charAt(0).toUpperCase())
</script>

<template>
  <div class="avatar" :style="{ width: size + 'px', height: size + 'px' }">
    <img v-if="user?.avatar" :src="user.avatar" :alt="user.username" />
    <span v-else :style="{ fontSize: size * 0.42 + 'px' }">{{ initial }}</span>
    <i v-if="online" class="dot" />
  </div>
</template>

<style scoped>
.avatar {
  position: relative;
  flex-shrink: 0;
  border-radius: 50%;
  background: linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-weight: 600;
}
img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
}
.dot {
  position: absolute;
  right: 0;
  bottom: 0;
  width: 28%;
  height: 28%;
  min-width: 10px;
  min-height: 10px;
  background: #2ecc71;
  border: 2px solid var(--ig-bg);
  border-radius: 50%;
}
</style>
