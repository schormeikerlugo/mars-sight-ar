/**
 * Telemetry Module
 * Handles real-time telemetry polling and display updates
 */

import { api } from '../../../js/services/api.js';

export async function initTelemetry() {
    const tTemp = document.getElementById('telem-temp');
    const tO2 = document.getElementById('telem-o2');
    const tBpm = document.getElementById('telem-bpm');
    const tRad = document.getElementById('telem-rad');

    const update = async () => {
        if (!document.getElementById('telem-temp')) return;

        try {
            const data = await api.getTelemetry();

            if (data) {
                if (tTemp) tTemp.textContent = data.temperature + '°C';
                if (tO2) tO2.textContent = data.oxygen_level + '%';
                if (tBpm) tBpm.textContent = data.heart_rate;
                if (tRad) tRad.textContent = data.radiation;
            } else {
                // Fallback Simulation
                if (tTemp) tTemp.textContent = (20 + Math.random() * 0.5).toFixed(1) + '°C';
                if (tO2) tO2.textContent = (96 + Math.random() * 0.2).toFixed(1) + '%';
                if (tBpm) tBpm.textContent = Math.floor(75 + Math.random() * 5);
                if (tRad) tRad.textContent = (0.011 + Math.random() * 0.001).toFixed(3);
            }

        } catch (err) {
            console.error('Telemetry error:', err);
        }

        setTimeout(update, 2000);
    };

    update();
}
