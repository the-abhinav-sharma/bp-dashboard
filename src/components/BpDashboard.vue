<template>
  <div class="dashboard-container">
    <!-- Top Navigation Bar -->
    <nav class="top-navbar">
      <div class="brand">
        <span class="brand-icon">❤️</span>
        <span class="brand-name">CardioCare</span>
      </div>
      <div class="user-profile">
        <span class="user-greeting">Welcome, <strong>{{ currentUser }}</strong></span>
        <button @click="handleLogout" class="btn-logout" aria-label="Sign out">
          Logout
        </button>
      </div>
    </nav>

    <!-- Header Banner -->
    <header class="dashboard-header">
      <div class="header-content">
        <div class="header-badge">CardioCare Tracker</div>
        <h1>Blood Pressure & Pulse Dashboard</h1>
        <p>Log daily morning/afternoon/evening readings and monitor your cardiovascular trends.</p>
      </div>
    </header>

    <!-- Global Alert Banner -->
    <div v-if="globalError" class="alert alert-error" role="alert">
      <span>{{ globalError }}</span>
      <button @click="globalError = ''" class="btn-close" aria-label="Close error message">&times;</button>
    </div>

    <div class="dashboard-grid">
      <!-- 1. Entry Form -->
      <section class="card form-card">
        <div class="card-header">
          <h2>Log New Reading</h2>
          <span class="pulse-icon" aria-hidden="true">❤️</span>
        </div>

        <form @submit.prevent="handleFormSubmit" class="bp-form">
          <div class="form-row">
            <div class="form-group">
              <label for="systolic">Systolic <small>(mmHg)</small></label>
              <input
                id="systolic"
                type="number"
                inputmode="numeric"
                pattern="[0-9]*"
                v-model.number="form.systolic"
                required
                min="50"
                max="250"
                placeholder="120"
              />
            </div>
            <div class="form-group">
              <label for="diastolic">Diastolic <small>(mmHg)</small></label>
              <input
                id="diastolic"
                type="number"
                inputmode="numeric"
                pattern="[0-9]*"
                v-model.number="form.diastolic"
                required
                min="30"
                max="150"
                placeholder="80"
              />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="pulse">Pulse <small>(BPM)</small></label>
              <input
                id="pulse"
                type="number"
                inputmode="numeric"
                pattern="[0-9]*"
                v-model.number="form.pulse"
                required
                min="30"
                max="220"
                placeholder="72"
              />
            </div>
            <div class="form-group">
              <label for="timeOfDay">Time of Day</label>
              <select id="timeOfDay" v-model="form.timeOfDay">
                <option value="MORNING">☀️ Morning</option>
                <option value="AFTERNOON">🌤️ Afternoon</option>
                <option value="EVENING">🌙 Evening</option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label for="readingDate">Date</label>
            <input id="readingDate" type="date" v-model="form.readingDate" required />
          </div>

          <div class="form-group">
            <label for="notes">Notes <small>(Optional)</small></label>
            <input
              id="notes"
              type="text"
              v-model="form.notes"
              placeholder="e.g. Post-workout, felt rested"
              maxlength="150"
            />
          </div>

          <!-- Split Status Indicator Card -->
          <div class="status-preview-card">
            <div class="status-info-split">
              <div
                class="split-item"
                :style="{
                  backgroundColor: currentStatus.systolicStatus.bg,
                  borderColor: currentStatus.systolicStatus.pointColor
                }"
              >
                <span class="status-label-text">Systolic</span>
                <span class="badge" :style="{ color: currentStatus.systolicStatus.color }">
                  {{ currentStatus.systolicStatus.label }}
                </span>
              </div>

              <div
                class="split-item"
                :style="{
                  backgroundColor: currentStatus.diastolicStatus.bg,
                  borderColor: currentStatus.diastolicStatus.pointColor
                }"
              >
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
          <div class="period-toggle" role="group" aria-label="Chart time period">
            <button
              v-for="period in filterOptions"
              :key="period"
              :class="{ active: activePeriod === period }"
              @click="setPeriod(period)"
            >
              {{ period }}
            </button>
          </div>
          <button 
              @click="exportPdfForDoctor" 
              :disabled="isExporting || !recentLogs || recentLogs.length === 0"
              class="btn-export-pdf"
            >
              <i v-if="!isExporting" class="fas fa-file-pdf mr-2"></i>
              <i v-else class="fas fa-spinner fa-spin mr-2"></i>
              {{ isExporting ? 'Generating PDF...' : 'Export PDF for Doctor' }}
            </button>
        </div>

        <div class="chart-container">
          <div v-if="isLoading" class="chart-loader">
            <span class="spinner"></span>
            <p>Loading observations...</p>
          </div>
          <Line
            v-else-if="chartData.labels && chartData.labels.length"
            :data="chartData"
            :options="chartOptions"
          />
          <div v-else class="empty-chart">
            <div class="empty-icon">📊</div>
            <p>No health logs recorded for this timeframe.</p>
          </div>
        </div>

        <!-- Summary Statistics Cards Below Chart -->
        <div class="period-summary-bar">
          <div class="summary-card sys">
            <span class="summary-label">Avg Systolic</span>
            <div class="summary-value-group">
              <span class="summary-value">{{ periodAverages.systolic }}</span>
              <span class="summary-unit">mmHg</span>
            </div>
            <span
              v-if="periodAverages.systolic !== '--'"
              class="summary-badge"
              :style="{
                backgroundColor: periodAverages.sysStatus.bg,
                color: periodAverages.sysStatus.color
              }"
            >
              {{ periodAverages.sysStatus.label }}
            </span>
          </div>

          <div class="summary-card dia">
            <span class="summary-label">Avg Diastolic</span>
            <div class="summary-value-group">
              <span class="summary-value">{{ periodAverages.diastolic }}</span>
              <span class="summary-unit">mmHg</span>
            </div>
            <span
              v-if="periodAverages.diastolic !== '--'"
              class="summary-badge"
              :style="{
                backgroundColor: periodAverages.diaStatus.bg,
                color: periodAverages.diaStatus.color
              }"
            >
              {{ periodAverages.diaStatus.label }}
            </span>
          </div>

          <div class="summary-card pulse">
            <span class="summary-label">Avg Pulse</span>
            <div class="summary-value-group">
              <span class="summary-value">{{ periodAverages.pulse }}</span>
              <span class="summary-unit">BPM</span>
            </div>
            <span class="summary-subtext">Overall Heart Rate</span>
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
            <tr v-for="item in recentLogs" :key="item.id || `${item.readingDate}-${item.timeOfDay}`">
              <td class="date-cell">{{ formatDate(item.readingDate) }}</td>
              <td>
                <span class="time-tag" :class="item.timeOfDay.toLowerCase()">
                  {{
                    item.timeOfDay === 'MORNING'
                      ? '☀️ Morning'
                      : item.timeOfDay === 'AFTERNOON'
                      ? '🌤️ Afternoon'
                      : '🌙 Evening'
                  }}
                </span>
              </td>
              <td>
                <span class="bp-value"><strong>{{ item.systolic }}</strong> / {{ item.diastolic }}</span>
                <small class="unit"> mmHg</small>
              </td>
              <td><strong>{{ item.pulse }}</strong> <small class="unit">BPM</small></td>
              <td>
                <div class="table-badges">
                  <span
                    class="badge-pill"
                    :style="{
                      backgroundColor: classifyBp(item.systolic, item.diastolic).systolicStatus.bg,
                      color: classifyBp(item.systolic, item.diastolic).systolicStatus.color
                    }"
                  >
                    SYS: {{ classifyBp(item.systolic, item.diastolic).systolicStatus.label }}
                  </span>
                  <span
                    class="badge-pill"
                    :style="{
                      backgroundColor: classifyBp(item.systolic, item.diastolic).diastolicStatus.bg,
                      color: classifyBp(item.systolic, item.diastolic).diastolicStatus.color
                    }"
                  >
                    DIA: {{ classifyBp(item.systolic, item.diastolic).diastolicStatus.label }}
                  </span>
                </div>
              </td>
              <td class="notes-cell">{{ item.notes || '-' }}</td>
            </tr>
            <tr v-if="!isLoading && !recentLogs.length">
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
import { useRouter } from 'vue-router';
import authService from '@/services/authService';
import bpService from '@/services/bpService';
import type { BpReading, BpStatus, FilterPeriod, SingleCategory } from '@/types/bp';
import { generateBpPdf } from '@/services/bpPdfGenerator';
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  type ChartData,
  type ChartOptions
} from 'chart.js';
import { Line } from 'vue-chartjs';

ChartJS.register(Title, Tooltip, Legend, LineElement, CategoryScale, LinearScale, PointElement);

const router = useRouter();

const currentUser = computed(() => authService.getUsername() || 'User');
const globalError = ref<string>('');
const isLoading = ref<boolean>(false);
const isSubmitting = ref<boolean>(false);

const filterOptions: FilterPeriod[] = ['daily', 'weekly', 'monthly', 'yearly'];
const activePeriod = ref<FilterPeriod>('weekly');
const recentLogs = ref<BpReading[]>([]);
const isExporting = ref<boolean>(false);

const getTodayDate = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const form = reactive<BpReading>({
  systolic: null,
  diastolic: null,
  pulse: null,
  timeOfDay: 'MORNING',
  readingDate: getTodayDate(),
  notes: ''
});

const chartData = ref<ChartData<'line'>>({
  labels: [],
  datasets: []
});

const handleLogout = (): void => {
  authService.logout();
  router.push('/login');
};

const formatDate = (dateStr: string): string => {
  if (!dateStr) return '-';
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

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
  const highestLabel = priorityOrder.find(p => p === sysCat.label || p === diaCat.label) || 'Normal';
  const overall = sysCat.label === highestLabel ? sysCat : diaCat;

  return {
    ...overall,
    systolicStatus: sysCat,
    diastolicStatus: diaCat
  };
};

const currentStatus = computed<BpStatus>(() => classifyBp(form.systolic, form.diastolic));

// Calculate Averages for Active Timeframe
const periodAverages = computed(() => {
  if (!recentLogs.value || !recentLogs.value.length) {
    return {
      systolic: '--',
      diastolic: '--',
      pulse: '--',
      sysStatus: classifyValue(null, 'systolic'),
      diaStatus: classifyValue(null, 'diastolic')
    };
  }

  const validSys = recentLogs.value.filter(r => typeof r.systolic === 'number' && r.systolic > 0);
  const validDia = recentLogs.value.filter(r => typeof r.diastolic === 'number' && r.diastolic > 0);
  const validPulse = recentLogs.value.filter(r => typeof r.pulse === 'number' && r.pulse > 0);

  const avgSys = validSys.length ? Math.round(validSys.reduce((s, r) => s + (r.systolic || 0), 0) / validSys.length) : null;
  const avgDia = validDia.length ? Math.round(validDia.reduce((s, r) => s + (r.diastolic || 0), 0) / validDia.length) : null;
  const avgPulse = validPulse.length ? Math.round(validPulse.reduce((s, r) => s + (r.pulse || 0), 0) / validPulse.length) : null;

  return {
    systolic: avgSys !== null ? avgSys : '--',
    diastolic: avgDia !== null ? avgDia : '--',
    pulse: avgPulse !== null ? avgPulse : '--',
    sysStatus: classifyValue(avgSys, 'systolic'),
    diaStatus: classifyValue(avgDia, 'diastolic')
  };
});

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
  globalError.value = '';
  try {
    isSubmitting.value = true;
    await bpService.logReading(form);

    form.systolic = null;
    form.diastolic = null;
    form.pulse = null;
    form.timeOfDay = 'MORNING';
    form.readingDate = getTodayDate();
    form.notes = '';

    await fetchDashboardData(activePeriod.value);
  } catch (err: any) {
    globalError.value = err.response?.data?.message || 'Failed to submit reading. Please try again.';
  } finally {
    isSubmitting.value = false;
  }
};

const setPeriod = (period: FilterPeriod): void => {
  activePeriod.value = period;
  fetchDashboardData(period);
};

const formatDateString = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const fetchDashboardData = async (period: FilterPeriod): Promise<void> => {
  isLoading.value = true;
  globalError.value = '';

  const end = new Date();
  const start = new Date();

  if (period === 'daily') start.setDate(end.getDate() - 1);
  else if (period === 'weekly') start.setDate(end.getDate() - 7);
  else if (period === 'monthly') start.setMonth(end.getMonth() - 1);
  else if (period === 'yearly') start.setFullYear(end.getFullYear() - 1);

  const startStr = formatDateString(start);
  const endStr = formatDateString(end);

  try {
    const response = await bpService.getReadingsByRange(startStr, endStr);
    const data: BpReading[] = response.data || [];

    const timeOrder: Record<string, number> = { MORNING: 1, AFTERNOON: 2, EVENING: 3 };

    const tableSortedData = [...data].sort((a, b) => {
      if (a.readingDate !== b.readingDate) return b.readingDate.localeCompare(a.readingDate);
      return (timeOrder[a.timeOfDay] ?? 4) - (timeOrder[b.timeOfDay] ?? 4);
    });

    const chartSortedData = [...data].sort((a, b) => {
      if (a.readingDate !== b.readingDate) return a.readingDate.localeCompare(b.readingDate);
      return (timeOrder[a.timeOfDay] ?? 4) - (timeOrder[b.timeOfDay] ?? 4);
    });

    recentLogs.value = tableSortedData;
    buildChart(chartSortedData);
  } catch (error: any) {
    globalError.value = error.response?.data?.message || 'Failed to retrieve blood pressure history.';
  } finally {
    isLoading.value = false;
  }
};

const avg = (arr: number[]): number => (arr.length ? Math.round(arr.reduce((s, v) => s + v, 0) / arr.length) : 0);

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
    aggregatedData = rawData.map(item => {
      const [year, month, day] = item.readingDate.split('-').map(Number);
      const date = new Date(year, month - 1, day);
      const timeAbbr =
        item.timeOfDay === 'MORNING' ? 'Morn' : item.timeOfDay === 'AFTERNOON' ? 'Aft' : 'Eve';

      let label = item.readingDate;
      if (activePeriod.value === 'daily') {
        label =
          item.timeOfDay === 'MORNING'
            ? '☀️ Morning'
            : item.timeOfDay === 'AFTERNOON'
            ? '🌤️ Afternoon'
            : '🌙 Evening';
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
  } else if (activePeriod.value === 'monthly') {
    const groupedByDay = new Map<string, GroupBucket>();

    rawData.forEach(item => {
      if (!groupedByDay.has(item.readingDate)) {
        groupedByDay.set(item.readingDate, { sys: [], dia: [], pulse: [] });
      }
      const group = groupedByDay.get(item.readingDate)!;
      if (typeof item.systolic === 'number') group.sys.push(item.systolic);
      if (typeof item.diastolic === 'number') group.dia.push(item.diastolic);
      if (typeof item.pulse === 'number') group.pulse.push(item.pulse);
    });

    const sortedDates = Array.from(groupedByDay.keys()).sort((a, b) => a.localeCompare(b));

    sortedDates.forEach(dateStr => {
      const values = groupedByDay.get(dateStr)!;
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
  } else if (activePeriod.value === 'yearly') {
    const groupedByMonth = new Map<string, GroupBucket>();

    rawData.forEach(item => {
      const monthKey = item.readingDate.slice(0, 7);
      if (!groupedByMonth.has(monthKey)) {
        groupedByMonth.set(monthKey, { sys: [], dia: [], pulse: [] });
      }
      const group = groupedByMonth.get(monthKey)!;
      if (typeof item.systolic === 'number') group.sys.push(item.systolic);
      if (typeof item.diastolic === 'number') group.dia.push(item.diastolic);
      if (typeof item.pulse === 'number') group.pulse.push(item.pulse);
    });

    const sortedMonths = Array.from(groupedByMonth.keys()).sort((a, b) => a.localeCompare(b));

    sortedMonths.forEach(monthKey => {
      const values = groupedByMonth.get(monthKey)!;
      const [year, month] = monthKey.split('-').map(Number);
      const date = new Date(year, month - 1, 1);
      const formattedLabel = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

      aggregatedData.push({
        label: formattedLabel,
        systolic: avg(values.sys),
        diastolic: avg(values.dia),
        pulse: avg(values.pulse)
      });
    });
  }

  const labels = aggregatedData.map(d => d.label);
  const pointColors = aggregatedData.map(d => classifyBp(d.systolic, d.diastolic).pointColor);

  chartData.value = {
    labels,
    datasets: [
      {
        label: 'Systolic (Avg)',
        data: aggregatedData.map(d => d.systolic),
        borderColor: '#ef4444',
        backgroundColor: '#ef4444',
        pointBackgroundColor: pointColors,
        pointRadius: activePeriod.value === 'yearly' ? 5 : 4,
        tension: 0.3
      },
      {
        label: 'Diastolic (Avg)',
        data: aggregatedData.map(d => d.diastolic),
        borderColor: '#2563eb',
        backgroundColor: '#2563eb',
        pointRadius: activePeriod.value === 'yearly' ? 5 : 4,
        tension: 0.3
      },
      {
        label: 'Pulse (Avg)',
        data: aggregatedData.map(d => d.pulse),
        borderColor: '#0d9488',
        backgroundColor: '#0d9488',
        borderDash: [4, 4],
        pointRadius: 4,
        tension: 0.3
      }
    ]
  };
};

const exportPdfForDoctor = async (): Promise<void> => {
  isExporting.value = true;
  try {
    const end = new Date();
    const start = new Date();
    start.setFullYear(end.getFullYear() - 1);

    const startStr = formatDateString(start);
    const endStr = formatDateString(end);

    const response = await bpService.getReadingsByRange(startStr, endStr);
    const fullLogs: BpReading[] = response.data || [];

    let chartBase64: string | undefined = undefined;

    if (fullLogs.length > 0) {
      // 1. Double the pixel width/height (2x resolution for ultra-sharp PDF output)
      const canvasWidth = 1600;
      const canvasHeight = 700;

      const offscreenCanvas = document.createElement('canvas');
      offscreenCanvas.width = canvasWidth;
      offscreenCanvas.height = canvasHeight;
      const ctx = offscreenCanvas.getContext('2d');

      if (ctx) {
        // Chronological sort
        const timeOrder: Record<string, number> = { MORNING: 1, AFTERNOON: 2, EVENING: 3 };
        const sortedFullData = [...fullLogs].sort((a, b) => {
          if (a.readingDate !== b.readingDate) return a.readingDate.localeCompare(a.readingDate);
          return (timeOrder[a.timeOfDay] ?? 4) - (timeOrder[b.timeOfDay] ?? 4);
        });

        // Group by day
        const groupedByDay = new Map<string, GroupBucket>();
        sortedFullData.forEach((item) => {
          if (!groupedByDay.has(item.readingDate)) {
            groupedByDay.set(item.readingDate, { sys: [], dia: [], pulse: [] });
          }
          const group = groupedByDay.get(item.readingDate)!;
          if (typeof item.systolic === 'number') group.sys.push(item.systolic);
          if (typeof item.diastolic === 'number') group.dia.push(item.diastolic);
          if (typeof item.pulse === 'number') group.pulse.push(item.pulse);
        });

        const sortedDates = Array.from(groupedByDay.keys()).sort((a, b) => a.localeCompare(b));
        const labels: string[] = [];
        const sysData: number[] = [];
        const diaData: number[] = [];
        const pulseData: number[] = [];

        sortedDates.forEach((dateStr) => {
          const values = groupedByDay.get(dateStr)!;
          const [year, month, day] = dateStr.split('-').map(Number);
          const date = new Date(year, month - 1, day);
          labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
          sysData.push(avg(values.sys));
          diaData.push(avg(values.dia));
          pulseData.push(avg(values.pulse));
        });

        // 2. Compute dynamic Y-axis bounds for proper headroom above the highest peak
        const maxSystolic = sysData.length ? Math.max(...sysData) : 140;
        const dynamicYMax = Math.max(maxSystolic + 25, 180); // Gives at least 25mmHg top padding

        const whiteBackgroundPlugin = {
          id: 'customCanvasBackgroundColor',
          beforeDraw: (chart: any) => {
            const { ctx, width, height } = chart;
            ctx.save();
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, width, height);
            ctx.restore();
          }
        };

        const chart = new ChartJS(ctx, {
          type: 'line',
          data: {
            labels,
            datasets: [
              {
                label: 'Systolic (mmHg)',
                data: sysData,
                borderColor: '#ef4444',
                backgroundColor: '#ef4444',
                borderWidth: 4,
                pointRadius: 6,
                pointHoverRadius: 8,
                tension: 0.3
              },
              {
                label: 'Diastolic (mmHg)',
                data: diaData,
                borderColor: '#2563eb',
                backgroundColor: '#2563eb',
                borderWidth: 4,
                pointRadius: 6,
                pointHoverRadius: 8,
                tension: 0.3
              },
              {
                label: 'Pulse (BPM)',
                data: pulseData,
                borderColor: '#0d9488',
                backgroundColor: '#0d9488',
                borderWidth: 4,
                borderDash: [8, 8],
                pointRadius: 6,
                pointHoverRadius: 8,
                tension: 0.3
              }
            ]
          },
          options: {
            responsive: false,
            devicePixelRatio: 2, // Crisp rendering high-DPI output
            animation: false,
            plugins: {
              legend: {
                display: true,
                position: 'top',
                labels: {
                  font: { size: 18, weight: 'bold', family: 'sans-serif' },
                  usePointStyle: true,
                  padding: 20
                }
              }
            },
            scales: {
              y: {
                min: 40,            // Floor to keep bottom lines readable
                max: dynamicYMax,    // Ensures top curve never touches the ceiling
                grid: { color: '#e2e8f0' },
                ticks: {
                  stepSize: 20,
                  font: { size: 16, family: 'sans-serif' },
                  color: '#475569'
                },
                title: {
                  display: true,
                  text: 'mmHg / BPM',
                  font: { size: 16, weight: 'bold', family: 'sans-serif' },
                  color: '#475569'
                }
              },
              x: {
                grid: { display: false },
                ticks: {
                  font: { size: 14, family: 'sans-serif' },
                  color: '#475569',
                  maxRotation: 45
                }
              }
            }
          },
          plugins: [whiteBackgroundPlugin]
        });

        chartBase64 = offscreenCanvas.toDataURL('image/png', 1.0);
        chart.destroy();
      }
    }

    generateBpPdf(fullLogs, currentUser.value, chartBase64);
  } catch (err: any) {
    globalError.value = 'Failed to fetch complete logs for PDF generation.';
  } finally {
    isExporting.value = false;
  }
};

onMounted(() => {
  fetchDashboardData(activePeriod.value);
});
</script>

<style scoped>
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

/* Navbar */
.top-navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #ffffff;
  padding: 12px 20px;
  border-radius: 12px;
  margin-bottom: 16px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.brand {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 800;
  font-size: 18px;
  color: #1e3a8a;
}

.user-profile {
  display: flex;
  align-items: center;
  gap: 16px;
}

.user-greeting {
  font-size: 14px;
  color: #475569;
}

.btn-logout {
  background: #ef4444;
  color: #ffffff;
  border: none;
  padding: 8px 16px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 13px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.btn-logout:hover {
  background: #dc2626;
}

/* Header Banner */
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

/* Alerts */
.alert {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-radius: 10px;
  margin-bottom: 16px;
  font-size: 13px;
  font-weight: 600;
}

.alert-error {
  background-color: #fee2e2;
  color: #991b1b;
  border: 1px solid #fca5a5;
}

.btn-close {
  background: transparent;
  border: none;
  font-size: 18px;
  color: #991b1b;
  cursor: pointer;
}

/* Grid Layout */
.dashboard-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
  margin-bottom: 16px;
}

/* Cards Base */
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

/* Form Styles */
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

.form-group input[type="date"] {
  display: block;
  min-height: 44px !important;
  max-height: 44px !important;
}

/* Split Preview */
.status-preview-card {
  width: 100%;
  box-sizing: border-box;
}

.status-info-split {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.split-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 10px;
  border-radius: 10px;
  border: 1px solid;
  border-left-width: 4px;
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
  cursor: not-allowed;
}

/* Chart Header & Toggle */
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

.chart-loader,
.empty-chart {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #94a3b8;
  font-size: 13px;
}

.spinner {
  width: 24px;
  height: 24px;
  border: 3px solid #e2e8f0;
  border-top-color: #2563eb;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 8px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.empty-icon {
  font-size: 32px;
  margin-bottom: 8px;
}

/* Summary Bar Below Chart */
.period-summary-bar {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid #f1f5f9;
}

.summary-card {
  background: #f8fafc;
  padding: 12px;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  border: 1px solid #e2e8f0;
}

.summary-card.sys {
  border-top: 3px solid #ef4444;
}

.summary-card.dia {
  border-top: 3px solid #2563eb;
}

.summary-card.pulse {
  border-top: 3px solid #0d9488;
}

.summary-label {
  font-size: 11px;
  color: #64748b;
  font-weight: 600;
  text-transform: uppercase;
}

.summary-value-group {
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.summary-value {
  font-size: 20px;
  font-weight: 800;
  color: #0f172a;
}

.summary-unit {
  font-size: 11px;
  color: #94a3b8;
  font-weight: 600;
}

.summary-badge {
  align-self: flex-start;
  padding: 2px 8px;
  border-radius: 6px;
  font-size: 10px;
  font-weight: 700;
  margin-top: 4px;
  text-transform: uppercase;
}

.summary-subtext {
  font-size: 10px;
  color: #94a3b8;
  margin-top: 4px;
}

/* Table */
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

/* Media Queries */
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

  .btn-export-pdf {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.75rem 1.25rem;
  font-size: 0.95rem;
  font-weight: 600;
  color: #ffffff;
  background-color: #2563eb;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  min-height: 44px; /* Touch target standard for mobile */
  width: auto;
}

/* Hover & Disabled States */
.btn-export-pdf:hover:not(:disabled) {
  background-color: #1d4ed8;
}

.btn-export-pdf:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

/* Mobile Responsiveness */
@media (max-width: 640px) {
  .btn-export-pdf {
    width: 100%; /* Spans neatly across mobile screens */
    padding: 0.875rem 1rem;
    font-size: 1rem;
  }
}

}
</style>