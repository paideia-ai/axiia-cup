import type { Meta, StoryObj } from '@storybook/react-vite'
import { Menu } from '@base-ui-components/react/menu'
import { Ellipsis, Pencil, Trash2 } from 'lucide-react'
import { useState } from 'react'

import { cn } from '../../lib/cn'
import { Select, SelectItem } from './select'
import {
  dropdownItemClassName,
  dropdownPopupClassName,
  dropdownScrollClassName,
} from './dropdown-styles'

const examples = [
  {
    label: '模型',
    options: [
      'DeepSeek V4 Flash',
      'Kimi K2.6',
      'GLM-5.3',
      ...Array.from({ length: 9 }, (_, index) => `预览模型 ${index + 4}`),
    ],
  },
  {
    label: '出场角色',
    options: ['长宗我部元亲的密使', '斋藤利三', '明智秀满'],
  },
  {
    label: '基准版本',
    options: ['v1 · 先问证据', 'v2 · 保留顾虑', 'v3 · 逐项回应'],
  },
  {
    label: '对比版本',
    options: ['v3 · 逐项回应', 'v2 · 保留顾虑', 'v1 · 先问证据'],
  },
  {
    label: '历史场景',
    options: ['全部场景', '商鞅庭辩', '本能寺之变', '凤仪亭之夜'],
  },
  {
    label: '预设对手',
    options: ['守住旧制', '先问证据，再逐项回应', '从百姓的负担谈起'],
  },
  { label: '对侧智能体', options: ['甘龙 · agent #102', '甘龙 · agent #103'] },
  { label: '槽位状态', options: ['live', 'draft', 'retired'] },
]

function Example({ label, options }: typeof examples[number]) {
  const [value, setValue] = useState<string | null>(options[0])
  return (
    <section className='space-y-2'>
      <h2 className='text-sm text-(--foreground-subtle)'>{label}</h2>
      <Select placeholder={label} value={value} onValueChange={setValue}>
        {options.map((option) => (
          <SelectItem key={option} value={option}>{option}</SelectItem>
        ))}
      </Select>
    </section>
  )
}

function Gallery() {
  const [action, setAction] = useState('')
  return (
    <div className='mx-auto max-w-3xl space-y-8'>
      <header className='space-y-3'>
        <h1 className='text-2xl font-bold'>下拉菜单预览</h1>
        <p className='text-sm text-(--foreground-subtle)'>
          示例数据。可切换选项、滚动长列表，也可用方向键选择。
        </p>
        <nav className='flex flex-wrap gap-4 text-sm underline underline-offset-4'>
          <a href='?id=agents-keso-low-complexity-builder--model-dropdown-preview&viewMode=story'>
            在构建器中查看
          </a>
          <a href='?id=agents-keso-low-high-low-surfaces--high-function-agent-home&viewMode=story'>
            在智能体页中查看
          </a>
        </nav>
      </header>
      <div className='grid gap-x-8 gap-y-6 sm:grid-cols-2'>
        {examples.map((example) => (
          <Example
            key={example.label}
            {...example}
          />
        ))}
        <section className='space-y-2'>
          <h2 className='text-sm text-(--foreground-subtle)'>更多操作</h2>
          <Menu.Root>
            <Menu.Trigger
              aria-label='更多操作'
              className='flex h-11 w-11 items-center justify-center rounded-lg border border-(--border) bg-white/2 hover:bg-white/4'
            >
              <Ellipsis aria-hidden='true' className='h-5 w-5' />
            </Menu.Trigger>
            <Menu.Portal>
              <Menu.Positioner
                sideOffset={6}
                collisionPadding={16}
                className='z-[60]'
              >
                <Menu.Popup className={cn(dropdownPopupClassName, 'w-56')}>
                  <div className={dropdownScrollClassName}>
                    <Menu.Item
                      className={dropdownItemClassName}
                      onClick={() => setAction('已选择重命名（演示）')}
                    >
                      <Pencil aria-hidden='true' className='h-4 w-4' />重命名
                    </Menu.Item>
                    <div
                      role='separator'
                      className='mx-2.5 my-1 border-t border-(--border-soft)'
                    />
                    <Menu.Item
                      className={cn(
                        dropdownItemClassName,
                        'text-(--accent) data-[highlighted]:text-(--accent)',
                      )}
                      onClick={() =>
                        setAction('已选择删除（演示，不删除数据）')}
                    >
                      <Trash2
                        aria-hidden='true'
                        className='h-4 w-4'
                      />删除智能体
                    </Menu.Item>
                  </div>
                </Menu.Popup>
              </Menu.Positioner>
            </Menu.Portal>
          </Menu.Root>
          <p role='status' className='text-xs text-(--foreground-muted)'>
            {action}
          </p>
        </section>
      </div>
    </div>
  )
}

export default {
  title: 'Preview/Dropdown menus',
  component: Gallery,
} satisfies Meta<typeof Gallery>

export const Interactive: StoryObj<typeof Gallery> = {}
