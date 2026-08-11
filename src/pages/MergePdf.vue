<template>
    <div class="py-6 sm:py-10 px-4 sm:px-5 w-full">
        <div class="max-w-[1000px] mx-auto">
        
        <!-- Extracted Tool Header -->
        <ToolHeader title="Merge PDF Files">
            <template #icon>
                <svg class="w-7 h-7 sm:w-8 sm:h-8 text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <path d="M9 15v-4"></path>
                    <path d="M12 15v-4"></path>
                    <path d="M15 15v-4"></path>
                </svg>
            </template>
        </ToolHeader>

        <div class="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-wrap gap-3 items-center mb-6">
            <div class="relative overflow-hidden block w-full sm:w-auto">
                <button 
                    class="w-full sm:w-auto bg-white text-slate-900 border border-slate-200 py-2.5 px-4 rounded-lg text-sm font-medium cursor-pointer transition-colors inline-flex justify-center items-center hover:bg-slate-50 disabled:opacity-60 disabled:cursor-not-allowed" 
                    :disabled="isProcessing"
                >
                    ＋ Add PDFs
                </button>
                <input 
                    type="file" 
                    multiple 
                    accept="application/pdf,.pdf" 
                    class="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    :disabled="isProcessing"
                    @change="handleFileUpload"
                >
            </div>

            <button 
                class="w-full sm:w-auto bg-white text-slate-900 border border-slate-200 py-2.5 px-4 rounded-lg text-sm font-medium cursor-pointer transition-colors inline-flex justify-center items-center hover:bg-slate-50 disabled:opacity-60 disabled:cursor-not-allowed" 
                @click="clearFiles"
                :disabled="isProcessing || files.length === 0"
            >
                Clear All
            </button>

            <button 
                class="sm:ml-auto w-full sm:w-auto bg-brand-600 text-white py-2.5 px-5 rounded-lg text-sm font-medium cursor-pointer transition-colors inline-flex justify-center items-center hover:bg-brand-700 disabled:opacity-60 disabled:cursor-not-allowed border-none shadow-sm" 
                @click="mergePDFs"
                :disabled="isProcessing || files.length < 2"
            >
                Merge PDFs
            </button>
        </div>

        <div v-if="statusMessage" class="mb-4 text-sm font-medium text-slate-500" v-html="statusMessage"></div>
            
            <!-- Grid container for useSortable -->
            <div ref="previewGrid" class="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] sm:grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4 sm:gap-5">
                <div 
                    v-for="(item, index) in files" 
                    :key="item.id" 
                    class="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden cursor-grab active:cursor-grabbing hover:-translate-y-0.5 hover:shadow-md transition-all flex flex-col"
                >
                    <div class="w-full aspect-square bg-slate-50 flex items-center justify-center border-b border-slate-200 overflow-hidden relative">
                        <span class="absolute top-2 left-2 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded backdrop-blur-sm pointer-events-none z-10">
                            {{ formatBytes(item.file.size) }}
                        </span>
                        
                        <!-- PDF Cover Image -->
                        <img 
                            v-if="item.coverUrl" 
                            :src="item.coverUrl" 
                            class="w-full h-full object-contain pointer-events-none transition-opacity duration-300"
                            alt="PDF Cover"
                        />
                        
                        <!-- Fallback / Loading State -->
                        <div v-else class="text-brand-600 font-bold text-3xl opacity-80 pointer-events-none flex flex-col items-center">
                            <svg v-if="item.isGeneratingCover" class="animate-spin h-8 w-8 text-brand-600 mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span v-else>PDF</span>
                        </div>
                    </div>
                    <div class="p-2 sm:p-3 flex justify-between items-center gap-1 sm:gap-2">
                        <p class="text-[11px] sm:text-[13px] text-slate-500 m-0 whitespace-nowrap overflow-hidden text-ellipsis flex-grow" :title="item.file.name">
                            {{ item.file.name }}
                        </p>
                        <div class="flex gap-0.5 sm:gap-1 shrink-0">
                            <button @click="removeFile(index)" class="bg-transparent text-slate-500 border-none p-1 sm:p-1.5 rounded cursor-pointer text-xs sm:text-sm transition-colors flex items-center justify-center hover:text-red-500 hover:bg-red-50" title="Remove">✕</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Extracted PDF Preview Modal Component -->
        <PdfPreviewModal 
            :show="isPdfModalOpen" 
            :pdfUrl="pdfUrl" 
            :pdfBlob="currentPdfBlob"
            v-model:fileName="customFileName"
            @close="closePdf"
        />
    </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { PDFDocument } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.mjs?url';

import ToolHeader from '../components/ToolHeader.vue';
import PdfPreviewModal from '../components/PdfPreviewModal.vue';
import { useSortable } from '../composables/useSortable';
import { formatBytes } from '../utils/helpers';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

const files = ref([]);
const isProcessing = ref(false);
const statusMessage = ref("");
const previewGrid = ref(null);
const customFileName = ref("");

const isPdfModalOpen = ref(false);
const pdfUrl = ref("");
let currentPdfBlob = null;

useSortable(previewGrid, files);

onUnmounted(() => {
    if (pdfUrl.value) {
        URL.revokeObjectURL(pdfUrl.value);
    }
});

const generatePdfCover = async (file) => {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    
    const page = await pdf.getPage(1);
    const viewport = page.getViewport({ scale: 1.0 });
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    
    await page.render({
        canvasContext: context,
        viewport: viewport
    }).promise;
    
    return canvas.toDataURL('image/jpeg', 0.8);
};

const handleFileUpload = (e) => {
    if (e.target.files.length === 0) return;
    
    if (!customFileName.value) {
        customFileName.value = "merged_document";
    }

    const pdfFiles = Array.from(e.target.files).filter(file => 
        file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")
    );

    pdfFiles.forEach(async (file) => {
        const id = Date.now() + Math.random();
        
        files.value.push({ 
            id: id, 
            file,
            coverUrl: null,
            isGeneratingCover: true
        });
        
        try {
            const generatedCover = await generatePdfCover(file);
            const reactiveItem = files.value.find(f => f.id === id);
            if (reactiveItem) {
                reactiveItem.coverUrl = generatedCover;
            }
        } catch (error) {
            console.error(`Failed to generate cover for ${file.name}`, error);
        } finally {
            const reactiveItem = files.value.find(f => f.id === id);
            if (reactiveItem) {
                reactiveItem.isGeneratingCover = false;
            }
        }
    });

    e.target.value = ""; 
};

const removeFile = (index) => {
    files.value.splice(index, 1);
};

const clearFiles = () => {
    files.value = [];
};

const mergePDFs = async () => {
    if (files.value.length < 2) return;

    statusMessage.value = "Merging PDFs...";
    isProcessing.value = true;
    
    if (pdfUrl.value) {
        URL.revokeObjectURL(pdfUrl.value);
    }
    
    try {
        const mergedPdf = await PDFDocument.create();

        for (let i = 0; i < files.value.length; i++) {
            const item = files.value[i];
            const arrayBuffer = await item.file.arrayBuffer();
            const pdf = await PDFDocument.load(arrayBuffer);

            const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
            copiedPages.forEach(page => {
                mergedPdf.addPage(page);
            });
        }

        const pdfBytes = await mergedPdf.save();
        currentPdfBlob = new Blob([pdfBytes], { type: "application/pdf" });
        pdfUrl.value = URL.createObjectURL(currentPdfBlob);
        
        isPdfModalOpen.value = true;
        statusMessage.value = "";
        
    } catch (error) {
        console.error(error);
        statusMessage.value = "<span class='text-red-500'>Error merging PDFs. Ensure all selected files are valid.</span>";
    } finally {
        isProcessing.value = false;
    }
};

const closePdf = () => {
    isPdfModalOpen.value = false;
};
</script>