import { api } from '../../js/services/api.js';
import { auth } from '../../js/auth.js';
import { taxonomiaApi } from '../taxonomia/api.js';

// Legacy fallback categories (will be replaced by API data)
const LEGACY_CATEGORIES = {
    "PERSONAS": { subs: ["Civil", "Trabajador", "Desconocido"], hasGender: true },
    "ANIMALES": { subs: ["Mascota", "Ave", "Fauna Silvestre"], hasGender: true },
    "ESTRUCTURAS": { subs: ["Puente", "Refugio", "Vehículo"], hasGender: false },
    "Sin Clasificar": { subs: ["Genérico"], hasGender: false }
};

class ArchivesController {
    constructor() {
        this.missions = [];
        this.currentObjects = [];
        this.filteredObjects = [];
        this.activeMissionId = null;
        this.selectedObject = null;
        
        // Taxonomy data from API
        this.apiCategories = [];
        this.apiTags = [];
        this.selectedTagIds = [];
        
        // Active filters
        this.filterCategoryId = '';
        this.filterTagId = '';
        
        this.dom = {
            missionList: document.getElementById('mission-list'),
            grid: document.getElementById('evidence-grid'),
            headerTitle: document.getElementById('current-mission-title'),
            modal: document.getElementById('detail-modal'),
            btnCloseModal: document.getElementById('btn-close-modal'),
            
            // Detail Inputs
            img: document.getElementById('detail-img'),
            inpTitle: document.getElementById('inp-detail-title'),
            inpDesc: document.getElementById('inp-detail-desc'),
            
            // Selects
            inpCategory: document.getElementById('inp-detail-category'),
            inpSub: document.getElementById('inp-detail-subcategory'),
            domGender: document.getElementById('group-gender'),
            inpGender: document.getElementById('inp-detail-gender'),
            tagsSelector: document.getElementById('tags-selector'),

            // Filters
            filterCategory: document.getElementById('filter-category'),
            filterTag: document.getElementById('filter-tag'),

            btnSave: document.getElementById('btn-save-obj'),
            btnDelete: document.getElementById('btn-delete-obj')
        };
        
        this.init();
    }

    async init() {
        const user = await auth.getUser();
        if(!user) {
            window.location.href = '../../index.html';
            return;
        }

        await this.loadTaxonomy();
        this.bindEvents();
        await this.loadMissions();
    }

    async loadTaxonomy() {
        try {
            // Load categories and tags from API
            this.apiCategories = await taxonomiaApi.getCategories();
            this.apiTags = await taxonomiaApi.getTags();
            
            // Populate filter dropdowns
            this.populateFilterDropdowns();
        } catch (e) {
            console.error('Error loading taxonomy:', e);
        }
    }

    populateFilterDropdowns() {
        // Category filter
        if (this.dom.filterCategory) {
            this.dom.filterCategory.innerHTML = '<option value="" style="background:#1a1a2e;color:#fff;">Todas las Categorías</option>';
            this.apiCategories.forEach(cat => {
                const opt = document.createElement('option');
                opt.value = cat.id;
                opt.textContent = cat.nombre;
                opt.style.background = '#1a1a2e';
                opt.style.color = '#fff';
                this.dom.filterCategory.appendChild(opt);
            });
        }
        
        // Tag filter
        if (this.dom.filterTag) {
            this.dom.filterTag.innerHTML = '<option value="" style="background:#1a1a2e;color:#fff;">Todas las Etiquetas</option>';
            this.apiTags.forEach(tag => {
                const opt = document.createElement('option');
                opt.value = tag.id;
                opt.textContent = tag.nombre;
                opt.style.background = '#1a1a2e';
                opt.style.color = '#fff';
                this.dom.filterTag.appendChild(opt);
            });
        }
    }

    bindEvents() {
        this.dom.btnCloseModal.addEventListener('click', () => this.closeModal());
        
        this.dom.btnSave.addEventListener('click', async () => {
             if(this.selectedObject) {
                 await this.saveObject();
             }
        });
        
        this.dom.btnDelete.addEventListener('click', async () => {
            if(this.selectedObject && confirm("¿Eliminar este registro permanentemente?")) {
                await this.deleteObject();
            }
        });

        // Dynamic Category Change - Load subcategories from API
        this.dom.inpCategory.addEventListener('change', async () => {
             await this.updateSubcategoriesFromApi(this.dom.inpCategory.value);
        });

        // Filter handlers
        if (this.dom.filterCategory) {
            this.dom.filterCategory.addEventListener('change', () => {
                this.filterCategoryId = this.dom.filterCategory.value;
                this.applyFilters();
            });
        }
        
        if (this.dom.filterTag) {
            this.dom.filterTag.addEventListener('change', () => {
                this.filterTagId = this.dom.filterTag.value;
                this.applyFilters();
            });
        }
    }

    applyFilters() {
        if (!this.filterCategoryId && !this.filterTagId) {
            this.filteredObjects = [...this.currentObjects];
        } else {
            this.filteredObjects = this.currentObjects.filter(obj => {
                let matchesCat = true;
                let matchesTag = true;
                
                if (this.filterCategoryId) {
                    matchesCat = obj.categoria_id === this.filterCategoryId;
                }
                
                // Tag filtering would require object tags to be loaded
                // For now, we'll skip tag filtering until tags are loaded per object
                
                return matchesCat && matchesTag;
            });
        }
        this.renderGrid();
    }

    async updateSubcategoriesFromApi(categoryId) {
        const subSelect = this.dom.inpSub;
        subSelect.innerHTML = '<option value="" style="background:#1a1a2e;color:#fff;">Cargando...</option>';
        
        if (!categoryId) {
            subSelect.innerHTML = '<option value="" style="background:#1a1a2e;color:#fff;">Seleccionar primero categoría</option>';
            this.dom.domGender.style.display = 'none';
            return;
        }
        
        try {
            const subcats = await taxonomiaApi.getSubcategories(categoryId);
            subSelect.innerHTML = '<option value="" style="background:#1a1a2e;color:#fff;">-- Seleccionar --</option>';
            
            subcats.forEach(sub => {
                const opt = document.createElement('option');
                opt.value = sub.id;
                opt.textContent = sub.nombre;
                opt.style.background = '#1a1a2e';
                opt.style.color = '#fff';
                subSelect.appendChild(opt);
            });
            
            // Hide gender for now (can be category-specific later)
            this.dom.domGender.style.display = 'none';
        } catch (e) {
            console.error('Error loading subcategories:', e);
            subSelect.innerHTML = '<option value="" style="background:#1a1a2e;color:#fff;">Error al cargar</option>';
        }
    }

    // Legacy fallback
    updateSubcategories(category, selectedSub = null) {
        const config = LEGACY_CATEGORIES[category];
        const subSelect = this.dom.inpSub;
        subSelect.innerHTML = '';
        
        if(!config) {
            subSelect.innerHTML = '<option value="">Generico</option>';
            this.dom.domGender.style.display = 'none';
            return;
        }

        config.subs.forEach(sub => {
            const opt = document.createElement('option');
            opt.value = sub;
            opt.textContent = sub;
            if(sub === selectedSub) opt.selected = true;
            subSelect.appendChild(opt);
        });

        if(config.hasGender) {
            this.dom.domGender.style.display = 'block';
        } else {
            this.dom.domGender.style.display = 'none';
            this.dom.inpGender.value = ""; 
        }
    }

    populateCategories(selectedCatId = null) {
        const catSelect = this.dom.inpCategory;
        catSelect.innerHTML = '<option value="" style="background:#1a1a2e;color:#fff;">-- Seleccionar Categoría --</option>';
        
        // Use API categories if available, otherwise fall back to legacy
        if (this.apiCategories && this.apiCategories.length > 0) {
            this.apiCategories.forEach(cat => {
                const opt = document.createElement('option');
                opt.value = cat.id;
                opt.textContent = cat.nombre;
                opt.style.background = '#1a1a2e';
                opt.style.color = '#fff';
                if(cat.id === selectedCatId) opt.selected = true;
                catSelect.appendChild(opt);
            });
        } else {
            Object.keys(LEGACY_CATEGORIES).forEach(cat => {
                const opt = document.createElement('option');
                opt.value = cat;
                opt.textContent = cat;
                opt.style.background = '#1a1a2e';
                opt.style.color = '#fff';
                catSelect.appendChild(opt);
            });
        }
    }

    renderTagsSelector(selectedTagIds = []) {
        if (!this.dom.tagsSelector) return;
        
        this.selectedTagIds = [...selectedTagIds];
        
        this.dom.tagsSelector.innerHTML = this.apiTags.map(tag => {
            const isSelected = this.selectedTagIds.includes(tag.id);
            return `
                <div class="tag-chip ${isSelected ? 'selected' : ''}" 
                     data-id="${tag.id}" 
                     style="padding: 5px 12px; border-radius: 15px; cursor: pointer; font-size: 0.8rem;
                            background: ${isSelected ? tag.color : 'rgba(255,255,255,0.1)'};
                            color: ${isSelected ? '#fff' : '#888'};
                            border: 1px solid ${tag.color}44;
                            transition: all 0.2s;">
                    ${tag.nombre}
                </div>
            `;
        }).join('');
        
        // Bind click handlers
        this.dom.tagsSelector.querySelectorAll('.tag-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                const tagId = chip.dataset.id;
                if (this.selectedTagIds.includes(tagId)) {
                    this.selectedTagIds = this.selectedTagIds.filter(id => id !== tagId);
                } else {
                    this.selectedTagIds.push(tagId);
                }
                this.renderTagsSelector(this.selectedTagIds);
            });
        });
    }

    async loadMissions() {
        this.dom.missionList.innerHTML = '<div style="padding:20px; color:#aaa;">Cargando...</div>';
        this.missions = await api.getMissions();
        this.renderMissions();
        
        // Auto-select first if available
        if(this.missions.length > 0) {
            this.selectMission(this.missions[0].id);
        } else {
            this.selectOrphaned();
        }
    }

    async selectOrphaned() {
        this.activeMissionId = 'orphaned';
        this.renderMissions(); // Refresh active state
        this.dom.headerTitle.textContent = "OBJETOS SIN MISIÓN";
        this.dom.grid.innerHTML = '<div style="padding:20px;">Buscanzo huérfanos...</div>';
        
        this.currentObjects = await api.getOrphanedObjects();
        this.renderGrid();
    }

    renderMissions() {
        // Keep panel header and status filters, only replace mission cards
        const existingHeader = this.dom.missionList.querySelector('.panel-header');
        const existingFilters = this.dom.missionList.querySelector('.status-filters');
        
        this.dom.missionList.innerHTML = '';
        
        // Re-add header and filters if they existed
        if (existingHeader) this.dom.missionList.appendChild(existingHeader);
        if (existingFilters) this.dom.missionList.appendChild(existingFilters);
        
        // Add panel header if not present
        if (!existingHeader) {
            const header = document.createElement('div');
            header.className = 'panel-header';
            header.innerHTML = '<span class="panel-title">Misiones Generales</span>';
            this.dom.missionList.appendChild(header);
            
            const filters = document.createElement('div');
            filters.className = 'status-filters';
            filters.innerHTML = `
                <span class="status-badge"><span class="status-dot ongoing"></span> En Curso</span>
                <span class="status-badge"><span class="status-dot active"></span> Activo</span>
                <span class="status-badge"><span class="status-dot completed"></span> Completado</span>
            `;
            this.dom.missionList.appendChild(filters);
        }
        
        // Render mission cards
        this.missions.forEach(m => {
            const card = document.createElement('div');
            card.className = `mission-card ${this.activeMissionId === m.id ? 'active' : ''}`;
            card.onclick = () => this.selectMission(m.id);
            
            const dateStr = new Date(m.inicio_at).toLocaleDateString('es-ES', {
                day: '2-digit', month: '2-digit', year: 'numeric'
            }) + ' - ' + new Date(m.inicio_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
            
            card.innerHTML = `
                <div class="mission-name">${m.titulo || m.codigo}</div>
                <div class="mission-meta">📅 ${dateStr}</div>
                <div class="mission-meta">📍 ${m.zona || 'Sin ubicación'}</div>
            `;
            this.dom.missionList.appendChild(card);
        });
        
        // Add "Orphaned" card
        const orphanCard = document.createElement('div');
        orphanCard.className = `mission-card ${this.activeMissionId === 'orphaned' ? 'active' : ''}`;
        orphanCard.onclick = () => this.selectOrphaned();
        orphanCard.innerHTML = `
            <div class="mission-name">SIN ASIGNAR</div>
            <div class="mission-meta">📦 Items sueltos</div>
        `;
        this.dom.missionList.appendChild(orphanCard);
    }

    async selectMission(id) {
        this.activeMissionId = id;
        this.renderMissions(); // Re-render to update active class
        
        const mission = this.missions.find(m => m.id === id);
        const isOrphaned = id === 'orphaned';
        const titleText = isOrphaned ? "OBJETOS SIN MISIÓN" : (mission.titulo || mission.codigo).toUpperCase();
        
        // Header Controls
        let headerHtml = `<span>${titleText}</span>`;
        if (mission && !isOrphaned) {
             // Force End (if Active)
             if (mission.estado === 'activa') {
                  headerHtml += ` <button id="btn-force-end" style="background:#ff9900; border:none; color:black; padding:5px 10px; border-radius:4px; font-size:0.7rem; cursor:pointer; margin-left:10px;">FINALIZAR</button>`;
             }
             // Delete Mission (Always visible)
             headerHtml += ` <button id="btn-delete-mission" style="background:transparent; border:1px solid #ff4444; color:#ff4444; padding:4px 8px; border-radius:4px; font-size:0.7rem; cursor:pointer; margin-left:10px;">ELIMINAR 🗑️</button>`;
        }
        this.dom.headerTitle.innerHTML = headerHtml;

        // Bind Actions
        const btnForce = document.getElementById('btn-force-end');
        if(btnForce) {
            btnForce.onclick = async (e) => {
                e.stopPropagation();
                if(confirm("¿Forzar finalización de esta misión?")) {
                    btnForce.textContent = "...";
                    await api.endMission(mission.id);
                    await this.loadMissions(); 
                }
            };
        }
        
        const btnDeleteMission = document.getElementById('btn-delete-mission');
        if(btnDeleteMission) {
            btnDeleteMission.onclick = async (e) => {
                 e.stopPropagation();
                 if(confirm(`⚠️ ¿ELIMINAR MISIÓN Y TODOS SUS OBJETOS?\n\nEsta acción no se puede deshacer.`)) {
                      btnDeleteMission.textContent = "...";
                      const res = await api.deleteMission(mission.id);
                      if(res.success) {
                           await this.loadMissions();
                      } else {
                           alert("Error: " + res.error);
                           btnDeleteMission.textContent = "Error";
                      }
                 }
            }
        }
        
        this.dom.grid.innerHTML = '<div style="padding:20px;">Cargando registros...</div>';
        this.currentObjects = await api.getMissionObjects(id);
        this.filteredObjects = [...this.currentObjects];
        this.renderGrid();
    }

    renderGrid() {
        this.dom.grid.innerHTML = '';
        
        const objectsToRender = this.filteredObjects.length > 0 || (this.filterCategoryId || this.filterTagId) 
            ? this.filteredObjects 
            : this.currentObjects;
        
        if(objectsToRender.length === 0) {
            this.dom.grid.innerHTML = '<div class="empty-state">No hay registros visuales en esta misión.</div>';
            return;
        }

        objectsToRender.forEach(obj => {
            const card = document.createElement('div');
            card.className = 'object-card';
            card.onclick = () => this.openDetail(obj);
            
            let imgSrc = '../../assets/placeholder-mars.jpg'; 
            if(obj.metadata && obj.metadata.image_base64) {
                imgSrc = obj.metadata.image_base64;
            }
            
            const dateStr = new Date(obj.created_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
            const displayName = obj.nombre || 'Sin Nombre';
            const hasCategory = obj.categoria_id || obj.subcategoria;
            const categoryClass = hasCategory ? 'categorizado' : 'sin-categorizar';
            const categoryLabel = hasCategory ? 'CATEGORIZADO' : 'SIN CATEGORIZAR';
            
            card.innerHTML = `
                <img src="${imgSrc}" class="object-img" loading="lazy" alt="${displayName}">
                <div class="object-info">
                    <div class="object-category ${categoryClass}">${categoryLabel}</div>
                    <div class="object-name">${displayName}</div>
                    <div class="object-time">${dateStr}</div>
                </div>
            `;
            this.dom.grid.appendChild(card);
        });
    }

    openDetail(obj) {
        this.selectedObject = obj;
        
        // Basic Fields
        this.dom.inpTitle.value = obj.nombre || '';
        this.dom.inpDesc.value = obj.descripcion || (obj.metadata?.description || '');
        
        let imgSrc = '../../assets/placeholder-mars.jpg'; 
        if(obj.metadata && obj.metadata.image_base64) {
            imgSrc = obj.metadata.image_base64;
        }
        this.dom.img.src = imgSrc;

        // Populate Categories from API
        this.populateCategories(obj.categoria_id || null);
        
        // Load subcategories if category exists
        if (obj.categoria_id) {
            this.updateSubcategoriesFromApi(obj.categoria_id).then(() => {
                // Select current subcategory after loading
                if (obj.subcategoria_id && this.dom.inpSub) {
                    this.dom.inpSub.value = obj.subcategoria_id;
                }
            });
        } else {
            this.dom.inpSub.innerHTML = '<option value="">Seleccionar categoría primero</option>';
        }
        
        // Gender
        if(obj.genero) {
             this.dom.inpGender.value = obj.genero;
        } else {
             this.dom.inpGender.value = "";
        }
        
        // Render Tags Selector (empty for now, would need API call to get object's tags)
        this.renderTagsSelector([]); // TODO: Load object's tags from API

        this.dom.modal.style.display = 'flex';
    }

    closeModal() {
        this.dom.modal.style.display = 'none';
        this.selectedObject = null;
    }

    async saveObject() {
        if(!this.selectedObject) return;
        
        const newTitle = this.dom.inpTitle.value;
        const newDesc = this.dom.inpDesc.value;
        const newCatId = this.dom.inpCategory.value;  // categoria_id (UUID)
        const newSubId = this.dom.inpSub.value;       // subcategoria_id (UUID)
        const newGen = this.dom.inpGender.value;
        
        const payload = {
            nombre: newTitle,
            descripcion: newDesc,
            tipo: newCatId ? (this.apiCategories.find(c => c.id === newCatId)?.nombre || 'Desconocido') : this.selectedObject.tipo,
            subcategoria: newSubId ? 'categorizado' : this.selectedObject.subcategoria,
            genero: newGen
        };
        
        this.dom.btnSave.textContent = "GUARDANDO...";
        
        const success = await api.updateObject(this.selectedObject.id, payload);
        
        if(success) {
            // Also update taxonomy if changed
            if (newCatId || this.selectedTagIds.length > 0) {
                try {
                    await taxonomiaApi.assignTaxonomy(this.selectedObject.id, {
                        categoria_id: newCatId || null,
                        subcategoria_id: newSubId || null,
                        etiqueta_ids: this.selectedTagIds
                    });
                } catch (e) {
                    console.error('Error saving taxonomy:', e);
                }
            }
            
            // Update local object
            this.selectedObject.nombre = newTitle;
            this.selectedObject.descripcion = newDesc;
            this.selectedObject.categoria_id = newCatId;
            this.selectedObject.subcategoria_id = newSubId;
            this.selectedObject.genero = newGen;
            
            if(this.selectedObject.metadata) this.selectedObject.metadata.description = newDesc;
            
            this.filteredObjects = [...this.currentObjects];
            this.renderGrid();
            this.closeModal();
        } else {
            alert("Error al guardar cambios.");
        }
        this.dom.btnSave.textContent = "GUARDAR CAMBIOS";
    }

    async deleteObject() {
        if(!this.selectedObject) return;
        
        this.dom.btnDelete.textContent = "...";
        const success = await api.deleteObject(this.selectedObject.id);
        
        if(success) {
            this.currentObjects = this.currentObjects.filter(o => o.id !== this.selectedObject.id);
            this.renderGrid();
            this.closeModal();
        } else {
            alert("Error al eliminar.");
        }
        this.dom.btnDelete.textContent = "ELIMINAR";
    }
}

new ArchivesController();
