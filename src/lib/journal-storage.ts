// Journal storage utility using IndexedDB for persistent storage
// Automatically migrates from old localStorage data

import { JournalRecord, Species } from '@/types'

const DB_NAME = 'naturalist-journal-db'
const DB_VERSION = 1
const STORE_NAME = 'records'
const OLD_STORAGE_KEY = 'naturalist-journal'

// ==================== IndexedDB Core ====================

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' })
        store.createIndex('speciesId', 'species.id', { unique: false })
        store.createIndex('timestamp', 'timestamp', { unique: false })
        store.createIndex('category', 'species.category', { unique: false })
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

async function getAllRecords(): Promise<JournalRecord[]> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const store = tx.objectStore(STORE_NAME)
    const request = store.getAll()
    request.onsuccess = () => {
      // Sort by timestamp descending (newest first)
      const records = request.result as JournalRecord[]
      records.sort((a, b) => b.timestamp - a.timestamp)
      resolve(records)
    }
    request.onerror = () => reject(request.error)
    tx.oncomplete = () => db.close()
  })
}

async function putRecord(record: JournalRecord): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const request = store.put(record)
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
    tx.oncomplete = () => db.close()
  })
}

async function deleteRecordById(id: string): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const request = store.delete(id)
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
    tx.oncomplete = () => db.close()
  })
}

async function getRecordById(id: string): Promise<JournalRecord | undefined> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const store = tx.objectStore(STORE_NAME)
    const request = store.get(id)
    request.onsuccess = () => resolve(request.result as JournalRecord | undefined)
    request.onerror = () => reject(request.error)
    tx.oncomplete = () => db.close()
  })
}

// ==================== Migration from localStorage ====================

let migrationDone = false

async function migrateFromLocalStorage(): Promise<void> {
  if (migrationDone) return
  if (typeof window === 'undefined') return

  migrationDone = true

  try {
    const oldData = localStorage.getItem(OLD_STORAGE_KEY)
    if (!oldData) return

    const oldRecords: JournalRecord[] = JSON.parse(oldData)
    if (!Array.isArray(oldRecords) || oldRecords.length === 0) return

    // Check if IndexedDB already has records (don't double-migrate)
    const existingRecords = await getAllRecords()
    if (existingRecords.length > 0) {
      // Already migrated, just clear old localStorage
      localStorage.removeItem(OLD_STORAGE_KEY)
      return
    }

    // Migrate all records to IndexedDB
    const db = await openDB()
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)

    for (const record of oldRecords) {
      store.put(record)
    }

    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => {
        // Remove old localStorage data after successful migration
        localStorage.removeItem(OLD_STORAGE_KEY)
        db.close()
        resolve()
      }
      tx.onerror = () => {
        db.close()
        reject(tx.error)
      }
    })

    console.log(`Migrated ${oldRecords.length} records from localStorage to IndexedDB`)
  } catch (e) {
    console.error('Failed to migrate from localStorage:', e)
  }
}

// ==================== Public API ====================

export async function getJournalRecords(): Promise<JournalRecord[]> {
  if (typeof window === 'undefined') return []
  try {
    await migrateFromLocalStorage()
    return await getAllRecords()
  } catch {
    return []
  }
}

export async function saveJournalRecord(
  species: Species,
  imageUrl: string,
  location?: { name: string }
): Promise<JournalRecord> {
  await migrateFromLocalStorage()
  const records = await getAllRecords()

  // Check for duplicates (same species within last hour)
  const oneHourAgo = Date.now() - 3600000
  const isDuplicate = records.some(
    r => r.species.id === species.id && r.timestamp > oneHourAgo
  )

  if (isDuplicate) {
    return records.find(r => r.species.id === species.id && r.timestamp > oneHourAgo)!
  }

  const record: JournalRecord = {
    id: `${species.id}_${Date.now()}`,
    imageUrl,
    thumbnailUrl: imageUrl,
    species,
    location: location ? { latitude: 0, longitude: 0, name: location.name } : undefined,
    timestamp: Date.now(),
    learningProgress: [false, false, false, false, false, false, false],
    badges: []
  }

  // Add first-discovery badge
  const isFirstOfSpecies = !records.some(r => r.species.id === species.id)
  if (isFirstOfSpecies) {
    record.badges = ['first']
  }

  await putRecord(record)
  return record
}

export async function updateLearningProgress(
  recordId: string,
  dayIndex: number,
  completed: boolean
): Promise<void> {
  const record = await getRecordById(recordId)
  if (record && record.learningProgress) {
    record.learningProgress[dayIndex] = completed
    await putRecord(record)
  }
}

export async function deleteJournalRecord(recordId: string): Promise<void> {
  await deleteRecordById(recordId)
}

export async function getJournalStats() {
  const records = await getJournalRecords()
  return {
    totalDiscoveries: records.length,
    uniqueSpecies: new Set(records.map(r => r.species.id)).size,
    categories: new Set(records.map(r => r.species.category)).size,
    badges: records.reduce((sum, r) => sum + (r.badges?.length || 0), 0),
    completedLearning: records.filter(r => r.learningProgress?.every(Boolean)).length,
    streakDays: calculateStreak(records)
  }
}

function calculateStreak(records: JournalRecord[]): number {
  if (records.length === 0) return 0

  const days = new Set(
    records.map(r => new Date(r.timestamp).toDateString())
  )

  let streak = 0
  const today = new Date()
  for (let i = 0; i < 365; i++) {
    const checkDate = new Date(today)
    checkDate.setDate(checkDate.getDate() - i)
    if (days.has(checkDate.toDateString())) {
      streak++
    } else if (i > 0) {
      break
    }
  }
  return streak
}

// Get total species count for share card
export async function getShareStats() {
  const records = await getJournalRecords()
  const speciesIds = new Set(records.map(r => r.species.id))
  const categories = new Set(records.map(r => r.species.category))
  return {
    totalDiscoveries: records.length,
    uniqueSpecies: speciesIds.size,
    categoryCount: categories.size,
    streakDays: calculateStreak(records),
    badges: records.reduce((sum, r) => sum + (r.badges?.length || 0), 0),
    // Recent 5 species for the share card
    recentSpecies: records.slice(0, 5).map(r => ({
      name: r.species.name,
      chineseName: r.species.chineseName,
      category: r.species.category,
      thumbnailUrl: r.thumbnailUrl || r.imageUrl
    }))
  }
}
