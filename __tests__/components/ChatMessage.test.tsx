import { render, screen } from '@testing-library/react'
import { ChatMessage } from '@/components/ChatMessage'

jest.mock('@/components/MarkdownRenderer', () => ({
  MarkdownRenderer: ({ content }: { content: string }) => <div>{content}</div>,
}))

describe('ChatMessage', () => {
  it('renders source links for current source shape', () => {
    render(
      <ChatMessage
        role="assistant"
        content="Answer text"
        sources={[
          {
            path: 'Projects/Plan.md',
            title: 'Plan',
            snippet: 'Top priorities',
            score: 0.9,
          },
        ]}
      />
    )

    expect(screen.getByText('Sources:')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Plan/i })).toHaveAttribute(
      'href',
      '/notes/Projects/Plan.md'
    )
  })

  it('renders source links for legacy source shape', () => {
    render(
      <ChatMessage
        role="assistant"
        content="Answer text"
        sources={[
          {
            file_path: 'Notes/Legacy.md',
            file_title: 'Legacy',
            similarity: 0.8,
          },
        ]}
      />
    )

    expect(screen.getByRole('link', { name: /Legacy/i })).toHaveAttribute(
      'href',
      '/notes/Notes/Legacy.md'
    )
  })

  it('shows thinking state while streaming with empty content', () => {
    render(
      <ChatMessage
        role="assistant"
        content=""
        isStreaming
      />
    )

    expect(screen.getByText('Thinking...')).toBeInTheDocument()
  })
})
