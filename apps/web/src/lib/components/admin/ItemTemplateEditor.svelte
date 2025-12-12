<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type {
    ItemTemplate,
    ItemCategory,
    FieldDefinition,
    PhysicalItemConfig,
    EquippableItemConfig,
    EquipmentSlot,
    ActivationConfig,
    ActivationType,
    ConsumptionConfig,
    ConsumptionType,
    ItemEffectDefinition,
    EffectTrigger,
    ContainerConfig,
    CreateItemTemplateRequest,
    UpdateItemTemplateRequest,
  } from '@vtt/shared';
  import FieldDefinitionEditor from './FieldDefinitionEditor.svelte';

  // Props
  export let isOpen: boolean = false;
  export let template: ItemTemplate | null = null;
  export let campaignId: string;
  export let systemId: string;
  export let token: string = '';
  export let readOnly: boolean = false; // For game system templates

  const dispatch = createEventDispatcher<{
    close: void;
    save: ItemTemplate;
    delete: string;
  }>();

  // Determine if this is a new template or editing existing
  const isNewTemplate = !template;

  // Tab state
  let activeTab: 'basic' | 'fields' | 'effects' | 'actions' = 'basic';

  // Form state
  let formData = {
    name: template?.name ?? '',
    category: template?.category ?? ('weapon' as ItemCategory),
    extends: template?.extends ?? '',
    fields: template?.fields ?? [],
    physical: template?.physical ?? null,
    equippable: template?.equippable ?? null,
    activation: template?.activation ?? null,
    consumes: template?.consumes ?? null,
    effects: template?.effects ?? [],
    container: template?.container ?? null,
  };

  // Item category options
  const categoryOptions: { value: ItemCategory; label: string }[] = [
    { value: 'weapon', label: 'Weapon' },
    { value: 'armor', label: 'Armor' },
    { value: 'spell', label: 'Spell' },
    { value: 'consumable', label: 'Consumable' },
    { value: 'feature', label: 'Feature' },
    { value: 'tool', label: 'Tool' },
    { value: 'loot', label: 'Loot' },
    { value: 'container', label: 'Container' },
    { value: 'class', label: 'Class' },
    { value: 'race', label: 'Race' },
    { value: 'background', label: 'Background' },
    { value: 'custom', label: 'Custom' },
  ];

  // Equipment slot options
  const equipmentSlots: { value: EquipmentSlot; label: string }[] = [
    { value: 'mainHand', label: 'Main Hand' },
    { value: 'offHand', label: 'Off Hand' },
    { value: 'twoHand', label: 'Two Hands' },
    { value: 'armor', label: 'Armor' },
    { value: 'head', label: 'Head' },
    { value: 'cloak', label: 'Cloak' },
    { value: 'neck', label: 'Neck' },
    { value: 'ring', label: 'Ring' },
    { value: 'belt', label: 'Belt' },
    { value: 'hands', label: 'Hands' },
    { value: 'feet', label: 'Feet' },
    { value: 'none', label: 'None' },
  ];

  // Activation type options
  const activationTypes: { value: ActivationType; label: string }[] = [
    { value: 'action', label: 'Action' },
    { value: 'bonus_action', label: 'Bonus Action' },
    { value: 'reaction', label: 'Reaction' },
    { value: 'free', label: 'Free Action' },
    { value: 'minute', label: 'Minute(s)' },
    { value: 'hour', label: 'Hour(s)' },
    { value: 'special', label: 'Special' },
    { value: 'none', label: 'None' },
  ];

  // Consumption type options
  const consumptionTypes: { value: ConsumptionType; label: string }[] = [
    { value: 'charges', label: 'Charges' },
    { value: 'quantity', label: 'Quantity' },
    { value: 'spell_slot', label: 'Spell Slot' },
    { value: 'resource', label: 'Resource' },
    { value: 'item', label: 'Item' },
    { value: 'none', label: 'None' },
  ];

  // Effect trigger options
  const effectTriggers: { value: EffectTrigger; label: string }[] = [
    { value: 'passive', label: 'Passive (Always Active)' },
    { value: 'equipped', label: 'When Equipped' },
    { value: 'attuned', label: 'When Attuned' },
    { value: 'activated', label: 'When Activated' },
    { value: 'held', label: 'When Held' },
  ];

  // Field editor state
  let editingField: Partial<FieldDefinition> | null = null;
  let editingFieldIndex: number = -1;
  let showFieldEditor = false;

  // Physical item toggles
  let hasPhysical = !!formData.physical;
  let hasEquippable = !!formData.equippable;
  let hasActivation = !!formData.activation;
  let hasConsumes = !!formData.consumes;
  let hasContainer = !!formData.container;

  // Initialize configs when toggles are enabled
  $: if (hasPhysical && !formData.physical) {
    formData.physical = {
      hasWeight: true,
      hasPrice: true,
      hasQuantity: false,
      stackable: false,
      weightUnit: 'lb',
      priceUnit: 'gp',
    };
  } else if (!hasPhysical) {
    formData.physical = null;
  }

  $: if (hasEquippable && !formData.equippable) {
    formData.equippable = {
      equipSlots: ['none'],
      requiresAttunement: false,
    };
  } else if (!hasEquippable) {
    formData.equippable = null;
  }

  $: if (hasActivation && !formData.activation) {
    formData.activation = {
      type: 'action',
    };
  } else if (!hasActivation) {
    formData.activation = null;
  }

  $: if (hasConsumes && !formData.consumes) {
    formData.consumes = {
      type: 'charges',
      amount: 1,
    };
  } else if (!hasConsumes) {
    formData.consumes = null;
  }

  $: if (hasContainer && !formData.container) {
    formData.container = {
      weightCapacity: 0,
      itemCapacity: 0,
      weightMultiplier: 1,
      allowNesting: false,
    };
  } else if (!hasContainer) {
    formData.container = null;
  }

  async function handleSave() {
    if (readOnly) {
      alert('This is a game system template and cannot be edited.');
      return;
    }

    try {
      const templateData: CreateItemTemplateRequest | UpdateItemTemplateRequest = {
        systemId,
        name: formData.name.trim(),
        category: formData.category,
        extends: formData.extends || undefined,
        fields: formData.fields,
        physical: formData.physical ?? undefined,
        equippable: formData.equippable ?? undefined,
        activation: formData.activation ?? undefined,
        consumes: formData.consumes ?? undefined,
        effects: formData.effects,
        container: formData.container ?? undefined,
      };

      if (isNewTemplate) {
        // Create new template
        const response = await fetch(`/api/v1/campaigns/${campaignId}/item-templates`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(templateData),
        });

        if (!response.ok) {
          throw new Error('Failed to create item template');
        }

        const data = await response.json();
        dispatch('save', data.template);
      } else {
        // Update existing template
        const response = await fetch(
          `/api/v1/campaigns/${campaignId}/item-templates/${template!.id}`,
          {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(templateData),
          }
        );

        if (!response.ok) {
          throw new Error('Failed to update item template');
        }

        const data = await response.json();
        dispatch('save', data.template);
      }

      dispatch('close');
    } catch (error) {
      console.error('Failed to save item template:', error);
      alert('Failed to save item template. Please try again.');
    }
  }

  function handleCancel() {
    dispatch('close');
  }

  async function handleDelete() {
    if (!template || readOnly) return;

    if (confirm(`Are you sure you want to delete "${template.name}"?`)) {
      try {
        const response = await fetch(
          `/api/v1/campaigns/${campaignId}/item-templates/${template.id}`,
          {
            method: 'DELETE',
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error('Failed to delete item template');
        }

        dispatch('delete', template.id);
        dispatch('close');
      } catch (error) {
        console.error('Failed to delete item template:', error);
        alert('Failed to delete item template. Please try again.');
      }
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape' && !showFieldEditor) {
      handleCancel();
    }
  }

  function handleBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      handleCancel();
    }
  }

  function handleWindowKeydown(event: KeyboardEvent) {
    if (isOpen) {
      handleKeydown(event);
    }
  }

  // Field management
  function addField() {
    editingField = {};
    editingFieldIndex = -1;
    showFieldEditor = true;
  }

  function editField(index: number) {
    editingField = { ...formData.fields[index] };
    editingFieldIndex = index;
    showFieldEditor = true;
  }

  function handleFieldSave(event: CustomEvent<FieldDefinition>) {
    const field = event.detail;

    if (editingFieldIndex >= 0) {
      // Update existing field
      formData.fields = formData.fields.map((f, i) => (i === editingFieldIndex ? field : f));
    } else {
      // Add new field
      formData.fields = [...formData.fields, field];
    }

    showFieldEditor = false;
    editingField = null;
    editingFieldIndex = -1;
  }

  function handleFieldCancel() {
    showFieldEditor = false;
    editingField = null;
    editingFieldIndex = -1;
  }

  function handleFieldDelete() {
    if (editingFieldIndex >= 0) {
      formData.fields = formData.fields.filter((_, i) => i !== editingFieldIndex);
    }
    showFieldEditor = false;
    editingField = null;
    editingFieldIndex = -1;
  }

  function removeField(index: number) {
    if (confirm('Are you sure you want to remove this field?')) {
      formData.fields = formData.fields.filter((_, i) => i !== index);
    }
  }

  // Effect management
  function addEffect() {
    const newEffect: ItemEffectDefinition = {
      id: `effect_${Date.now()}`,
      name: 'New Effect',
      trigger: 'equipped',
      changes: [],
      transfer: true,
    };
    formData.effects = [...formData.effects, newEffect];
  }

  function removeEffect(index: number) {
    if (confirm('Are you sure you want to remove this effect?')) {
      formData.effects = formData.effects.filter((_, i) => i !== index);
    }
  }
</script>

<svelte:window on:keydown={handleWindowKeydown} />

{#if isOpen}
  <div class="modal-backdrop" on:click={handleBackdropClick}>
    <div class="modal-content" on:click|stopPropagation>
      <header class="modal-header">
        <h2>
          {isNewTemplate ? 'Create Item Template' : readOnly ? 'View Item Template' : 'Edit Item Template'}
        </h2>
        <button class="close-button" on:click={handleCancel} aria-label="Close"> &times; </button>
      </header>

      {#if showFieldEditor}
        <div class="field-editor-overlay">
          <FieldDefinitionEditor
            field={editingField ?? {}}
            isNew={editingFieldIndex < 0}
            on:save={handleFieldSave}
            on:cancel={handleFieldCancel}
            on:delete={handleFieldDelete}
          />
        </div>
      {:else}
        <div class="tabs">
          <button
            class="tab"
            class:active={activeTab === 'basic'}
            on:click={() => (activeTab = 'basic')}
          >
            Basic Info
          </button>
          <button
            class="tab"
            class:active={activeTab === 'fields'}
            on:click={() => (activeTab = 'fields')}
          >
            Fields ({formData.fields.length})
          </button>
          <button
            class="tab"
            class:active={activeTab === 'effects'}
            on:click={() => (activeTab = 'effects')}
          >
            Effects ({formData.effects.length})
          </button>
          <button
            class="tab"
            class:active={activeTab === 'actions'}
            on:click={() => (activeTab = 'actions')}
          >
            Actions
          </button>
        </div>

        <div class="modal-body">
          <!-- Basic Info Tab -->
          {#if activeTab === 'basic'}
            <form on:submit|preventDefault={handleSave}>
              <!-- Template Name and Category -->
              <section class="form-section">
                <h3>Template Information</h3>

                <div class="form-row">
                  <label for="template-name">
                    Template Name *
                    <input
                      id="template-name"
                      type="text"
                      bind:value={formData.name}
                      required
                      placeholder="e.g., Magic Sword, Healing Potion"
                      disabled={readOnly}
                    />
                  </label>
                </div>

                <div class="form-row">
                  <label for="template-category">
                    Category *
                    <select
                      id="template-category"
                      bind:value={formData.category}
                      disabled={readOnly}
                    >
                      {#each categoryOptions as cat}
                        <option value={cat.value}>{cat.label}</option>
                      {/each}
                    </select>
                  </label>
                  <span class="help-text">Item category for organization and filtering</span>
                </div>

                <div class="form-row">
                  <label for="extends">
                    Extends Template ID (optional)
                    <input
                      id="extends"
                      type="text"
                      bind:value={formData.extends}
                      placeholder="e.g., weapon_base"
                      disabled={readOnly}
                    />
                  </label>
                  <span class="help-text">Inherit fields from another template</span>
                </div>
              </section>

              <!-- Physical Item Configuration -->
              <section class="form-section">
                <h3>Physical Properties</h3>

                <div class="form-row-checkbox">
                  <label>
                    <input type="checkbox" bind:checked={hasPhysical} disabled={readOnly} />
                    This is a physical item
                  </label>
                </div>

                {#if hasPhysical && formData.physical}
                  <div class="subsection">
                    <div class="form-row-checkbox">
                      <label>
                        <input
                          type="checkbox"
                          bind:checked={formData.physical.hasWeight}
                          disabled={readOnly}
                        />
                        Has Weight
                      </label>
                    </div>

                    {#if formData.physical.hasWeight}
                      <div class="form-row">
                        <label for="weight-unit">
                          Weight Unit
                          <input
                            id="weight-unit"
                            type="text"
                            bind:value={formData.physical.weightUnit}
                            placeholder="lb, kg, etc."
                            disabled={readOnly}
                          />
                        </label>
                      </div>
                    {/if}

                    <div class="form-row-checkbox">
                      <label>
                        <input
                          type="checkbox"
                          bind:checked={formData.physical.hasPrice}
                          disabled={readOnly}
                        />
                        Has Price
                      </label>
                    </div>

                    {#if formData.physical.hasPrice}
                      <div class="form-row">
                        <label for="price-unit">
                          Currency Unit
                          <input
                            id="price-unit"
                            type="text"
                            bind:value={formData.physical.priceUnit}
                            placeholder="gp, cp, credits, etc."
                            disabled={readOnly}
                          />
                        </label>
                      </div>
                    {/if}

                    <div class="form-row-checkbox">
                      <label>
                        <input
                          type="checkbox"
                          bind:checked={formData.physical.hasQuantity}
                          disabled={readOnly}
                        />
                        Track Quantity
                      </label>
                    </div>

                    <div class="form-row-checkbox">
                      <label>
                        <input
                          type="checkbox"
                          bind:checked={formData.physical.stackable}
                          disabled={readOnly}
                        />
                        Stackable
                      </label>
                    </div>
                  </div>
                {/if}
              </section>

              <!-- Equippable Configuration -->
              <section class="form-section">
                <h3>Equippable Settings</h3>

                <div class="form-row-checkbox">
                  <label>
                    <input type="checkbox" bind:checked={hasEquippable} disabled={readOnly} />
                    Can be equipped
                  </label>
                </div>

                {#if hasEquippable && formData.equippable}
                  <div class="subsection">
                    <div class="form-row">
                      <label>
                        Equipment Slots *
                        <div class="checkbox-group">
                          {#each equipmentSlots as slot}
                            <label class="checkbox-label">
                              <input
                                type="checkbox"
                                value={slot.value}
                                checked={formData.equippable.equipSlots.includes(slot.value)}
                                on:change={(e) => {
                                  if (e.currentTarget.checked) {
                                    formData.equippable.equipSlots = [
                                      ...formData.equippable.equipSlots,
                                      slot.value,
                                    ];
                                  } else {
                                    formData.equippable.equipSlots =
                                      formData.equippable.equipSlots.filter(
                                        (s) => s !== slot.value
                                      );
                                  }
                                }}
                                disabled={readOnly}
                              />
                              {slot.label}
                            </label>
                          {/each}
                        </div>
                      </label>
                    </div>

                    <div class="form-row-checkbox">
                      <label>
                        <input
                          type="checkbox"
                          bind:checked={formData.equippable.requiresAttunement}
                          disabled={readOnly}
                        />
                        Requires Attunement
                      </label>
                    </div>

                    {#if formData.equippable.requiresAttunement}
                      <div class="form-row">
                        <label for="attunement-requirements">
                          Attunement Requirements
                          <input
                            id="attunement-requirements"
                            type="text"
                            bind:value={formData.equippable.attunementRequirements}
                            placeholder="e.g., requires attunement by a spellcaster"
                            disabled={readOnly}
                          />
                        </label>
                      </div>
                    {/if}

                    <div class="form-row">
                      <label for="max-equipped">
                        Max Equipped (optional)
                        <input
                          id="max-equipped"
                          type="number"
                          bind:value={formData.equippable.maxEquipped}
                          min="1"
                          placeholder="Leave empty for unlimited"
                          disabled={readOnly}
                        />
                      </label>
                    </div>
                  </div>
                {/if}
              </section>

              <!-- Activation Configuration -->
              <section class="form-section">
                <h3>Activation</h3>

                <div class="form-row-checkbox">
                  <label>
                    <input type="checkbox" bind:checked={hasActivation} disabled={readOnly} />
                    Can be activated/used
                  </label>
                </div>

                {#if hasActivation && formData.activation}
                  <div class="subsection">
                    <div class="form-row">
                      <label for="activation-type">
                        Activation Type *
                        <select
                          id="activation-type"
                          bind:value={formData.activation.type}
                          disabled={readOnly}
                        >
                          {#each activationTypes as type}
                            <option value={type.value}>{type.label}</option>
                          {/each}
                        </select>
                      </label>
                    </div>

                    <div class="form-row">
                      <label for="activation-cost">
                        Action Cost (optional)
                        <input
                          id="activation-cost"
                          type="number"
                          bind:value={formData.activation.cost}
                          min="1"
                          placeholder="Number of actions"
                          disabled={readOnly}
                        />
                      </label>
                    </div>

                    <div class="form-row">
                      <label for="activation-condition">
                        Condition/Trigger (optional)
                        <input
                          id="activation-condition"
                          type="text"
                          bind:value={formData.activation.condition}
                          placeholder="e.g., when hit by an attack"
                          disabled={readOnly}
                        />
                      </label>
                    </div>
                  </div>
                {/if}
              </section>

              <!-- Consumption Configuration -->
              <section class="form-section">
                <h3>Resource Consumption</h3>

                <div class="form-row-checkbox">
                  <label>
                    <input type="checkbox" bind:checked={hasConsumes} disabled={readOnly} />
                    Consumes resources when used
                  </label>
                </div>

                {#if hasConsumes && formData.consumes}
                  <div class="subsection">
                    <div class="form-row">
                      <label for="consumption-type">
                        Consumption Type *
                        <select
                          id="consumption-type"
                          bind:value={formData.consumes.type}
                          disabled={readOnly}
                        >
                          {#each consumptionTypes as type}
                            <option value={type.value}>{type.label}</option>
                          {/each}
                        </select>
                      </label>
                    </div>

                    <div class="form-row">
                      <label for="consumption-amount">
                        Amount Consumed *
                        <input
                          id="consumption-amount"
                          type="text"
                          bind:value={formData.consumes.amount}
                          placeholder="1 or formula like @item.level"
                          disabled={readOnly}
                        />
                      </label>
                    </div>

                    <div class="form-row">
                      <label for="consumption-target">
                        Target Resource (optional)
                        <input
                          id="consumption-target"
                          type="text"
                          bind:value={formData.consumes.target}
                          placeholder="Resource ID or 'self'"
                          disabled={readOnly}
                        />
                      </label>
                    </div>
                  </div>
                {/if}
              </section>

              <!-- Container Configuration -->
              <section class="form-section">
                <h3>Container Settings</h3>

                <div class="form-row-checkbox">
                  <label>
                    <input type="checkbox" bind:checked={hasContainer} disabled={readOnly} />
                    This is a container
                  </label>
                </div>

                {#if hasContainer && formData.container}
                  <div class="subsection">
                    <div class="form-row">
                      <label for="weight-capacity">
                        Weight Capacity
                        <input
                          id="weight-capacity"
                          type="number"
                          bind:value={formData.container.weightCapacity}
                          min="0"
                          placeholder="0 = unlimited"
                          disabled={readOnly}
                        />
                      </label>
                    </div>

                    <div class="form-row">
                      <label for="item-capacity">
                        Item Capacity
                        <input
                          id="item-capacity"
                          type="number"
                          bind:value={formData.container.itemCapacity}
                          min="0"
                          placeholder="0 = unlimited"
                          disabled={readOnly}
                        />
                      </label>
                    </div>

                    <div class="form-row">
                      <label for="weight-multiplier">
                        Weight Multiplier
                        <input
                          id="weight-multiplier"
                          type="number"
                          bind:value={formData.container.weightMultiplier}
                          min="0"
                          max="1"
                          step="0.1"
                          placeholder="1.0 = full weight, 0.5 = half"
                          disabled={readOnly}
                        />
                      </label>
                    </div>

                    <div class="form-row-checkbox">
                      <label>
                        <input
                          type="checkbox"
                          bind:checked={formData.container.allowNesting}
                          disabled={readOnly}
                        />
                        Allow nesting (containers in containers)
                      </label>
                    </div>
                  </div>
                {/if}
              </section>
            </form>
          {/if}

          <!-- Fields Tab -->
          {#if activeTab === 'fields'}
            <section class="form-section">
              <div class="section-header">
                <h3>Custom Fields</h3>
                {#if !readOnly}
                  <button class="button-primary" on:click={addField}> + Add Field </button>
                {/if}
              </div>

              {#if formData.fields.length === 0}
                <div class="empty-state">
                  <p>No custom fields defined yet</p>
                  {#if !readOnly}
                    <p class="help-text">Add fields to customize what data this item type stores</p>
                  {/if}
                </div>
              {:else}
                <div class="fields-list">
                  {#each formData.fields as field, index}
                    <div class="field-card">
                      <div class="field-info">
                        <span class="field-name">{field.name}</span>
                        <span class="field-type">{field.fieldType}</span>
                        {#if field.required}
                          <span class="required-badge">Required</span>
                        {/if}
                      </div>
                      {#if !readOnly}
                        <div class="field-actions">
                          <button
                            class="button-secondary button-sm"
                            on:click={() => editField(index)}
                          >
                            Edit
                          </button>
                          <button
                            class="button-danger button-sm"
                            on:click={() => removeField(index)}
                          >
                            Remove
                          </button>
                        </div>
                      {/if}
                    </div>
                  {/each}
                </div>
              {/if}
            </section>
          {/if}

          <!-- Effects Tab -->
          {#if activeTab === 'effects'}
            <section class="form-section">
              <div class="section-header">
                <h3>Active Effects</h3>
                {#if !readOnly}
                  <button class="button-primary" on:click={addEffect}> + Add Effect </button>
                {/if}
              </div>

              {#if formData.effects.length === 0}
                <div class="empty-state">
                  <p>No active effects defined yet</p>
                  {#if !readOnly}
                    <p class="help-text">
                      Add effects to define stat modifications when this item is equipped or used
                    </p>
                  {/if}
                </div>
              {:else}
                <div class="effects-list">
                  {#each formData.effects as effect, index}
                    <div class="effect-card">
                      <div class="effect-header">
                        <input
                          type="text"
                          bind:value={effect.name}
                          class="effect-name-input"
                          placeholder="Effect Name"
                          disabled={readOnly}
                        />
                        {#if !readOnly}
                          <button
                            class="button-danger button-sm"
                            on:click={() => removeEffect(index)}
                          >
                            Remove
                          </button>
                        {/if}
                      </div>

                      <div class="effect-body">
                        <div class="form-row">
                          <label>
                            Trigger
                            <select bind:value={effect.trigger} disabled={readOnly}>
                              {#each effectTriggers as trigger}
                                <option value={trigger.value}>{trigger.label}</option>
                              {/each}
                            </select>
                          </label>
                        </div>

                        <div class="form-row-checkbox">
                          <label>
                            <input
                              type="checkbox"
                              bind:checked={effect.transfer}
                              disabled={readOnly}
                            />
                            Transfer to actor
                          </label>
                        </div>

                        <div class="form-row">
                          <label>
                            Description (optional)
                            <textarea
                              bind:value={effect.description}
                              rows="2"
                              placeholder="Effect description"
                              disabled={readOnly}
                            ></textarea>
                          </label>
                        </div>
                      </div>
                    </div>
                  {/each}
                </div>
              {/if}
            </section>
          {/if}

          <!-- Actions Tab -->
          {#if activeTab === 'actions'}
            <section class="form-section">
              <div class="section-header">
                <h3>Actions</h3>
              </div>

              <div class="empty-state">
                <p>Actions coming soon</p>
                <p class="help-text">Define custom actions that can be performed with this item</p>
              </div>
            </section>
          {/if}
        </div>

        <footer class="modal-footer">
          <div class="footer-left">
            {#if !isNewTemplate && !readOnly}
              <button class="button-danger" on:click={handleDelete}> Delete Template </button>
            {/if}
          </div>
          <div class="footer-right">
            <button class="button-secondary" on:click={handleCancel}> Cancel </button>
            {#if !readOnly}
              <button class="button-primary" on:click={handleSave}>
                {isNewTemplate ? 'Create Template' : 'Save Changes'}
              </button>
            {/if}
          </div>
        </footer>
      {/if}
    </div>
  </div>
{/if}

<style>
  .modal-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.75);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 2rem;
  }

  .modal-content {
    background-color: var(--color-bg-secondary, #1e1e1e);
    border-radius: 8px;
    width: 100%;
    max-width: 900px;
    max-height: 90vh;
    display: flex;
    flex-direction: column;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  }

  .modal-header {
    padding: 1.5rem;
    border-bottom: 1px solid var(--color-border, #333);
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .modal-header h2 {
    margin: 0;
    font-size: 1.5rem;
    font-weight: 600;
    color: var(--color-text-primary, #ffffff);
  }

  .close-button {
    background: none;
    border: none;
    font-size: 2rem;
    line-height: 1;
    color: var(--color-text-secondary, #aaa);
    cursor: pointer;
    padding: 0;
    width: 2rem;
    height: 2rem;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    transition: background-color 0.2s, color 0.2s;
  }

  .close-button:hover {
    background-color: rgba(255, 255, 255, 0.1);
    color: var(--color-text-primary, #ffffff);
  }

  .tabs {
    display: flex;
    border-bottom: 1px solid var(--color-border, #333);
    background-color: var(--color-bg-primary, #121212);
  }

  .tab {
    flex: 1;
    padding: 1rem;
    background: none;
    border: none;
    color: var(--color-text-secondary, #aaa);
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    border-bottom: 2px solid transparent;
  }

  .tab:hover {
    background-color: rgba(255, 255, 255, 0.05);
    color: var(--color-text-primary, #ffffff);
  }

  .tab.active {
    color: #4a90e2;
    border-bottom-color: #4a90e2;
    background-color: var(--color-bg-secondary, #1e1e1e);
  }

  .modal-body {
    padding: 1.5rem;
    overflow-y: auto;
    flex: 1;
  }

  .form-section {
    margin-bottom: 1.5rem;
  }

  .form-section:last-child {
    margin-bottom: 0;
  }

  .form-section h3 {
    margin: 0 0 1rem 0;
    font-size: 1.125rem;
    font-weight: 600;
    color: var(--color-text-primary, #ffffff);
    border-bottom: 1px solid var(--color-border, #333);
    padding-bottom: 0.5rem;
  }

  .section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1rem;
  }

  .section-header h3 {
    margin: 0;
    border: none;
    padding: 0;
  }

  .form-row {
    margin-bottom: 1rem;
  }

  .form-row:last-child {
    margin-bottom: 0;
  }

  .form-row-checkbox {
    margin-bottom: 1rem;
  }

  label {
    display: block;
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--color-text-secondary, #aaa);
    margin-bottom: 0.25rem;
  }

  .form-row-checkbox label,
  .checkbox-label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
  }

  .help-text {
    display: block;
    font-size: 0.75rem;
    color: var(--color-text-tertiary, #888);
    margin-top: 0.25rem;
    font-weight: normal;
  }

  input[type='text'],
  input[type='number'],
  select,
  textarea {
    width: 100%;
    padding: 0.5rem;
    border: 1px solid var(--color-border, #333);
    border-radius: 4px;
    background-color: var(--color-bg-primary, #121212);
    color: var(--color-text-primary, #ffffff);
    font-size: 0.875rem;
    transition: border-color 0.2s;
  }

  input[type='text']:focus,
  input[type='number']:focus,
  select:focus,
  textarea:focus {
    outline: none;
    border-color: #4a90e2;
  }

  input[type='checkbox'] {
    width: 1.25rem;
    height: 1.25rem;
    cursor: pointer;
  }

  textarea {
    resize: vertical;
    font-family: inherit;
  }

  .subsection {
    margin-left: 1.5rem;
    padding-left: 1rem;
    border-left: 2px solid var(--color-border, #333);
  }

  .checkbox-group {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 0.5rem;
    padding: 0.5rem;
    background-color: var(--color-bg-secondary, #1e1e1e);
    border-radius: 4px;
  }

  .empty-state {
    padding: 3rem 1.5rem;
    text-align: center;
    color: var(--color-text-tertiary, #888);
    background-color: var(--color-bg-primary, #121212);
    border-radius: 6px;
    border: 2px dashed var(--color-border, #333);
  }

  .empty-state p {
    margin: 0.5rem 0;
  }

  .fields-list,
  .effects-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .field-card,
  .effect-card {
    padding: 1rem;
    background-color: var(--color-bg-primary, #121212);
    border: 1px solid var(--color-border, #333);
    border-radius: 6px;
  }

  .field-info {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex: 1;
  }

  .field-name {
    font-weight: 600;
    color: var(--color-text-primary, #ffffff);
  }

  .field-type {
    padding: 0.25rem 0.5rem;
    background-color: rgba(74, 144, 226, 0.2);
    color: #4a90e2;
    border-radius: 4px;
    font-size: 0.75rem;
    font-weight: 500;
  }

  .required-badge {
    padding: 0.25rem 0.5rem;
    background-color: rgba(239, 68, 68, 0.2);
    color: #ef4444;
    border-radius: 4px;
    font-size: 0.75rem;
    font-weight: 500;
  }

  .field-card {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .field-actions {
    display: flex;
    gap: 0.5rem;
  }

  .effect-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 0.75rem;
  }

  .effect-name-input {
    flex: 1;
    font-weight: 600;
  }

  .effect-body {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .field-editor-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: var(--color-bg-secondary, #1e1e1e);
    z-index: 10;
    overflow-y: auto;
  }

  .modal-footer {
    padding: 1rem 1.5rem;
    border-top: 1px solid var(--color-border, #333);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
  }

  .footer-left,
  .footer-right {
    display: flex;
    gap: 0.75rem;
  }

  button {
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 4px;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.2s, transform 0.1s;
  }

  button:active {
    transform: scale(0.98);
  }

  .button-sm {
    padding: 0.375rem 0.75rem;
    font-size: 0.8125rem;
  }

  .button-primary {
    background-color: #4a90e2;
    color: white;
  }

  .button-primary:hover {
    background-color: #357abd;
  }

  .button-secondary {
    background-color: transparent;
    color: var(--color-text-secondary, #aaa);
    border: 1px solid var(--color-border, #333);
  }

  .button-secondary:hover {
    background-color: rgba(255, 255, 255, 0.05);
    color: var(--color-text-primary, #ffffff);
  }

  .button-danger {
    background-color: #ef4444;
    color: white;
  }

  .button-danger:hover {
    background-color: #dc2626;
  }

  @media (max-width: 768px) {
    .modal-backdrop {
      padding: 0;
    }

    .modal-content {
      max-height: 100vh;
      border-radius: 0;
    }

    .checkbox-group {
      grid-template-columns: 1fr;
    }

    .field-card {
      flex-direction: column;
      align-items: flex-start;
      gap: 0.75rem;
    }

    .field-actions {
      width: 100%;
      justify-content: flex-end;
    }
  }
</style>
