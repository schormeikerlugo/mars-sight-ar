import { supabase } from '../auth.js';

export class RealtimeService {
    constructor() {
        this.channel = null;
        this.userCache = {}; // Cache user emails
        this.init();
    }

    init() {
        console.log("RealtimeService: Connecting...");

        this.channel = supabase
            .channel('public:misiones') // Listen to misiones table
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'misiones' },
                (payload) => {
                    this.handleMissionEvent(payload);
                }
            )
            .subscribe((status, err) => {
                if (status === 'SUBSCRIBED') {
                    console.log("Realtime: Connected to Missions Channel ✅");
                    // Status is now shown in dashboard service check
                } else {
                    console.warn(`Realtime Status: ${status}`, err);
                }

                if (status === 'CHANNEL_ERROR') {
                    console.error("Realtime Error: Check if 'misiones' table has Realtime enabled in Supabase Dashboard > Database > Replication.");
                }
            });
    }

    /**
     * Get user email from user_id (with caching)
     */
    async getUserEmail(userId) {
        if (!userId) return 'Sistema';
        if (this.userCache[userId]) return this.userCache[userId];

        try {
            const { data, error } = await supabase
                .from('auth.users')
                .select('email')
                .eq('id', userId)
                .single();

            if (error || !data) {
                // Fallback: Use first 8 chars of UUID
                const shortId = userId.substring(0, 8);
                this.userCache[userId] = `Usuario-${shortId}`;
                return this.userCache[userId];
            }

            const email = data.email.split('@')[0]; // Get username from email
            this.userCache[userId] = email;
            return email;
        } catch (e) {
            const shortId = userId.substring(0, 8);
            this.userCache[userId] = `Usuario-${shortId}`;
            return this.userCache[userId];
        }
    }

    async handleMissionEvent(payload) {
        if (!window.kepler || !window.kepler.notify) return;

        console.log("Realtime Event:", payload);

        const { eventType, new: newRec, old: oldRec } = payload;
        const userEmail = await this.getUserEmail(newRec?.user_id || oldRec?.user_id);

        if (eventType === 'INSERT') {
            window.kepler.notify.info(`📡 NUEVA MISIÓN DETECTADA`);
            window.kepler.notify.success(`Código: ${newRec.codigo || 'S/N'} | Zona: ${newRec.zona || 'Sin definir'}\n👤 por ${userEmail}`);
        }
        else if (eventType === 'UPDATE') {
            if (newRec.estado !== oldRec?.estado) {
                if (newRec.estado === 'completada') {
                    // Fetch mission stats
                    await this.showMissionCompletionStats(newRec, userEmail);
                }
                else if (newRec.estado === 'activa') {
                    window.kepler.notify.warning(`🚀 MISIÓN ACTIVADA: ${newRec.codigo}\n👤 por ${userEmail}`);
                }
            }
        }
        else if (eventType === 'DELETE') {
            window.kepler.notify.warning(`⚠️ Misión eliminada del registro central.\n👤 por ${userEmail}`);
        }
    }

    async showMissionCompletionStats(mission, userEmail = 'Sistema') {
        try {
            // Dynamically import api to get mission objects
            const { api } = await import('./api.js');
            const objects = await api.getMissionObjects(mission.id);

            // Calculate stats
            const totalObjects = objects?.length || 0;
            const manualObjects = objects?.filter(o => o.metadata?.source === 'manual')?.length || 0;
            const checkpoints = objects?.filter(o => o.tipo === 'checkpoint' || o.tipo === 'punto_asentamiento')?.length || 0;

            // Calculate duration
            const startTime = mission.inicio_at ? new Date(mission.inicio_at) : null;
            const endTime = mission.fin_at ? new Date(mission.fin_at) : new Date();
            let duration = 'N/A';
            if (startTime) {
                const diffMs = endTime - startTime;
                const mins = Math.floor(diffMs / 60000);
                const hrs = Math.floor(mins / 60);
                duration = hrs > 0 ? `${hrs}h ${mins % 60}m` : `${mins}m`;
            }

            // Show detailed notification with user attribution
            window.kepler.notify.success(
                `✅ MISIÓN COMPLETADA: ${mission.codigo}\n` +
                `👤 por ${userEmail}\n` +
                `📍 Zona: ${mission.zona || 'Sin definir'}\n` +
                `⏱️ Duración: ${duration}\n` +
                `📦 Objetos registrados: ${totalObjects}\n` +
                `✋ Objetos manuales: ${manualObjects}\n` +
                `🏕️ Puntos de asentamiento: ${checkpoints}`
            );
        } catch (e) {
            console.error('Error fetching mission stats:', e);
            window.kepler.notify.success(`✅ MISIÓN COMPLETADA: ${mission.codigo}\n👤 por ${userEmail}`);
        }
    }
}
