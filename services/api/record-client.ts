"use client"

import { useEffect, useState } from "react"

export interface RecordClientOptions<T> {
  scope: string
  defaultItems: T[]
  eventName: string
  sort?: (items: T[]) => T[]
}

export interface SingletonClientOptions<T> {
  scope: string
  defaultValue: T
  eventName: string
}

async function requestJson<T>(input: RequestInfo | URL, init?: RequestInit) {
  const response = await fetch(input, {
    credentials: "include",
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  })

  if (!response.ok) {
    throw new Error(await response.text())
  }

  return (await response.json()) as T
}

function dispatchItemsEvent<T>(eventName: string, items: T[]) {
  if (typeof window === "undefined") return
  window.dispatchEvent(new CustomEvent<T[]>(eventName, { detail: items }))
}

export function createCollectionClient<T extends { id: string }>(options: RecordClientOptions<T>) {
  let cache = options.defaultItems

  async function persistItems(items: T[]) {
    const nextItems = options.sort ? options.sort(items) : items
    const nextIds = new Set(nextItems.map((item) => item.id))

    const previousCache = cache
    cache = nextItems
    dispatchItemsEvent(options.eventName, cache)

    try {
      await Promise.all([
        ...nextItems.map((item) =>
          requestJson(`/api/records/${options.scope}/${item.id}`, {
            method: "PATCH",
            body: JSON.stringify(item),
          })
        ),
        ...previousCache.filter((item) => !nextIds.has(item.id)).map((item) =>
          requestJson(`/api/records/${options.scope}/${item.id}`, {
            method: "DELETE",
          })
        ),
      ])

      return cache
    } catch (error) {
      cache = previousCache
      dispatchItemsEvent(options.eventName, cache)
      throw error
    }
  }

  async function readItems() {
    try {
      const payload = await requestJson<{ records: Array<{ data: T }> }>(`/api/records/${options.scope}`)
      cache = options.sort ? options.sort(payload.records.map((record) => record.data)) : payload.records.map((record) => record.data)

      if (cache.length === 0 && options.defaultItems.length > 0) {
        cache = options.defaultItems
        void persistItems(options.defaultItems)
      }

      dispatchItemsEvent(options.eventName, cache)
      return cache
    } catch {
      return cache
    }
  }

  function readItemsSync() {
    return cache
  }

  async function writeItems(items: T[]) {
    return persistItems(items)
  }

  async function createItem(item: T) {
    const payload = await requestJson<{ record: { data: T } }>(`/api/records/${options.scope}`, {
      method: "POST",
      body: JSON.stringify({ key: item.id, data: item }),
    })

    cache = [payload.record.data, ...cache.filter((record) => record.id !== item.id)]
    cache = options.sort ? options.sort(cache) : cache
    dispatchItemsEvent(options.eventName, cache)
    return payload.record.data
  }

  async function updateItem(id: string, updates: Partial<T>) {
    const currentItem = cache.find((item) => item.id === id)
    const nextItem = { ...(currentItem ?? ({} as T)), ...updates, id } as T
    const payload = await requestJson<{ record: { data: T } }>(`/api/records/${options.scope}/${id}`, {
      method: "PATCH",
      body: JSON.stringify(nextItem),
    })

    cache = cache.map((item) => (item.id === id ? payload.record.data : item))
    cache = options.sort ? options.sort(cache) : cache
    dispatchItemsEvent(options.eventName, cache)
    return payload.record.data
  }

  async function deleteItem(id: string) {
    await requestJson(`/api/records/${options.scope}/${id}`, {
      method: "DELETE",
    })

    cache = cache.filter((item) => item.id !== id)
    dispatchItemsEvent(options.eventName, cache)
  }

  function useItems() {
    const [items, setItems] = useState<T[]>(options.defaultItems)

    useEffect(() => {
      let isMounted = true

      void readItems().then((nextItems) => {
        if (isMounted) setItems(nextItems)
      })

      function handleItemsUpdated(event: Event) {
        const customEvent = event as CustomEvent<T[]>
        setItems(customEvent.detail ?? cache)
      }

      window.addEventListener(options.eventName, handleItemsUpdated)

      return () => {
        isMounted = false
        window.removeEventListener(options.eventName, handleItemsUpdated)
      }
    }, [])

    return options.sort ? options.sort(items) : items
  }

  return {
    readItemsSync,
    readItems,
    writeItems,
    createItem,
    updateItem,
    deleteItem,
    useItems,
  }
}

export function createSingletonClient<T>(options: SingletonClientOptions<T>) {
  let cache = options.defaultValue

  async function readValue() {
    try {
      const payload = await requestJson<{ records: Array<{ data: T }> }>(`/api/records/${options.scope}`)
      cache = payload.records[0]?.data ?? options.defaultValue
      if (payload.records.length === 0) {
        void writeValue(options.defaultValue)
      }
      dispatchItemsEvent(options.eventName, [cache])
      return cache
    } catch {
      return cache
    }
  }

  function readValueSync() {
    return cache
  }

  async function writeValue(value: T) {
    await requestJson(`/api/records/${options.scope}/singleton`, {
      method: "PATCH",
      body: JSON.stringify(value),
    })

    cache = value
    dispatchItemsEvent(options.eventName, [cache])
    return cache
  }

  function useValue() {
    const [value, setValue] = useState<T>(options.defaultValue)

    useEffect(() => {
      let isMounted = true

      void readValue().then((nextValue) => {
        if (isMounted) setValue(nextValue)
      })

      function handleValueUpdated(event: Event) {
        const customEvent = event as CustomEvent<T[]>
        setValue(customEvent.detail?.[0] ?? cache)
      }

      window.addEventListener(options.eventName, handleValueUpdated)

      return () => {
        isMounted = false
        window.removeEventListener(options.eventName, handleValueUpdated)
      }
    }, [])

    return value
  }

  return {
    readValueSync,
    readValue,
    writeValue,
    useValue,
  }
}
