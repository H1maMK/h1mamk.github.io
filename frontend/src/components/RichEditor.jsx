import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Placeholder from '@tiptap/extension-placeholder'
import TextAlign from '@tiptap/extension-text-align'
import Underline from '@tiptap/extension-underline'
import { useEffect, useRef } from 'react'
import './RichEditor.css'

const ToolbarButton = ({ editor, label, title, active, onClick, type = 'button' }) => (
  <button
    type={type}
    title={title}
    className={`toolbar-btn ${active ? 'active' : ''}`}
    onMouseDown={(event) => {
      event.preventDefault()
      onClick()
    }}
  >
    {label}
  </button>
)

const MenuBar = ({ editor }) => {
  const fileInputRef = useRef(null)

  if (!editor) return null

  const insertImage = (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (loadEvent) => {
      editor.chain().focus().setImage({ src: loadEvent.target?.result || '' }).run()
    }
    reader.readAsDataURL(file)
    event.target.value = ''
  }

  const buttons = [
    {
      label: 'Жирный',
      title: 'Жирный текст',
      onClick: () => editor.chain().focus().toggleBold().run(),
      active: editor.isActive('bold'),
    },
    {
      label: 'Курсив',
      title: 'Курсив',
      onClick: () => editor.chain().focus().toggleItalic().run(),
      active: editor.isActive('italic'),
    },
    {
      label: 'Подчёркнутый',
      title: 'Подчёркнутый текст',
      onClick: () => editor.chain().focus().toggleUnderline().run(),
      active: editor.isActive('underline'),
    },
    {
      label: 'Зачёркнутый',
      title: 'Зачёркнутый текст',
      onClick: () => editor.chain().focus().toggleStrike().run(),
      active: editor.isActive('strike'),
    },
    {
      label: 'Заголовок 1',
      title: 'Заголовок первого уровня',
      onClick: () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
      active: editor.isActive('heading', { level: 1 }),
    },
    {
      label: 'Заголовок 2',
      title: 'Заголовок второго уровня',
      onClick: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
      active: editor.isActive('heading', { level: 2 }),
    },
    {
      label: 'Заголовок 3',
      title: 'Заголовок третьего уровня',
      onClick: () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
      active: editor.isActive('heading', { level: 3 }),
    },
    {
      label: 'По левому краю',
      title: 'Выравнивание по левому краю',
      onClick: () => editor.chain().focus().setTextAlign('left').run(),
      active: editor.isActive({ textAlign: 'left' }),
    },
    {
      label: 'По центру',
      title: 'Выравнивание по центру',
      onClick: () => editor.chain().focus().setTextAlign('center').run(),
      active: editor.isActive({ textAlign: 'center' }),
    },
    {
      label: 'По правому краю',
      title: 'Выравнивание по правому краю',
      onClick: () => editor.chain().focus().setTextAlign('right').run(),
      active: editor.isActive({ textAlign: 'right' }),
    },
    {
      label: 'Маркированный список',
      title: 'Маркированный список',
      onClick: () => editor.chain().focus().toggleBulletList().run(),
      active: editor.isActive('bulletList'),
    },
    {
      label: 'Нумерованный список',
      title: 'Нумерованный список',
      onClick: () => editor.chain().focus().toggleOrderedList().run(),
      active: editor.isActive('orderedList'),
    },
    {
      label: 'Цитата',
      title: 'Цитата',
      onClick: () => editor.chain().focus().toggleBlockquote().run(),
      active: editor.isActive('blockquote'),
    },
    {
      label: 'Отменить',
      title: 'Отменить последнее действие',
      onClick: () => editor.chain().focus().undo().run(),
    },
    {
      label: 'Повторить',
      title: 'Повторить действие',
      onClick: () => editor.chain().focus().redo().run(),
    },
  ]

  return (
    <div className="rich-editor-toolbar">
      <div className="toolbar-group">
        {buttons.slice(0, 4).map((button) => (
          <ToolbarButton key={button.label} editor={editor} {...button} />
        ))}
      </div>

      <div className="toolbar-group">
        {buttons.slice(4, 7).map((button) => (
          <ToolbarButton key={button.label} editor={editor} {...button} />
        ))}
      </div>

      <div className="toolbar-group">
        {buttons.slice(7, 10).map((button) => (
          <ToolbarButton key={button.label} editor={editor} {...button} />
        ))}
      </div>

      <div className="toolbar-group">
        {buttons.slice(10, 13).map((button) => (
          <ToolbarButton key={button.label} editor={editor} {...button} />
        ))}
      </div>

      <div className="toolbar-group">
        <ToolbarButton
          editor={editor}
          label="Изображение"
          title="Вставить изображение"
          onClick={() => fileInputRef.current?.click()}
        />
        <ToolbarButton
          editor={editor}
          label="Отменить"
          title="Отменить последнее действие"
          onClick={() => editor.chain().focus().undo().run()}
        />
        <ToolbarButton
          editor={editor}
          label="Повторить"
          title="Повторить действие"
          onClick={() => editor.chain().focus().redo().run()}
        />
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="toolbar-file-input"
        onChange={insertImage}
      />
    </div>
  )
}

const RichEditor = ({ value, onChange }) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ underline: false }),
      Underline,
      Image.configure({ inline: false, allowBase64: true }),
      Placeholder.configure({ placeholder: 'Начните писать статью...' }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
    ],
    content: value || '',
    onUpdate: ({ editor: currentEditor }) => {
      onChange(currentEditor.getHTML())
    },
  })

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || '')
    }
  }, [editor, value])

  return (
    <div className="rich-editor-wrapper">
      <MenuBar editor={editor} />
      <EditorContent editor={editor} className="rich-editor-content" />
    </div>
  )
}

export default RichEditor
