<template>
    <div class="dashboard-container">
        <!-- Header Banner -->
        <header class="dashboard-header">
            <div class="header-content">
                <div class="header-badge">CardioCare Tracker</div>
                <h1>Blood Pressure & Pulse Dashboard</h1>
                <p>Log daily morning/afternoon/evening readings and monitor your cardiovascular trends.</p>
            </div>
        </header>

        <div class="dashboard-grid">
            <!-- 1. Entry Form -->
            <section class="card form-card">
                <div class="card-header">
                    <h2>Log New Reading</h2>
                    <span class="pulse-icon">❤️</span>
                </div>

                <form @submit.prevent="handleFormSubmit" class="bp-form">
                    <div class="form-row">
                        <div class="form-group">
                            <label>Systolic <small>(mmHg)</small></label>
                            <input type="number" inputmode="numeric" pattern="[0-9]*" v-model.number="form.systolic"
                                required min="50" max="250" />
                        </div>
                        <div class="form-group">
                            <label>Diastolic <small>(mmHg)</small></label>
                            <input type="number" inputmode="numeric" pattern="[0-9]*" v-model.number="form.diastolic"
                                required min="30" max="150" />
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label>Pulse <small>(BPM)</small></label>
                            <input type="number" inputmode="numeric" pattern="[0-9]*" v-model.number="form.pulse"
                                required min="30" max="220" />
                        </div>
                        <div class="form-group">
                            <label>Time of Day</label>
                            <select v-model="form.timeOfDay">
                                <option value="MORNING">☀️ Morning</option>
                                <option value="AFTERNOON">🌤️ Afternoon</option>
                                <option value="EVENING">🌙 Evening</option>
                            </select>
                        </div>
                    </div>

                    <div class="form-group">
                        <label>Date</label>
                        <input type="date" v-model="form.readingDate" required />
                    </div>

                    <div class="form-group">
                        <label>Notes <small>(Optional)</small></label>
                        <input type="text" v-model="form.notes" placeholder="e.g. Post-workout, felt rested" />
                    </div>

                    <!-- Split Status Indicator Card with Individual Dynamic Colors -->
                    <div class="status-preview-card">
                        <div class="status-info-split">
                            <div class="split-item" 
                                :style="{ backgroundColor: currentStatus.systolicStatus.bg, borderColor: currentStatus.systolicStatus.pointColor }">
                                <span class="status-label-text">Systolic</span>
                                <span class="badge" :style="{ color: currentStatus.systolicStatus.color }">
                                    {{ currentStatus.systolicStatus.label }}
                                </span>
                            </div>
                            
                            <div class="split-item" 
                                :style="{ backgroundColor: currentStatus.diastolicStatus.bg, borderColor: currentStatus.diastolicStatus.pointColor }">
                                <span class="status-label-text">Diastolic</span>
                                <span class="badge" :style="{ color: currentStatus.diastolicStatus.color }">
                                    {{ currentStatus.diastolicStatus.label }}
                                </span>
                            </div>
                        </div>
                    </div>

                    <button type="submit" class="btn-submit" :disabled="isSubmitting">
                        <span v-if="isSubmitting">Saving Entry...</span>
                        <span v-else>Save Reading</span>
                    </button>
                </form>
            </section>

            <!-- 2. Chart Section -->
            <section class="card chart-card">
                <div class="chart-header">
                    <div>
                        <h2>Trends Overview</h2>
                        <p class="sub-text">Systolic vs Diastolic & Pulse progression</p>
                    </div>
                    <div class="period-toggle">
                        <button v-for="period in filterOptions" :key="period"
                            :class="{ active: activePeriod === period }" @click="setPeriod(period)">
                            {{ period }}
                        </button>
                    </div>
                </div>

                <div class="chart-container">
                    <Line v-if="chartData.labels && chartData.labels.length" :data="chartData"
                        :options="chartOptions" />
                    <div v-else class="empty-chart">
                        <div class="empty-icon">📊</div>
                        <p>No health logs recorded for this timeframe.</p>
                    </div>
                </div>
            </section>
        </div>

        <!-- 3. Historical Data Table -->
        <section class="card table-card">
            <div class="card-header">
                <h2>Recent Observations</h2>
            </div>
            <div class="table-wrapper">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Time</th>
                            <th>BP Status</th>
                            <th>Pulse</th>
                            <th>Category</th>
                            <th>Notes</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="item in recentLogs" :key="item.id">
                            <td class="date-cell">{{ item.readingDate }}</td>
                            <td>
                                <span class="time-tag" :class="item.timeOfDay.toLowerCase()">
                                    {{ item.timeOfDay === 'MORNING' ? '☀️ Morning' : item.timeOfDay === 'AFTERNOON' ? '🌤️ Afternoon' : '🌙 Evening' }}
                                </span>
                            </td>
                            <td>
                                <span class="bp-value"><strong>{{ item.systolic }}</strong> / {{ item.diastolic }}</span>
                                <small class="unit"> mmHg</small>
                            </td>
                            <td><strong>{{ item.pulse }}</strong> <small class="unit">BPM</small></td>
                            <td>
                                <div class="table-badges">
                                    <span class="badge-pill" :style="{ backgroundColor: classifyBp(item.systolic, item.diastolic).systolicStatus.bg, color: classifyBp(item.systolic, item.diastolic).systolicStatus.color }">
                                        SYS: {{ classifyBp(item.systolic, item.diastolic).systolicStatus.label }}
                                    </span>
                                    <span class="badge-pill" :style="{ backgroundColor: classifyBp(item.systolic, item.diastolic).diastolicStatus.bg, color: classifyBp(item.systolic, item.diastolic).diastolicStatus.color }">
                                        DIA: {{ classifyBp(item.systolic, item.diastolic).diastolicStatus.label }}
                                    </span>
                                </div>
                            </td>
                            <td class="notes-cell">{{ item.notes || '-' }}</td>
                        </tr>
                        <tr v-if="!recentLogs.length">
                            <td colspan="6" class="no-logs">No blood pressure entries available yet.</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </section>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import bpService from '../services/bpService.ts';
import type { BpReading, BpStatus, FilterPeriod, SingleCategory } from '../types/bp.ts';
import {
    Chart as ChartJS, Title, Tooltip, Legend, LineElement, CategoryScale, LinearScale, PointElement,
    type ChartData, type ChartOptions
} from 'chart.js';
import { Line } from 'vue-chartjs';

ChartJS.register(Title, Tooltip, Legend, LineElement, CategoryScale, LinearScale, PointElement);

const filterOptions: FilterPeriod[] = ['daily', 'weekly', 'monthly', 'yearly'];

const getTodayDate = (): string => new Date().toISOString().split('T')[0] ?? '';

const form = reactive<BpReading>({
    systolic: null,
    diastolic: null,
    pulse: null,
    timeOfDay: 'MORNING',
    readingDate: getTodayDate(),
    notes: ''
});

const isSubmitting = ref<boolean>(false);
const activePeriod = ref<FilterPeriod>('weekly');
const recentLogs = ref<BpReading[]>([]);

const chartData = ref<ChartData<'line'>>({
    labels: [],
    datasets: []
});

const classifyValue = (val: number | null, type: 'systolic' | 'diastolic'): SingleCategory => {
    if (val === null || !val) {
        return { label: 'Pending', color: '#64748b', bg: '#f1f5f9', pointColor: '#64748b' };
    }

    if (type === 'systolic') {
        if (val >= 180) return { label: 'Critically High', color: '#7f1d1d', bg: '#fecaca', pointColor: '#991b1b' };
        if (val >= 140) return { label: 'High', color: '#991b1b', bg: '#fee2e2', pointColor: '#dc2626' };
        if (val > 120) return { label: 'Slightly High', color: '#854d0e', bg: '#fef9c3', pointColor: '#d97706' };
        return { label: 'Normal', color: '#166534', bg: '#dcfce7', pointColor: '#16a34a' };
    } else {
        if (val >= 120) return { label: 'Critically High', color: '#7f1d1d', bg: '#fecaca', pointColor: '#991b1b' };
        if (val >= 90) return { label: 'High', color: '#991b1b', bg: '#fee2e2', pointColor: '#dc2626' };
        if (val > 80) return { label: 'Slightly High', color: '#854d0e', bg: '#fef9c3', pointColor: '#d97706' };
        return { label: 'Normal', color: '#166534', bg: '#dcfce7', pointColor: '#16a34a' };
    }
};

const classifyBp = (systolic: number | null, diastolic: number | null): BpStatus => {
    const sysCat = classifyValue(systolic, 'systolic');
    const diaCat = classifyValue(diastolic, 'diastolic');

    const priorityOrder = ['Critically High', 'High', 'Slightly High', 'Normal', 'Pending'];
    const highestLabel = priorityOrder.find(
        p => p === sysCat.label || p === diaCat.label
    ) || 'Normal';

    const overall = sysCat.label === highestLabel ? sysCat : diaCat;

    return {
        ...overall,
        systolicStatus: sysCat,
        diastolicStatus: diaCat
    };
};

const currentStatus = computed<BpStatus>(() => classifyBp(form.systolic, form.diastolic));

const chartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: {
            position: 'top',
            labels: { font: { family: 'system-ui', size: 12 }, usePointStyle: true }
        }
    },
    scales: {
        y: {
            suggestedMin: 50,
            suggestedMax: 160,
            grid: { color: '#f1f5f9' },
            title: { display: true, text: 'mmHg / BPM', color: '#64748b' }
        },
        x: {
            grid: { display: false },
            ticks: {
                autoSkip: true,
                maxTicksLimit: 12,
                maxRotation: 45,
                minRotation: 0,
                font: { size: 11 }
            }
        }
    }
};

const handleFormSubmit = async (): Promise<void> => {
    try {
        isSubmitting.value = true;
        await bpService.logReading(form);

        form.systolic = null;
        form.diastolic = null;
        form.pulse = null;
        form.readingDate = getTodayDate();
        form.notes = '';

        await fetchDashboardData(activePeriod.value);
    } catch (err: any) {
        alert(err.response?.data?.message || 'Failed to submit reading.');
    } finally {
        isSubmitting.value = false;
    }
};

const setPeriod = (period: FilterPeriod): void => {
    activePeriod.value = period;
    fetchDashboardData(period);
};

const fetchDashboardData = async (period: FilterPeriod): Promise<void> => {
    const end = new Date();
    const start = new Date();

    if (period === 'daily') start.setDate(end.getDate() - 1);
    else if (period === 'weekly') start.setDate(end.getDate() - 7);
    else if (period === 'monthly') start.setMonth(end.getMonth() - 1);
    else if (period === 'yearly') start.setFullYear(end.getFullYear() - 1);

    const startStr = start.toISOString().split('T')[0] ?? '';
    const endStr = end.toISOString().split('T')[0] ?? '';

    try {
        const response = await bpService.getReadingsByRange(startStr, endStr);
        const data: BpReading[] = response.data || [];

        // Define strict chronological rank for time slots
        const timeOrder: Record<string, number> = {
            'MORNING': 1,
            'AFTERNOON': 2,
            'EVENING': 3
        };

        // Sort data: Latest date first, then Morning -> Afternoon -> Evening within the same date
        const sortedData = [...data].sort((a, b) => {
            // 1. Compare dates descending (newest dates on top)
            if (a.readingDate !== b.readingDate) {
                return b.readingDate.localeCompare(a.readingDate);
            }
            
            // 2. Compare timeOfDay ascending (Morning -> Afternoon -> Evening)
            const orderA = timeOrder[a.timeOfDay] ?? 4;
            const orderB = timeOrder[b.timeOfDay] ?? 4;
            return orderA - orderB;
        });

        recentLogs.value = sortedData;
        buildChart(sortedData);
    } catch (error) {
        console.error('Error loading BP data:', error);
    }
};

const avg = (arr: number[]): number => {
    if (!arr.length) return 0;
    return Math.round(arr.reduce((sum, val) => sum + val, 0) / arr.length);
};

interface GroupBucket {
    sys: number[];
    dia: number[];
    pulse: number[];
}

interface AggregatedReading {
    label: string;
    systolic: number;
    diastolic: number;
    pulse: number;
}

const buildChart = (rawData: BpReading[]): void => {
    if (!rawData.length) {
        chartData.value = { labels: [], datasets: [] };
        return;
    }

    let aggregatedData: AggregatedReading[] = [];

    if (activePeriod.value === 'daily' || activePeriod.value === 'weekly') {
        aggregatedData = rawData.map((item) => {
            const [year, month, day] = item.readingDate.split('-').map(Number);
            const date = new Date(year, month - 1, day);
            const timeAbbr = item.timeOfDay === 'MORNING' ? 'AM' : item.timeOfDay === 'AFTERNOON' ? 'PM' : 'Eve';

            let label = item.readingDate;
            if (activePeriod.value === 'daily') {
                label = item.timeOfDay === 'MORNING' ? '☀️ Morning' : 
                        item.timeOfDay === 'AFTERNOON' ? '🌤️ Afternoon' : '🌙 Evening';
            } else {
                const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
                label = `${dayName} ${day} (${timeAbbr})`;
            }

            return {
                label,
                systolic: item.systolic ?? 0,
                diastolic: item.diastolic ?? 0,
                pulse: item.pulse ?? 0
            };
        });
    }
    else if (activePeriod.value === 'monthly') {
        const groupedByDay = new Map<string, GroupBucket>();

        rawData.forEach((item) => {
            if (!groupedByDay.has(item.readingDate)) {
                groupedByDay.set(item.readingDate, { sys: [], dia: [], pulse: [] });
            }
            const group = groupedByDay.get(item.readingDate)!;

            if (typeof item.systolic === 'number') group.sys.push(item.systolic);
            if (typeof item.diastolic === 'number') group.dia.push(item.diastolic);
            if (typeof item.pulse === 'number') group.pulse.push(item.pulse);
        });

        groupedByDay.forEach((values, dateStr) => {
            const [year, month, day] = dateStr.split('-').map(Number);
            const date = new Date(year, month - 1, day);
            const formattedLabel = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

            aggregatedData.push({
                label: formattedLabel,
                systolic: avg(values.sys),
                diastolic: avg(values.dia),
                pulse: avg(values.pulse)
            });
        });
    }
    else if (activePeriod.value === 'yearly') {
        const groupedByMonth = new Map<string, GroupBucket>();

        rawData.forEach((item) => {
            const monthKey = item.readingDate.slice(0, 7);
            if (!groupedByMonth.has(monthKey)) {
                groupedByMonth.set(monthKey, { sys: [], dia: [], pulse: [] });
            }
            const group = groupedByMonth.get(monthKey)!;

            if (typeof item.systolic === 'number') group.sys.push(item.systolic);
            if (typeof item.diastolic === 'number') group.dia.push(item.diastolic);
            if (typeof item.pulse === 'number') group.pulse.push(item.pulse);
        });

        groupedByMonth.forEach((values, monthKey) => {
            const [year, month] = monthKey.split('-').map(Number);
            const date = new Date(year, month - 1, 1);
            // Change year: '2-digit' to year: 'numeric'
            const formattedLabel = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

            aggregatedData.push({
                label: formattedLabel,
                systolic: avg(values.sys),
                diastolic: avg(values.dia),
                pulse: avg(values.pulse)
            });
        });
    }

    const labels = aggregatedData.map((d) => d.label);
    const pointColors = aggregatedData.map((d) => classifyBp(d.systolic, d.diastolic).pointColor);

    chartData.value = {
        labels,
        datasets: [
            {
                label: 'Systolic (Avg)',
                data: aggregatedData.map((d) => d.systolic),
                borderColor: '#ef4444',
                backgroundColor: '#ef4444',
                pointBackgroundColor: pointColors,
                pointRadius: activePeriod.value === 'yearly' ? 5 : 4,
                tension: 0.3
            },
            {
                label: 'Diastolic (Avg)',
                data: aggregatedData.map((d) => d.diastolic),
                borderColor: '#2563eb',
                backgroundColor: '#2563eb',
                pointRadius: activePeriod.value === 'yearly' ? 5 : 4,
                tension: 0.3
            },
            {
                label: 'Pulse (Avg)',
                data: aggregatedData.map((d) => d.pulse),
                borderColor: '#0d9488',
                backgroundColor: '#0d9488',
                borderDash: [4, 4],
                pointRadius: 4,
                tension: 0.3
            }
        ]
    };
};

onMounted(() => {
    fetchDashboardData(activePeriod.value);
});
</script>

<style scoped>
/* Mobile-first base styling with soft medical gradient background */
.dashboard-container {
    max-width: 1280px;
    margin: 0 auto;
    padding: 12px;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    color: #1e293b;
    background: linear-gradient(135deg, #f0f4f9 0%, #e2e8f0 100%);
    min-height: 100vh;
    box-sizing: border-box;
}

/* Header Styling */
.dashboard-header {
    background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
    color: #ffffff;
    padding: 20px;
    border-radius: 16px;
    margin-bottom: 16px;
    box-shadow: 0 10px 15px -3px rgba(37, 99, 235, 0.2);
}

.header-badge {
    display: inline-block;
    background: rgba(255, 255, 255, 0.2);
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.5px;
    text-transform: uppercase;
    margin-bottom: 8px;
}

.dashboard-header h1 {
    font-size: 20px;
    margin: 0 0 6px 0;
    font-weight: 700;
}

.dashboard-header p {
    color: #dbeafe;
    font-size: 13px;
    margin: 0;
    line-height: 1.4;
}

/* Grid Layout Responsive Logic */
.dashboard-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 16px;
    margin-bottom: 16px;
}

/* Cards Base Styling */
.card {
    background: #ffffff;
    border-radius: 16px;
    padding: 16px;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
    border: 1px solid rgba(226, 232, 240, 0.8);
    box-sizing: border-box;
    width: 100%;
}

.card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
}

.card h2 {
    font-size: 17px;
    color: #0f172a;
    margin: 0;
    font-weight: 700;
}

/* Form Layout & Fluid Mobile Fix */
.bp-form {
    display: flex;
    flex-direction: column;
    gap: 14px;
    width: 100%;
    box-sizing: border-box;
}

.form-row {
    display: flex;
    flex-direction: column;
    gap: 12px;
    width: 100%;
}

.form-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
    font-size: 13px;
    font-weight: 600;
    color: #475569;
    width: 100%;
    box-sizing: border-box;
}

.form-group small {
    font-weight: normal;
    color: #94a3b8;
}

/* Unified baseline styling for inputs and selects */
.form-group input,
.form-group select {
    box-sizing: border-box;
    width: 100%;
    max-width: 100%;
    height: 44px;
    padding: 0 12px;
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    font-size: 16px;
    line-height: 44px;
    outline: none;
    background-color: #f8fafc;
    color: #1e293b;
    transition: all 0.2s ease;
    -webkit-appearance: none;
    -moz-appearance: none;
    appearance: none;
}

.form-group input:focus,
.form-group select:focus {
    border-color: #3b82f6;
    background-color: #ffffff;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
}

/* Global iOS Safari Overrides for Date Input */
.form-group input[type="date"] {
    display: block;
    min-height: 44px !important;
    max-height: 44px !important;
    padding-top: 0 !important;
    padding-bottom: 0 !important;
}

.form-group input[type="date"]::-webkit-date-and-time-value {
    display: flex;
    align-items: center;
    height: 44px;
    min-height: 44px;
    margin: 0;
    padding: 0;
    text-align: left;
}

.form-group input[type="date"]::-webkit-calendar-picker-indicator {
    display: block;
    background-size: 16px;
    cursor: pointer;
    opacity: 0.6;
}

/* Container for split preview */
.status-preview-card {
    width: 100%;
    box-sizing: border-box;
}

.status-info-split {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
}

/* Individual boxes that dynamically change background & border colors */
.split-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    padding: 10px;
    border-radius: 10px;
    border: 1px solid;
    border-left-width: 4px; /* Distinct visual indicator on left edge */
    transition: all 0.2s ease;
    box-sizing: border-box;
}

.status-label-text {
    font-size: 11px;
    color: #475569;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.badge {
    font-size: 13px;
    font-weight: 800;
    text-transform: uppercase;
}

.btn-submit {
    background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
    color: #ffffff;
    border: none;
    padding: 14px;
    border-radius: 10px;
    font-weight: 700;
    font-size: 14px;
    cursor: pointer;
    transition: transform 0.1s ease, box-shadow 0.2s ease;
    box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.3);
    width: 100%;
}

.btn-submit:active {
    transform: scale(0.98);
}

.btn-submit:disabled {
    background: #94a3b8;
    box-shadow: none;
}

/* Chart Header & Filters */
.chart-header {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-bottom: 16px;
}

.sub-text {
    margin: 2px 0 0 0;
    font-size: 12px;
    color: #64748b;
}

.period-toggle {
    display: flex;
    background: #f1f5f9;
    padding: 3px;
    border-radius: 10px;
    width: 100%;
    box-sizing: border-box;
}

.period-toggle button {
    flex: 1;
    border: none;
    background: transparent;
    padding: 8px 0;
    font-size: 12px;
    font-weight: 700;
    color: #64748b;
    border-radius: 8px;
    cursor: pointer;
    text-transform: capitalize;
    transition: all 0.2s ease;
}

.period-toggle button.active {
    background: #ffffff;
    color: #2563eb;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.06);
}

.chart-container {
    height: 280px;
    position: relative;
    width: 100%;
}

.empty-chart {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: #94a3b8;
    font-size: 13px;
}

.empty-icon {
    font-size: 32px;
    margin-bottom: 8px;
}

/* Table Responsive Handling */
.table-wrapper {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    width: 100%;
}

.data-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;
    text-align: left;
    white-space: nowrap;
}

.data-table th {
    background: #f8fafc;
    padding: 12px;
    font-weight: 700;
    color: #475569;
    border-bottom: 2px solid #e2e8f0;
}

.data-table td {
    padding: 12px;
    border-bottom: 1px solid #f1f5f9;
}

.date-cell {
    font-weight: 600;
    color: #334155;
}

.time-tag {
    font-size: 11px;
    font-weight: 700;
    padding: 3px 8px;
    border-radius: 6px;
}

.time-tag.morning {
    background: #fef3c7;
    color: #92400e;
}

.time-tag.afternoon {
    background: #e0f2fe;
    color: #0369a1;
}

.time-tag.evening {
    background: #e0e7ff;
    color: #3730a3;
}

.table-badges {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.badge-pill {
    padding: 4px 10px;
    border-radius: 12px;
    font-size: 11px;
    font-weight: 700;
    display: inline-block;
}

.unit {
    color: #94a3b8;
    font-size: 11px;
}

.no-logs {
    text-align: center;
    color: #94a3b8;
    padding: 24px;
}

/* Breakpoint Fixes */
@media (min-width: 480px) {
    .form-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
    }
}

@media (min-width: 768px) {
    .dashboard-container {
        padding: 28px;
    }

    .dashboard-header {
        padding: 32px;
        margin-bottom: 24px;
    }

    .dashboard-header h1 {
        font-size: 28px;
    }

    .dashboard-grid {
        grid-template-columns: 380px 1fr;
        gap: 24px;
        margin-bottom: 24px;
    }

    .card {
        padding: 20px;
    }

    .chart-header {
        flex-direction: row;
        justify-content: space-between;
        align-items: center;
    }

    .period-toggle {
        width: auto;
    }

    .period-toggle button {
        padding: 6px 14px;
    }

    .chart-container {
        height: 340px;
    }
}
</style>