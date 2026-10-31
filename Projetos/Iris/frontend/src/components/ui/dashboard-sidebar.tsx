"use client"

import * as React from "react"

/**
 * Dashboard Sidebar — a barra lateral de um painel, com a busca que abre por cima dele.
 *
 * - **Workspace**, no topo: o quadrado com a inicial, o nome e o plano. O clique abre a lista para trocar de workspace
 *   e o "Criar workspace"; Esc ou um clique fora fecha, e as setas andam pela lista.
 * - **Grupos**, no meio: itens com ícone, nome e, à direita, um contador e o atalho de teclado, que aparece no hover. O
 *   item ativo fica destacado. Um item com subitens abre e fecha com uma animação de altura, e a seta gira; os subitens
 *   ficam recuados, com um fio à esquerda. Se a lista passa da altura, ela rola.
 * - **Pé**: os itens da conta (configurações, sair), sempre embaixo.
 * - **Atalhos**: o atalho de um item ("⌘K", "⌘,") funciona de verdade, com ⌘ no Mac e Ctrl no Windows e no Linux.
 * - **Recolher**: com open={false} a barra fecha até a largura zero, animada, e sai da ordem do Tab.
 *
 * SearchPalette é a busca: abre por cima do pai posicionado mais próximo, procura nos itens que recebe (os subitens
 * entram, com o item de cima ao lado), anda com as setas, escolhe com o Enter e fecha com o Esc.
 *
 * Os ícones são os do Lucide (licença ISC), desenhados aqui, e vão pelo nome; um componente de ícone seu (do
 * lucide-react, por exemplo) também serve. As cores ficam nas variáveis --ds-* do tema, escuro ou claro.
 *
 * Autocontido: o React é o único import. Sem Tailwind, sem bibliotecas, sem arquivo CSS.
 *
 * Ajuste da Iris (out/2026): a prop header põe um conteúdo seu (a marca) no topo, no lugar da troca de workspace.
 */

export type SidebarIconName = keyof typeof ICONS

export type SidebarIconProps = {
  className?: string
  strokeWidth?: number
  "aria-hidden"?: boolean
}

export type NavItemData = {
  id: string
  title: string
  /** O nome de um dos ícones daqui ou um componente de ícone seu, que recebe className e strokeWidth. */
  icon?: SidebarIconName | React.ComponentType<SidebarIconProps>
  /** Um contador à direita: mensagens novas, pendências. */
  badge?: number | string
  /** ⌘ e uma tecla: "⌘K", "⌘,". Aparece no hover e, com shortcuts ligado, aciona o item. */
  shortcut?: string
  /** Subitens: o item vira um grupo que abre e fecha. */
  children?: NavItemData[]
}

export type NavGroupData = {
  heading?: string
  items: NavItemData[]
}

export type Workspace = {
  name: string
  /** A segunda linha, embaixo do nome: o plano, a equipe. */
  plan?: string
}

export type SidebarTheme = "dark" | "light"

// O React 19 sobe uma <style> com href e precedence para o <head>, uma vez só para a barra e a busca (fora delas). O
// React 18 não conhece isso: lá ela vai dentro de cada uma, escondida e com o CSS cru, porque como filho de texto o SSR
// do 18 escaparia as aspas e quebraria os seletores.
const HOISTS_STYLES = Number(React.version.split(".")[0]) >= 19

function DashboardSidebarStyles() {
  if (HOISTS_STYLES) {
    const hoist = { href: "dashboard-sidebar", precedence: "default" } as React.StyleHTMLAttributes<HTMLStyleElement>
    return <style {...hoist}>{DS_CSS}</style>
  }
  return <style hidden dangerouslySetInnerHTML={{ __html: DS_CSS }} />
}

/** Um ícone do Lucide pelo nome, no traço de 1,5 da barra. */
export function SidebarIcon({
  name,
  size = 16,
  strokeWidth = 1.5,
  className,
}: {
  name: SidebarIconName
  size?: number
  strokeWidth?: number
  className?: string
}) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      dangerouslySetInnerHTML={{ __html: ICONS[name] }}
    />
  )
}

function ItemIcon({ icon, className }: { icon: NavItemData["icon"]; className: string }) {
  if (!icon) return null
  if (typeof icon === "string") return <SidebarIcon name={icon} className={className} />
  const Icon = icon
  return <Icon className={className} strokeWidth={1.5} aria-hidden />
}

// "⌘K" → ⌘ (ou Ctrl) e K; "⌘⇧P" → ⌘, Shift e P. Sem ⌘ o atalho só aparece: uma tecla solta dispararia enquanto se digita.
type Shortcut = { key: string; shift: boolean }

function parseShortcut(shortcut: string | undefined): Shortcut | null {
  if (!shortcut) return null
  const chars = Array.from(shortcut.replace(/\s+/g, ""))
  const key = chars.pop()
  if (!key || !chars.includes("⌘")) return null
  return { key: key.toLowerCase(), shift: chars.includes("⇧") }
}

function ariaShortcut(shortcut: string | undefined) {
  const parsed = parseShortcut(shortcut)
  if (!parsed) return undefined
  const key = (parsed.shift ? "Shift+" : "") + parsed.key.toUpperCase()
  return "Meta+" + key + " Control+" + key
}

function flattenItems(items: NavItemData[]): NavItemData[] {
  return items.flatMap(item => [item, ...(item.children ? flattenItems(item.children) : [])])
}

const containsId = (item: NavItemData, id: string | undefined): boolean =>
  Boolean(id && item.children?.some(child => child.id === id || containsId(child, id)))

function WorkspaceSwitcher({
  workspaces,
  current,
  onChange,
  onCreate,
  createLabel,
}: {
  workspaces: Workspace[]
  current: Workspace
  onChange: (name: string) => void
  onCreate?: () => void
  createLabel: string
}) {
  const [open, setOpen] = React.useState(false)
  const root = React.useRef<HTMLDivElement>(null)
  const trigger = React.useRef<HTMLButtonElement>(null)
  const menuId = React.useId()

  React.useEffect(() => {
    if (!open) return
    // abre no workspace atual, para as setas começarem dele
    root.current?.querySelector<HTMLElement>('[aria-checked="true"]')?.focus({ preventScroll: true })
    const onPointerDown = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || e.defaultPrevented || e.isComposing) return
      e.preventDefault()
      setOpen(false)
      trigger.current?.focus({ preventScroll: true })
    }
    document.addEventListener("pointerdown", onPointerDown)
    document.addEventListener("keydown", onKeyDown)
    return () => {
      document.removeEventListener("pointerdown", onPointerDown)
      document.removeEventListener("keydown", onKeyDown)
    }
  }, [open])

  const choose = (action: () => void) => {
    action()
    setOpen(false)
    trigger.current?.focus({ preventScroll: true })
  }

  const onMenuKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const items = Array.from(e.currentTarget.querySelectorAll<HTMLElement>('[role^="menuitem"]'))
    const at = items.indexOf(document.activeElement as HTMLElement)
    let next: number
    if (e.key === "ArrowDown") next = (at + 1) % items.length
    else if (e.key === "ArrowUp") next = (at - 1 + items.length) % items.length
    else if (e.key === "Home") next = 0
    else if (e.key === "End") next = items.length - 1
    else {
      if (e.key === "Tab") setOpen(false)
      return
    }
    e.preventDefault()
    items[next]?.focus()
  }

  return (
    <div
      ref={root}
      className="ds-ws"
      onBlur={e => {
        const to = e.relatedTarget as Node | null
        if (to && !e.currentTarget.contains(to)) setOpen(false)
      }}
    >
      <button
        ref={trigger}
        type="button"
        className="ds-btn ds-ws__trigger"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => setOpen(o => !o)}
      >
        <span className="ds-ws__avatar" aria-hidden="true">
          {current.name.trim().charAt(0).toUpperCase()}
        </span>
        <span className="ds-ws__text">
          <span className="ds-ws__name">{current.name}</span>
          {current.plan && <span className="ds-ws__plan">{current.plan}</span>}
        </span>
        <SidebarIcon name="chevron-down" className="ds-ws__chevron" />
      </button>

      {open && (
        <div className="ds-menu" id={menuId} role="menu" aria-label="Workspaces" onKeyDown={onMenuKeyDown}>
          {workspaces.map(ws => (
            <button
              key={ws.name}
              type="button"
              role="menuitemradio"
              aria-checked={ws.name === current.name}
              tabIndex={-1}
              className="ds-btn ds-menu__item"
              onClick={() => choose(() => onChange(ws.name))}
            >
              {ws.name}
            </button>
          ))}
          <div className="ds-menu__sep" role="separator" />
          <button
            type="button"
            role="menuitem"
            tabIndex={-1}
            className="ds-btn ds-menu__item ds-menu__create"
            onClick={() => choose(() => onCreate?.())}
          >
            <span className="ds-menu__plus" aria-hidden="true">
              +
            </span>
            {createLabel}
          </button>
        </div>
      )}
    </div>
  )
}

function NavItem({
  item,
  activeId,
  onSelect,
  level = 0,
}: {
  item: NavItemData
  activeId: string | undefined
  onSelect: (id: string) => void
  level?: number
}) {
  const hasChildren = Boolean(item.children?.length)
  // o grupo abre sozinho quando o item ativo está dentro dele (já de início, ou escolhido pela busca ou por um atalho)
  const [open, setOpen] = React.useState(() => containsId(item, activeId))
  const [seenActiveId, setSeenActiveId] = React.useState(activeId)
  if (seenActiveId !== activeId) {
    setSeenActiveId(activeId)
    if (containsId(item, activeId)) setOpen(true)
  }
  const children = React.useRef<HTMLDivElement>(null)
  const childrenId = React.useId()
  const isActive = activeId === item.id

  // fechado, o grupo continua no DOM (é o que anima a altura), mas sai da ordem do Tab e do leitor de tela
  React.useEffect(() => {
    children.current?.toggleAttribute("inert", !open)
  }, [open])

  return (
    <div className="ds-item">
      <button
        type="button"
        className="ds-btn ds-item__row"
        data-active={isActive || undefined}
        aria-current={isActive ? "page" : undefined}
        aria-expanded={hasChildren ? open : undefined}
        aria-controls={hasChildren ? childrenId : undefined}
        aria-keyshortcuts={ariaShortcut(item.shortcut)}
        style={{ paddingLeft: level * 12 + 10 }}
        onClick={() => (hasChildren ? setOpen(o => !o) : onSelect(item.id))}
      >
        <span className="ds-item__main">
          <ItemIcon icon={item.icon} className="ds-item__icon" />
          <span className="ds-item__title">{item.title}</span>
        </span>
        <span className="ds-item__side">
          {item.shortcut && <kbd className="ds-kbd ds-item__kbd">{item.shortcut}</kbd>}
          {item.badge !== undefined && item.badge !== "" && <span className="ds-badge">{item.badge}</span>}
          {hasChildren && <SidebarIcon name="chevron-right" strokeWidth={2} className="ds-item__chevron" />}
        </span>
      </button>

      {hasChildren && (
        <div ref={children} id={childrenId} className="ds-children" data-open={open || undefined}>
          <div className="ds-children__inner">
            <span className="ds-children__line" style={{ left: level * 12 + 17.5 }} aria-hidden="true" />
            {item.children!.map(child => (
              <NavItem key={child.id} item={child} activeId={activeId} onSelect={onSelect} level={level + 1} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export type SidebarNavProps = {
  /** Os grupos do meio, de cima para baixo. Um grupo sem heading fica sem título. */
  groups: NavGroupData[]
  /** Os itens do pé, embaixo da linha. */
  footer?: NavItemData[]
  /** Sem workspaces, a barra começa direto nos grupos. */
  workspaces?: Workspace[]
  /** O workspace atual, pelo nome (controlado); sem ele, a barra guarda a escolha. */
  workspace?: string
  defaultWorkspace?: string
  onWorkspaceChange?: (name: string) => void
  onCreateWorkspace?: () => void
  createWorkspaceLabel?: string
  /** Um conteúdo seu no topo (a marca, por exemplo), no lugar da troca de workspace. */
  header?: React.ReactNode
  /** O item ativo, pelo id (controlado); sem ele, a barra guarda o último escolhido. */
  activeId?: string
  defaultActiveId?: string
  /** Chamado com o id do item escolhido, pelo clique ou pelo atalho. Itens com subitens só abrem e fecham. */
  onSelect?: (id: string) => void
  /** false recolhe a barra até a largura zero. */
  open?: boolean
  /** Os atalhos dos itens ("⌘K") acionam o item. Desligue se a página já usa as mesmas teclas. */
  shortcuts?: boolean
  theme?: SidebarTheme
  className?: string
  style?: React.CSSProperties
  "aria-label"?: string
}

export function SidebarNav({
  groups,
  footer = [],
  workspaces = [],
  workspace,
  defaultWorkspace,
  onWorkspaceChange,
  onCreateWorkspace,
  createWorkspaceLabel = "Criar workspace",
  header,
  activeId,
  defaultActiveId,
  onSelect,
  open = true,
  shortcuts = true,
  theme = "dark",
  className,
  style,
  "aria-label": ariaLabel = "Barra lateral",
}: SidebarNavProps) {
  const root = React.useRef<HTMLElement>(null)
  const [ownActiveId, setOwnActiveId] = React.useState(defaultActiveId)
  const [ownWorkspace, setOwnWorkspace] = React.useState(defaultWorkspace ?? workspaces[0]?.name)
  const currentId = activeId ?? ownActiveId
  const currentWorkspace = workspaces.find(ws => ws.name === (workspace ?? ownWorkspace)) ?? workspaces[0]

  const select = (id: string) => {
    if (activeId === undefined) setOwnActiveId(id)
    onSelect?.(id)
  }
  const changeWorkspace = (name: string) => {
    if (workspace === undefined) setOwnWorkspace(name)
    onWorkspaceChange?.(name)
  }

  // recolhida, a barra sai da ordem do Tab e do leitor de tela
  React.useEffect(() => {
    root.current?.toggleAttribute("inert", !open)
  }, [open])

  // os atalhos leem os itens e o select da última renderização, sem refazer o listener a cada uma
  const latest = React.useRef({ items: [] as NavItemData[], select })
  React.useEffect(() => {
    latest.current = { items: flattenItems([...groups.flatMap(g => g.items), ...footer]), select }
  })
  React.useEffect(() => {
    if (!shortcuts) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.repeat || e.isComposing || e.altKey || !(e.metaKey || e.ctrlKey)) return
      const hit = latest.current.items.find(item => {
        const s = parseShortcut(item.shortcut)
        return s && !item.children?.length && s.key === e.key.toLowerCase() && s.shift === e.shiftKey
      })
      if (!hit) return
      e.preventDefault()
      latest.current.select(hit.id)
    }
    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [shortcuts])

  return (
    <aside
      ref={root}
      className={"ds-theme ds-sidebar" + (className ? " " + className : "")}
      data-theme={theme}
      data-open={open || undefined}
      aria-label={ariaLabel}
      style={style}
    >
      <DashboardSidebarStyles />
      <div className="ds-sidebar__inner">
        {header ? (
          <div className="ds-header">{header}</div>
        ) : (
          currentWorkspace && (
            <WorkspaceSwitcher
              workspaces={workspaces}
              current={currentWorkspace}
              onChange={changeWorkspace}
              onCreate={onCreateWorkspace}
              createLabel={createWorkspaceLabel}
            />
          )
        )}

        <nav className="ds-groups" aria-label="Navegação">
          {groups.map((group, i) => (
            <div key={group.heading ?? i} className="ds-group">
              {group.heading && <span className="ds-group__heading">{group.heading}</span>}
              {group.items.map(item => (
                <NavItem key={item.id} item={item} activeId={currentId} onSelect={select} />
              ))}
            </div>
          ))}
        </nav>

        {footer.length > 0 && (
          <div className="ds-footer">
            {footer.map(item => (
              <NavItem key={item.id} item={item} activeId={currentId} onSelect={select} />
            ))}
          </div>
        )}
      </div>
    </aside>
  )
}

// sem acento e sem caixa: "analises" acha "Análises"
const fold = (text: string) =>
  text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()

type PaletteEntry = { item: NavItemData; parent?: string }

function paletteEntries(items: NavItemData[], parent?: string): PaletteEntry[] {
  return items.flatMap(item =>
    item.children?.length ? paletteEntries(item.children, item.title) : [{ item, parent }],
  )
}

export type SearchPaletteProps = {
  open: boolean
  onClose: () => void
  /** O que a busca encontra. Itens com subitens entram pelos subitens, com o nome deles ao lado. */
  items?: NavItemData[]
  /** Chamado com o id do item escolhido; a busca fecha em seguida. */
  onSelect?: (id: string) => void
  placeholder?: string
  emptyLabel?: string
  noResultsLabel?: string
  theme?: SidebarTheme
}

export function SearchPalette({
  open,
  onClose,
  items = [],
  onSelect,
  placeholder = "Busque projetos, documentos ou ações…",
  emptyLabel = "Digite um comando ou busque…",
  noResultsLabel = "Nada encontrado.",
  theme = "dark",
}: SearchPaletteProps) {
  const input = React.useRef<HTMLInputElement>(null)
  const panel = React.useRef<HTMLDivElement>(null)
  const [query, setQuery] = React.useState("")
  const [active, setActive] = React.useState(0)
  const listId = React.useId()

  const q = fold(query.trim())
  const results = q
    ? paletteEntries(items).filter(({ item, parent }) => fold(item.title).includes(q) || (parent && fold(parent).includes(q)))
    : []
  const current = Math.min(active, results.length - 1)

  // ao abrir, o foco vai para o campo; ao fechar, volta para onde estava (o item Buscar, por exemplo)
  React.useEffect(() => {
    if (!open) return
    const before = document.activeElement as HTMLElement | null
    input.current?.focus({ preventScroll: true })
    return () => {
      setQuery("")
      setActive(0)
      if (before?.isConnected) before.focus({ preventScroll: true })
    }
  }, [open])

  React.useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || e.defaultPrevented || e.isComposing) return
      e.preventDefault()
      onClose()
    }
    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [open, onClose])

  if (!open) return null

  const choose = (entry: PaletteEntry | undefined) => {
    if (!entry) return
    onClose()
    onSelect?.(entry.item.id)
  }

  const onInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.nativeEvent.isComposing) return
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault()
      if (results.length) setActive((current + (e.key === "ArrowDown" ? 1 : -1) + results.length) % results.length)
    } else if (e.key === "Enter") {
      e.preventDefault()
      choose(results[current])
    }
  }

  // o Tab fica dentro da busca: o campo e o fechar
  const onPanelKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "Tab") return
    const stops = Array.from(panel.current?.querySelectorAll<HTMLElement>("input, button") ?? [])
    const at = stops.indexOf(document.activeElement as HTMLElement)
    e.preventDefault()
    stops[(at + (e.shiftKey ? -1 : 1) + stops.length) % stops.length]?.focus()
  }

  const optionId = (i: number) => listId + "-" + i

  return (
    <div className="ds-theme ds-palette" data-theme={theme}>
      <DashboardSidebarStyles />
      <div className="ds-palette__scrim" onClick={onClose} aria-hidden="true" />
      <div
        ref={panel}
        className="ds-palette__panel"
        role="dialog"
        aria-modal="true"
        aria-label="Busca"
        onKeyDown={onPanelKeyDown}
      >
        <div className="ds-palette__field">
          <SidebarIcon name="search" size={18} className="ds-palette__icon" />
          <input
            ref={input}
            className="ds-palette__input"
            type="text"
            role="combobox"
            aria-expanded={results.length > 0}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={results.length ? optionId(current) : undefined}
            autoComplete="off"
            spellCheck={false}
            placeholder={placeholder}
            value={query}
            onChange={e => {
              setQuery(e.target.value)
              setActive(0)
            }}
            onKeyDown={onInputKeyDown}
          />
          <kbd className="ds-kbd ds-palette__esc" onClick={onClose} aria-hidden="true">
            ESC
          </kbd>
          <button type="button" className="ds-btn ds-palette__close" onClick={onClose} aria-label="Fechar a busca">
            <SidebarIcon name="x" size={18} />
          </button>
        </div>

        <div className="ds-palette__list" id={listId} role="listbox" aria-label="Resultados" hidden={!results.length}>
          {results.map((entry, i) => (
            <div
              key={entry.item.id}
              id={optionId(i)}
              className="ds-palette__option"
              role="option"
              aria-selected={i === current}
              onMouseDown={e => e.preventDefault()}
              onMouseMove={() => i !== current && setActive(i)}
              onClick={() => choose(entry)}
            >
              <ItemIcon icon={entry.item.icon} className="ds-palette__option-icon" />
              <span className="ds-palette__option-title">{entry.item.title}</span>
              {entry.parent && <span className="ds-palette__option-meta">{entry.parent}</span>}
            </div>
          ))}
        </div>

        {!results.length && (
          <div className="ds-palette__empty">
            <SidebarIcon name="command" size={24} className="ds-palette__empty-icon" />
            <p>{q ? noResultsLabel : emptyLabel}</p>
          </div>
        )}
      </div>
    </div>
  )
}

// Lucide (lucide.dev), licença ISC: os mesmos desenhos, em 24 × 24
const ICONS = {
  search: '<path d="m21 21-4.34-4.34"/><circle cx="11" cy="11" r="8"/>',
  "layout-dashboard":
    '<rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/>',
  "folder-kanban":
    '<path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/><path d="M8 10v4"/><path d="M12 10v2"/><path d="M16 10v6"/>',
  users:
    '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><path d="M16 3.128a4 4 0 0 1 0 7.744"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><circle cx="9" cy="7" r="4"/>',
  settings:
    '<path d="M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915"/><circle cx="12" cy="12" r="3"/>',
  "log-out": '<path d="m16 17 5-5-5-5"/><path d="M21 12H9"/><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>',
  hash: '<line x1="4" x2="20" y1="9" y2="9"/><line x1="4" x2="20" y1="15" y2="15"/><line x1="10" x2="8" y1="3" y2="21"/><line x1="16" x2="14" y1="3" y2="21"/>',
  "chevron-down": '<path d="m6 9 6 6 6-6"/>',
  "chevron-right": '<path d="m9 18 6-6-6-6"/>',
  inbox:
    '<polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>',
  calendar: '<path d="M8 2v3"/><path d="M16 2v3"/><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/>',
  activity:
    '<path d="M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2"/>',
  "credit-card": '<rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/><path d="M6 14h2"/>',
  globe: '<circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/>',
  terminal: '<path d="M12 19h8"/><path d="m4 17 6-6-6-6"/>',
  blocks:
    '<path d="M10 22V7a1 1 0 0 0-1-1H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5a1 1 0 0 0-1-1H2"/><rect x="14" y="2" width="8" height="8" rx="1"/>',
  "panel-left-close": '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M9 3v18"/><path d="m16 15-3-3 3-3"/>',
  "panel-left-open": '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M9 3v18"/><path d="m14 9 3 3-3 3"/>',
  command: '<path d="M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3"/>',
  x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
}

const DS_CSS = `
/* o tema: as cores de tudo vêm daqui (troque à vontade). Escuro por padrão; data-theme="light" para o claro */
.ds-theme {
  --ds-bg: #0a0a0a;
  --ds-card: #171717;
  --ds-fg: #fafafa;
  --ds-muted: #a1a1a1;
  --ds-border: rgba(255, 255, 255, .1);
  --ds-primary: #e5e5e5;
  --ds-primary-fg: #171717;
  --ds-hover: rgba(255, 255, 255, .05);
  --ds-active: rgba(255, 255, 255, .1);
  --ds-line: rgba(255, 255, 255, .05);
  --ds-key: rgba(255, 255, 255, .1);
  --ds-key-hover: rgba(255, 255, 255, .2);
  --ds-ease: cubic-bezier(.4, 0, .2, 1);
  color-scheme: dark;
  /* nada de texto herdado da página: a barra fica igual em qualquer projeto */
  font-family: ui-sans-serif, system-ui, -apple-system, "SF Pro Text", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  font-size: 14px;
  font-weight: 400;
  font-style: normal;
  font-variant: normal;
  font-feature-settings: normal;
  font-variation-settings: normal;
  line-height: 20px;
  letter-spacing: normal;
  word-spacing: normal;
  text-align: left;
  text-transform: none;
  text-indent: 0;
  text-shadow: none;
  text-rendering: auto;
  color: var(--ds-fg);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  -webkit-tap-highlight-color: transparent;
}
.ds-theme[data-theme="light"] {
  --ds-bg: #ffffff;
  --ds-card: #ffffff;
  --ds-fg: #0a0a0a;
  --ds-muted: #737373;
  --ds-border: #e5e5e5;
  --ds-primary: #171717;
  --ds-primary-fg: #fafafa;
  --ds-hover: rgba(0, 0, 0, .05);
  --ds-active: rgba(0, 0, 0, .05);
  --ds-line: rgba(0, 0, 0, .05);
  --ds-key: rgba(0, 0, 0, .05);
  --ds-key-hover: rgba(0, 0, 0, .1);
  color-scheme: light;
}
.ds-theme, .ds-theme *, .ds-theme *::before, .ds-theme *::after { box-sizing: border-box; }
.ds-theme * { margin: 0; }
.ds-btn {
  display: flex;
  align-items: center;
  padding: 0;
  border: 0;
  border-radius: 0;
  background: none;
  font: inherit;
  letter-spacing: inherit;
  color: inherit;
  text-align: left;
  text-transform: none;
  cursor: pointer;
  -webkit-appearance: none;
  appearance: none;
}
.ds-btn:focus { outline: none; }
.ds-btn:focus-visible { outline: 2px solid color-mix(in srgb, var(--ds-fg) 55%, transparent); outline-offset: -2px; }
.ds-kbd {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 20px;
  padding: 0 6px;
  border-radius: 4px;
  font-family: ui-monospace, "SF Mono", SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 10px;
  font-weight: 500;
  line-height: 1;
}

/* a barra: 260 px, e zero quando recolhida (o miolo continua com 260 e é cortado, então nada se espreme) */
.ds-sidebar {
  --ds-width: 260px;
  position: relative;
  flex: none;
  width: var(--ds-width);
  height: 100%;
  overflow: hidden;
  background: color-mix(in srgb, var(--ds-card) 50%, transparent);
  border-right: 1px solid color-mix(in srgb, var(--ds-border) 50%, transparent);
  transition: width .3s var(--ds-ease), opacity .3s var(--ds-ease), border-right-width .3s var(--ds-ease);
}
.ds-sidebar:not([data-open]) { width: 0; opacity: 0; border-right-width: 0; }
.ds-sidebar__inner { display: flex; flex-direction: column; width: var(--ds-width); height: 100%; padding: 12px; }
/* o topo com conteúdo próprio (a marca), no lugar da troca de workspace */
.ds-header { flex: none; display: flex; align-items: center; min-height: 48px; margin-bottom: 8px; padding: 8px; }

/* o workspace */
.ds-ws { position: relative; flex: none; }
.ds-ws__trigger {
  gap: 12px;
  width: 100%;
  margin-bottom: 16px;
  padding: 8px;
  border-radius: 8px;
  user-select: none;
  transition: background-color .15s var(--ds-ease);
}
.ds-ws__avatar {
  display: grid;
  place-items: center;
  flex: none;
  width: 32px;
  height: 32px;
  border-radius: 6px;
  background: var(--ds-primary);
  color: var(--ds-primary-fg);
  font-size: 13px;
  font-weight: 600;
  line-height: 1;
  box-shadow: 0 1px 2px rgba(0, 0, 0, .05);
}
.ds-ws__text { display: flex; flex-direction: column; flex: 1; min-width: 0; }
.ds-ws__name, .ds-ws__plan { overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
.ds-ws__name { font-size: 13px; font-weight: 500; line-height: 16px; color: var(--ds-fg); }
.ds-ws__plan { font-size: 11px; line-height: 14px; color: var(--ds-muted); }
.ds-ws__chevron {
  flex: none;
  width: 16px;
  height: 16px;
  color: color-mix(in srgb, var(--ds-muted) 50%, transparent);
  transition: color .15s var(--ds-ease);
}
.ds-menu {
  position: absolute;
  top: 52px;
  left: 0;
  z-index: 50;
  display: flex;
  flex-direction: column;
  gap: 2px;
  width: 100%;
  padding: 4px 0;
  border: 1px solid color-mix(in srgb, var(--ds-border) 50%, transparent);
  border-radius: 8px;
  background: var(--ds-card);
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, .1), 0 8px 10px -6px rgba(0, 0, 0, .1);
  animation: ds-pop .1s ease;
}
.ds-menu__item {
  gap: 8px;
  margin: 0 4px;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 13px;
  line-height: 20px;
  color: color-mix(in srgb, var(--ds-fg) 80%, transparent);
  transition: background-color .15s var(--ds-ease), color .15s var(--ds-ease);
}
.ds-menu__item[aria-checked="true"] {
  background: color-mix(in srgb, var(--ds-primary) 10%, transparent);
  color: var(--ds-primary);
  font-weight: 500;
}
.ds-menu__sep { height: 1px; margin: 4px 8px; background: color-mix(in srgb, var(--ds-border) 50%, transparent); }
.ds-menu__item.ds-menu__create { color: var(--ds-muted); }
.ds-menu__plus { margin-bottom: 2px; font-size: 16px; line-height: 1; }

/* os grupos: rolam se passarem da altura, sem barra de rolagem */
.ds-groups {
  display: flex;
  flex-direction: column;
  flex: 1;
  gap: 16px;
  min-height: 0;
  margin-top: 8px;
  overflow-y: auto;
  scrollbar-width: none;
}
.ds-groups::-webkit-scrollbar { display: none; }
.ds-group { display: flex; flex-direction: column; flex: none; gap: 2px; }
.ds-group__heading {
  margin-bottom: 4px;
  padding: 0 10px;
  font-size: 11px;
  font-weight: 600;
  line-height: 16px;
  letter-spacing: .05em;
  text-transform: uppercase;
  color: color-mix(in srgb, var(--ds-muted) 50%, transparent);
}
.ds-footer {
  display: flex;
  flex-direction: column;
  flex: none;
  gap: 2px;
  margin-top: auto;
  padding-top: 16px;
  border-top: 1px solid color-mix(in srgb, var(--ds-border) 50%, transparent);
}

/* um item */
.ds-item { display: flex; flex-direction: column; width: 100%; }
.ds-item__row {
  justify-content: space-between;
  gap: 8px;
  width: 100%;
  padding: 7px 10px;
  border-radius: 6px;
  font-size: 13px;
  line-height: 20px;
  color: var(--ds-muted);
  user-select: none;
  transition: background-color .2s var(--ds-ease), color .2s var(--ds-ease);
}
.ds-item__row[data-active] { background: var(--ds-active); color: var(--ds-fg); font-weight: 500; }
.ds-item__main { display: flex; align-items: center; flex: 1; gap: 10px; min-width: 0; }
.ds-item__icon {
  flex: none;
  width: 16px;
  height: 16px;
  color: color-mix(in srgb, var(--ds-muted) 70%, transparent);
  transition: color .2s var(--ds-ease);
}
.ds-item__row[data-active] .ds-item__icon { color: var(--ds-fg); }
.ds-item__title { overflow: hidden; white-space: nowrap; text-overflow: ellipsis; letter-spacing: .025em; }
.ds-item__side { display: flex; align-items: center; flex: none; gap: 8px; }
.ds-item__kbd {
  display: none;
  border: 1px solid color-mix(in srgb, var(--ds-border) 50%, transparent);
  background: color-mix(in srgb, var(--ds-bg) 50%, transparent);
  color: color-mix(in srgb, var(--ds-muted) 60%, transparent);
  box-shadow: 0 1px rgba(0, 0, 0, .05);
}
.ds-item__row:focus-visible .ds-item__kbd { display: inline-flex; }
.ds-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--ds-primary) 10%, transparent);
  color: var(--ds-primary);
  font-size: 10px;
  font-weight: 500;
  line-height: 1;
}
.ds-item__chevron {
  flex: none;
  width: 14px;
  height: 14px;
  color: color-mix(in srgb, var(--ds-muted) 50%, transparent);
  transition: transform .2s var(--ds-ease);
}
.ds-item__row[aria-expanded="true"] .ds-item__chevron { transform: rotate(90deg); }

/* os subitens: a altura anima de 0 até a do conteúdo (a linha do grid vai de 0fr a 1fr) */
.ds-children {
  display: grid;
  grid-template-rows: 0fr;
  opacity: 0;
  transition: grid-template-rows .3s var(--ds-ease), opacity .3s var(--ds-ease);
}
.ds-children[data-open] { grid-template-rows: 1fr; opacity: 1; }
.ds-children__inner { position: relative; display: flex; flex-direction: column; gap: 2px; min-height: 0; overflow: hidden; }
.ds-children__inner > .ds-item:first-of-type { margin-top: 2px; }
.ds-children__line { position: absolute; top: 0; bottom: 0; border-left: 1px solid var(--ds-line); pointer-events: none; }

/* o hover só com mouse: no toque ele ficaria preso depois do toque */
@media (hover: hover) {
  .ds-ws__trigger:hover { background: var(--ds-hover); }
  .ds-ws__trigger:hover .ds-ws__chevron { color: color-mix(in srgb, var(--ds-fg) 70%, transparent); }
  .ds-menu__item:not([aria-checked="true"]):hover { background: var(--ds-hover); }
  .ds-item__row:not([data-active]):hover { background: var(--ds-hover); color: color-mix(in srgb, var(--ds-fg) 90%, transparent); }
  .ds-item__row:not([data-active]):hover .ds-item__icon { color: color-mix(in srgb, var(--ds-fg) 70%, transparent); }
  .ds-item__row:hover .ds-item__kbd { display: inline-flex; }
}

/* a busca: cobre o pai posicionado mais próximo, com o painel a 15% do topo */
.ds-palette { position: absolute; inset: 0; z-index: 50; padding: 0 16px; }
.ds-palette__scrim {
  position: absolute;
  inset: 0;
  background: color-mix(in srgb, var(--ds-bg) 40%, transparent);
  -webkit-backdrop-filter: blur(4px);
  backdrop-filter: blur(4px);
}
.ds-palette__panel {
  position: relative;
  top: 15%;
  width: 100%;
  max-width: 576px;
  margin: 0 auto;
  overflow: hidden;
  border: 1px solid color-mix(in srgb, var(--ds-border) 50%, transparent);
  border-radius: 12px;
  background: var(--ds-card);
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, .25);
  animation: ds-pop .2s ease;
}
.ds-palette__field { display: flex; align-items: center; padding: 0 16px; border-bottom: 1px solid color-mix(in srgb, var(--ds-border) 50%, transparent); }
.ds-palette__icon { flex: none; width: 18px; height: 18px; margin-right: 12px; color: color-mix(in srgb, var(--ds-muted) 70%, transparent); }
.ds-palette__input {
  flex: 1;
  min-width: 0;
  height: auto;
  padding: 16px 0;
  border: 0;
  border-radius: 0;
  outline: none;
  background: transparent;
  box-shadow: none;
  font: inherit;
  font-size: 14px;
  line-height: 20px;
  color: var(--ds-fg);
  -webkit-appearance: none;
  appearance: none;
}
.ds-palette__input::placeholder { color: color-mix(in srgb, var(--ds-muted) 50%, transparent); opacity: 1; }
.ds-palette__esc {
  flex: none;
  margin-left: 8px;
  border: 1px solid var(--ds-key);
  background: var(--ds-key);
  color: color-mix(in srgb, var(--ds-muted) 70%, transparent);
  cursor: pointer;
  user-select: none;
  transition: color .15s var(--ds-ease), background-color .15s var(--ds-ease);
}
.ds-palette__close {
  flex: none;
  margin-left: 12px;
  padding: 4px;
  border-radius: 6px;
  color: color-mix(in srgb, var(--ds-muted) 70%, transparent);
  transition: color .15s var(--ds-ease), background-color .15s var(--ds-ease);
}
.ds-palette__close svg { display: block; }
.ds-palette__list { display: flex; flex-direction: column; gap: 2px; max-height: 296px; padding: 8px; overflow-y: auto; }
.ds-palette__list[hidden] { display: none; }
.ds-palette__option {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 6px;
  font-size: 13px;
  line-height: 20px;
  color: var(--ds-muted);
  cursor: pointer;
  user-select: none;
}
.ds-palette__option[aria-selected="true"] { background: var(--ds-active); color: var(--ds-fg); }
.ds-palette__option-icon { flex: none; width: 16px; height: 16px; color: color-mix(in srgb, var(--ds-muted) 70%, transparent); }
.ds-palette__option[aria-selected="true"] .ds-palette__option-icon { color: var(--ds-fg); }
.ds-palette__option-title { overflow: hidden; white-space: nowrap; text-overflow: ellipsis; letter-spacing: .025em; }
.ds-palette__option-meta { flex: none; margin-left: auto; font-size: 12px; color: color-mix(in srgb, var(--ds-muted) 60%, transparent); }
.ds-palette__empty { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 32px 8px; }
.ds-palette__empty-icon { width: 24px; height: 24px; margin-bottom: 8px; color: color-mix(in srgb, var(--ds-muted) 30%, transparent); }
.ds-palette__empty p { font-size: 13px; font-weight: 500; line-height: 20px; color: var(--ds-muted); }
@media (hover: hover) {
  .ds-palette__esc:hover { background: var(--ds-key-hover); color: var(--ds-fg); }
  .ds-palette__close:hover { background: var(--ds-key); color: var(--ds-fg); }
}
@media (max-width: 639px) {
  .ds-palette__esc { display: none; }
}

@keyframes ds-pop { from { opacity: 0; transform: scale(.95); } }

@media (prefers-reduced-motion: reduce) {
  .ds-sidebar, .ds-theme * { transition-duration: .01ms !important; animation-duration: .01ms !important; }
}
`
