document.addEventListener('DOMContentLoaded', async () => {
    const feed = document.getElementById('feed');
    const DATA_URL = 'data/visits.json'; 

    let data = [];
    try {
        const response = await fetch(DATA_URL);
        if (!response.ok) throw new Error("HTTP error " + response.status);
        data = await response.json();
    } catch (e) {
        console.error("Data load failed", e);
        feed.innerHTML = `
            <div style='text-align:center; padding:2rem; color: var(--text-secondary);'>
                <strong>Unable to load data.</strong><br>
                <small>Ensure 'data/visits.json' exists and local server is running.</small>
            </div>`;
        return;
    }

    data.sort((a, b) => {
        const dA = a.visit_date || '1970-01-01';
        const dB = b.visit_date || '1970-01-01';
        if (dA !== dB) return new Date(dA) - new Date(dB);
        return (a.visit_order || 0) - (b.visit_order || 0);
    });

    const todayStr = new Date().toISOString().split('T')[0];
    let todayCardId = null;

    data.forEach((item, index) => {
        const order = item.visit_order !== undefined ? `#${item.visit_order}` : '';
        const customer = item.customer_name || 'Unknown';
        
        const card = document.createElement('article');
        card.className = 'card';
        const cardId = `card-${index}`;
        card.id = cardId;

        if (!todayCardId) {
            if (item.visit_date === todayStr) {
                card.classList.add('today');
                todayCardId = cardId;
            } else if (item.visit_date > todayStr) {
                todayCardId = cardId;
            }
        }

        const hasSamples = item.sample_no && item.sample_no.length > 0;
        const sampleText = hasSamples ? item.sample_no.join('\n') : '';
        const reportText = item.visit_report || '';

        const iconCopyHtml = document.getElementById('icon-copy').outerHTML;
        
        card.innerHTML = `
            <div class="card-content">
                <div class="card-header">
                    <div class="header-left">
                        <span class="date">${formatDate(item.visit_date)}</span>
                        <span class="customer">${escapeHtml(customer)}</span>
                    </div>
                    ${order ? `<span class="visit-order">${order}</span>` : ''}
                </div>

                <div class="data-row">
                    <div class="text-content">
                        <span class="label-sm">Report</span>
                        <div class="body-text">${escapeHtml(reportText)}</div>
                    </div>
                    ${reportText ? `
                    <button class="btn-copy" onclick="copyText(this, \`${escapeHtml(reportText)}\`)">
                        ${iconCopyHtml}
                    </button>` : ''}
                </div>

                ${hasSamples ? `
                <div class="data-row">
                    <div class="text-content">
                        <span class="label-sm">Samples</span>
                        <div class="body-text sample-text">${escapeHtml(sampleText).replace(/\n/g, '<br>')}</div>
                    </div>
                    <button class="btn-copy" onclick="copyText(this, \`${escapeHtml(sampleText)}\`)">
                        ${iconCopyHtml}
                    </button>
                </div>
                ` : ''}
            </div>
        `;
        
        feed.appendChild(card);
    });

    if (todayCardId) {
        setTimeout(() => {
            const el = document.getElementById(todayCardId);
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 300);
    } else {
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    }
});

function formatDate(isoStr) {
    if (!isoStr) return "";
    try {
        const options = { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' };
        return new Date(isoStr).toLocaleDateString('en-US', options).toUpperCase();
    } catch (e) { return isoStr; }
}

function escapeHtml(text) {
    if (!text) return "";
    return String(text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;")
        .replace(/`/g, "\\`")
        .replace(/\$/g, "\\$");
}

window.copyText = async function(btn, text) {
    let success = false;
    
    if (navigator.clipboard && navigator.clipboard.writeText) {
        try {
            await navigator.clipboard.writeText(text);
            success = true;
        } catch (err) {
            console.warn("Clipboard API failed, trying fallback...", err);
        }
    }

    if (!success) {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed"; 
        textArea.style.left = "-9999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
            document.execCommand('copy');
            success = true;
        } catch (err) {
            console.error('Fallback copy failed', err);
            alert("Copy failed. Please copy manually.");
        }
        document.body.removeChild(textArea);
    }

    if (success) {
        animateButton(btn);
    }
}

function animateButton(btn) {
    const originalIcon = document.getElementById('icon-copy').outerHTML;
    const checkIcon = document.getElementById('icon-check').outerHTML;

    btn.innerHTML = checkIcon;
    btn.querySelector('svg').classList.add('icon-anim-enter');

    setTimeout(() => {
        btn.innerHTML = originalIcon;
        btn.querySelector('svg').classList.add('icon-anim-enter');
    }, 2000);
}