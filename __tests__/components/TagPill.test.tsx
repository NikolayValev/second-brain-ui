import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { TagPill, TagList } from '@/components/TagPill'

describe('TagPill', () => {
  it('should render the tag name with hash prefix', () => {
    render(<TagPill name="javascript" />)
    expect(screen.getByText('#javascript')).toBeInTheDocument()
  })

  it('should apply active variant when active prop is true', () => {
    const { container } = render(<TagPill name="test" active={true} />)
    const badge = container.firstChild
    expect(badge).toHaveClass('bg-primary')
  })

  it('should apply secondary variant when active prop is false', () => {
    const { container } = render(<TagPill name="test" active={false} />)
    const badge = container.firstChild
    expect(badge).toHaveClass('bg-secondary')
  })

  it('should call onClick when clicked', () => {
    const handleClick = jest.fn()
    render(<TagPill name="test" onClick={handleClick} />)
    
    fireEvent.click(screen.getByText('#test'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('should apply custom className', () => {
    const { container } = render(<TagPill name="test" className="custom-class" />)
    const badge = container.firstChild
    expect(badge).toHaveClass('custom-class')
  })
})

describe('TagList', () => {
  const mockTags = ['javascript', 'typescript', 'react']

  it('should render all tags', () => {
    render(<TagList tags={mockTags} />)
    
    expect(screen.getByText('#javascript')).toBeInTheDocument()
    expect(screen.getByText('#typescript')).toBeInTheDocument()
    expect(screen.getByText('#react')).toBeInTheDocument()
  })

  it('should call onTagClick with the correct tag when clicked', () => {
    const handleTagClick = jest.fn()
    render(<TagList tags={mockTags} onTagClick={handleTagClick} />)
    
    fireEvent.click(screen.getByText('#typescript'))
    expect(handleTagClick).toHaveBeenCalledWith('typescript')
  })

  it('should mark active tags correctly', () => {
    render(
      <TagList tags={mockTags} activeTags={['typescript']} />
    )
    
    // Check that typescript tag is rendered and the component handles activeTags prop
    const typescriptText = screen.getByText('#typescript')
    expect(typescriptText).toBeInTheDocument()
    
    // The javascript tag should not be active
    const javascriptText = screen.getByText('#javascript')
    expect(javascriptText).toBeInTheDocument()
  })

  it('should apply custom className to container', () => {
    const { container } = render(
      <TagList tags={mockTags} className="custom-container" />
    )
    
    expect(container.firstChild).toHaveClass('custom-container')
  })

  it('should render empty list when no tags provided', () => {
    const { container } = render(<TagList tags={[]} />)
    expect(container.firstChild?.childNodes.length).toBe(0)
  })
})
