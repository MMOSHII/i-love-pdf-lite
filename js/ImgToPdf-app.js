const preview = document.getElementById("preview");
const filesInput = document.getElementById("files");
const status = document.getElementById("status");
const uploadBtnUI = document.getElementById("upload-btn-ui");

const pdfModal = document.getElementById("pdf-modal");
const pdfFrame = document.getElementById("pdf-frame");
const closePdfBtn = document.getElementById("close-pdf");
const downloadBtn = document.getElementById("download-btn");

const cropModal = document.getElementById("crop-modal");
const cropImage = document.getElementById("crop-image");
const cancelCropBtn = document.getElementById("cancel-crop");
const applyCropBtn = document.getElementById("apply-crop");

let images = [];
let currentPdfBlob = null;
let cropper = null;
let currentCropIndex = -1;

new Sortable(preview, {
    animation: 150,
    ghostClass: 'sortable-ghost',
    onEnd() {
        const newOrder = [];
        [...preview.children].forEach(card => {
            const index = card.dataset.index;
            newOrder.push(images[index]);
        });
        images = newOrder;
        refresh();
    }
});

filesInput.addEventListener("change", async (e) => {
    if (e.target.files.length === 0) return;
    
    status.innerHTML = "Processing images (this may take a moment)...";
    uploadBtnUI.disabled = true;
    filesInput.disabled = true;

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
        images.push({ file: processedFile, url, rotation: 0 });
    }

    status.innerHTML = "";
    uploadBtnUI.disabled = false;
    filesInput.disabled = false;
    filesInput.value = "";
    refresh();
});

function refresh() {
    preview.innerHTML = "";
    images.forEach((img, i) => {
        const div = document.createElement("div");
        div.className = "bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden cursor-grab active:cursor-grabbing hover:-translate-y-0.5 hover:shadow-md transition-all";
        div.dataset.index = i;

        div.innerHTML = `
            <div class="w-full aspect-square bg-gray-50 flex items-center justify-center border-b border-gray-200 overflow-hidden">
                <img src="${img.url}" alt="Preview" class="w-full h-full object-contain pointer-events-none transition-transform duration-300 ease-in-out" style="transform: rotate(${img.rotation}deg)">
            </div>
            <div class="p-3 px-4 flex justify-between items-center gap-2">
                <p class="text-[13px] text-gray-500 m-0 whitespace-nowrap overflow-hidden text-ellipsis flex-grow" title="${img.file.name}">${img.file.name}</p>
                <div class="flex gap-1">
                    <button class="crop bg-transparent text-gray-500 border-none p-1.5 rounded cursor-pointer text-sm transition-colors flex items-center justify-center hover:bg-gray-100 hover:text-gray-900" title="Crop">✂</button>
                    <button class="rotate bg-transparent text-gray-500 border-none p-1.5 rounded cursor-pointer text-sm transition-colors flex items-center justify-center hover:bg-gray-100 hover:text-gray-900" title="Rotate 90°">⟳</button>
                    <button class="remove bg-transparent text-gray-500 border-none p-1.5 rounded cursor-pointer text-sm transition-colors flex items-center justify-center hover:text-red-500 hover:bg-red-50" title="Remove">✕</button>
                </div>
            </div>
        `;

        div.querySelector(".crop").onclick = () => {
            currentCropIndex = i;
            cropImage.src = img.url;
            cropModal.style.display = "flex";
            
            setTimeout(() => {
                if (cropper) cropper.destroy();
                cropper = new Cropper(cropImage, {
                    viewMode: 1,
                    autoCropArea: 0.9,
                    responsive: true,
                    ready() {
                        if (img.rotation) {
                            cropper.rotate(img.rotation);
                        }
                    }
                });
            }, 50);
        };

        div.querySelector(".rotate").onclick = () => {
            images[i].rotation = (images[i].rotation + 90) % 360;
            refresh();
        };

        div.querySelector(".remove").onclick = () => {
            images.splice(i, 1);
            refresh();
        };

        preview.appendChild(div);
    });
}

cancelCropBtn.onclick = () => {
    cropModal.style.display = "none";
    if (cropper) cropper.destroy();
};

applyCropBtn.onclick = () => {
    if (!cropper) return;
    
    status.innerHTML = "Cropping image...";
    
    cropper.getCroppedCanvas().toBlob((blob) => {
        const file = new File([blob], images[currentCropIndex].file.name, { type: "image/jpeg" });
        const url = URL.createObjectURL(file);
        
        images[currentCropIndex].file = file;
        images[currentCropIndex].url = url;
        images[currentCropIndex].rotation = 0; 
        
        cropModal.style.display = "none";
        cropper.destroy();
        status.innerHTML = "";
        refresh();
    }, "image/jpeg", 0.95);
};

function getNormalizedImage(item) {
    return new Promise((resolve) => {
        const isPng = item.file.type.includes("png");
        const exportType = isPng ? "image/png" : "image/jpeg";

        if (item.rotation === 0 && (item.file.type === "image/jpeg" || item.file.type === "image/png")) {
            const reader = new FileReader();
            reader.onload = () => resolve({ bytes: reader.result, isPng: isPng });
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

            if (!isPng) {
                ctx.fillStyle = "#FFFFFF";
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }

            ctx.translate(canvas.width / 2, canvas.height / 2);
            ctx.rotate(item.rotation * Math.PI / 180);
            ctx.drawImage(img, -img.width / 2, -img.height / 2);

            canvas.toBlob(blob => {
                const reader = new FileReader();
                reader.onload = () => resolve({ bytes: reader.result, isPng: isPng });
                reader.readAsArrayBuffer(blob);
            }, exportType, 0.95);
        };
        img.src = item.url;
    });
}

document.getElementById("preview-btn").onclick = async () => {
    if (images.length === 0) {
        alert("Please select images first.");
        return;
    }

    status.innerHTML = "Generating PDF...";
    document.getElementById("preview-btn").disabled = true;
    
    try {
        const pdfDoc = await PDFLib.PDFDocument.create();

        const pageSize = document.getElementById("pageSize").value;
        const orientation = document.getElementById("orientation").value;
        const marginVal = parseInt(document.getElementById("margin").value, 10);
        const fit = document.getElementById("fit").value;

        let width, height;
        if (pageSize === "A3") { width = 842; height = 1191; }
        else if (pageSize === "A4") { width = 595; height = 842; }
        else if (pageSize === "A5") { width = 420; height = 595; }
        else if (pageSize === "LETTER") { width = 612; height = 792; }
        else if (pageSize === "LEGAL") { width = 612; height = 1008; }

        for (const item of images) {
            const { bytes, isPng } = await getNormalizedImage(item);
            let image;

            if (isPng)
                image = await pdfDoc.embedPng(bytes);
            else
                image = await pdfDoc.embedJpg(bytes);

            let page;

            if (pageSize === "ORIGINAL") {
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

            if (orientation === "landscape") {
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
            const scale = fit === "cover" ? scaleCover : scaleContain;

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

        pdfFrame.src = URL.createObjectURL(currentPdfBlob);
        pdfModal.style.display = "flex";
        status.innerHTML = "";
        
    } catch (error) {
        console.error(error);
        status.innerHTML = "<span class='text-red-500'>Error generating PDF. Please ensure your images are valid.</span>";
    } finally {
        document.getElementById("preview-btn").disabled = false;
    }
};

closePdfBtn.onclick = () => {
    pdfModal.style.display = "none";
    pdfFrame.src = "";
};

downloadBtn.onclick = () => {
    if (!currentPdfBlob) return;
    const link = document.createElement("a");
    link.href = URL.createObjectURL(currentPdfBlob);
    link.download = "Converted_Images.pdf";
    link.click();
};