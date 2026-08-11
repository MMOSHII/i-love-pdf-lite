<template>
    <div class="py-6 sm:py-10 px-4 sm:px-5 w-full">
        <div class="max-w-[1000px] mx-auto">
        
        <ToolHeader title="PDF to Image Converter">
            <template #icon>
                <svg class="w-7 h-7 sm:w-8 sm:h-8 text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <rect x="8" y="12" width="8" height="6" rx="1"></rect>
                    <path d="M10 12v6"></path>
                </svg>
            </template>
        </ToolHeader>

        <div class="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-wrap gap-3 items-center mb-6">
            
            <select v-model="processingMode" class="w-full sm:w-auto appearance-none bg-white border border-slate-200 rounded-lg text-sm text-slate-900 py-2.5 px-4 focus:border-brand-500 outline-none cursor-pointer">
                <option value="render">Convert Pages to Images</option>
                <option value="extract">Extract Embedded Images</option>
            </select>

            <div class="relative overflow-hidden block sm:inline-block w-full sm:w-auto">
                <button 
                    class="w-full sm:w-auto bg-white text-slate-900 border border-slate-200 py-2.5 px-4 rounded-lg text-sm font-medium cursor-pointer transition-colors inline-flex justify-center items-center hover:bg-slate-50 disabled:opacity-60 disabled:cursor-not-allowed" 
                    :disabled="isProcessing"
                >
                    ＋ Select PDF
                </button>
                <input 
                    type="file" 
                    accept="application/pdf" 
                    class="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    :disabled="isProcessing"
                    @change="handleFileUpload"
                >
            </div>
            
            <input 
                type="text" 
                v-model="customFileName" 
                placeholder="File name prefix..." 
                class="w-full sm:w-auto flex-1 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 py-2.5 px-3 focus:border-brand-500 outline-none"
                :disabled="isProcessing || generatedImages.length === 0"
            >

            <button 
                class="w-full sm:w-auto text-white py-2.5 px-5 rounded-lg text-sm font-medium cursor-pointer transition-colors inline-flex justify-center items-center hover:bg-slate-800 disabled:opacity-60 disabled:cursor-not-allowed border-none shadow-sm bg-slate-900" 
                @click="downloadAll('png')"
                :disabled="isProcessing || generatedImages.length === 0"
            >
                Download All (PNG)
            </button>
            <button 
                class="w-full sm:w-auto text-white py-2.5 px-5 rounded-lg text-sm font-medium cursor-pointer transition-colors inline-flex justify-center items-center hover:bg-slate-800 disabled:opacity-60 disabled:cursor-not-allowed border-none shadow-sm bg-slate-900" 
                @click="downloadAll('jpg')"
                :disabled="isProcessing || generatedImages.length === 0"
            >
                Download All (JPG)
            </button>
        </div>

        <div v-if="statusMessage" class="mb-4 text-sm font-medium text-slate-500" v-html="statusMessage"></div>
            <div class="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] sm:grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4 sm:gap-5">
                <div 
                    v-for="item in generatedImages" 
                    :key="item.id" 
                    class="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden hover:-translate-y-0.5 hover:shadow-md transition-all flex flex-col"
                >
                    <div class="w-full aspect-[1/1.2] bg-slate-50 flex items-center justify-center border-b border-slate-200 overflow-hidden relative p-2">
                        <img 
                            :src="item.previewUrl" 
                            :alt="item.label" 
                            class="max-w-full max-h-full object-contain pointer-events-none transition-transform duration-300 ease-in-out border border-slate-200 shadow-sm" 
                        >
                    </div>
                    
                    <div class="p-2 sm:p-3 flex justify-between items-center gap-1 sm:gap-2">
                        <p class="text-[11px] sm:text-[13px] font-medium text-slate-700 m-0 whitespace-nowrap overflow-hidden text-ellipsis flex-grow" :title="item.label">
                            {{ item.label }}
                        </p>
                        <div class="flex gap-0.5 sm:gap-1 shrink-0">
                            <button @click="downloadImage(item, 'png')" class="bg-transparent font-semibold text-slate-500 border-none p-1 sm:p-1.5 rounded cursor-pointer text-xs transition-colors flex items-center justify-center hover:bg-slate-100 hover:text-slate-900" title="Download PNG">PNG</button>
                            <button @click="downloadImage(item, 'jpg')" class="bg-transparent font-semibold text-slate-500 border-none p-1 sm:p-1.5 rounded cursor-pointer text-xs transition-colors flex items-center justify-center hover:bg-slate-100 hover:text-slate-900" title="Download JPG">JPG</button>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';
import ToolHeader from '../components/ToolHeader.vue';

onMounted(() => {
    pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;
});

const generatedImages = ref([]);
const isProcessing = ref(false);
const statusMessage = ref("");
const processingMode = ref('render');
const customFileName = ref('');

const canvasToBlobUrl = (canvas, type, quality) => {
    return new Promise((resolve) => {
        canvas.toBlob((blob) => {
            resolve(URL.createObjectURL(blob));
        }, type, quality);
    });
};

const cleanupUrls = () => {
    generatedImages.value.forEach(item => {
        if (item.pngUrl) URL.revokeObjectURL(item.pngUrl);
        if (item.jpgUrl) URL.revokeObjectURL(item.jpgUrl);
    });
};

onUnmounted(() => {
    cleanupUrls();
});

const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    customFileName.value = file.name.replace(/\.[^/.]+$/, "");

    cleanupUrls();
    generatedImages.value = [];
    isProcessing.value = true;
    statusMessage.value = "Reading PDF document...";

    try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

        if (processingMode.value === 'render') {
            statusMessage.value = `Converting ${pdf.numPages} pages (this may take a moment)...`;
            
            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const viewport = page.getViewport({ scale: 2 });

                const canvas = document.createElement("canvas");
                const ctx = canvas.getContext("2d");

                canvas.width = viewport.width;
                canvas.height = viewport.height;

                await page.render({
                    canvasContext: ctx,
                    viewport: viewport
                }).promise;

                const pngUrl = await canvasToBlobUrl(canvas, "image/png");

                const jpgCanvas = document.createElement("canvas");
                jpgCanvas.width = canvas.width;
                jpgCanvas.height = canvas.height;
                const jpgCtx = jpgCanvas.getContext("2d");
                jpgCtx.fillStyle = "white";
                jpgCtx.fillRect(0, 0, jpgCanvas.width, jpgCanvas.height);
                jpgCtx.drawImage(canvas, 0, 0);
                
                const jpgUrl = await canvasToBlobUrl(jpgCanvas, "image/jpeg", 0.95);

                generatedImages.value.push({
                    id: `page-${i}`,
                    label: `Page ${i}`,
                    filename: `page-${i}`,
                    previewUrl: pngUrl,
                    pngUrl,
                    jpgUrl
                });
            }
            statusMessage.value = "";

        } else {
            statusMessage.value = `Scanning ${pdf.numPages} pages for embedded images...`;
            let imageCounter = 1;

            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const ops = await page.getOperatorList();

                for (let j = 0; j < ops.fnArray.length; j++) {
                    if (
                        ops.fnArray[j] === pdfjsLib.OPS.paintImageXObject || 
                        ops.fnArray[j] === pdfjsLib.OPS.paintJpegXObject
                    ) {
                        const objId = ops.argsArray[j][0];
                        
                        try {
                            const img = await new Promise((resolve, reject) => {
                                try {
                                    const result = page.objs.get(objId, (resolvedObj) => {
                                        resolve(resolvedObj);
                                    });
                                    if (result !== null && result !== undefined) {
                                        resolve(result);
                                    }
                                } catch (error) {
                                    reject(error);
                                }
                            });

                            if (!img) continue;

                            const canvas = document.createElement("canvas");
                            canvas.width = img.width;
                            canvas.height = img.height;
                            const ctx = canvas.getContext("2d");

                            if (img.bitmap) {
                                ctx.drawImage(img.bitmap, 0, 0);
                            } else {
                                console.warn(`Skipping unsupported image format on page ${i}`);
                                continue;
                            }

                            const pngUrl = await canvasToBlobUrl(canvas, "image/png");
                            
                            const jpgCanvas = document.createElement("canvas");
                            jpgCanvas.width = canvas.width;
                            jpgCanvas.height = canvas.height;
                            const jpgCtx = jpgCanvas.getContext("2d");
                            jpgCtx.fillStyle = "white";
                            jpgCtx.fillRect(0, 0, jpgCanvas.width, jpgCanvas.height);
                            jpgCtx.drawImage(canvas, 0, 0);
                            
                            const jpgUrl = await canvasToBlobUrl(jpgCanvas, "image/jpeg", 0.95);

                            generatedImages.value.push({
                                id: `extracted-${imageCounter}`,
                                label: `Img ${imageCounter} (Pg ${i})`,
                                filename: `extracted-img-${imageCounter}-page-${i}`,
                                previewUrl: pngUrl,
                                pngUrl,
                                jpgUrl
                            });
                            imageCounter++;
                        } catch (err) {
                            console.warn(`Could not extract image ${objId}:`, err);
                        }
                    }
                }
            }
            
            if (generatedImages.value.length === 0) {
                statusMessage.value = "No embedded images found in this PDF.";
            } else {
                statusMessage.value = "";
            }
        }
    } catch (error) {
        console.error("PDF Processing Error:", error);
        statusMessage.value = "<span class='text-red-500'>Error processing PDF. Please ensure it is a valid file.</span>";
    } finally {
        isProcessing.value = false;
        e.target.value = ""; 
    }
};

const downloadImage = (item, format) => {
    const prefix = customFileName.value.trim() ? `${customFileName.value.trim()}-` : '';
    const finalFilename = `${prefix}${item.filename}.${format}`;

    const a = document.createElement("a");
    a.href = format === 'png' ? item.pngUrl : item.jpgUrl; 
    a.download = finalFilename;
    a.click();
};

const downloadAll = (format) => {
    generatedImages.value.forEach((item, index) => {
        setTimeout(() => {
            downloadImage(item, format);
        }, index * 200); 
    });
};
</script>
