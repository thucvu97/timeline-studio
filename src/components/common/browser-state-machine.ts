import { assign, createMachine } from "xstate";

// Общие размеры превью для всех вкладок браузера
export const PREVIEW_SIZES = [100, 125, 150, 200, 250, 300, 400];
export const DEFAULT_PREVIEW_SIZE_INDEX = 1; // 125px (по умолчанию)

/**
 * Тип вкладки браузера
 */
export type BrowserTab = "media" | "music" | "effects" | "filters" | "transitions";

/**
 * Режимы отображения для разных типов контента
 */
export type ViewMode = "list" | "grid" | "thumbnails";

/**
 * Контекст машины состояния браузера
 */
export interface BrowserContext {
  // Общие настройки
  activeTab: BrowserTab;

  // Настройки для каждой вкладки
  tabSettings: {
    [K in BrowserTab]: {
      searchQuery: string;
      showFavoritesOnly: boolean;
      sortBy: string;
      sortOrder: "asc" | "desc";
      groupBy: string;
      filterType: string;
      viewMode: ViewMode;
      previewSizeIndex: number;
    };
  };
}

/**
 * События машины состояния браузера
 */
export type BrowserEvent =
  | { type: "SWITCH_TAB"; tab: BrowserTab }
  | { type: "SET_SEARCH_QUERY"; query: string; tab?: BrowserTab }
  | { type: "TOGGLE_FAVORITES"; tab?: BrowserTab }
  | { type: "SET_SORT"; sortBy: string; sortOrder: "asc" | "desc"; tab?: BrowserTab }
  | { type: "SET_GROUP_BY"; groupBy: string; tab?: BrowserTab }
  | { type: "SET_FILTER"; filterType: string; tab?: BrowserTab }
  | { type: "SET_VIEW_MODE"; viewMode: ViewMode; tab?: BrowserTab }
  | { type: "SET_PREVIEW_SIZE"; sizeIndex: number; tab?: BrowserTab }
  | { type: "RESET_TAB_SETTINGS"; tab: BrowserTab }
  | { type: "LOAD_SETTINGS"; settings: Partial<BrowserContext> }
  | { type: "SAVE_SETTINGS" };

/**
 * Начальные настройки для каждой вкладки
 */
const getInitialTabSettings = (tab: BrowserTab) => ({
  searchQuery: "",
  showFavoritesOnly: false,
  sortBy: "name",
  sortOrder: "asc" as const,
  groupBy: "none",
  filterType: "all",
  viewMode: (tab === "music" ? "list" : "thumbnails") as ViewMode,
  previewSizeIndex: DEFAULT_PREVIEW_SIZE_INDEX,
});

/**
 * Начальный контекст машины состояния
 */
const initialContext: BrowserContext = {
  activeTab: "media",
  tabSettings: {
    media: getInitialTabSettings("media"),
    music: getInitialTabSettings("music"),
    effects: getInitialTabSettings("effects"),
    filters: getInitialTabSettings("filters"),
    transitions: getInitialTabSettings("transitions"),
  },
};

/**
 * Машина состояния браузера
 */
export const browserMachine = createMachine({
  id: "browser",
  initial: "idle",
  context: initialContext,
  states: {
    idle: {
      on: {
        SWITCH_TAB: {
          actions: assign({
            activeTab: ({ event }) => event.tab,
          }),
        },
        SET_SEARCH_QUERY: {
          actions: assign({
            tabSettings: ({ context, event }) => {
              const tab = (event as any).tab || context.activeTab;
              return {
                ...context.tabSettings,
                [tab]: {
                  ...context.tabSettings[tab as keyof typeof context.tabSettings],
                  searchQuery: (event as any).query,
                },
              };
            },
          }),
        },
        TOGGLE_FAVORITES: {
          actions: assign({
            tabSettings: ({ context, event }) => {
              const tab = (event as any).tab || context.activeTab;
              return {
                ...context.tabSettings,
                [tab]: {
                  ...context.tabSettings[tab as keyof typeof context.tabSettings],
                  showFavoritesOnly: !context.tabSettings[tab as keyof typeof context.tabSettings].showFavoritesOnly,
                },
              };
            },
          }),
        },
        SET_SORT: {
          actions: assign({
            tabSettings: ({ context, event }) => {
              const tab = (event as any).tab || context.activeTab;
              return {
                ...context.tabSettings,
                [tab]: {
                  ...context.tabSettings[tab as keyof typeof context.tabSettings],
                  sortBy: (event as any).sortBy,
                  sortOrder: (event as any).sortOrder,
                },
              };
            },
          }),
        },
        SET_GROUP_BY: {
          actions: assign({
            tabSettings: (context, event) => {
              const tab = event.tab || context.activeTab;
              return {
                ...context.tabSettings,
                [tab]: {
                  ...context.tabSettings[tab],
                  groupBy: event.groupBy,
                },
              };
            },
          }),
        },
        SET_FILTER: {
          actions: assign({
            tabSettings: (context, event) => {
              const tab = event.tab || context.activeTab;
              return {
                ...context.tabSettings,
                [tab]: {
                  ...context.tabSettings[tab],
                  filterType: event.filterType,
                },
              };
            },
          }),
        },
        SET_VIEW_MODE: {
          actions: assign({
            tabSettings: (context, event) => {
              const tab = event.tab || context.activeTab;
              return {
                ...context.tabSettings,
                [tab]: {
                  ...context.tabSettings[tab],
                  viewMode: event.viewMode,
                },
              };
            },
          }),
        },
        SET_PREVIEW_SIZE: {
          actions: assign({
            tabSettings: (context, event) => {
              const tab = event.tab || context.activeTab;
              return {
                ...context.tabSettings,
                [tab]: {
                  ...context.tabSettings[tab],
                  previewSizeIndex: event.sizeIndex,
                },
              };
            },
          }),
        },
        RESET_TAB_SETTINGS: {
          actions: assign({
            tabSettings: (context, event) => ({
              ...context.tabSettings,
              [event.tab]: getInitialTabSettings(event.tab),
            }),
          }),
        },
        LOAD_SETTINGS: {
          actions: assign((context, event) => ({
            ...context,
            ...event.settings,
          })),
        },
        SAVE_SETTINGS: {
          // Здесь можно добавить логику сохранения в localStorage или API
        },
      },
    },
  },
});
