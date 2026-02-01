import { formatDistanceToNow, formatDate, formatDateTime } from '@/lib/format'

describe('formatDistanceToNow', () => {
  beforeEach(() => {
    jest.useFakeTimers()
    jest.setSystemTime(new Date('2026-02-01T12:00:00.000Z'))
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('should return "just now" for dates within the last minute', () => {
    const date = new Date('2026-02-01T11:59:30.000Z')
    expect(formatDistanceToNow(date)).toBe('just now')
  })

  it('should return minutes ago for dates within the last hour', () => {
    const date = new Date('2026-02-01T11:45:00.000Z')
    expect(formatDistanceToNow(date)).toBe('15m ago')
  })

  it('should return hours ago for dates within the last day', () => {
    const date = new Date('2026-02-01T09:00:00.000Z')
    expect(formatDistanceToNow(date)).toBe('3h ago')
  })

  it('should return days ago for dates within the last week', () => {
    const date = new Date('2026-01-29T12:00:00.000Z')
    expect(formatDistanceToNow(date)).toBe('3d ago')
  })

  it('should return weeks ago for dates within the last month', () => {
    const date = new Date('2026-01-15T12:00:00.000Z')
    expect(formatDistanceToNow(date)).toBe('2w ago')
  })

  it('should return months ago for dates within the last year', () => {
    const date = new Date('2025-11-01T12:00:00.000Z')
    expect(formatDistanceToNow(date)).toBe('3mo ago')
  })

  it('should return years ago for dates older than a year', () => {
    const date = new Date('2024-02-01T12:00:00.000Z')
    expect(formatDistanceToNow(date)).toBe('2y ago')
  })
})

describe('formatDate', () => {
  it('should format a date correctly', () => {
    const date = new Date('2026-02-01T12:00:00.000Z')
    expect(formatDate(date)).toBe('Feb 1, 2026')
  })

  it('should handle different months', () => {
    const date = new Date('2026-12-25T12:00:00.000Z')
    expect(formatDate(date)).toBe('Dec 25, 2026')
  })
})

describe('formatDateTime', () => {
  it('should format a date and time correctly', () => {
    const date = new Date('2026-02-01T14:30:00.000Z')
    // Note: This will format according to the local timezone
    const formatted = formatDateTime(date)
    expect(formatted).toMatch(/Feb 1, 2026/)
    expect(formatted).toMatch(/\d{1,2}:\d{2}/)
  })
})
