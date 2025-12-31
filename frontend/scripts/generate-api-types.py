#!/usr/bin/env python3
"""
Генератор TypeScript типов из Pydantic схем backend.

Использование:
  python scripts/generate-api-types.py

Скрипт читает app/backend/schemas/dashboard.py и генерирует
соответствующие TypeScript интерфейсы в frontend/src/types/api.generated.d.ts
"""

import ast
import re
import sys
from pathlib import Path
from typing import Dict, List, Optional, Set

# Маппинг Python типов в TypeScript
PYTHON_TO_TS: Dict[str, str] = {
    'str': 'string',
    'int': 'number',
    'float': 'number',
    'bool': 'boolean',
    'None': 'null',
    'date': 'string',  # ISO date string
    'datetime': 'string',  # ISO datetime string
}

def python_type_to_ts(py_type: str) -> str:
    """Конвертирует Python тип в TypeScript."""
    # Обработка Optional[X] -> X | null
    optional_match = re.match(r'Optional\[(.+)\]', py_type)
    if optional_match:
        inner = optional_match.group(1)
        return f'{python_type_to_ts(inner)} | null'
    
    # Обработка List[X] -> X[]
    list_match = re.match(r'List\[(.+)\]', py_type)
    if list_match:
        inner = list_match.group(1)
        return f'{python_type_to_ts(inner)}[]'
    
    # Базовые типы
    return PYTHON_TO_TS.get(py_type, py_type)


def extract_field_type(annotation: ast.AST) -> str:
    """Извлекает строковое представление типа из AST annotation."""
    if isinstance(annotation, ast.Name):
        return annotation.id
    elif isinstance(annotation, ast.Subscript):
        # Optional[X], List[X], etc.
        if isinstance(annotation.value, ast.Name):
            container = annotation.value.id
            if isinstance(annotation.slice, ast.Name):
                inner = annotation.slice.id
            elif isinstance(annotation.slice, ast.Subscript):
                inner = extract_field_type(annotation.slice)
            else:
                inner = 'unknown'
            return f'{container}[{inner}]'
    elif isinstance(annotation, ast.Constant):
        return str(annotation.value)
    return 'unknown'


def parse_pydantic_class(node: ast.ClassDef) -> Dict[str, str]:
    """Парсит Pydantic класс и возвращает словарь полей с типами."""
    fields: Dict[str, str] = {}
    
    for item in node.body:
        if isinstance(item, ast.AnnAssign) and isinstance(item.target, ast.Name):
            field_name = item.target.id
            # Пропускаем model_config и приватные поля
            if field_name.startswith('_') or field_name == 'model_config':
                continue
            
            py_type = extract_field_type(item.annotation)
            ts_type = python_type_to_ts(py_type)
            fields[field_name] = ts_type
    
    return fields


def generate_ts_interface(class_name: str, fields: Dict[str, str]) -> str:
    """Генерирует TypeScript интерфейс."""
    lines = [f'export interface {class_name} {{']
    for name, ts_type in fields.items():
        # Добавляем readonly для immutability
        lines.append(f'  readonly {name}: {ts_type}')
    lines.append('}')
    return '\n'.join(lines)


def parse_schemas_file(filepath: Path) -> List[tuple]:
    """Парсит файл schemas и возвращает список (имя, поля) для каждого класса."""
    content = filepath.read_text()
    tree = ast.parse(content)
    
    schemas: List[tuple] = []
    
    for node in ast.walk(tree):
        if isinstance(node, ast.ClassDef):
            # Пропускаем базовый класс
            if node.name.startswith('_'):
                continue
            
            # Проверяем, что это Pydantic модель (наследует от BaseModel или _BaseSchema)
            is_pydantic = any(
                (isinstance(base, ast.Name) and base.id in ('BaseModel', '_BaseSchema'))
                for base in node.bases
            )
            
            if is_pydantic:
                fields = parse_pydantic_class(node)
                if fields:  # Только если есть поля
                    schemas.append((node.name, fields))
    
    return schemas


def main():
    # Пути
    root = Path(__file__).parent.parent.parent
    schemas_path = root / 'app' / 'backend' / 'schemas' / 'dashboard.py'
    output_path = root / 'frontend' / 'src' / 'types' / 'api.generated.d.ts'
    
    if not schemas_path.exists():
        print(f'Error: schemas file not found at {schemas_path}')
        sys.exit(1)
    
    # Парсим схемы
    schemas = parse_schemas_file(schemas_path)
    
    # Генерируем TypeScript
    output_lines = [
        '/**',
        ' * AUTO-GENERATED FILE - DO NOT EDIT',
        ' * Generated from: app/backend/schemas/dashboard.py',
        f' * Generated at: {__import__("datetime").datetime.now().isoformat()}',
        ' * ',
        ' * To regenerate: python scripts/generate-api-types.py',
        ' */',
        '',
        '/* eslint-disable @typescript-eslint/no-empty-interface */',
        '',
    ]
    
    for class_name, fields in schemas:
        ts_interface = generate_ts_interface(class_name, fields)
        output_lines.append(ts_interface)
        output_lines.append('')
    
    # Записываем файл
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text('\n'.join(output_lines))
    
    print(f'Generated {len(schemas)} interfaces to {output_path}')
    for name, _ in schemas:
        print(f'  - {name}')


if __name__ == '__main__':
    main()
