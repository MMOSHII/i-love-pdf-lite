<template>
    <header class="flex items-center gap-3 mb-6">
        <slot name="icon"></slot>
        <h1 class="text-xl sm:text-2xl font-semibold tracking-tight m-0">{{ title }}</h1>
    </header>
</template>

<script setup>
defineProps({
    title: {
        type: String,
        required: true
    }
});
</script>