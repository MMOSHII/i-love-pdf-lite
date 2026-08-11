<template>
    <div v-if="show" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex justify-center items-center z-[1000] p-4">
        <div class="bg-white w-full max-w-[1100px] h-full sm:h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
            <div class="p-3 sm:p-4 px-4 sm:px-6 border-b border-slate-200 flex flex-col sm:flex-row sm:justify-between items-start sm:items-center gap-3">
                <h2 class="m-0 text-lg font-semibold text-slate-800 shrink-0">PDF Preview</h2>
                
                <div class="flex w-full sm:w-auto gap-2 sm:gap-3 items-center">
                    <input 
                        type="text" 
                        :value="fileName"
                        @input="$emit('update:fileName', $event.target.value)"
                        placeholder="Custom file name..." 
                        class="flex-1 sm:w-auto bg-slate-50 border border-slate-200 py-2 sm:py-2.5 px-3 rounded-lg text-sm text-slate-900 focus:border-brand-500 outline-none"
                    >
                    <button @click="$emit('close')" class="bg-white text-slate-700 border border-slate-200 py-2 sm:py-2.5 px-4 rounded-lg text-sm font-medium cursor-pointer transition-colors hover:bg-slate-50">Close</button>
                    <button @click="downloadPdf" class="bg-brand-600 text-white py-2 sm:py-2.5 px-4 rounded-lg text-sm font-medium cursor-pointer transition-colors hover:bg-brand-700 border-none shadow-sm whitespace-nowrap">Download PDF</button>
                </div>
            </div>
            <div class="flex-1 bg-slate-200 flex flex-col">
                <iframe :src="pdfUrl" class="w-full h-full border-none"></iframe>
            </div>
        </div>
    </div>
</template>

<script setup>
const props = defineProps({
    show: Boolean,
    pdfUrl: String,
    fileName: String,
    pdfBlob: Blob
});

const emit = defineEmits(['close', 'update:fileName']);

const downloadPdf = () => {
    if (!props.pdfBlob) return;
    const link = document.createElement("a");
    link.href = URL.createObjectURL(props.pdfBlob);
    
    const finalFilename = props.fileName.trim() ? `${props.fileName.trim()}.pdf` : "document.pdf";
    link.download = finalFilename;
    link.click();
};
</script>