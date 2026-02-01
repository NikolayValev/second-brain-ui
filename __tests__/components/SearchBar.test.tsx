import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { SearchBar, SearchBarWithButton } from '@/components/SearchBar'

// Mock useRouter
const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

describe('SearchBar', () => {
  beforeEach(() => {
    mockPush.mockClear()
  })

  it('should render with default placeholder', () => {
    render(<SearchBar />)
    expect(screen.getByPlaceholderText('Search notes...')).toBeInTheDocument()
  })

  it('should render with custom placeholder', () => {
    render(<SearchBar placeholder="Search knowledge base..." />)
    expect(screen.getByPlaceholderText('Search knowledge base...')).toBeInTheDocument()
  })

  it('should render with default value', () => {
    render(<SearchBar defaultValue="initial query" />)
    expect(screen.getByDisplayValue('initial query')).toBeInTheDocument()
  })

  it('should update input value on change', () => {
    render(<SearchBar />)
    const input = screen.getByPlaceholderText('Search notes...')
    
    fireEvent.change(input, { target: { value: 'test query' } })
    expect(input).toHaveValue('test query')
  })

  it('should navigate to search page on submit', () => {
    render(<SearchBar />)
    const input = screen.getByPlaceholderText('Search notes...')
    const form = input.closest('form')!
    
    fireEvent.change(input, { target: { value: 'my search' } })
    fireEvent.submit(form)
    
    expect(mockPush).toHaveBeenCalledWith('/search?q=my%20search')
  })

  it('should not navigate on submit with empty query', () => {
    render(<SearchBar />)
    const input = screen.getByPlaceholderText('Search notes...')
    const form = input.closest('form')!
    
    fireEvent.submit(form)
    
    expect(mockPush).not.toHaveBeenCalled()
  })

  it('should not navigate on submit with whitespace-only query', () => {
    render(<SearchBar />)
    const input = screen.getByPlaceholderText('Search notes...')
    const form = input.closest('form')!
    
    fireEvent.change(input, { target: { value: '   ' } })
    fireEvent.submit(form)
    
    expect(mockPush).not.toHaveBeenCalled()
  })

  it('should trim whitespace from query', () => {
    render(<SearchBar />)
    const input = screen.getByPlaceholderText('Search notes...')
    const form = input.closest('form')!
    
    fireEvent.change(input, { target: { value: '  test query  ' } })
    fireEvent.submit(form)
    
    expect(mockPush).toHaveBeenCalledWith('/search?q=test%20query')
  })

  it('should apply custom className', () => {
    const { container } = render(<SearchBar className="custom-class" />)
    expect(container.firstChild).toHaveClass('custom-class')
  })
})

describe('SearchBarWithButton', () => {
  beforeEach(() => {
    mockPush.mockClear()
  })

  it('should render with a search button', () => {
    render(<SearchBarWithButton />)
    expect(screen.getByRole('button', { name: /search/i })).toBeInTheDocument()
  })

  it('should navigate on form submit', () => {
    render(<SearchBarWithButton />)
    const input = screen.getByPlaceholderText('Search notes...')
    const form = input.closest('form')!
    
    fireEvent.change(input, { target: { value: 'button search' } })
    fireEvent.submit(form)
    
    expect(mockPush).toHaveBeenCalledWith('/search?q=button%20search')
  })

  it('should navigate when button is clicked', () => {
    render(<SearchBarWithButton />)
    const input = screen.getByPlaceholderText('Search notes...')
    const button = screen.getByRole('button', { name: /search/i })
    
    fireEvent.change(input, { target: { value: 'click search' } })
    fireEvent.click(button)
    
    expect(mockPush).toHaveBeenCalledWith('/search?q=click%20search')
  })
})
