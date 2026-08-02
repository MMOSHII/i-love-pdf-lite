<template>
    <div class="font-sans bg-gradient-to-br from-slate-50 to-gray-100 text-slate-800 py-12 px-6 antialiased min-h-screen selection:bg-indigo-100 selection:text-indigo-900">
        <div v-if="!activeTool" class="max-w-[900px] mx-auto">
            <header class="flex flex-col sm:flex-row sm:items-center justify-between gap-5 mb-10 pb-6 border-b border-slate-200/80">
                <div class="flex items-center gap-4">
                    <div class="w-12 h-12 rounded-2xl bg-gradient-to-tr from-slate-900 to-slate-700 text-white flex items-center justify-center shadow-md shadow-slate-900/20">
                        <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <rect x="3" y="3" width="7" height="7" rx="1.5"></rect>
                            <rect x="14" y="3" width="7" height="7" rx="1.5"></rect>
                            <rect x="14" y="14" width="7" height="7" rx="1.5"></rect>
                            <rect x="3" y="14" width="7" height="7" rx="1.5"></rect>
                        </svg>
                    </div>
                    <div>
                        <h1 class="text-2xl font-bold tracking-tight text-slate-900 m-0">Project Workspace</h1>
                        <p class="text-sm text-slate-500 m-0 mt-0.5">Select an application or tool to launch</p>
                    </div>
                </div>

                <div class="relative w-full sm:w-80">
                    <input 
                        type="text" 
                        v-model="searchQuery"
                        placeholder="Search tools..." 
                        class="w-full bg-white border border-slate-200 rounded-xl text-sm py-2.5 px-4 pl-10 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-sm"
                    >
                    <svg class="w-4 h-4 text-slate-400 absolute left-3.5 top-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="11" cy="11" r="8"></circle>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    </svg>
                </div>
            </header>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div v-if="filteredPages.length === 0" class="col-span-full py-16 flex flex-col items-center justify-center text-center bg-white rounded-2xl border border-dashed border-slate-300">
                    <svg class="w-10 h-10 text-slate-300 mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="11" cy="11" r="8"></circle>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    </svg>
                    <p class="text-slate-500 font-medium">No matching tools found.</p>
                    <p class="text-sm text-slate-400 mt-1">Try adjusting your search term.</p>
                </div>

                <!-- Page Cards -->
                <button 
                    v-for="page in filteredPages" 
                    :key="page.filename"
                    @click="openTool(page)"
                    class="text-left group bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-900/5 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between cursor-pointer"
                >
                    <div>
                        <div class="flex items-start justify-between mb-3 gap-2">
                            <h2 class="text-lg font-semibold text-slate-800 group-hover:text-indigo-900 transition-colors m-0 leading-tight">
                                {{ page.name }}
                            </h2>
                            <span class="text-[11px] bg-indigo-50 text-indigo-600 border border-indigo-100/50 py-1 px-2.5 rounded-full font-medium tracking-wide whitespace-nowrap">
                                {{ page.filename }}
                            </span>
                        </div>
                        <p class="text-sm text-slate-500 m-0 leading-relaxed line-clamp-2">
                            {{ page.description }}
                        </p>
                    </div>
                    <div class="mt-6 flex items-center text-sm font-semibold text-slate-700 group-hover:text-indigo-600 transition-colors">
                        Open tool 
                        <svg class="w-4 h-4 ml-1.5 transition-transform duration-300 group-hover:translate-x-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                            <polyline points="12 5 19 12 12 19"></polyline>
                        </svg>
                    </div>
                </button>
            </div>
        </div>

        <div v-else class="max-w-[1200px] mx-auto">
            <button 
                @click="closeTool" 
                class="mb-6 inline-flex items-center text-sm font-medium text-slate-500 hover:text-indigo-600 transition-colors bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm hover:shadow"
            >
                <svg class="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="19" y1="12" x2="5" y2="12"></line>
                    <polyline points="12 19 5 12 12 5"></polyline>
                </svg>
                Back to Workspace
            </button>

            <div class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden min-h-[500px]">
                <component :is="activeTool.component" />
            </div>
        </div>

    </div>
</template>

<script setup>
import { ref, computed } from 'vue';

const modules = import.meta.glob('./pages/*.vue', { eager: true });

const pages = Object.entries(modules).map(([filePath, module]) => {
    const filename = filePath.split('/').pop();
    const baseName = filename.replace('.vue', '');
    const formattedName = baseName.replace(/([A-Z])/g, ' $1').trim();

    return {
        name: formattedName || baseName,
        filename: filename,
        description: `Auto-detected Vue component tool for ${formattedName}`,
        component: module.default 
    };
});

const searchQuery = ref('');
const activeTool = ref(null);

const filteredPages = computed(() => {
    const query = searchQuery.value.toLowerCase();
    if (!query) return pages;
    
    return pages.filter(p => 
        p.name.toLowerCase().includes(query) || 
        p.filename.toLowerCase().includes(query)
    );
});

const openTool = (page) => {
    activeTool.value = page;
};

const closeTool = () => {
    activeTool.value = null;
};
</script>