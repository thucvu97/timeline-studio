/**
 * Полные конфигурации всех шаблонов
 * Этот файл содержит конфигурации для всех 78 шаблонов
 */

import {
  CellLayout,
  MediaTemplateConfig,
  PRESET_STYLES,
  createCellConfig,
  createDividerConfig,
} from "./template-config"

// ===== БАЗОВЫЕ ШАБЛОНЫ =====

// Вертикальные разделения
const verticalTemplates: MediaTemplateConfig[] = [
  {
    id: "split-vertical-landscape",
    split: "vertical",
    resizable: true,
    screens: 2,
    splitPosition: 50,
    cells: [createCellConfig(0), createCellConfig(1)],
    dividers: createDividerConfig("default"),
  },
  {
    id: "split-vertical-portrait",
    split: "vertical",
    resizable: true,
    screens: 2,
    splitPosition: 50,
    cells: [createCellConfig(0), createCellConfig(1)],
    dividers: createDividerConfig("default"),
  },
  {
    id: "split-vertical-square",
    split: "vertical",
    resizable: true,
    screens: 2,
    splitPosition: 50,
    cells: [createCellConfig(0), createCellConfig(1)],
    dividers: createDividerConfig("default"),
  },
]

// Горизонтальные разделения
const horizontalTemplates: MediaTemplateConfig[] = [
  {
    id: "split-horizontal-landscape",
    split: "horizontal",
    resizable: true,
    screens: 2,
    splitPosition: 50,
    cells: [createCellConfig(0), createCellConfig(1)],
    dividers: createDividerConfig("default"),
  },
  {
    id: "split-horizontal-portrait",
    split: "horizontal",
    resizable: true,
    screens: 2,
    splitPosition: 50,
    cells: [createCellConfig(0), createCellConfig(1)],
    dividers: createDividerConfig("default"),
  },
  {
    id: "split-horizontal-square",
    split: "horizontal",
    resizable: true,
    screens: 2,
    splitPosition: 50,
    cells: [createCellConfig(0), createCellConfig(1)],
    dividers: createDividerConfig("default"),
  },
]

// Диагональные разделения
const diagonalTemplates: MediaTemplateConfig[] = [
  {
    id: "split-diagonal-landscape",
    split: "diagonal",
    resizable: true,
    screens: 2,
    splitPoints: [
      { x: 66.67, y: 0 },
      { x: 33.33, y: 100 },
    ],
    cells: [
      createCellConfig(0, {
        title: {
          show: true,
          position: "center",
          text: "1",
          style: {
            ...PRESET_STYLES.cell.default.title?.style,
            transform: "translateX(-15%)",
          },
        },
      }),
      createCellConfig(1, {
        title: {
          show: true,
          position: "center",
          text: "2",
          style: {
            ...PRESET_STYLES.cell.alternate.title?.style,
            transform: "translateX(15%)",
          },
        },
      }),
    ],
    dividers: createDividerConfig("default"),
  },
  {
    id: "split-diagonal-portrait",
    split: "diagonal",
    resizable: true,
    screens: 2,
    splitPoints: [
      { x: 66.67, y: 0 },
      { x: 33.33, y: 100 },
    ],
    cells: [
      createCellConfig(0, {
        title: {
          show: true,
          position: "center",
          text: "1",
          style: {
            ...PRESET_STYLES.cell.default.title?.style,
            transform: "translateX(-15%)",
          },
        },
      }),
      createCellConfig(1, {
        title: {
          show: true,
          position: "center",
          text: "2",
          style: {
            ...PRESET_STYLES.cell.alternate.title?.style,
            transform: "translateX(15%)",
          },
        },
      }),
    ],
    dividers: createDividerConfig("default"),
  },
  {
    id: "split-diagonal-square",
    split: "diagonal",
    resizable: true,
    screens: 2,
    splitPoints: [
      { x: 66.67, y: 0 },
      { x: 33.33, y: 100 },
    ],
    cells: [createCellConfig(0), createCellConfig(1)],
    dividers: createDividerConfig("default"),
  },
  {
    id: "split-diagonal-vertical-square",
    split: "diagonal",
    resizable: true,
    screens: 2,
    splitPoints: [
      { x: 0, y: 33.33 },
      { x: 100, y: 66.67 },
    ],
    cells: [createCellConfig(0), createCellConfig(1)],
    dividers: createDividerConfig("default"),
  },
]

// ===== МНОЖЕСТВЕННЫЕ РАЗДЕЛЕНИЯ =====

// 3 экрана
const tripleScreenTemplates: MediaTemplateConfig[] = [
  // Вертикальные
  {
    id: "split-vertical-3-landscape",
    split: "vertical",
    resizable: true,
    screens: 3,
    cells: [createCellConfig(0), createCellConfig(1), createCellConfig(2)],
    dividers: createDividerConfig("default"),
  },
  {
    id: "split-vertical-3-portrait",
    split: "vertical",
    resizable: true,
    screens: 3,
    cells: [createCellConfig(0), createCellConfig(1), createCellConfig(2)],
    dividers: createDividerConfig("default"),
  },
  {
    id: "split-vertical-3-square",
    split: "vertical",
    resizable: true,
    screens: 3,
    cells: [createCellConfig(0), createCellConfig(1), createCellConfig(2)],
    dividers: createDividerConfig("default"),
  },
  // Горизонтальные
  {
    id: "split-horizontal-3-landscape",
    split: "horizontal",
    resizable: true,
    screens: 3,
    cells: [createCellConfig(0), createCellConfig(1), createCellConfig(2)],
    dividers: createDividerConfig("default"),
  },
  {
    id: "split-horizontal-3-portrait",
    split: "horizontal",
    resizable: true,
    screens: 3,
    cells: [createCellConfig(0), createCellConfig(1), createCellConfig(2)],
    dividers: createDividerConfig("default"),
  },
  {
    id: "split-horizontal-3-square",
    split: "horizontal",
    resizable: true,
    screens: 3,
    cells: [createCellConfig(0), createCellConfig(1), createCellConfig(2)],
    dividers: createDividerConfig("default"),
  },
]

// 4 экрана
const quadScreenTemplates: MediaTemplateConfig[] = [
  // Вертикальные
  {
    id: "split-vertical-4-landscape",
    split: "vertical",
    resizable: true,
    screens: 4,
    cells: [createCellConfig(0), createCellConfig(1), createCellConfig(2), createCellConfig(3)],
    dividers: createDividerConfig("default"),
  },
  {
    id: "split-vertical-4-portrait",
    split: "vertical",
    resizable: true,
    screens: 4,
    cells: [createCellConfig(0), createCellConfig(1), createCellConfig(2), createCellConfig(3)],
    dividers: createDividerConfig("default"),
  },
  {
    id: "split-vertical-4-square",
    split: "vertical",
    resizable: true,
    screens: 4,
    cells: [createCellConfig(0), createCellConfig(1), createCellConfig(2), createCellConfig(3)],
    dividers: createDividerConfig("default"),
  },
  // Горизонтальные
  {
    id: "split-horizontal-4-landscape",
    split: "horizontal",
    resizable: true,
    screens: 4,
    cells: [createCellConfig(0), createCellConfig(1), createCellConfig(2), createCellConfig(3)],
    dividers: createDividerConfig("default"),
  },
  {
    id: "split-horizontal-4-portrait",
    split: "horizontal",
    resizable: true,
    screens: 4,
    cells: [createCellConfig(0), createCellConfig(1), createCellConfig(2), createCellConfig(3)],
    dividers: createDividerConfig("default"),
  },
  {
    id: "split-horizontal-4-square",
    split: "horizontal",
    resizable: true,
    screens: 4,
    cells: [createCellConfig(0), createCellConfig(1), createCellConfig(2), createCellConfig(3)],
    dividers: createDividerConfig("default"),
  },
]

// ===== СЕТКИ =====

const gridTemplates: MediaTemplateConfig[] = [
  // 2x2
  {
    id: "split-grid-2x2-landscape",
    split: "grid",
    screens: 4,
    gridConfig: { columns: 2, rows: 2 },
    cells: Array.from({ length: 4 }, (_, i) => createCellConfig(i)),
    layout: PRESET_STYLES.layout.withGap,
  },
  {
    id: "split-grid-2x2-portrait",
    split: "grid",
    screens: 4,
    gridConfig: { columns: 2, rows: 2 },
    cells: Array.from({ length: 4 }, (_, i) => createCellConfig(i)),
    layout: PRESET_STYLES.layout.withGap,
  },
  {
    id: "split-grid-2x2-square",
    split: "grid",
    screens: 4,
    gridConfig: { columns: 2, rows: 2 },
    cells: Array.from({ length: 4 }, (_, i) => createCellConfig(i)),
    layout: PRESET_STYLES.layout.withGap,
  },
  // 2x3 и 3x2
  {
    id: "split-grid-2x3-portrait",
    split: "grid",
    screens: 6,
    gridConfig: { columns: 2, rows: 3 },
    cells: Array.from({ length: 6 }, (_, i) => createCellConfig(i)),
    layout: PRESET_STYLES.layout.withGap,
  },
  {
    id: "split-grid-2x3-square",
    split: "grid",
    screens: 6,
    gridConfig: { columns: 2, rows: 3 },
    cells: Array.from({ length: 6 }, (_, i) => createCellConfig(i)),
    layout: PRESET_STYLES.layout.withGap,
  },
  {
    id: "split-grid-2x3-alt-portrait",
    split: "grid",
    screens: 6,
    gridConfig: { columns: 2, rows: 3 },
    cells: Array.from({ length: 6 }, (_, i) => createCellConfig(i)),
    layout: PRESET_STYLES.layout.withGap,
  },
  {
    id: "split-grid-3x2-landscape",
    split: "grid",
    screens: 6,
    gridConfig: { columns: 3, rows: 2 },
    cells: Array.from({ length: 6 }, (_, i) => createCellConfig(i)),
    layout: PRESET_STYLES.layout.withGap,
  },
  {
    id: "split-grid-3x2-portrait",
    split: "grid",
    screens: 6,
    gridConfig: { columns: 3, rows: 2 },
    cells: Array.from({ length: 6 }, (_, i) => createCellConfig(i)),
    layout: PRESET_STYLES.layout.withGap,
  },
  {
    id: "split-grid-3x2-square",
    split: "grid",
    screens: 6,
    gridConfig: { columns: 3, rows: 2 },
    cells: Array.from({ length: 6 }, (_, i) => createCellConfig(i)),
    layout: PRESET_STYLES.layout.withGap,
  },
  // 2x4 и 4x2
  {
    id: "split-grid-2x4-portrait",
    split: "grid",
    screens: 8,
    gridConfig: { columns: 2, rows: 4 },
    cells: Array.from({ length: 8 }, (_, i) => createCellConfig(i)),
    layout: PRESET_STYLES.layout.withGap,
  },
  {
    id: "split-grid-2x4-square",
    split: "grid",
    screens: 8,
    gridConfig: { columns: 2, rows: 4 },
    cells: Array.from({ length: 8 }, (_, i) => createCellConfig(i)),
    layout: PRESET_STYLES.layout.withGap,
  },
  {
    id: "split-grid-4x2-landscape",
    split: "grid",
    screens: 8,
    gridConfig: { columns: 4, rows: 2 },
    cells: Array.from({ length: 8 }, (_, i) => createCellConfig(i)),
    layout: PRESET_STYLES.layout.withGap,
  },
  {
    id: "split-grid-4x2-portrait",
    split: "grid",
    screens: 8,
    gridConfig: { columns: 4, rows: 2 },
    cells: Array.from({ length: 8 }, (_, i) => createCellConfig(i)),
    layout: PRESET_STYLES.layout.withGap,
  },
  {
    id: "split-grid-4x2-square",
    split: "grid",
    screens: 8,
    gridConfig: { columns: 4, rows: 2 },
    cells: Array.from({ length: 8 }, (_, i) => createCellConfig(i)),
    layout: PRESET_STYLES.layout.withGap,
  },
  // 3x3
  {
    id: "split-grid-3x3-landscape",
    split: "grid",
    screens: 9,
    gridConfig: { columns: 3, rows: 3 },
    cells: Array.from({ length: 9 }, (_, i) => createCellConfig(i)),
    layout: PRESET_STYLES.layout.withGap,
  },
  {
    id: "split-grid-3x3-portrait",
    split: "grid",
    screens: 9,
    gridConfig: { columns: 3, rows: 3 },
    cells: Array.from({ length: 9 }, (_, i) => createCellConfig(i)),
    layout: PRESET_STYLES.layout.withGap,
  },
  {
    id: "split-grid-3x3-square",
    split: "grid",
    screens: 9,
    gridConfig: { columns: 3, rows: 3 },
    cells: Array.from({ length: 9 }, (_, i) => createCellConfig(i)),
    layout: PRESET_STYLES.layout.withGap,
  },
  // 3x4 и 4x3
  {
    id: "split-grid-3x4-landscape",
    split: "grid",
    screens: 12,
    gridConfig: { columns: 4, rows: 3 },
    cells: Array.from({ length: 12 }, (_, i) => createCellConfig(i)),
    layout: PRESET_STYLES.layout.withGap,
  },
  {
    id: "split-grid-3x4-portrait",
    split: "grid",
    screens: 12,
    gridConfig: { columns: 3, rows: 4 },
    cells: Array.from({ length: 12 }, (_, i) => createCellConfig(i)),
    layout: PRESET_STYLES.layout.withGap,
  },
  {
    id: "split-grid-3x4-square",
    split: "grid",
    screens: 12,
    gridConfig: { columns: 3, rows: 4 },
    cells: Array.from({ length: 12 }, (_, i) => createCellConfig(i)),
    layout: PRESET_STYLES.layout.withGap,
  },
  {
    id: "split-grid-4x3-landscape",
    split: "grid",
    screens: 12,
    gridConfig: { columns: 4, rows: 3 },
    cells: Array.from({ length: 12 }, (_, i) => createCellConfig(i)),
    layout: PRESET_STYLES.layout.withGap,
  },
  {
    id: "split-grid-4x3-portrait",
    split: "grid",
    screens: 12,
    gridConfig: { columns: 4, rows: 3 },
    cells: Array.from({ length: 12 }, (_, i) => createCellConfig(i)),
    layout: PRESET_STYLES.layout.withGap,
  },
  {
    id: "split-grid-4x3-square",
    split: "grid",
    screens: 12,
    gridConfig: { columns: 4, rows: 3 },
    cells: Array.from({ length: 12 }, (_, i) => createCellConfig(i)),
    layout: PRESET_STYLES.layout.withGap,
  },
  // 4x4
  {
    id: "split-grid-4x4-landscape",
    split: "grid",
    screens: 16,
    gridConfig: { columns: 4, rows: 4 },
    cells: Array.from({ length: 16 }, (_, i) => createCellConfig(i)),
    layout: PRESET_STYLES.layout.withGap,
  },
  {
    id: "split-grid-4x4-portrait",
    split: "grid",
    screens: 16,
    gridConfig: { columns: 4, rows: 4 },
    cells: Array.from({ length: 16 }, (_, i) => createCellConfig(i)),
    layout: PRESET_STYLES.layout.withGap,
  },
  {
    id: "split-grid-4x4-square",
    split: "grid",
    screens: 16,
    gridConfig: { columns: 4, rows: 4 },
    cells: Array.from({ length: 16 }, (_, i) => createCellConfig(i)),
    layout: PRESET_STYLES.layout.withGap,
  },
  // 5x2
  {
    id: "split-grid-5x2-landscape",
    split: "grid",
    screens: 10,
    gridConfig: { columns: 5, rows: 2 },
    cells: Array.from({ length: 10 }, (_, i) => createCellConfig(i)),
    layout: PRESET_STYLES.layout.withGap,
  },
  // 5x5
  {
    id: "split-grid-5x5-landscape",
    split: "grid",
    screens: 25,
    gridConfig: { columns: 5, rows: 5 },
    cells: Array.from({ length: 25 }, (_, i) => createCellConfig(i)),
    layout: PRESET_STYLES.layout.withGap,
  },
  {
    id: "split-grid-5x5-portrait",
    split: "grid",
    screens: 25,
    gridConfig: { columns: 5, rows: 5 },
    cells: Array.from({ length: 25 }, (_, i) => createCellConfig(i)),
    layout: PRESET_STYLES.layout.withGap,
  },
  {
    id: "split-grid-5x5-square",
    split: "grid",
    screens: 25,
    gridConfig: { columns: 5, rows: 5 },
    cells: Array.from({ length: 25 }, (_, i) => createCellConfig(i)),
    layout: PRESET_STYLES.layout.withGap,
  },
]

// ===== КАСТОМНЫЕ ШАБЛОНЫ =====

// 1-3 layouts (1 большой + 3 маленьких)
const oneThreeTemplates: MediaTemplateConfig[] = [
  {
    id: "split-1-3-landscape",
    split: "custom",
    screens: 4,
    cells: [
      createCellConfig(0, { background: { color: "#23262b" } }),
      createCellConfig(1),
      createCellConfig(2),
      createCellConfig(3),
    ],
    cellLayouts: [
      { position: "absolute", top: "0", left: "0", width: "50%", height: "100%" },
      { position: "absolute", top: "0", right: "0", width: "50%", height: "33.33%" },
      { position: "absolute", top: "33.33%", right: "0", width: "50%", height: "33.33%" },
      { position: "absolute", bottom: "0", right: "0", width: "50%", height: "33.33%" },
    ],
    layout: PRESET_STYLES.layout.default,
  },
  {
    id: "split-1-3-portrait",
    split: "custom",
    screens: 4,
    cells: [
      createCellConfig(0, { background: { color: "#23262b" } }),
      createCellConfig(1),
      createCellConfig(2),
      createCellConfig(3),
    ],
    cellLayouts: [
      { position: "absolute", top: "0", left: "0", width: "100%", height: "50%" },
      { position: "absolute", bottom: "0", left: "0", width: "33.33%", height: "50%" },
      { position: "absolute", bottom: "0", left: "33.33%", width: "33.33%", height: "50%" },
      { position: "absolute", bottom: "0", right: "0", width: "33.33%", height: "50%" },
    ],
    layout: PRESET_STYLES.layout.default,
  },
  {
    id: "split-1-3-square",
    split: "custom",
    screens: 4,
    cells: [
      createCellConfig(0, { background: { color: "#23262b" } }),
      createCellConfig(1),
      createCellConfig(2),
      createCellConfig(3),
    ],
    cellLayouts: [
      { position: "absolute", top: "0", left: "0", width: "50%", height: "100%" },
      { position: "absolute", top: "0", right: "0", width: "50%", height: "33.33%" },
      { position: "absolute", top: "33.33%", right: "0", width: "50%", height: "33.33%" },
      { position: "absolute", bottom: "0", right: "0", width: "50%", height: "33.33%" },
    ],
    layout: PRESET_STYLES.layout.default,
  },
  // Bottom variants
  {
    id: "split-1-3-bottom-landscape",
    split: "custom",
    screens: 4,
    cells: [
      createCellConfig(0, { background: { color: "#23262b" } }),
      createCellConfig(1),
      createCellConfig(2),
      createCellConfig(3),
    ],
    cellLayouts: [
      { position: "absolute", top: "0", left: "0", width: "100%", height: "50%" },
      { position: "absolute", bottom: "0", left: "0", width: "33.33%", height: "50%" },
      { position: "absolute", bottom: "0", left: "33.33%", width: "33.33%", height: "50%" },
      { position: "absolute", bottom: "0", right: "0", width: "33.33%", height: "50%" },
    ],
    layout: PRESET_STYLES.layout.default,
  },
  {
    id: "split-1-3-bottom-portrait",
    split: "custom",
    screens: 4,
    cells: [
      createCellConfig(0, { background: { color: "#23262b" } }),
      createCellConfig(1),
      createCellConfig(2),
      createCellConfig(3),
    ],
    cellLayouts: [
      { position: "absolute", top: "0", left: "0", width: "100%", height: "70%" },
      { position: "absolute", bottom: "0", left: "0", width: "33.33%", height: "30%" },
      { position: "absolute", bottom: "0", left: "33.33%", width: "33.33%", height: "30%" },
      { position: "absolute", bottom: "0", right: "0", width: "33.33%", height: "30%" },
    ],
    layout: PRESET_STYLES.layout.default,
  },
  {
    id: "split-1-3-bottom-square",
    split: "custom",
    screens: 4,
    cells: [
      createCellConfig(0, { background: { color: "#23262b" } }),
      createCellConfig(1),
      createCellConfig(2),
      createCellConfig(3),
    ],
    cellLayouts: [
      { position: "absolute", top: "0", left: "0", width: "100%", height: "50%" },
      { position: "absolute", bottom: "0", left: "0", width: "33.33%", height: "50%" },
      { position: "absolute", bottom: "0", left: "33.33%", width: "33.33%", height: "50%" },
      { position: "absolute", bottom: "0", right: "0", width: "33.33%", height: "50%" },
    ],
    layout: PRESET_STYLES.layout.default,
  },
]

// 3-1 layouts (3 маленьких + 1 большой)
const threeOneTemplates: MediaTemplateConfig[] = [
  {
    id: "split-3-1-landscape",
    split: "custom",
    screens: 4,
    cells: [
      createCellConfig(0),
      createCellConfig(1),
      createCellConfig(2),
      createCellConfig(3, { background: { color: "#23262b" } }),
    ],
    cellLayouts: [
      { position: "absolute", top: "0", left: "0", width: "50%", height: "33.33%" },
      { position: "absolute", top: "33.33%", left: "0", width: "50%", height: "33.33%" },
      { position: "absolute", bottom: "0", left: "0", width: "50%", height: "33.33%" },
      { position: "absolute", top: "0", right: "0", width: "50%", height: "100%" },
    ],
    layout: PRESET_STYLES.layout.default,
  },
  {
    id: "split-3-1-portrait",
    split: "custom",
    screens: 4,
    cells: [
      createCellConfig(0),
      createCellConfig(1),
      createCellConfig(2),
      createCellConfig(3, { background: { color: "#23262b" } }),
    ],
    cellLayouts: [
      { position: "absolute", top: "0", left: "0", width: "33.33%", height: "50%" },
      { position: "absolute", top: "0", left: "33.33%", width: "33.33%", height: "50%" },
      { position: "absolute", top: "0", right: "0", width: "33.33%", height: "50%" },
      { position: "absolute", bottom: "0", left: "0", width: "100%", height: "50%" },
    ],
    layout: PRESET_STYLES.layout.default,
  },
  {
    id: "split-3-1-square",
    split: "custom",
    screens: 4,
    cells: [
      createCellConfig(0),
      createCellConfig(1),
      createCellConfig(2),
      createCellConfig(3, { background: { color: "#23262b" } }),
    ],
    cellLayouts: [
      { position: "absolute", top: "0", left: "0", width: "50%", height: "33.33%" },
      { position: "absolute", top: "33.33%", left: "0", width: "50%", height: "33.33%" },
      { position: "absolute", bottom: "0", left: "0", width: "50%", height: "33.33%" },
      { position: "absolute", top: "0", right: "0", width: "50%", height: "100%" },
    ],
    layout: PRESET_STYLES.layout.default,
  },
  // Bottom variants
  {
    id: "split-3-1-bottom-landscape",
    split: "custom",
    screens: 4,
    cells: [
      createCellConfig(0),
      createCellConfig(1),
      createCellConfig(2),
      createCellConfig(3, { background: { color: "#23262b" } }),
    ],
    cellLayouts: [
      { position: "absolute", top: "0", left: "0", width: "33.33%", height: "50%" },
      { position: "absolute", top: "0", left: "33.33%", width: "33.33%", height: "50%" },
      { position: "absolute", top: "0", right: "0", width: "33.33%", height: "50%" },
      { position: "absolute", bottom: "0", left: "0", width: "100%", height: "50%" },
    ],
    layout: PRESET_STYLES.layout.default,
  },
  // Right variants
  {
    id: "split-3-1-right-landscape",
    split: "custom",
    screens: 4,
    cells: [
      createCellConfig(0),
      createCellConfig(1),
      createCellConfig(2),
      createCellConfig(3, { background: { color: "#23262b" } }),
    ],
    cellLayouts: [
      { position: "absolute", top: "0", left: "0", width: "33.33%", height: "50%" },
      { position: "absolute", bottom: "0", left: "0", width: "33.33%", height: "50%" },
      { position: "absolute", top: "0", left: "33.33%", width: "33.33%", height: "100%" },
      { position: "absolute", top: "0", right: "0", width: "33.33%", height: "100%" },
    ],
    layout: PRESET_STYLES.layout.default,
  },
  {
    id: "split-3-1-right-portrait",
    split: "custom",
    screens: 4,
    cells: [
      createCellConfig(0),
      createCellConfig(1),
      createCellConfig(2),
      createCellConfig(3, { background: { color: "#23262b" } }),
    ],
    cellLayouts: [
      { position: "absolute", top: "0", left: "0", width: "50%", height: "33.33%" },
      { position: "absolute", top: "33.33%", left: "0", width: "50%", height: "33.33%" },
      { position: "absolute", bottom: "0", left: "0", width: "50%", height: "33.33%" },
      { position: "absolute", top: "0", right: "0", width: "50%", height: "100%" },
    ],
    layout: PRESET_STYLES.layout.default,
  },
  {
    id: "split-3-1-right-square",
    split: "custom",
    screens: 4,
    cells: [
      createCellConfig(0),
      createCellConfig(1),
      createCellConfig(2),
      createCellConfig(3, { background: { color: "#23262b" } }),
    ],
    cellLayouts: [
      { position: "absolute", top: "0", left: "0", width: "50%", height: "33.33%" },
      { position: "absolute", top: "33.33%", left: "0", width: "50%", height: "33.33%" },
      { position: "absolute", bottom: "0", left: "0", width: "50%", height: "33.33%" },
      { position: "absolute", top: "0", right: "0", width: "50%", height: "100%" },
    ],
    layout: PRESET_STYLES.layout.default,
  },
]

// Mixed layouts
const mixedTemplates: MediaTemplateConfig[] = [
  {
    id: "split-mixed-1-landscape",
    split: "custom",
    screens: 3,
    cells: [createCellConfig(0, { background: { color: "#23262b" } }), createCellConfig(1), createCellConfig(2)],
    cellLayouts: [
      { position: "absolute", top: "0", left: "0", width: "50%", height: "100%" },
      { position: "absolute", top: "0", right: "0", width: "50%", height: "50%" },
      { position: "absolute", bottom: "0", right: "0", width: "50%", height: "50%" },
    ],
    layout: PRESET_STYLES.layout.default,
  },
  {
    id: "split-mixed-1-portrait",
    split: "custom",
    screens: 3,
    cells: [createCellConfig(0, { background: { color: "#23262b" } }), createCellConfig(1), createCellConfig(2)],
    cellLayouts: [
      { position: "absolute", top: "0", left: "0", width: "100%", height: "50%" },
      { position: "absolute", bottom: "0", left: "0", width: "50%", height: "50%" },
      { position: "absolute", bottom: "0", right: "0", width: "50%", height: "50%" },
    ],
    layout: PRESET_STYLES.layout.default,
  },
  {
    id: "split-mixed-1-square",
    split: "custom",
    screens: 3,
    cells: [createCellConfig(0, { background: { color: "#23262b" } }), createCellConfig(1), createCellConfig(2)],
    cellLayouts: [
      { position: "absolute", top: "0", left: "0", width: "50%", height: "100%" },
      { position: "absolute", top: "0", right: "0", width: "50%", height: "50%" },
      { position: "absolute", bottom: "0", right: "0", width: "50%", height: "50%" },
    ],
    layout: PRESET_STYLES.layout.default,
  },
  {
    id: "split-mixed-2-landscape",
    split: "custom",
    screens: 3,
    cells: [createCellConfig(0), createCellConfig(1), createCellConfig(2, { background: { color: "#23262b" } })],
    cellLayouts: [
      { position: "absolute", top: "0", left: "0", width: "50%", height: "50%" },
      { position: "absolute", bottom: "0", left: "0", width: "50%", height: "50%" },
      { position: "absolute", top: "0", right: "0", width: "50%", height: "100%" },
    ],
    layout: PRESET_STYLES.layout.default,
  },
  {
    id: "split-mixed-2-portrait",
    split: "custom",
    screens: 3,
    cells: [createCellConfig(0), createCellConfig(1), createCellConfig(2, { background: { color: "#23262b" } })],
    cellLayouts: [
      { position: "absolute", top: "0", left: "0", width: "50%", height: "50%" },
      { position: "absolute", top: "0", right: "0", width: "50%", height: "50%" },
      { position: "absolute", bottom: "0", left: "0", width: "100%", height: "50%" },
    ],
    layout: PRESET_STYLES.layout.default,
  },
  {
    id: "split-mixed-2-square",
    split: "custom",
    screens: 3,
    cells: [createCellConfig(0), createCellConfig(1), createCellConfig(2, { background: { color: "#23262b" } })],
    cellLayouts: [
      { position: "absolute", top: "0", left: "0", width: "50%", height: "50%" },
      { position: "absolute", bottom: "0", left: "0", width: "50%", height: "50%" },
      { position: "absolute", top: "0", right: "0", width: "50%", height: "100%" },
    ],
    layout: PRESET_STYLES.layout.default,
  },
]

// Custom 5-screen layouts
const customFiveTemplates: MediaTemplateConfig[] = [
  {
    id: "split-custom-5-1-landscape",
    split: "custom",
    screens: 5,
    cells: Array.from({ length: 5 }, (_, i) => createCellConfig(i)),
    cellLayouts: [
      { position: "absolute", top: "0", left: "0", width: "50%", height: "60%" },
      { position: "absolute", top: "0", right: "0", width: "50%", height: "60%" },
      { position: "absolute", bottom: "0", left: "0", width: "33.33%", height: "40%" },
      { position: "absolute", bottom: "0", left: "33.33%", width: "33.33%", height: "40%" },
      { position: "absolute", bottom: "0", right: "0", width: "33.33%", height: "40%" },
    ],
    layout: PRESET_STYLES.layout.default,
  },
  {
    id: "split-custom-5-1-portrait",
    split: "custom",
    screens: 5,
    cells: Array.from({ length: 5 }, (_, i) => createCellConfig(i)),
    cellLayouts: [
      { position: "absolute", top: "0", left: "0", width: "100%", height: "40%" },
      { position: "absolute", top: "40%", left: "0", width: "50%", height: "30%" },
      { position: "absolute", top: "40%", right: "0", width: "50%", height: "30%" },
      { position: "absolute", bottom: "0", left: "0", width: "50%", height: "30%" },
      { position: "absolute", bottom: "0", right: "0", width: "50%", height: "30%" },
    ],
    layout: PRESET_STYLES.layout.default,
  },
  {
    id: "split-custom-5-2-landscape",
    split: "custom",
    screens: 5,
    cells: Array.from({ length: 5 }, (_, i) => createCellConfig(i)),
    cellLayouts: [
      { position: "absolute", top: "0", left: "0", width: "50%", height: "100%" },
      { position: "absolute", top: "0", right: "0", width: "50%", height: "25%" },
      { position: "absolute", top: "25%", right: "0", width: "50%", height: "25%" },
      { position: "absolute", top: "50%", right: "0", width: "50%", height: "25%" },
      { position: "absolute", bottom: "0", right: "0", width: "50%", height: "25%" },
    ],
    layout: PRESET_STYLES.layout.default,
  },
  {
    id: "split-custom-5-2-portrait",
    split: "custom",
    screens: 5,
    cells: Array.from({ length: 5 }, (_, i) => createCellConfig(i)),
    cellLayouts: [
      { position: "absolute", top: "0", left: "0", width: "100%", height: "50%" },
      { position: "absolute", bottom: "0", left: "0", width: "25%", height: "50%" },
      { position: "absolute", bottom: "0", left: "25%", width: "25%", height: "50%" },
      { position: "absolute", bottom: "0", left: "50%", width: "25%", height: "50%" },
      { position: "absolute", bottom: "0", right: "0", width: "25%", height: "50%" },
    ],
    layout: PRESET_STYLES.layout.default,
  },
  {
    id: "split-custom-5-3-landscape",
    split: "custom",
    screens: 5,
    cells: Array.from({ length: 5 }, (_, i) => createCellConfig(i)),
    cellLayouts: [
      { position: "absolute", top: "0", left: "0", width: "25%", height: "50%" },
      { position: "absolute", bottom: "0", left: "0", width: "25%", height: "50%" },
      { position: "absolute", top: "0", left: "25%", width: "50%", height: "100%" },
      { position: "absolute", top: "0", right: "0", width: "25%", height: "50%" },
      { position: "absolute", bottom: "0", right: "0", width: "25%", height: "50%" },
    ],
    layout: PRESET_STYLES.layout.default,
  },
  {
    id: "split-custom-5-3-portrait",
    split: "custom",
    screens: 5,
    cells: Array.from({ length: 5 }, (_, i) => createCellConfig(i)),
    cellLayouts: [
      { position: "absolute", top: "0", left: "0", width: "50%", height: "25%" },
      { position: "absolute", top: "0", right: "0", width: "50%", height: "25%" },
      { position: "absolute", top: "25%", left: "0", width: "100%", height: "50%" },
      { position: "absolute", bottom: "0", left: "0", width: "50%", height: "25%" },
      { position: "absolute", bottom: "0", right: "0", width: "50%", height: "25%" },
    ],
    layout: PRESET_STYLES.layout.default,
  },
  {
    id: "split-custom-5-3-square",
    split: "custom",
    screens: 5,
    cells: Array.from({ length: 5 }, (_, i) => createCellConfig(i)),
    cellLayouts: [
      { position: "absolute", top: "0", left: "0", width: "25%", height: "50%" },
      { position: "absolute", bottom: "0", left: "0", width: "25%", height: "50%" },
      { position: "absolute", top: "0", left: "25%", width: "50%", height: "100%" },
      { position: "absolute", top: "0", right: "0", width: "25%", height: "50%" },
      { position: "absolute", bottom: "0", right: "0", width: "25%", height: "50%" },
    ],
    layout: PRESET_STYLES.layout.default,
  },
  {
    id: "split-custom-5-4-square",
    split: "custom",
    screens: 5,
    cells: Array.from({ length: 5 }, (_, i) => createCellConfig(i)),
    cellLayouts: [
      { position: "absolute", top: "0", left: "0", width: "33.33%", height: "33.33%" },
      { position: "absolute", top: "0", left: "33.33%", width: "33.33%", height: "33.33%" },
      { position: "absolute", top: "0", right: "0", width: "33.33%", height: "33.33%" },
      { position: "absolute", top: "33.33%", left: "16.67%", width: "66.66%", height: "66.66%" },
      { position: "absolute", bottom: "0", left: "0", width: "33.33%", height: "33.33%" },
    ],
    layout: PRESET_STYLES.layout.default,
  },
]

// Custom 7-screen layouts (only for square)
const customSevenTemplates: MediaTemplateConfig[] = [
  {
    id: "split-custom-7-1-square",
    split: "custom",
    screens: 7,
    cells: Array.from({ length: 7 }, (_, i) => createCellConfig(i)),
    cellLayouts: [
      { position: "absolute", top: "0", left: "0", width: "33.33%", height: "33.33%" },
      { position: "absolute", top: "0", left: "33.33%", width: "33.33%", height: "33.33%" },
      { position: "absolute", top: "0", right: "0", width: "33.33%", height: "33.33%" },
      { position: "absolute", top: "33.33%", left: "0", width: "33.33%", height: "33.33%" },
      { position: "absolute", top: "33.33%", left: "33.33%", width: "33.33%", height: "33.33%" },
      { position: "absolute", top: "33.33%", right: "0", width: "33.33%", height: "33.33%" },
      { position: "absolute", bottom: "0", left: "16.67%", width: "66.66%", height: "33.33%" },
    ],
    layout: PRESET_STYLES.layout.default,
  },
  {
    id: "split-custom-7-2-square",
    split: "custom",
    screens: 7,
    cells: Array.from({ length: 7 }, (_, i) => createCellConfig(i)),
    cellLayouts: [
      { position: "absolute", top: "0", left: "0", width: "50%", height: "50%" },
      { position: "absolute", top: "0", right: "0", width: "50%", height: "25%" },
      { position: "absolute", top: "25%", right: "0", width: "50%", height: "25%" },
      { position: "absolute", bottom: "0", left: "0", width: "25%", height: "50%" },
      { position: "absolute", bottom: "0", left: "25%", width: "25%", height: "50%" },
      { position: "absolute", bottom: "0", left: "50%", width: "25%", height: "50%" },
      { position: "absolute", bottom: "0", right: "0", width: "25%", height: "50%" },
    ],
    layout: PRESET_STYLES.layout.default,
  },
  {
    id: "split-custom-7-3-square",
    split: "custom",
    screens: 7,
    cells: Array.from({ length: 7 }, (_, i) => createCellConfig(i)),
    cellLayouts: [
      { position: "absolute", top: "0", left: "0", width: "20%", height: "50%" },
      { position: "absolute", top: "0", left: "20%", width: "20%", height: "50%" },
      { position: "absolute", top: "0", left: "40%", width: "20%", height: "50%" },
      { position: "absolute", top: "0", left: "60%", width: "20%", height: "50%" },
      { position: "absolute", top: "0", right: "0", width: "20%", height: "50%" },
      { position: "absolute", bottom: "0", left: "10%", width: "40%", height: "50%" },
      { position: "absolute", bottom: "0", right: "10%", width: "40%", height: "50%" },
    ],
    layout: PRESET_STYLES.layout.default,
  },
  {
    id: "split-custom-7-4-square",
    split: "custom",
    screens: 7,
    cells: Array.from({ length: 7 }, (_, i) => createCellConfig(i)),
    cellLayouts: [
      { position: "absolute", top: "0", left: "0", width: "100%", height: "33.33%" },
      { position: "absolute", top: "33.33%", left: "0", width: "33.33%", height: "33.33%" },
      { position: "absolute", top: "33.33%", left: "33.33%", width: "33.33%", height: "33.33%" },
      { position: "absolute", top: "33.33%", right: "0", width: "33.33%", height: "33.33%" },
      { position: "absolute", bottom: "0", left: "0", width: "33.33%", height: "33.33%" },
      { position: "absolute", bottom: "0", left: "33.33%", width: "33.33%", height: "33.33%" },
      { position: "absolute", bottom: "0", right: "0", width: "33.33%", height: "33.33%" },
    ],
    layout: PRESET_STYLES.layout.default,
  },
]

// ===== ЭКСПОРТ =====

// Объединяем все шаблоны
export const ALL_TEMPLATE_CONFIGS: MediaTemplateConfig[] = [
  ...verticalTemplates,
  ...horizontalTemplates,
  ...diagonalTemplates,
  ...tripleScreenTemplates,
  ...quadScreenTemplates,
  ...gridTemplates,
  ...oneThreeTemplates,
  ...threeOneTemplates,
  ...mixedTemplates,
  ...customFiveTemplates,
  ...customSevenTemplates,
]

// Создаем карту для быстрого доступа
export const ALL_TEMPLATE_CONFIG_MAP: Record<string, MediaTemplateConfig> = ALL_TEMPLATE_CONFIGS.reduce<
  Record<string, MediaTemplateConfig>
>((acc, config) => {
  acc[config.id] = config
  return acc
}, {})

// Функция для получения конфигурации по ID
export function getAllTemplateConfig(templateId: string): MediaTemplateConfig | undefined {
  return ALL_TEMPLATE_CONFIG_MAP[templateId]
}
