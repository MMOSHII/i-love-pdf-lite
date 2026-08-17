<template>
    <div class="py-6 sm:py-10 px-4 sm:px-5 w-full">
        <div class="max-w-[1000px] mx-auto">
        
        <ToolHeader title="Merge & Split PDF Files">
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
                :disabled="isProcessing || files.length === 0"
            >
                {{ files.length === 1 ? 'Preview / Save PDF' : 'Merge PDFs' }}
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
                        
                        <img 
                            v-if="item.coverUrl" 
                            :src="item.coverUrl" 
                            class="w-full h-full object-contain pointer-events-none transition-opacity duration-300"
                            alt="PDF Cover"
                        />
                        
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
                            <button @click.stop="openSplitModal(index)" class="bg-transparent text-slate-500 border-none p-1 sm:p-1.5 rounded cursor-pointer text-xs sm:text-sm transition-colors flex items-center justify-center hover:text-brand-600 hover:bg-brand-50" title="Extract Pages">
                                <svg class="w-3.5 h-3.5 sm:w-4 sm:h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M16 3h5v5"></path>
                                    <path d="M8 3H3v5"></path>
                                    <path d="M12 22v-8.3a4 4 0 0 0-1.172-2.872L3 3"></path>
                                    <path d="m15 9 6-6"></path>
                                </svg>
                            </button>
                            <button @click="removeFile(index)" class="bg-transparent text-slate-500 border-none p-1 sm:p-1.5 rounded cursor-pointer text-xs sm:text-sm transition-colors flex items-center justify-center hover:text-red-500 hover:bg-red-50" title="Remove">✕</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Extract Pages Modal -->
        <div v-if="isSplitModalOpen" class="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 transition-opacity">
            <div class="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col transform transition-all">
                <div class="p-5 border-b border-slate-100 flex justify-between items-center">
                    <h3 class="font-semibold text-slate-800 text-lg m-0">Extract Pages</h3>
                    <button @click="closeSplitModal" class="text-slate-400 hover:text-slate-600 transition-colors bg-transparent border-none cursor-pointer flex items-center justify-center p-1 rounded-md hover:bg-slate-100">
                        <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                    </button>
                </div>
                <div class="p-5 flex flex-col gap-4">
                    
                    <!-- Mode Toggle -->
                    <div class="flex p-1 bg-slate-100 rounded-lg">
                        <button @click="splitMode = 'range'" :class="splitMode === 'range' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'" class="flex-1 py-1.5 text-sm font-medium rounded-md transition-all border-none cursor-pointer">Custom Range</button>
                        <button @click="splitMode = 'sequence'" :class="splitMode === 'sequence' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'" class="flex-1 py-1.5 text-sm font-medium rounded-md transition-all border-none cursor-pointer">Fixed Sequence</button>
                    </div>

                    <!-- Custom Range UI -->
                    <div v-if="splitMode === 'range'">
                        <div class="bg-blue-50 text-blue-700 text-sm p-3 rounded-lg flex gap-3 items-start border border-blue-100 mb-4">
                            <svg class="w-5 h-5 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
                            <p class="m-0 leading-relaxed">
                                Enter the page numbers and/or ranges separated by commas (e.g., <strong>1-3, 5</strong>).<br>
                                <span class="block mt-1 font-medium text-blue-800">Total pages available: {{ splitTotalPages }}</span>
                            </p>
                        </div>
                        <label for="page-range" class="block text-sm font-medium text-slate-700 mb-1.5">Page Range</label>
                        <input 
                            id="page-range"
                            v-model="splitRangeInput" 
                            type="text" 
                            placeholder="e.g., 1-3, 5" 
                            class="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all text-slate-900 placeholder:text-slate-400"
                            @keyup.enter="confirmSplit"
                        />
                    </div>

                    <!-- Sequence UI -->
                    <div v-else>
                        <div class="bg-blue-50 text-blue-700 text-sm p-3 rounded-lg flex gap-3 items-start border border-blue-100 mb-4">
                            <svg class="w-5 h-5 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
                            <p class="m-0 leading-relaxed">
                                Automatically split the document into smaller files every <strong>N</strong> pages.<br>
                                <span class="block mt-1 font-medium text-blue-800">Total pages available: {{ splitTotalPages }}</span>
                            </p>
                        </div>
                        <label for="page-sequence" class="block text-sm font-medium text-slate-700 mb-1.5">Pages per file</label>
                        <input 
                            id="page-sequence"
                            v-model.number="splitSequenceCount" 
                            type="number" 
                            min="1"
                            :max="splitTotalPages"
                            class="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all text-slate-900"
                            @keyup.enter="confirmSplit"
                        />
                    </div>
                    
                </div>
                <div class="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
                    <button @click="closeSplitModal" class="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-50">Cancel</button>
                    <button @click="confirmSplit" class="px-4 py-2 text-sm font-medium text-white bg-brand-600 border border-transparent rounded-lg hover:bg-brand-700 transition-colors cursor-pointer disabled:opacity-50 shadow-sm disabled:cursor-not-allowed" :disabled="isProcessing || (splitMode === 'range' && !splitRangeInput.trim()) || (splitMode === 'sequence' && (!splitSequenceCount || splitSequenceCount < 1))">Extract Pages</button>
                </div>
            </div>
        </div>

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
import { ref, onUnmounted } from 'vue';
import { PDFDocument } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.mjs?url';

import ToolHeader from '../components/ToolHeader.vue';
import PdfPreviewModal from '../components/PdfPreviewModal.vue';
import { useSortable } from '../composables/useSortable.js';
import { formatBytes } from '../utils/helpers.js';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

const files = ref([]);
const isProcessing = ref(false);
const statusMessage = ref("");
const previewGrid = ref(null);
const customFileName = ref("");

const isPdfModalOpen = ref(false);
const pdfUrl = ref("");
let currentPdfBlob = null;

// New Reactive Variables for Split UI
const isSplitModalOpen = ref(false);
const fileToSplitIndex = ref(-1);
const splitRangeInput = ref("");
const splitTotalPages = ref(0);
let originalPdfDocCache = null;

// Add these two new variables
const splitMode = ref('range');
const splitSequenceCount = ref(1);

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

// UI Logic: Opens custom modal and checks file capacity
const openSplitModal = async (index) => {
    const item = files.value[index];
    isProcessing.value = true;
    
    try {
        const arrayBuffer = await item.file.arrayBuffer();
        originalPdfDocCache = await PDFDocument.load(arrayBuffer);
        const pageCount = originalPdfDocCache.getPageCount();

        if (pageCount <= 1) {
            statusMessage.value = `<span class='text-brand-600'>${item.file.name} is already a single page.</span>`;
            isProcessing.value = false;
            originalPdfDocCache = null;
            return;
        }

        splitTotalPages.value = pageCount;
        fileToSplitIndex.value = index;
        splitRangeInput.value = `1-${pageCount}`;
        isSplitModalOpen.value = true;
        
    } catch (error) {
        console.error(error);
        statusMessage.value = "<span class='text-red-500'>Error reading PDF for extraction.</span>";
    } finally {
        isProcessing.value = false;
    }
};

const closeSplitModal = () => {
    isSplitModalOpen.value = false;
    fileToSplitIndex.value = -1;
    splitRangeInput.value = "";
    splitMode.value = 'range';
    splitSequenceCount.value = 1;
    originalPdfDocCache = null;
};

// Processing Logic: Triggers when the user confirms the modal
const confirmSplit = async () => {
    if (fileToSplitIndex.value === -1 || !originalPdfDocCache) return;
    
    // Prevent execution if inputs are invalid based on mode
    if (splitMode.value === 'range' && !splitRangeInput.value.trim()) return;
    if (splitMode.value === 'sequence' && (!splitSequenceCount.value || splitSequenceCount.value < 1)) return;

    const index = fileToSplitIndex.value;
    const item = files.value[index];
    const rangeInput = splitRangeInput.value;
    const seqCount = parseInt(splitSequenceCount.value);
    const pageCount = splitTotalPages.value;
    const originalPdf = originalPdfDocCache;
    const currentMode = splitMode.value;

    closeSplitModal(); // Close modal immediately for better UX
    isProcessing.value = true;
    statusMessage.value = `Extracting pages from ${item.file.name}...`;

    try {
        const newFiles = []; // Array to hold all the newly created PDF items
        
        if (currentMode === 'range') {
            // --- CUSTOM RANGE LOGIC ---
            const parts = rangeInput.split(',');
            
            for (let part of parts) {
                part = part.trim();
                if (!part) continue;

                const pagesToExtract = new Set();
                
                if (part.includes('-')) {
                    const [start, end] = part.split('-').map(Number);
                    if (start > 0 && end >= start && start <= pageCount) {
                        for (let i = start; i <= Math.min(end, pageCount); i++) {
                            pagesToExtract.add(i - 1); 
                        }
                    }
                } else {
                    const page = Number(part);
                    if (page > 0 && page <= pageCount) {
                        pagesToExtract.add(page - 1);
                    }
                }

                const indices = Array.from(pagesToExtract).sort((a, b) => a - b);

                if (indices.length > 0) {
                    const newPdf = await PDFDocument.create();
                    const copiedPages = await newPdf.copyPages(originalPdf, indices);
                    copiedPages.forEach(page => newPdf.addPage(page));

                    const pdfBytes = await newPdf.save();
                    const blob = new Blob([pdfBytes], { type: "application/pdf" });
                    
                    const baseName = item.file.name.replace(/\.[^/.]+$/, "");
                    const newFileName = `${baseName}_pages_${part.replace(/[^a-zA-Z0-9-]/g, '_')}.pdf`;
                    const newFile = new File([blob], newFileName, { type: "application/pdf" });

                    newFiles.push({
                        id: Date.now() + Math.random(),
                        file: newFile,
                        coverUrl: null,
                        isGeneratingCover: true
                    });
                }
            }
        } else if (currentMode === 'sequence') {
            // --- FIXED SEQUENCE LOGIC ---
            for (let i = 0; i < pageCount; i += seqCount) {
                const indices = [];
                // Calculate chunks based on sequence number
                for (let j = i; j < Math.min(i + seqCount, pageCount); j++) {
                    indices.push(j);
                }

                if (indices.length > 0) {
                    const newPdf = await PDFDocument.create();
                    const copiedPages = await newPdf.copyPages(originalPdf, indices);
                    copiedPages.forEach(page => newPdf.addPage(page));

                    const pdfBytes = await newPdf.save();
                    const blob = new Blob([pdfBytes], { type: "application/pdf" });
                    
                    const baseName = item.file.name.replace(/\.[^/.]+$/, "");
                    const startPage = indices[0] + 1;
                    const endPage = indices[indices.length - 1] + 1;
                    const suffix = startPage === endPage ? startPage : `${startPage}-${endPage}`;
                    const newFileName = `${baseName}_part_${suffix}.pdf`;
                    const newFile = new File([blob], newFileName, { type: "application/pdf" });

                    newFiles.push({
                        id: Date.now() + Math.random() + i,
                        file: newFile,
                        coverUrl: null,
                        isGeneratingCover: true
                    });
                }
            }
        }

        if (newFiles.length === 0) {
            statusMessage.value = "<span class='text-red-500'>Invalid parameters provided. No changes made.</span>";
            isProcessing.value = false;
            return;
        }

        // Replace the original file in the grid with ALL the newly created items
        files.value.splice(index, 1, ...newFiles);

        // Generate thumbnails for all the new items
        newFiles.forEach(async (newFileObj) => {
            try {
                const generatedCover = await generatePdfCover(newFileObj.file);
                const reactiveItem = files.value.find(f => f.id === newFileObj.id);
                if (reactiveItem) {
                    reactiveItem.coverUrl = generatedCover;
                }
            } catch (error) {
                console.error(`Failed to generate cover for ${newFileObj.file.name}`, error);
            } finally {
                const reactiveItem = files.value.find(f => f.id === newFileObj.id);
                if (reactiveItem) {
                    reactiveItem.isGeneratingCover = false;
                }
            }
        });

        statusMessage.value = "";
    } catch (error) {
        console.error(error);
        statusMessage.value = "<span class='text-red-500'>Error extracting PDF pages.</span>";
    } finally {
        isProcessing.value = false;
        originalPdfDocCache = null; 
    }
};

const removeFile = (index) => {
    files.value.splice(index, 1);
};

const clearFiles = () => {
    files.value = [];
};

const mergePDFs = async () => {
    // Only block if there are NO files
    if (files.value.length === 0) return;

    statusMessage.value = files.value.length === 1 ? "Preparing PDF..." : "Merging PDFs...";
    isProcessing.value = true;
    
    if (pdfUrl.value) {
        URL.revokeObjectURL(pdfUrl.value);
    }
    
    try {
        if (files.value.length === 1) {
            // Shortcut for a single file: just pass the existing file directly to the modal
            currentPdfBlob = files.value[0].file;
            pdfUrl.value = URL.createObjectURL(currentPdfBlob);
        } else {
            // Standard merge logic for multiple files
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
        }
        
        isPdfModalOpen.value = true;
        statusMessage.value = "";
        
    } catch (error) {
        console.error(error);
        statusMessage.value = "<span class='text-red-500'>Error processing PDFs. Ensure all selected files are valid.</span>";
    } finally {
        isProcessing.value = false;
    }
};

const closePdf = () => {
    isPdfModalOpen.value = false;
};
</script>