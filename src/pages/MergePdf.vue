<template>
    <div class="py-6 sm:py-10 px-4 sm:px-5 w-full">
        <div class="max-w-[1000px] mx-auto">
        
        <header class="flex items-center gap-3 mb-6">
            <svg class="w-7 h-7 sm:w-8 sm:h-8 text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <path d="M9 15v-4"></path>
                <path d="M12 15v-4"></path>
                <path d="M15 15v-4"></path>
            </svg>
            <h1 class="text-xl sm:text-2xl font-semibold tracking-tight m-0">Merge PDF Files</h1>
        </header>

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

        <!-- PDF Preview Modal -->
        <div v-if="isPdfModalOpen" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex justify-center items-center z-[1000] p-4">
            <div class="bg-white w-full max-w-[1100px] h-full sm:h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
                <div class="p-3 sm:p-4 px-4 sm:px-6 border-b border-slate-200 flex flex-col sm:flex-row sm:justify-between items-start sm:items-center gap-3">
                    <h2 class="m-0 text-lg font-semibold text-slate-800 shrink-0">PDF Preview</h2>
                    
                    <div class="flex w-full sm:w-auto gap-2 sm:gap-3 items-center">
                        <input 
                            type="text" 
                            v-model="customFileName" 
                            placeholder="Custom file name..." 
                            class="flex-1 sm:w-auto bg-slate-50 border border-slate-200 py-2 sm:py-2.5 px-3 rounded-lg text-sm text-slate-900 focus:border-brand-500 outline-none"
                        >
                        <button @click="closePdf" class="bg-white text-slate-700 border border-slate-200 py-2 sm:py-2.5 px-4 rounded-lg text-sm font-medium cursor-pointer transition-colors hover:bg-slate-50">Close</button>
                        <button @click="downloadPdf" class="bg-brand-600 text-white py-2 sm:py-2.5 px-4 rounded-lg text-sm font-medium cursor-pointer transition-colors hover:bg-brand-700 border-none shadow-sm whitespace-nowrap">Download PDF</button>
                    </div>
                </div>
                <div class="flex-1 bg-slate-200 flex flex-col">
                    <iframe :src="pdfUrl" class="w-full h-full border-none"></iframe>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import Sortable from 'sortablejs';
import { PDFDocument } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

const files = ref([]);
const isProcessing = ref(false);
const statusMessage = ref("");
const previewGrid = ref(null);
const customFileName = ref("");

const isPdfModalOpen = ref(false);
const pdfUrl = ref("");
let currentPdfBlob = null;

const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

onMounted(() => {
    if (previewGrid.value) {
        new Sortable(previewGrid.value, {
            animation: 150,
            ghostClass: 'sortable-ghost',
            onEnd(evt) {
                const item = files.value.splice(evt.oldIndex, 1)[0];
                files.value.splice(evt.newIndex, 0, item);
            }
        });
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
    pdfUrl.value = "";
};

const downloadPdf = () => {
    if (!currentPdfBlob) return;
    const link = document.createElement("a");
    link.href = URL.createObjectURL(currentPdfBlob);
    
    const finalFilename = customFileName.value.trim() ? `${customFileName.value.trim()}.pdf` : "merged_document.pdf";
    link.download = finalFilename;
    
    link.click();
};
</script>
