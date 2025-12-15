<template>
  <div class="monitor-page-container">
    <div class="page-header">
      <h2 class="page-title">File Delivery Monitor</h2>
      <button @click="toggleConfig" class="config-toggle-btn" :class="{ active: showConfig }">
        <span class="btn-icon">⚙️</span>
        <span class="btn-text">{{ showConfig ? 'Hide Configuration' : 'Show Configuration' }}</span>
      </button>
    </div>

    <div class="content-grid" :class="{ 'has-config': showConfig }">
      <!-- Data Display Section -->
      <div class="data-section">
        <div class="section-header">
          <h3 class="section-title">Recent Files</h3>
          <button @click="fetchFiles" class="refresh-btn" :disabled="loading">
            <span v-if="!loading">🔄 Refresh</span>
            <span v-else>Loading...</span>
          </button>
        </div>

        <!-- Today's Files -->
        <div class="files-card">
          <h4 class="files-date-title">
            <span class="date-icon">📅</span>
            Today ({{ todayDate }})
            <span class="file-count-badge">{{ todayFiles.length }} files</span>
          </h4>
          <div class="files-list" v-if="todayFiles.length > 0">
            <div v-for="(file, index) in todayFiles" :key="index" class="file-item">
              <div class="file-info">
                <span class="file-icon">📄</span>
                <div class="file-details">
                  <span class="file-name">{{ file.name }}</span>
                  <span class="file-delivery-time" v-if="file.deliveryTime">
                    <span class="time-icon">🕐</span>
                    {{ formatDeliveryTime(file.deliveryTime) }}
                  </span>
                </div>
                <span class="file-size">{{ file.size }}</span>
              </div>
              <button @click="downloadFile(file)" class="download-btn" :title="`Download ${file.name}`">
                ⬇️ Download
              </button>
            </div>
          </div>
          <div v-else class="empty-state">
            <span class="empty-icon">📭</span>
            <span>No files delivered today</span>
          </div>
        </div>

        <!-- Yesterday's Files -->
        <div class="files-card">
          <h4 class="files-date-title">
            <span class="date-icon">📅</span>
            Yesterday ({{ yesterdayDate }})
            <span class="file-count-badge">{{ yesterdayFiles.length }} files</span>
          </h4>
          <div class="files-list" v-if="yesterdayFiles.length > 0">
            <div v-for="(file, index) in yesterdayFiles" :key="index" class="file-item">
              <div class="file-info">
                <span class="file-icon">📄</span>
                <div class="file-details">
                  <span class="file-name">{{ file.name }}</span>
                  <span class="file-delivery-time" v-if="file.deliveryTime">
                    <span class="time-icon">🕐</span>
                    {{ formatDeliveryTime(file.deliveryTime) }}
                  </span>
                </div>
                <span class="file-size">{{ file.size }}</span>
              </div>
              <button @click="downloadFile(file)" class="download-btn" :title="`Download ${file.name}`">
                ⬇️ Download
              </button>
            </div>
          </div>
          <div v-else class="empty-state">
            <span class="empty-icon">📭</span>
            <span>No files delivered yesterday</span>
          </div>
        </div>

        <!-- Recent Records Table -->
        <div class="table-card">
          <h4 class="table-title">Recent Delivery Records</h4>
          <div class="table-wrapper">
            <table class="delivery-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>File Count</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(record, index) in recentRecords" :key="index">
                  <td>{{ record.date }}</td>
                  <td>{{ record.count }}</td>
                  <td>
                    <span
                      class="status-badge"
                      :class="record.count < threshold ? 'status-warning' : 'status-ok'"
                    >
                      {{ record.count < threshold ? '⚠️ Alert' : '✓ Normal' }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Monitor Rules Configuration Section -->
      <div v-if="showConfig" class="config-section">
          <div class="section-header">
            <h3 class="section-title">Monitor Rules Configuration</h3>
            <button @click="showConfig = false" class="close-config-btn" title="Close Configuration">
              ✕
            </button>
          </div>

          <div class="config-card">
          <!-- Active Rules Summary -->
          <div class="active-rules-section">
            <h4 class="section-subtitle">
              <span class="label-icon">📋</span>
              Active Rules Summary
            </h4>
            <div class="rules-list">
              <!-- File Count Threshold Rule -->
              <div class="rule-item" :class="{ disabled: !monitorRules.enabled }">
                <div class="rule-info">
                  <div class="rule-header">
                    <span class="rule-sequence">Rule {{ ruleSequenceForThreshold }}</span>
                    <span class="rule-name">File Count Threshold</span>
                    <span class="rule-status" :class="monitorRules.enabled ? 'status-active' : 'status-inactive'">
                      {{ monitorRules.enabled ? '✓ Active' : '✗ Inactive' }}
                    </span>
                  </div>
                  <div class="rule-details">
                    Alert when daily file count is below <strong>{{ monitorRules.threshold }}</strong>
                  </div>
                  <div class="rule-emails" v-if="monitorRules.thresholdEmails && monitorRules.thresholdEmails.filter(e => e.trim()).length > 0">
                    <span class="email-label">📧 Recipients:</span>
                    <div class="email-list-display">
                      <span
                        v-for="(email, emailIdx) in monitorRules.thresholdEmails.filter(e => e.trim())"
                        :key="emailIdx"
                        class="email-badge"
                      >
                        {{ email }}
                      </span>
                    </div>
                  </div>
                </div>
                <label class="rule-switch">
                  <input type="checkbox" v-model="monitorRules.enabled" />
                  <span class="slider-small"></span>
                </label>
              </div>

              <!-- File Prefix SLA Rules -->
              <div
                v-for="(sla, index) in monitorRules.filePrefixSLAs"
                :key="index"
                class="rule-item"
                :class="{ disabled: !sla.enabled }"
              >
                <div class="rule-info">
                  <div class="rule-header">
                    <span class="rule-sequence">Rule {{ ruleSequenceForSLA(index) }}</span>
                    <span class="rule-name">
                      {{ sla.ruleType === 'monthly' ? '📅 Monthly' : '📆 Daily' }} SLA: {{ sla.prefix || 'Unnamed Prefix' }}
                    </span>
                    <span class="rule-status" :class="sla.enabled ? 'status-active' : 'status-inactive'">
                      {{ sla.enabled ? '✓ Active' : '✗ Inactive' }}
                    </span>
                  </div>
                  <div class="rule-details">
                    <span v-if="sla.ruleType === 'monthly'">
                      Alert if files with prefix "<strong>{{ sla.prefix || 'prefix' }}</strong>" are not delivered by the <strong>{{ getDayOrdinal(sla.monthlyDay) }}</strong> of each month
                    </span>
                    <span v-else>
                      Alert if files with prefix "<strong>{{ sla.prefix || 'prefix' }}</strong>" are not delivered by <strong>{{ sla.deadlineTime || '23:00' }}</strong>
                    </span>
                  </div>
                  <div class="rule-emails" v-if="sla.emails && sla.emails.filter(e => e.trim()).length > 0">
                    <span class="email-label">📧 Recipients:</span>
                    <div class="email-list-display">
                      <span
                        v-for="(email, emailIdx) in sla.emails.filter(e => e.trim())"
                        :key="emailIdx"
                        class="email-badge"
                      >
                        {{ email }}
                      </span>
                    </div>
                  </div>
                </div>
                <div class="rule-actions">
                  <label class="rule-switch">
                    <input type="checkbox" v-model="sla.enabled" />
                    <span class="slider-small"></span>
                  </label>
                  <button
                    type="button"
                    @click="confirmDeleteSLA(index)"
                    class="delete-rule-btn"
                    title="Delete this rule"
                  >
                    <span class="delete-icon">🗑️</span>
                  </button>
                </div>
              </div>

              <div v-if="monitorRules.filePrefixSLAs.length === 0 || !monitorRules.filePrefixSLAs.some(sla => sla.prefix)" class="no-rules-hint">
                <span class="hint-icon">ℹ️</span>
                <span>No SLA rules configured. Add rules below to monitor specific file prefixes.</span>
              </div>

            </div>
          </div>

          <form @submit.prevent="saveMonitorRules" class="monitor-form">
            <!-- Threshold Configuration -->
            <div class="form-group">
              <label class="form-label">
                <span class="label-icon">📊</span>
                File Count Threshold
              </label>
              <div class="threshold-input-group">
                <input
                  v-model.number="monitorRules.threshold"
                  type="number"
                  min="1"
                  class="form-input threshold-input"
                  placeholder="20"
                  required
                />
                <span class="input-hint">Alert will be sent when daily file count is below this value</span>
              </div>

              <!-- Email Addresses for Threshold Rule -->
              <div class="rule-email-config">
                <label class="form-label email-sub-label">
                  <span class="label-icon">📧</span>
                  Alert Email Addresses for this rule
                  <span class="label-hint">(Add multiple recipients)</span>
                </label>
                <div class="email-list">
                  <div
                    v-for="(email, index) in monitorRules.thresholdEmails"
                    :key="index"
                    class="email-item"
                  >
                    <input
                      v-model="monitorRules.thresholdEmails[index]"
                      type="email"
                      class="form-input"
                      :placeholder="`Recipient ${index + 1} (e.g., user${index + 1}@example.com)`"
                    />
                    <button
                      type="button"
                      @click="removeThresholdEmail(index)"
                      class="remove-btn"
                      :title="`Remove email ${index + 1}`"
                      v-if="monitorRules.thresholdEmails.length > 1"
                    >
                      ✕
                    </button>
                  </div>
                </div>
                <button
                  type="button"
                  @click="addThresholdEmail"
                  class="add-email-btn"
                >
                  + Add Another Email Address
                </button>
                <div class="email-count-hint" v-if="monitorRules.thresholdEmails.filter(e => e.trim()).length > 0">
                  {{ monitorRules.thresholdEmails.filter(e => e.trim()).length }} recipient(s) configured
                </div>
              </div>
            </div>

            <!-- Monitor Toggle -->
            <div class="form-group">
              <label class="form-label">
                <span class="label-icon">⚙️</span>
                Monitor Status
              </label>
              <div class="switch-group">
                <label class="switch">
                  <input
                    type="checkbox"
                    v-model="monitorRules.enabled"
                  />
                  <span class="slider"></span>
                </label>
                <span class="switch-label">
                  {{ monitorRules.enabled ? 'Monitor Enabled' : 'Monitor Disabled' }}
                </span>
              </div>
            </div>

            <!-- Auto Check Interval -->
            <div class="form-group">
              <label class="form-label">
                <span class="label-icon">⏰</span>
                Auto Check Interval (minutes)
              </label>
              <input
                v-model.number="monitorRules.checkInterval"
                type="number"
                min="1"
                class="form-input"
                placeholder="60"
                required
              />
            </div>

            <!-- File Prefix SLA Monitoring -->
            <div class="form-group">
              <label class="form-label">
                <span class="label-icon">⏱️</span>
                File Prefix SLA Monitoring
                <span class="label-hint">(Monitor specific file prefixes)</span>
              </label>
              <div class="sla-list">
                <div
                  v-for="(sla, index) in monitorRules.filePrefixSLAs"
                  :key="index"
                  class="sla-item"
                >
                  <div class="sla-seq">Rule {{ ruleSequenceForSLA(index) }}</div>
                  <div class="sla-rule-type">
                    <label class="rule-type-label">Rule Type:</label>
                    <select v-model="sla.ruleType" class="form-input rule-type-select">
                      <option value="daily">Daily Delivery</option>
                      <option value="monthly">Monthly Delivery</option>
                    </select>
                  </div>
                  <div class="sla-inputs">
                    <input
                      v-model="sla.prefix"
                      type="text"
                      class="form-input sla-prefix-input"
                      placeholder="ABCfile"
                      required
                    />
                    <!-- Daily rule: time input -->
                    <input
                      v-if="sla.ruleType === 'daily' || !sla.ruleType"
                      v-model="sla.deadlineTime"
                      type="time"
                      class="form-input sla-time-input"
                      required
                    />
                    <!-- Monthly rule: day of month input -->
                    <div v-else class="monthly-day-input-wrapper">
                      <input
                        v-model.number="sla.monthlyDay"
                        type="number"
                        min="1"
                        max="31"
                        class="form-input sla-day-input"
                        placeholder="5"
                        required
                      />
                      <span class="day-suffix">th day</span>
                    </div>
                    <label class="sla-enable-switch" :title="sla.enabled ? 'Disable this rule' : 'Enable this rule'">
                      <input type="checkbox" v-model="sla.enabled" />
                      <span class="slider-small"></span>
                    </label>
                    <button
                      type="button"
                      @click="removeSLA(index)"
                      class="remove-btn"
                      v-if="monitorRules.filePrefixSLAs.length > 1"
                      title="Remove SLA rule"
                    >
                      ✕
                    </button>
                  </div>
                  <div class="sla-hint-row">
                    <span class="sla-hint">
                      <span v-if="sla.ruleType === 'monthly'">
                        Alert if files with prefix "<strong>{{ sla.prefix || 'prefix' }}</strong>" are not delivered by the <strong>{{ getDayOrdinal(sla.monthlyDay) }}</strong> of each month
                      </span>
                      <span v-else>
                        Alert if files with prefix "<strong>{{ sla.prefix || 'prefix' }}</strong>" are not delivered by <strong>{{ sla.deadlineTime || '23:00' }}</strong>
                      </span>
                    </span>
                    <span class="sla-status-badge" :class="sla.enabled ? 'badge-enabled' : 'badge-disabled'">
                      {{ sla.enabled ? 'Enabled' : 'Disabled' }}
                    </span>
                  </div>

                  <!-- Email Addresses for SLA Rule -->
                  <div class="rule-email-config">
                    <label class="form-label email-sub-label">
                      <span class="label-icon">📧</span>
                      Alert Email Addresses for this rule
                      <span class="label-hint">(Add multiple recipients)</span>
                    </label>
                    <div class="email-list">
                      <div
                        v-for="(email, emailIndex) in sla.emails"
                        :key="emailIndex"
                        class="email-item"
                      >
                        <input
                          v-model="sla.emails[emailIndex]"
                          type="email"
                          class="form-input"
                          :placeholder="`Recipient ${emailIndex + 1} (e.g., user${emailIndex + 1}@example.com)`"
                        />
                        <button
                          type="button"
                          @click="removeSLAEmail(index, emailIndex)"
                          class="remove-btn"
                          :title="`Remove email ${emailIndex + 1}`"
                          v-if="sla.emails.length > 1"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                    <button
                      type="button"
                      @click="addSLAEmail(index)"
                      class="add-email-btn"
                    >
                      + Add Another Email Address
                    </button>
                    <div class="email-count-hint" v-if="sla.emails && sla.emails.filter(e => e.trim()).length > 0">
                      {{ sla.emails.filter(e => e.trim()).length }} recipient(s) configured
                    </div>
                  </div>
                </div>
              </div>
              <button
                type="button"
                @click="addSLA"
                class="add-email-btn"
              >
                + Add SLA Rule
              </button>
            </div>

            <!-- Action Buttons -->
            <div class="form-actions">
              <button type="submit" class="save-btn" :disabled="saving">
                {{ saving ? 'Saving...' : '💾 Save Configuration' }}
              </button>
              <button
                type="button"
                @click="testAlert"
                class="test-btn"
                :disabled="testing"
              >
                {{ testing ? 'Testing...' : '🧪 Test Alert' }}
              </button>
            </div>
          </form>

          <!-- Configuration Info -->
          <div class="config-info">
            <h4 class="info-title">Configuration Guide</h4>
            <ul class="info-list">
              <li>The system will automatically monitor daily file delivery counts</li>
              <li>Alert emails will be sent when file count falls below the threshold</li>
              <li>You can add multiple email addresses to receive alerts</li>
              <li>Set a reasonable check interval to avoid frequent checks</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

// API base URL (can be configured via environment variable)
// Default to empty string - will use mock data if not configured
const API_BASE = ''

// Data state
const loading = ref(false)
const saving = ref(false)
const testing = ref(false)
const showConfig = ref(false)
const deliveryData = ref<Array<{ date: string; count: number }>>([])
const filesData = ref<Array<{ date: string; name: string; size: string; deliveryTime?: string; url?: string }>>([])
let checkIntervalId: number | null = null

// Toggle configuration panel
const toggleConfig = () => {
  showConfig.value = !showConfig.value
}

// Monitor rules configuration
const monitorRules = ref({
  threshold: 20,
  thresholdEmails: [''],
  enabled: true,
  checkInterval: 60,
  filePrefixSLAs: [
    { prefix: '', ruleType: 'daily', deadlineTime: '23:00', monthlyDay: 5, enabled: true, emails: [''] }
  ]
})

// Combined rules computed for consistent sequencing (threshold + SLA rules)
const allRules = computed(() => {
  const arr: Array<{ kind: 'threshold' | 'sla'; slaIndex?: number }> = []
  // always include threshold as the first rule
  arr.push({ kind: 'threshold' })
  if (monitorRules.value.filePrefixSLAs && monitorRules.value.filePrefixSLAs.length > 0) {
    monitorRules.value.filePrefixSLAs.forEach((_, i) => arr.push({ kind: 'sla', slaIndex: i }))
  }
  return arr
})

// Return sequence number for threshold (or null if not found)
const ruleSequenceForThreshold = computed(() => {
  const idx = allRules.value.findIndex(r => r.kind === 'threshold')
  return idx >= 0 ? idx + 1 : null
})

// Return sequence number for SLA by its index in filePrefixSLAs
const ruleSequenceForSLA = (index: number) => {
  const idx = allRules.value.findIndex(r => r.kind === 'sla' && r.slaIndex === index)
  return idx >= 0 ? idx + 1 : null
}

// Load configuration from localStorage
const loadConfig = () => {
  const saved = localStorage.getItem('deliveryMonitorConfig')
  if (saved) {
    try {
      const config = JSON.parse(saved)
      monitorRules.value = { ...monitorRules.value, ...config }
      // Ensure thresholdEmails array exists
      if (!monitorRules.value.thresholdEmails || monitorRules.value.thresholdEmails.length === 0) {
        // Migrate old emails to thresholdEmails if exists (for backward compatibility)
        if ('emails' in config && Array.isArray(config.emails) && config.emails.length > 0) {
          monitorRules.value.thresholdEmails = config.emails as string[]
        } else {
          monitorRules.value.thresholdEmails = ['']
        }
      }
      // Ensure filePrefixSLAs array exists
      if (!monitorRules.value.filePrefixSLAs || monitorRules.value.filePrefixSLAs.length === 0) {
        monitorRules.value.filePrefixSLAs = [{ prefix: '', ruleType: 'daily', deadlineTime: '23:00', monthlyDay: 5, enabled: true, emails: [''] }]
      } else {
        // Ensure all SLA rules have required properties
        monitorRules.value.filePrefixSLAs.forEach(sla => {
          if (sla.enabled === undefined) {
            sla.enabled = true
          }
          if (sla.ruleType === undefined) {
            sla.ruleType = 'daily'
          }
          if (sla.deadlineTime === undefined && sla.ruleType === 'daily') {
            sla.deadlineTime = '23:00'
          }
          if (sla.monthlyDay === undefined && sla.ruleType === 'monthly') {
            sla.monthlyDay = 5
          }
          if (!sla.emails || sla.emails.length === 0) {
            sla.emails = ['']
          }
        })
      }
    } catch (e) {
      console.error('Failed to load config:', e)
    }
  }
}

// Save configuration to localStorage
const saveConfig = () => {
  localStorage.setItem('deliveryMonitorConfig', JSON.stringify(monitorRules.value))
}

// Fetch files data
const fetchFiles = async () => {
  loading.value = true
  try {
    // Try to fetch from API if API_BASE is configured
    if (API_BASE) {
      const response = await fetch(`${API_BASE}/deliverystatus`)
      if (response.ok) {
        const data = await response.json()
        // Assume API returns format: [{ date: '2024-01-01', files: [{ name: 'file.txt', size: '1.2MB' }] }, ...]
        if (Array.isArray(data)) {
          filesData.value = data.flatMap((item: { date: string; files?: Array<{ name: string; size: string; url?: string }> }) =>
            (item.files || []).map((file: { name: string; size: string; deliveryTime?: string; url?: string }) => ({
              date: item.date,
              name: file.name,
              size: file.size,
              deliveryTime: file.deliveryTime,
              url: file.url
            }))
          )
        } else if (data.files) {
          filesData.value = data.files
        } else {
          filesData.value = generateMockFiles()
        }
        loading.value = false
        return
      }
    }
    // Use mock data for testing/demo
    filesData.value = generateMockFiles()
    // Also fetch delivery status for the table
    deliveryData.value = generateMockData()
  } catch (err) {
    console.error('Error fetching files:', err)
    // Use mock data as fallback
    filesData.value = generateMockFiles()
    deliveryData.value = generateMockData()
  } finally {
    loading.value = false
  }
}

// Fetch delivery status data (for the table)
const fetchDeliveryStatus = async () => {
  try {
    if (API_BASE) {
      const response = await fetch(`${API_BASE}/deliverystatus`)
      if (response.ok) {
        const data = await response.json()
        if (Array.isArray(data)) {
          deliveryData.value = data
        } else if (data.records) {
          deliveryData.value = data.records
        } else {
          deliveryData.value = generateMockData()
        }
        return
      }
    }
    deliveryData.value = generateMockData()
  } catch (err) {
    console.error('Error fetching delivery status:', err)
    deliveryData.value = generateMockData()
  }
}

// Generate mock files data for testing/demo
const generateMockFiles = () => {
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  const todayStr = today.toISOString().split('T')[0]
  const yesterdayStr = yesterday.toISOString().split('T')[0]

  const files: Array<{ date: string; name: string; size: string; deliveryTime?: string; url?: string }> = []

  // Generate today's files (15-25 files)
  const todayCount = Math.floor(Math.random() * 11) + 15
  for (let i = 1; i <= todayCount; i++) {
    const size = (Math.random() * 5 + 0.5).toFixed(1) // 0.5-5.5 MB
    // Generate random delivery time throughout the day
    const hour = Math.floor(Math.random() * 24)
    const minute = Math.floor(Math.random() * 60)
    const deliveryTime = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`

    // Mix different file prefixes for testing SLA
    const prefixes = ['ABCfile', 'XYZfile', 'delivery', 'report']
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)]

    files.push({
      date: todayStr,
      name: `${prefix}_${todayStr}_${String(i).padStart(3, '0')}.txt`,
      size: `${size} MB`,
      deliveryTime: deliveryTime,
      url: `#file-${todayStr}-${i}`
    })
  }

  // Generate yesterday's files (15-25 files)
  const yesterdayCount = Math.floor(Math.random() * 11) + 15
  for (let i = 1; i <= yesterdayCount; i++) {
    const size = (Math.random() * 5 + 0.5).toFixed(1) // 0.5-5.5 MB
    const hour = Math.floor(Math.random() * 24)
    const minute = Math.floor(Math.random() * 60)
    const deliveryTime = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`

    const prefixes = ['ABCfile', 'XYZfile', 'delivery', 'report']
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)]

    files.push({
      date: yesterdayStr,
      name: `${prefix}_${yesterdayStr}_${String(i).padStart(3, '0')}.txt`,
      size: `${size} MB`,
      deliveryTime: deliveryTime,
      url: `#file-${yesterdayStr}-${i}`
    })
  }

  return files
}

// Generate mock data for testing/demo
const generateMockData = () => {
  const today = new Date()
  const data = []
  // Generate data for the last 14 days
  for (let i = 13; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    // Generate count between 15-25, with some days below threshold (20)
    const count = Math.floor(Math.random() * 12) + 14 // 14-25 range
    data.push({
      date: date.toISOString().split('T')[0],
      count
    })
  }
  // Ensure today has a count
  const todayStr = today.toISOString().split('T')[0]
  const todayIndex = data.findIndex(d => d.date === todayStr)
  if (todayIndex >= 0) {
    data[todayIndex].count = Math.floor(Math.random() * 12) + 14
  }
  return data
}

// 发送警报
const sendAlert = async (message: string, emails?: string[]) => {
  try {
    const emailList = emails || monitorRules.value.thresholdEmails.filter((e: string) => e.trim())
    if (emailList.length === 0) {
      console.warn('No email addresses configured for this alert')
      return
    }

    const response = await fetch(`${API_BASE}/sendalert`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        emails: emailList,
        message,
        threshold: monitorRules.value.threshold,
        currentCount: todayCount.value
      })
    })

    if (!response.ok) {
      throw new Error('Failed to send alert')
    }

    return await response.json()
  } catch (error) {
    console.error('Error sending alert:', error)
    throw error
  }
}

// Check and send alert
const checkAndAlert = async () => {
  if (!monitorRules.value.enabled) return

  // Check file count threshold
  if (todayCount.value < monitorRules.value.threshold) {
    const message = `Alert: Today's file delivery count (${todayCount.value}) is below threshold (${monitorRules.value.threshold})`
    const emails = monitorRules.value.thresholdEmails.filter((e: string) => e.trim())
    if (emails.length > 0) {
      try {
        await sendAlert(message, emails)
        console.log('Alert sent successfully')
      } catch (err) {
        console.error('Failed to send alert:', err)
      }
    } else {
      console.warn('No email addresses configured for threshold alert')
    }
  }

  // Check file prefix SLA
  await checkFilePrefixSLA()
}

// Check file prefix SLA violations
const checkFilePrefixSLA = async () => {
  if (!monitorRules.value.filePrefixSLAs || monitorRules.value.filePrefixSLAs.length === 0) {
    return
  }

  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]
  const currentTime = `${String(today.getHours()).padStart(2, '0')}:${String(today.getMinutes()).padStart(2, '0')}`

  for (const sla of monitorRules.value.filePrefixSLAs) {
    if (!sla.prefix || !sla.enabled) continue

    // Handle daily rules
    if (sla.ruleType === 'daily' || !sla.ruleType) {
      if (!sla.deadlineTime) continue

      // Check if deadline has passed
      if (currentTime >= sla.deadlineTime) {
        // Check if files with this prefix have been delivered today
        const expectedFiles = todayFiles.value.filter(file => file.name.startsWith(sla.prefix))

        if (expectedFiles.length === 0) {
          const message = `SLA Alert: Files with prefix "${sla.prefix}" were not delivered by ${sla.deadlineTime} on ${todayStr}`
          const emails = sla.emails ? sla.emails.filter((e: string) => e.trim()) : []
          if (emails.length > 0) {
            try {
              await sendAlert(message, emails)
              console.log(`SLA alert sent for prefix: ${sla.prefix}`)
            } catch (err) {
              console.error(`Failed to send SLA alert for prefix ${sla.prefix}:`, err)
            }
          } else {
            console.warn(`No email addresses configured for SLA rule: ${sla.prefix}`)
          }
        }
      }
    }
    // Handle monthly rules
    else if (sla.ruleType === 'monthly') {
      if (!sla.monthlyDay || sla.monthlyDay < 1 || sla.monthlyDay > 31) continue

      const currentDay = today.getDate()

      // Check if we've passed the deadline day of the month
      if (currentDay >= sla.monthlyDay) {
        // Check if files with this prefix have been delivered this month
        const currentMonth = today.getMonth()
        const currentYear = today.getFullYear()
        const monthStart = new Date(currentYear, currentMonth, 1)

        // Check files from the start of current month to today
        const expectedFiles = filesData.value.filter(file => {
          if (!file.name.startsWith(sla.prefix)) return false
          const fileDate = new Date(file.date)
          return fileDate >= monthStart && fileDate <= today
        })

        if (expectedFiles.length === 0) {
          const monthName = today.toLocaleString('en-US', { month: 'long', year: 'numeric' })
          const message = `Monthly SLA Alert: Files with prefix "${sla.prefix}" were not delivered by the ${getDayOrdinal(sla.monthlyDay)} of ${monthName}`
          const emails = sla.emails ? sla.emails.filter((e: string) => e.trim()) : []
          if (emails.length > 0) {
            try {
              await sendAlert(message, emails)
              console.log(`Monthly SLA alert sent for prefix: ${sla.prefix}`)
            } catch (err) {
              console.error(`Failed to send monthly SLA alert for prefix ${sla.prefix}:`, err)
            }
          } else {
            console.warn(`No email addresses configured for monthly SLA rule: ${sla.prefix}`)
          }
        }
      }
    }
  }
}

// Save monitor rules
const saveMonitorRules = async () => {
  saving.value = true
  try {
    saveConfig()

    // Reset auto check interval
    if (checkIntervalId) {
      clearInterval(checkIntervalId)
    }

    if (monitorRules.value.enabled && monitorRules.value.checkInterval > 0) {
      checkIntervalId = window.setInterval(() => {
        fetchDeliveryStatus().then(() => {
          checkAndAlert()
        })
      }, monitorRules.value.checkInterval * 60 * 1000)
    }

    alert('Configuration saved successfully!')
  } catch (err) {
    console.error('Error saving config:', err)
    alert('Failed to save configuration. Please try again.')
  } finally {
    saving.value = false
  }
}

// Test alert
const testAlert = async () => {
  testing.value = true
  try {
    const emails = monitorRules.value.thresholdEmails.filter((e: string) => e.trim())
    if (emails.length === 0) {
      alert('Please configure at least one email address for the threshold rule before testing.')
      return
    }
    await sendAlert('This is a test alert message. If you receive this email, the alert system is working correctly.', emails)
    alert('Test alert sent successfully! Please check your email.')
  } catch {
    alert('Failed to send test alert. Please check API configuration.')
  } finally {
    testing.value = false
  }
}

// Add email address
// Add email for threshold rule
const addThresholdEmail = () => {
  monitorRules.value.thresholdEmails.push('')
}

// Remove email for threshold rule
const removeThresholdEmail = (index: number) => {
  if (monitorRules.value.thresholdEmails.length > 1) {
    monitorRules.value.thresholdEmails.splice(index, 1)
  }
}

// Add email for SLA rule
const addSLAEmail = (slaIndex: number) => {
  if (!monitorRules.value.filePrefixSLAs[slaIndex].emails) {
    monitorRules.value.filePrefixSLAs[slaIndex].emails = ['']
  }
  monitorRules.value.filePrefixSLAs[slaIndex].emails.push('')
}

// Remove email for SLA rule
const removeSLAEmail = (slaIndex: number, emailIndex: number) => {
  const sla = monitorRules.value.filePrefixSLAs[slaIndex]
  if (sla.emails && sla.emails.length > 1) {
    sla.emails.splice(emailIndex, 1)
  }
}

// Add SLA rule
const addSLA = () => {
  monitorRules.value.filePrefixSLAs.push({
    prefix: '',
    ruleType: 'daily',
    deadlineTime: '23:00',
    monthlyDay: 5,
    enabled: true,
    emails: ['']
  })
}

// Get ordinal suffix for day (1st, 2nd, 3rd, 4th, etc.)
const getDayOrdinal = (day: number | undefined) => {
  if (!day || day < 1 || day > 31) return '5th'
  const d = day % 10
  const suffix = d === 1 && day !== 11 ? 'st' : d === 2 && day !== 12 ? 'nd' : d === 3 && day !== 13 ? 'rd' : 'th'
  return `${day}${suffix}`
}

// Remove SLA rule
const removeSLA = (index: number) => {
  // Allow deletion even if it's the last rule
  monitorRules.value.filePrefixSLAs.splice(index, 1)

  // If no rules left, add a default empty rule
  if (monitorRules.value.filePrefixSLAs.length === 0) {
    monitorRules.value.filePrefixSLAs.push({
      prefix: '',
      ruleType: 'daily',
      deadlineTime: '23:00',
      monthlyDay: 5,
      enabled: true,
      emails: ['']
    })
  }

  // Auto-save after deletion
  saveConfig()
}

// Confirm and delete SLA rule from summary
const confirmDeleteSLA = (index: number) => {
  const sla = monitorRules.value.filePrefixSLAs[index]
  const ruleName = sla.prefix || 'Unnamed Prefix'
  const ruleType = sla.ruleType === 'monthly' ? 'Monthly' : 'Daily'

  // Check if this is the last rule
  if (monitorRules.value.filePrefixSLAs.length === 1) {
    if (confirm(`This is the last SLA rule. Are you sure you want to delete the ${ruleType} SLA rule for prefix "${ruleName}"?\n\nNote: You can always add a new rule later.`)) {
      removeSLA(index)
    }
  } else {
    if (confirm(`Are you sure you want to delete the ${ruleType} SLA rule for prefix "${ruleName}"?`)) {
      removeSLA(index)
    }
  }
}

// Format delivery time for display
const formatDeliveryTime = (time: string) => {
  if (!time) return ''
  // Format HH:MM:SS to HH:MM
  return time.substring(0, 5)
}

// 计算属性
const threshold = computed(() => monitorRules.value.threshold)

// Download file function
const downloadFile = (file: { name: string; url?: string }) => {
  if (file.url && file.url.startsWith('http')) {
    // If URL is provided, open in new tab or download
    window.open(file.url, '_blank')
  } else {
    // Mock download - create a blob and download it
    const content = `This is a mock file: ${file.name}\nGenerated at: ${new Date().toISOString()}`
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = file.name
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }
}

// Computed properties for files
const todayDate = computed(() => {
  const today = new Date()
  return today.toISOString().split('T')[0]
})

const yesterdayDate = computed(() => {
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  return yesterday.toISOString().split('T')[0]
})

const todayFiles = computed(() => {
  return filesData.value.filter(file => file.date === todayDate.value)
})

const yesterdayFiles = computed(() => {
  return filesData.value.filter(file => file.date === yesterdayDate.value)
})

const todayCount = computed(() => {
  if (deliveryData.value.length === 0) return 0
  const today = new Date().toISOString().split('T')[0]
  const todayRecord = deliveryData.value.find(r => r.date === today)
  return todayRecord?.count || 0
})

const recentRecords = computed(() => {
  return deliveryData.value.slice(-7).reverse()
})

// Lifecycle hooks
onMounted(() => {
  loadConfig()
  // Load test data immediately
  fetchFiles().then(() => {
    fetchDeliveryStatus().then(() => {
      checkAndAlert()
    })
  })

  // Set up auto check interval
  if (monitorRules.value.enabled && monitorRules.value.checkInterval > 0) {
    checkIntervalId = window.setInterval(() => {
      fetchFiles().then(() => {
        fetchDeliveryStatus().then(() => {
          checkAndAlert()
        })
      })
    }, monitorRules.value.checkInterval * 60 * 1000)
  }
})

onUnmounted(() => {
  if (checkIntervalId) {
    clearInterval(checkIntervalId)
  }
})
</script>

<style scoped>
.monitor-page-container {
  width: 100%;
  margin: 0;
  padding: 24px;
  background: transparent;
  min-height: calc(100vh - 80px);
  box-sizing: border-box;
}

.page-title {
  font-size: 1.8rem;
  font-weight: 700;
  color: #1a1a1a;
  margin-bottom: 24px;
  text-align: left;
}

.content-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;
  align-items: start;
  max-width: 100%;
  min-width: 0;
}

.content-grid.has-config {
  grid-template-columns: 1fr 1fr;
}

.data-section {
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.config-section {
  min-width: 0;
  display: flex;
  flex-direction: column;
  width: 100%;
  opacity: 1;
  visibility: visible;
}

@media (max-width: 1400px) {
  .content-grid {
    gap: 16px;
  }
}

@media (max-width: 1024px) {
  .content-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .monitor-page-container {
    padding: 20px 16px;
  }

  .page-title {
    font-size: 1.5rem;
    margin-bottom: 20px;
  }
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.section-title {
  font-size: 1.2rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.refresh-btn {
  padding: 8px 16px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s;
}

.refresh-btn:hover:not(:disabled) {
  background: #2563eb;
  transform: translateY(-1px);
}

.refresh-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.files-card,
.config-card,
.table-card {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 24px 0 rgba(60, 60, 60, 0.08);
  padding: 16px;
  margin-bottom: 16px;
  overflow: hidden;
}

.files-date-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 12px 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.date-icon {
  font-size: 1.2rem;
}

.file-count-badge {
  margin-left: auto;
  background: #eff6ff;
  color: #2563eb;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 600;
}

.files-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 400px;
  overflow-y: auto;
}

.file-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  background: #f9fafb;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  transition: all 0.2s;
}

.file-item:hover {
  background: #f3f4f6;
  border-color: #d1d5db;
}

.file-info {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  min-width: 0;
}

.file-icon {
  font-size: 1.2rem;
  flex-shrink: 0;
}

.file-name {
  flex: 1;
  font-size: 0.95rem;
  color: #1f2937;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-size {
  font-size: 0.85rem;
  color: #6b7280;
  flex-shrink: 0;
  margin-left: 8px;
}

.download-btn {
  padding: 6px 12px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
  margin-left: 12px;
}

.download-btn:hover {
  background: #2563eb;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
}

.download-btn:active {
  transform: translateY(0);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  color: #9ca3af;
  font-size: 0.95rem;
}

.empty-icon {
  font-size: 2rem;
  margin-bottom: 8px;
}

.chart-demo {
  width: 100%;
  height: 240px;
  min-height: 240px;
  max-height: 240px;
  overflow: hidden;
}

.chart-info {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #e5e7eb;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.info-label {
  color: #6b7280;
  font-size: 0.9rem;
}

.info-value {
  font-weight: 600;
  font-size: 1.1rem;
  color: #1f2937;
}

.info-value.warning {
  color: #ef4444;
}

.alert-badge {
  background: #fef2f2;
  color: #dc2626;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 600;
}

.table-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 12px;
}

.table-wrapper {
  overflow-x: auto;
}

.delivery-table {
  width: 100%;
  border-collapse: collapse;
}

.delivery-table th {
  background: #f9fafb;
  padding: 10px;
  text-align: left;
  font-weight: 600;
  color: #374151;
  font-size: 0.85rem;
  border-bottom: 2px solid #e5e7eb;
}

.delivery-table td {
  padding: 10px;
  border-bottom: 1px solid #f3f4f6;
  color: #1f2937;
  font-size: 0.9rem;
}

.delivery-table tr:hover {
  background: #f9fafb;
}

.status-badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 500;
}

.status-ok {
  background: #d1fae5;
  color: #065f46;
}

.status-warning {
  background: #fee2e2;
  color: #991b1b;
}

.monitor-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.form-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: #374151;
  font-size: 0.95rem;
}

.label-icon {
  font-size: 1.2rem;
}

.email-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.email-item {
  display: flex;
  gap: 8px;
  align-items: center;
}

.form-input {
  flex: 1;
  padding: 10px 14px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 0.95rem;
  transition: all 0.2s;
  color: #1f2937;
}

.form-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.threshold-input-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.threshold-input {
  max-width: 200px;
}

.input-hint {
  font-size: 0.85rem;
  color: #6b7280;
  margin-top: 4px;
}

.label-hint {
  font-size: 0.85rem;
  font-weight: 400;
  color: #6b7280;
  margin-left: 8px;
}

.email-count-hint {
  font-size: 0.85rem;
  color: #3b82f6;
  margin-top: 8px;
  font-weight: 500;
}

.sla-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.sla-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  background: #f9fafb;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.sla-inputs {
  display: flex;
  gap: 8px;
  align-items: center;
}

.sla-prefix-input {
  flex: 2;
  min-width: 0;
}

.sla-time-input {
  flex: 1;
  min-width: 120px;
}

.sla-rule-type {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  padding-bottom: 8px;
  border-bottom: 1px solid #e5e7eb;
}

.rule-type-label {
  font-size: 0.85rem;
  color: #6b7280;
  font-weight: 500;
  white-space: nowrap;
}

.rule-type-select {
  flex: 1;
  max-width: 200px;
}

.monthly-day-input-wrapper {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
  min-width: 120px;
}

.sla-day-input {
  flex: 0 0 60px;
  min-width: 60px;
}

.day-suffix {
  font-size: 0.85rem;
  color: #6b7280;
  white-space: nowrap;
}

.sla-hint {
  font-size: 0.85rem;
  color: #6b7280;
  padding-left: 4px;
  flex: 1;
}

.sla-hint strong {
  color: #374151;
  font-weight: 600;
}

.sla-hint-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-top: 4px;
}

.sla-status-badge {
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  white-space: nowrap;
}

.badge-enabled {
  background: #d1fae5;
  color: #065f46;
}

.badge-disabled {
  background: #fee2e2;
  color: #991b1b;
}

.sla-enable-switch {
  position: relative;
  display: inline-block;
  width: 44px;
  height: 24px;
  flex-shrink: 0;
}

.sla-enable-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.sla-enable-switch .slider-small {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: 0.3s;
  border-radius: 24px;
}

.sla-enable-switch .slider-small:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: 0.3s;
  border-radius: 50%;
}

.sla-enable-switch input:checked + .slider-small {
  background-color: #3b82f6;
}

.sla-enable-switch input:checked + .slider-small:before {
  transform: translateX(20px);
}

/* Active Rules Section */
.active-rules-section {
  margin-bottom: 24px;
  padding-bottom: 24px;
  border-bottom: 2px solid #e5e7eb;
}

.section-subtitle {
  font-size: 1.1rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 16px 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.rules-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.rule-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px;
  background: #ffffff;
  border: 2px solid #e5e7eb;
  border-radius: 10px;
  transition: all 0.2s;
}

.rule-item:hover {
  border-color: #d1d5db;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.rule-item.disabled {
  background: #f9fafb;
  opacity: 0.7;
}

.rule-info {
  flex: 1;
  min-width: 0;
}

.rule-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
  gap: 12px;
}

.rule-name {
  font-size: 0.95rem;
  font-weight: 600;
  color: #1f2937;
}

.rule-status {
  font-size: 0.8rem;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: 10px;
  white-space: nowrap;
}

.status-active {
  background: #d1fae5;
  color: #065f46;
}

.status-inactive {
  background: #fee2e2;
  color: #991b1b;
}

.rule-details {
  font-size: 0.85rem;
  color: #6b7280;
  line-height: 1.4;
}

.rule-details strong {
  color: #374151;
  font-weight: 600;
}

.rule-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
  margin-left: 16px;
  min-width: fit-content;
}

.rule-switch {
  position: relative;
  display: inline-block;
  width: 50px;
  height: 26px;
  flex-shrink: 0;
}

.delete-rule-btn {
  width: 36px;
  height: 36px;
  padding: 0;
  background: #fee2e2;
  color: #dc2626;
  border: 2px solid #fecaca;
  border-radius: 8px;
  font-size: 1.2rem;
  cursor: pointer;
  display: flex !important;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  flex-shrink: 0;
  line-height: 1;
  min-width: 36px;
  min-height: 36px;
  visibility: visible !important;
  opacity: 1 !important;
}

.delete-rule-btn:hover {
  background: #fecaca;
  border-color: #f87171;
  transform: scale(1.05);
  box-shadow: 0 2px 8px rgba(220, 38, 38, 0.2);
}

.delete-rule-btn:active {
  transform: scale(0.95);
}

.delete-icon {
  display: inline-block;
  font-size: 1.1rem;
  line-height: 1;
  user-select: none;
}

.rule-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.rule-switch .slider-small {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: 0.3s;
  border-radius: 26px;
}

.rule-switch .slider-small:before {
  position: absolute;
  content: "";
  height: 20px;
  width: 20px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: 0.3s;
  border-radius: 50%;
}

.rule-switch input:checked + .slider-small {
  background-color: #3b82f6;
}

.rule-switch input:checked + .slider-small:before {
  transform: translateX(24px);
}

.no-rules-hint {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px;
  background: #f9fafb;
  border-radius: 8px;
  color: #6b7280;
  font-size: 0.9rem;
}

.hint-icon {
  font-size: 1.2rem;
}

.email-addresses-item {
  border-left: 4px solid #3b82f6;
}

.email-list-display {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.email-badge {
  display: inline-flex;
  align-items: center;
  padding: 6px 12px;
  background: #eff6ff;
  color: #1e40af;
  border: 1px solid #bfdbfe;
  border-radius: 16px;
  font-size: 0.85rem;
  font-weight: 500;
  white-space: nowrap;
}

.no-email-hint {
  color: #9ca3af;
  font-size: 0.85rem;
  font-style: italic;
}

.rule-emails {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid #e5e7eb;
}

.email-label {
  font-size: 0.85rem;
  color: #6b7280;
  font-weight: 500;
  margin-right: 8px;
}

.rule-email-config {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #e5e7eb;
}

.email-sub-label {
  font-size: 0.9rem;
  margin-bottom: 8px;
}

.file-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
  min-width: 0;
}

.file-delivery-time {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.8rem;
  color: #6b7280;
}

.time-icon {
  font-size: 0.85rem;
}

.remove-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: #fee2e2;
  color: #dc2626;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1.2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.remove-btn:hover {
  background: #fecaca;
}

.add-email-btn {
  align-self: flex-start;
  padding: 8px 16px;
  background: #f3f4f6;
  color: #374151;
  border: 2px dashed #d1d5db;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s;
}

.add-email-btn:hover {
  background: #e5e7eb;
  border-color: #9ca3af;
}

.switch-group {
  display: flex;
  align-items: center;
  gap: 12px;
}

.switch {
  position: relative;
  display: inline-block;
  width: 50px;
  height: 26px;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: 0.3s;
  border-radius: 26px;
}

.slider:before {
  position: absolute;
  content: "";
  height: 20px;
  width: 20px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: 0.3s;
  border-radius: 50%;
}

input:checked + .slider {
  background-color: #3b82f6;
}

input:checked + .slider:before {
  transform: translateX(24px);
}

.switch-label {
  color: #6b7280;
  font-size: 0.95rem;
}

.form-actions {
  display: flex;
  gap: 12px;
  margin-top: 8px;
}

.save-btn,
.test-btn {
  flex: 1;
  padding: 12px 20px;
  border: none;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.save-btn {
  background: #3b82f6;
  color: white;
}

.save-btn:hover:not(:disabled) {
  background: #2563eb;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.test-btn {
  background: #f3f4f6;
  color: #374151;
  border: 2px solid #e5e7eb;
}

.test-btn:hover:not(:disabled) {
  background: #e5e7eb;
  border-color: #d1d5db;
}

.save-btn:disabled,
.test-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.config-info {
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid #e5e7eb;
}

.info-title {
  font-size: 1rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 10px;
}

.info-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.info-list li {
  color: #6b7280;
  font-size: 0.9rem;
  padding-left: 20px;
  position: relative;
}

.info-list li:before {
  content: "•";
  position: absolute;
  left: 0;
  color: #3b82f6;
  font-weight: bold;
}

/* Rule sequence badge */
.rule-sequence {
  display: inline-block;
  background: #eef2ff;
  color: #1e3a8a;
  padding: 4px 8px;
  border-radius: 8px;
  font-size: 0.82rem;
  font-weight: 700;
  margin-right: 8px;
}

.sla-seq {
  font-size: 0.95rem;
  font-weight: 700;
  color: #374151;
  margin-bottom: 6px;
}

/* Transition animations */
.slide-fade-enter-active {
  transition: all 0.3s ease-out;
}

.slide-fade-leave-active {
  transition: all 0.25s ease-in;
}

.slide-fade-enter-from {
  opacity: 0;
  transform: translateX(20px);
}

.slide-fade-leave-to {
  opacity: 0;
  transform: translateX(20px);
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .config-toggle-btn {
    width: 100%;
    justify-content: center;
  }
}
</style>

