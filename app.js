document.addEventListener('DOMContentLoaded', () => {
    let allProducts = [];
    let allCategories = [];
    let savedItems = [];
    let recommendationPool = [];
    let recommendationPopupIndex = 0;
    let currentUser = null;
    let displayedProductCount = 20;
    const PRODUCTS_PER_PAGE = 20;

    const dom = {
        header: document.getElementById('main-header'),
        pages: document.querySelectorAll('.page-content'),
        productGrid: document.getElementById('product-grid'),
        loadMoreBtn: document.getElementById('load-more-btn'),
        categoryGrid: document.getElementById('category-grid'),
        productListGrid: document.getElementById('product-list-grid'),
        productListTitle: document.getElementById('product-list-title'),
        recommendedGrid: document.getElementById('recommended-grid'),
        noRecommendations: document.getElementById('no-recommendations'),
        savedItemsContainer: document.getElementById('saved-items-container'),
        noSavedItems: document.getElementById('no-saved-items'),
        featuredCarousel: document.getElementById('featured-carousel'),
        filterCategory: document.getElementById('filter-category'),
        filterRating: document.getElementById('filter-rating'),
        searchInput: document.getElementById('search-input'),
        searchBtn: document.getElementById('search-btn'),
        saveNotification: document.getElementById('save-notification'),
        recommendationPopup: document.getElementById('recommendation-popup'),
        popupImg: document.getElementById('popup-img'),
        popupTitle: document.getElementById('popup-title'),
        popupLink: document.getElementById('popup-link'),
        authContainer: document.getElementById('auth-container'),
        userContainer: document.getElementById('user-container'),
        usernameDisplay: document.getElementById('username-display'),
        loginBtn: document.getElementById('login-btn'),
        signupBtn: document.getElementById('signup-btn'),
        logoutBtn: document.getElementById('logout-btn'),
        loginModal: document.getElementById('login-modal'),
        signupModal: document.getElementById('signup-modal'),
        loginForm: document.getElementById('login-form'),
        signupForm: document.getElementById('signup-form'),
        showSignup: document.getElementById('show-signup'),
        showLogin: document.getElementById('show-login'),
        modalCloseBtns: document.querySelectorAll('.modal-close-btn'),
        darkModeToggle: document.getElementById('dark-mode-toggle'),
        mobileMenuBtn: document.getElementById('mobile-menu-btn'),
        mobileMenu: document.getElementById('mobile-menu'),
        navLinks: document.querySelectorAll('.nav-link'),
        // Product Details Modal
        productDetailsModal: document.getElementById('product-details-modal'),
        modalProductImg: document.getElementById('modal-product-img'),
        modalProductTitle: document.getElementById('modal-product-title'),
        modalProductCategory: document.getElementById('modal-product-category'),
        modalProductDescription: document.getElementById('modal-product-description'),
        modalProductPrice: document.getElementById('modal-product-price'),
        modalProductDiscount: document.getElementById('modal-product-discount'),
        modalProductRating: document.getElementById('modal-product-rating'),
        modalProductRatingText: document.getElementById('modal-product-rating-text'),
        modalProductBrand: document.getElementById('modal-product-brand'),
        modalProductStock: document.getElementById('modal-product-stock'),
        modalSaveBtn: document.getElementById('modal-save-btn'),
    };

    window.DOM = dom;
    window.AppState = {
        get allProducts() { return allProducts; },
        get allCategories() { return allCategories; },
        get savedItems() { return savedItems; },
        get recommendationPool() { return recommendationPool; },
        get currentUser() { return currentUser; },
        get displayedProductCount() { return displayedProductCount; }
    };

    function init() {
        // Apply saved theme on load
        if (localStorage.getItem('theme') === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }

        fetchData();
        setupEventListeners();
        if (window.Router && typeof window.Router.onRouteChange === 'function') {
            window.Router.onRouteChange(handleRouteChange);
        } else {
            window.addEventListener('hashchange', handleRouteChange);
        }
        handleRouteChange();
        document.getElementById('footer-year').textContent = new Date().getFullYear();
        startRecommendationPopup();
        setupScrollAnimations();
        loadCurrentUser();
        loadSavedItems();
        updateAuthUI();
        updateSavedItemsUI();
        generateRecommendations();
    }

    async function fetchData() {
        try {
            if (window.LocalData && Array.isArray(window.LocalData.products) && Array.isArray(window.LocalData.categories)) {
                allProducts = window.LocalData.products;
                allCategories = window.LocalData.categories;
            } else {
                throw new Error('LocalData is not available.');
            }

            renderProductGrid(allProducts.slice(0, displayedProductCount));
            populateCategoryFilter(allCategories);
            renderCategoryGrid(allCategories);
            renderFeaturedCarousel(allProducts.filter(p => p.rating >= 4.8));
            generateRecommendations();

        } catch (error) {
            console.error('Error fetching data:', error);
            dom.productGrid.innerHTML = '<p class="text-red-500 col-span-full text-center">Failed to load local products data.</p>';
        }
    }
    
    function setupEventListeners() {
        dom.loadMoreBtn.addEventListener('click', loadMoreProducts);
        dom.searchBtn.addEventListener('click', handleSearch);
        
        dom.loginBtn.addEventListener('click', () => toggleModal('login-modal'));
        dom.signupBtn.addEventListener('click', () => toggleModal('signup-modal'));
        dom.logoutBtn.addEventListener('click', handleLogout);
        
        dom.modalCloseBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modal = e.target.closest('.fixed');
                if(modal) {
                    toggleModal(modal.id, false);
                }
            });
        });

        dom.showSignup.addEventListener('click', (e) => {
            e.preventDefault();
            toggleModal('login-modal', false);
            toggleModal('signup-modal', true);
        });
        
        dom.showLogin.addEventListener('click', (e) => {
            e.preventDefault();
            toggleModal('signup-modal', false);
            toggleModal('login-modal', true);
        });

        dom.loginForm.addEventListener('submit', handleLogin);
        dom.signupForm.addEventListener('submit', handleSignup);
        
        dom.darkModeToggle.addEventListener('click', toggleDarkMode);
        
        dom.mobileMenuBtn.addEventListener('click', () => {
            dom.mobileMenu.classList.toggle('hidden');
        });
        
        dom.navLinks.forEach(link => {
            link.addEventListener('click', () => {
                dom.mobileMenu.classList.add('hidden');
            });
        });
        
        // Combined event listener for product grids
        const gridContainer = document.querySelector('main');
        gridContainer.addEventListener('click', handleGridClick);

        dom.modalSaveBtn.addEventListener('click', handleModalSaveClick);
    }
    
    function handleGridClick(e) {
        const saveBtn = e.target.closest('.save-btn');
        const detailsBtn = e.target.closest('.view-details-btn');
        
        if (saveBtn) {
            if (!currentUser) {
                toggleModal('login-modal', true);
                return;
            }
            const productId = parseInt(saveBtn.dataset.id);
            toggleSaveItem(productId);
        }
        
        if (detailsBtn) {
            const productId = parseInt(detailsBtn.dataset.id);
            const product = allProducts.find(p => p.id === productId);
            if (product) {
                renderProductDetailsModal(product);
                toggleModal('product-details-modal', true);
            }
        }
    }
    
    function handleModalSaveClick(e) {
        if (!currentUser) {
            toggleModal('product-details-modal', false); // Close details modal
            toggleModal('login-modal', true); // Open login modal
            return;
        }
        const productId = parseInt(e.target.dataset.id);
        toggleSaveItem(productId);
    }

    function loadMoreProducts() {
        const currentCount = displayedProductCount;
        const newCount = currentCount + PRODUCTS_PER_PAGE;
        const productsToDisplay = allProducts.slice(currentCount, newCount);
        renderProductGrid(productsToDisplay, true);
        displayedProductCount = newCount;
        
        if (displayedProductCount >= allProducts.length) {
            dom.loadMoreBtn.classList.add('hidden');
        }
    }

    function handleSearch() {
        const searchTerm = dom.searchInput.value.toLowerCase();
        const category = dom.filterCategory.value;
        const rating = parseFloat(dom.filterRating.value) || 0;

        const filteredProducts = allProducts.filter(product => {
            const matchesSearch = product.title.toLowerCase().includes(searchTerm) || product.description.toLowerCase().includes(searchTerm);
            const matchesCategory = category ? product.category === category : true;
            const matchesRating = product.rating >= rating;
            return matchesSearch && matchesCategory && matchesRating;
        });

        renderProductGrid(filteredProducts);
        dom.loadMoreBtn.classList.add('hidden');
    }

    function renderProductGrid(products, append = false) {
        if (!append) {
            dom.productGrid.innerHTML = '';
        }
        if (products.length === 0 && !append) {
             dom.productGrid.innerHTML = '<p class="text-slate-500 col-span-full text-center">No products found.</p>';
             return;
        }
        
        const html = products.map(product => renderProductCard(product)).join('');
        dom.productGrid.insertAdjacentHTML(append ? 'beforeend' : 'afterbegin', html);
    }
    
    function getRatingStars(rating) {
        return window.UI.getRatingStars(rating);
    }

    function renderProductCard(product, isRecommended = false, isSavedPage = false) {
        return window.UI.renderProductCard(product, savedItems, isRecommended, isSavedPage);
    }
    
    function renderProductDetailsModal(product) {
        return window.UI.renderProductDetailsModal(product);
    }
    
    function updateModalSaveButtonState(productId) {
        return window.UI.updateModalSaveButtonState(productId);
    }
    
    function renderCategoryGrid(categories) {
        return window.UI.renderCategoryGrid(categories);
    }
    
    function renderProductsListPage(categorySlug) {
        return window.UI.renderProductsListPage(categorySlug);
    }
    
    function renderRecommendedPage() {
        return window.UI.renderRecommendedPage();
    }
    
    function renderSavedItemsPage() {
        return window.UI.renderSavedItemsPage();
    }
   
    function populateCategoryFilter(categories) {
        return window.UI.populateCategoryFilter(categories);
    }
    
    function renderFeaturedCarousel(products) {
        return window.UI.renderFeaturedCarousel(products);
    }
    
    function startFeaturedCarousel(itemCount) {
        return window.UI.startFeaturedCarousel(itemCount);
    }

    function handleRouteChange() {
        const hash = (window.Router && typeof window.Router.getHash === 'function') ? window.Router.getHash() : (window.location.hash || '#home');
        dom.pages.forEach(page => page.classList.add('hidden'));
        
        window.scrollTo(0, 0);

        if (hash.startsWith('#category/')) {
            const categorySlug = hash.split('/')[1];
            document.getElementById('page-products-list').classList.remove('hidden');
            renderProductsListPage(categorySlug);
        } else {
            const pageId = `page-${hash.substring(1)}`;
            const activePage = document.getElementById(pageId);
            if (activePage) {
                activePage.classList.remove('hidden');
                
                if (hash === '#recommended') renderRecommendedPage();
                if (hash === '#saved') renderSavedItemsPage();
            } else {
                document.getElementById('page-home').classList.remove('hidden');
            }
        }
        
        document.querySelectorAll('#main-header .nav-link').forEach(link => {
            if (link.getAttribute('href') === hash) {
                link.classList.add('bg-slate-200', 'dark:bg-slate-700');
            } else {
                link.classList.remove('bg-slate-200', 'dark:bg-slate-700');
            }
        });
    }

    function toggleModal(modalId, forceShow = null) {
        const modal = document.getElementById(modalId);
        if (forceShow === true) {
            modal.classList.remove('hidden');
        } else if (forceShow === false) {
            modal.classList.add('hidden');
        } else {
            modal.classList.toggle('hidden');
        }
    }

    function handleLogin(e) {
        e.preventDefault();
        const username = dom.loginForm.querySelector('input[type="text"]').value;
        if (!username) return;
        currentUser = { username: username };
        persistCurrentUser();
        updateAuthUI();
        toggleModal('login-modal', false);
        dom.loginForm.reset();
        generateRecommendations();
    }
    
    function handleSignup(e) {
        e.preventDefault();
        const username = dom.signupForm.querySelector('#signup-username').value;
        if (!username) return;
        currentUser = { username: username };
        persistCurrentUser();
        updateAuthUI();
        toggleModal('signup-modal', false);
        dom.signupForm.reset();
        generateRecommendations();
    }

    function handleLogout() {
        currentUser = null;
        persistCurrentUser();
        savedItems = [];
        persistSavedItems();
        updateAuthUI();
        updateSavedItemsUI();
        generateRecommendations();
    }

    function updateAuthUI() {
        if (currentUser) {
            dom.authContainer.classList.add('hidden');
            dom.userContainer.classList.remove('hidden');
            dom.usernameDisplay.textContent = `Welcome, ${currentUser.username}`;
        } else {
            dom.authContainer.classList.remove('hidden');
            dom.userContainer.classList.add('hidden');
        }
    }
    
    function loadSavedItems() {
        const storedItems = localStorage.getItem('savedItems');
        if (storedItems) {
            savedItems = JSON.parse(storedItems);
        }
    }
    
    function persistSavedItems() {
        localStorage.setItem('savedItems', JSON.stringify(savedItems));
    }

    function loadCurrentUser() {
        try {
            const raw = localStorage.getItem('currentUser');
            currentUser = raw ? JSON.parse(raw) : null;
        } catch (e) {
            currentUser = null;
        }
    }

    function persistCurrentUser() {
        if (currentUser) {
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
        } else {
            localStorage.removeItem('currentUser');
        }
    }
    
    function toggleSaveItem(productId) {
        const index = savedItems.indexOf(productId);
        if (index > -1) {
            savedItems.splice(index, 1);
        } else {
            savedItems.push(productId);
            showSaveNotification();
        }
        persistSavedItems();
        updateSavedItemsUI();
        generateRecommendations();
    }
    
    function updateSavedItemsUI() {
        // Update all heart icons
        document.querySelectorAll('.save-btn').forEach(btn => {
            const id = parseInt(btn.dataset.id);
            const icon = btn.querySelector('.heart-icon');
            if (savedItems.includes(id)) {
                icon.classList.add('saved');
                icon.textContent = '♥';
            } else {
                icon.classList.remove('saved');
                icon.textContent = '♡';
            }
        });
        
        // Update the save button in the details modal, if it's open
        if (!dom.productDetailsModal.classList.contains('hidden')) {
            const modalProductId = parseInt(dom.modalSaveBtn.dataset.id);
            if(modalProductId) {
                updateModalSaveButtonState(modalProductId);
            }
        }
        
        // Refresh the saved items page if it's the active view
        if (window.location.hash === '#saved') {
            renderSavedItemsPage();
        }
    }
    
    function showSaveNotification() {
        dom.saveNotification.classList.add('visible');
        setTimeout(() => {
            dom.saveNotification.classList.remove('visible');
        }, 3000);
    }

    function generateRecommendations() {
        if (!currentUser || !currentUser.username) {
            const pool = [...allProducts].sort(() => 0.5 - Math.random());
            recommendationPool = pool.slice(0, 10);
            if (window.location.hash === '#recommended') renderRecommendedPage();
            return;
        }
        try {
            const signals = {
                searchTerm: dom.searchInput ? dom.searchInput.value : '',
                categoryFilter: dom.filterCategory ? dom.filterCategory.value : '',
                minRatingFilter: parseFloat(dom.filterRating ? dom.filterRating.value : '0') || 0,
            };
            if (allProducts.length > 0) {
                let recs = null;
                if (window.Recs && typeof window.Recs.recommend === 'function') {
                    recs = window.Recs.recommend(allProducts, savedItems, signals, 10);
                } else if (window.Agent && typeof window.Agent.recommend === 'function') {
                    recs = window.Agent.recommend(allProducts, savedItems, signals, 10);
                }
                if (recs) {
                    recommendationPool = Array.isArray(recs) ? recs : [];
                    if (window.location.hash === '#recommended') renderRecommendedPage();
                    return;
                }
            }
        } catch (e) {
            console.error('Agent recommend error:', e);
        }
        if (savedItems.length === 0) {
            recommendationPool = [...allProducts].sort(() => 0.5 - Math.random()).slice(0, 10);
            if (window.location.hash === '#recommended') renderRecommendedPage();
            return;
        }
        const savedProducts = allProducts.filter(p => savedItems.includes(p.id));
        const categories = [...new Set(savedProducts.map(p => p.category))];
        const pool = allProducts.filter(p =>
            categories.includes(p.category) &&
            !savedItems.includes(p.id)
        );
        if (pool.length < 10) {
            const otherProducts = allProducts.filter(p => !categories.includes(p.category) && !savedItems.includes(p.id));
            pool.push(...otherProducts.slice(0, 10 - pool.length));
        }
        recommendationPool = pool.sort(() => 0.5 - Math.random()).slice(0, 10);
        if (window.location.hash === '#recommended') renderRecommendedPage();
    }
    
    function startRecommendationPopup() {
        setInterval(cycleRecommendationPopup, 10000);
    }
    
    function cycleRecommendationPopup() {
        if (recommendationPool.length === 0) return;
        
        const product = recommendationPool[recommendationPopupIndex];
        
        dom.popupImg.src = product.thumbnail;
        dom.popupTitle.textContent = product.title;
        dom.popupLink.href = `#product/${product.id}`; // This link is a placeholder, as we don'g have single product pages
        dom.popupLink.onclick = (e) => {
            e.preventDefault();
            renderProductDetailsModal(product);
            toggleModal('product-details-modal', true);
            dom.recommendationPopup.classList.remove('visible');
        };
        
        dom.recommendationPopup.classList.add('visible');
        
        recommendationPopupIndex = (recommendationPopupIndex + 1) % recommendationPool.length;
        
        setTimeout(() => {
            dom.recommendationPopup.classList.remove('visible');
        }, 5000);
    }
    
    function setupScrollAnimations() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('section-visible');
                    if(entry.target.classList.contains('fade-up-on-scroll')) {
                        entry.target.style.opacity = '1';
                        entry.target.style.transform = 'translateY(0)';
                    }
                    if(entry.target.classList.contains('slide-in-on-scroll')) {
                        entry.target.style.opacity = '1';
                        entry.target.style.transform = 'translateX(0)';
                    }
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });

        document.querySelectorAll('.fade-up-on-scroll, .slide-in-on-scroll').forEach(section => {
            observer.observe(section);
        });
    }

    // Fixed dark mode toggle function
    function toggleDarkMode() {
        const isDark = document.documentElement.classList.toggle('dark');
        if (isDark) {
            localStorage.setItem('theme', 'dark');
        } else {
            localStorage.setItem('theme', 'light');
        }
    }

    init();
});
