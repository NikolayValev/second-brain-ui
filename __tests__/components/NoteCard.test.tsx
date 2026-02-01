import React from 'react'
import { render, screen } from '@testing-library/react'
import { NoteCard } from '@/components/NoteCard'

// Mock formatDistanceToNow
jest.mock('@/lib/format', () => ({
  formatDistanceToNow: jest.fn(() => '2h ago'),
}))

describe('NoteCard', () => {
  const defaultProps = {
    path: 'notes/my-note.md',
    title: 'My Test Note',
    modifiedAt: new Date('2026-02-01T10:00:00.000Z'),
  }

  it('should render the note title', () => {
    render(<NoteCard {...defaultProps} />)
    expect(screen.getByText('My Test Note')).toBeInTheDocument()
  })

  it('should use filename as title when title is null', () => {
    render(<NoteCard {...defaultProps} title={null} />)
    expect(screen.getByText('my-note')).toBeInTheDocument()
  })

  it('should render the snippet when provided', () => {
    render(
      <NoteCard {...defaultProps} snippet="This is a note snippet..." />
    )
    expect(screen.getByText('This is a note snippet...')).toBeInTheDocument()
  })

  it('should not render snippet section when not provided', () => {
    const { container } = render(<NoteCard {...defaultProps} />)
    // The card should not have the snippet paragraph
    const paragraphs = container.querySelectorAll('p')
    expect(paragraphs.length).toBe(0)
  })

  it('should render tags when provided', () => {
    render(
      <NoteCard {...defaultProps} tags={['javascript', 'react', 'testing']} />
    )
    expect(screen.getByText('javascript')).toBeInTheDocument()
    expect(screen.getByText('react')).toBeInTheDocument()
    expect(screen.getByText('testing')).toBeInTheDocument()
  })

  it('should limit displayed tags to 5 and show overflow count', () => {
    const manyTags = ['tag1', 'tag2', 'tag3', 'tag4', 'tag5', 'tag6', 'tag7']
    render(<NoteCard {...defaultProps} tags={manyTags} />)
    
    // First 5 tags should be visible
    expect(screen.getByText('tag1')).toBeInTheDocument()
    expect(screen.getByText('tag5')).toBeInTheDocument()
    
    // Overflow indicator should show +2
    expect(screen.getByText('+2')).toBeInTheDocument()
    
    // tag6 and tag7 should not be visible
    expect(screen.queryByText('tag6')).not.toBeInTheDocument()
    expect(screen.queryByText('tag7')).not.toBeInTheDocument()
  })

  it('should render the formatted date', () => {
    render(<NoteCard {...defaultProps} />)
    expect(screen.getByText('2h ago')).toBeInTheDocument()
  })

  it('should handle string date format', () => {
    render(
      <NoteCard
        {...defaultProps}
        modifiedAt="2026-02-01T10:00:00.000Z"
      />
    )
    expect(screen.getByText('2h ago')).toBeInTheDocument()
  })

  it('should link to the correct note path', () => {
    render(<NoteCard {...defaultProps} />)
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/notes/notes/my-note.md')
  })

  it('should not render tags section when tags array is empty', () => {
    const { container } = render(<NoteCard {...defaultProps} tags={[]} />)
    // Should not have any badge elements
    const badges = container.querySelectorAll('[class*="badge"]')
    expect(badges.length).toBe(0)
  })
})
