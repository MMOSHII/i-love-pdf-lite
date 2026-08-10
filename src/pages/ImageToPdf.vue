<template>
    <div class="py-6 sm:py-10 px-4 sm:px-5 w-full">
        <div class="max-w-[1000px] mx-auto">
        
        <header class="flex items-center gap-3 mb-6">
            <svg class="w-7 h-7 sm:w-8 sm:h-8 text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <circle cx="10" cy="13" r="2"></circle>
                <path d="m20 17-1.89-1.89a1.5 1.5 0 0 0-2.12 0L14 17"></path>
            </svg>
            <h1 class="text-xl sm:text-2xl font-semibold tracking-tight m-0">Image to PDF Converter</h1>
        </header>

        <div class="bg-white p-4 rounded-xl shadow-sm border border-slate-200 grid grid-cols-2 sm:flex sm:flex-wrap gap-3 items-center mb-6">
            <div class="col-span-2 sm:col-span-1 flex gap-2 w-full sm:w-auto">
                <button 
                    @click="undo" 
                    :disabled="!canUndo || isProcessing"
                    class="flex-1 sm:w-auto bg-white text-slate-700 border border-slate-200 py-2.5 px-3 rounded-lg cursor-pointer transition-colors inline-flex justify-center items-center hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                    title="Undo"
                >
                    <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7v6h6"></path><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"></path></svg>
                </button>
                <button 
                    @click="redo" 
                    :disabled="!canRedo || isProcessing"
                    class="flex-1 sm:w-auto bg-white text-slate-700 border border-slate-200 py-2.5 px-3 rounded-lg cursor-pointer transition-colors inline-flex justify-center items-center hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                    title="Redo"
                >
                    <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 7v6h-6"></path><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7"></path></svg>
                </button>
            </div>

            <div class="col-span-1 relative overflow-hidden block sm:inline-block w-full sm:w-auto">
                <button 
                    class="w-full sm:w-auto bg-white text-slate-900 border border-slate-200 py-2.5 px-4 rounded-lg text-sm font-medium cursor-pointer transition-colors inline-flex justify-center items-center hover:bg-slate-50 disabled:opacity-60 disabled:cursor-not-allowed" 
                    :disabled="isProcessing"
                >
                    ＋ Add
                </button>
                <input 
                    type="file" 
                    multiple 
                    accept="image/*,.heic,.heif" 
                    class="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    :disabled="isProcessing"
                    @change="handleFileUpload"
                >
            </div>

            <button 
                class="col-span-1 w-full sm:w-auto bg-white text-slate-900 border border-slate-200 py-2.5 px-4 rounded-lg text-sm font-medium cursor-pointer transition-colors inline-flex justify-center items-center hover:bg-slate-50 disabled:opacity-60 disabled:cursor-not-allowed" 
                @click="openResize(-1)"
                :disabled="isProcessing || images.length === 0"
            >
                ⤢ Resize All
            </button>

            <select v-model="settings.pageSize" class="w-full sm:w-auto custom-select appearance-none bg-white border border-slate-200 rounded-lg text-[13px] text-slate-900 py-2.5 pl-3 pr-8 focus:border-brand-500 outline-none cursor-pointer">
                <option value="A3">A3</option>
                <option value="A4">A4</option>
                <option value="A5">A5</option>
                <option value="LETTER">Letter</option>
                <option value="LEGAL">Legal</option>
                <option value="ORIGINAL">Original Size</option>
            </select>

            <select v-model="settings.orientation" class="w-full sm:w-auto custom-select appearance-none bg-white border border-slate-200 rounded-lg text-[13px] text-slate-900 py-2.5 pl-3 pr-8 focus:border-brand-500 outline-none cursor-pointer">
                <option value="portrait">Portrait</option>
                <option value="landscape">Landscape</option>
            </select>

            <select v-model="settings.margin" class="w-full sm:w-auto custom-select appearance-none bg-white border border-slate-200 rounded-lg text-[13px] text-slate-900 py-2.5 pl-3 pr-8 focus:border-brand-500 outline-none cursor-pointer">
                <option value="0">No Margin</option>
                <option value="20">Small Margin</option>
                <option value="40">Large Margin</option>
            </select>

            <select v-model="settings.fit" class="w-full sm:w-auto custom-select appearance-none bg-white border border-slate-200 rounded-lg text-[13px] text-slate-900 py-2.5 pl-3 pr-8 focus:border-brand-500 outline-none cursor-pointer">
                <option value="contain">Fit (Contain)</option>
                <option value="cover">Fill (Cover)</option>
            </select>

            <button 
                class="col-span-2 sm:ml-auto w-full sm:w-auto bg-brand-600 text-white py-2.5 px-5 rounded-lg text-sm font-medium cursor-pointer transition-colors inline-flex justify-center items-center hover:bg-brand-700 disabled:opacity-60 disabled:cursor-not-allowed border-none shadow-sm" 
                @click="generatePDF"
                :disabled="isProcessing || images.length === 0"
            >
                Preview PDF
            </button>
        </div>

        <div v-if="statusMessage" class="mb-4 text-sm font-medium text-slate-500" v-html="statusMessage"></div>
            <div ref="previewGrid" class="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] sm:grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4 sm:gap-5">
                <div 
                    v-for="(img, index) in images" 
                    :key="img.url" 
                    class="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden cursor-grab active:cursor-grabbing hover:-translate-y-0.5 hover:shadow-md transition-all flex flex-col"
                >
                    <div class="w-full aspect-square bg-slate-50 flex items-center justify-center border-b border-slate-200 overflow-hidden relative">
                        <span class="absolute top-2 left-2 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded backdrop-blur-sm pointer-events-none">
                            {{ formatBytes(img.file.size) }}
                        </span>
                        
                        <img 
                            :src="img.url" 
                            alt="Preview" 
                            class="w-full h-full object-contain pointer-events-none transition-transform duration-300 ease-in-out" 
                            :style="{ transform: `rotate(${img.rotation}deg)` }"
                        >
                    </div>
                    <div class="p-2 sm:p-3 flex justify-between items-center gap-1 sm:gap-2">
                        <p class="text-[11px] sm:text-[13px] text-slate-500 m-0 whitespace-nowrap overflow-hidden text-ellipsis flex-grow" :title="img.file.name">
                            {{ img.file.name }}
                        </p>
                        <div class="flex gap-0.5 sm:gap-1 shrink-0">
                            <button @click="openResize(index)" class="bg-transparent text-slate-500 border-none p-1 sm:p-1.5 rounded cursor-pointer text-xs sm:text-sm transition-colors flex items-center justify-center hover:bg-slate-100 hover:text-slate-900" title="Resize">⤢</button>
                            <button @click="openCrop(index)" class="bg-transparent text-slate-500 border-none p-1 sm:p-1.5 rounded cursor-pointer text-xs sm:text-sm transition-colors flex items-center justify-center hover:bg-slate-100 hover:text-slate-900" title="Crop">✂</button>
                            <button @click="rotateImage(index)" class="bg-transparent text-slate-500 border-none p-1 sm:p-1.5 rounded cursor-pointer text-xs sm:text-sm transition-colors flex items-center justify-center hover:bg-slate-100 hover:text-slate-900" title="Rotate 90°">⟳</button>
                            <button @click="removeImage(index)" class="bg-transparent text-slate-500 border-none p-1 sm:p-1.5 rounded cursor-pointer text-xs sm:text-sm transition-colors flex items-center justify-center hover:text-red-500 hover:bg-red-50" title="Remove">✕</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Resize Modal -->
        <div v-if="isResizeModalOpen" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex justify-center items-center z-[1000] p-4">
            <div class="bg-white w-full max-w-[400px] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
                <div class="p-4 sm:p-5 border-b border-slate-200">
                    <h2 class="m-0 text-lg font-semibold text-slate-800">
                        {{ resizeTargetIndex === -1 ? 'Resize All Images' : 'Resize Image' }}
                    </h2>
                    <p class="text-sm text-slate-500 mt-1 mb-0">Scale down the image dimensions to reduce PDF file size.</p>
                </div>
                <div class="p-5 flex flex-col gap-4">
                    <div>
                        <label class="block text-sm font-medium text-slate-700 mb-2">Scale Percentage: {{ resizeSettings.percentage }}%</label>
                        <input 
                            type="range" 
                            v-model="resizeSettings.percentage" 
                            min="10" 
                            max="100" 
                            step="10"
                            class="w-full accent-brand-600 cursor-pointer"
                        >
                        <div class="flex justify-between text-xs text-slate-400 mt-1">
                            <span>Smallest</span>
                            <span>Original</span>
                        </div>
                    </div>
                </div>
                <div class="p-4 border-t border-slate-200 flex justify-end gap-3 bg-slate-50">
                    <button @click="isResizeModalOpen = false" class="bg-white text-slate-700 border border-slate-200 py-2 px-4 rounded-lg text-sm font-medium cursor-pointer transition-colors hover:bg-slate-100">Cancel</button>
                    <button @click="applyResize" class="bg-brand-600 text-white py-2 px-4 rounded-lg text-sm font-medium cursor-pointer transition-colors hover:bg-brand-700 border-none shadow-sm">Apply Resize</button>
                </div>
            </div>
        </div>

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

        <!-- Crop Modal -->
        <div v-show="isCropModalOpen" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex justify-center items-center z-[1000] p-4">
            <div class="bg-white w-full max-w-[800px] h-[90vh] sm:h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
                <div class="p-3 sm:p-4 px-4 sm:px-6 border-b border-slate-200 flex flex-col sm:flex-row sm:justify-between items-start sm:items-center gap-3">
                    <h2 class="m-0 text-lg font-semibold text-slate-800">Crop Image</h2>
                    <div class="flex w-full sm:w-auto gap-2 sm:gap-3">
                        <button @click="cancelCrop" class="flex-1 sm:flex-none bg-white text-slate-700 border border-slate-200 py-2 sm:py-2.5 px-4 rounded-lg text-sm font-medium cursor-pointer transition-colors inline-flex justify-center items-center hover:bg-slate-50">Cancel</button>
                        <button @click="applyCrop" class="flex-1 sm:flex-none bg-brand-600 text-white py-2 sm:py-2.5 px-4 rounded-lg text-sm font-medium cursor-pointer transition-colors inline-flex justify-center items-center hover:bg-brand-700 border-none shadow-sm">Apply Crop</button>
                    </div>
                </div>
                <div class="flex-1 bg-slate-900 flex flex-col items-center justify-center p-2 sm:p-6">
                    <div class="max-w-full max-h-full">
                        <img ref="cropImageElement" :src="cropImageSrc" class="block max-w-full">
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, reactive, onMounted, nextTick, computed } from 'vue';
import Sortable from 'sortablejs';
import heic2any from 'heic2any';
import Cropper from 'cropperjs';
import { PDFDocument } from 'pdf-lib';
import 'cropperjs/dist/cropper.css';

const images = ref([]);
const isProcessing = ref(false);
const statusMessage = ref("");
const previewGrid = ref(null);
const customFileName = ref("");

const settings = reactive({
    pageSize: 'A4',
    orientation: 'portrait',
    margin: '0',
    fit: 'contain'
});

const history = ref([]);
const historyIndex = ref(-1);

const saveState = () => {
    if (historyIndex.value < history.value.length - 1) {
        history.value = history.value.slice(0, historyIndex.value + 1);
    }
    
    const snapshot = images.value.map(img => ({
        file: img.file,
        url: img.url,
        rotation: img.rotation
    }));

    history.value.push(snapshot);
    
    if (history.value.length > 15) {
        history.value.shift();
    } else {
        historyIndex.value++;
    }
};

const canUndo = computed(() => historyIndex.value > 0);
const canRedo = computed(() => historyIndex.value < history.value.length - 1);

const undo = () => {
    if (canUndo.value) {
        historyIndex.value--;
        images.value = [...history.value[historyIndex.value]];
    }
};

const redo = () => {
    if (canRedo.value) {
        historyIndex.value++;
        images.value = [...history.value[historyIndex.value]];
    }
};

const isResizeModalOpen = ref(false);
const resizeTargetIndex = ref(-1);
const resizeSettings = reactive({ percentage: 50 });

const isPdfModalOpen = ref(false);
const pdfUrl = ref("");
let currentPdfBlob = null;

const isCropModalOpen = ref(false);
const cropImageSrc = ref("");
const cropImageElement = ref(null);
let cropperInstance = null;
let currentCropIndex = -1;

const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

onMounted(() => {
    saveState();

    if (previewGrid.value) {
        new Sortable(previewGrid.value, {
            animation: 150,
            ghostClass: 'sortable-ghost',
            onEnd(evt) {
                const item = images.value.splice(evt.oldIndex, 1)[0];
                images.value.splice(evt.newIndex, 0, item);
                saveState();
            }
        });
    }
});

const handleFileUpload = async (e) => {
    if (e.target.files.length === 0) return;
    
    if (!customFileName.value) {
        customFileName.value = e.target.files[0].name.replace(/\.[^/.]+$/, "");
    }
    
    statusMessage.value = "Processing images (this may take a moment)...";
    isProcessing.value = true;

    for (const file of e.target.files) {
        let processedFile = file;
        const fileNameLower = file.name.toLowerCase();

        if (fileNameLower.endsWith('.heic') || fileNameLower.endsWith('.heif')) {
            try {
                const convertedBlob = await heic2any({
                    blob: file,
                    toType: "image/jpeg",
                    quality: 0.9
                });
                
                const finalBlob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
                processedFile = new File([finalBlob], file.name.replace(/\.[^/.]+$/, ".jpg"), { type: "image/jpeg" });
            } catch (err) {
                console.error("HEIC conversion error:", err);
                alert(`Could not process ${file.name}.`);
                continue; 
            }
        }

        const url = URL.createObjectURL(processedFile);
        images.value.push({ file: processedFile, url, rotation: 0 });
    }

    statusMessage.value = "";
    isProcessing.value = false;
    e.target.value = ""; 
    saveState();
};

const rotateImage = (index) => {
    images.value[index].rotation = (images.value[index].rotation + 90) % 360;
    saveState();
};

const removeImage = (index) => {
    images.value.splice(index, 1);
    saveState();
};

// --- Resize Logic ---
const openResize = (index) => {
    resizeTargetIndex.value = index;
    resizeSettings.percentage = 50; 
    isResizeModalOpen.value = true;
};

const applyResize = async () => {
    if (resizeSettings.percentage === 100) {
        isResizeModalOpen.value = false;
        return;
    }

    isProcessing.value = true;
    statusMessage.value = "Resizing images...";
    isResizeModalOpen.value = false;

    const scale = resizeSettings.percentage / 100;
    
    const targetIndices = resizeTargetIndex.value === -1 
        ? images.value.map((_, i) => i) 
        : [resizeTargetIndex.value];

    for (const index of targetIndices) {
        const item = images.value[index];
        
        await new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement("canvas");
                canvas.width = img.width * scale;
                canvas.height = img.height * scale;
                
                const ctx = canvas.getContext("2d");
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                
                canvas.toBlob((blob) => {
                    const file = new File([blob], item.file.name, { type: "image/jpeg" });
                    
                    item.file = file;
                    item.url = URL.createObjectURL(file);
                    resolve();
                }, "image/jpeg", 0.9);
            };
            img.src = item.url;
        });
    }

    statusMessage.value = "";
    isProcessing.value = false;
    saveState();
};

// --- Cropping Logic ---
const openCrop = (index) => {
    currentCropIndex = index;
    cropImageSrc.value = images.value[index].url;
    isCropModalOpen.value = true;
    
    nextTick(() => {
        if (cropperInstance) cropperInstance.destroy();
        if (cropImageElement.value) {
            cropperInstance = new Cropper(cropImageElement.value, {
                viewMode: 1,
                autoCropArea: 0.9,
                responsive: true,
                ready() {
                    if (images.value[currentCropIndex].rotation) {
                        cropperInstance.rotate(images.value[currentCropIndex].rotation);
                    }
                }
            });
        }
    });
};

const cancelCrop = () => {
    isCropModalOpen.value = false;
    if (cropperInstance) cropperInstance.destroy();
};

const applyCrop = () => {
    if (!cropperInstance) return;
    
    statusMessage.value = "Cropping image...";
    
    cropperInstance.getCroppedCanvas().toBlob((blob) => {
        const file = new File([blob], images.value[currentCropIndex].file.name, { type: "image/jpeg" });
        const url = URL.createObjectURL(file);
        
        images.value[currentCropIndex].file = file;
        images.value[currentCropIndex].url = url;
        images.value[currentCropIndex].rotation = 0; 
        
        isCropModalOpen.value = false;
        cropperInstance.destroy();
        statusMessage.value = "";
        
        saveState();
    }, "image/jpeg", 0.95);
};

const getNormalizedImage = (item) => {
    return new Promise((resolve, reject) => {
        const isJpeg = item.file.type === "image/jpeg" || item.file.type === "image/jpg";
        const exportType = isJpeg ? "image/jpeg" : "image/png";

        if (item.rotation === 0 && (item.file.type === "image/jpeg" || item.file.type === "image/png")) {
            const reader = new FileReader();
            reader.onload = () => resolve({ bytes: reader.result, isPng: !isJpeg });
            reader.readAsArrayBuffer(item.file);
            return;
        }

        const img = new Image();
        
        img.onload = () => {
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");

            if (item.rotation === 90 || item.rotation === 270) {
                canvas.width = img.height;
                canvas.height = img.width;
            } else {
                canvas.width = img.width;
                canvas.height = img.height;
            }

            if (isJpeg) {
                ctx.fillStyle = "#FFFFFF";
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }

            ctx.translate(canvas.width / 2, canvas.height / 2);
            ctx.rotate(item.rotation * Math.PI / 180);
            ctx.drawImage(img, -img.width / 2, -img.height / 2);

            canvas.toBlob(blob => {
                const reader = new FileReader();
                reader.onload = () => resolve({ bytes: reader.result, isPng: !isJpeg });
                reader.readAsArrayBuffer(blob);
            }, exportType, 0.95);
        };

        img.onerror = () => {
            reject(new Error(`The browser could not read the format of ${item.file.name}`));
        };
        
        img.src = item.url;
    });
};

const generatePDF = async () => {
    statusMessage.value = "Generating PDF...";
    isProcessing.value = true;
    
    try {
        const pdfDoc = await PDFDocument.create();
        const marginVal = parseInt(settings.margin, 10);

        let width, height;
        if (settings.pageSize === "A3") { width = 842; height = 1191; }
        else if (settings.pageSize === "A4") { width = 595; height = 842; }
        else if (settings.pageSize === "A5") { width = 420; height = 595; }
        else if (settings.pageSize === "LETTER") { width = 612; height = 792; }
        else if (settings.pageSize === "LEGAL") { width = 612; height = 1008; }

        for (const item of images.value) {
            const { bytes, isPng } = await getNormalizedImage(item);
            let image;

            if (isPng) image = await pdfDoc.embedPng(bytes);
            else image = await pdfDoc.embedJpg(bytes);

            let page;

            if (settings.pageSize === "ORIGINAL") {
                const pageW = image.width + (marginVal * 2);
                const pageH = image.height + (marginVal * 2);
                page = pdfDoc.addPage([pageW, pageH]);
                page.drawImage(image, {
                    x: marginVal, 
                    y: marginVal,
                    width: image.width,
                    height: image.height
                });
                continue;
            }

            if (settings.orientation === "landscape") {
                page = pdfDoc.addPage([height, width]);
            } else {
                page = pdfDoc.addPage([width, height]);
            }

            const pw = page.getWidth();
            const ph = page.getHeight();
            const availWidth = pw - (marginVal * 2);
            const availHeight = ph - (marginVal * 2);

            const scaleContain = Math.min(availWidth / image.width, availHeight / image.height);
            const scaleCover = Math.max(availWidth / image.width, availHeight / image.height);
            const scale = settings.fit === "cover" ? scaleCover : scaleContain;

            const iw = image.width * scale;
            const ih = image.height * scale;

            page.drawImage(image, {
                x: marginVal + (availWidth - iw) / 2,
                y: marginVal + (availHeight - ih) / 2,
                width: iw,
                height: ih
            });
        }

        const pdfBytes = await pdfDoc.save();
        currentPdfBlob = new Blob([pdfBytes], { type: "application/pdf" });
        pdfUrl.value = URL.createObjectURL(currentPdfBlob);
        
        isPdfModalOpen.value = true;
        statusMessage.value = "";
        
    } catch (error) {
        console.error(error);
        statusMessage.value = "<span class='text-red-500'>Error generating PDF. Please ensure your images are valid.</span>";
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
    
    const finalFilename = customFileName.value.trim() ? `${customFileName.value.trim()}.pdf` : "Converted_Images.pdf";
    link.download = finalFilename;
    
    link.click();
};
</script>
