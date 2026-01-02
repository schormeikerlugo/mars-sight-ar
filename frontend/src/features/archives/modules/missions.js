/**
 * Missions Module
 * Handles mission loading, rendering, and selection
 */

import { api } from '../../../js/services/api.js';

export class MissionsManager {
    constructor(controller) {
        this.controller = controller;
        this.missions = [];
        this.activeMissionId = null;
    }

    get dom() {
        return this.controller.dom;
    }

    async loadMissions() {
        this.dom.missionList.innerHTML = '<div style="padding:20px; color:#aaa;">Cargando...</div>';
        this.missions = await api.getMissions();
        this.renderMissions();

        if (this.missions.length > 0) {
            await this.selectMission(this.missions[0].id);
        } else {
            await this.selectOrphaned();
        }
    }

    async selectOrphaned() {
        this.activeMissionId = 'orphaned';
        this.renderMissions();
        this.dom.headerTitle.textContent = "OBJETOS SIN MISIÓN";
        this.dom.grid.innerHTML = '<div style="padding:20px;">Buscando huérfanos...</div>';

        this.controller.currentObjects = await api.getOrphanedObjects();
        this.controller.objectsGrid.renderGrid();
    }

    renderMissions() {
        const existingHeader = this.dom.missionList.querySelector('.panel-header');
        const existingFilters = this.dom.missionList.querySelector('.status-filters');

        this.dom.missionList.innerHTML = '';

        if (existingHeader) this.dom.missionList.appendChild(existingHeader);
        if (existingFilters) this.dom.missionList.appendChild(existingFilters);

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

        // Orphaned card
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
        this.renderMissions();

        const mission = this.missions.find(m => m.id === id);
        const isOrphaned = id === 'orphaned';
        const titleText = isOrphaned ? "OBJETOS SIN MISIÓN" : (mission.titulo || mission.codigo).toUpperCase();

        let headerHtml = `<span>${titleText}</span>`;
        if (mission && !isOrphaned) {
            if (mission.estado === 'activa') {
                headerHtml += ` <button id="btn-force-end" style="background:#ff9900; border:none; color:black; padding:5px 10px; border-radius:4px; font-size:0.7rem; cursor:pointer; margin-left:10px;">FINALIZAR</button>`;
            }
            headerHtml += ` <button id="btn-delete-mission" style="background:transparent; border:1px solid #ff4444; color:#ff4444; padding:4px 8px; border-radius:4px; font-size:0.7rem; cursor:pointer; margin-left:10px;">ELIMINAR 🗑️</button>`;
        }
        this.dom.headerTitle.innerHTML = headerHtml;

        this.bindMissionActions(mission);

        this.dom.grid.innerHTML = '<div style="padding:20px;">Cargando registros...</div>';
        this.controller.currentObjects = await api.getMissionObjects(id);
        this.controller.filteredObjects = [...this.controller.currentObjects];
        this.controller.objectsGrid.renderGrid();
    }

    bindMissionActions(mission) {
        const btnForce = document.getElementById('btn-force-end');
        if (btnForce && mission) {
            btnForce.onclick = async (e) => {
                e.stopPropagation();
                if (confirm("¿Forzar finalización de esta misión?")) {
                    btnForce.textContent = "...";
                    await api.endMission(mission.id);
                    await this.loadMissions();
                }
            };
        }

        const btnDeleteMission = document.getElementById('btn-delete-mission');
        if (btnDeleteMission && mission) {
            btnDeleteMission.onclick = async (e) => {
                e.stopPropagation();
                if (confirm(`⚠️ ¿ELIMINAR MISIÓN Y TODOS SUS OBJETOS?\n\nEsta acción no se puede deshacer.`)) {
                    btnDeleteMission.textContent = "...";
                    const res = await api.deleteMission(mission.id);
                    if (res.success) {
                        await this.loadMissions();
                    } else {
                        alert("Error: " + res.error);
                        btnDeleteMission.textContent = "Error";
                    }
                }
            };
        }
    }
}
