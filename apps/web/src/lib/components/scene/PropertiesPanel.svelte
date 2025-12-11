<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import type { Token, Light, Wall, Door, Window as WindowType, Drawing, Tile, Region } from '@vtt/shared';

  // Import all property editors
  import TokenProperties from './properties/TokenProperties.svelte';
  import LightProperties from './properties/LightProperties.svelte';
  import WallProperties from './properties/WallProperties.svelte';
  import DoorProperties from './properties/DoorProperties.svelte';
  import WindowProperties from './properties/WindowProperties.svelte';
  import DrawingProperties from './properties/DrawingProperties.svelte';
  import TileProperties from './properties/TileProperties.svelte';
  import RegionProperties from './properties/RegionProperties.svelte';
  import MultiSelectProperties from './properties/MultiSelectProperties.svelte';

  // Import all tool settings
  import WallToolSettings from './properties/WallToolSettings.svelte';
  import DoorToolSettings from './properties/DoorToolSettings.svelte';
  import WindowToolSettings from './properties/WindowToolSettings.svelte';
  import LightToolSettings from './properties/LightToolSettings.svelte';
  import DrawingToolSettings from './properties/DrawingToolSettings.svelte';
  import TileToolSettings from './properties/TileToolSettings.svelte';
  import RegionToolSettings from './properties/RegionToolSettings.svelte';
  import TemplateToolSettings from './properties/TemplateToolSettings.svelte';

  // Props - object data
  export let tokens: Map<string, Token> = new Map();
  export let lights: Map<string, Light> = new Map();
  export let walls: Wall[] = [];
  export let doors: Door[] = [];
  export let windows: WindowType[] = [];
  export let drawings: Drawing[] = [];
  export let tiles: Tile[] = [];
  export let regions: Region[] = [];

  // Props - selection state
  export let activeTool: string = 'select';
  export let selectedTokenIds: Set<string> = new Set();
  export let selectedLightIds: Set<string> = new Set();
  export let selectedWallIds: Set<string> = new Set();
  export let selectedDoorIds: Set<string> = new Set();
  export let selectedWindowIds: Set<string> = new Set();
  export let selectedDrawingIds: Set<string> = new Set();
  export let selectedTileIds: Set<string> = new Set();
  export let selectedRegionIds: Set<string> = new Set();

  // Props - scene info
  export let sceneId: string = '';
  export let campaignId: string = '';
  export let isGM: boolean = false;
  export let gridSnapEnabled: boolean = false;

  const dispatch = createEventDispatcher<{
    toolSettingsChange: { tool: string; settings: Record<string, any> };
    objectPropertyChange: { objectType: string; objectId: string; property: string; value: any };
    objectDelete: { objectType: string; objectId: string };
    objectsDelete: { objectType: string; objectIds: string[] };
    openFullEditor: { objectType: string; objectId: string };
    gridSnapToggle: boolean;
  }>();

  // Tool settings state (defaults for newly created objects)
  let wallToolSettings = {
    wallType: 'normal' as 'normal' | 'ethereal' | 'invisible' | 'terrain',
    height: 10,
    gridSnap: true,
    previewColor: '#ff6b6b',
  };

  let doorToolSettings = {
    doorType: 'normal' as 'normal' | 'secret' | 'locked',
    width: 5,
    height: 10,
    gridSnap: true,
    previewColor: '#8b4513',
  };

  let windowToolSettings = {
    width: 5,
    height: 5,
    gridSnap: true,
    previewColor: '#87ceeb',
  };

  let lightToolSettings = {
    brightRadius: 20,
    dimRadius: 40,
    color: '#ffffff',
    intensity: 1,
    gridSnap: false,
  };

  let drawingToolSettings = {
    strokeColor: '#000000',
    strokeWidth: 2,
    fillColor: '#ffffff',
    fillOpacity: 0.5,
    fontSize: 16,
    fontFamily: 'Arial',
  };

  let tileToolSettings = {
    width: 100,
    height: 100,
    gridSnap: true,
    opacity: 1,
  };

  let regionToolSettings = {
    shape: 'rectangle' as 'rectangle' | 'circle' | 'ellipse' | 'polygon',
    fillColor: '#4a9eff',
    fillOpacity: 0.3,
    strokeColor: '#4a9eff',
    strokeWidth: 2,
    gridSnap: true,
  };

  let templateToolSettings = {
    shape: 'cone' as 'cone' | 'cube' | 'sphere' | 'line',
    size: 30,
    color: '#ff6b6b',
    opacity: 0.5,
  };

  // LocalStorage key for tool settings persistence
  const TOOL_SETTINGS_KEY = 'vtt-tool-settings';

  // Load tool settings from localStorage
  function loadToolSettings() {
    try {
      const stored = localStorage.getItem(TOOL_SETTINGS_KEY);
      if (!stored) return;

      const savedSettings = JSON.parse(stored);

      // Merge saved settings with defaults (preserves new settings added later)
      if (savedSettings.wall) {
        wallToolSettings = { ...wallToolSettings, ...savedSettings.wall };
      }
      if (savedSettings.door) {
        doorToolSettings = { ...doorToolSettings, ...savedSettings.door };
      }
      if (savedSettings.window) {
        windowToolSettings = { ...windowToolSettings, ...savedSettings.window };
      }
      if (savedSettings.light) {
        lightToolSettings = { ...lightToolSettings, ...savedSettings.light };
      }
      if (savedSettings.drawing) {
        drawingToolSettings = { ...drawingToolSettings, ...savedSettings.drawing };
      }
      if (savedSettings.tile) {
        tileToolSettings = { ...tileToolSettings, ...savedSettings.tile };
      }
      if (savedSettings.region) {
        regionToolSettings = { ...regionToolSettings, ...savedSettings.region };
      }
      if (savedSettings.template) {
        templateToolSettings = { ...templateToolSettings, ...savedSettings.template };
      }
    } catch (error) {
      console.warn('Failed to load tool settings from localStorage:', error);
    }
  }

  // Save tool settings to localStorage
  function saveToolSettings() {
    try {
      const settings = {
        wall: wallToolSettings,
        door: doorToolSettings,
        window: windowToolSettings,
        light: lightToolSettings,
        drawing: drawingToolSettings,
        tile: tileToolSettings,
        region: regionToolSettings,
        template: templateToolSettings,
      };
      localStorage.setItem(TOOL_SETTINGS_KEY, JSON.stringify(settings));
    } catch (error) {
      console.warn('Failed to save tool settings to localStorage:', error);
    }
  }

  // Load settings on component mount
  onMount(() => {
    loadToolSettings();
  });

  // Tool display names
  const toolNames: Record<string, string> = {
    select: 'Select',
    wall: 'Wall',
    door: 'Door',
    window: 'Window',
    light: 'Light',
    token: 'Token',
    tile: 'Tile',
    region: 'Region',
    pin: 'Pin',
    ruler: 'Ruler',
    template: 'Template',
    freehand: 'Freehand',
    rectangle: 'Rectangle',
    circle: 'Circle',
    text: 'Text',
    path: 'Path',
  };

  // Calculate selection state
  $: totalSelected =
    selectedTokenIds.size +
    selectedLightIds.size +
    selectedWallIds.size +
    selectedDoorIds.size +
    selectedWindowIds.size +
    selectedDrawingIds.size +
    selectedTileIds.size +
    selectedRegionIds.size;

  $: hasSelection = totalSelected > 0;

  // Determine if single object selected
  $: isSingleSelection = totalSelected === 1;

  // Determine the object type being edited
  $: selectedObjectType = (() => {
    if (selectedTokenIds.size > 0) return 'token';
    if (selectedLightIds.size > 0) return 'light';
    if (selectedWallIds.size > 0) return 'wall';
    if (selectedDoorIds.size > 0) return 'door';
    if (selectedWindowIds.size > 0) return 'window';
    if (selectedDrawingIds.size > 0) return 'drawing';
    if (selectedTileIds.size > 0) return 'tile';
    if (selectedRegionIds.size > 0) return 'region';
    return null;
  })();

  // Determine if multiple types are selected
  $: multipleTypes = (() => {
    let typeCount = 0;
    if (selectedTokenIds.size > 0) typeCount++;
    if (selectedLightIds.size > 0) typeCount++;
    if (selectedWallIds.size > 0) typeCount++;
    if (selectedDoorIds.size > 0) typeCount++;
    if (selectedWindowIds.size > 0) typeCount++;
    if (selectedDrawingIds.size > 0) typeCount++;
    if (selectedTileIds.size > 0) typeCount++;
    if (selectedRegionIds.size > 0) typeCount++;
    return typeCount > 1;
  })();

  // Get selected objects for property editors
  $: selectedTokens = Array.from(selectedTokenIds).map(id => tokens.get(id)).filter(Boolean) as Token[];
  $: selectedLights = Array.from(selectedLightIds).map(id => lights.get(id)).filter(Boolean) as Light[];
  $: selectedWalls = walls.filter(w => selectedWallIds.has(w.id));
  $: selectedDoors = doors.filter(d => selectedDoorIds.has(d.id));
  $: selectedWindows = windows.filter(w => selectedWindowIds.has(w.id));
  $: selectedDrawings = drawings.filter(d => selectedDrawingIds.has(d.id));
  $: selectedTiles = tiles.filter(t => selectedTileIds.has(t.id));
  $: selectedRegions = regions.filter(r => selectedRegionIds.has(r.id));

  // Determine what drawing type for drawing tool settings
  $: drawingType = (() => {
    if (activeTool === 'freehand') return 'freehand';
    if (activeTool === 'rectangle') return 'rectangle';
    if (activeTool === 'circle') return 'circle';
    if (activeTool === 'text') return 'text';
    return 'freehand';
  })() as 'freehand' | 'rectangle' | 'circle' | 'text';

  // Header title
  $: headerTitle = (() => {
    if (!hasSelection) {
      return `Tool Settings: ${toolNames[activeTool] || activeTool}`;
    }
    if (multipleTypes) {
      return `Multiple Selection (${totalSelected} items)`;
    }
    if (selectedObjectType) {
      const count = totalSelected;
      const typeName = selectedObjectType.charAt(0).toUpperCase() + selectedObjectType.slice(1);
      if (count === 1) {
        return `${typeName} Properties`;
      }
      return `${typeName} Properties (${count} selected)`;
    }
    return 'Properties';
  })();

  // Event handlers for tool settings
  function handleToolSettingsChange(settings: Record<string, any>) {
    dispatch('toolSettingsChange', { tool: activeTool, settings });
  }

  function handleWallSettingsChange(e: CustomEvent<typeof wallToolSettings>) {
    wallToolSettings = e.detail;
    handleToolSettingsChange(e.detail);
    saveToolSettings();
  }

  function handleDoorSettingsChange(e: CustomEvent<typeof doorToolSettings>) {
    doorToolSettings = e.detail;
    handleToolSettingsChange(e.detail);
    saveToolSettings();
  }

  function handleWindowSettingsChange(e: CustomEvent<typeof windowToolSettings>) {
    windowToolSettings = e.detail;
    handleToolSettingsChange(e.detail);
    saveToolSettings();
  }

  function handleLightSettingsChange(e: CustomEvent<typeof lightToolSettings>) {
    lightToolSettings = e.detail;
    handleToolSettingsChange(e.detail);
    saveToolSettings();
  }

  function handleDrawingSettingsChange(e: CustomEvent<typeof drawingToolSettings>) {
    drawingToolSettings = e.detail;
    handleToolSettingsChange(e.detail);
    saveToolSettings();
  }

  function handleTileSettingsChange(e: CustomEvent<typeof tileToolSettings>) {
    tileToolSettings = e.detail;
    handleToolSettingsChange(e.detail);
    saveToolSettings();
  }

  function handleRegionSettingsChange(e: CustomEvent<typeof regionToolSettings>) {
    regionToolSettings = e.detail;
    handleToolSettingsChange(e.detail);
    saveToolSettings();
  }

  function handleTemplateSettingsChange(e: CustomEvent<typeof templateToolSettings>) {
    templateToolSettings = e.detail;
    handleToolSettingsChange(e.detail);
    saveToolSettings();
  }

  // Event handlers for object properties
  function handleObjectPropertyChange(e: CustomEvent<{ objectId: string; property: string; value: any }>) {
    if (!selectedObjectType) return;
    dispatch('objectPropertyChange', {
      objectType: selectedObjectType,
      objectId: e.detail.objectId,
      property: e.detail.property,
      value: e.detail.value,
    });
  }

  function handleObjectDelete(e: CustomEvent<string>) {
    if (!selectedObjectType) return;
    dispatch('objectDelete', {
      objectType: selectedObjectType,
      objectId: e.detail,
    });
  }

  function handleObjectsDeleteAll() {
    if (!selectedObjectType) return;
    const ids = (() => {
      if (selectedObjectType === 'token') return Array.from(selectedTokenIds);
      if (selectedObjectType === 'light') return Array.from(selectedLightIds);
      if (selectedObjectType === 'wall') return Array.from(selectedWallIds);
      if (selectedObjectType === 'door') return Array.from(selectedDoorIds);
      if (selectedObjectType === 'window') return Array.from(selectedWindowIds);
      if (selectedObjectType === 'drawing') return Array.from(selectedDrawingIds);
      if (selectedObjectType === 'tile') return Array.from(selectedTileIds);
      if (selectedObjectType === 'region') return Array.from(selectedRegionIds);
      return [];
    })();
    dispatch('objectsDelete', {
      objectType: selectedObjectType,
      objectIds: ids,
    });
  }

  function handleOpenFullEditor(e: CustomEvent<any>) {
    if (!selectedObjectType) return;
    const obj = e.detail;
    dispatch('openFullEditor', {
      objectType: selectedObjectType,
      objectId: obj.id,
    });
  }

  function handleGridSnapToggle() {
    dispatch('gridSnapToggle', !gridSnapEnabled);
  }
</script>

<div class="properties-panel">
  <div class="panel-header">
    <h3 class="panel-title">{headerTitle}</h3>
  </div>

  <div class="panel-content">
    {#if hasSelection}
      {#if multipleTypes}
        <!-- Multiple types selected - show summary -->
        <div class="placeholder">
          <p>Multiple object types selected. Select objects of the same type to edit properties.</p>
          <div class="selection-summary">
            <h4>Selected Objects:</h4>
            <ul>
              {#if selectedTokenIds.size > 0}
                <li>{selectedTokenIds.size} Token{selectedTokenIds.size > 1 ? 's' : ''}</li>
              {/if}
              {#if selectedLightIds.size > 0}
                <li>{selectedLightIds.size} Light{selectedLightIds.size > 1 ? 's' : ''}</li>
              {/if}
              {#if selectedWallIds.size > 0}
                <li>{selectedWallIds.size} Wall{selectedWallIds.size > 1 ? 's' : ''}</li>
              {/if}
              {#if selectedDoorIds.size > 0}
                <li>{selectedDoorIds.size} Door{selectedDoorIds.size > 1 ? 's' : ''}</li>
              {/if}
              {#if selectedWindowIds.size > 0}
                <li>{selectedWindowIds.size} Window{selectedWindowIds.size > 1 ? 's' : ''}</li>
              {/if}
              {#if selectedDrawingIds.size > 0}
                <li>{selectedDrawingIds.size} Drawing{selectedDrawingIds.size > 1 ? 's' : ''}</li>
              {/if}
              {#if selectedTileIds.size > 0}
                <li>{selectedTileIds.size} Tile{selectedTileIds.size > 1 ? 's' : ''}</li>
              {/if}
              {#if selectedRegionIds.size > 0}
                <li>{selectedRegionIds.size} Region{selectedRegionIds.size > 1 ? 's' : ''}</li>
              {/if}
            </ul>
          </div>
        </div>
      {:else if selectedObjectType === 'token'}
        {#if isSingleSelection}
          <TokenProperties
            tokens={selectedTokens}
            {sceneId}
            {campaignId}
            {isGM}
            on:change={handleObjectPropertyChange}
            on:delete={handleObjectDelete}
            on:openFullEditor={handleOpenFullEditor}
          />
        {:else}
          <MultiSelectProperties
            objects={selectedTokens}
            objectType="token"
            {sceneId}
            {campaignId}
            {isGM}
            on:deleteAll={handleObjectsDeleteAll}
          />
        {/if}
      {:else if selectedObjectType === 'light'}
        {#if isSingleSelection}
          <LightProperties
            lights={selectedLights}
            {sceneId}
            {campaignId}
            {isGM}
            on:change={handleObjectPropertyChange}
            on:delete={handleObjectDelete}
            on:openFullEditor={handleOpenFullEditor}
          />
        {:else}
          <MultiSelectProperties
            objects={selectedLights}
            objectType="light"
            {sceneId}
            {campaignId}
            {isGM}
            on:deleteAll={handleObjectsDeleteAll}
          />
        {/if}
      {:else if selectedObjectType === 'wall'}
        {#if isSingleSelection}
          <WallProperties
            walls={selectedWalls}
            {sceneId}
            {campaignId}
            {isGM}
            on:change={handleObjectPropertyChange}
            on:delete={handleObjectDelete}
            on:openFullEditor={handleOpenFullEditor}
          />
        {:else}
          <MultiSelectProperties
            objects={selectedWalls}
            objectType="wall"
            {sceneId}
            {campaignId}
            {isGM}
            on:deleteAll={handleObjectsDeleteAll}
          />
        {/if}
      {:else if selectedObjectType === 'door'}
        {#if isSingleSelection}
          <DoorProperties
            doors={selectedDoors}
            {sceneId}
            {campaignId}
            {isGM}
            on:change={handleObjectPropertyChange}
            on:delete={handleObjectDelete}
            on:openFullEditor={handleOpenFullEditor}
          />
        {:else}
          <MultiSelectProperties
            objects={selectedDoors}
            objectType="door"
            {sceneId}
            {campaignId}
            {isGM}
            on:deleteAll={handleObjectsDeleteAll}
          />
        {/if}
      {:else if selectedObjectType === 'window'}
        {#if isSingleSelection}
          <WindowProperties
            windows={selectedWindows}
            {sceneId}
            {campaignId}
            {isGM}
            on:change={handleObjectPropertyChange}
            on:delete={handleObjectDelete}
            on:openFullEditor={handleOpenFullEditor}
          />
        {:else}
          <MultiSelectProperties
            objects={selectedWindows}
            objectType="window"
            {sceneId}
            {campaignId}
            {isGM}
            on:deleteAll={handleObjectsDeleteAll}
          />
        {/if}
      {:else if selectedObjectType === 'drawing'}
        {#if isSingleSelection}
          <DrawingProperties
            drawings={selectedDrawings}
            {sceneId}
            {campaignId}
            {isGM}
            on:change={handleObjectPropertyChange}
            on:delete={handleObjectDelete}
            on:openFullEditor={handleOpenFullEditor}
          />
        {:else}
          <MultiSelectProperties
            objects={selectedDrawings}
            objectType="drawing"
            {sceneId}
            {campaignId}
            {isGM}
            on:deleteAll={handleObjectsDeleteAll}
          />
        {/if}
      {:else if selectedObjectType === 'tile'}
        {#if isSingleSelection}
          <TileProperties
            tiles={selectedTiles}
            {sceneId}
            {campaignId}
            {isGM}
            on:change={handleObjectPropertyChange}
            on:delete={handleObjectDelete}
            on:openFullEditor={handleOpenFullEditor}
          />
        {:else}
          <MultiSelectProperties
            objects={selectedTiles}
            objectType="tile"
            {sceneId}
            {campaignId}
            {isGM}
            on:deleteAll={handleObjectsDeleteAll}
          />
        {/if}
      {:else if selectedObjectType === 'region'}
        {#if isSingleSelection}
          <RegionProperties
            regions={selectedRegions}
            {sceneId}
            {campaignId}
            {isGM}
            on:change={handleObjectPropertyChange}
            on:delete={handleObjectDelete}
            on:openFullEditor={handleOpenFullEditor}
          />
        {:else}
          <MultiSelectProperties
            objects={selectedRegions}
            objectType="region"
            {sceneId}
            {campaignId}
            {isGM}
            on:deleteAll={handleObjectsDeleteAll}
          />
        {/if}
      {/if}
    {:else}
      <!-- No selection - show tool settings or placeholder -->
      {#if activeTool === 'wall'}
        <WallToolSettings
          settings={wallToolSettings}
          on:change={handleWallSettingsChange}
        />
      {:else if activeTool === 'door'}
        <DoorToolSettings
          settings={doorToolSettings}
          on:change={handleDoorSettingsChange}
        />
      {:else if activeTool === 'window'}
        <WindowToolSettings
          settings={windowToolSettings}
          on:change={handleWindowSettingsChange}
        />
      {:else if activeTool === 'light'}
        <LightToolSettings
          settings={lightToolSettings}
          on:change={handleLightSettingsChange}
        />
      {:else if activeTool === 'freehand' || activeTool === 'rectangle' || activeTool === 'circle' || activeTool === 'text'}
        <DrawingToolSettings
          settings={drawingToolSettings}
          {drawingType}
          on:change={handleDrawingSettingsChange}
        />
      {:else if activeTool === 'tile'}
        <TileToolSettings
          settings={tileToolSettings}
          on:change={handleTileSettingsChange}
        />
      {:else if activeTool === 'region'}
        <RegionToolSettings
          settings={regionToolSettings}
          on:change={handleRegionSettingsChange}
        />
      {:else if activeTool === 'template'}
        <TemplateToolSettings
          settings={templateToolSettings}
          on:change={handleTemplateSettingsChange}
        />
      {:else}
        <!-- Default placeholder for tools without settings -->
        <div class="placeholder">
          <p>
            {#if activeTool === 'select'}
              Select an object to edit its properties.
            {:else if activeTool === 'ruler'}
              Click and drag to measure distance on the map.
            {:else if activeTool === 'path'}
              Click points to create a path. Double-click to finish.
            {:else if activeTool === 'pin'}
              Click to place a map pin or marker.
            {:else}
              Configure default settings for the {toolNames[activeTool] || activeTool} tool.
            {/if}
          </p>

          <div class="grid-snap-control">
            <label class="control-label">
              <input
                type="checkbox"
                checked={gridSnapEnabled}
                on:change={handleGridSnapToggle}
              />
              <span>Grid Snap</span>
            </label>
            <p class="control-hint">Snap objects to the grid when placing or moving them</p>
          </div>
        </div>
      {/if}
    {/if}
  </div>
</div>

<style>
  .properties-panel {
    display: flex;
    flex-direction: column;
    height: 100%;
    background-color: #1e1e1e;
    color: #e0e0e0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  }

  .panel-header {
    padding: 1rem;
    border-bottom: 1px solid #333;
    background-color: #252525;
  }

  .panel-title {
    margin: 0;
    font-size: 0.875rem;
    font-weight: 600;
    color: #e0e0e0;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .panel-content {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
  }

  .placeholder {
    padding: 1.5rem;
  }

  .placeholder > p {
    margin: 0 0 1.5rem 0;
    color: #9ca3af;
    font-size: 0.875rem;
    line-height: 1.5;
  }

  .grid-snap-control {
    padding: 1rem;
    background-color: #252525;
    border: 1px solid #333;
    border-radius: 0.375rem;
  }

  .control-label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
    color: #e0e0e0;
    font-size: 0.875rem;
    font-weight: 500;
  }

  .control-label input[type="checkbox"] {
    width: 1rem;
    height: 1rem;
    cursor: pointer;
    accent-color: #4a9eff;
  }

  .control-hint {
    margin: 0.5rem 0 0 1.5rem;
    color: #6b7280;
    font-size: 0.75rem;
    line-height: 1.4;
  }

  .selection-summary {
    margin-top: 1.5rem;
    padding: 1rem;
    background-color: #252525;
    border: 1px solid #333;
    border-radius: 0.375rem;
  }

  .selection-summary h4 {
    margin: 0 0 0.75rem 0;
    font-size: 0.875rem;
    font-weight: 600;
    color: #4a9eff;
  }

  .selection-summary ul {
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .selection-summary li {
    padding: 0.375rem 0;
    color: #d1d5db;
    font-size: 0.875rem;
    border-bottom: 1px solid #2d2d2d;
  }

  .selection-summary li:last-child {
    border-bottom: none;
  }

  /* Scrollbar styling */
  .panel-content::-webkit-scrollbar {
    width: 0.5rem;
  }

  .panel-content::-webkit-scrollbar-track {
    background-color: #1e1e1e;
  }

  .panel-content::-webkit-scrollbar-thumb {
    background-color: #333;
    border-radius: 0.25rem;
  }

  .panel-content::-webkit-scrollbar-thumb:hover {
    background-color: #444;
  }
</style>
