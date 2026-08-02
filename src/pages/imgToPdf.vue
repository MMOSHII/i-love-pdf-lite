<template>
    <div class="font-sans bg-gray-50 text-gray-900 py-10 px-5 antialiased min-h-screen">
        <div class="max-w-[1000px] mx-auto">
        
        <!-- Header -->
        <header class="flex items-center gap-3 mb-6">
            <svg class="w-8 h-8 text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <circle cx="10" cy="13" r="2"></circle>
            <path d="m20 17-1.89-1.89a1.5 1.5 0 0 0-2.12 0L14 17"></path>
            </svg>
            <h1 class="text-2xl font-semibold tracking-tight m-0">Image to PDF Converter</h1>
        </header>

        <!-- Controls -->
        <div class="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex flex-wrap gap-3 items-center mb-6">
            <div class="relative overflow-hidden inline-block">
            <button 
                class="bg-white text-gray-900 border border-gray-200 py-2.5 px-4 rounded-lg text-sm font-medium cursor-pointer transition-colors inline-flex items-center hover:bg-gray-100 disabled:opacity-60 disabled:cursor-not-allowed" 
                :disabled="isProcessing"
            >
                ＋ Add Images
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

            <select v-model="settings.pageSize" class="custom-select appearance-none bg-white border border-gray-200 rounded-lg text-[13px] text-gray-900 py-2.5 pl-4 pr-9 focus:border-black outline-none cursor-pointer">
            <option value="A3">A3</option>
            <option value="A4">A4</option>
            <option value="A5">A5</option>
            <option value="LETTER">Letter</option>
            <option value="LEGAL">Legal</option>
            <option value="ORIGINAL">Original Size</option>
            </select>

            <select v-model="settings.orientation" class="custom-select appearance-none bg-white border border-gray-200 rounded-lg text-[13px] text-gray-900 py-2.5 pl-4 pr-9 focus:border-black outline-none cursor-pointer">
            <option value="portrait">Portrait</option>
            <option value="landscape">Landscape</option>
            </select>

            <select v-model="settings.margin" class="custom-select appearance-none bg-white border border-gray-200 rounded-lg text-[13px] text-gray-900 py-2.5 pl-4 pr-9 focus:border-black outline-none cursor-pointer">
            <option value="0">No Margin</option>
            <option value="20">Small Margin</option>
            <option value="40">Large Margin</option>
            </select>

            <select v-model="settings.fit" class="custom-select appearance-none bg-white border border-gray-200 rounded-lg text-[13px] text-gray-900 py-2.5 pl-4 pr-9 focus:border-black outline-none cursor-pointer">
            <option value="contain">Fit (Contain)</option>
            <option value="cover">Fill (Cover)</option>
            </select>

            <button 
            class="bg-black text-white py-2.5 px-4 rounded-lg text-sm font-medium cursor-pointer transition-colors inline-flex items-center hover:bg-gray-800 disabled:opacity-60 disabled:cursor-not-allowed ml-auto border-none" 
            @click="generatePDF"
            :disabled="isProcessing || images.length === 0"
            >
            Preview PDF
            </button>
        </div>

        <!-- Status -->
        <div v-if="statusMessage" class="mb-4 text-sm font-medium text-gray-500" v-html="statusMessage"></div>
        
        <!-- Preview Grid -->
        <div ref="previewGrid" class="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-5">
            <div 
            v-for="(img, index) in images" 
            :key="img.url" 
            class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden cursor-grab active:cursor-grabbing hover:-translate-y-0.5 hover:shadow-md transition-all"
            >
            <div class="w-full aspect-square bg-gray-50 flex items-center justify-center border-b border-gray-200 overflow-hidden">
                <img 
                :src="img.url" 
                alt="Preview" 
                class="w-full h-full object-contain pointer-events-none transition-transform duration-300 ease-in-out" 
                :style="{ transform: `rotate(${img.rotation}deg)` }"
                >
            </div>
            <div class="p-3 px-4 flex justify-between items-center gap-2">
                <p class="text-[13px] text-gray-500 m-0 whitespace-nowrap overflow-hidden text-ellipsis flex-grow" :title="img.file.name">
                {{ img.file.name }}
                </p>
                <div class="flex gap-1">
                <button @click="openCrop(index)" class="bg-transparent text-gray-500 border-none p-1.5 rounded cursor-pointer text-sm transition-colors flex items-center justify-center hover:bg-gray-100 hover:text-gray-900" title="Crop">✂</button>
                <button @click="rotateImage(index)" class="bg-transparent text-gray-500 border-none p-1.5 rounded cursor-pointer text-sm transition-colors flex items-center justify-center hover:bg-gray-100 hover:text-gray-900" title="Rotate 90°">⟳</button>
                <button @click="removeImage(index)" class="bg-transparent text-gray-500 border-none p-1.5 rounded cursor-pointer text-sm transition-colors flex items-center justify-center hover:text-red-500 hover:bg-red-50" title="Remove">✕</button>
                </div>
            </div>
            </div>
        </div>

        </div>

        <!-- PDF Preview Modal -->
        <div v-if="isPdfModalOpen" class="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-[1000]">
        <div class="bg-white w-[90%] max-w-[1100px] h-[90vh] rounded-xl shadow-2xl flex flex-col overflow-hidden">
            <div class="p-4 px-6 border-b border-gray-200 flex justify-between items-center">
            <h2 class="m-0 text-lg font-semibold">PDF Preview</h2>
            <div class="flex gap-3">
                <button @click="closePdf" class="bg-white text-gray-900 border border-gray-200 py-2.5 px-4 rounded-lg text-sm font-medium cursor-pointer transition-colors inline-flex items-center hover:bg-gray-100">Close</button>
                <button @click="downloadPdf" class="bg-black text-white py-2.5 px-4 rounded-lg text-sm font-medium cursor-pointer transition-colors inline-flex items-center hover:bg-gray-800 border-none">Download PDF</button>
            </div>
            </div>
            <div class="flex-1 bg-gray-200 flex flex-col">
            <iframe :src="pdfUrl" class="w-full h-full border-none"></iframe>
            </div>
        </div>
        </div>

        <!-- Crop Modal -->
        <div v-show="isCropModalOpen" class="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-[1000]">
        <div class="bg-white w-[90%] max-w-[800px] h-[85vh] rounded-xl shadow-2xl flex flex-col overflow-hidden">
            <div class="p-4 px-6 border-b border-gray-200 flex justify-between items-center">
            <h2 class="m-0 text-lg font-semibold">Crop Image</h2>
            <div class="flex gap-3">
                <button @click="cancelCrop" class="bg-white text-gray-900 border border-gray-200 py-2.5 px-4 rounded-lg text-sm font-medium cursor-pointer transition-colors inline-flex items-center hover:bg-gray-100">Cancel</button>
                <button @click="applyCrop" class="bg-black text-white py-2.5 px-4 rounded-lg text-sm font-medium cursor-pointer transition-colors inline-flex items-center hover:bg-gray-800 border-none">Apply Crop</button>
            </div>
            </div>
            <div class="flex-1 bg-gray-900 flex flex-col items-center justify-center p-6">
            <div class="max-w-full max-h-full">
                <img ref="cropImageElement" :src="cropImageSrc" class="block max-w-full">
            </div>
            </div>
        </div>
        </div>
    </div>
</template>

<script setup>
import { ref, reactive, onMounted, nextTick } from 'vue';
import Sortable from 'sortablejs';
import heic2any from 'heic2any';
import Cropper from 'cropperjs';
import { PDFDocument } from 'pdf-lib';
import 'cropperjs/dist/cropper.css';

const images = ref([]);
const isProcessing = ref(false);
const statusMessage = ref("");
const previewGrid = ref(null);

const settings = reactive({
    pageSize: 'A4',
    orientation: 'portrait',
    margin: '0',
    fit: 'contain'
});

// PDF State
const isPdfModalOpen = ref(false);
const pdfUrl = ref("");
let currentPdfBlob = null;

// Cropper State
const isCropModalOpen = ref(false);
const cropImageSrc = ref("");
const cropImageElement = ref(null);
let cropperInstance = null;
let currentCropIndex = -1;

onMounted(() => {
    if (previewGrid.value) {
        new Sortable(previewGrid.value, {
        animation: 150,
        ghostClass: 'sortable-ghost',
        onEnd(evt) {
            const item = images.value.splice(evt.oldIndex, 1)[0];
            images.value.splice(evt.newIndex, 0, item);
        }
        });
    }
});

const handleFileUpload = async (e) => {
    if (e.target.files.length === 0) return;
    
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
};

const rotateImage = (index) => {
    images.value[index].rotation = (images.value[index].rotation + 90) % 360;
};

const removeImage = (index) => {
    images.value.splice(index, 1);
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
            if (images.value[index].rotation) {
                cropperInstance.rotate(images.value[index].rotation);
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
    link.download = "Converted_Images.pdf";
    link.click();
};
</script>

<style scoped>
.sortable-ghost {
    opacity: 0.4;
    background-color: #f3f4f6;
}

.custom-select {
    background-image: url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2216%22%20height%3D%2216%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M4%206l4%204%204-4%22%20stroke%3D%22%236B7280%22%20stroke-width%3D%221.5%22%20fill%3D%22none%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3C%2Fsvg%3E");
    background-repeat: no-repeat;
    background-position: right 12px center;
}
</style>