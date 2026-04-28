/* =============================================
   DOUGLINHA GESSO — SCRIPT
   Admin panel, gallery management, animations
   ============================================= */

(function () {
    'use strict';

    // ===== CONFIG =====
    const DEFAULT_PASSWORD = 'doug2026';
    const STORAGE_KEY = 'douglinha_gallery';
    const PASS_KEY = 'douglinha_pass';

    // ===== DOM ELEMENTS =====
    const $ = (sel) => document.querySelector(sel);
    const $$ = (sel) => document.querySelectorAll(sel);

    const header = $('#header');
    const hamburger = $('#hamburger');
    const nav = $('#nav');
    const galleryGrid = $('#galleryGrid');
    const galleryEmpty = $('#galleryEmpty');
    const adminOverlay = $('#adminOverlay');
    const adminLogin = $('#adminLogin');
    const adminPanel = $('#adminPanel');
    const loginForm = $('#loginForm');
    const loginError = $('#loginError');
    const adminPassword = $('#adminPassword');
    const uploadForm = $('#uploadForm');
    const uploadArea = $('#uploadArea');
    const fileInput = $('#fileInput');
    const uploadPreview = $('#uploadPreview');
    const photoCaption = $('#photoCaption');
    const adminGallery = $('#adminGallery');
    const lightbox = $('#lightbox');
    const lightboxImg = $('#lightboxImg');
    const lightboxCaption = $('#lightboxCaption');

    let pendingFiles = [];
    let isLoggedIn = false;

    // ===== STORAGE HELPERS =====
    function getPhotos() {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        } catch {
            return [];
        }
    }

    function savePhotos(photos) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(photos));
    }

    function getPassword() {
        return localStorage.getItem(PASS_KEY) || DEFAULT_PASSWORD;
    }

    function setPassword(pass) {
        localStorage.setItem(PASS_KEY, pass);
    }

    // ===== HEADER SCROLL =====
    window.addEventListener('scroll', () => {
        header.classList.toggle('scrolled', window.scrollY > 50);
    });

    // ===== HAMBURGER MOBILE MENU =====
    hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        nav.classList.toggle('open');
    });

    // Close mobile menu on link click
    nav.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            hamburger.classList.remove('active');
            nav.classList.remove('open');
        });
    });

    // ===== REVEAL ON SCROLL =====
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                revealObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

    $$('.reveal').forEach(el => revealObserver.observe(el));

    // ===== GALLERY =====
    function renderGallery() {
        const photos = getPhotos();
        galleryGrid.innerHTML = '';

        if (photos.length === 0) {
            galleryEmpty.style.display = 'block';
            return;
        }

        galleryEmpty.style.display = 'none';

        // Most recent first (already sorted by timestamp desc)
        photos.forEach((photo, index) => {
            const item = document.createElement('div');
            item.className = 'gallery-item';
            item.style.transitionDelay = `${(index % 6) * 0.1}s`;

            const date = new Date(photo.timestamp);
            const dateStr = date.toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
            });

            item.innerHTML = `
                <img src="${photo.data}" alt="${photo.caption || 'Trabalho Douglinha Gesso'}" loading="lazy">
                <div class="gallery-overlay">
                    <div>
                        <p>${photo.caption || 'Trabalho Douglinha Gesso'}</p>
                        <p class="gallery-date">${dateStr}</p>
                    </div>
                </div>
            `;

            item.addEventListener('click', () => openLightbox(photo));
            galleryGrid.appendChild(item);
        });

        // Observe gallery items for scroll animation
        const galleryObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    galleryObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1, rootMargin: '0px 0px -20px 0px' });

        $$('.gallery-item').forEach(el => galleryObserver.observe(el));
    }

    // ===== LIGHTBOX =====
    function openLightbox(photo) {
        lightboxImg.src = photo.data;
        lightboxCaption.textContent = photo.caption || '';
        lightbox.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeLightbox() {
        lightbox.classList.remove('active');
        document.body.style.overflow = '';
    }

    $('#lightboxClose').addEventListener('click', closeLightbox);
    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) closeLightbox();
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeLightbox();
            closeAdmin();
        }
    });

    // ===== ADMIN MODAL =====
    function openAdmin() {
        adminOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
        if (isLoggedIn) {
            adminLogin.style.display = 'none';
            adminPanel.style.display = 'block';
            renderAdminGallery();
        } else {
            adminLogin.style.display = 'block';
            adminPanel.style.display = 'none';
            adminPassword.value = '';
            loginError.textContent = '';
        }
    }

    function closeAdmin() {
        adminOverlay.classList.remove('active');
        document.body.style.overflow = '';
        pendingFiles = [];
        uploadPreview.innerHTML = '';
        photoCaption.value = '';
    }

    $('#btnAdminNav').addEventListener('click', (e) => {
        e.preventDefault();
        openAdmin();
    });

    $('#modalClose').addEventListener('click', closeAdmin);
    $('#modalClose2').addEventListener('click', closeAdmin);
    adminOverlay.addEventListener('click', (e) => {
        if (e.target === adminOverlay) closeAdmin();
    });

    // ===== LOGIN =====
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const pass = adminPassword.value.trim();
        if (pass === getPassword()) {
            isLoggedIn = true;
            adminLogin.style.display = 'none';
            adminPanel.style.display = 'block';
            renderAdminGallery();
            loginError.textContent = '';
        } else {
            loginError.textContent = 'Senha incorreta. Tente novamente.';
            adminPassword.value = '';
            adminPassword.focus();
        }
    });

    // ===== LOGOUT =====
    $('#btnLogout').addEventListener('click', () => {
        isLoggedIn = false;
        closeAdmin();
    });

    // ===== CHANGE PASSWORD =====
    $('#btnChangePass').addEventListener('click', () => {
        const newPass = prompt('Digite a nova senha:');
        if (newPass && newPass.trim().length >= 4) {
            setPassword(newPass.trim());
            alert('Senha alterada com sucesso!');
        } else if (newPass !== null) {
            alert('A senha deve ter pelo menos 4 caracteres.');
        }
    });

    // ===== FILE UPLOAD =====
    uploadArea.addEventListener('click', () => fileInput.click());

    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('drag-over');
    });

    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('drag-over');
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('drag-over');
        handleFiles(e.dataTransfer.files);
    });

    fileInput.addEventListener('change', () => {
        handleFiles(fileInput.files);
        fileInput.value = '';
    });

    function handleFiles(files) {
        Array.from(files).forEach(file => {
            if (!file.type.startsWith('image/')) return;

            const reader = new FileReader();
            reader.onload = (e) => {
                // Resize image to save localStorage space
                resizeImage(e.target.result, 1200, (resized) => {
                    pendingFiles.push(resized);
                    renderUploadPreview();
                });
            };
            reader.readAsDataURL(file);
        });
    }

    function resizeImage(dataUrl, maxWidth, callback) {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            let w = img.width;
            let h = img.height;

            if (w > maxWidth) {
                h = (maxWidth / w) * h;
                w = maxWidth;
            }

            canvas.width = w;
            canvas.height = h;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, w, h);
            callback(canvas.toDataURL('image/jpeg', 0.8));
        };
        img.src = dataUrl;
    }

    function renderUploadPreview() {
        uploadPreview.innerHTML = '';
        pendingFiles.forEach((data, index) => {
            const div = document.createElement('div');
            div.className = 'preview-item';
            div.innerHTML = `
                <img src="${data}" alt="Preview">
                <button class="remove-preview" data-index="${index}">&times;</button>
            `;
            uploadPreview.appendChild(div);
        });

        uploadPreview.querySelectorAll('.remove-preview').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const idx = parseInt(btn.dataset.index);
                pendingFiles.splice(idx, 1);
                renderUploadPreview();
            });
        });
    }

    // ===== UPLOAD SUBMIT =====
    uploadForm.addEventListener('submit', (e) => {
        e.preventDefault();
        if (pendingFiles.length === 0) {
            alert('Selecione pelo menos uma foto.');
            return;
        }

        const caption = photoCaption.value.trim();
        const photos = getPhotos();

        pendingFiles.forEach(data => {
            photos.unshift({
                id: Date.now() + Math.random().toString(36).substr(2, 5),
                data: data,
                caption: caption,
                timestamp: new Date().toISOString()
            });
        });

        try {
            savePhotos(photos);
        } catch (err) {
            alert('Erro ao salvar: armazenamento cheio. Tente remover fotos antigas ou usar imagens menores.');
            return;
        }

        pendingFiles = [];
        uploadPreview.innerHTML = '';
        photoCaption.value = '';
        renderGallery();
        renderAdminGallery();
        alert(`${photos.length > 1 ? 'Fotos publicadas' : 'Foto publicada'} com sucesso!`);
    });

    // ===== ADMIN GALLERY =====
    function renderAdminGallery() {
        const photos = getPhotos();
        adminGallery.innerHTML = '';

        if (photos.length === 0) {
            adminGallery.innerHTML = '<p style="grid-column:1/-1;text-align:center;color:#999;font-size:0.85rem;">Nenhuma foto publicada.</p>';
            return;
        }

        photos.forEach(photo => {
            const div = document.createElement('div');
            div.className = 'admin-photo';
            div.innerHTML = `
                <img src="${photo.data}" alt="${photo.caption || 'Foto'}">
                <button class="delete-btn" data-id="${photo.id}" title="Excluir">&times;</button>
            `;
            adminGallery.appendChild(div);
        });

        adminGallery.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (confirm('Deseja excluir esta foto?')) {
                    const id = btn.dataset.id;
                    const photos = getPhotos().filter(p => p.id !== id);
                    savePhotos(photos);
                    renderGallery();
                    renderAdminGallery();
                }
            });
        });
    }

    // ===== SMOOTH SCROLL FOR NAV LINKS =====
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                e.preventDefault();
                const headerHeight = header.offsetHeight;
                const targetPosition = target.getBoundingClientRect().top + window.scrollY - headerHeight;
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

    // ===== INIT =====
    renderGallery();

})();
