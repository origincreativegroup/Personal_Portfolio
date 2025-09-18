import React, { useMemo } from 'react'

const PROJECT_GLOB = import.meta.glob('../../projects/**/*', {
  query: '?raw',
  import: 'default',
})

type FileNode = {
  name: string
  path: string
  type: 'file' | 'directory'
  children?: FileNode[]
}

type Props = {
  projectSlug: string
}

function buildTree(slug: string): FileNode | null {
  const prefix = `../../projects/${slug}`
  const entries = Object.keys(PROJECT_GLOB).filter(path => path.startsWith(prefix))
  if (entries.length === 0) {
    return null
  }

  const root: FileNode = {
    name: slug,
    path: slug,
    type: 'directory',
    children: [],
  }

  entries.forEach(fullPath => {
    const relative = fullPath.slice(prefix.length + 1)
    if (!relative) {
      return
    }
    const segments = relative.split('/')
    let current = root

    segments.forEach((segment, index) => {
      const isFile = index === segments.length - 1
      if (isFile) {
        current.children = current.children ?? []
        const exists = current.children.some(child => child.type === 'file' && child.name === segment)
        if (!exists) {
          current.children.push({
            name: segment,
            path: `${slug}/${relative}`,
            type: 'file',
          })
        }
      } else {
        current.children = current.children ?? []
        let next = current.children.find(
          child => child.type === 'directory' && child.name === segment,
        ) as FileNode | undefined

        if (!next) {
          next = {
            name: segment,
            path: `${slug}/${segments.slice(0, index + 1).join('/')}`,
            type: 'directory',
            children: [],
          }
          current.children.push(next)
        }
        current = next
      }
    })
  })

  const sortNodes = (nodes?: FileNode[]) => {
    if (!nodes) return
    nodes.sort((a, b) => {
      if (a.type === b.type) {
        return a.name.localeCompare(b.name)
      }
      return a.type === 'directory' ? -1 : 1
    })
    nodes.forEach(node => sortNodes(node.children))
  }

  sortNodes(root.children)

  return root
}

const renderNodes = (nodes: FileNode[] | undefined) => {
  if (!nodes || nodes.length === 0) {
    return null
  }
  return (
    <ul className="file-tree__list">
      {nodes.map(node => (
        <li key={node.path} className={`file-tree__item file-tree__item--${node.type}`}>
          <span title={node.path}>{node.name}</span>
          {renderNodes(node.children)}
        </li>
      ))}
    </ul>
  )
}

export default function ProjectFileExplorer({ projectSlug }: Props) {
  const tree = useMemo(() => buildTree(projectSlug), [projectSlug])

  if (!tree || !tree.children || tree.children.length === 0) {
    return (
      <div className="file-tree file-tree--empty">
        <p>No files detected for <strong>{projectSlug}</strong>. Drop assets into <code>projects/{projectSlug}</code> to see them here.</p>
      </div>
    )
  }

  return (
    <div className="file-tree">
      <div className="file-tree__header">
        <h3>Local file structure</h3>
        <p className="file-tree__summary">{tree.children.length} top-level folder{tree.children.length === 1 ? '' : 's'}</p>
      </div>
      {renderNodes(tree.children)}
    </div>
  )
}
