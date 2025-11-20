const STORAGE_KEY = 'talha-book-shelf-v1';
const FALLBACK_COVERS = [
    'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1491841550275-ad7854e35ca6?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1455885666463-1e31aab57a5d?auto=format&fit=crop&w=600&q=80'
];

const SAMPLE_BOOKS = [
    {
        id: 'sample-1',
        title: 'Küçük Prens',
        author: 'Antoine de Saint-Exupéry',
        category: 'Fantastik',
        level: '3. Sınıf',
        pages: 112,
        finishedDate: '2025-02-12',
        rating: 4.5,
        mood: 'Meraklı',
        notes: 'Tilki ile olan konuşmaları çok sevdi, sorumluluk üzerine konuştuk.',
        cover: FALLBACK_COVERS[0]
    },
    {
        id: 'sample-2',
        title: 'Marslı Çocuk',
        author: 'Lucy Hawking',
        category: 'Bilim',
        level: '4. Sınıf',
        pages: 180,
        finishedDate: '2025-03-05',
        rating: 4,
        mood: 'Heyecanlı',
        notes: 'Uzay merakı arttı, güneş sistemi maketi yapmak istedi.',
        cover: FALLBACK_COVERS[1]
    },
    {
        id: 'sample-3',
        title: 'Define Adası',
        author: 'Robert L. Stevenson',
        category: 'Macera',
        level: '4. Sınıf',
        pages: 220,
        finishedDate: '2025-01-28',
        rating: 5,
        mood: 'Cesur',
        notes: 'Karakterlerin cesareti onu çok etkiledi.',
        cover: FALLBACK_COVERS[2]
    }
];

let books = [];
let filters = { category: 'Hepsi', level: 'Hepsi' };
let searchTerm = '';
let editingId = null;

document.addEventListener('DOMContentLoaded', () => {
    initTabs();
    initBookshelf();
});

function initTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabPanes = document.querySelectorAll('.tab-pane');

    function switchTab(tabId) {
        tabButtons.forEach(btn => btn.classList.remove('active'));
        tabPanes.forEach(pane => pane.classList.remove('active'));

        const activeButton = document.querySelector(`[data-tab="${tabId}"]`);
        if (activeButton) activeButton.classList.add('active');

        const activePane = document.getElementById(tabId);
        if (activePane) activePane.classList.add('active');
    }

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            switchTab(button.getAttribute('data-tab'));
        });
    });

    // Touch kaydırma
    let touchStartX = 0;
    document.addEventListener('touchstart', e => touchStartX = e.changedTouches[0].screenX);
    document.addEventListener('touchend', e => {
        const touchEndX = e.changedTouches[0].screenX;
        const threshold = 50;
        const currentIndex = Array.from(tabButtons).findIndex(btn => btn.classList.contains('active'));
        if (touchEndX < touchStartX - threshold) {
            const nextIndex = (currentIndex + 1) % tabButtons.length;
            switchTab(tabButtons[nextIndex].dataset.tab);
        } else if (touchEndX > touchStartX + threshold) {
            const prevIndex = currentIndex === 0 ? tabButtons.length - 1 : currentIndex - 1;
            switchTab(tabButtons[prevIndex].dataset.tab);
        }
    });

    document.addEventListener('keydown', e => {
        const currentIndex = Array.from(tabButtons).findIndex(btn => btn.classList.contains('active'));
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
            e.preventDefault();
            const nextIndex = (currentIndex + 1) % tabButtons.length;
            switchTab(tabButtons[nextIndex].dataset.tab);
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
            e.preventDefault();
            const prevIndex = currentIndex === 0 ? tabButtons.length - 1 : currentIndex - 1;
            switchTab(tabButtons[prevIndex].dataset.tab);
        }
    });

    window.switchTab = switchTab;
}

function initBookshelf() {
    loadBooks();
    bindButtons();
    bindForm();
    bindSearch();
    renderFilters();
    renderAll();
    runEntranceAnimations();
}

function loadBooks() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        books = stored ? JSON.parse(stored) : SAMPLE_BOOKS;
    } catch (err) {
        console.warn('Kitaplar okunamadı, örnekler kullanılıyor.', err);
        books = SAMPLE_BOOKS;
    }
}

function saveBooks() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(books));
}

function bindButtons() {
    document.querySelectorAll('[data-open-panel]').forEach(btn => {
        btn.addEventListener('click', () => window.switchTab && window.switchTab('panel'));
    });

    const syncBtn = document.getElementById('headerSync');
    if (syncBtn) {
        syncBtn.addEventListener('click', () => {
            loadBooks();
            renderAll();
        });
    }

    const exportBtn = document.getElementById('exportShelf');
    if (exportBtn) {
        exportBtn.addEventListener('click', handleExport);
    }
}

function bindSearch() {
    const searchInput = document.getElementById('bookSearch');
    if (!searchInput) return;
    searchInput.addEventListener('input', e => {
        searchTerm = e.target.value.toLowerCase();
        renderBooks();
    });
}

function bindForm() {
    const form = document.getElementById('bookForm');
    const ratingInput = document.getElementById('bookRating');
    const ratingValue = document.getElementById('ratingValue');
    const resetBtn = document.getElementById('formResetBtn');

    if (ratingInput && ratingValue) {
        ratingInput.addEventListener('input', () => {
            ratingValue.textContent = ratingInput.value;
        });
    }

    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            form.reset();
            editingId = null;
            document.getElementById('bookSubmitBtn').innerHTML = '<i class="fas fa-save"></i> Kaydet';
        });
    }

    if (!form) return;

    form.addEventListener('submit', e => {
        e.preventDefault();
        const formData = new FormData(form);
        const book = {
            id: editingId || crypto.randomUUID?.() || `book-${Date.now()}`,
            title: formData.get('title')?.trim() || 'İsimsiz',
            author: formData.get('author')?.trim() || 'Bilinmiyor',
            category: formData.get('category') || 'Macera',
            level: formData.get('level') || '3. Sınıf',
            pages: Number(formData.get('pages')) || 0,
            finishedDate: formData.get('finishedDate') || new Date().toISOString().slice(0, 10),
            rating: Number(formData.get('rating')) || 3,
            mood: formData.get('mood')?.trim() || 'Mutlu',
            notes: formData.get('notes')?.trim() || '',
            cover: formData.get('cover')?.trim() || randomCover()
        };

        if (editingId) {
            books = books.map(item => item.id === editingId ? book : item);
        } else {
            books = [book, ...books];
        }

        saveBooks();
        renderAll();
        form.reset();
        ratingInput.value = 4;
        ratingValue.textContent = '4';
        editingId = null;
        document.getElementById('bookSubmitBtn').innerHTML = '<i class="fas fa-save"></i> Kaydet';
    });

    const panelList = document.getElementById('panelList');
    if (panelList) {
        panelList.addEventListener('click', e => {
            const { target } = e;
            if (target.matches('button.edit')) {
                const id = target.dataset.id;
                startEdit(id);
            } else if (target.matches('button.delete')) {
                const id = target.dataset.id;
                handleDelete(id);
            }
        });
    }
}

function renderFilters() {
    const categories = ['Hepsi', ...new Set(books.map(book => book.category))];
    const levels = ['Hepsi', ...new Set(books.map(book => book.level))];

    const categoryContainer = document.getElementById('categoryFilters');
    const levelContainer = document.getElementById('levelFilters');

    if (categoryContainer) {
        categoryContainer.innerHTML = categories.map(cat => `
            <button class="chip ${filters.category === cat ? 'active' : ''}" data-filter-type="category" data-value="${cat}">
                ${cat}
            </button>
        `).join('');
    }

    if (levelContainer) {
        levelContainer.innerHTML = levels.map(level => `
            <button class="chip ${filters.level === level ? 'active' : ''}" data-filter-type="level" data-value="${level}">
                ${level}
            </button>
        `).join('');
    }

    document.querySelectorAll('.chip').forEach(chip => {
        chip.addEventListener('click', () => {
            const type = chip.dataset.filterType;
            const value = chip.dataset.value;
            filters[type] = value;
            renderBooks();
            updateHeaderStats();
            renderStats();
            renderTimeline();
            renderAchievements();
            renderPanelList();
        });
    });
}

function renderBooks() {
    const booksGrid = document.getElementById('booksGrid');
    const emptyState = document.getElementById('booksEmpty');
    if (!booksGrid) return;

    const filtered = getFilteredBooks();
    booksGrid.innerHTML = filtered.map(renderBookCard).join('');

    if (emptyState) {
        emptyState.style.display = filtered.length ? 'none' : 'block';
    }

    applyCardAnimations();
}

function renderBookCard(book) {
    return `
        <article class="book-card">
            <div class="book-cover">
                <img src="${book.cover}" alt="${book.title}">
                <span class="book-level">${book.level}</span>
            </div>
            <div class="book-content">
                <h3>${book.title}</h3>
                <p class="book-author">${book.author}</p>
                <div class="book-meta">
                    <span><i class="fas fa-layer-group"></i> ${book.category}</span>
                    <span><i class="fas fa-bookmark"></i> ${book.pages || '?'} sayfa</span>
                    <span><i class="fas fa-calendar"></i> ${formatDate(book.finishedDate)}</span>
                </div>
                <div class="book-tags">
                    <span class="tag">${book.mood}</span>
                    <span class="tag rating">★ ${book.rating.toFixed(1)}</span>
                </div>
                <p class="book-notes">${book.notes || 'Henüz not eklenmedi.'}</p>
            </div>
        </article>
    `;
}

function renderStats() {
    const totalBooks = books.length;
    const totalPages = books.reduce((sum, book) => sum + (book.pages || 0), 0);
    const monthly = books.filter(book => isWithinDays(book.finishedDate, 30));
    const monthlyBooks = monthly.length;
    const monthlyMinutes = monthly.reduce((sum, book) => sum + estimateMinutes(book), 0);
    const moodScore = (books.reduce((sum, book) => sum + (book.rating || 0), 0) / (totalBooks || 1) * 20).toFixed(0);
    const topCategory = getTopCategory();
    const favoriteBook = books.sort((a, b) => (b.rating || 0) - (a.rating || 0))[0];

    setText('statTotalBooks', totalBooks);
    setText('statTotalPages', `${totalPages} sayfa`);
    setText('statMonthlyBooks', monthlyBooks);
    setText('statMonthlyMinutes', `${monthlyMinutes} dk (tahmini)`);
    setText('statLevelAvg', calcLevelAverage());
    setText('statTopCategory', `Favori tür: ${topCategory || '-'}`);
    setText('statMoodScore', moodScore);
    setText('statFavoriteBook', favoriteBook ? favoriteBook.title : 'Henüz favori yok');

    updateHeaderStats();
    renderAchievements();
    renderTimeline();
}

function renderAchievements() {
    const container = document.getElementById('achievementBoard');
    if (!container) return;
    const achievements = [];

    if (books.length >= 5) achievements.push({ icon: 'fa-star', text: '5+ kitap' });
    if (books.some(book => (book.pages || 0) > 200)) achievements.push({ icon: 'fa-mountain', text: 'Uzun soluklu kitap' });
    if (books.filter(book => book.category === getTopCategory()).length >= 3) achievements.push({ icon: 'fa-fire', text: 'Tür ustası' });
    if (!achievements.length) achievements.push({ icon: 'fa-seedling', text: 'Yolculuk yeni başlıyor' });

    container.innerHTML = achievements.map(item => `
        <span class="achievement"><i class="fas ${item.icon}"></i> ${item.text}</span>
    `).join('');
}

function renderTimeline() {
    const container = document.getElementById('readingTimeline');
    if (!container) return;
    const months = groupByMonth(books, 6);
    container.innerHTML = months.map(month => `
        <div class="timeline-item">
            <span class="timeline-label">${month.label}</span>
            <div class="timeline-bar"><span style="width:${month.percent}%"></span></div>
            <span class="timeline-label">${month.count} kitap</span>
        </div>
    `).join('');
}

function renderPanelList() {
    const panelList = document.getElementById('panelList');
    if (!panelList) return;
    if (!books.length) {
        panelList.innerHTML = '<p>Henüz kitap yok. Formu kullanarak ilk kaydı oluştur.</p>';
        return;
    }
    panelList.innerHTML = books
        .sort((a, b) => new Date(b.finishedDate) - new Date(a.finishedDate))
        .map(book => `
            <div class="panel-row">
                <div>
                    <strong>${book.title}</strong>
                    <small>${formatDate(book.finishedDate)} • ${book.category}</small>
                </div>
                <div class="panel-actions">
                    <button class="edit" data-id="${book.id}"><i class="fas fa-pen"></i></button>
                    <button class="delete" data-id="${book.id}"><i class="fas fa-trash"></i></button>
                </div>
            </div>
        `).join('');
}

function startEdit(id) {
    const book = books.find(item => item.id === id);
    if (!book) return;
    const form = document.getElementById('bookForm');
    if (!form) return;
    form.title.value = book.title;
    form.author.value = book.author;
    form.category.value = book.category;
    form.level.value = book.level;
    form.pages.value = book.pages;
    form.finishedDate.value = book.finishedDate;
    form.cover.value = book.cover;
    form.mood.value = book.mood;
    form.notes.value = book.notes;
    form.rating.value = book.rating;
    document.getElementById('ratingValue').textContent = book.rating;
    editingId = id;
    document.getElementById('bookSubmitBtn').innerHTML = '<i class="fas fa-pen-to-square"></i> Güncelle';
    window.switchTab && window.switchTab('panel');
}

function handleDelete(id) {
    if (!confirm('Bu kitabı silmek istediğine emin misin?')) return;
    books = books.filter(book => book.id !== id);
    saveBooks();
    renderAll();
}

function renderAll() {
    renderFilters();
    renderBooks();
    renderStats();
    renderPanelList();
}

function getFilteredBooks() {
    return books
        .filter(book => filters.category === 'Hepsi' || book.category === filters.category)
        .filter(book => filters.level === 'Hepsi' || book.level === filters.level)
        .filter(book => {
            if (!searchTerm) return true;
            return [book.title, book.author, book.notes, book.category, book.mood]
                .some(field => field?.toLowerCase().includes(searchTerm));
        })
        .sort((a, b) => new Date(b.finishedDate) - new Date(a.finishedDate));
}

function updateHeaderStats() {
    setText('headerTotalBooks', books.length);
    setText('headerTotalPages', books.reduce((sum, book) => sum + (book.pages || 0), 0));
    setText('headerTopCategory', getTopCategory() || '-');
}

function handleExport() {
    const blob = new Blob([JSON.stringify(books, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'talha-kitap-rafigi.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

function applyCardAnimations() {
    const cards = document.querySelectorAll('.book-card');
    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

    cards.forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(card);
    });
}

function runEntranceAnimations() {
    const header = document.querySelector('.header');
    const tabsSection = document.querySelector('.tabs-section');
    if (header) {
        header.style.opacity = '0';
        header.style.transform = 'translateY(-20px)';
        header.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
    }
    if (tabsSection) {
        tabsSection.style.opacity = '0';
        tabsSection.style.transform = 'translateY(20px)';
        tabsSection.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
    }
    window.addEventListener('load', () => {
        if (header) {
            header.style.opacity = '1';
            header.style.transform = 'translateY(0)';
        }
        if (tabsSection) {
            tabsSection.style.opacity = '1';
            tabsSection.style.transform = 'translateY(0)';
        }
    });
}

function randomCover() {
    return FALLBACK_COVERS[Math.floor(Math.random() * FALLBACK_COVERS.length)];
}

function estimateMinutes(book) {
    const pages = book.pages || 0;
    return Math.round(pages * 1.2);
}

function calcLevelAverage() {
    const levelNumbers = books
        .map(book => Number(book.level?.match(/\d+/)?.[0]))
        .filter(Boolean);
    if (!levelNumbers.length) return '-';
    const avg = levelNumbers.reduce((sum, val) => sum + val, 0) / levelNumbers.length;
    return `${avg.toFixed(1)}. sınıf`;
}

function getTopCategory() {
    if (!books.length) return null;
    const counts = books.reduce((acc, book) => {
        acc[book.category] = (acc[book.category] || 0) + 1;
        return acc;
    }, {});
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
}

function groupByMonth(items, months = 6) {
    const now = new Date();
    const grouped = [];
    for (let i = months - 1; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const label = date.toLocaleString('tr-TR', { month: 'short' });
        const count = items.filter(book => {
            const finished = new Date(book.finishedDate);
            return finished.getMonth() === date.getMonth() && finished.getFullYear() === date.getFullYear();
        }).length;
        grouped.push({ label, count });
    }
    const max = Math.max(...grouped.map(item => item.count), 1);
    return grouped.map(item => ({ ...item, percent: item.count / max * 100 }));
}

function isWithinDays(dateString, days) {
    const date = new Date(dateString);
    const diff = (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24);
    return diff <= days;
}

function formatDate(dateString) {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
}