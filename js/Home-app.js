const grid = document.getElementById("tool-grid");
const searchInput = document.getElementById("search");

function renderList(filter = "") {
    grid.innerHTML = "";
    
    const filtered = pages.filter(p => 
        p.name.toLowerCase().includes(filter.toLowerCase()) || 
        p.filename.toLowerCase().includes(filter.toLowerCase())
    );

    if (filtered.length === 0) {
        grid.innerHTML = `<div class="col-span-full py-12 text-center text-sm text-gray-400">No matching tools found.</div>`;
        return;
    }

    filtered.forEach(page => {
        const path = `${page.folder}/${page.filename}`;
        const card = document.createElement("a");
        card.href = path;
        card.className = "group bg-white p-5 rounded-xl shadow-sm border border-gray-200 hover:border-black hover:shadow-md transition-all flex flex-col justify-between";
        
        card.innerHTML = `
            <div>
                <div class="flex items-center justify-between mb-2">
                    <h2 class="text-base font-semibold text-gray-900 group-hover:text-black m-0">${page.name}</h2>
                    <span class="text-xs bg-gray-100 text-gray-600 py-1 px-2 rounded font-mono">${page.filename}</span>
                </div>
                <p class="text-xs text-gray-500 m-0 leading-relaxed">${page.description}</p>
            </div>
            <div class="mt-4 flex items-center text-xs font-medium text-black group-hover:underline">
                Open tool 
                <svg class="w-3.5 h-3.5 ml-1 transition-transform group-hover:translate-x-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                    <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
            </div>
        `;
        grid.appendChild(card);
    });
}

searchInput.addEventListener("input", (e) => {
    renderList(e.target.value);
});

renderList();