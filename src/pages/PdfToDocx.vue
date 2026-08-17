<template>
    <div class="py-6 sm:py-10 px-4 sm:px-5 w-full">
        <div class="max-w-[1000px] mx-auto">
        
        <ToolHeader title="PDF to Word">
            <template #icon>
                <svg class="w-7 h-7 sm:w-8 sm:h-8 text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="16" y1="13" x2="8" y2="13"></line>
                    <line x1="16" y1="17" x2="8" y2="17"></line>
                    <polyline points="10 9 9 9 8 9"></polyline>
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
                @click="convertToWord"
                :disabled="isProcessing || files.length === 0"
            >
                Convert to Word
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
                            <button @click="removeFile(index)" class="bg-transparent text-slate-500 border-none p-1 sm:p-1.5 rounded cursor-pointer text-xs sm:text-sm transition-colors flex items-center justify-center hover:text-red-500 hover:bg-red-50" title="Remove">✕</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref } from 'vue';
import { Document, Packer, Paragraph, TextRun } from "docx";
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.mjs?url';
import Tesseract from 'tesseract.js';

import ToolHeader from '../components/ToolHeader.vue';
import { useSortable } from '../composables/useSortable';
import { formatBytes } from '../utils/helpers';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

const files = ref([]);
const isProcessing = ref(false);
const statusMessage = ref("");
const previewGrid = ref(null);

useSortable(previewGrid, files);

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
    statusMessage.value = "";
};

const convertToWord = async () => {
    if (files.value.length === 0) return;

    isProcessing.value = true;
    
    try {
        for (let i = 0; i < files.value.length; i++) {
            const item = files.value[i];
            statusMessage.value = `Reading ${item.file.name}...`;

            const buffer = await item.file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(buffer) }).promise;
            const paragraphs = [];

            for (let pageNo = 1; pageNo <= pdf.numPages; pageNo++) {
                statusMessage.value = `Extracting page ${pageNo} of ${pdf.numPages} from ${item.file.name}...`;
                const page = await pdf.getPage(pageNo);
                const content = await page.getTextContent();

                const lines = [];
                let current = [];
                let lastY = null;

                for (const textItem of content.items) {
                    if (!("str" in textItem)) continue;

                    const y = textItem.transform?.[5] ?? 0;
                    if (lastY !== null && Math.abs(y - lastY) > 3) {
                        if (current.length) lines.push(current.join(" ").trim());
                        current = [];
                    }

                    if (textItem.str) current.push(textItem.str);
                    lastY = y;
                }

                if (current.length) lines.push(current.join(" ").trim());

                if (lines.length === 0) {
                    statusMessage.value = `No text found on page ${pageNo}. Running OCR (this may take a moment)...`;
                    
                    const viewport = page.getViewport({ scale: 2.0 }); 
                    const canvas = document.createElement('canvas');
                    const context = canvas.getContext('2d');
                    
                    canvas.height = viewport.height;
                    canvas.width = viewport.width;
                    
                    await page.render({
                        canvasContext: context,
                        viewport: viewport
                    }).promise;

                    const { data: { text } } = await Tesseract.recognize(canvas, 'eng');
                    const ocrLines = text.split('\n').filter(line => line.trim() !== '');
                    lines.push(...ocrLines);
                }

                if (pageNo > 1) {
                    paragraphs.push(new Paragraph({ children: [new TextRun("")], pageBreakBefore: true }));
                }

                for (const line of lines.filter(Boolean)) {
                    paragraphs.push(new Paragraph(line));
                }
            }

            if (!paragraphs.length) {
                throw new Error(`No text could be extracted from ${item.file.name}, even with OCR.`);
            }

            statusMessage.value = `Creating Word document for ${item.file.name}...`;
            const doc = new Document({
                sections: [{ children: paragraphs }]
            });

            const blob = await Packer.toBlob(doc);
            const outputName = item.file.name.replace(/\.pdf$/i, "") + ".docx";

            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = outputName;
            a.click();
            URL.revokeObjectURL(url);
        }
        
        statusMessage.value = "Done! Your .docx files have been downloaded.";
    } catch (error) {
        console.error(error);
        statusMessage.value = `<span class='text-red-500'>Error: ${error.message || 'Conversion failed.'}</span>`;
    } finally {
        isProcessing.value = false;
    }
};
</script>