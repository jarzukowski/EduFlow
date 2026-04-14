<script setup lang="ts">
import { useRouter } from 'vue-router';

import FeaturedCoursesSection from '@/components/home/FeaturedCoursesSection.vue';
import HomeHero from '@/components/home/HomeHero.vue';
import PopularCategoriesSection from '@/components/home/PopularCategoriesSection.vue';

const router = useRouter();

const onCategorySelect = async (value: string): Promise<void> => {
  const trimmedValue = value.trim();

  await router.push({
    name: 'courses',
    query: trimmedValue ? { search: trimmedValue } : {},
  });
};
</script>

<template>
  <div class="container">
    <HomeHero />
    <FeaturedCoursesSection />
    <PopularCategoriesSection @category="onCategorySelect" />
  </div>
</template>
