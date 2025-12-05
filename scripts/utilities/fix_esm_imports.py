#!/usr/bin/env python3
"""
Fix ESM imports by adding .js extensions to all relative imports.
This script processes TypeScript files and adds .js extensions where needed.
"""

import os
import re
from pathlib import Path
from typing import List, Tuple

def needs_js_extension(import_path: str) -> bool:
    """Check if an import path needs a .js extension."""
    # Already has .js extension
    if import_path.endswith('.js'):
        return False

    # Not a relative import
    if not (import_path.startswith('./') or import_path.startswith('../')):
        return False

    return True

def add_js_extension(import_path: str, file_dir: Path, source_root: Path) -> str:
    """Add .js extension to import path, handling both files and directories."""
    if not needs_js_extension(import_path):
        return import_path

    # Resolve the absolute path of the imported module
    resolved_path = (file_dir / import_path).resolve()

    # Check if it's a directory (would need /index.js)
    if resolved_path.is_dir():
        # Check if index.ts exists
        index_ts = resolved_path / 'index.ts'
        if index_ts.exists():
            if import_path.endswith('/index'):
                return f'{import_path}.js'
            else:
                return f'{import_path}/index.js'

    # Otherwise, just add .js
    return f'{import_path}.js'

def fix_imports_in_file(file_path: Path, source_root: Path) -> Tuple[bool, int]:
    """
    Fix imports in a single file.
    Returns (was_modified, num_changes).
    """
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
    except Exception as e:
        print(f'Error reading {file_path}: {e}')
        return False, 0

    original_content = content
    changes = 0
    file_dir = file_path.parent

    # Pattern to match import/export statements with relative paths
    # Matches: import ... from './path'
    #          export ... from './path'
    #          import('./path')

    # Pattern 1: import/export ... from './path' or "../path"
    def replace_import_export(match):
        nonlocal changes
        prefix = match.group(1)  # import/export statement
        quote = match.group(2)   # ' or "
        path = match.group(3)    # the import path

        if needs_js_extension(path):
            new_path = add_js_extension(path, file_dir, source_root)
            changes += 1
            return f'{prefix}{quote}{new_path}{quote}'
        return match.group(0)

    # Match: import ... from './path' or export ... from './path'
    pattern1 = r"((?:import|export)(?:\s+(?:type\s+)?(?:\{[^}]+\}|[*]|\w+))?(?:\s+(?:from|as))?\s+)(['\"])(\.\./[^'\"]+|\.\/[^'\"]+)(['\"])"
    content = re.sub(pattern1, replace_import_export, content)

    # Pattern 2: dynamic import('./path')
    def replace_dynamic_import(match):
        nonlocal changes
        quote = match.group(1)
        path = match.group(2)

        if needs_js_extension(path):
            new_path = add_js_extension(path, file_dir, source_root)
            changes += 1
            return f"import({quote}{new_path}{quote})"
        return match.group(0)

    pattern2 = r"import\((['\"])(\.\./[^'\"]+|\.\/[^'\"]+)(['\"])\)"
    content = re.sub(pattern2, replace_dynamic_import, content)

    # Only write if content changed
    if content != original_content:
        try:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            return True, changes
        except Exception as e:
            print(f'Error writing {file_path}: {e}')
            return False, 0

    return False, 0

def fix_imports_in_directory(directory: Path) -> Tuple[int, int]:
    """
    Fix imports in all TypeScript files in a directory.
    Returns (files_modified, total_changes).
    """
    files_modified = 0
    total_changes = 0

    # Find all .ts files
    ts_files = list(directory.rglob('*.ts'))

    print(f'\nProcessing {len(ts_files)} TypeScript files in {directory}...')

    for file_path in ts_files:
        was_modified, num_changes = fix_imports_in_file(file_path, directory)
        if was_modified:
            files_modified += 1
            total_changes += num_changes
            rel_path = file_path.relative_to(directory)
            print(f'  [OK] {rel_path} ({num_changes} changes)')

    return files_modified, total_changes

def main():
    """Main entry point."""
    # Get the VTT project root
    script_dir = Path(__file__).parent
    vtt_root = script_dir.parent.parent

    print('=' * 70)
    print('ESM Import Fixer - Adding .js extensions to relative imports')
    print('=' * 70)

    # Directories to process
    directories = [
        vtt_root / 'apps' / 'server' / 'src',
        vtt_root / 'packages' / 'shared' / 'src',
        vtt_root / 'packages' / 'database' / 'src',
    ]

    total_files = 0
    total_changes = 0

    for directory in directories:
        if not directory.exists():
            print(f'\n[WARNING] Directory not found: {directory}')
            continue

        files_modified, changes = fix_imports_in_directory(directory)
        total_files += files_modified
        total_changes += changes

    print('\n' + '=' * 70)
    print(f'Summary:')
    print(f'  Files modified: {total_files}')
    print(f'  Total changes: {total_changes}')
    print('=' * 70)

    return 0 if total_files > 0 else 1

if __name__ == '__main__':
    exit(main())
