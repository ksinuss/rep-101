#!/usr/bin/env python3
"""
Скрипт для инициализации базы данных с тестовыми аудиториями
"""

import sys
import os
from datetime import datetime

# Добавляем путь к приложению
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal, engine
from app import models, crud, schemas

def init_rooms():
    """Создает тестовые аудитории в базе данных"""
    
    # Создаем все таблицы
    models.Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    try:
        # Проверяем, есть ли уже аудитории
        existing_rooms = crud.get_rooms(db, active_only=False)
        if existing_rooms:
            print("Аудитории уже существуют в базе данных")
            return
        
        # Создаем тестовые аудитории
        test_rooms = [
            {
                "name": "Конференц-зал А",
                "description": "Большой конференц-зал с проектором и доской",
                "capacity": 20,
                "equipment": "Проектор, Доска, Микрофон, Wi-Fi"
            },
            {
                "name": "Конференц-зал Б",
                "description": "Средний конференц-зал для встреч",
                "capacity": 12,
                "equipment": "Проектор, Доска, Wi-Fi"
            },
            {
                "name": "Переговорная 1",
                "description": "Небольшая переговорная для приватных встреч",
                "capacity": 6,
                "equipment": "Доска, Wi-Fi"
            },
            {
                "name": "Переговорная 2",
                "description": "Небольшая переговорная с видеосвязью",
                "capacity": 8,
                "equipment": "Видеоконференц-связь, Доска, Wi-Fi"
            },
            {
                "name": "Аудитория для обучения",
                "description": "Просторная аудитория для проведения тренингов и семинаров",
                "capacity": 30,
                "equipment": "Проектор, Интерактивная доска, Микрофон, Wi-Fi, Кондиционер"
            },
            {
                "name": "Коворкинг-зона",
                "description": "Открытое пространство для совместной работы",
                "capacity": 15,
                "equipment": "Wi-Fi, Розетки, Столы"
            }
        ]
        
        created_rooms = []
        for room_data in test_rooms:
            room_schema = schemas.RoomCreate(**room_data)
            room = crud.create_room(db, room_schema)
            created_rooms.append(room)
            print(f"Создана аудитория: {room.name}")
        
        print(f"\nУспешно создано {len(created_rooms)} аудиторий")
        
    except Exception as e:
        print(f"Ошибка при создании аудиторий: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    print("Инициализация аудиторий...")
    init_rooms()
    print("Готово!")
