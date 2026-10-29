import { createRequire as __piBundleCreateRequire } from 'node:module'; const require = __piBundleCreateRequire(import.meta.url);
import {
  AgentMessageComponent,
  AgentSessionRuntime,
  ArminComponent,
  AssistantMessageComponent,
  AuthStorage,
  BashExecutionComponent,
  BorderedLoader,
  BranchSummaryMessageComponent,
  ClientPromptStashStore,
  CompactionSummaryMessageComponent,
  ConfigurationMenuComponent,
  CustomEditor,
  CustomMessageComponent,
  DaemonAgentConnection,
  DefaultPackageManager,
  DefaultResourceLoader,
  DynamicBorder,
  ExtensionEditorComponent,
  ExtensionInputComponent,
  ExtensionSelectorComponent,
  FileAuthStorageBackend,
  FooterComponent,
  InMemoryAuthStorageBackend,
  InProcessAgentConnection,
  InteractiveMode,
  LoginDialogComponent,
  ModelRegistry,
  ModelSelectorComponent,
  OAuthSelectorComponent,
  RpcClient,
  SessionImportFileNotFoundError,
  SettingsManager,
  SettingsSelectorComponent,
  SkillInvocationMessageComponent,
  ThinkingSelectorComponent,
  ToolExecutionComponent,
  TreeSelectorComponent,
  UserMessageComponent,
  UserMessageSelectorComponent,
  copyToClipboard,
  createAgentSession,
  createAgentSessionFromServices,
  createAgentSessionRuntime,
  createAgentSessionServices,
  createInteractiveModeLocalSessionHost,
  createInteractiveModeUiServices,
  createInteractiveModeUiServicesFromServices,
  loadProjectContextFiles,
  main,
  oauth_exports,
  runPrintMode,
  runRpcMode
} from "./chunk-VMTDHVBY.js";
import {
  AgentSession,
  CURRENT_SESSION_VERSION,
  Container,
  DAEMON_PROTOCOL_INFO,
  DAEMON_PROTOCOL_NAME,
  DAEMON_PROTOCOL_VERSION,
  DEFAULT_COMPACTION_SETTINGS,
  DEFAULT_MAX_BYTES,
  DEFAULT_MAX_LINES,
  DaemonClient,
  ExtensionRunner,
  IpythonKernelProvisioner,
  SelectList,
  SessionManager,
  Theme,
  VERSION,
  buildSessionContext,
  build_exports,
  calculateContextTokens,
  collectEntriesForBranchSummary,
  compact,
  convertToLlm,
  createBashTool,
  createBashToolDefinition,
  createEditTool,
  createEditToolDefinition,
  createEventBus,
  createExtensionRuntime,
  createIpythonTool,
  createIpythonToolDefinition,
  createLocalBashOperations,
  createSyntheticSourceInfo,
  defaultDaemonSocketPath,
  defineTool,
  discoverAndLoadExtensions,
  estimateTokens,
  findCutPoint,
  findTurnStartIndex,
  formatSize,
  formatSkillsForPrompt,
  generateBranchSummary,
  generateSummary,
  getAgentDir,
  getAvailableThemes,
  getLanguageFromPath,
  getLastAssistantUsage,
  getLatestCompactionEntry,
  getMarkdownTheme,
  getPythonSkillRuntimeInfo,
  getSelectListTheme,
  getSettingsListTheme,
  getShellConfig,
  highlightCode,
  initTheme,
  isBashToolResult,
  isEditToolResult,
  isIpythonToolResult,
  isToolCallEventType,
  keyHint,
  keyText,
  loadSkills,
  loadSkillsFromDir,
  migrateSessionEntries,
  parseFrontmatter,
  parseSessionEntries,
  parseSkillBlock,
  prepareBranchEntries,
  rawKeyHint,
  renderDiff,
  serializeConversation,
  shouldCompact,
  src_exports,
  src_exports2,
  src_exports3,
  stripFrontmatter,
  truncateHead,
  truncateLine,
  truncateTail,
  truncateToVisualLines,
  withFileMutationQueue,
  wrapRegisteredTool,
  wrapRegisteredTools
} from "./chunk-NDX7OULL.js";
import "./chunk-CFNASUYO.js";
import "./chunk-5QCJ5DQU.js";
import {
  compile_exports,
  value_exports2 as value_exports
} from "./chunk-CRBVRZBV.js";
import "./chunk-2T7M7VJ4.js";
import "./chunk-UIRUOAIQ.js";
import "./chunk-HXOBFFJX.js";
import "./chunk-6GUVYK6P.js";
import "./chunk-UPDAFKL5.js";
import "./chunk-MK52NEXK.js";
import {
  __export
} from "./chunk-BAWSWWEU.js";

// dist/index.js
var index_exports = {};
__export(index_exports, {
  AgentMessageComponent: () => AgentMessageComponent,
  AgentSession: () => AgentSession,
  AgentSessionRuntime: () => AgentSessionRuntime,
  ArminComponent: () => ArminComponent,
  AssistantMessageComponent: () => AssistantMessageComponent,
  AuthStorage: () => AuthStorage,
  BashExecutionComponent: () => BashExecutionComponent,
  BorderedLoader: () => BorderedLoader,
  BranchSummaryMessageComponent: () => BranchSummaryMessageComponent,
  CURRENT_SESSION_VERSION: () => CURRENT_SESSION_VERSION,
  ClientPromptStashStore: () => ClientPromptStashStore,
  CompactionSummaryMessageComponent: () => CompactionSummaryMessageComponent,
  ConfigurationMenuComponent: () => ConfigurationMenuComponent,
  CustomEditor: () => CustomEditor,
  CustomMessageComponent: () => CustomMessageComponent,
  DAEMON_PROTOCOL_INFO: () => DAEMON_PROTOCOL_INFO,
  DAEMON_PROTOCOL_NAME: () => DAEMON_PROTOCOL_NAME,
  DAEMON_PROTOCOL_VERSION: () => DAEMON_PROTOCOL_VERSION,
  DEFAULT_COMPACTION_SETTINGS: () => DEFAULT_COMPACTION_SETTINGS,
  DEFAULT_MAX_BYTES: () => DEFAULT_MAX_BYTES,
  DEFAULT_MAX_LINES: () => DEFAULT_MAX_LINES,
  DaemonAgentConnection: () => DaemonAgentConnection,
  DaemonClient: () => DaemonClient,
  DefaultPackageManager: () => DefaultPackageManager,
  DefaultResourceLoader: () => DefaultResourceLoader,
  DynamicBorder: () => DynamicBorder,
  ExtensionEditorComponent: () => ExtensionEditorComponent,
  ExtensionInputComponent: () => ExtensionInputComponent,
  ExtensionRunner: () => ExtensionRunner,
  ExtensionSelectorComponent: () => ExtensionSelectorComponent,
  FileAuthStorageBackend: () => FileAuthStorageBackend,
  FooterComponent: () => FooterComponent,
  InMemoryAuthStorageBackend: () => InMemoryAuthStorageBackend,
  InProcessAgentConnection: () => InProcessAgentConnection,
  InteractiveMode: () => InteractiveMode,
  IpythonKernelProvisioner: () => IpythonKernelProvisioner,
  LoginDialogComponent: () => LoginDialogComponent,
  ModelRegistry: () => ModelRegistry,
  ModelSelectorComponent: () => ModelSelectorComponent,
  OAuthSelectorComponent: () => OAuthSelectorComponent,
  RpcClient: () => RpcClient,
  SessionImportFileNotFoundError: () => SessionImportFileNotFoundError,
  SessionManager: () => SessionManager,
  SettingsManager: () => SettingsManager,
  SettingsSelectorComponent: () => SettingsSelectorComponent,
  ShowImagesSelectorComponent: () => ShowImagesSelectorComponent,
  SkillInvocationMessageComponent: () => SkillInvocationMessageComponent,
  Theme: () => Theme,
  ThemeSelectorComponent: () => ThemeSelectorComponent,
  ThinkingSelectorComponent: () => ThinkingSelectorComponent,
  ToolExecutionComponent: () => ToolExecutionComponent,
  TreeSelectorComponent: () => TreeSelectorComponent,
  UserMessageComponent: () => UserMessageComponent,
  UserMessageSelectorComponent: () => UserMessageSelectorComponent,
  VERSION: () => VERSION,
  buildSessionContext: () => buildSessionContext,
  calculateContextTokens: () => calculateContextTokens,
  collectEntriesForBranchSummary: () => collectEntriesForBranchSummary,
  compact: () => compact,
  convertToLlm: () => convertToLlm,
  copyToClipboard: () => copyToClipboard,
  createAgentSession: () => createAgentSession,
  createAgentSessionFromServices: () => createAgentSessionFromServices,
  createAgentSessionRuntime: () => createAgentSessionRuntime,
  createAgentSessionServices: () => createAgentSessionServices,
  createBashTool: () => createBashTool,
  createBashToolDefinition: () => createBashToolDefinition,
  createEditTool: () => createEditTool,
  createEditToolDefinition: () => createEditToolDefinition,
  createEventBus: () => createEventBus,
  createExtensionRuntime: () => createExtensionRuntime,
  createInteractiveModeLocalSessionHost: () => createInteractiveModeLocalSessionHost,
  createInteractiveModeUiServices: () => createInteractiveModeUiServices,
  createInteractiveModeUiServicesFromServices: () => createInteractiveModeUiServicesFromServices,
  createIpythonTool: () => createIpythonTool,
  createIpythonToolDefinition: () => createIpythonToolDefinition,
  createLocalBashOperations: () => createLocalBashOperations,
  createSyntheticSourceInfo: () => createSyntheticSourceInfo,
  defaultDaemonSocketPath: () => defaultDaemonSocketPath,
  defineTool: () => defineTool,
  discoverAndLoadExtensions: () => discoverAndLoadExtensions,
  estimateTokens: () => estimateTokens,
  findCutPoint: () => findCutPoint,
  findTurnStartIndex: () => findTurnStartIndex,
  formatSize: () => formatSize,
  formatSkillsForPrompt: () => formatSkillsForPrompt,
  generateBranchSummary: () => generateBranchSummary,
  generateSummary: () => generateSummary,
  getAgentDir: () => getAgentDir,
  getLanguageFromPath: () => getLanguageFromPath,
  getLastAssistantUsage: () => getLastAssistantUsage,
  getLatestCompactionEntry: () => getLatestCompactionEntry,
  getMarkdownTheme: () => getMarkdownTheme,
  getPythonSkillRuntimeInfo: () => getPythonSkillRuntimeInfo,
  getSelectListTheme: () => getSelectListTheme,
  getSettingsListTheme: () => getSettingsListTheme,
  getShellConfig: () => getShellConfig,
  highlightCode: () => highlightCode,
  initTheme: () => initTheme,
  isBashToolResult: () => isBashToolResult,
  isEditToolResult: () => isEditToolResult,
  isIpythonToolResult: () => isIpythonToolResult,
  isToolCallEventType: () => isToolCallEventType,
  keyHint: () => keyHint,
  keyText: () => keyText,
  loadProjectContextFiles: () => loadProjectContextFiles,
  loadSkills: () => loadSkills,
  loadSkillsFromDir: () => loadSkillsFromDir,
  main: () => main,
  migrateSessionEntries: () => migrateSessionEntries,
  parseFrontmatter: () => parseFrontmatter,
  parseSessionEntries: () => parseSessionEntries,
  parseSkillBlock: () => parseSkillBlock,
  prepareBranchEntries: () => prepareBranchEntries,
  rawKeyHint: () => rawKeyHint,
  renderDiff: () => renderDiff,
  runPrintMode: () => runPrintMode,
  runRpcMode: () => runRpcMode,
  serializeConversation: () => serializeConversation,
  shouldCompact: () => shouldCompact,
  stripFrontmatter: () => stripFrontmatter,
  truncateHead: () => truncateHead,
  truncateLine: () => truncateLine,
  truncateTail: () => truncateTail,
  truncateToVisualLines: () => truncateToVisualLines,
  withFileMutationQueue: () => withFileMutationQueue,
  wrapRegisteredTool: () => wrapRegisteredTool,
  wrapRegisteredTools: () => wrapRegisteredTools
});

// dist/modes/interactive/components/show-images-selector.js
var SHOW_IMAGES_SELECT_LIST_LAYOUT = {
  minPrimaryColumnWidth: 12,
  maxPrimaryColumnWidth: 32
};
var ShowImagesSelectorComponent = class extends Container {
  selectList;
  constructor(currentValue, onSelect, onCancel) {
    super();
    const items = [
      { value: "yes", label: "Yes", description: "Show image type and dimensions" },
      { value: "no", label: "No", description: "Show text placeholder instead" }
    ];
    this.addChild(new DynamicBorder());
    this.selectList = new SelectList(items, 5, getSelectListTheme(), SHOW_IMAGES_SELECT_LIST_LAYOUT);
    this.selectList.setSelectedIndex(currentValue ? 0 : 1);
    this.selectList.onSelect = (item) => {
      onSelect(item.value === "yes");
    };
    this.selectList.onCancel = () => {
      onCancel();
    };
    this.addChild(this.selectList);
    this.addChild(new DynamicBorder());
  }
  getSelectList() {
    return this.selectList;
  }
};

// dist/modes/interactive/components/theme-selector.js
var THEME_SELECT_LIST_LAYOUT = {
  minPrimaryColumnWidth: 12,
  maxPrimaryColumnWidth: 32
};
var ThemeSelectorComponent = class extends Container {
  selectList;
  onPreview;
  constructor(currentTheme, onSelect, onCancel, onPreview) {
    super();
    this.onPreview = onPreview;
    const themes = getAvailableThemes();
    const themeItems = themes.map((name) => ({
      value: name,
      label: name,
      description: name === currentTheme ? "(current)" : void 0
    }));
    this.addChild(new DynamicBorder());
    this.selectList = new SelectList(themeItems, 10, getSelectListTheme(), THEME_SELECT_LIST_LAYOUT);
    const currentIndex = themes.indexOf(currentTheme);
    if (currentIndex !== -1) {
      this.selectList.setSelectedIndex(currentIndex);
    }
    this.selectList.onSelect = (item) => {
      onSelect(item.value);
    };
    this.selectList.onCancel = () => {
      onCancel();
    };
    this.selectList.onSelectionChange = (item) => {
      this.onPreview(item.value);
    };
    this.addChild(this.selectList);
    this.addChild(new DynamicBorder());
  }
  getSelectList() {
    return this.selectList;
  }
};

// dist/core/extensions/bundled-modules.js
var VIRTUAL_MODULES = {
  typebox: build_exports,
  "typebox/compile": compile_exports,
  "typebox/value": value_exports,
  "@sinclair/typebox": build_exports,
  "@sinclair/typebox/compile": compile_exports,
  "@sinclair/typebox/value": value_exports,
  "@earendil-works/pi-agent-core": src_exports2,
  "@earendil-works/pi-tui": src_exports3,
  "@earendil-works/pi-ai": src_exports,
  "@earendil-works/pi-ai/oauth": oauth_exports,
  "@earendil-works/pi-coding-agent": index_exports,
  "@mariozechner/pi-agent-core": src_exports2,
  "@mariozechner/pi-tui": src_exports3,
  "@mariozechner/pi-ai": src_exports,
  "@mariozechner/pi-ai/oauth": oauth_exports,
  "@mariozechner/pi-coding-agent": index_exports
};
export {
  VIRTUAL_MODULES
};
