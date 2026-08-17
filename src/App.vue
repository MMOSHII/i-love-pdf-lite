<template>
    <div class="py-6 sm:py-12 px-4 sm:px-6 min-h-screen relative">
        <Transition 
            :css="false" 
            mode="out-in" 
            @leave="onLeave" 
            @enter="onEnter"
        >
        <div v-if="!activeTool" key="hub" class="max-w-[900px] mx-auto">
            <header class="flex flex-col sm:flex-row sm:items-center justify-between gap-5 mb-8 sm:mb-10 pb-6 border-b border-slate-200/80">
                <div class="flex items-center gap-4">
                    <div class="w-12 h-12 shrink-0 rounded-2xl bg-gradient-to-tr from-slate-900 to-slate-700 text-white flex items-center justify-center shadow-md shadow-slate-900/20">
                        <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <rect x="3" y="3" width="7" height="7" rx="1.5"></rect>
                            <rect x="14" y="3" width="7" height="7" rx="1.5"></rect>
                            <rect x="14" y="14" width="7" height="7" rx="1.5"></rect>
                            <rect x="3" y="14" width="7" height="7" rx="1.5"></rect>
                        </svg>
                    </div>
                    <div>
                        <h1 class="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 m-0">Project Workspace</h1>
                        <p class="text-sm text-slate-500 m-0 mt-0.5">Select an application or tool to launch</p>
                    </div>
                </div>

                <div class="relative w-full sm:w-80">
                    <input 
                        type="text" 
                        v-model="searchQuery"
                        placeholder="Search tools..." 
                        class="w-full bg-white border border-slate-200 rounded-xl text-sm py-2.5 px-4 pl-10 outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 transition-all shadow-sm"
                    >
                    <svg class="w-4 h-4 text-slate-400 absolute left-3.5 top-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="11" cy="11" r="8"></circle>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    </svg>
                </div>
            </header>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                <div v-if="filteredPages.length === 0" class="col-span-full py-16 flex flex-col items-center justify-center text-center bg-white rounded-2xl border border-dashed border-slate-300">
                    <svg class="w-10 h-10 text-slate-300 mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    </svg>
                    <p class="text-slate-500 font-medium">No matching tools found.</p>
                    <p class="text-sm text-slate-400 mt-1">Try adjusting your search term.</p>
                </div>

                <button 
                    v-for="page in filteredPages" 
                    :key="page.filename"
                    @click="openTool(page)"
                    class="text-left group bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-200 hover:border-brand-300 hover:shadow-xl hover:shadow-brand-900/5 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between cursor-pointer"
                >
                    <div>
                        <div class="flex items-start justify-between mb-3 gap-2">
                            <h2 class="text-lg font-semibold text-slate-800 group-hover:text-brand-700 transition-colors m-0 leading-tight">
                                {{ page.name }}
                            </h2>
                        </div>
                        <p class="text-sm text-slate-500 m-0 leading-relaxed line-clamp-2">
                            {{ page.description }}
                        </p>
                    </div>
                    <div class="mt-6 flex items-center text-sm font-semibold text-slate-700 group-hover:text-brand-600 transition-colors">
                        Open tool 
                        <svg class="w-4 h-4 ml-1.5 transition-transform duration-300 group-hover:translate-x-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                            <polyline points="12 5 19 12 12 19"></polyline>
                        </svg>
                    </div>
                </button>
            </div>
        </div>

        <div v-else key="tool" class="max-w-[1200px] mx-auto w-full">
            <button 
                @click="closeTool" 
                class="mb-4 sm:mb-6 inline-flex items-center text-sm font-medium text-slate-500 hover:text-brand-600 transition-colors bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm hover:shadow cursor-pointer"
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
        </Transition>

        <div ref="transitionGrid" class="transition-grid"></div>
    </div>
</template>

<script setup>
import { ref, shallowRef, computed, onMounted, onUnmounted, markRaw, defineAsyncComponent } from 'vue';

const toolDescriptions = {
    'PdfToImage.vue': 'Convert PDF pages or extract embedded images into high-quality PNG or JPG files.',
    'ImageToPdf.vue': 'Upload, crop, resize, and combine multiple images into a single organized PDF document.',
    'MergeOrSplitPdf.vue': 'Easily combine and reorder multiple PDF files together into one continuous document.'
};

const modules = import.meta.glob('./pages/*.vue');

const pages = Object.entries(modules).map(([filePath, resolver]) => {
    const filename = filePath.split('/').pop();
    const baseName = filename.replace('.vue', '');
    const formattedName = baseName.replace(/([A-Z])/g, ' $1').trim();

    return {
        name: formattedName || baseName,
        filename: filename,
        description: toolDescriptions[filename] || `Launch the ${formattedName} tool.`,
        component: markRaw(defineAsyncComponent(resolver)) 
    };
});

const searchQuery = ref('');

const activeTool = shallowRef(null);

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

const transitionGrid = ref(null);
const blocks = ref([]);

const createGrid = () => {
    if (!transitionGrid.value) return;
    
    transitionGrid.value.innerHTML = '';
    blocks.value = [];

    const width = window.innerWidth;
    const height = window.innerHeight;
    const blockSize = 60;

    const columns = Math.ceil(width / blockSize);
    const rows = Math.ceil(height / blockSize) + 1;

    const offsetX = (width - columns * blockSize) / 2;
    const offsetY = (height - rows * blockSize) / 2;

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < columns; c++) {
            const block = document.createElement('div');
            block.classList.add('transition-block');
            block.style.width = `${blockSize}px`;
            block.style.height = `${blockSize}px`;
            block.style.left = `${c * blockSize + offsetX}px`;
            block.style.top = `${r * blockSize + offsetY}px`;
            
            transitionGrid.value.appendChild(block);
            blocks.value.push(block);
        }
    }
};

onMounted(() => {
    createGrid();
    window.addEventListener('resize', createGrid);
});

onUnmounted(() => {
    window.removeEventListener('resize', createGrid);
});

const onLeave = (el, done) => {
    const totalDuration = 400;
    const promises = blocks.value.map((block) => {
        const delay = Math.random() * (totalDuration * 0.8);
        return block.animate([
            { opacity: 0 },
            { opacity: 1 }
        ], {
            duration: 50,
            delay: delay,
            fill: 'forwards',
            easing: 'ease-in-out'
        }).finished;
    });
    Promise.all(promises).then(done);
};

const onEnter = (el, done) => {
    const totalDuration = 400;
    const promises = blocks.value.map((block) => {
        const delay = Math.random() * (totalDuration * 0.8);
        return block.animate([
            { opacity: 1 },
            { opacity: 0 }
        ], {
            duration: 50,
            delay: delay,
            fill: 'forwards',
            easing: 'ease-in-out'
        }).finished;
    });
    Promise.all(promises).then(done);
};
</script>
