<template>
  <aside class="info-panel">
    <div class="panel-head">
      <span>{{ craftCategoryLabels[artifact.category] }}</span>
      <strong>{{ artifact.year }}</strong>
    </div>
    <h2>{{ artifact.name }}</h2>
    <p class="description">{{ artifact.description }}</p>
    <dl>
      <div>
        <dt>传承人</dt>
        <dd>{{ artifact.author }}</dd>
      </div>
      <div>
        <dt>材质</dt>
        <dd>{{ artifact.material }}</dd>
      </div>
      <div>
        <dt>尺寸</dt>
        <dd>{{ artifact.dimensions }}</dd>
      </div>
    </dl>
    <section v-if="annotations.length" class="annotation-list">
      <h3>模型标注</h3>
      <div
        v-for="annotation in annotations"
        :key="annotation.id"
        class="annotation-row"
        @click="$emit('annotation-click', annotation.id)"
      >
        <button type="button" class="annotation-main" @click="$emit('annotation-click', annotation.id)">
          <span>{{ annotation.title }}</span>
          <small>{{ annotation.content }}</small>
        </button>
        <AnnotationFeedback :annotation="annotation" />
      </div>
    </section>
  </aside>
</template>

<script setup lang="ts">
import AnnotationFeedback from '@/components/common/AnnotationFeedback.vue';
import type { Annotation, Artifact } from '@/types';
import { craftCategoryLabels } from '@/types';

withDefaults(
  defineProps<{
    artifact: Artifact;
    annotations?: Annotation[];
  }>(),
  {
    annotations: () => []
  }
);

defineEmits<{
  'annotation-click': [id: string];
}>();
</script>

<style scoped>
.info-panel {
  padding: clamp(18px, 3vw, 28px);
  background: #fbf5e8;
  border: 1px solid rgba(23, 63, 53, 0.16);
  border-radius: 8px;
}

.panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  color: var(--museum-brass);
  font-size: 13px;
  font-weight: 800;
}

h2 {
  margin: 10px 0;
  color: var(--museum-ink);
  font-family: var(--font-display);
  font-size: clamp(28px, 4vw, 44px);
  line-height: 1.05;
}

.description {
  margin: 0 0 20px;
  color: rgba(31, 46, 41, 0.76);
  line-height: 1.75;
}

dl {
  display: grid;
  gap: 10px;
  margin: 0;
}

dl div {
  display: grid;
  grid-template-columns: 76px 1fr;
  gap: 10px;
  padding-top: 10px;
  border-top: 1px solid rgba(23, 63, 53, 0.12);
}

dt {
  color: rgba(31, 46, 41, 0.55);
}

dd {
  margin: 0;
  color: var(--museum-ink);
  font-weight: 700;
}

.annotation-list {
  margin-top: 22px;
}

.annotation-list h3 {
  margin: 0 0 10px;
  font-size: 15px;
}

.annotation-row {
  display: grid;
  width: 100%;
  gap: 3px;
  margin-bottom: 8px;
  padding: 11px 12px;
  text-align: left;
  color: var(--museum-ink);
  background: #efe5d1;
  border: 1px solid transparent;
  border-radius: 6px;
}

.annotation-row:hover {
  border-color: rgba(157, 123, 54, 0.55);
}

.annotation-main {
  display: grid;
  gap: 3px;
  padding: 0;
  text-align: left;
  color: inherit;
  background: transparent;
  border: 0;
  cursor: pointer;
}

.annotation-main span {
  font-weight: 800;
}

.annotation-main small {
  color: rgba(31, 46, 41, 0.68);
  line-height: 1.45;
}
</style>
