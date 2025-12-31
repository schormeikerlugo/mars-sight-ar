/**
 * Taxonomia Controller - Mars-Sight AR
 * Gestión de Categorías, Subcategorías y Etiquetas
 */

import template from './taxonomia.html?raw';
import './taxonomia.css';
import { taxonomiaApi } from './api.js';

// Icon mapping
const ICON_MAP = {
    'folder': '📁',
    'user': '👤',
    'paw': '🐾',
    'car': '🚗',
    'map-pin': '📍',
    'home': '🏠',
    'smartphone': '📱',
    'coffee': '☕',
    'alert-triangle': '⚠️',
    'briefcase': '💼',
    'leaf': '🌿',
    'building': '🏗️',
    'help-circle': '❓'
};

export default class TaxonomiaController {
    constructor(container) {
        this.container = container;
        this.categories = [];
        this.subcategories = [];
        this.tags = [];
        this.selectedCategoryId = null;
        this.editingCategoryId = null;
    }

    async init() {
        this.container.innerHTML = template;
        this.cacheDOMElements();
        this.bindEvents();
        await this.loadData();
    }

    cacheDOMElements() {
        // Grids & Containers
        this.categoriesGrid = document.getElementById('categories-grid');
        this.subcategoriesSection = document.getElementById('subcategories-section');
        this.subcategoriesTitle = document.getElementById('subcategories-title');
        this.subcategoriesList = document.getElementById('subcategories-list');
        this.tagsContainer = document.getElementById('tags-container');
        
        // Buttons
        this.btnAddCategory = document.getElementById('btn-add-category');
        this.btnAddSubcategory = document.getElementById('btn-add-subcategory');
        this.btnAddTag = document.getElementById('btn-add-tag');
        
        // Modals
        this.modalCategory = document.getElementById('modal-category');
        this.modalSubcategory = document.getElementById('modal-subcategory');
        this.modalTag = document.getElementById('modal-tag');
        
        // Forms
        this.formCategory = document.getElementById('form-category');
        this.formSubcategory = document.getElementById('form-subcategory');
        this.formTag = document.getElementById('form-tag');
        
        // Toast
        this.toast = document.getElementById('toast');
    }

    bindEvents() {
        // Add buttons
        this.btnAddCategory?.addEventListener('click', () => this.openCategoryModal());
        this.btnAddSubcategory?.addEventListener('click', () => this.openSubcategoryModal());
        this.btnAddTag?.addEventListener('click', () => this.openTagModal());
        
        // Cancel buttons
        document.getElementById('btn-cancel-category')?.addEventListener('click', () => this.closeModal(this.modalCategory));
        document.getElementById('btn-cancel-subcategory')?.addEventListener('click', () => this.closeModal(this.modalSubcategory));
        document.getElementById('btn-cancel-tag')?.addEventListener('click', () => this.closeModal(this.modalTag));
        
        // Form submissions
        this.formCategory?.addEventListener('submit', (e) => this.handleCategorySubmit(e));
        this.formSubcategory?.addEventListener('submit', (e) => this.handleSubcategorySubmit(e));
        this.formTag?.addEventListener('submit', (e) => this.handleTagSubmit(e));
        
        // Close modals on overlay click
        [this.modalCategory, this.modalSubcategory, this.modalTag].forEach(modal => {
            modal?.addEventListener('click', (e) => {
                if (e.target === modal) this.closeModal(modal);
            });
        });
    }

    async loadData() {
        await Promise.all([
            this.loadCategories(),
            this.loadTags()
        ]);
    }

    // ============================================
    // Categories
    // ============================================

    async loadCategories() {
        try {
            this.categories = await taxonomiaApi.getCategories();
            this.renderCategories();
        } catch (e) {
            console.error('Error loading categories:', e);
            this.showToast('Error al cargar categorías');
        }
    }

    renderCategories() {
        if (!this.categoriesGrid) return;
        
        if (this.categories.length === 0) {
            this.categoriesGrid.innerHTML = '<div class="loading-placeholder">No hay categorías</div>';
            return;
        }
        
        this.categoriesGrid.innerHTML = this.categories.map(cat => `
            <div class="category-card ${this.selectedCategoryId === cat.id ? 'selected' : ''}" 
                 data-id="${cat.id}"
                 style="--cat-color: ${cat.color}">
                <div class="category-icon">${ICON_MAP[cat.icono] || '📁'}</div>
                <div class="category-name">${cat.nombre}</div>
                <div class="category-count">${cat.descripcion || ''}</div>
                <div class="category-actions">
                    <button class="btn-icon edit" data-action="edit" data-id="${cat.id}">✏️</button>
                    <button class="btn-icon delete" data-action="delete" data-id="${cat.id}">🗑️</button>
                </div>
            </div>
        `).join('');
        
        // Bind click events
        this.categoriesGrid.querySelectorAll('.category-card').forEach(card => {
            card.addEventListener('click', (e) => {
                const action = e.target.dataset.action;
                const id = e.target.dataset.id || card.dataset.id;
                
                if (action === 'edit') {
                    this.openCategoryModal(id);
                } else if (action === 'delete') {
                    this.deleteCategory(id);
                } else {
                    this.selectCategory(id);
                }
            });
        });
    }

    async selectCategory(categoryId) {
        this.selectedCategoryId = categoryId;
        this.renderCategories();
        
        const category = this.categories.find(c => c.id === categoryId);
        if (category) {
            this.subcategoriesTitle.textContent = `📂 ${category.nombre} - Subcategorías`;
            this.subcategoriesSection.style.display = 'block';
            await this.loadSubcategories(categoryId);
        }
    }

    openCategoryModal(editId = null) {
        this.editingCategoryId = editId;
        const title = document.getElementById('modal-category-title');
        
        if (editId) {
            const cat = this.categories.find(c => c.id === editId);
            if (cat) {
                title.textContent = 'Editar Categoría';
                document.getElementById('cat-nombre').value = cat.nombre;
                document.getElementById('cat-descripcion').value = cat.descripcion || '';
                document.getElementById('cat-color').value = cat.color || '#3498db';
                document.getElementById('cat-icono').value = cat.icono || 'folder';
            }
        } else {
            title.textContent = 'Nueva Categoría';
            this.formCategory.reset();
        }
        
        this.modalCategory.style.display = 'flex';
    }

    async handleCategorySubmit(e) {
        e.preventDefault();
        
        const data = {
            nombre: document.getElementById('cat-nombre').value,
            descripcion: document.getElementById('cat-descripcion').value,
            color: document.getElementById('cat-color').value,
            icono: document.getElementById('cat-icono').value
        };
        
        try {
            let result;
            if (this.editingCategoryId) {
                result = await taxonomiaApi.updateCategory(this.editingCategoryId, data);
            } else {
                result = await taxonomiaApi.createCategory(data);
            }
            
            if (result.success) {
                this.showToast(this.editingCategoryId ? 'Categoría actualizada' : 'Categoría creada');
                this.closeModal(this.modalCategory);
                await this.loadCategories();
            } else {
                this.showToast(`Error: ${result.error}`);
            }
        } catch (e) {
            this.showToast('Error al guardar');
        }
    }

    async deleteCategory(categoryId) {
        if (!confirm('¿Eliminar esta categoría y todas sus subcategorías?')) return;
        
        try {
            const result = await taxonomiaApi.deleteCategory(categoryId);
            if (result.success) {
                this.showToast('Categoría eliminada');
                if (this.selectedCategoryId === categoryId) {
                    this.selectedCategoryId = null;
                    this.subcategoriesSection.style.display = 'none';
                }
                await this.loadCategories();
            }
        } catch (e) {
            this.showToast('Error al eliminar');
        }
    }

    // ============================================
    // Subcategories
    // ============================================

    async loadSubcategories(categoryId) {
        try {
            this.subcategories = await taxonomiaApi.getSubcategories(categoryId);
            this.renderSubcategories();
        } catch (e) {
            console.error('Error loading subcategories:', e);
        }
    }

    renderSubcategories() {
        if (!this.subcategoriesList) return;
        
        if (this.subcategories.length === 0) {
            this.subcategoriesList.innerHTML = '<div class="loading-placeholder">No hay subcategorías. ¡Crea una!</div>';
            return;
        }
        
        this.subcategoriesList.innerHTML = this.subcategories.map(sub => `
            <div class="subcategory-item" data-id="${sub.id}">
                <div>
                    <span class="subcategory-name">${sub.nombre}</span>
                    <span class="subcategory-desc">${sub.descripcion || ''}</span>
                </div>
                <button class="btn-icon delete" data-action="delete">🗑️</button>
            </div>
        `).join('');
        
        // Bind delete events
        this.subcategoriesList.querySelectorAll('.btn-icon.delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = btn.closest('.subcategory-item').dataset.id;
                this.deleteSubcategory(id);
            });
        });
    }

    openSubcategoryModal() {
        if (!this.selectedCategoryId) {
            this.showToast('Selecciona una categoría primero');
            return;
        }
        document.getElementById('subcat-categoria-id').value = this.selectedCategoryId;
        this.formSubcategory.reset();
        this.modalSubcategory.style.display = 'flex';
    }

    async handleSubcategorySubmit(e) {
        e.preventDefault();
        
        const data = {
            categoria_id: document.getElementById('subcat-categoria-id').value,
            nombre: document.getElementById('subcat-nombre').value,
            descripcion: document.getElementById('subcat-descripcion').value
        };
        
        try {
            const result = await taxonomiaApi.createSubcategory(data);
            if (result.success) {
                this.showToast('Subcategoría creada');
                this.closeModal(this.modalSubcategory);
                await this.loadSubcategories(this.selectedCategoryId);
            } else {
                this.showToast(`Error: ${result.error}`);
            }
        } catch (e) {
            this.showToast('Error al guardar');
        }
    }

    async deleteSubcategory(subcategoryId) {
        if (!confirm('¿Eliminar esta subcategoría?')) return;
        
        try {
            const result = await taxonomiaApi.deleteSubcategory(subcategoryId);
            if (result.success) {
                this.showToast('Subcategoría eliminada');
                await this.loadSubcategories(this.selectedCategoryId);
            }
        } catch (e) {
            this.showToast('Error al eliminar');
        }
    }

    // ============================================
    // Tags
    // ============================================

    async loadTags() {
        try {
            this.tags = await taxonomiaApi.getTags();
            this.renderTags();
        } catch (e) {
            console.error('Error loading tags:', e);
        }
    }

    renderTags() {
        if (!this.tagsContainer) return;
        
        if (this.tags.length === 0) {
            this.tagsContainer.innerHTML = '<div class="loading-placeholder">No hay etiquetas</div>';
            return;
        }
        
        this.tagsContainer.innerHTML = this.tags.map(tag => `
            <div class="tag-item" style="background: ${tag.color}22; border-color: ${tag.color}55;" data-id="${tag.id}">
                <span class="tag-color-dot" style="background: ${tag.color}"></span>
                <span>${tag.nombre}</span>
                <button class="tag-delete" data-action="delete">×</button>
            </div>
        `).join('');
        
        // Bind delete events
        this.tagsContainer.querySelectorAll('.tag-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = btn.closest('.tag-item').dataset.id;
                this.deleteTag(id);
            });
        });
    }

    openTagModal() {
        this.formTag.reset();
        this.modalTag.style.display = 'flex';
    }

    async handleTagSubmit(e) {
        e.preventDefault();
        
        const data = {
            nombre: document.getElementById('tag-nombre').value,
            color: document.getElementById('tag-color').value
        };
        
        try {
            const result = await taxonomiaApi.createTag(data);
            if (result.success) {
                this.showToast('Etiqueta creada');
                this.closeModal(this.modalTag);
                await this.loadTags();
            } else {
                this.showToast(`Error: ${result.error}`);
            }
        } catch (e) {
            this.showToast('Error al guardar');
        }
    }

    async deleteTag(tagId) {
        if (!confirm('¿Eliminar esta etiqueta?')) return;
        
        try {
            const result = await taxonomiaApi.deleteTag(tagId);
            if (result.success) {
                this.showToast('Etiqueta eliminada');
                await this.loadTags();
            }
        } catch (e) {
            this.showToast('Error al eliminar');
        }
    }

    // ============================================
    // Utilities
    // ============================================

    closeModal(modal) {
        if (modal) modal.style.display = 'none';
    }

    showToast(message, duration = 3000) {
        if (!this.toast) return;
        this.toast.textContent = message;
        this.toast.style.display = 'block';
        setTimeout(() => {
            this.toast.style.display = 'none';
        }, duration);
    }
}
