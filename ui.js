(function (global) {
    function getRatingStars(rating) {
        let stars = '';
        const fullStars = Math.floor(rating);
        const halfStar = rating % 1 >= 0.5;
        const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
        
        for(let i = 0; i < fullStars; i++) stars += '<span class="text-yellow-400">★</span>';
        if (halfStar) stars += '<span class="text-yellow-400">★</span>';
        for(let i = 0; i < emptyStars; i++) stars += '<span class="text-yellow-300">☆</span>';
        
        return stars;
    }

    function renderProductCard(product, savedItems, isRecommended = false, isSavedPage = false) {
        const isSaved = savedItems.includes(product.id);
        return `
            <div class="product-card bg-white dark:bg-slate-800 rounded-2xl shadow-lg overflow-hidden flex flex-col transition-all duration-300 animate-fade-up">
                ${isRecommended ? '<div class="absolute top-2 left-2 bg-yellow-400 text-slate-800 text-xs font-bold px-2 py-1 rounded-full z-10">⭐ Recommended</div>' : ''}
                <div class="relative">
                    <img src="${product.thumbnail}" alt="${product.title}" class="w-full h-48 object-cover" onerror="this.src='data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%22300%22%20height%3D%22200%22%3E%3Crect%20width%3D%22100%25%22%20height%3D%22100%25%22%20fill%3D%22%23EBF4FF%22/%3E%3Ctext%20x%3D%2250%25%22%20y%3D%2250%25%22%20dominant-baseline%3D%22middle%22%20text-anchor%3D%22middle%22%20font-family%3D%22Inter%2C%20Arial%22%20font-size%3D%2220%22%20fill%3D%22%231F2937%22%3EImage%20Error%3C/text%3E%3C/svg%3E'">
                    <button data-id="${product.id}" class="save-btn absolute top-3 right-3 p-2 rounded-full bg-white/70 dark:bg-slate-700/70 backdrop-blur-sm transition-all duration-200 hover:scale-110">
                        <span class="heart-icon text-2xl ${isSaved ? 'saved' : 'text-slate-400'}">
                            ${isSaved ? '♥' : '♡'}
                        </span>
                    </button>
                </div>
                <div class="p-4 flex flex-col flex-grow">
                    <span class="text-xs font-semibold text-primary uppercase mb-1">${product.category}</span>
                    <h3 class="text-lg font-bold truncate mb-1">${product.title}</h3>
                    <p class="text-sm text-slate-500 dark:text-slate-400 flex-grow mb-2 line-clamp-2">${product.description}</p>
                    <div class="flex items-baseline justify-between mb-3">
                        <span class="text-2xl font-extrabold text-slate-900 dark:text-white">₹${product.price.toFixed(2)}</span>
                        <span class="text-sm font-medium line-through text-slate-400">₹${(product.price / (1 - product.discountPercentage / 100)).toFixed(2)}</span>
                    </div>
                    <div class="flex items-center space-x-1 text-sm mb-4">
                        ${getRatingStars(product.rating)}
                        <span class="text-slate-500">(${product.rating.toFixed(1)})</span>
                    </div>
                    <button data-id="${product.id}" class="view-details-btn mt-auto w-full px-4 py-2 text-sm font-medium text-center text-primary dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg hover:bg-indigo-200 dark:hover:bg-indigo-900 transition-colors">
                        View Details
                    </button>
                </div>
            </div>
        `;
    }
    
    let carouselIndex = 0;

    function renderProductDetailsModal(product) {
        const dom = global.DOM;
        if (!dom) return;
        dom.modalProductImg.src = product.images[0] || product.thumbnail;
        dom.modalProductImg.alt = product.title;
        dom.modalProductTitle.textContent = product.title;
        dom.modalProductCategory.textContent = product.category;
        dom.modalProductDescription.textContent = product.description;
        dom.modalProductPrice.textContent = `₹${product.price.toFixed(2)}`;
        dom.modalProductDiscount.textContent = `₹${(product.price / (1 - product.discountPercentage / 100)).toFixed(2)}`;
        dom.modalProductRating.innerHTML = getRatingStars(product.rating);
        dom.modalProductRatingText.textContent = `(${product.rating.toFixed(1)})`;
        dom.modalProductBrand.textContent = product.brand;
        dom.modalProductStock.textContent = `${product.stock} in stock`;
        dom.modalProductStock.className = product.stock > 0 ? 'font-medium text-green-500' : 'font-medium text-red-500';
        
        dom.modalSaveBtn.dataset.id = product.id;
        updateModalSaveButtonState(product.id);
    }

    function updateModalSaveButtonState(productId) {
        const dom = global.DOM;
        const saved = (global.AppState && global.AppState.savedItems) ? global.AppState.savedItems : [];
        if (!dom) return;
        if (saved.includes(productId)) {
            dom.modalSaveBtn.textContent = 'Unsave Item';
            dom.modalSaveBtn.classList.remove('btn-primary-gradient');
            dom.modalSaveBtn.classList.add('bg-slate-200', 'dark:bg-slate-700', 'text-slate-800', 'dark:text-slate-200');
        } else {
            dom.modalSaveBtn.textContent = 'Save Item';
            dom.modalSaveBtn.classList.add('btn-primary-gradient');
            dom.modalSaveBtn.classList.remove('bg-slate-200', 'dark:bg-slate-700', 'text-slate-800', 'dark:text-slate-200');
        }
    }

    function renderCategoryGrid(categories) {
        const dom = global.DOM; if (!dom) return;
        dom.categoryGrid.innerHTML = categories.map(category => `
            <a href="#category/${category.slug}" class="category-card p-6 bg-white dark:bg-slate-800 rounded-2xl shadow-lg text-center transition-all duration-300 hover:shadow-xl">
                <h3 class="text-lg font-bold capitalize">${category.name.replace(/-/g, ' ')}</h3>
            </a>
        `).join('');
    }

    function populateCategoryFilter(categories) {
        const dom = global.DOM; if (!dom) return;
        dom.filterCategory.innerHTML = '<option value="">All Categories</option>' + 
            categories.map(category => `<option value="${category.slug}">${category.name}</option>`).join('');
    }

    function renderProductsListPage(categorySlug) {
        const dom = global.DOM; if (!dom) return;
        const allCategories = global.AppState?.allCategories || [];
        const allProducts = global.AppState?.allProducts || [];
        const saved = global.AppState?.savedItems || [];
        const categoryName = allCategories.find(c => c.slug === categorySlug)?.name || categorySlug;
        dom.productListTitle.textContent = `Products in ${categoryName.replace(/-/g, ' ')}`;
        const products = allProducts.filter(p => p.category === categorySlug);
        if (products.length === 0) {
            dom.productListGrid.innerHTML = '<p class="text-slate-500 col-span-full text-center">No products found in this category.</p>';
            return;
        }
        dom.productListGrid.innerHTML = products.map(product => renderProductCard(product, saved)).join('');
    }

    function renderRecommendedPage() {
        const dom = global.DOM; if (!dom) return;
        const saved = global.AppState?.savedItems || [];
        const pool = global.AppState?.recommendationPool || [];
        if (pool.length === 0) {
            dom.recommendedGrid.innerHTML = '';
            dom.noRecommendations.classList.remove('hidden');
        } else {
            dom.recommendedGrid.innerHTML = pool.map(product => renderProductCard(product, saved, true)).join('');
            dom.noRecommendations.classList.add('hidden');
        }
    }

    function renderSavedItemsPage() {
        const dom = global.DOM; if (!dom) return;
        const savedIds = global.AppState?.savedItems || [];
        const allProducts = global.AppState?.allProducts || [];
        if (savedIds.length === 0) {
            dom.savedItemsContainer.innerHTML = '';
            dom.noSavedItems.classList.remove('hidden');
            return;
        }
        dom.noSavedItems.classList.add('hidden');
        const savedProducts = allProducts.filter(p => savedIds.includes(p.id));
        const groupedByCategory = savedProducts.reduce((acc, product) => {
            (acc[product.category] = acc[product.category] || []).push(product);
            return acc;
        }, {});
        dom.savedItemsContainer.innerHTML = Object.entries(groupedByCategory).map(([category, products]) => `
            <div>
                <h2 class="text-2xl font-bold mb-4 capitalize">${category.replace(/-/g, ' ')}</h2>
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    ${products.map(p => renderProductCard(p, savedIds, false, true)).join('')}
                </div>
            </div>
        `).join('');
    }

    function renderFeaturedCarousel(products) {
        const dom = global.DOM; if (!dom) return;
        dom.featuredCarousel.innerHTML = products.slice(0, 5).map(product => `
            <div class="flex-shrink-0 w-full md:w-1/2 lg:w-1/3 p-2">
                <div class="relative bg-white dark:bg-slate-800 rounded-2xl shadow-lg overflow-hidden h-64">
                    <img src="${product.thumbnail}" alt="${product.title}" class="w-full h-full object-cover">
                    <div class="absolute inset-0 bg-black/40 p-6 flex flex-col justify-end">
                        <h3 class="text-2xl font-bold text-white">${product.title}</h3>
                        <p class="text-lg text-yellow-300">${getRatingStars(product.rating)}</p>
                    </div>
                </div>
            </div>
        `).join('');
        startFeaturedCarousel(products.length);
    }

    function startFeaturedCarousel(itemCount) {
        const dom = global.DOM; if (!dom) return;
        setInterval(() => {
            const itemsToDisplay = window.innerWidth < 768 ? 1 : (window.innerWidth < 1024 ? 2 : 3);
            carouselIndex = (carouselIndex + 1) % (itemCount - itemsToDisplay + 1);
            const offset = carouselIndex * (100 / itemsToDisplay);
            dom.featuredCarousel.style.transform = `translateX(-${offset}%)`;
        }, 3000);
    }

    global.UI = {
        getRatingStars,
        renderProductCard,
        renderProductDetailsModal,
        updateModalSaveButtonState,
        renderCategoryGrid,
        populateCategoryFilter,
        renderProductsListPage,
        renderRecommendedPage,
        renderSavedItemsPage,
        renderFeaturedCarousel,
        startFeaturedCarousel,
    };
})(window);
