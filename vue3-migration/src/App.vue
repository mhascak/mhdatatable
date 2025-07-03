<template>
  <div id="app">
    <!-- Theme Toggle Button -->
    <button class="theme-toggle" @click="toggleTheme">
      {{ currentTheme === 'dark' ? 'Light Mode' : 'Dark Mode' }}
    </button>
    
    <!-- Demo Toggle Button -->
    <button class="demo-toggle" @click="toggleDemo">
      {{ showAdvancedDemo ? 'Basic Demo' : 'Advanced Features Demo' }}
    </button>
    
    <h1>Vue 3 Data Table - {{ showAdvancedDemo ? 'Advanced Features Demo' : 'Production Demo' }}</h1>
    
    <!-- Advanced Features Demo -->
    <AdvancedFeaturesDemo v-if="showAdvancedDemo" />
    
    <!-- Basic Demo -->
    <div v-else class="basic-demo">
    
    <!-- Performance Stats -->
    <div class="demo-stats">
      <div class="stat-card">
        <div class="stat-value">{{ data.length.toLocaleString() }}</div>
        <div class="stat-label">Total Records</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ visibleColumns.length }}</div>
        <div class="stat-label">Columns</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ checkedCount }}</div>
        <div class="stat-label">Selected</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">🚀 Enabled</div>
        <div class="stat-label">Virtualization</div>
      </div>
    </div>
    <DataTable
      ref="datatable"
      :data="data"
      :columns="columns"
      :loading="loading"
      :total="total"
      :query="query"
      :selectable="true"
      :virtualized="true"
      :show-pagination="false"
      :height="600"
      grid-name="advanced-demo"
      :support-backup="true"
      :context-menu-options="contextMenuOptions"
      @columns-reordered="handleColumnsReordered"
    >
      <template #header="{ column }">
        <div class="custom-header">
          <span>{{ column.title }}</span>
          <div class="header-icons">
            <span class="filter-icon"></span>
            <HeadSort v-if="column.sortable" :field="column.field" :query="query" />
            <span class="menu-icon" @click.stop="showColumnMenu(column, $event)">⋮</span>
          </div>
        </div>
      </template>
      <template #cell-ticker="{ row }">
        <div class="ticker-cell">
          <div class="ticker-icon">{{ row.ticker.charAt(0) }}</div>
          <div class="ticker-symbol">{{ row.ticker }}</div>
        </div>
      </template>

      <template #cell-company="{ row }">
        <div class="company-cell">
          <div class="company-name">{{ row.company }}</div>
          <div class="company-instrument">{{ row.instrument }}</div>
        </div>
      </template>

      <template #cell-price="{ row }">
        <div class="price-cell">
          ${{ row.price.toLocaleString('en-US', { minimumFractionDigits: 2 }) }}
        </div>
      </template>

      <template #cell-change="{ row }">
        <div class="change-cell" :class="{ 'change-positive': row.change > 0, 'change-negative': row.change < 0 }">
          <span class="change-arrow">{{ row.change > 0 ? '↑' : '↓' }}</span>
          <span class="change-value">{{ row.change > 0 ? '+' : '' }}${{ Math.abs(row.change).toFixed(2) }}</span>
        </div>
      </template>

      <template #cell-changePercent="{ row }">
        <div class="change-percent-cell" :class="{ 'change-positive': row.changePercent > 0, 'change-negative': row.changePercent < 0 }">
          <span class="change-arrow">{{ row.changePercent > 0 ? '↑' : '↓' }}</span>
          <span class="change-value">{{ row.changePercent > 0 ? '+' : '' }}{{ row.changePercent }}%</span>
        </div>
      </template>

      <template #cell-volume="{ row }">
        <div class="volume-cell">
          {{ formatVolume(row.volume) }}
        </div>
      </template>

      <template #cell-marketCap="{ row }">
        <div class="market-cap-cell">
          {{ formatMarketCap(row.marketCap) }}
        </div>
      </template>

      <template #cell-dividend="{ row }">
        <div class="dividend-cell">
          {{ row.dividend > 0 ? `${row.dividend}%` : '—' }}
        </div>
      </template>

      <template #cell-timeline="{ row }">
        <TimelineChart :values="row.timeline" />
      </template>
    </DataTable>

    <!-- Column Menu -->
    <ColumnMenu
      v-if="columnMenuState.show"
      :show="columnMenuState.show"
      :top="columnMenuState.top"
      :left="columnMenuState.left"
      :is-overflow="columnMenuState.isOverflow"
      :is-above="columnMenuState.isAbove"
      :arrow-offset="columnMenuState.arrowOffset"
      :selected-column="columnMenuState.selectedColumn"
      :columns="columns"
      :query="query"
      :xprops="{ eventbus: { emit: () => {}, on: () => {}, off: () => {} } }"
      @update:show="columnMenuState.show = $event"
      @reset-columns="handleResetColumns"
      @reset-filters="handleResetFilters"
    />
    </div> <!-- End of basic-demo -->
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import DataTable from './components/DataTable.vue';
import TimelineChart from './components/TimelineChart.vue';
import HeadSort from './components/Table/HeadSort.vue';
import ColumnMenu from './components/ColumnMenu/ColumnMenu.vue';
import AdvancedFeaturesDemo from './demo/AdvancedFeaturesDemo.vue';
import type { TableColumn, TableQuery } from './types';

// Theme management
const currentTheme = ref<'light' | 'dark'>('dark');

const toggleTheme = () => {
  currentTheme.value = currentTheme.value === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', currentTheme.value);
  localStorage.setItem('theme', currentTheme.value);
};

// Demo toggle management
const showAdvancedDemo = ref(false);

const toggleDemo = () => {
  showAdvancedDemo.value = !showAdvancedDemo.value;
  localStorage.setItem('demo-mode', showAdvancedDemo.value ? 'advanced' : 'basic');
};

// Initialize theme and demo mode from localStorage
onMounted(() => {
  const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
  if (savedTheme) {
    currentTheme.value = savedTheme;
  }
  document.documentElement.setAttribute('data-theme', currentTheme.value);
  
  const savedDemoMode = localStorage.getItem('demo-mode');
  if (savedDemoMode === 'advanced') {
    showAdvancedDemo.value = true;
  }
});

const datatable = ref();
const loading = ref(false);

// Column menu state
const columnMenuState = ref({
  show: false,
  top: 0,
  left: 0,
  isOverflow: false,
  isAbove: false,
  arrowOffset: 20,
  selectedColumn: null as TableColumn | null
});

const contextMenuOptions = ref([
  { text: 'Action 1', action: (row: any) => alert(`Action 1 on ${row.ticker}`) },
  { text: 'Action 2', action: (row: any) => alert(`Action 2 on ${row.ticker}`) }
]);

const columns = ref<TableColumn[]>([
  {
    title: 'Ticker',
    field: 'ticker',
    width: 120,
    fixed: 'left',
    sortable: true,
  },
  {
    title: 'Company',
    field: 'company',
    width: 200,
    sortable: true,
  },
  {
    title: 'Sector',
    field: 'sector',
    width: 120,
    sortable: true,
  },
  {
    title: 'Price',
    field: 'price',
    width: 100,
    sortable: true,
  },
  {
    title: 'Change',
    field: 'change',
    width: 100,
    sortable: true,
  },
  {
    title: 'Change %',
    field: 'changePercent',
    width: 100,
    sortable: true,
  },
  {
    title: 'Volume',
    field: 'volume',
    width: 120,
    sortable: true,
  },
  {
    title: 'Market Cap',
    field: 'marketCap',
    width: 120,
    sortable: true,
  },
  {
    title: 'P/E',
    field: 'pe',
    width: 80,
    sortable: true,
  },
  {
    title: 'Dividend',
    field: 'dividend',
    width: 100,
    sortable: true,
  },
  {
    title: 'Beta',
    field: 'beta',
    width: 80,
    sortable: true,
  },
  {
    title: 'Timeline',
    field: 'timeline',
    width: 200,
    sortable: false,
  },
  {
    title: 'Region',
    field: 'region',
    width: 120,
    fixed: 'right',
    sortable: true,
  }
]);

// Generate complex demo data with 1000+ rows
function generateComplexData(count = 1500) {
  const companies = [
    'Apple Inc.', 'Microsoft Corporation', 'Amazon.com Inc.', 'Alphabet Inc.', 'Tesla Inc.',
    'Meta Platforms Inc.', 'NVIDIA Corporation', 'Berkshire Hathaway', 'Taiwan Semiconductor',
    'UnitedHealth Group', 'Johnson & Johnson', 'Exxon Mobil Corporation', 'JPMorgan Chase',
    'Procter & Gamble', 'Visa Inc.', 'Home Depot', 'Mastercard Inc.', 'Bank of America',
    'Pfizer Inc.', 'Coca-Cola Company', 'Walt Disney Company', 'Netflix Inc.', 'Adobe Inc.',
    'Salesforce Inc.', 'Oracle Corporation', 'Intel Corporation', 'Cisco Systems',
    'PepsiCo Inc.', 'Abbott Laboratories', 'Thermo Fisher Scientific', 'Broadcom Inc.',
    'Costco Wholesale', 'Danaher Corporation', 'Texas Instruments', 'Qualcomm Inc.',
    'Amgen Inc.', 'Honeywell International', 'Union Pacific Corporation', 'Goldman Sachs',
    'IBM Corporation', 'Caterpillar Inc.', 'American Express', 'Boeing Company',
    'McDonald\'s Corporation', 'Starbucks Corporation', 'Nike Inc.', 'PayPal Holdings',
    'Zoom Video Communications', 'Spotify Technology', 'Shopify Inc.', 'Square Inc.'
  ];
  
  const tickers = [
    'AAPL', 'MSFT', 'AMZN', 'GOOGL', 'TSLA', 'META', 'NVDA', 'BRK.A', 'TSM', 'UNH',
    'JNJ', 'XOM', 'JPM', 'PG', 'V', 'HD', 'MA', 'BAC', 'PFE', 'KO', 'DIS', 'NFLX',
    'ADBE', 'CRM', 'ORCL', 'INTC', 'CSCO', 'PEP', 'ABT', 'TMO', 'AVGO', 'COST',
    'DHR', 'TXN', 'QCOM', 'AMGN', 'HON', 'UNP', 'GS', 'IBM', 'CAT', 'AXP', 'BA',
    'MCD', 'SBUX', 'NKE', 'PYPL', 'ZM', 'SPOT', 'SHOP', 'SQ'
  ];
  
  const instruments = ['Stock', 'ETF', 'Bond', 'Crypto', 'REIT', 'Commodity', 'Future', 'Option'];
  const sectors = ['Technology', 'Healthcare', 'Finance', 'Consumer', 'Energy', 'Industrial', 'Materials', 'Utilities'];
  const regions = ['North America', 'Europe', 'Asia Pacific', 'Latin America', 'Middle East', 'Africa'];
  
  return Array.from({ length: count }, (_, i) => {
    const companyIndex = i % companies.length;
    const ticker = tickers[companyIndex] + (i > 49 ? `-${Math.floor(i/50)}` : '');
    const basePrice = 50 + Math.random() * 500;
    const plPercent = (Math.random() - 0.5) * 20; // -10% to +10%
    const volume = Math.floor(Math.random() * 10000000);
    
    return {
      id: i + 1,
      ticker,
      company: companies[companyIndex],
      instrument: instruments[Math.floor(Math.random() * instruments.length)],
      sector: sectors[Math.floor(Math.random() * sectors.length)],
      region: regions[Math.floor(Math.random() * regions.length)],
      price: Number((basePrice).toFixed(2)),
      change: Number((basePrice * plPercent / 100).toFixed(2)),
      changePercent: Number(plPercent.toFixed(2)),
      volume,
      marketCap: Number((basePrice * volume / 1000).toFixed(0)), // Simplified market cap
      pe: Number((15 + Math.random() * 25).toFixed(1)),
      dividend: Number((Math.random() * 5).toFixed(2)),
      beta: Number((0.5 + Math.random() * 1.5).toFixed(2)),
      timeline: Array.from({ length: 30 }, () => Math.floor(Math.random() * 20) + 5),
      pl: Number(plPercent.toFixed(2)),
      totalValue: Number((basePrice * (1000 + Math.random() * 9000)).toFixed(2)),
      lastUpdated: new Date(Date.now() - Math.random() * 86400000).toISOString(),
      _isChecked: false
    };
  });
}

const data = ref(generateComplexData(2000)); // Large dataset for performance testing

const query = ref<TableQuery>({
  limit: 2000, // Show all rows for demo
  offset: 0,
  sort: [],
  filters: []
});

const total = ref(data.value.length);

// Computed properties
const visibleColumns = computed(() => {
  return columns.value.filter(col => col.visible !== false);
});

const checkedCount = computed(() => {
  return data.value.filter(row => row._isChecked).length;
});

// Formatting functions
const formatVolume = (volume: number): string => {
  if (volume >= 1000000) {
    return `${(volume / 1000000).toFixed(1)}M`;
  } else if (volume >= 1000) {
    return `${(volume / 1000).toFixed(1)}K`;
  }
  return volume.toString();
};

const formatMarketCap = (marketCap: number): string => {
  if (marketCap >= 1000000) {
    return `$${(marketCap / 1000000).toFixed(1)}T`;
  } else if (marketCap >= 1000) {
    return `$${(marketCap / 1000).toFixed(1)}B`;
  }
  return `$${marketCap.toFixed(1)}M`;
};

// Column menu functionality
const showColumnMenu = (column: TableColumn, event: MouseEvent) => {
  event.preventDefault();
  event.stopPropagation();
  
  // Get the column header button element
  const buttonElement = event.target as HTMLElement;
  const headerCell = buttonElement.closest('th') || buttonElement.closest('.mh-table-header-cell');
  
  if (!headerCell) {
    console.warn('Could not find header cell for column menu positioning');
    return;
  }
  
  // Get button and header cell positioning
  const buttonRect = buttonElement.getBoundingClientRect();
  const headerRect = headerCell.getBoundingClientRect();
  
  // Calculate smart positioning
  const menuWidth = 230; // Max width of column menu
  const menuHeight = 400; // Approximate height
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const scrollX = window.scrollX;
  const scrollY = window.scrollY;
  
  // Always position menu directly below the header cell
  let top = headerRect.bottom + scrollY + 2; // 2px gap
  let left = headerRect.left + scrollX;
  let isAbove = false;
  
  // Check if menu would overflow on the bottom
  if (top + menuHeight > viewportHeight + scrollY) {
    // Position menu above the header cell
    top = headerRect.top + scrollY - menuHeight - 2; // 2px gap
    isAbove = true;
    console.log('Column menu positioned above header due to bottom overflow');
  }
  
  // Ensure menu doesn't go off-screen on the top
  if (top < scrollY + 10) {
    top = scrollY + 10;
  }
  
  // Check if main menu would overflow on the right - adjust position to keep it visible
  let adjustedLeft = left;
  if (left + menuWidth > viewportWidth) {
    // Shift menu left just enough to keep it fully visible
    adjustedLeft = viewportWidth - menuWidth - 10;
    console.log('Column menu shifted left to stay fully visible');
  }
  
  // Ensure menu doesn't go off-screen on the left
  if (adjustedLeft < scrollX + 10) {
    adjustedLeft = scrollX + 10;
  }
  
  // Detect if submenus should open to the left (when header is near right edge)
  const isOverflow = (headerRect.right + 140) > viewportWidth; // 140px = submenu width
  
  console.log(`Column menu: header at ${headerRect.left}, menu at ${adjustedLeft}, submenus ${isOverflow ? 'left' : 'right'}`);
  
  left = adjustedLeft;
  
  // Calculate arrow position relative to the menu
  const arrowOffset = Math.max(20, Math.min(headerRect.left + scrollX - left + (headerRect.width / 2), menuWidth - 20));
  
  columnMenuState.value = {
    show: true,
    top: top,
    left: left,
    isOverflow: isOverflow,
    isAbove: isAbove,
    arrowOffset: arrowOffset,
    selectedColumn: column
  };

  // Close menu when clicking elsewhere or scrolling
  const closeMenu = () => {
    columnMenuState.value.show = false;
    document.removeEventListener('click', clickListener);
    document.removeEventListener('scroll', scrollListener, true);
    window.removeEventListener('resize', closeMenu);
  };

  const clickListener = (e: MouseEvent) => {
    const columnMenu = document.querySelector('.mh-column-menu');
    if (!columnMenu || !columnMenu.contains(e.target as Node)) {
      closeMenu();
    }
  };

  const scrollListener = () => {
    closeMenu();
  };
  
  // Use setTimeout to avoid immediate closure
  setTimeout(() => {
    document.addEventListener('click', clickListener);
    document.addEventListener('scroll', scrollListener, true); // Capture scroll events
    window.addEventListener('resize', closeMenu); // Close on window resize
  }, 0);
};

// Column reordering handler
const handleColumnsReordered = (reorderedColumns: TableColumn[]) => {
  console.log('Columns reordered:', reorderedColumns);
  columns.value = reorderedColumns;
};

// Column menu handlers
const handleResetColumns = () => {
  // Reset columns to original state
  console.log('Reset columns');
};

const handleResetFilters = () => {
  // Reset filters
  query.value.filters = [];
  console.log('Reset filters');
};


</script>

<style>
@import './styles/advanced-demo.css';
/* Menu component styles are now imported via core.css */

.demo-toggle {
  position: fixed;
  top: 20px;
  right: 160px; /* Position to the left of theme toggle */
  padding: 8px 16px;
  background: var(--mh-color-primary);
  color: var(--mh-color-primary-text);
  border: none;
  border-radius: var(--mh-border-radius);
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  z-index: var(--mh-z-modal);
  transition: all 0.2s ease;
}

.demo-toggle:hover {
  background: var(--mh-color-primary-hover);
  transform: translateY(-1px);
}

.demo-toggle:active {
  transform: translateY(0);
}
</style> 